import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { Product, CartItem } from '../types';

interface CartContextProps {
    cartItems: CartItem[];
    addToCart: (p: Product) => { success: boolean; msg?: string };
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalPrice: number;
}

export const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (product: Product) => {
        if (!currentUser || currentUser.isAnonymous) {
            return { success: false, msg: 'Vui lòng đăng nhập để mua hàng!' };
        }
        setCartItems(prev => {
            const exists = prev.find(i => i.id === product.id);
            if (exists) return prev.map(i => i.id === product.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
            return [...prev, { ...product, cartQuantity: 1 }];
        });
        return { success: true };
    };

    const removeFromCart = (productId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev => prev.map(item => item.id === productId ? { ...item, cartQuantity: quantity } : item));
    };

    const totalPrice = cartItems.reduce((s, i) => s + i.price * i.cartQuantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart: () => setCartItems([]), totalPrice }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext)!!;