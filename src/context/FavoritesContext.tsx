// contexts/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

interface FavoritesContextType {
    favorites: number[];
    toggleFavorite: (productId: number) => Promise<void>;
    loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    // Load favorites dari API saat app start
    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await api.get('/favorites', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Extract hanya ID produk dari response
            const favoriteIds = response.data.map((product: any) => product.id);
            setFavorites(favoriteIds);
        } catch (error: any) {
            console.error('Gagal memuat favorit:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (productId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            // Optimistic update
            setFavorites(prev =>
                prev.includes(productId)
                    ? prev.filter(id => id !== productId)
                    : [...prev, productId]
            );

            // Panggil API
            await api.post(`/favorites/${productId}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

        } catch (error: any) {
            console.error('Gagal toggle favorite:', error.response?.data || error.message);
            // Rollback optimistic update jika gagal
            setFavorites(prev =>
                prev.includes(productId)
                    ? prev.filter(id => id !== productId)
                    : [...prev, productId]
            );
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, loading }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};