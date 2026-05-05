import React, { useEffect, useState } from 'react';
import {
    View, Text, Image, StyleSheet, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, FlatList
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList, AppNavigationProp } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

interface Review {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    imageUrl?: string;
    createdAt: any;
}

interface ShopProfile {
    shopName: string;
    avatarUrl: string;
    joinedAt?: any;
}

export default function ProductDetailScreen() {
    const route = useRoute<ProductDetailRouteProp>();
    const navigation = useNavigation<AppNavigationProp>();
    const { product } = route.params;

    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
    const [soldCount, setSoldCount] = useState(0);
    const [loadingReviews, setLoadingReviews] = useState(true);

    // Lấy thông tin Shop Profile
    useEffect(() => {
        if (!product.sellerId) return;
        const fetchShop = async () => {
            try {
                const shopRef = doc(db, 'shopProfiles', product.sellerId!);
                const snap = await getDoc(shopRef);
                if (snap.exists()) {
                    setShopProfile(snap.data() as ShopProfile);
                }
            } catch (e) {
                console.error('Lỗi lấy Shop Profile:', e);
            }
        };
        fetchShop();
    }, [product.sellerId]);

    // Lấy đánh giá real-time + tính số đã bán
    useEffect(() => {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
            // Sắp xếp mới nhất lên đầu
            items.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
            setReviews(items);
            setLoadingReviews(false);
        });

        // Tính số đã bán từ delivered orders
        const ordersQ = query(collection(db, 'orders'), where('status', '==', 'delivered'));
        const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
            let count = 0;
            snapshot.docs.forEach(doc => {
                const items = doc.data().items || [];
                items.forEach((item: any) => {
                    if (item.id === product.id) count += (item.cartQuantity || 1);
                });
            });
            setSoldCount(count);
        });

        return () => { unsubscribe(); unsubOrders(); };
    }, [product.id]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const handleAddToCart = () => {
        const result = addToCart(product);
        if (result.success) {
            Alert.alert('Thành công', 'Đã thêm vào giỏ hàng', [
                { text: 'Tiếp tục mua sắm' },
                { text: 'Đến Giỏ hàng', onPress: () => (navigation.navigate as any)('Cart') }
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

    const renderStars = (rating: number, size = 16) => {
        return (
            <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map(s => (
                    <Text key={s} style={{ fontSize: size, color: s <= rating ? '#FFD700' : '#E0E0E0' }}>★</Text>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Ảnh sản phẩm */}
            <Image
                source={{ uri: product.imageUrl || 'https://via.placeholder.com/400' }}
                style={styles.image}
            />

            <View style={styles.content}>
                {/* Tên sản phẩm + Tim */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{product.name}</Text>
                        {product.quantity === 0 && (
                            <Text style={styles.outOfStockText}>[ HẾT HÀNG ]</Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => toggleWishlist(product)}>
                        <Text style={{ fontSize: 28 }}>{isInWishlist(product.id) ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Giá + Đã bán */}
                <View style={styles.priceRow}>
                    <Text style={styles.price}>{product.price.toLocaleString('vi-VN')} đ</Text>
                    <Text style={styles.soldCount}>Đã bán: {(product.soldCount || 0) + soldCount}</Text>
                </View>

                {/* Rating tổng */}
                {avgRating && (
                    <View style={styles.ratingRow}>
                        {renderStars(Math.round(Number(avgRating)))}
                        <Text style={styles.ratingText}>{avgRating} ({reviews.length} đánh giá)</Text>
                    </View>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
                        {product.tags.map((tag, i) => (
                            <View key={i} style={styles.tagChip}>
                                <Text style={styles.tagText}># {tag}</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Thông tin Shop */}
                {product.sellerId && (
                    <TouchableOpacity
                        style={styles.shopCard}
                        onPress={() => navigation.navigate('PublicShop', { sellerId: product.sellerId! })}
                        activeOpacity={0.8}
                    >
                        <View style={styles.shopAvatarWrapper}>
                            {shopProfile?.avatarUrl
                                ? <Image source={{ uri: shopProfile.avatarUrl }} style={styles.shopAvatar} />
                                : <View style={styles.shopAvatarPlaceholder}>
                                    <Text style={styles.shopAvatarLetter}>
                                        {(shopProfile?.shopName || product.sellerName || 'S').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            }
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shopName}>
                                🏪 {shopProfile?.shopName || product.sellerName || 'Cửa hàng'}
                            </Text>
                            <Text style={styles.shopSub}>Bấm để xem thông tin Shop</Text>
                        </View>
                        <Text style={styles.shopArrow}>❯</Text>
                    </TouchableOpacity>
                )}

                {/* Mô tả */}
                <Text style={styles.descTitle}>Mô tả sản phẩm</Text>
                <Text style={styles.description}>{product.description || 'Chưa có mô tả cho sản phẩm này.'}</Text>

                {/* === ĐÁNH GIÁ === */}
                <View style={styles.reviewHeader}>
                    <Text style={styles.reviewTitle}>Đánh giá từ khách hàng</Text>
                    {avgRating && (
                        <View style={styles.avgBadge}>
                            <Text style={styles.avgBadgeText}>⭐ {avgRating}</Text>
                        </View>
                    )}
                </View>

                {loadingReviews ? (
                    <ActivityIndicator color="#FF6F00" style={{ marginVertical: 20 }} />
                ) : reviews.length === 0 ? (
                    <View style={styles.noReview}>
                        <Text style={styles.noReviewText}>Chưa có đánh giá nào. Hãy là người đầu tiên! 🌟</Text>
                    </View>
                ) : (
                    reviews.map(review => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewTop}>
                                <View style={styles.reviewAvatar}>
                                    {review.userAvatar
                                        ? <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatarImg} />
                                        : <Text style={styles.reviewAvatarLetter}>
                                            {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                                        </Text>
                                    }
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.reviewerName}>{review.userName}</Text>
                                    <View style={styles.reviewStarsRow}>
                                        {renderStars(review.rating, 14)}
                                        <Text style={styles.reviewDate}>
                                            {review.createdAt?.toDate
                                                ? new Date(review.createdAt.toDate()).toLocaleDateString('vi-VN')
                                                : ''}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                            {review.imageUrl && (
                                <Image source={{ uri: review.imageUrl }} style={styles.reviewImage} />
                            )}
                        </View>
                    ))
                )}
            </View>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                        <Text style={styles.chatBtnText}>💬 Liên hệ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.addCartBtn, product.quantity === 0 && { backgroundColor: '#eee', borderColor: '#ddd' }]}
                        onPress={handleAddToCart}
                        disabled={product.quantity === 0}
                    >
                        <Text style={[styles.addCartText, product.quantity === 0 && { color: '#999' }]}>+ Giỏ hàng</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.buyNowBtn, product.quantity === 0 && { backgroundColor: '#ccc' }]}
                    onPress={() => (navigation.navigate as any)('Checkout', { buyNowProduct: product })}
                    disabled={product.quantity === 0}
                >
                    <Text style={styles.buyNowText}>
                        {product.quantity === 0 ? 'HÀNG TẠM HẾT' : 'MUA NGAY'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 320, resizeMode: 'cover' },

    content: { padding: 16 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E', flex: 1, lineHeight: 30 },
    outOfStockText: { color: '#D32F2F', fontWeight: 'bold', marginTop: 4, fontSize: 14 },

    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    price: { fontSize: 24, color: '#D32F2F', fontWeight: 'bold' },
    soldCount: { fontSize: 13, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    ratingText: { fontSize: 13, color: '#6B7280', marginLeft: 6 },

    tagsRow: { flexDirection: 'row', marginBottom: 16 },
    tagChip: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, borderWidth: 1, borderColor: '#FFB74D' },
    tagText: { color: '#E65100', fontSize: 12, fontWeight: '600' },

    shopCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F0FFF4', padding: 12, borderRadius: 12,
        marginBottom: 16, borderWidth: 1, borderColor: '#A7F3D0'
    },
    shopAvatarWrapper: { marginRight: 12 },
    shopAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#2E7D32' },
    shopAvatarPlaceholder: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32',
        justifyContent: 'center', alignItems: 'center'
    },
    shopAvatarLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    shopName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A2E' },
    shopSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    shopArrow: { fontSize: 22 },

    descTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 8, marginTop: 4 },
    description: { fontSize: 15, color: '#4B5563', lineHeight: 24, marginBottom: 20 },

    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    reviewTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A2E' },
    avgBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    avgBadgeText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 14 },

    noReview: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
    noReviewText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },

    reviewCard: {
        backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14,
        marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB'
    },
    reviewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    reviewAvatar: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#FF6F00',
        justifyContent: 'center', alignItems: 'center', marginRight: 10
    },
    reviewAvatarImg: { width: 38, height: 38, borderRadius: 19 },
    reviewAvatarLetter: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A2E' },
    reviewStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    reviewDate: { fontSize: 11, color: '#9CA3AF' },
    reviewComment: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
    reviewImage: { width: '100%', height: 160, borderRadius: 8, resizeMode: 'cover' },

    footer: { padding: 16, borderTopWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#fff' },
    btnRow: { flexDirection: 'row', marginBottom: 10 },
    chatBtn: { flex: 1, backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, alignItems: 'center', marginRight: 10 },
    chatBtnText: { color: '#1976D2', fontSize: 15, fontWeight: 'bold' },
    addCartBtn: { flex: 1.2, backgroundColor: '#FFF3E0', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FFB74D' },
    addCartText: { color: '#E65100', fontSize: 15, fontWeight: 'bold' },
    buyNowBtn: { backgroundColor: '#FF6F00', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
    buyNowText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
});