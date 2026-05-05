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
  quantity?: number; // Số lượng tồn kho
}

export interface CartItem extends Product {
  cartQuantity: number; // Số lượng trong giỏ
}