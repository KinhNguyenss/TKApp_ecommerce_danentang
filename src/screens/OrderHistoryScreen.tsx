import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';

export default function OrderHistoryScreen() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                        >
                            <View style={styles.headerRow}>
                                <Text style={styles.orderId}>Mã: #{item.id.substring(0, 6).toUpperCase()}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                                </View>
                            </View>

                            <Text style={styles.date}>
                                Ngày đặt: {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('vi-VN') : 'Mới đây'}
                            </Text>
                            <Text style={styles.itemCount}>{item.items?.length || 0} sản phẩm</Text>

                            <View style={styles.footerRow}>
                                <Text style={styles.totalLabel}>Tổng tiền:</Text>
                                <Text style={styles.totalPrice}>{item.total?.toLocaleString('vi-VN')} đ</Text>
                            </View>
                        </TouchableOpacity>
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
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
    totalLabel: { fontSize: 16, color: '#333' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F' }
});