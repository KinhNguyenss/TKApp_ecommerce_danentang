import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { db } from '../config/firebaseConfig';
import { writeBatch, doc, collection, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useStripe } from '@stripe/stripe-react-native';

const PAYMENT_SERVER_URL = process.env.EXPO_PUBLIC_PAYMENT_SERVER_URL || 'http://10.0.2.2:3000';

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

    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [fullName, setFullName] = useState(currentUser?.displayName || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tự động điền thông tin từ Profile
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!currentUser) return;
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.hoTen) setFullName(data.hoTen);
                    if (data.phone) setPhone(data.phone);
                    if (data.address) setAddress(data.address);
                }
            } catch (error) {
                console.error("Lỗi tự động điền thông tin:", error);
            }
        };
        fetchUserInfo();
    }, [currentUser]);

    const saveOrderToFirestore = async (status: 'pending' | 'paid') => {
        const batch = writeBatch(db);
        const orderRef = doc(collection(db, 'orders'));
        const orderId = orderRef.id;

        batch.set(orderRef, {
            userId: currentUser?.uid,
            customerName: fullName,
            customerPhone: phone,
            customerEmail: currentUser?.email || '',
            address,
            paymentMethod,
            paymentStatus: status,
            status: status === 'paid' ? 'ready_to_ship' : 'pending',
            items: displayItems,
            sellerIds: Array.from(new Set(displayItems.map((item: any) => item.sellerId || 'default_seller'))),
            total: displayTotal,
            createdAt: serverTimestamp(),
        });

        // Nếu đã thanh toán thẻ, cộng tiền vào Ví của các Shop
        if (status === 'paid') {
            // Tính tiền cho từng shop (đơn hàng có thể có nhiều sản phẩm từ nhiều shop)
            const sellerEarnings: { [key: string]: number } = {};
            displayItems.forEach((item: any) => {
                const sellerId = item.sellerId || 'default_seller';
                const itemTotal = item.price * (item.cartQuantity || 1);
                sellerEarnings[sellerId] = (sellerEarnings[sellerId] || 0) + itemTotal;
            });

            // Cập nhật pendingBalance cho từng shop
            Object.keys(sellerEarnings).forEach(sellerId => {
                const shopRef = doc(db, 'shopProfiles', sellerId);
                batch.set(shopRef, {
                    pendingBalance: increment(sellerEarnings[sellerId])
                }, { merge: true });
            });
        }

        await batch.commit();

        if (!buyNowProduct) clearCart();
    };

    const handleCheckout = async () => {
        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ.');
        }

        setIsSubmitting(true);
        try {
            if (paymentMethod === 'cod') {
                // === COD: Lưu đơn trực tiếp ===
                await saveOrderToFirestore('pending');
                Alert.alert('Đặt hàng thành công! 🎉', 'Đơn hàng của bạn đã được đặt. Shop sẽ liên hệ sớm!', [
                    { text: 'OK', onPress: () => navigation.navigate('Home' as never) }
                ]);
            } else {
                // === CARD: Stripe Payment Sheet ===
                // 1. Yêu cầu backend tạo PaymentIntent
                const response = await fetch(`${PAYMENT_SERVER_URL}/create-payment-intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: displayTotal, currency: 'vnd' }),
                });

                if (!response.ok) {
                    throw new Error('Không thể kết nối đến server thanh toán.');
                }

                const { clientSecret } = await response.json();

                // 2. Khởi tạo Payment Sheet
                const { error: initError } = await initPaymentSheet({
                    paymentIntentClientSecret: clientSecret,
                    merchantDisplayName: 'TKApp',
                    defaultBillingDetails: { name: fullName },
                });

                if (initError) throw new Error(initError.message);

                // 3. Hiển thị giao diện thanh toán Stripe
                const { error: payError } = await presentPaymentSheet();

                if (payError) {
                    if (payError.code === 'Canceled') {
                        Alert.alert('Hủy', 'Bạn đã hủy thanh toán.');
                    } else {
                        throw new Error(payError.message);
                    }
                } else {
                    // 4. Thanh toán thành công → lưu đơn hàng
                    await saveOrderToFirestore('paid');
                    Alert.alert('Thanh toán thành công! 🎉', 'Đơn hàng đã được xác nhận và sẽ được cẩn bị gần nhất!', [
                        { text: 'OK', onPress: () => navigation.navigate('Home' as never) }
                    ]);
                }
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('Lỗi thanh toán', e.message || 'Không thể thanh toán. Vui lòng thử lại.');
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