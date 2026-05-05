import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';

export default function ProfileScreen() {
    const navigation = useNavigation<AppNavigationProp>();
    const { currentUser, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Phần thông tin người dùng */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <Text style={styles.name}>{currentUser?.hoTen || currentUser?.displayName || 'Khách hàng'}</Text>
                <Text style={styles.email}>{currentUser?.email}</Text>
            </View>

            {/* Phần Menu chức năng */}
            <View style={styles.menu}>
                {/* Nút Lịch sử đơn hàng */}
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderHistory')}>
                    <Text style={styles.icon}>📦</Text>
                    <Text style={styles.menuText}>Lịch sử đơn hàng</Text>
                    <Text style={styles.arrow}>❯</Text>
                </TouchableOpacity>

                {/* Nút Mục yêu thích */}
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
                    <Text style={styles.icon}>❤️</Text>
                    <Text style={styles.menuText}>Mục yêu thích</Text>
                    <Text style={styles.arrow}>❯</Text>
                </TouchableOpacity>

                {/* Nút Đăng xuất */}
                <TouchableOpacity style={[styles.menuItem, { marginTop: 30 }]} onPress={handleLogout}>
                    <Text style={styles.icon}>🚪</Text>
                    <Text style={[styles.menuText, { color: '#D32F2F' }]}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#FF6F00', padding: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatar: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontSize: 30, fontWeight: 'bold', color: '#FF6F00' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    email: { fontSize: 14, color: '#FFD54F', marginTop: 5 },
    menu: { padding: 20, marginTop: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
    icon: { fontSize: 22, marginRight: 15 },
    menuText: { fontSize: 16, fontWeight: '600', flex: 1, color: '#333' },
    arrow: { fontSize: 16, color: '#aaa' }
});