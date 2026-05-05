// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    Alert, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { useNavigation } from '@react-navigation/native';

const ALL_CATEGORY = 'Tất cả';

export default function HomeScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
    const { addToCart } = useCart();
    const navigation = useNavigation<any>();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "products"), (querySnapshot) => {
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];
            setProducts(items);
            setLoading(false);
        }, (error) => {
            console.error("Lỗi lấy dữ liệu real-time:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Lấy danh sách category duy nhất từ sản phẩm
    const categories = useMemo(() => {
        const cats = products
            .map(p => p.category)
            .filter((c): c is string => !!c && c.trim() !== '');
        return [ALL_CATEGORY, ...Array.from(new Set(cats))];
    }, [products]);

    // Lọc sản phẩm theo tìm kiếm và danh mục
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = !searchText ||
                p.name.toLowerCase().includes(searchText.toLowerCase()) ||
                (p.tags || []).some(t => t.toLowerCase().includes(searchText.toLowerCase()));
            const matchCategory = selectedCategory === ALL_CATEGORY || p.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [products, searchText, selectedCategory]);

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
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm sản phẩm, thẻ..."
                    placeholderTextColor="#9CA3AF"
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Category Chips */}
            {categories.length > 1 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryRow}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 8 }}
                >
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Product count label */}
            <Text style={styles.resultCount}>
                {filteredProducts.length} sản phẩm
                {selectedCategory !== ALL_CATEGORY ? ` trong "${selectedCategory}"` : ''}
            </Text>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>😔 Không tìm thấy sản phẩm phù hợp</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, item.quantity === 0 && { opacity: 0.6 }]}
                        onPress={() => navigation.navigate('ProductDetail', { product: item })}
                        activeOpacity={0.8}
                    >
                        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} style={styles.image} />
                        
                        {item.quantity === 0 && (
                            <View style={styles.outOfStockOverlay}>
                                <Text style={styles.outOfStockLabel}>Hết hàng</Text>
                            </View>
                        )}

                        <View style={styles.cardContent}>
                            {item.sellerName ? (
                                <Text style={styles.sellerName} numberOfLines={1}>🏪 {item.sellerName}</Text>
                            ) : null}
                            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                            {item.category ? (
                                <Text style={styles.categoryBadge}>{item.category}</Text>
                            ) : null}
                            <Text style={styles.price}>{item.price.toLocaleString('vi-VN')} đ</Text>

                            <View style={styles.stockRow}>
                                <Text style={[styles.stock, item.quantity === 0 && styles.stockEmpty]}>
                                    {item.quantity === 0 ? 'Hết hàng' : `Kho: ${item.quantity}`}
                                </Text>
                            </View>

                            <View style={styles.btnRow}>
                                <TouchableOpacity
                                    style={[styles.cartBtn, item.quantity === 0 && styles.btnDisabled]}
                                    onPress={() => handleAddToCart(item)}
                                    disabled={item.quantity === 0}
                                >
                                    <Text style={[styles.cartBtnText, item.quantity === 0 && { color: '#999' }]}>+Giỏ</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.buyBtn, item.quantity === 0 && styles.btnDisabled]}
                                    onPress={() => navigation.navigate('Checkout', { buyNowProduct: item })}
                                    disabled={item.quantity === 0}
                                >
                                    <Text style={styles.buyBtnText}>
                                        {item.quantity === 0 ? 'Hết' : 'Mua'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', margin: 12, marginBottom: 0,
        borderRadius: 14, paddingHorizontal: 14, height: 48,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        borderWidth: 1, borderColor: '#E5E7EB'
    },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E' },
    clearBtn: { fontSize: 16, color: '#9CA3AF', padding: 4 },

    categoryRow: { flexShrink: 0 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB'
    },
    chipActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    chipTextActive: { color: '#fff' },

    resultCount: { fontSize: 13, color: '#6B7280', paddingHorizontal: 15, paddingBottom: 4 },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 16, color: '#9CA3AF' },

    card: {
        flex: 1, backgroundColor: '#fff', margin: 6, borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
    },
    image: { width: '100%', height: 130, resizeMode: 'cover' },

    outOfStockOverlay: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: '#D32F2F', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3
    },
    outOfStockLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    cardContent: { padding: 10 },
    sellerName: { fontSize: 10, color: '#1976D2', marginBottom: 3, fontWeight: '500' },
    productName: { fontSize: 13, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4, lineHeight: 18 },
    categoryBadge: { fontSize: 10, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
    price: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginBottom: 4 },
    stockRow: { marginBottom: 8 },
    stock: { fontSize: 10, color: '#9CA3AF' },
    stockEmpty: { color: '#D32F2F', fontWeight: 'bold' },

    btnRow: { flexDirection: 'row', gap: 6 },
    cartBtn: {
        flex: 1, backgroundColor: '#FFF3E0', borderRadius: 8,
        paddingVertical: 7, alignItems: 'center',
        borderWidth: 1, borderColor: '#FFB74D'
    },
    cartBtnText: { color: '#E65100', fontWeight: 'bold', fontSize: 12 },
    buyBtn: {
        flex: 1.2, backgroundColor: '#FF6F00', borderRadius: 8,
        paddingVertical: 7, alignItems: 'center'
    },
    buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    btnDisabled: { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' },
});