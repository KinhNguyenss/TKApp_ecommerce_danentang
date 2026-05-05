// src/screens/CartScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { useNavigation } from '@react-navigation/native'; // <-- IMPORT HOOK NÀY

export default function CartScreen() {
    const { cartItems, removeFromCart, totalPrice } = useCart();
    const navigation = useNavigation<any>(); // <-- KHỞI TẠO HOOK

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>🛒 Giỏ hàng của bạn đang trống</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Giỏ Hàng</Text>

            <FlatList
                data={cartItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} đ  x {item.cartQuantity}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                            <Text style={styles.removeText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <Text style={styles.totalText}>Tổng: {totalPrice.toLocaleString('vi-VN')} đ</Text>

                {/* SỬA SỰ KIỆN Ở ĐÂY ĐỂ CHUYỂN TRANG */}
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
                    <Text style={styles.checkoutText}>Tiến hành Thanh Toán</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: '#777' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FF6F00', marginBottom: 20 },
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    itemPrice: { color: '#D32F2F', marginTop: 5, fontWeight: 'bold' },
    removeBtn: { backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, justifyContent: 'center' },
    removeText: { color: '#D32F2F', fontWeight: 'bold' },
    footer: { borderTopWidth: 1, borderColor: '#ddd', paddingTop: 20, marginTop: 10 },
    totalText: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    checkoutBtn: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
    checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});