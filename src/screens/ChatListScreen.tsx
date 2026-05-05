import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';

export default function ChatListScreen() {
    const { currentUser } = useAuth();
    const navigation = useNavigation<AppNavigationProp>();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const chatsRef = collection(db, 'chats');
        // Tìm các cuộc chat có chứa currentUser.uid
        const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatList: any[] = await Promise.all(snapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();
                // Tìm ID của người kia
                const otherUserId = data.participants.find((id: string) => id !== currentUser.uid) || data.participants[0];
                
                // Lấy thông tin user kia từ bảng users
                let otherUserName = 'Người dùng';
                let otherUserEmail = '';
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        otherUserName = userData.hoTen || userData.name || userData.displayName || 'Người dùng';
                        otherUserEmail = userData.email || '';
                    }
                } catch (e) {}

                return {
                    id: chatDoc.id,
                    ...data,
                    otherUserId,
                    otherUserName,
                    otherUserEmail
                };
            }));

            // Sắp xếp chat có tin nhắn mới lên đầu
            chatList.sort((a, b) => {
                const timeA = a.updatedAt?.toMillis() || 0;
                const timeB = b.updatedAt?.toMillis() || 0;
                return timeB - timeA;
            });

            setChats(chatList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const renderItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity 
                style={styles.chatCard}
                onPress={() => {
                    // Truyền ID để màn hình Chat biết đang chat với ai
                    const targetParams = currentUser?.role === 'business' 
                        ? { customerId: item.otherUserId, chatTitle: item.otherUserName }
                        : { sellerId: item.otherUserId, chatTitle: item.otherUserName };
                    (navigation.navigate as any)('Chat', targetParams);
                }}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.otherUserName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.chatInfo}>
                    <Text style={styles.name}>{item.otherUserName}</Text>
                    {item.lastMessage ? (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                    ) : (
                        <Text style={[styles.lastMessage, { fontStyle: 'italic' }]}>Chưa có tin nhắn</Text>
                    )}
                </View>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                        {item.updatedAt ? new Date(item.updatedAt.toDate()).toLocaleDateString('vi-VN') : ''}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} size="large" color="#FF6F00" />
    }

    return (
        <View style={styles.container}>
            {chats.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#777' },
    chatCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFD54F', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#FF6F00' },
    chatInfo: { flex: 1, justifyContent: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    lastMessage: { fontSize: 14, color: '#666' },
    timeContainer: { justifyContent: 'flex-start', alignItems: 'flex-end', paddingLeft: 10 },
    timeText: { fontSize: 12, color: '#999' }
});
