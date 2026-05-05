import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';
import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfileScreen() {
    const navigation = useNavigation<AppNavigationProp>();
    const { currentUser, logout } = useAuth();

    const [hoTen, setHoTen] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setHoTen(data.hoTen || '');
                    setPhone(data.phone || '');
                    setAddress(data.address || '');
                }
            } catch (error) {
                console.error("Lỗi lấy dữ liệu người dùng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleUpdateProfile = async () => {
        if (!currentUser) return;
        setUpdating(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                hoTen,
                phone,
                address,
                email: currentUser.email,
                updatedAt: new Date()
            }, { merge: true });
            setIsEditing(false);
            Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.');
        } catch (error) {
            console.error("Lỗi cập nhật profile:", error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} size="large" color="#FF6F00" />;

    return (
        <ScrollView style={styles.container}>
            {/* Phần thông tin người dùng */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <Text style={styles.name}>{hoTen || 'Khách hàng'}</Text>
                <Text style={styles.email}>{currentUser?.email}</Text>
            </View>

            {/* Form chỉnh sửa */}
            <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Text style={styles.editBtnText}>{isEditing ? 'Hủy' : 'Sửa ✏️'}</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Họ và Tên</Text>
                    <TextInput 
                        style={[styles.input, !isEditing && styles.disabledInput]} 
                        value={hoTen} 
                        onChangeText={setHoTen} 
                        placeholder="Nhập họ tên đầy đủ"
                        editable={isEditing}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput 
                        style={[styles.input, !isEditing && styles.disabledInput]} 
                        value={phone} 
                        onChangeText={setPhone} 
                        placeholder="Nhập số điện thoại"
                        keyboardType="phone-pad"
                        editable={isEditing}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Địa chỉ giao hàng mặc định</Text>
                    <TextInput 
                        style={[styles.input, { height: 80 }, !isEditing && styles.disabledInput]} 
                        value={address} 
                        onChangeText={setAddress} 
                        placeholder="Nhập địa chỉ của bạn"
                        multiline
                        editable={isEditing}
                    />
                </View>

                {isEditing && (
                    <TouchableOpacity 
                        style={[styles.updateBtn, updating && { opacity: 0.7 }]} 
                        onPress={handleUpdateProfile}
                        disabled={updating}
                    >
                        <Text style={styles.updateBtnText}>{updating ? 'Đang lưu...' : 'Lưu thông tin'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Phần Menu chức năng */}
            <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderHistory')}>
                    <Text style={styles.icon}>📦</Text>
                    <Text style={styles.menuText}>Lịch sử đơn hàng</Text>
                    <Text style={styles.arrow}>❯</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
                    <Text style={styles.icon}>❤️</Text>
                    <Text style={styles.menuText}>Mục yêu thích</Text>
                    <Text style={styles.arrow}>❯</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { marginTop: 10 }]} onPress={handleLogout}>
                    <Text style={styles.icon}>🚪</Text>
                    <Text style={[styles.menuText, { color: '#D32F2F' }]}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#FF6F00', padding: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatar: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontSize: 30, fontWeight: 'bold', color: '#FF6F00' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    email: { fontSize: 14, color: '#FFD54F', marginTop: 5 },
    
    formSection: { padding: 20, backgroundColor: '#fff', margin: 20, marginTop: -20, borderRadius: 15, elevation: 5 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    editBtnText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 15 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontSize: 16, color: '#333' },
    disabledInput: { backgroundColor: '#f0f0f0', color: '#888', borderColor: 'transparent' },
    updateBtn: { backgroundColor: '#FF6F00', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    menu: { paddingHorizontal: 20, paddingBottom: 30 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 15, elevation: 2 },
    icon: { fontSize: 22, marginRight: 15 },
    menuText: { fontSize: 16, fontWeight: '600', flex: 1, color: '#333' },
    arrow: { fontSize: 16, color: '#aaa' }
});