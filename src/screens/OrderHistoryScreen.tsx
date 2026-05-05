import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';

export default function OrderHistoryScreen() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
    const navigation = useNavigation<AppNavigationProp>();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser) return;

            try {
                // 1. Chỉ truy vấn đơn hàng của Riêng user này
                const q = query(
                    collection(db, 'orders'),
                    where('userId', '==', currentUser.uid)
                );

                const querySnapshot = await getDocs(q);
                const fetchedOrders = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 2. Sắp xếp đơn mới nhất lên đầu (Dùng code JS để tránh lỗi index của Firebase)
                fetchedOrders.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
                setOrders(fetchedOrders);

            } catch (error) {
                console.error("Lỗi lấy đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

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
        if (status === 'delivered') return 'Đã giao hàng';
        if (status === 'canceled') return 'Đã hủy';
        return 'Đang xử lý'; // Mặc định là pending
    };

    const getStatusColor = (status: string) => {
        if (status === 'delivered') return '#388E3C'; // Xanh lá
        if (status === 'canceled') return '#D32F2F';  // Đỏ
        return '#FFA000'; // Vàng cam cho Đang xử lý
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

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
                                <TouchableOpacity 
                                    style={[styles.chatBtn, { flex: 1, marginTop: 0, marginRight: 5 }]} 
                                    onPress={() => {
                                        const sellerId = item.items && item.items.length > 0 ? item.items[0].sellerId : null;
                                        if (!sellerId) return Alert.alert('Lỗi', 'Không tìm thấy thông tin Shop của đơn hàng này.');
                                        const msg = `Tôi cần hỗ trợ đơn hàng mã #${item.id.substring(0, 6).toUpperCase()}`;
                                        // Mở màn hình Chat
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
});