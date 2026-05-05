import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { WishlistProvider } from './src/contexts/WishlistContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { seedProducts } from './src/utils/seedData'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <StripeProvider publishableKey="pk_test_51TT3yY9Z1PyjH7pbZx8hIdD1HWeAbkqQ6AlvdMxTFxCHEL5YMqxqn0AOzy1Vf0jVrPcmQynQyWxoFkVjH0XUdhKK00F4gBRcNa">
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </StripeProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}