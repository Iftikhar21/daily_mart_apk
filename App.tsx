// App.tsx
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { CartProvider } from './src/context/CartContext';
import { TransactionProvider } from './src/context/TransactionContext';

export default function App() {
  return (
    <TransactionProvider>
      <FavoritesProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </FavoritesProvider>
    </TransactionProvider>
  );
}