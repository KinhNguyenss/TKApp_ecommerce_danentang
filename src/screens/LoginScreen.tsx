import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header / Brand */}
                <View style={styles.brandSection}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🏺</Text>
                    </View>
                    <Text style={styles.appName}>TKApp</Text>
                    <Text style={styles.tagline}>Nền tảng thủ công mỹ nghệ Việt</Text>
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Chào mừng trở lại!</Text>
                    <Text style={styles.formSubtitle}>Đăng nhập để tiếp tục</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>✉️</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email của bạn"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
                        {isLoading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.loginText}>Đăng Nhập</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
                        <Text style={styles.registerText}>
                            Chưa có tài khoản? <Text style={styles.registerHighlight}>Đăng ký ngay</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.guestBtn} onPress={loginAnonymously}>
                    <Text style={styles.guestText}>Tiếp tục dưới tư cách khách 👤</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FF6F00' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

    brandSection: { alignItems: 'center', marginBottom: 30 },
    logoCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)'
    },
    logoEmoji: { fontSize: 44 },
    appName: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontStyle: 'italic' },

    formCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, marginBottom: 20
    },
    formTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4 },
    formSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },

    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        paddingHorizontal: 14, marginBottom: 14, height: 54
    },
    inputIcon: { fontSize: 18, marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#1A1A2E' },
    eyeIcon: { fontSize: 18, padding: 4 },

    loginBtn: {
        backgroundColor: '#FF6F00', borderRadius: 12, height: 52,
        justifyContent: 'center', alignItems: 'center', marginTop: 8,
        shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 6
    },
    loginText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },

    registerLink: { alignItems: 'center', marginTop: 18 },
    registerText: { fontSize: 14, color: '#6B7280' },
    registerHighlight: { color: '#FF6F00', fontWeight: 'bold' },

    guestBtn: {
        alignItems: 'center', padding: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)'
    },
    guestText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});