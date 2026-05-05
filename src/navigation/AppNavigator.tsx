// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Import Screens chung
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ReviewScreen from '../screens/ReviewScreen';

// Import Screens Khách hàng
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';

// Import Screens Doanh nghiệp (Ta sẽ tạo sau)
import AddProductScreen from '../screens/AddProductScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
// import SellerDashboardScreen from '../screens/SellerDashboardScreen'; 

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- LUỒNG DÀNH CHO KHÁCH HÀNG ---
function CustomerTabs() {
    return (
        <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#FF6F00', headerStyle: { backgroundColor: '#FF6F00' }, headerTintColor: '#fff' }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Khám phá' }} />
            <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
            <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Tin nhắn' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
        </Tab.Navigator>
    );
}

function CustomerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: true, title: 'Chi tiết sản phẩm' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, title: 'Thanh toán' }} />
        </Stack.Navigator>
    );
}

// --- LUỒNG DÀNH CHO DOANH NGHIỆP ---
function SellerTabs() {
    return (
        <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2E7D32', headerStyle: { backgroundColor: '#2E7D32' }, headerTintColor: '#fff' }}>
            {/* Tab 1: Quản lý đơn hàng */}
            <Tab.Screen
                name="Dashboard"
                component={SellerDashboardScreen}
                options={{ title: 'Đơn Hàng' }}
            />

            {/* Tab 2: Đăng sản phẩm mới */}
            <Tab.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{ title: 'Lên Kệ' }}
            />

            {/* Tab 3: Tin nhắn */}
            <Tab.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{ title: 'Tin nhắn' }}
            />

            {/* Tab 4: Hồ sơ / Đăng xuất */}
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Cửa hàng' }}
            />
        </Tab.Navigator>
    );
}

// --- BỘ ĐIỀU HƯỚNG TỔNG ---
export default function AppNavigator() {
    const { currentUser } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {currentUser === null ? (
                <Stack.Group>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Group>
            ) : (
                <Stack.Group>
                    {/* ĐÂY LÀ CHÌA KHÓA: Chia luồng dựa vào Role */}
                    {currentUser.role === 'business' ? (
                        <Stack.Screen name="SellerFlow" component={SellerTabs} />
                    ) : (
                        <Stack.Screen name="CustomerFlow" component={CustomerStack} />
                    )}

                    {/* Các màn hình dùng chung cho cả 2 luồng */}
                    <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Trò chuyện' }} />
                    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: true, title: 'Lịch sử đơn hàng' }} />
                    <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: true, title: 'Mục yêu thích' }} />
                    <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: true, title: 'Đánh giá sản phẩm' }} />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}