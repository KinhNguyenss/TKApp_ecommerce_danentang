import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export default function ChatScreen() {
    const { currentUser } = useAuth();
    const route = useRoute<any>();
    const navigation = useNavigation();
    
    // Params có thể nhận: sellerId, customerId, initialMessage
    const { sellerId, customerId, initialMessage } = route.params || {};

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const hasSentInitialRef = useRef(false);

    // Xác định chatId
    // Nếu currentUser là Khách -> họ có sellerId
    // Nếu currentUser là Shop -> họ có customerId
    const currentUserId = currentUser?.uid;
    const targetUserId = sellerId || customerId; 
    
    if (!currentUserId || !targetUserId) {
        return <Text style={{ marginTop: 50, textAlign: 'center' }}>Lỗi: Không tìm thấy thông tin phòng Chat</Text>;
    }

    // Đảm bảo ID luồng chat luôn đồng nhất giữa 2 người (bất kể ai chủ động nhắn trước)
    const chatId = currentUserId < targetUserId ? `${currentUserId}_${targetUserId}` : `${targetUserId}_${currentUserId}`;

    useEffect(() => {
        // Ghi nhận sự tồn tại của phòng chat này để lưu metadata nếu cần
        const setupChat = async () => {
            await setDoc(doc(db, 'chats', chatId), {
                participants: [currentUserId, targetUserId],
                updatedAt: serverTimestamp()
            }, { merge: true });
        };
        setupChat();

        // Lắng nghe tin nhắn
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        if (initialMessage && !hasSentInitialRef.current) {
            hasSentInitialRef.current = true;
            // Gửi luôn tin nhắn mồi để khách không cần bấm
            sendMessage(initialMessage);
        }
    }, [initialMessage]);

    const sendMessage = async (text: string) => {
        const msg = text.trim();
        if (!msg) return;
        
        // Reset ô nhập ngay lập tức cho mượt
        if (msg === newMessage) setNewMessage('');

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text: msg,
            senderId: currentUserId,
            createdAt: serverTimestamp()
        });

        // Cập nhật thời gian phòng chat
        await setDoc(doc(db, 'chats', chatId), {
            updatedAt: serverTimestamp(),
            lastMessage: msg
        }, { merge: true });
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.senderId === currentUserId;
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {loading ? (
                <ActivityIndicator style={{ flex: 1, marginTop: 50 }} size="large" color="#0084FF" />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatContainer}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Nhập tin nhắn..."
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage(newMessage)}>
                    <Text style={styles.sendButtonText}>Gửi</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    chatContainer: { padding: 15, paddingBottom: 20 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#0084FF', borderBottomRightRadius: 5 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 5, elevation: 1 },
    messageText: { fontSize: 16 },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: '#333' },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, maxHeight: 100, fontSize: 16 },
    sendButton: { padding: 12, marginLeft: 10, justifyContent: 'center' },
    sendButtonText: { color: '#0084FF', fontWeight: 'bold', fontSize: 16 }
});
