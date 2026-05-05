import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { db } from '../config/firebaseConfig';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutScreen() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    
    const buyNowProduct = route.params?.buyNowProduct;

    // Dữ liệu hiển thị dựa trên luồng: Mua ngay hay từ Giỏ hàng
    const displayItems = buyNowProduct 
        ? [{ ...buyNowProduct, cartQuantity: 1 }] 
        : cartItems;
    
    const displayTotal = buyNowProduct 
        ? buyNowProduct.price 
        : totalPrice;

    const [fullName, setFullName] = useState(currentUser?.displayName || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckout = async () => {
        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            return Alert.alert("Lỗi", "Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ.");
        }

        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            const orderRef = doc(collection(db, 'orders'));

            batch.set(orderRef, {
                userId: currentUser?.uid,
                customerName: fullName,
                customerPhone: phone,
                customerEmail: currentUser?.email || '',
                address: address,
                paymentMethod: paymentMethod,
                status: 'pending',
                items: displayItems,
                total: displayTotal,
                createdAt: serverTimestamp()
            });

            await batch.commit();
            
            // Chỉ xóa giỏ hàng nếu mua từ Giỏ hàng
            if (!buyNowProduct) {
                clearCart();
            }
            Alert.alert("Thành công", "Đơn hàng của bạn đã được đặt thành công!", [
                { text: "OK", onPress: () => navigation.navigate('Home') }
            ]);
        } catch (e) { 
            console.error(e);
            Alert.alert("Lỗi", "Không thể thanh toán. Vui lòng thử lại sau."); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.productItem}>
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/60' }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.sellerName}>Shop: {item.sellerName || 'Cửa hàng mặc định'}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
                    <Text style={styles.productQty}>x {item.cartQuantity}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* 1. Danh sách sản phẩm */}
            <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
            <View style={styles.productListContainer}>
                {displayItems.map((item: any) => (
                    <View key={item.id}>
                        {renderItem({ item })}
                    </View>
                ))}
            </View>

            {/* 2. Thông tin giao hàng */}
            <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
            <View style={styles.formContainer}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Họ và Tên" 
                    value={fullName} 
                    onChangeText={setFullName} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Số điện thoại" 
                    value={phone} 
                    onChangeText={setPhone} 
                    keyboardType="phone-pad"
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Địa chỉ giao hàng chi tiết" 
                    value={address} 
                    onChangeText={setAddress} 
                    multiline
                />
            </View>

            {/* 3. Phương thức thanh toán */}
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.paymentContainer}>
                <TouchableOpacity 
                    style={[styles.paymentBtn, paymentMethod === 'cod' && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod('cod')}
                >
                    <Text style={[styles.paymentText, paymentMethod === 'cod' && styles.paymentTextActive]}>💵 Thanh toán khi nhận hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.paymentBtn, paymentMethod === 'card' && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod('card')}
                >
                    <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextActive]}>💳 Thanh toán qua Thẻ</Text>
                </TouchableOpacity>
            </View>

            {/* 4. Tổng kết */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tổng tiền hàng:</Text>
                    <Text style={styles.summaryValue}>{displayTotal.toLocaleString('vi-VN')} đ</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
                    <Text style={styles.summaryValue}>0 đ</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                    <Text style={styles.totalValue}>{displayTotal.toLocaleString('vi-VN')} đ</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCheckout} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Đặt Hàng</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
    
    // Product List
    productListContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 10, elevation: 1 },
    productItem: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
    productInfo: { flex: 1, justifyContent: 'center' },
    productName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    sellerName: { fontSize: 12, color: '#1976D2', fontStyle: 'italic', marginVertical: 3 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { color: '#D32F2F', fontWeight: 'bold' },
    productQty: { color: '#666' },

    // Form
    formContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 1 },
    input: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10, fontSize: 16, marginBottom: 15 },
    
    // Payment
    paymentContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 1 },
    paymentBtn: { padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 10, alignItems: 'center' },
    paymentBtnActive: { borderColor: '#FF6F00', backgroundColor: '#FFF8E1' },
    paymentText: { fontSize: 16, color: '#555', fontWeight: '500' },
    paymentTextActive: { color: '#FF6F00', fontWeight: 'bold' },

    // Summary
    summaryContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginTop: 20, elevation: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 15, color: '#555' },
    summaryValue: { fontSize: 15, color: '#333', fontWeight: '500' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15, marginTop: 5 },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F' },

    // Submit Button
    submitBtn: { backgroundColor: '#FF6F00', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 20, elevation: 2 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});