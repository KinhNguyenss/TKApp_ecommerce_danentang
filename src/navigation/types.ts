// src/navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { Product, CartItem } from '../types';

// Định nghĩa tham số cho tất cả các màn hình
export type RootStackParamList = {
  Home: undefined;
  Cart: undefined;
  Wishlist: undefined;
  Profile: undefined;
  Login: undefined;
  Register: undefined;
  ProductDetail: { product: Product }; // Cần truyền data sản phẩm vào
  Checkout: { buyNowProduct?: Product }; // Hỗ trợ Mua ngay hoặc mua từ Giỏ hàng
  OrderHistory: undefined;
  Chat: { sellerId?: string; customerId?: string; initialMessage?: string; chatTitle?: string }; // Màn hình Chat
  ChatList: undefined; // Màn hình Danh sách Chat
  Review: { product: any }; // Màn hình Đánh giá
};

export type AppNavigationProp = StackNavigationProp<RootStackParamList>;