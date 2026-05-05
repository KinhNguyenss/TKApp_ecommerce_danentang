// src/screens/AdminReconcileScreen.tsx
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

interface Order {
    id: string;
    customerName: string;
    customerPhone: string;
    address: string;
    total: number;
    items: any[];
    sellerIds: string[];
    status: string;
    codReconciled?: boolean;
    createdAt?: any;
    paymentMethod: string;
}

export default function AdminReconcileScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // Lắng nghe real-time: đơn COD đã giao thành công, chưa đối soát
        const q = query(
            collection(db, 'orders'),
            where('paymentMethod', '==', 'cod'),
            where('status', '==', 'cod_pending_reconcile')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
            data.sort((a, b) => {
                const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });
            setOrders(data);
            setLoading(false);
            setRefreshing(false);
        }, (err) => {
            console.error('AdminReconcile error:', err);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const handleReconcile = (order: Order) => {
        Alert.alert(
            '✅ Xác nhận đối soát',
            `Xác nhận đã nhận ${order.total.toLocaleString('vi-VN')} đ tiền COD từ Shipper cho đơn #${order.id.substring(0, 8).toUpperCase()}?\n\nHệ thống sẽ tự động cộng tiền vào ví của các Seller liên quan.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    style: 'default',
                    onPress: () => processReconcile(order)
                }
            ]
        );
    };

    const processReconcile = async (order: Order) => {
        setProcessingId(order.id);
        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, 'orders', order.id);

            // Tính tiền cho từng Seller
            const sellerEarnings: { [key: string]: number } = {};
            if (order.items && order.items.length > 0) {
                order.items.forEach((item: any) => {
                    const sellerId = item.sellerId || 'default_seller';
                    const itemTotal = (item.price || 0) * (item.cartQuantity || item.quantity || 1);
                    sellerEarnings[sellerId] = (sellerEarnings[sellerId] || 0) + itemTotal;
                });
            }

            // Cộng availableBalance cho từng Seller
            Object.keys(sellerEarnings).forEach(sellerId => {
                const shopRef = doc(db, 'shopProfiles', sellerId);
                batch.set(shopRef, {
                    availableBalance: increment(sellerEarnings[sellerId])
                }, { merge: true });
            });

            // Đánh dấu đơn đã đối soát
            batch.update(orderRef, {
                status: 'completed',
                codReconciled: true,
            });

            await batch.commit();
            Alert.alert('Thành công 🎉', 'Đã đối soát và cộng tiền vào ví Seller thành công!');
        } catch (error) {
            console.error('Lỗi đối soát COD:', error);
            Alert.alert('Lỗi', 'Không thể xử lý đối soát. Vui lòng thử lại.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (ts: any) => {
        if (!ts) return 'Mới đây';
        return new Date(ts.toDate()).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={styles.loadingText}>Đang tải danh sách đối soát...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Stats */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{orders.length}</Text>
                    <Text style={styles.statLabel}>Chờ đối soát</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('vi-VN')}đ
                    </Text>
                    <Text style={styles.statLabel}>Tổng cần đối soát</Text>
                </View>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🎉</Text>
                    <Text style={styles.emptyTitle}>Không có đơn nào chờ đối soát</Text>
                    <Text style={styles.emptySubtitle}>Tất cả đơn COD đã được xử lý</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => setRefreshing(true)}
                            colors={['#1565C0']}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.orderId}>
                                        #{item.id.substring(0, 8).toUpperCase()}
                                    </Text>
                                    <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                                </View>
                                <View style={styles.codBadge}>
                                    <Text style={styles.codBadgeText}>💵 COD</Text>
                                </View>
                            </View>

                            {/* Customer Info */}
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>
                                    👤 <Text style={styles.infoValue}>{item.customerName || 'N/A'}</Text>
                                </Text>
                                <Text style={styles.infoText}>
                                    📞 <Text style={styles.infoValue}>{item.customerPhone || 'N/A'}</Text>
                                </Text>
                                <Text style={styles.infoText}>
                                    📍 {item.address || 'N/A'}
                                </Text>
                            </View>

                            {/* Products */}
                            <View style={styles.productsBox}>
                                {item.items && item.items.map((prod: any, idx: number) => (
                                    <View key={idx} style={styles.productRow}>
                                        <Text style={styles.productName} numberOfLines={1}>
                                            • {prod.name}
                                        </Text>
                                        <Text style={styles.productQty}>
                                            x{prod.cartQuantity || prod.quantity || 1}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Total */}
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Tiền cần nhận từ Shipper:</Text>
                                <Text style={styles.totalAmount}>
                                    {item.total?.toLocaleString('vi-VN')} đ
                                </Text>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    processingId === item.id && styles.actionBtnDisabled
                                ]}
                                onPress={() => handleReconcile(item)}
                                disabled={processingId === item.id}
                            >
                                {processingId === item.id ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.actionBtnText}>
                                        ✅ Đã nhận tiền từ Shipper
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF2F7' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#666', fontSize: 14 },

    // Stats bar
    statsBar: {
        flexDirection: 'row', backgroundColor: '#1565C0',
        paddingVertical: 16, paddingHorizontal: 24,
        alignItems: 'center', justifyContent: 'space-around'
    },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 12, color: '#BBDEFB', marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: '#1E88E5' },

    // Empty state
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyIcon: { fontSize: 60 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF' },

    // Card
    card: {
        backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, padding: 16,
        elevation: 3, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
        borderLeftWidth: 4, borderLeftColor: '#1565C0',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 12
    },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
    orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    codBadge: {
        backgroundColor: '#E8F5E9', paddingHorizontal: 10,
        paddingVertical: 5, borderRadius: 20
    },
    codBadgeText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },

    // Info
    infoBox: {
        backgroundColor: '#F8FAFF', padding: 10,
        borderRadius: 8, marginBottom: 10, gap: 4
    },
    infoText: { fontSize: 13, color: '#6B7280' },
    infoValue: { fontWeight: '600', color: '#374151' },

    // Products
    productsBox: {
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
        paddingTop: 10, marginBottom: 10
    },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    productName: { fontSize: 13, color: '#374151', flex: 1 },
    productQty: { fontSize: 13, fontWeight: 'bold', color: '#1565C0' },

    // Total
    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF8E1', padding: 10, borderRadius: 8, marginBottom: 12
    },
    totalLabel: { fontSize: 13, color: '#6B7280' },
    totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#F57F17' },

    // Button
    actionBtn: {
        backgroundColor: '#1565C0', padding: 15,
        borderRadius: 10, alignItems: 'center',
    },
    actionBtnDisabled: { backgroundColor: '#90A4AE' },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
