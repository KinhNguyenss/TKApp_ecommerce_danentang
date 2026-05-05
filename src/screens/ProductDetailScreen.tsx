import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList, AppNavigationProp } from '../navigation/types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
    const route = useRoute<ProductDetailRouteProp>();
    const navigation = useNavigation<AppNavigationProp>();
    const { product } = route.params; // Lấy dữ liệu sản phẩm từ màn hình trước truyền sang

    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const handleAddToCart = () => {
        const result = addToCart(product);
        if (result.success) {
            Alert.alert('Thành công', 'Đã thêm vào giỏ hàng', [
                { text: 'Tiếp tục mua sắm' },
                { text: 'Đến Giỏ hàng', onPress: () => (navigation.navigate as any)('Main', { screen: 'Cart' }) }
            ]);
        } else {
            Alert.alert('Lỗi', result.msg || 'Không thể thêm vào giỏ hàng');
        }
    };

    const handleChat = () => {
        if (!product.sellerId) {
            return Alert.alert('Thông báo', 'Sản phẩm này không có thông tin Shop.');
        }
        const msg = `Tôi đang quan tâm sản phẩm: ${product.name} - Giá: ${product.price.toLocaleString('vi-VN')} đ`;
        navigation.navigate('Chat', { sellerId: product.sellerId, initialMessage: msg });
    };

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/300' }} style={styles.image} />

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{product.name}</Text>
                    <TouchableOpacity onPress={() => toggleWishlist(product)}>
                        <Text style={{ fontSize: 28 }}>{isInWishlist(product.id) ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.price}>{product.price.toLocaleString('vi-VN')} đ</Text>
                <Text style={styles.descTitle}>Mô tả sản phẩm:</Text>
                <Text style={styles.description}>{product.description || 'Chưa có mô tả cho sản phẩm này.'}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                        <Text style={styles.chatBtnText}>💬 Liên hệ Shop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
                        <Text style={styles.btnText}>Thêm vào giỏ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 300, resizeMode: 'cover' },
    content: { padding: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', flex: 1, color: '#333' },
    price: { fontSize: 22, color: '#D32F2F', fontWeight: 'bold', marginTop: 10 },
    descTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    description: { fontSize: 15, color: '#555', lineHeight: 22 },
    footer: { padding: 20, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    chatBtn: { flex: 1, backgroundColor: '#E3F2FD', padding: 15, borderRadius: 10, alignItems: 'center', marginRight: 10 },
    chatBtnText: { color: '#1976D2', fontSize: 16, fontWeight: 'bold' },
    addCartBtn: { flex: 1.5, backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});