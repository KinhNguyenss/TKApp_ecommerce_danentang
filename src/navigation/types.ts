// src/navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  category?: string;
  quantity?: number;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

// Định nghĩa tham số cho tất cả các màn hình
export type RootStackParamList = {
  Home: undefined;
  Cart: undefined;
  Wishlist: undefined;
  Profile: undefined;
  Login: undefined;
  Register: undefined;
  ProductDetail: { product: Product }; // Cần truyền data sản phẩm vào
  Checkout: undefined; // Checkout hiện tại lấy data từ Context nên không cần truyền param
  OrderHistory: undefined;
  OrderDetail: { orderId: string }; // Truyền ID của đơn hàng để xem chi tiết
};

export type AppNavigationProp = StackNavigationProp<RootStackParamList>;