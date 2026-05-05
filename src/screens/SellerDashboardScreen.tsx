// src/screens/SellerDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, getDocs, doc, updateDoc, query, writeBatch, increment } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function SellerDashboardScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            // Lấy tất cả đơn hàng, sắp xếp mới nhất lên đầu
            const q = query(collection(db, 'orders'));
            const querySnapshot = await getDocs(q);
            const fetchedOrders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sắp xếp bằng JS (tránh lỗi require index của Firebase)
            fetchedOrders.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            setOrders(fetchedOrders);
        } catch (error) {
            console.error("Lỗi lấy đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Hàm chuyển đổi trạng thái đơn hàng (Mô phỏng Giai đoạn 3 & 4)
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
                // Trừ số lượng tồn kho của các sản phẩm trong đơn hàng bằng writeBatch
                const batch = writeBatch(db);
                batch.update(orderRef, { status: nextStatus });

                if (order.items && order.items.length > 0) {
                    for (const prod of order.items) {
                        if (prod.id) {
                            const productRef = doc(db, 'products', prod.id);
                            const deductAmount = prod.cartQuantity || prod.quantity || 1;
                            batch.update(productRef, {
                                quantity: increment(-deductAmount)
                            });
                        }
                    }
                }
                await batch.commit();
            } else {
                await updateDoc(orderRef, { status: nextStatus });
            }

            Alert.alert('Thành công', statusMessage);
            fetchOrders(); // Tải lại danh sách
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'ready_to_ship': return 'Đang chuẩn bị hàng';
            case 'shipping': return 'Đang giao (Shipping)';
            case 'delivered': return 'Đã giao (Delivered)';
            case 'canceled': return 'Đã hủy';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FFA000'; // Vàng
            case 'ready_to_ship': return '#1976D2'; // Xanh dương
            case 'shipping': return '#8E24AA'; // Tím
            case 'delivered': return '#388E3C'; // Xanh lá
            case 'canceled': return '#D32F2F'; // Đỏ
            default: return '#000';
        }
    };

    const getNextStatusColor = (currentStatus: string) => {
        switch (currentStatus) {
            case 'pending': return getStatusColor('ready_to_ship');
            case 'ready_to_ship': return getStatusColor('shipping');
            case 'shipping': return getStatusColor('delivered');
            default: return getStatusColor(currentStatus);
        }
    };

    const getNextActionText = (status: string) => {
        switch (status) {
            case 'pending': return 'Chuyển sang: Đang chuẩn bị hàng ❯';
            case 'ready_to_ship': return 'Chuyển sang: Đang giao hàng ❯';
            case 'shipping': return 'Chuyển sang: Đã giao thành công ❯';
            default: return 'Cập nhật trạng thái ❯';
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} size="large" color="#2E7D32" />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quản lý Đơn hàng</Text>

            <FlatList
                data={orders}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.headerRow}>
                            <Text style={styles.orderId}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                                <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
                            </View>
                        </View>

                        <Text style={styles.info}>Khách hàng: {item.customerEmail || 'Khách'}</Text>
                        <Text style={styles.info}>Tổng tiền: {item.total?.toLocaleString('vi-VN')} đ</Text>
                        <Text style={styles.info}>Ngày đặt: {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleString('vi-VN') : ''}</Text>

                        <View style={styles.productsContainer}>
                            <Text style={styles.productsTitle}>Sản phẩm:</Text>
                            {item.items && item.items.map((prod: any, index: number) => (
                                <Text key={index} style={styles.productItem}>
                                    - {prod.name} (SL: {prod.cartQuantity || prod.quantity || 1})
                                </Text>
                            ))}
                        </View>

                        {/* Nút cập nhật trạng thái chỉ hiện khi đơn chưa hoàn tất */}
                        {item.status !== 'delivered' && item.status !== 'canceled' && (
                            <TouchableOpacity
                                style={[styles.btnAction, { backgroundColor: getNextStatusColor(item.status) }]}
                                onPress={() => updateOrderStatus(item, item.status)}
                            >
                                <Text style={styles.btnText}>{getNextActionText(item.status)}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#f0f4f8' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    info: { fontSize: 14, color: '#555', marginBottom: 5 },
    productsContainer: { marginTop: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
    productsTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    productItem: { fontSize: 14, color: '#555', marginLeft: 5, marginBottom: 2 },
    btnAction: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    btnText: { color: '#fff', fontWeight: 'bold' }
});