// context/CartContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

interface CartContextType {
    cartCount: number;
    cartItems: any[];
    refreshCart: () => Promise<void>;
    addToCart: (productId: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    updatingCart: number | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [updatingCart, setUpdatingCart] = useState<number | null>(null);

    // Fungsi untuk refresh cart dari server
    const refreshCart = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await api.get('/cart', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCartItems(response.data.items);
            setCartCount(response.data.items.length);
        } catch (error) {
            console.log('Gagal memuat keranjang:', error);
        }
    };

    // Fungsi tambah ke keranjang
    const addToCart = async (productId: number) => {
        setUpdatingCart(productId);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Token tidak ditemukan');

            await api.post('/cart/add',
                { product_id: productId, qty: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh cart untuk data terbaru
            await refreshCart();
        } catch (error) {
            console.log('Error tambah ke keranjang:', error);
            throw error;
        } finally {
            setUpdatingCart(null);
        }
    };

    // Fungsi hapus dari keranjang
    const removeFromCart = async (productId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            // Cari cart item id berdasarkan product_id
            const cartResponse = await api.get('/cart', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const cartItem = cartResponse.data.items.find((item: any) => item.product_id === productId);
            if (cartItem) {
                await api.delete(`/cart/remove/${cartItem.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Refresh cart untuk data terbaru
                await refreshCart();
            }
        } catch (error) {
            console.log('Error hapus dari keranjang:', error);
            throw error;
        }
    };

    // Load cart pertama kali
    useEffect(() => {
        refreshCart();
    }, []);

    return (
        <CartContext.Provider value={{
            cartCount,
            cartItems,
            refreshCart,
            addToCart,
            removeFromCart,
            updatingCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};