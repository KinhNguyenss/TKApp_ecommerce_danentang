// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { useNavigation } from '@react-navigation/native'; // 1. Import thêm useNavigation


export default function HomeScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    // 2. Khởi tạo biến navigation
    const navigation = useNavigation<any>();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Product[];
                setProducts(items);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = (product: Product) => {
        const result = addToCart(product);
        if (!result.success) {
            Alert.alert("Thông báo", result.msg);
        } else {
            Alert.alert("Thành công", `Đã thêm ${product.name} vào giỏ!`);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FF6F00" />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Nghệ thuật thủ công</Text>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                numColumns={2}
                renderItem={({ item }) => (
                    // 3. Thay View thành TouchableOpacity và thêm sự kiện onPress
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    >
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
                        <Text style={styles.stock}>Kho: {item.quantity}</Text>

                        {/* Nhóm nút tương tác */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                            <TouchableOpacity style={[styles.buyBtn, { flex: 1, marginRight: 4 }]} onPress={() => handleAddToCart(item)}>
                                <Text style={styles.buyText}>+ Giỏ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.instantBtn, { flex: 1.2, marginLeft: 4 }]} 
                                onPress={() => navigation.navigate('Checkout', { buyNowProduct: item })}
                            >
                                <Text style={styles.instantText}>Mua ngay</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    header: { fontSize: 22, fontWeight: 'bold', marginVertical: 15, color: '#FF6F00' },
    card: { flex: 1, backgroundColor: '#fff', margin: 5, padding: 10, borderRadius: 10, elevation: 2 },
    image: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 },
    name: { fontSize: 16, fontWeight: 'bold' },
    price: { color: '#D32F2F', fontWeight: 'bold', marginVertical: 5 },
    stock: { fontSize: 12, color: '#666' },
    buyBtn: { backgroundColor: '#FFF3E0', padding: 8, borderRadius: 5, marginTop: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FFB74D' },
    buyText: { color: '#E65100', fontWeight: 'bold', fontSize: 13 },
    instantBtn: { backgroundColor: '#FF6F00', padding: 8, borderRadius: 5, marginTop: 10, alignItems: 'center' },
    instantText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});