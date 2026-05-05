import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useWishlist } from '../contexts/WishlistContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';

export default function WishlistScreen() {
    const { wishlist, toggleWishlist } = useWishlist();
    const navigation = useNavigation<AppNavigationProp>();

    if (wishlist.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Danh sách yêu thích trống 💔</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Sản phẩm yêu thích</Text>
            <FlatList
                data={wishlist}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    >
                        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.image} />
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.price}>{item.price.toLocaleString('vi-VN')} đ</Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleWishlist(item)} style={styles.removeBtn}>
                            <Text style={styles.removeText}>Bỏ tim</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: 'gray' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#FF6F00', marginBottom: 15 },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
    image: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    price: { color: '#D32F2F', marginTop: 5 },
    removeBtn: { padding: 8, backgroundColor: '#FFEBEE', borderRadius: 5 },
    removeText: { color: '#D32F2F', fontSize: 12 }
});