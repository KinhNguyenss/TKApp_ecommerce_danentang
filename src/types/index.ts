import { User } from 'firebase/auth';

export interface AppUser extends User {
  role?: 'customer' | 'business' | 'admin';
  hoTen?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  quantity?: number; // Số lượng tồn kho
  soldCount?: number; // Số lượng đã bán
  sellerId?: string;
  sellerName?: string;
  tags?: string[];
}

export interface CartItem extends Product {
  cartQuantity: number; // Số lượng trong giỏ
}