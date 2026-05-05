import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { RootStackParamList, AppNavigationProp } from '../../navigation/types';

type PublicShopRouteProp = RouteProp<RootStackParamList, 'PublicShop'>;

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 48) / numColumns;

export default function PublicShopScreen() {
    const route = useRoute<PublicShopRouteProp>();
    const navigation = useNavigation<AppNavigationProp>();
    const { sellerId } = route.params;

    const [shop, setShop] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                // Lấy thông tin Shop
                const shopRef = doc(db, 'shopProfiles', sellerId);
                const shopSnap = await getDoc(shopRef);
                if (shopSnap.exists()) {
                    setShop(shopSnap.data());
                }

                // Lấy danh sách sản phẩm của Shop
                const q = query(collection(db, 'products'), where('sellerId', '==', sellerId));
                const productSnap = await getDocs(q);
                const fetchedProducts = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(fetchedProducts);
            } catch (error) {
                console.error("Lỗi tải thông tin shop:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopAndProducts();
    }, [sellerId]);

    const handleChat = () => {
        navigation.navigate('Chat', {
            sellerId: sellerId,
            initialMessage: `Chào shop, tôi quan tâm đến các sản phẩm của bạn.`
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF6F00" />
            </View>
        );
    }

    if (!shop) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Không tìm thấy thông tin cửa hàng.</Text>
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.shopInfoCard}>
                <View style={styles.avatarContainer}>
                    {shop.avatarUrl ? (
                        <Image source={{ uri: shop.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarLetter}>
                                {(shop.shopName || 'S').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.shopDetails}>
                    <Text style={styles.shopName}>{shop.shopName || 'Shop Chưa Đặt Tên'}</Text>
                    <Text style={styles.shopJoined}>
                        Tham gia: {shop.createdAt ? new Date(shop.createdAt.toDate()).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{products.length}</Text>
                            <Text style={styles.statLabel}>Sản phẩm</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                            <Text style={styles.chatText}>💬 Nhắn tin</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {shop.description ? (
                <View style={styles.descCard}>
                    <Text style={styles.descTitle}>Giới thiệu</Text>
                    <Text style={styles.descText}>{shop.description}</Text>
                </View>
            ) : null}

            <Text style={styles.sectionTitle}>Tất cả sản phẩm ({products.length})</Text>
        </View>
    );

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            <Image
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                style={styles.productImg}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{item.price?.toLocaleString('vi-VN')} đ</Text>
                <View style={styles.productMeta}>
                    <Text style={styles.productCategory}>{item.category || 'Khác'}</Text>
                    <Text style={styles.productSold}>Đã bán: {item.soldCount || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={item => item.id}
                renderItem={renderProduct}
                numColumns={2}
                columnWrapperStyle={styles.row}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Shop chưa có sản phẩm nào.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    headerContainer: { padding: 16 },
    shopInfoCard: {
        flexDirection: 'row', backgroundColor: '#fff',
        padding: 16, borderRadius: 12, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
    },
    avatarContainer: { marginRight: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#FF6F00' },
    avatarPlaceholder: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6F00',
        justifyContent: 'center', alignItems: 'center'
    },
    avatarLetter: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
    shopDetails: { flex: 1, justifyContent: 'center' },
    shopName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    shopJoined: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    statBox: { alignItems: 'center', paddingRight: 12 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#FF6F00' },
    statLabel: { fontSize: 11, color: '#6B7280' },
    statDivider: { width: 1, height: 24, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
    chatBtn: {
        backgroundColor: '#E3F2FD', paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, marginLeft: 8
    },
    chatText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },

    // Description
    descCard: {
        backgroundColor: '#fff', padding: 16, borderRadius: 12,
        marginBottom: 20, elevation: 1
    },
    descTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    descText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12, marginLeft: 4 },

    // Products
    row: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
    productCard: {
        width: cardWidth, backgroundColor: '#fff',
        borderRadius: 12, overflow: 'hidden', elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
    },
    productImg: { width: '100%', height: cardWidth, resizeMode: 'cover' },
    productInfo: { padding: 12 },
    productName: { fontSize: 14, fontWeight: '600', color: '#374151', height: 40, marginBottom: 6 },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6 },
    productMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productCategory: { fontSize: 11, color: '#FF6F00', backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    productSold: { fontSize: 11, color: '#6B7280' },

    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#6B7280', fontSize: 15 }
});
