import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    Image, Alert, ActivityIndicator, Switch
} from 'react-native';
import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

interface ShopProfile {
    shopName: string;
    shopDescription: string;
    avatarUrl: string;
    coverUrl: string;
    pickupAddress: string;
    returnAddress: string;
    shippingGHN: boolean;
    shippingGHTK: boolean;
    shippingSPX: boolean;
    joinedAt?: any;
}

export default function SellerProfileScreen() {
    const { currentUser, logout } = useAuth();
    const [profile, setProfile] = useState<ShopProfile>({
        shopName: '',
        shopDescription: '',
        avatarUrl: '',
        coverUrl: '',
        pickupAddress: '',
        returnAddress: '',
        shippingGHN: false,
        shippingGHTK: false,
        shippingSPX: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;
            try {
                const ref = doc(db, 'shopProfiles', currentUser.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setProfile(snap.data() as ShopProfile);
                } else {
                    setProfile(prev => ({ ...prev, shopName: currentUser.hoTen || '' }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const uploadToCloudinary = async (uri: string): Promise<string | null> => {
        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const strToSign = `timestamp=${timestamp}${API_SECRET}`;
            const signature = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, strToSign);

            const data = new FormData();
            data.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any);
            data.append('api_key', API_KEY!);
            data.append('timestamp', timestamp);
            data.append('signature', signature);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST', body: data,
            });
            const result = await response.json();
            return result.secure_url || null;
        } catch (e) {
            console.error('Upload error:', e);
            return null;
        }
    };

    const pickAndUpload = async (type: 'avatar' | 'cover') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true,
            aspect: type === 'avatar' ? [1, 1] : [16, 9], quality: 0.8,
        });
        if (result.canceled) return;

        if (type === 'avatar') setUploadingAvatar(true);
        else setUploadingCover(true);

        const url = await uploadToCloudinary(result.assets[0].uri);
        if (url) {
            setProfile(prev => type === 'avatar' ? { ...prev, avatarUrl: url } : { ...prev, coverUrl: url });
        } else {
            Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
        }

        if (type === 'avatar') setUploadingAvatar(false);
        else setUploadingCover(false);
    };

    const handleSave = async () => {
        if (!currentUser) return;
        if (!profile.shopName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập Tên Shop.');
        setSaving(true);
        try {
            const ref = doc(db, 'shopProfiles', currentUser.uid);
            await setDoc(ref, {
                ...profile,
                sellerId: currentUser.uid,
                joinedAt: profile.joinedAt || new Date(),
                updatedAt: new Date(),
            }, { merge: true });
            setIsEditing(false);
            Alert.alert('Thành công', 'Hồ sơ Shop đã được cập nhật!');
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể lưu hồ sơ.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2E7D32" />;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Cover Image */}
            <TouchableOpacity
                style={styles.coverContainer}
                onPress={() => isEditing && pickAndUpload('cover')}
                activeOpacity={isEditing ? 0.7 : 1}
            >
                {profile.coverUrl
                    ? <Image source={{ uri: profile.coverUrl }} style={styles.coverImage} />
                    : <View style={styles.coverPlaceholder}>
                        <Text style={styles.coverPlaceholderText}>
                            {isEditing ? '📷 Bấm để thêm ảnh bìa' : '🏪 Chưa có ảnh bìa'}
                        </Text>
                    </View>
                }
                {uploadingCover && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator color="#fff" />
                        <Text style={{ color: '#fff', marginTop: 8 }}>Đang upload...</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Avatar + Shop Name Header */}
            <View style={styles.profileHeader}>
                <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={() => isEditing && pickAndUpload('avatar')}
                    activeOpacity={isEditing ? 0.7 : 1}
                >
                    {profile.avatarUrl
                        ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                        : <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarLetter}>
                                {profile.shopName?.charAt(0)?.toUpperCase() || '🏪'}
                            </Text>
                        </View>
                    }
                    {uploadingAvatar && (
                        <View style={[styles.uploadingOverlay, styles.avatarUploading]}>
                            <ActivityIndicator color="#fff" size="small" />
                        </View>
                    )}
                    {isEditing && (
                        <View style={styles.editAvatarBadge}>
                            <Text style={{ fontSize: 10 }}>✏️</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.shopNameArea}>
                    <Text style={styles.shopNameDisplay}>{profile.shopName || 'Tên Shop của bạn'}</Text>
                    <Text style={styles.joinedText}>
                        📅 Tham gia: {profile.joinedAt
                            ? new Date(profile.joinedAt?.toDate ? profile.joinedAt.toDate() : profile.joinedAt).toLocaleDateString('vi-VN')
                            : 'Mới'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.editToggleBtn}
                    onPress={() => setIsEditing(!isEditing)}
                >
                    <Text style={styles.editToggleText}>{isEditing ? 'Hủy' : 'Sửa ✏️'}</Text>
                </TouchableOpacity>
            </View>

            {/* === THÔNG TIN CHÍNH === */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Thông tin Shop</Text>

                <Text style={styles.fieldLabel}>Tên Shop *</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profile.shopName}
                    onChangeText={v => setProfile(p => ({ ...p, shopName: v }))}
                    editable={isEditing}
                    placeholder="Tên hiển thị của Shop"
                />

                <Text style={styles.fieldLabel}>Mô tả Shop</Text>
                <TextInput
                    style={[styles.input, { height: 90 }, !isEditing && styles.inputDisabled]}
                    value={profile.shopDescription}
                    onChangeText={v => setProfile(p => ({ ...p, shopDescription: v }))}
                    editable={isEditing}
                    placeholder="Giới thiệu về Shop, sản phẩm và cam kết bán hàng..."
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* === ĐỊA CHỈ === */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📦 Địa chỉ</Text>

                <Text style={styles.fieldLabel}>Địa chỉ kho hàng (Shipper đến lấy)</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profile.pickupAddress}
                    onChangeText={v => setProfile(p => ({ ...p, pickupAddress: v }))}
                    editable={isEditing}
                    placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố"
                    multiline
                />

                <Text style={styles.fieldLabel}>Địa chỉ trả hàng</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profile.returnAddress}
                    onChangeText={v => setProfile(p => ({ ...p, returnAddress: v }))}
                    editable={isEditing}
                    placeholder="Nơi nhận hàng khi khách trả hoặc giao không thành công"
                    multiline
                />
            </View>

            {/* === VẬN CHUYỂN === */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚚 Đối tác vận chuyển</Text>
                <Text style={styles.sectionSubtitle}>Chọn các đối tác vận chuyển bạn muốn liên kết</Text>

                {[
                    { key: 'shippingGHN', label: 'GHN — Giao Hàng Nhanh', icon: '🟠' },
                    { key: 'shippingGHTK', label: 'GHTK — Giao Hàng Tiết Kiệm', icon: '🔵' },
                    { key: 'shippingSPX', label: 'SPX — Shopee Express', icon: '🟠' },
                ].map(item => (
                    <View key={item.key} style={styles.switchRow}>
                        <Text style={styles.switchLabel}>{item.icon} {item.label}</Text>
                        <Switch
                            value={profile[item.key as keyof ShopProfile] as boolean}
                            onValueChange={val => setProfile(p => ({ ...p, [item.key]: val }))}
                            trackColor={{ false: '#E5E7EB', true: '#2E7D32' }}
                            thumbColor="#fff"
                            disabled={!isEditing}
                        />
                    </View>
                ))}
            </View>

            {/* Nút Lưu */}
            {isEditing && (
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveBtnText}>💾 Lưu Hồ Sơ Shop</Text>
                    }
                </TouchableOpacity>
            )}

            {/* Nút Đăng xuất */}
            <View style={styles.section}>
                <View style={styles.accountRow}>
                    <Text style={styles.accountEmail}>✉️ {currentUser?.email}</Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() =>
                        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Đăng xuất', style: 'destructive', onPress: logout }
                        ])
                    }
                >
                    <Text style={styles.logoutBtnText}>🚪 Đăng Xuất</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    coverContainer: { height: 180, backgroundColor: '#E5E7EB', position: 'relative' },
    coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D1FAE5' },
    coverPlaceholderText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
    },
    avatarUploading: { borderRadius: 40 },

    profileHeader: {
        flexDirection: 'row', alignItems: 'center',
        padding: 15, backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, elevation: 3
    },
    avatarWrapper: {
        width: 70, height: 70, borderRadius: 35, marginRight: 12,
        borderWidth: 3, borderColor: '#2E7D32', position: 'relative'
    },
    avatar: { width: '100%', height: '100%', borderRadius: 35 },
    avatarPlaceholder: {
        flex: 1, backgroundColor: '#E8F5E9', borderRadius: 35,
        justifyContent: 'center', alignItems: 'center'
    },
    avatarLetter: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32' },
    editAvatarBadge: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff',
        borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E5E7EB'
    },

    shopNameArea: { flex: 1 },
    shopNameDisplay: { fontSize: 17, fontWeight: 'bold', color: '#1A1A2E' },
    joinedText: { fontSize: 12, color: '#6B7280', marginTop: 3 },

    editToggleBtn: {
        backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8
    },
    editToggleText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },

    section: {
        backgroundColor: '#fff', margin: 12, borderRadius: 14, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, elevation: 2
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4 },
    sectionSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 14 },

    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
        padding: 12, borderRadius: 10, fontSize: 15, color: '#1A1A2E'
    },
    inputDisabled: { backgroundColor: '#F3F4F6', color: '#9CA3AF', borderColor: 'transparent' },

    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    switchLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },

    saveBtn: {
        backgroundColor: '#2E7D32', marginHorizontal: 12, borderRadius: 12,
        padding: 16, alignItems: 'center',
        shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, elevation: 6
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    accountRow: { marginBottom: 12 },
    accountEmail: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    logoutBtn: {
        backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10,
        alignItems: 'center', borderWidth: 1, borderColor: '#FECACA'
    },
    logoutBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 15 },
});
