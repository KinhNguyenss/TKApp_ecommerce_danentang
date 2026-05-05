import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image,
    ActivityIndicator, TouchableWithoutFeedback, Keyboard, ScrollView
} from 'react-native';
import { collection, addDoc, updateDoc, query, where, getDocs, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

export default function ReviewScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { currentUser } = useAuth();

    const { product, orderId } = route.params;

    const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loadingCheck, setLoadingCheck] = useState(true);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewImageUri, setReviewImageUri] = useState<string | null>(null);
    const [reviewImageUrl, setReviewImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Kiểm tra đánh giá đã tồn tại cho orderId + productId này chưa
    useEffect(() => {
        const checkExistingReview = async () => {
            if (!currentUser || !orderId) {
                setLoadingCheck(false);
                return;
            }
            try {
                const q = query(
                    collection(db, 'reviews'),
                    where('orderId', '==', orderId),
                    where('productId', '==', product.id),
                    where('userId', '==', currentUser.uid)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const existing = snap.docs[0];
                    const data = existing.data();
                    setExistingReviewId(existing.id);
                    setIsEditMode(true);
                    // Điền sẵn dữ liệu cũ vào form
                    setRating(data.rating || 5);
                    setComment(data.comment || '');
                    setReviewImageUrl(data.imageUrl || null);
                    if (data.imageUrl) setReviewImageUri(data.imageUrl);
                }
            } catch (e) {
                console.error('Lỗi kiểm tra đánh giá:', e);
            } finally {
                setLoadingCheck(false);
            }
        };
        checkExistingReview();
    }, [currentUser, orderId, product.id]);

    const pickReviewImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, quality: 0.8,
        });
        if (result.canceled) return;

        const uri = result.assets[0].uri;
        setReviewImageUri(uri);
        setIsUploading(true);

        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const strToSign = `timestamp=${timestamp}${API_SECRET}`;
            const signature = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, strToSign);

            const data = new FormData();
            data.append('file', { uri, type: 'image/jpeg', name: 'review.jpg' } as any);
            data.append('api_key', API_KEY!);
            data.append('timestamp', timestamp);
            data.append('signature', signature);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST', body: data,
            });
            const json = await response.json();
            if (json.secure_url) {
                setReviewImageUrl(json.secure_url);
            } else {
                Alert.alert('Lỗi', 'Không thể upload ảnh.');
                setReviewImageUri(null);
            }
        } catch (e) {
            Alert.alert('Lỗi', 'Có sự cố khi upload ảnh.');
            setReviewImageUri(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!comment.trim()) {
            return Alert.alert('Thiếu thông tin', 'Vui lòng nhập vài lời nhận xét nhé.');
        }
        if (isUploading) {
            return Alert.alert('Vui lòng chờ', 'Ảnh đang được upload, hãy thử lại sau giây lát.');
        }

        setIsSubmitting(true);
        try {
            const reviewData = {
                productId: product.id,
                orderId: orderId || null,
                userId: currentUser?.uid || null,
                userName: (currentUser as any)?.hoTen || currentUser?.displayName || currentUser?.email || 'Khách hàng',
                userAvatar: currentUser?.photoURL || null,
                rating,
                comment: comment.trim(),
                imageUrl: reviewImageUrl || null,
                updatedAt: serverTimestamp(),
            };

            if (isEditMode && existingReviewId) {
                // CẬP NHẬT đánh giá cũ
                const reviewRef = doc(db, 'reviews', existingReviewId);
                await updateDoc(reviewRef, reviewData);
                Alert.alert('Đã cập nhật!', 'Đánh giá của bạn đã được sửa thành công. 📝', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // TẠO MỚI đánh giá
                await addDoc(collection(db, 'reviews'), {
                    ...reviewData,
                    createdAt: serverTimestamp(),
                });
                Alert.alert('Thành công!', 'Cảm ơn bạn đã đánh giá sản phẩm! 💖', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể gửi đánh giá lúc này.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const starLabels = ['', 'Tệ', 'Không ổn', 'Bình thường', 'Tốt', 'Xuất sắc!'];

    if (loadingCheck) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FF6F00" />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Badge chế độ Sửa / Mới */}
                <View style={[styles.modeBanner, isEditMode ? styles.modeBannerEdit : styles.modeBannerNew]}>
                    <Text style={styles.modeBannerText}>
                        {isEditMode ? '✏️ Chỉnh sửa đánh giá của bạn' : '⭐ Viết đánh giá mới'}
                    </Text>
                </View>

                <Text style={styles.title}>
                    {isEditMode ? 'Sửa Đánh Giá' : 'Đánh Giá Sản Phẩm'}
                </Text>

                {orderId && (
                    <Text style={styles.orderIdText}>Đơn hàng #{orderId.substring(0, 8).toUpperCase()}</Text>
                )}

                {/* Thông tin sản phẩm */}
                <View style={styles.productInfo}>
                    <Image
                        source={{ uri: product.imageUrl || 'https://via.placeholder.com/60' }}
                        style={styles.productImage}
                    />
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                </View>

                {/* Chọn số sao */}
                <Text style={styles.sectionLabel}>Bạn cảm thấy sản phẩm thế nào?</Text>
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                            <Text style={[styles.star, star <= rating ? styles.starActive : styles.starInactive]}>★</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.ratingLabel}>{starLabels[rating]}</Text>

                {/* Nhập bình luận */}
                <Text style={styles.sectionLabel}>Nhận xét của bạn</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={5}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                />

                {/* Ảnh đánh giá */}
                <Text style={styles.sectionLabel}>Ảnh thực tế (tùy chọn)</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickReviewImage} disabled={isUploading}>
                    {isUploading ? (
                        <View style={{ alignItems: 'center' }}>
                            <ActivityIndicator color="#FF6F00" />
                            <Text style={styles.imagePickerText}>Đang upload ảnh...</Text>
                        </View>
                    ) : reviewImageUri ? (
                        <View style={{ width: '100%', height: 140 }}>
                            <Image source={{ uri: reviewImageUri }} style={styles.previewImage} />
                            <View style={styles.changePhotoOverlay}>
                                <Text style={styles.changePhotoText}>📷 Đổi ảnh</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.imagePickerIcon}>📷</Text>
                            <Text style={styles.imagePickerText}>Bấm để thêm ảnh thực tế</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Nút gửi */}
                <TouchableOpacity
                    style={[styles.submitBtn, (isSubmitting || isUploading) && { opacity: 0.7 },
                        isEditMode && styles.submitBtnEdit]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || isUploading}
                >
                    {isSubmitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitBtnText}>
                            {isEditMode ? '💾 Lưu thay đổi' : '📤 Gửi Đánh Giá'}
                        </Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    modeBanner: { padding: 10, alignItems: 'center' },
    modeBannerNew: { backgroundColor: '#FFF8F0' },
    modeBannerEdit: { backgroundColor: '#E8F5E9' },
    modeBannerText: { fontWeight: 'bold', fontSize: 13 },

    title: { fontSize: 22, fontWeight: 'bold', color: '#FF6F00', textAlign: 'center', marginVertical: 10 },
    orderIdText: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginBottom: 12 },

    productInfo: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF8F0', padding: 14, borderRadius: 12,
        marginHorizontal: 16, marginBottom: 20,
        borderWidth: 1, borderColor: '#FFE0B2'
    },
    productImage: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
    productName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },

    sectionLabel: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginHorizontal: 16, marginBottom: 10, marginTop: 4 },

    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
    star: { fontSize: 44, marginHorizontal: 6 },
    starActive: { color: '#FFD700' },
    starInactive: { color: '#E5E7EB' },
    ratingLabel: { textAlign: 'center', fontSize: 16, color: '#FF6F00', fontWeight: 'bold', marginBottom: 20 },

    textInput: {
        backgroundColor: '#F9FAFB', padding: 14, marginHorizontal: 16,
        borderRadius: 12, fontSize: 15, height: 130, marginBottom: 20,
        borderWidth: 1, borderColor: '#E5E7EB', color: '#1A1A2E'
    },

    imagePicker: {
        marginHorizontal: 16, minHeight: 140, backgroundColor: '#F9FAFB',
        borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
        borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
        marginBottom: 24, overflow: 'hidden'
    },
    imagePickerIcon: { fontSize: 34, marginBottom: 8 },
    imagePickerText: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
    previewImage: { width: '100%', height: 140, resizeMode: 'cover' },
    changePhotoOverlay: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderTopLeftRadius: 8
    },
    changePhotoText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    submitBtn: {
        backgroundColor: '#FF6F00', marginHorizontal: 16, padding: 16,
        borderRadius: 12, alignItems: 'center',
        shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 5
    },
    submitBtnEdit: { backgroundColor: '#2E7D32' },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});