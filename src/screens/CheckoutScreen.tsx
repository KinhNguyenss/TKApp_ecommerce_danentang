import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { db } from '../config/firebaseConfig';
import { writeBatch, doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutScreen() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigation = useNavigation<any>();
    const [address, setAddress] = useState('');

    const handleCheckout = async () => {
        if (!address) return Alert.alert("Lỗi", "Vui lòng nhập địa chỉ.");

        try {
            const batch = writeBatch(db);
            const orderRef = doc(collection(db, 'orders'));

            batch.set(orderRef, {
                userId: currentUser?.uid,       // BẮT BUỘC CÓ: Để sau này lọc đơn của riêng người này
                status: 'pending',       // TRẠNG THÁI: 'pending' (Đang xử lý), 'delivered' (Đã giao), 'canceled' (Đã hủy)
                items: cartItems,
                total: totalPrice,
                address: address,
                createdAt: serverTimestamp()
            });

            await batch.commit();
            clearCart();
            Alert.alert("Thành công", "Đơn hàng đã được tạo!", [{ text: "OK", onPress: () => navigation.navigate('Main') }]);
        } catch (e) { Alert.alert("Lỗi", "Không thể thanh toán."); }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.total}>Tổng tiền: {totalPrice.toLocaleString()} đ</Text>
            <TextInput style={styles.input} placeholder="Địa chỉ giao hàng" value={address} onChangeText={setAddress} />
            <TouchableOpacity style={styles.btn} onPress={handleCheckout}>
                <Text style={styles.btnText}>Thanh Toán an toàn với Stripe</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    total: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderBottomWidth: 1, marginBottom: 30, padding: 10 },
    btn: { backgroundColor: '#000', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' }
});