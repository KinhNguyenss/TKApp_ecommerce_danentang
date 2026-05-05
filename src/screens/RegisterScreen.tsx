// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
    const [hoTen, setHoTen] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'customer' | 'business'>('customer'); // Thêm state Role
    const [isLoading, setIsLoading] = useState(false);

    const { registerWithEmail } = useAuth();
    const navigation = useNavigation<any>();

    const handleRegister = async () => {
        if (!hoTen || !email || !password) return Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin.');
        setIsLoading(true);
        try {
            await registerWithEmail(email, password, hoTen, role);
            // Thành công, context sẽ tự chuyển trang
        } catch (error: any) {
            Alert.alert('Lỗi đăng ký', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tạo Tài Khoản</Text>

            {/* Chọn vai trò */}
            <View style={styles.roleContainer}>
                <TouchableOpacity
                    style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
                    onPress={() => setRole('customer')}
                >
                    <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Người mua</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.roleBtn, role === 'business' && styles.roleBtnActive]}
                    onPress={() => setRole('business')}
                >
                    <Text style={[styles.roleText, role === 'business' && styles.roleTextActive]}>Doanh nghiệp</Text>
                </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Họ và tên" value={hoTen} onChangeText={setHoTen} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng Ký</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập ngay</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#FF6F00' },
    title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
    roleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 5 },
    roleBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
    roleBtnActive: { backgroundColor: 'white' },
    roleText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    roleTextActive: { color: '#FF6F00' },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
    btn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: 'white', textAlign: 'center', fontSize: 16, textDecorationLine: 'underline' }
});