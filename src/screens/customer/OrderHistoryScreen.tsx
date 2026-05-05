import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, onSnapshot, doc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../navigation/types';

export default function OrderHistoryScreen() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
    const navigation = useNavigation<AppNavigationProp>();

    useEffect(() => {
        if (!currentUser) return;

        // Lắng nghe real-time: tự động cập nhật khi seller đổi trạng thái đơn
        const q = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedOrders = querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            fetchedOrders.sort((a: any, b: any) => {
                const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });
            setOrders(fetchedOrders);
            setLoading(false);
        }, (error) => {
            console.error('Lỗi lắng nghe đơn hàng:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Lấy danh sách đơn đã được đánh giá
    useEffect(() => {
        const fetchReviewedOrders = async () => {
            if (!currentUser) return;
            try {
                const q = query(
                    collection(db, 'reviews'),
                    where('userId', '==', currentUser.uid)
                );
                const snap = await getDocs(q);
                const ids = new Set<string>();
                snap.docs.forEach(d => {
                    const orderId = d.data().orderId;
                    if (orderId) ids.add(orderId);
                });
                setReviewedOrderIds(ids);
            } catch (e) {
                console.error('Lỗi kiểm tra đánh giá:', e);
            }
        };
        fetchReviewedOrders();
    }, [currentUser]);

    // Hàm phụ trợ dịch trạng thái sang tiếng Việt
    const getStatusText = (status: string) => {
        if (status === 'delivered') return 'Shipper đã giao';
        if (status === 'cod_pending_reconcile') return 'Chờ đối soát COD';
        if (status === 'completed') return 'Đã hoàn tất';
        if (status === 'canceled') return 'Đã hủy';
        if (status === 'ready_to_ship') return 'Đang chuẩn bị';
        if (status === 'shipping') return 'Đang giao hàng';
        return 'Đang xử lý';
    };

    const getStatusColor = (status: string) => {
        if (status === 'completed') return '#388E3C';
        if (status === 'delivered') return '#1976D2';
        if (status === 'cod_pending_reconcile') return '#F57C00';
        if (status === 'canceled') return '#D32F2F';
        if (status === 'shipping') return '#8E24AA';
        return '#FFA000';
    };

    // Khi khách bấm "Xác nhận đã nhận hàng"
    const handleConfirmReceived = (order: any) => {
        const isCOD = order.paymentMethod === 'cod';
        Alert.alert(
            '\ud83d\udce6 Xác nhận nhận hàng',
            isCOD
                ? 'Bạn đã nhận được hàng và trả tiền cho Shipper rồi?\n\nHe ́ thóng sẽ chuyển sang chờ Admin đối soát trước khi giải ngân cho Seller.'
                : 'Xác nhận bạn đã nhận được hàng?\n\nTiền sẽ được giải ngân ngay cho Seller.',
            [
                { text: 'Chưa', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: () => confirmReceived(order, isCOD)
                }
            ]
        );
    };

    const confirmReceived = async (order: any, isCOD: boolean) => {
        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, 'orders', order.id);

            if (isCOD) {
                // COD: Chỉ đổi status, chờ Admin đối soát
                batch.update(orderRef, { status: 'cod_pending_reconcile' });
            } else {
                // Card/Stripe: Giải ngân ngay cho Seller
                batch.update(orderRef, { status: 'completed' });

                // Tính tiền cho từng Seller
                const sellerEarnings: { [key: string]: number } = {};
                if (order.items && order.items.length > 0) {
                    order.items.forEach((item: any) => {
                        const sellerId = item.sellerId || 'default_seller';
                        const itemTotal = (item.price || 0) * (item.cartQuantity || item.quantity || 1);
                        sellerEarnings[sellerId] = (sellerEarnings[sellerId] || 0) + itemTotal;
                    });
                }

                // Trừ frozenBalance (pendingBalance), cộng availableBalance
                Object.keys(sellerEarnings).forEach(sellerId => {
                    const shopRef = doc(db, 'shopProfiles', sellerId);
                    batch.set(shopRef, {
                        pendingBalance: increment(-sellerEarnings[sellerId]),
                        availableBalance: increment(sellerEarnings[sellerId]),
                    }, { merge: true });
                });
            }

            await batch.commit();
            Alert.alert(
                'Thành công! \ud83c\udf89',
                isCOD
                    ? 'Đơn hàng đang chờ Admin đối soát COD.'
                    : 'Tiền đã được giải ngân cho Shop!'
            );
            // Reload orders
            setOrders(prev => prev.map(o =>
                o.id === order.id
                    ? { ...o, status: isCOD ? 'cod_pending_reconcile' : 'completed' }
                    : o
            ));
        } catch (error) {
            console.error('Lỗi xác nhận:', error);
            Alert.alert('Lỗi', 'Không thể xác nhận. Vui lòng thử lại.');
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} size="large" color="#FF6F00" />;

    return (
        <View style={styles.container}>
            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.headerRow}>
                                <Text style={styles.orderId}>Mã: #{item.id.substring(0, 6).toUpperCase()}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                                </View>
                            </View>

                            <Text style={styles.date}>
                                Ngày đặt: {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('vi-VN') : 'Mới đây'}
                            </Text>

                            <View style={styles.productsContainer}>
                                {item.items && item.items.map((prod: any, index: number) => (
                                    <View key={index} style={styles.productItem}>
                                        <Text style={styles.productName} numberOfLines={1}>• {prod.name}</Text>
                                        <View style={styles.productSubInfo}>
                                            <Text style={styles.productQuantity}>Số lượng: {prod.cartQuantity || prod.quantity || 1}</Text>
                                            <Text style={styles.productSeller}>Shop: {prod.sellerName || 'Cửa hàng mặc định'}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.footerRow}>
                                <Text style={styles.totalLabel}>Tổng tiền:</Text>
                                <Text style={styles.totalPrice}>{item.total?.toLocaleString('vi-VN')} đ</Text>
                            </View>

                            <View style={{ marginTop: 12 }}>
                                {/* Nút xác nhận nhận hàng - chỉ khi Shipper đã báo giao */}
                                {item.status === 'delivered' && (
                                    <TouchableOpacity
                                        style={styles.confirmBtn}
                                        onPress={() => handleConfirmReceived(item)}
                                    >
                                        <Text style={styles.confirmBtnText}>
                                            {item.paymentMethod === 'cod'
                                                ? '💵 Đã nhận hàng & Trả tiền Shipper'
                                                : '✅ Xác nhận đã nhận hàng'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Badge chờ đối soát */}
                                {item.status === 'cod_pending_reconcile' && (
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText}>
                                            ⏳ Đang chờ Admin đối soát COD...
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <TouchableOpacity
                                    style={[styles.chatBtn, { flex: 1, marginTop: 0, marginRight: 5 }]}
                                    onPress={() => {
                                        const sellerId = item.items && item.items.length > 0 ? item.items[0].sellerId : null;
                                        if (!sellerId) return Alert.alert('Lỗi', 'Không tìm thấy thông tin Shop của đơn hàng này.');
                                        const msg = `Tôi cần hỗ trợ đơn hàng mã #${item.id.substring(0, 6).toUpperCase()}`;
                                        (navigation.navigate as any)('Chat', { sellerId: sellerId, initialMessage: msg });
                                    }}
                                >
                                    <Text style={styles.chatBtnText}>💬 Liên hệ Shop</Text>
                                </TouchableOpacity>

                                {(item.status === 'delivered' || item.status === 'completed') && (
                                    <TouchableOpacity
                                        style={[
                                            styles.reviewBtn, { flex: 1, marginLeft: 5 },
                                            reviewedOrderIds.has(item.id) && styles.reviewBtnDone
                                        ]}
                                        onPress={() => {
                                            if (item.items && item.items.length > 0) {
                                                (navigation.navigate as any)('Review', {
                                                    product: item.items[0],
                                                    orderId: item.id,
                                                });
                                            } else {
                                                Alert.alert('Lỗi', 'Đơn hàng không có sản phẩm để đánh giá.');
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.reviewBtnText,
                                            reviewedOrderIds.has(item.id) && styles.reviewBtnTextDone
                                        ]}>
                                            {reviewedOrderIds.has(item.id) ? '✏️ Sửa đánh giá' : '⭐ Đánh giá'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#777' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    date: { fontSize: 14, color: '#666', marginBottom: 5 },
    itemCount: { fontSize: 14, color: '#666', marginBottom: 10 },
    productsContainer: { marginTop: 5, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 10 },
    productItem: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    productName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 3 },
    productSubInfo: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 10 },
    productQuantity: { fontSize: 13, color: '#555' },
    productSeller: { fontSize: 13, color: '#1976D2', fontStyle: 'italic' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
    totalLabel: { fontSize: 16, color: '#333' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F' },
    chatBtn: { backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    chatBtnText: { color: '#1976D2', fontSize: 14, fontWeight: 'bold' },
    reviewBtn: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, alignItems: 'center' },
    reviewBtnText: { color: '#F57C00', fontSize: 14, fontWeight: 'bold' },
    reviewBtnDone: { backgroundColor: '#E8F5E9' },
    reviewBtnTextDone: { color: '#2E7D32' },
    confirmBtn: {
        backgroundColor: '#1565C0', padding: 14, borderRadius: 8,
        alignItems: 'center', marginBottom: 8
    },
    confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    pendingBadge: {
        backgroundColor: '#FFF8E1', padding: 10, borderRadius: 8,
        alignItems: 'center', borderWidth: 1, borderColor: '#FFE082', marginBottom: 8
    },
    pendingBadgeText: { color: '#F57F17', fontSize: 13, fontWeight: '600' },
});