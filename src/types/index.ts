import { User } from 'firebase/auth';

export interface AppUser extends User {
  role?: 'customer' | 'business';
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
  sellerId?: string;
  sellerName?: string;
}

export interface CartItem extends Product {
  cartQuantity: number; // Số lượng trong giỏ
}