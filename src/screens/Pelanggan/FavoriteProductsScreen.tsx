// FavoriteProducts.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';
import { Heart } from 'lucide-react-native';
import { useFavorites } from '../../context/FavoritesContext';

interface Branch {
    id: number;
    nama_cabang: string;
}

interface Product {
    id: number;
    nama_produk: string;
    harga: number;
    gambar_url: string;
    branch?: Branch;
}

export default function FavoriteProducts() {
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    // Gunakan favorites dari context
    const { favorites, toggleFavorite } = useFavorites();

    useEffect(() => {
        const getUser = async () => {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                setUserName(user.name);
            }
        };
        getUser();
    }, []);

    // Fetch detail produk favorit
    useEffect(() => {
        const fetchFavoriteProducts = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const response = await api.get('/favorites', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setFavoriteProducts(response.data);
            } catch (error: any) {
                console.error('Gagal memuat produk favorit:', error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFavoriteProducts();
    }, [favorites]); // Reload ketika favorites berubah

    const removeFavorite = async (id: number) => {
        try {
            // Gunakan toggleFavorite dari context untuk konsistensi
            await toggleFavorite(id);
            Alert.alert('Berhasil', 'Produk dihapus dari favorit');
        } catch (error: any) {
            console.error('Gagal menghapus favorit:', error.response?.data || error.message);
            Alert.alert('Error', 'Gagal menghapus dari favorit');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={{ marginTop: 10 }}>Memuat produk favorit...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Hai, {userName || 'Pelanggan'} ❤️</Text>
            <Text style={styles.subHeader}>Daftar Produk Favoritmu</Text>

            {favoriteProducts.length === 0 ? (
                <Text style={styles.empty}>Belum ada produk favorit.</Text>
            ) : (
                <FlatList
                    data={favoriteProducts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: item.gambar_url }} style={styles.image} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.nama_produk}</Text>
                                <Text style={styles.branch}>
                                    Cabang: {item.branch?.nama_cabang || '-'}
                                </Text>
                                <Text style={styles.price}>
                                    Rp {item.harga.toLocaleString('id-ID')}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => removeFavorite(item.id)}
                                style={styles.iconButton}
                            >
                                <Heart size={24} color="red" fill="red" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center', color: '#333' },
    subHeader: { fontSize: 16, textAlign: 'center', marginBottom: 12, color: '#555' },
    empty: { textAlign: 'center', color: '#999', marginTop: 20 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    image: { width: 70, height: 70, borderRadius: 6, marginRight: 10 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    price: { color: '#28a745', fontWeight: '600', marginTop: 2 },
    branch: { color: '#666', fontSize: 12, marginTop: 4 },
    iconButton: { padding: 6 },
});
