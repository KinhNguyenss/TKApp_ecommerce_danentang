import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function ReviewScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    // Nhận thông tin sản phẩm từ màn hình Chi tiết đơn hàng truyền sang
    const { product } = route.params;

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitReview = async () => {
        if (!comment.trim()) {
            return Alert.alert("Thiếu thông tin", "Vui lòng nhập vài lời nhận xét nhé.");
        }

        setIsSubmitting(true);
        try {
            const user = useAuth().currentUser;

            // Lưu đánh giá vào collection 'reviews'
            await addDoc(collection(db, 'reviews'), {
                productId: product.id,
                userId: user?.uid,
                userName: user?.displayName || user?.email || 'Khách hàng',
                rating: rating,
                comment: comment,
                createdAt: serverTimestamp()
            });

            Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá sản phẩm! 💖", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể gửi đánh giá lúc này.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đánh giá Sản phẩm</Text>

            {/* Thông tin sản phẩm đang đánh giá */}
            <View style={styles.productInfo}>
                <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/60' }} style={styles.image} />
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            </View>

            {/* Chọn Số Sao */}
            <Text style={styles.label}>Bạn cảm thấy sản phẩm thế nào?</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Text style={star <= rating ? styles.starActive : styles.starInactive}>★</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.ratingText}>{rating} / 5 Sao</Text>

            {/* Nhập bình luận */}
            <TextInput
                style={styles.textInput}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                multiline
                numberOfLines={5}
                value={comment}
                onChangeText={setComment}
            />

            {/* Nút gửi */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Gửi Đánh Giá</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FF6F00', marginBottom: 20, textAlign: 'center' },
    productInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
    image: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
    productName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
    label: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 5 },
    starActive: { fontSize: 40, color: '#FFD700', marginHorizontal: 5 }, // Màu vàng
    starInactive: { fontSize: 40, color: '#E0E0E0', marginHorizontal: 5 }, // Màu xám
    ratingText: { textAlign: 'center', fontSize: 16, color: '#666', marginBottom: 20 },
    textInput: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 16, textAlignVertical: 'top', height: 120, marginBottom: 20 },
    submitBtn: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});