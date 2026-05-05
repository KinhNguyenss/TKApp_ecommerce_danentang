import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
    const [hoTen, setHoTen] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'customer' | 'business'>('customer');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { registerWithEmail } = useAuth();
    const navigation = useNavigation<any>();

    const handleRegister = async () => {
        if (!hoTen || !email || !password) return Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin.');
        setIsLoading(true);
        try {
            await registerWithEmail(email, password, hoTen, role);
        } catch (error: any) {
            Alert.alert('Lỗi đăng ký', error.message);
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
                {/* Header */}
                <View style={styles.brandSection}>
                    <Image 
                        source={require('../../../assets/logo.png')} 
                        style={{ width: 180, height: 60, marginBottom: 5 }} 
                        resizeMode="contain"
                    />
                    <Text style={styles.tagline}>Tạo tài khoản và bắt đầu hành trình</Text>
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Tạo Tài Khoản</Text>
                    <Text style={styles.formSubtitle}>Bạn là ai?</Text>

                    {/* Role Selector */}
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
                            onPress={() => setRole('customer')}
                        >
                            <Text style={styles.roleEmoji}>🛍️</Text>
                            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
                                Người mua
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'business' && styles.roleBtnActive]}
                            onPress={() => setRole('business')}
                        >
                            <Text style={styles.roleEmoji}>🏪</Text>
                            <Text style={[styles.roleText, role === 'business' && styles.roleTextActive]}>
                                Doanh nghiệp
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>👤</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Họ và tên"
                            placeholderTextColor="#9CA3AF"
                            value={hoTen}
                            onChangeText={setHoTen}
                        />
                    </View>

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
                            placeholder="Mật khẩu (ít nhất 6 ký tự)"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={isLoading}>
                        {isLoading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.registerBtnText}>Đăng Ký Ngay</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                        <Text style={styles.loginText}>
                            Đã có tài khoản? <Text style={styles.loginHighlight}>Đăng nhập</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FF6F00' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },

    brandSection: { alignItems: 'center', marginBottom: 24 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)'
    },
    logoEmoji: { fontSize: 40 },
    appName: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    tagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontStyle: 'italic', textAlign: 'center' },

    formCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10
    },
    formTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4 },
    formSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },

    roleContainer: {
        flexDirection: 'row', marginBottom: 20,
        backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4
    },
    roleBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10,
        alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6
    },
    roleBtnActive: { backgroundColor: '#FF6F00', shadowColor: '#FF6F00', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
    roleEmoji: { fontSize: 18 },
    roleText: { fontWeight: 'bold', fontSize: 14, color: '#6B7280' },
    roleTextActive: { color: '#fff' },

    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        paddingHorizontal: 14, marginBottom: 12, height: 52
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#1A1A2E' },
    eyeIcon: { fontSize: 16, padding: 4 },

    registerBtn: {
        backgroundColor: '#FF6F00', borderRadius: 12, height: 52,
        justifyContent: 'center', alignItems: 'center', marginTop: 8,
        shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 6
    },
    registerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },

    loginLink: { alignItems: 'center', marginTop: 16 },
    loginText: { fontSize: 14, color: '#6B7280' },
    loginHighlight: { color: '#FF6F00', fontWeight: 'bold' },
});