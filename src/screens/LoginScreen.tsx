// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { loginWithEmail, loginAnonymously } = useAuth();
    const navigation = useNavigation<any>();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập Email và Mật khẩu.');
            return;
        }
        setIsLoading(true);
        try {
            await loginWithEmail(email, password);
        } catch (error: any) {
            Alert.alert('Đăng nhập thất bại', 'Sai email hoặc mật khẩu!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>TKApp</Text>
            <Text style={styles.subtitle}>Khám phá nghệ thuật thủ công</Text>

            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FF6F00" /> : <Text style={styles.loginText}>Đăng Nhập</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginBottom: 20 }}>
                <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestBtn} onPress={loginAnonymously}>
                <Text style={styles.guestText}>Tiếp tục dưới tư cách khách</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#FF6F00' },
    title: { fontSize: 40, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: 'white', textAlign: 'center', marginBottom: 30 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
    loginBtn: { backgroundColor: 'white', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    loginText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: 'white', textAlign: 'center', fontSize: 16, textDecorationLine: 'underline' },
    guestBtn: { padding: 10, alignItems: 'center' },
    guestText: { color: 'white', textDecorationLine: 'underline', fontSize: 16 }
});