// src/screens/AdminPayoutScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import {
    collection, query, where, onSnapshot,
    writeBatch, doc, increment, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

interface ShopProfile {
    id: string;
    shopName?: string;
    ownerName?: string;
    availableBalance: number;
    payoutAmount?: number;
    payoutRequested: boolean;
    bankInfo?: string;
    bankAccountNumber?: string;
    bankName?: string;
    payoutRequestedAt?: any;
}

export default function AdminPayoutScreen() {
    const [shops, setShops] = useState<ShopProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // Lắng nghe real-time: Shop có yêu cầu rút tiền đang chờ
        const q = query(
            collection(db, 'shopProfiles'),
            where('payoutRequested', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopProfile));
            // Sắp xếp theo thời gian yêu cầu (mới nhất lên đầu)
            data.sort((a, b) => {
                const tA = a.payoutRequestedAt?.toMillis ? a.payoutRequestedAt.toMillis() : 0;
                const tB = b.payoutRequestedAt?.toMillis ? b.payoutRequestedAt.toMillis() : 0;
                return tB - tA;
            });
            setShops(data);
            setLoading(false);
            setRefreshing(false);
        }, (err) => {
            console.error('AdminPayout error:', err);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const handlePayout = (shop: ShopProfile) => {
        const amount = shop.payoutAmount || shop.availableBalance;
        Alert.alert(
            '💸 Xác nhận giải ngân',
            `Xác nhận đã chuyển khoản ${amount.toLocaleString('vi-VN')} đ cho Shop "${shop.shopName || shop.ownerName || shop.id}"?\n\nThông tin ngân hàng:\n${shop.bankName || 'Chưa có'}\nSố TK: ${shop.bankAccountNumber || 'Chưa có'}\n\n⚠️ Hành động này không thể hoàn tác.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: '✅ Đã chuyển khoản',
                    style: 'default',
                    onPress: () => processPayout(shop, amount)
                }
            ]
        );
    };

    const processPayout = async (shop: ShopProfile, amount: number) => {
        setProcessingId(shop.id);
        try {
            const batch = writeBatch(db);
            const shopRef = doc(db, 'shopProfiles', shop.id);

            // Trừ availableBalance, xóa cờ yêu cầu rút tiền
            batch.update(shopRef, {
                availableBalance: increment(-amount),
                payoutRequested: false,
                payoutAmount: 0,
                lastPayoutAt: serverTimestamp(),
                lastPayoutAmount: amount,
            });

            // Lưu lịch sử payout
            const historyRef = doc(collection(db, 'payoutHistory'));
            batch.set(historyRef, {
                sellerId: shop.id,
                shopName: shop.shopName || shop.id,
                amount: amount,
                bankName: shop.bankName || '',
                bankAccountNumber: shop.bankAccountNumber || '',
                processedAt: serverTimestamp(),
                status: 'completed',
            });

            await batch.commit();
            Alert.alert('Thành công 🎉', `Đã giải ngân ${amount.toLocaleString('vi-VN')} đ cho Shop "${shop.shopName || shop.id}"!`);
        } catch (error) {
            console.error('Lỗi giải ngân:', error);
            Alert.alert('Lỗi', 'Không thể xử lý giải ngân. Vui lòng thử lại.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = (shop: ShopProfile) => {
        Alert.alert(
            '❌ Từ chối yêu cầu',
            `Từ chối yêu cầu rút tiền của Shop "${shop.shopName || shop.id}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const shopRef = doc(db, 'shopProfiles', shop.id);
                            const batch = writeBatch(db);
                            batch.update(shopRef, {
                                payoutRequested: false,
                                payoutAmount: 0,
                            });
                            await batch.commit();
                        } catch (e) {
                            Alert.alert('Lỗi', 'Không thể từ chối yêu cầu.');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (ts: any) => {
        if (!ts) return 'Mới đây';
        return new Date(ts.toDate()).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6A1B9A" />
                <Text style={styles.loadingText}>Đang tải danh sách giải ngân...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Stats bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{shops.length}</Text>
                    <Text style={styles.statLabel}>Yêu cầu rút tiền</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {shops
                            .reduce((sum, s) => sum + (s.payoutAmount || s.availableBalance || 0), 0)
                            .toLocaleString('vi-VN')}đ
                    </Text>
                    <Text style={styles.statLabel}>Tổng cần giải ngân</Text>
                </View>
            </View>

            {shops.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>💼</Text>
                    <Text style={styles.emptyTitle}>Không có yêu cầu rút tiền</Text>
                    <Text style={styles.emptySubtitle}>Tất cả các Shop đã được giải ngân</Text>
                </View>
            ) : (
                <FlatList
                    data={shops}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => setRefreshing(true)}
                            colors={['#6A1B9A']}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => {
                        const payoutAmount = item.payoutAmount || item.availableBalance;
                        return (
                            <View style={styles.card}>
                                {/* Card Header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.shopIconContainer}>
                                        <Text style={styles.shopIcon}>🏪</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.shopName}>
                                            {item.shopName || 'Shop chưa đặt tên'}
                                        </Text>
                                        <Text style={styles.shopId}>ID: {item.id.substring(0, 12)}...</Text>
                                        {item.payoutRequestedAt && (
                                            <Text style={styles.requestedAt}>
                                                🕐 {formatDate(item.payoutRequestedAt)}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Balance Info */}
                                <View style={styles.balanceBox}>
                                    <View style={styles.balanceRow}>
                                        <Text style={styles.balanceLabel}>Số dư khả dụng:</Text>
                                        <Text style={styles.balanceValue}>
                                            {item.availableBalance?.toLocaleString('vi-VN')} đ
                                        </Text>
                                    </View>
                                    <View style={styles.balanceDivider} />
                                    <View style={styles.balanceRow}>
                                        <Text style={styles.payoutLabel}>Yêu cầu rút:</Text>
                                        <Text style={styles.payoutAmount}>
                                            {payoutAmount?.toLocaleString('vi-VN')} đ
                                        </Text>
                                    </View>
                                </View>

                                {/* Bank Info */}
                                <View style={styles.bankBox}>
                                    <Text style={styles.bankTitle}>🏦 Thông tin ngân hàng</Text>
                                    <Text style={styles.bankDetail}>
                                        {item.bankName || 'Chưa có thông tin ngân hàng'}
                                    </Text>
                                    {item.bankAccountNumber && (
                                        <Text style={styles.bankAccount}>
                                            STK: {item.bankAccountNumber}
                                        </Text>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleReject(item)}
                                        disabled={processingId === item.id}
                                    >
                                        <Text style={styles.rejectBtnText}>❌ Từ chối</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.payoutBtn,
                                            processingId === item.id && styles.payoutBtnDisabled
                                        ]}
                                        onPress={() => handlePayout(item)}
                                        disabled={processingId === item.id}
                                    >
                                        {processingId === item.id ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.payoutBtnText}>💸 Đã thanh toán</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F0FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#666', fontSize: 14 },

    // Stats
    statsBar: {
        flexDirection: 'row', backgroundColor: '#6A1B9A',
        paddingVertical: 16, paddingHorizontal: 24,
        alignItems: 'center', justifyContent: 'space-around'
    },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 12, color: '#CE93D8', marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: '#7B1FA2' },

    // Empty
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyIcon: { fontSize: 60 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF' },

    // Card
    card: {
        backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, padding: 16,
        elevation: 3, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
        borderLeftWidth: 4, borderLeftColor: '#6A1B9A',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    shopIconContainer: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center'
    },
    shopIcon: { fontSize: 22 },
    shopName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    shopId: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    requestedAt: { fontSize: 11, color: '#AB47BC', marginTop: 2 },

    // Balance
    balanceBox: {
        backgroundColor: '#F9F5FF', borderRadius: 10, padding: 12, marginBottom: 12
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 13, color: '#6B7280' },
    balanceValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
    balanceDivider: { height: 1, backgroundColor: '#E9D8FD', marginVertical: 8 },
    payoutLabel: { fontSize: 14, fontWeight: 'bold', color: '#6A1B9A' },
    payoutAmount: { fontSize: 20, fontWeight: 'bold', color: '#6A1B9A' },

    // Bank
    bankBox: {
        backgroundColor: '#F0F4FF', borderRadius: 10, padding: 12,
        marginBottom: 14, borderWidth: 1, borderColor: '#E8EAF6'
    },
    bankTitle: { fontSize: 12, fontWeight: 'bold', color: '#3949AB', marginBottom: 4 },
    bankDetail: { fontSize: 14, color: '#374151', fontWeight: '500' },
    bankAccount: { fontSize: 13, color: '#6B7280', marginTop: 2 },

    // Actions
    actionRow: { flexDirection: 'row', gap: 10 },
    rejectBtn: {
        flex: 1, padding: 12, borderRadius: 10,
        alignItems: 'center', backgroundColor: '#FEECEC',
        borderWidth: 1, borderColor: '#FECACA'
    },
    rejectBtnText: { color: '#DC2626', fontSize: 13, fontWeight: 'bold' },
    payoutBtn: {
        flex: 2, padding: 14, borderRadius: 10,
        alignItems: 'center', backgroundColor: '#6A1B9A'
    },
    payoutBtnDisabled: { backgroundColor: '#90A4AE' },
    payoutBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
