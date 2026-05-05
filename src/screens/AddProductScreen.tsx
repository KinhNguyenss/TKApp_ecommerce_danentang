import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export default function AddProductScreen() {
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePriceChange = (text: string) => {
        // Loại bỏ mọi ký tự không phải là số
        const numericValue = text.replace(/\D/g, '');
        if (!numericValue) {
            setPrice('');
            return;
        }
        // Định dạng thành số có dấu chấm phân cách hàng nghìn
        const formattedPrice = Number(numericValue).toLocaleString('vi-VN');
        setPrice(formattedPrice);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadToCloudinary(result.assets[0].uri);
        }
    };

    const uploadToCloudinary = async (uri: string) => {
        setIsUploadingImage(true);
        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const strToSign = `timestamp=${timestamp}${API_SECRET}`;
            const signature = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, strToSign);

            const data = new FormData();
            data.append('file', {
                uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            } as any);
            data.append('api_key', API_KEY!);
            data.append('timestamp', timestamp);
            data.append('signature', signature);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();
            if (result.secure_url) {
                setImageUrl(result.secure_url);
            } else {
                Alert.alert("Lỗi", "Không thể upload ảnh.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Lỗi", "Đã xảy ra sự cố khi upload ảnh.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!name) return Alert.alert("Lỗi", "Vui lòng nhập tên sản phẩm trước khi dùng AI.");
        setIsGenerating(true);

        try {
            const prompt = `Gợi ý cho tôi một đoạn mô tả liên quan đến sản phẩm có chiều sâu chi tiết (khoảng 4-5 câu) và một mức giá bán hợp lý (bằng VNĐ) cho sản phẩm có tên là: '${name}'. Trả về định dạng JSON gồm { "description": "...", "price": 150000 }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const result = await response.json();

            if (result.error) {
                console.error("Gemini API Error:", result.error);
                Alert.alert("Lỗi từ Gemini", result.error.message || "API Key bị sai hoặc chưa nhận diện được.");
                return;
            }

            if (!result.candidates || result.candidates.length === 0) {
                Alert.alert("Lỗi", "AI không trả về kết quả nào.");
                return;
            }

            const text = result.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || [null, text];
            const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : text.trim();

            const parsed = JSON.parse(jsonStr);
            if (parsed.description) setDescription(parsed.description);
            if (parsed.price) {
                // Định dạng số có dấu chấm (100.000)
                const formattedPrice = Number(parsed.price).toLocaleString('vi-VN');
                setPrice(formattedPrice);
            }

        } catch (error) {
            console.error("AI Error:", error);
            Alert.alert("Lỗi", "AI không thể gợi ý lúc này.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!name || !price || !quantity) return Alert.alert("Lỗi", "Vui lòng nhập tên, giá và số lượng tồn kho.");

        setIsUploading(true);
        try {
            // Loại bỏ dấu chấm (.) trong chuỗi giá trước khi ép sang số
            const numericPrice = Number(price.replace(/\./g, ''));

            // Lưu sản phẩm vào DB, gắn kèm ID của Shop để sau này biết của ai
            await addDoc(collection(db, 'products'), {
                name,
                price: numericPrice,
                quantity: Number(quantity),
                imageUrl: imageUrl || 'https://via.placeholder.com/300', // Tạm dùng ảnh ảo nếu không nhập link
                description,
                sellerId: currentUser?.uid,
                sellerName: currentUser?.hoTen,
                createdAt: serverTimestamp(),
            });

            Alert.alert("Thành công", "Sản phẩm đã được lên kệ!");
            // Reset form
            setName(''); setPrice(''); setQuantity(''); setImageUrl(''); setDescription('');
        } catch (error) {
            Alert.alert("Lỗi", "Không thể đăng sản phẩm.");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📦 Thêm Sản Phẩm Mới</Text>

            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.label}>Tên sản phẩm *</Text>
                    <TouchableOpacity style={styles.aiBtn} onPress={handleAIGenerate} disabled={isGenerating}>
                        {isGenerating ? <ActivityIndicator size="small" color="#FF6F00" /> : <Text style={styles.aiBtnText}>✨ AI Gợi ý</Text>}
                    </TouchableOpacity>
                </View>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Áo thun tay lỡ" />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Giá bán (VNĐ) *</Text>
                        <TextInput style={styles.input} value={price} onChangeText={handlePriceChange} keyboardType="numeric" placeholder="150.000" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.label}>Tồn kho (SKU) *</Text>
                        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="100" />
                    </View>
                </View>

                <Text style={styles.label}>Ảnh sản phẩm</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={isUploadingImage}>
                    {isUploadingImage ? (
                        <ActivityIndicator color="#2E7D32" />
                    ) : imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                    ) : (
                        <Text style={styles.imagePickerText}>📸 Bấm để chọn ảnh từ điện thoại</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Mô tả sản phẩm</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Nhập mô tả chi tiết..." />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handlePublish} disabled={isUploading}>
                {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lên Kệ Ngay (Publish)</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    aiBtn: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
    aiBtnText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 12 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    imagePicker: { height: 150, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden' },
    imagePickerText: { color: '#888', fontSize: 14 },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    textArea: { height: 100, textAlignVertical: 'top' },
    btn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 40 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});