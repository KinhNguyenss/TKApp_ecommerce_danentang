// src/screens/CartScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { useNavigation } from '@react-navigation/native'; // <-- IMPORT HOOK NÀY

export default function CartScreen() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
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
                    <View style={[styles.cartItem, item.quantity === 0 && { opacity: 0.5 }]}>
                        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }} style={styles.itemImage} />
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.sellerName}>Shop: {item.sellerName || 'Cửa hàng mặc định'}</Text>
                            <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
                            
                            {item.quantity === 0 ? (
                                <Text style={{ color: '#D32F2F', fontWeight: 'bold', marginTop: 10 }}>⚠️ Hết hàng</Text>
                            ) : (
                                <View style={styles.quantityControl}>
                                    <TouchableOpacity 
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(item.id, item.cartQuantity - 1)}
                                    >
                                        <Text style={styles.qtyBtnText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>{item.cartQuantity}</Text>
                                    <TouchableOpacity 
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(item.id, item.cartQuantity + 1)}
                                    >
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                            <Text style={styles.removeText}>✕</Text>
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
    cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2, alignItems: 'center' },
    itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15 },
    itemInfo: { flex: 1, justifyContent: 'center' },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    sellerName: { fontSize: 13, color: '#1976D2', fontStyle: 'italic', marginBottom: 5 },
    itemPrice: { color: '#D32F2F', fontWeight: 'bold', fontSize: 15 },
    quantityControl: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    qtyBtn: { backgroundColor: '#eee', width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
    qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    qtyText: { marginHorizontal: 15, fontSize: 16, fontWeight: 'bold' },
    removeBtn: { backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, justifyContent: 'center', marginLeft: 10 },
    removeText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
    footer: { borderTopWidth: 1, borderColor: '#ddd', paddingTop: 20, marginTop: 10 },
    totalText: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    checkoutBtn: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
    checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});