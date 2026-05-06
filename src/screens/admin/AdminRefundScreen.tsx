import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import {
    collection, query, where, onSnapshot,
    writeBatch, doc, increment
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const PAYMENT_SERVER_URL = process.env.EXPO_PUBLIC_PAYMENT_SERVER_URL || 'http://10.0.2.2:3000';

export default function AdminRefundScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // Lắng nghe các đơn hàng đang chờ duyệt hoàn tiền / trả hàng
        const q = query(
            collection(db, 'orders'),
            where('status', 'in', ['refund_pending', 'return_pending'])
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a: any, b: any) => {
                const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });
            setOrders(data);
            setLoading(false);
            setRefreshing(false);
        }, (err) => {
            console.error('AdminRefund error:', err);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const processStripeRefund = async (paymentIntentId: string) => {
        const response = await fetch(`${PAYMENT_SERVER_URL}/refund-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Lỗi từ Stripe Server');
        }
        return data.refund;
    };

    const handleApprove = (order: any) => {
        Alert.alert(
            'Xác nhận duyệt',
            `Bạn có chắc chắn duyệt yêu cầu này của đơn #${order.id.substring(0, 8).toUpperCase()}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Duyệt', style: 'destructive', onPress: () => processApproval(order) }
            ]
        );
    };

    const processApproval = async (order: any) => {
        setProcessingId(order.id);
        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, 'orders', order.id);

            if (order.status === 'refund_pending') {
                // Thanh toán Online (Stripe)
                if (!order.paymentIntentId) {
                    throw new Error('Đơn hàng không có paymentIntentId để hoàn tiền qua Stripe.');
                }
                
                // Gọi API Stripe Refund
                await processStripeRefund(order.paymentIntentId);

                // Cập nhật trạng thái
                batch.update(orderRef, { status: 'refunded' });

                // Trừ tiền Pending Balance của tất cả Seller trong đơn hàng này
                const sellerEarnings: { [key: string]: number } = {};
                if (order.items && order.items.length > 0) {
                    order.items.forEach((item: any) => {
                        const sellerId = item.sellerId || 'default_seller';
                        const itemTotal = (item.price || 0) * (item.cartQuantity || item.quantity || 1);
                        sellerEarnings[sellerId] = (sellerEarnings[sellerId] || 0) + itemTotal;
                    });
                }
                Object.keys(sellerEarnings).forEach(sellerId => {
                    const shopRef = doc(db, 'shopProfiles', sellerId);
                    batch.set(shopRef, {
                        pendingBalance: increment(-sellerEarnings[sellerId]),
                    }, { merge: true });
                });

                await batch.commit();
                Alert.alert('Thành công', 'Đã hoàn tiền qua Stripe và trừ ví đóng băng của Seller.');
            } else {
                // Thanh toán COD (Trả hàng)
                batch.update(orderRef, { status: 'returned' });
                await batch.commit();
                Alert.alert('Thành công', 'Đã cập nhật trạng thái trả hàng. Seller sẽ nhận được thông báo.');
            }
        } catch (error: any) {
            console.error('Lỗi duyệt hoàn tiền:', error);
            Alert.alert('Lỗi', error.message || 'Không thể xử lý yêu cầu này.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = (order: any) => {
        Alert.alert(
            'Từ chối yêu cầu',
            `Bạn muốn từ chối và đưa đơn hàng về trạng thái đã giao?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const orderRef = doc(db, 'orders', order.id);
                            await writeBatch(db).update(orderRef, { status: 'delivered' }).commit();
                            Alert.alert('Đã từ chối', 'Đơn hàng đã được trả về trạng thái đã giao.');
                        } catch (e) {
                            Alert.alert('Lỗi', 'Không thể từ chối.');
                        }
                    }
                }
            ]
        );
    };

    const getStatusText = (status: string) => {
        if (status === 'refund_pending') return 'Stripe: Hoàn tiền';
        if (status === 'return_pending') return 'COD: Trả hàng';
        return status;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#D32F2F" />
                <Text style={styles.loadingText}>Đang tải danh sách...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản Lý Hoàn Trả</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>Không có yêu cầu nào</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.orderId}>Mã ĐH: #{item.id.substring(0, 8).toUpperCase()}</Text>
                                <View style={[styles.badge, item.status === 'refund_pending' ? styles.badgeStripe : styles.badgeCod]}>
                                    <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Khách hàng:</Text>
                                <Text style={styles.value}>{item.customerName || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>SĐT:</Text>
                                <Text style={styles.value}>{item.customerPhone || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Tổng tiền:</Text>
                                <Text style={styles.valueRed}>{item.total?.toLocaleString('vi-VN')} đ</Text>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.rejectBtn}
                                    onPress={() => handleReject(item)}
                                    disabled={processingId === item.id}
                                >
                                    <Text style={styles.rejectBtnText}>Từ chối</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.approveBtn, processingId === item.id && styles.disabledBtn]}
                                    onPress={() => handleApprove(item)}
                                    disabled={processingId === item.id}
                                >
                                    {processingId === item.id ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.approveBtnText}>Duyệt Ngay</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    loadingText: { color: '#666' },
    header: { backgroundColor: '#B71C1C', padding: 20, paddingTop: 50, alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 50 },
    emptyTitle: { fontSize: 16, color: '#666', marginTop: 10 },
    
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontWeight: 'bold', fontSize: 15, color: '#333' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeStripe: { backgroundColor: '#E3F2FD' },
    badgeCod: { backgroundColor: '#FFF3E0' },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#1565C0' },
    
    infoRow: { flexDirection: 'row', marginBottom: 6 },
    label: { width: 90, color: '#666', fontSize: 14 },
    value: { flex: 1, color: '#333', fontSize: 14, fontWeight: '500' },
    valueRed: { flex: 1, color: '#D32F2F', fontSize: 14, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
    rejectBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
    rejectBtnText: { color: '#424242', fontWeight: 'bold' },
    approveBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#B71C1C', alignItems: 'center' },
    approveBtnText: { color: '#fff', fontWeight: 'bold' },
    disabledBtn: { backgroundColor: '#E57373' }
});
