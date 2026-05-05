import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { db } from '../../config/firebaseConfig';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function SellerWalletScreen() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({
        available: 0,
        pending: 0
    });

    useEffect(() => {
        if (!currentUser) return;

        // Lắng nghe thay đổi số dư thời gian thực
        const shopRef = doc(db, 'shopProfiles', currentUser.uid);
        const unsubscribe = onSnapshot(shopRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBalance({
                    available: data.availableBalance || 0,
                    pending: data.pendingBalance || 0
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleWithdraw = () => {
        if (balance.available <= 0) {
            return Alert.alert('Thông báo', 'Số dư khả dụng của bạn không đủ để rút tiền.');
        }
        Alert.alert(
            'Yêu cầu rút tiền',
            `Bạn muốn rút ${balance.available.toLocaleString('vi-VN')} đ về tài khoản ngân hàng đã liên kết?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            if (!currentUser) return;
                            const shopRef = doc(db, 'shopProfiles', currentUser.uid);
                            await updateDoc(shopRef, {
                                payoutRequested: true,
                                payoutAmount: balance.available,
                                payoutRequestedAt: serverTimestamp(),
                            });
                            Alert.alert(
                                'Gửi thành công! 🎉',
                                'Yêu cầu rút tiền đã được gửi cho Admin. Bạn sẽ nhận được tiền trong vòng 1-2 ngày làm việc.'
                            );
                        } catch (e) {
                            Alert.alert('Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2E7D32" />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ví Người Bán 💳</Text>
                <Text style={styles.headerSub}>Quản lý doanh thu và rút tiền</Text>
            </View>

            {/* Thẻ Số dư */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                    <Text style={styles.availableAmount}>{balance.available.toLocaleString('vi-VN')} đ</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Số dư đang đóng băng (Chờ giao hàng)</Text>
                    <Text style={styles.pendingAmount}>{balance.pending.toLocaleString('vi-VN')} đ</Text>
                </View>

                <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
                    <Text style={styles.withdrawBtnText}>Rút tiền về ngân hàng</Text>
                </TouchableOpacity>
            </View>

            {/* Section Hướng dẫn */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>ℹ️ Cách thức hoạt động</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🛡️</Text>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoHeading}>Thanh toán đảm bảo</Text>
                        <Text style={styles.infoBody}>Tiền khách hàng thanh toán qua thẻ sẽ được giữ ở trạng thái "Đóng băng" để đảm bảo quyền lợi người mua.</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>✅</Text>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoHeading}>Giải ngân nhanh chóng</Text>
                        <Text style={styles.infoBody}>Tiền sẽ được chuyển sang "Số dư khả dụng" ngay sau khi đơn hàng được cập nhật trạng thái "Đã giao hàng".</Text>
                    </View>
                </View>
            </View>

            {/* Mock Transaction History */}
            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>🕒 Lịch sử giao dịch gần đây</Text>
                <View style={styles.emptyHistory}>
                    <Text style={styles.emptyText}>Chưa có lịch sử giao dịch nào.</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6' },
    header: { padding: 20, paddingTop: 30, backgroundColor: '#2E7D32' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSub: { fontSize: 14, color: '#A5D6A7', marginTop: 5 },

    balanceCard: {
        backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20,
        marginTop: -30, elevation: 4, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
    },
    balanceItem: { paddingVertical: 10 },
    balanceLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
    availableAmount: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32' },
    pendingAmount: { fontSize: 20, fontWeight: 'bold', color: '#FFA000' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },

    withdrawBtn: {
        backgroundColor: '#2E7D32', padding: 16, borderRadius: 12,
        alignItems: 'center', marginTop: 20
    },
    withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    infoSection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    infoRow: { flexDirection: 'row', marginBottom: 20 },
    infoIcon: { fontSize: 24, marginRight: 15 },
    infoTextContainer: { flex: 1 },
    infoHeading: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    infoBody: { fontSize: 13, color: '#666', lineHeight: 18 },

    historySection: { padding: 20, paddingTop: 0 },
    emptyHistory: {
        backgroundColor: '#fff', padding: 30, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed',
        borderWidth: 1, borderColor: '#CCC'
    },
    emptyText: { color: '#999', fontSize: 14 }
});
