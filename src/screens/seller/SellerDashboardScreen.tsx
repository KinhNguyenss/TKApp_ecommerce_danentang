// src/screens/SellerDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, doc, updateDoc, query, where, onSnapshot, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

export default function SellerDashboardScreen() {
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // ✅ LẮNG NGHE REAL-TIME: Chỉ lấy đơn hàng có chứa sản phẩm của Shop này
        const q = query(
            collection(db, 'orders'),
            where('sellerIds', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedOrders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sắp xếp đơn mới nhất lên đầu
            fetchedOrders.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });

            setOrders(fetchedOrders);
            setLoading(false);
        }, (error) => {
            console.error("Lỗi lắng nghe đơn hàng:", error);
            setLoading(false);
        });

        return () => unsubscribe(); // Hủy lắng nghe khi thoát màn hình
    }, [currentUser]);

    const updateOrderStatus = async (order: any, currentStatus: string) => {
        let nextStatus = '';
        let statusMessage = '';

        if (currentStatus === 'pending') {
            nextStatus = 'ready_to_ship';
            statusMessage = 'Đã chuyển sang: Chuẩn bị hàng';
        } else if (currentStatus === 'ready_to_ship') {
            nextStatus = 'shipping';
            statusMessage = 'Đã chuyển sang: Đang giao hàng';
        } else if (currentStatus === 'shipping') {
            nextStatus = 'delivered';
            statusMessage = 'Đã chuyển sang: Đã giao thành công';
        } else {
            return Alert.alert('Thông báo', 'Đơn hàng này đã hoàn tất hoặc bị hủy.');
        }

        try {
            const orderRef = doc(db, 'orders', order.id);

            if (nextStatus === 'delivered') {
                const batch = writeBatch(db);
                batch.update(orderRef, { status: nextStatus });

                // Cập nhật số lượng đã bán và tồn kho
                if (order.items && order.items.length > 0) {
                    for (const prod of order.items) {
                        if (prod.id && prod.sellerId === currentUser?.uid) {
                            const productRef = doc(db, 'products', prod.id);
                            const amount = prod.cartQuantity || prod.quantity || 1;
                            batch.update(productRef, {
                                quantity: increment(-amount),
                                soldCount: increment(amount) // Lưu thêm số lượng đã bán
                            });
                        }
                    }
                }
                await batch.commit();
            } else {
                await updateDoc(orderRef, { status: nextStatus });
            }
            Alert.alert('Thành công', statusMessage);
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '⏳ Chờ xử lý';
            case 'ready_to_ship': return '📦 Đang chuẩn bị';
            case 'shipping': return '🚚 Đang giao';
            case 'delivered': return '✅ Hoàn tất';
            case 'canceled': return '❌ Đã hủy';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FFA000';
            case 'ready_to_ship': return '#1976D2';
            case 'shipping': return '#8E24AA';
            case 'delivered': return '#388E3C';
            case 'canceled': return '#D32F2F';
            default: return '#000';
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2E7D32" />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đơn Hàng Của Shop 📦</Text>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Chưa có đơn hàng nào cho sản phẩm của bạn.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.headerRow}>
                                <Text style={styles.orderId}>Mã: #{item.id.substring(0, 8).toUpperCase()}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
                                </View>
                            </View>

                            <View style={styles.customerBox}>
                                <Text style={styles.info}>👤 Khách: <Text style={{ fontWeight: '600' }}>{item.customerName || 'N/A'}</Text></Text>
                                <Text style={styles.info}>📞 SĐT: {item.customerPhone || 'N/A'}</Text>
                                <Text style={styles.info}>📍 Đ/C: {item.address || 'N/A'}</Text>
                            </View>

                            <View style={styles.productsContainer}>
                                {item.items && item.items.filter((p: any) => p.sellerId === currentUser?.uid).map((prod: any, index: number) => (
                                    <View key={index} style={styles.productRow}>
                                        <Text style={styles.productName}>• {prod.name}</Text>
                                        <Text style={styles.productQty}>x{prod.cartQuantity || prod.quantity || 1}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.footerRow}>
                                <Text style={styles.totalLabel}>Tiền hàng của shop:</Text>
                                <Text style={styles.totalPrice}>
                                    {item.items
                                        ?.filter((p: any) => p.sellerId === currentUser?.uid)
                                        .reduce((sum: number, p: any) => sum + (p.price * (p.cartQuantity || p.quantity || 1)), 0)
                                        .toLocaleString('vi-VN')} đ
                                </Text>
                            </View>

                            {/* Nút hành động */}
                            {item.status !== 'delivered' && item.status !== 'canceled' && (
                                <TouchableOpacity
                                    style={[styles.btnAction, { backgroundColor: '#2E7D32' }]}
                                    onPress={() => updateOrderStatus(item, item.status)}
                                >
                                    <Text style={styles.btnText}>
                                        {item.status === 'pending' ? 'Bắt đầu chuẩn bị hàng ❯' :
                                            item.status === 'ready_to_ship' ? 'Giao cho đơn vị vận chuyển ❯' :
                                                'Xác nhận đã giao thành công ❯'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.chatBtn}
                                onPress={() => (navigation.navigate as any)('Chat', { customerId: item.userId })}
                            >
                                <Text style={styles.chatBtnText}>💬 Nhắn tin cho khách</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderId: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    customerBox: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginBottom: 12 },
    info: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
    productsContainer: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginBottom: 12 },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    productName: { fontSize: 14, color: '#374151', flex: 1 },
    productQty: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    totalLabel: { fontSize: 14, color: '#6B7280' },
    totalPrice: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
    btnAction: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    chatBtn: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    chatBtnText: { color: '#2E7D32', fontSize: 14, fontWeight: 'bold' }
});