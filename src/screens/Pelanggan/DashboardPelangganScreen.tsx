import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🧱 Definisikan tipe data
interface Branch {
    id: number;
    nama_cabang: string;
}

interface Kategori {
    id: number;
    nama_kategori: string;
}

interface Product {
    id: number;
    nama_produk: string;
    kategori?: Kategori;
    harga: number;
    gambar_url: string;
    branch?: Branch;
}

export default function DashboardPelanggan() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [categoryName, setCategoryName] = useState('');

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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    console.log('Token tidak ditemukan, harap login ulang.');
                    setLoading(false);
                    return;
                }

                const response = await api.get('/pelanggan/products', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = response.data.products || [];
                setProducts(data);

                if (data.length > 0) {
                    const firstBranch = data[0].branch?.nama_cabang || '';
                    setBranchName(firstBranch);
                    const firstCategory = data[0].kategori?.nama_kategori || '';
                    setCategoryName(firstCategory);
                }
            } catch (error: any) {
                console.error('Gagal mengambil produk:', error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={{ marginTop: 10 }}>Memuat produk...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Hai, {userName || 'Pelanggan'} 👋</Text>
            <Text style={styles.subHeader}>🧑‍💼 Produk Cabang {branchName || '-'}</Text>

            {products.length === 0 ? (
                <Text style={styles.empty}>Belum ada produk untuk cabang ini.</Text>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: item.gambar_url }} style={styles.image} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.nama_produk}</Text>
                                <Text style={styles.category}>Kategori: {item.kategori?.nama_kategori || '-'}</Text>
                                <Text style={styles.price}>Rp {item.harga.toLocaleString('id-ID')}</Text>
                                <Text style={styles.branch}>Cabang: {item.branch?.nama_cabang || '-'}</Text>
                            </View>
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
    category: { color: '#666', fontSize: 12, marginTop: 2 },
});
