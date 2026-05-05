// src/navigation/AppNavigator.tsx
import React from 'react';
import { Text, TouchableOpacity, Alert, Image, View } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Import Screens chung
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import WishlistScreen from '../screens/customer/WishlistScreen';
import ReviewScreen from '../screens/customer/ReviewScreen';
import PublicShopScreen from '../screens/customer/PublicShopScreen';

// Import Screens Khách hàng
import HomeScreen from '../screens/customer/HomeScreen';
import CartScreen from '../screens/customer/CartScreen';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';

// Import Screens Doanh nghiệp
import AddProductScreen from '../screens/seller/AddProductScreen';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import SellerProfileScreen from '../screens/seller/SellerProfileScreen';
import SellerWalletScreen from '../screens/seller/SellerWalletScreen';

// Import Screens Admin
import AdminReconcileScreen from '../screens/admin/AdminReconcileScreen';
import AdminPayoutScreen from '../screens/admin/AdminPayoutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HeaderLogo = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 120, height: 35, resizeMode: 'contain' }} 
        />
    </View>
);

// --- LUỒNG DÀNH CHO KHÁCH HÀNG ---
function CustomerTabs() {
    return (
        <Tab.Navigator screenOptions={{
            tabBarActiveTintColor: '#FF6F00',
            tabBarInactiveTintColor: '#9CA3AF',
            headerStyle: { backgroundColor: '#FF6F00' },
            headerTintColor: '#fff',
            headerTitle: () => <HeaderLogo />,
            tabBarStyle: { height: 60, paddingBottom: 8 },
            tabBarLabelStyle: { fontSize: 11 }
        }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Khám phá', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
            <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🛒</Text> }} />
            <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Tin nhắn', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💬</Text> }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
        </Tab.Navigator>
    );
}

function CustomerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        </Stack.Navigator>
    );
}

// --- LUỒNG DÀNH CHO DOANH NGHIỆP ---
function SellerTabs() {
    return (
        <Tab.Navigator screenOptions={{
            tabBarActiveTintColor: '#2E7D32',
            tabBarInactiveTintColor: '#9CA3AF',
            headerStyle: { backgroundColor: '#2E7D32' },
            headerTintColor: '#fff',
            headerTitle: () => <HeaderLogo />,
            tabBarStyle: { height: 60, paddingBottom: 8 },
            tabBarLabelStyle: { fontSize: 11 }
        }}>
            <Tab.Screen
                name="Dashboard"
                component={SellerDashboardScreen}
                options={{ title: 'Đơn Hàng', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📦</Text> }}
            />
            <Tab.Screen
                name="SellerProducts"
                component={SellerProductsScreen}
                options={{ title: 'Sản Phẩm', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎪</Text> }}
            />
            <Tab.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{ title: 'Thêm Hàng', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>➕</Text> }}
            />
            <Tab.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💬</Text> }}
            />
            <Tab.Screen
                name="SellerWallet"
                component={SellerWalletScreen}
                options={{ title: 'Ví Tiền', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text> }}
            />
            <Tab.Screen
                name="SellerProfile"
                component={SellerProfileScreen}
                options={{ title: 'Hồ Sơ Shop', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏪</Text> }}
            />
        </Tab.Navigator>
    );
}

// --- LUỒNG DÀNH CHO ADMIN ---
function AdminTabs() {
    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() }
        ]);
    };

    return (
        <Tab.Navigator screenOptions={{
            tabBarActiveTintColor: '#1565C0',
            tabBarInactiveTintColor: '#9CA3AF',
            headerStyle: { backgroundColor: '#1A237E' },
            headerTintColor: '#fff',
            headerTitle: () => <HeaderLogo />,
            headerTitleStyle: { fontWeight: 'bold' },
            tabBarStyle: { height: 60, paddingBottom: 8 },
            tabBarLabelStyle: { fontSize: 11 },
            headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>🚪 Đăng xuất</Text>
                </TouchableOpacity>
            )
        }}>
            <Tab.Screen
                name="AdminReconcile"
                component={AdminReconcileScreen}
                options={{
                    title: 'Đối Soát COD',
                    headerTitle: '🔍 Đối Soát COD',
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>💵</Text>
                }}
            />
            <Tab.Screen
                name="AdminPayout"
                component={AdminPayoutScreen}
                options={{
                    title: 'Giải Ngân',
                    headerTitle: '💸 Giải Ngân Seller',
                    tabBarIcon: () => <Text style={{ fontSize: 20 }}>💸</Text>
                }}
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
                    {/* Chia luồng dựa vào Role */}
                    {currentUser.role === 'admin' ? (
                        <Stack.Screen
                            name="AdminFlow"
                            component={AdminTabs}
                            options={{ headerShown: false }}
                        />
                    ) : currentUser.role === 'business' ? (
                        <Stack.Screen name="SellerFlow" component={SellerTabs} />
                    ) : (
                        <Stack.Screen name="CustomerFlow" component={CustomerStack} />
                    )}

                    {/* Các màn hình dùng chung */}
                    <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                    <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                    <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                    <Stack.Screen name="PublicShop" component={PublicShopScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, headerTitle: () => <HeaderLogo /> }} />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}