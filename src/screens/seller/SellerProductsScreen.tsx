import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator, Image, TextInput, ScrollView, Modal
} from 'react-native';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';

export default function SellerProductsScreen() {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editTags, setEditTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Thống kê tổng quan
    const totalRevenue = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const outOfStock = products.filter(p => p.quantity === 0).length;

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'products'),
            where('sellerId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];
            setProducts(items);
            setLoading(false);
        }, (error) => {
            console.error('Lỗi lấy sản phẩm:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleDelete = (product: Product) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'products', product.id));
                            Alert.alert('Thành công', 'Sản phẩm đã được xóa.');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa sản phẩm.');
                        }
                    }
                }
            ]
        );
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setEditName(product.name);
        setEditPrice(product.price.toString());
        setEditQuantity(product.quantity?.toString() || '0');
        setEditDescription(product.description || '');
        setEditCategory(product.category || '');
        setEditTags((product.tags || []).join(', '));
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        if (!editName.trim() || !editPrice.trim() || !editQuantity.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên, Giá và Số lượng.');
        }
        setIsSaving(true);
        try {
            const productRef = doc(db, 'products', editingProduct.id);
            await updateDoc(productRef, {
                name: editName.trim(),
                price: Number(editPrice.replace(/\./g, '')),
                quantity: Number(editQuantity),
                description: editDescription.trim(),
                category: editCategory.trim(),
                tags: editTags.split(',').map(t => t.trim()).filter(t => t !== ''),
            });
            Alert.alert('Thành công', 'Sản phẩm đã được cập nhật!');
            setEditingProduct(null);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật sản phẩm.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatPrice = (text: string) => {
        const numeric = text.replace(/\D/g, '');
        return numeric ? Number(numeric).toLocaleString('vi-VN') : '';
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2E7D32" />;

    return (
        <View style={styles.container}>
            {/* Thống kê nhanh */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderLeftColor: '#2E7D32' }]}>
                    <Text style={styles.statValue}>{products.length}</Text>
                    <Text style={styles.statLabel}>Sản phẩm</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#FF6F00' }]}>
                    <Text style={styles.statValue}>{totalStock}</Text>
                    <Text style={styles.statLabel}>Tổng tồn kho</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#D32F2F' }]}>
                    <Text style={[styles.statValue, { color: '#D32F2F' }]}>{outOfStock}</Text>
                    <Text style={styles.statLabel}>Hết hàng</Text>
                </View>
            </View>

            <FlatList
                data={products}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 30 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>📦 Bạn chưa có sản phẩm nào.</Text>
                        <Text style={styles.emptySubText}>Hãy thêm sản phẩm từ tab "Thêm Hàng".</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.card, item.quantity === 0 && styles.cardOutOfStock]}>
                        <Image
                            source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }}
                            style={styles.productImage}
                        />
                        <View style={styles.productInfo}>
                            <View style={styles.productHeader}>
                                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                {item.quantity === 0 && (
                                    <View style={styles.outOfStockBadge}>
                                        <Text style={styles.outOfStockText}>Hết</Text>
                                    </View>
                                )}
                            </View>
                            {item.category ? (
                                <Text style={styles.categoryText}>📂 {item.category}</Text>
                            ) : null}
                            <Text style={styles.priceText}>
                                {item.price.toLocaleString('vi-VN')} đ
                            </Text>
                            <Text style={styles.stockText}>Tồn kho: {item.quantity ?? 0}</Text>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    onPress={() => openEdit(item)}
                                >
                                    <Text style={styles.editBtnText}>✏️ Sửa</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDelete(item)}
                                >
                                    <Text style={styles.deleteBtnText}>🗑️ Xóa</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* Modal chỉnh sửa sản phẩm */}
            <Modal
                visible={editingProduct !== null}
                animationType="slide"
                onRequestClose={() => setEditingProduct(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Sửa Sản Phẩm</Text>
                        <TouchableOpacity onPress={() => setEditingProduct(null)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <Text style={styles.modalLabel}>Tên sản phẩm *</Text>
                        <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />

                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.modalLabel}>Giá bán (VNĐ) *</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editPrice}
                                    onChangeText={text => setEditPrice(formatPrice(text))}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalLabel}>Tồn kho *</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editQuantity}
                                    onChangeText={setEditQuantity}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={styles.modalLabel}>Danh mục</Text>
                        <TextInput style={styles.modalInput} value={editCategory} onChangeText={setEditCategory} placeholder="VD: Đồ gốm, Quần áo" />

                        <Text style={styles.modalLabel}>Thẻ (Tags)</Text>
                        <TextInput style={styles.modalInput} value={editTags} onChangeText={setEditTags} placeholder="VD: handmade, quà tặng" />

                        <Text style={styles.modalLabel}>Mô tả</Text>
                        <TextInput
                            style={[styles.modalInput, { height: 100 }]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            multiline
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSaveEdit}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },

    statsRow: { flexDirection: 'row', padding: 15, paddingBottom: 5 },
    statCard: {
        flex: 1, backgroundColor: '#fff', marginHorizontal: 5, padding: 12,
        borderRadius: 10, borderLeftWidth: 4, elevation: 2, alignItems: 'center'
    },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

    emptyContainer: { flex: 1, alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 18, color: '#555', fontWeight: 'bold' },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 8 },

    card: {
        flexDirection: 'row', backgroundColor: '#fff', margin: 10, marginBottom: 5,
        borderRadius: 12, padding: 12, elevation: 2
    },
    cardOutOfStock: { opacity: 0.6 },
    productImage: { width: 80, height: 80, borderRadius: 10, marginRight: 12 },
    productInfo: { flex: 1 },
    productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A2E', flex: 1 },
    outOfStockBadge: { backgroundColor: '#D32F2F', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    outOfStockText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    categoryText: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    priceText: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F', marginBottom: 2 },
    stockText: { fontSize: 12, color: '#6B7280', marginBottom: 8 },

    actionRow: { flexDirection: 'row' },
    editBtn: {
        flex: 1, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8,
        alignItems: 'center', marginRight: 8
    },
    editBtnText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },
    deleteBtn: {
        flex: 1, backgroundColor: '#FFEBEE', padding: 8, borderRadius: 8, alignItems: 'center'
    },
    deleteBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 13 },

    // Modal styles
    modalContainer: { flex: 1, backgroundColor: '#f8f9fa' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: 50, backgroundColor: '#2E7D32'
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    modalClose: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
    modalLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10 },
    modalInput: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
        padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 5
    },
    saveBtn: {
        backgroundColor: '#2E7D32', padding: 16, borderRadius: 10,
        alignItems: 'center', marginTop: 25, marginBottom: 40
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});
