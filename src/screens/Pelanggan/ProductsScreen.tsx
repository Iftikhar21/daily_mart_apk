// screens/Pelanggan/ProductsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';
import { Heart, ShoppingCart, Search, SlidersHorizontal } from 'lucide-react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';

interface Product {
    id: number;
    nama_produk: string;
    harga: number;
    gambar_url: string;
    kategori?: string;
    stok: number;
}

export default function ProductsList({ navigation }: any) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const { favorites, toggleFavorite } = useFavorites();
    const { cartItems, addToCart, removeFromCart, updatingCart, cartCount } = useCart();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log('=== START FETCH CATEGORIES ===');

                const token = await AsyncStorage.getItem('token');
                console.log('Token:', token ? 'Exists' : 'Missing');

                if (!token) {
                    console.log('No token found, skipping categories fetch');
                    return;
                }

                console.log('Making API call to /categories...');
                const res = await api.get('/categories', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                });

                console.log('Categories API Response Status:', res.status);
                console.log('Categories API Response Data:', res.data);

                if (res.data && Array.isArray(res.data)) {
                    const categoryList = ['All', ...res.data.map((cat: any) => cat.nama_kategori)];
                    console.log('Formatted categories:', categoryList);
                    setCategories(categoryList);
                } else {
                    console.log('Unexpected response format:', res.data);
                    setCategories(['All', 'Makanan', 'Minuman', 'Snack']);
                }

            } catch (e: any) {
                console.log('=== ERROR FETCHING CATEGORIES ===');
                console.log('Error message:', e.message);
                console.log('Error response:', e.response?.data);
                console.log('Error status:', e.response?.status);
                console.log('Error headers:', e.response?.headers);

                // Fallback categories
                setCategories(['All', 'Makanan', 'Minuman', 'Snack']);
            }
        };

        const fetchProducts = async () => {
            try {
                console.log('=== START FETCH PRODUCTS ===');

                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const res = await api.get('/pelanggan/products', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Products fetched successfully');
                setProducts(res.data.products);

            } catch (e: any) {
                console.log('Error fetching products:', e.response?.data || e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
        fetchProducts();
    }, []);

    // Cek apakah produk ada di keranjang
    const isInCart = (productId: number) => {
        return cartItems.some(item => item.product_id === productId);
    };

    // Toggle cart (tambah/hapus)
    const toggleCart = async (productId: number) => {
        try {
            if (isInCart(productId)) {
                // Jika sudah di keranjang, hapus
                await removeFromCart(productId);
                Alert.alert('Sukses', 'Produk dihapus dari keranjang');
            } else {
                // Jika belum di keranjang, tambahkan
                await addToCart(productId);
                Alert.alert('Sukses', 'Produk berhasil ditambahkan ke keranjang!', [
                    { text: 'OK', style: 'default' },
                    {
                        text: 'Lihat Keranjang',
                        style: 'default',
                        onPress: () => navigation.navigate('Cart')
                    }
                ]);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan';
            Alert.alert('Error', errorMessage);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchCategory = selectedCategory === 'All' || product.kategori === selectedCategory;
        const matchSearch = product.nama_produk.toLowerCase().includes(searchText.toLowerCase());
        return matchCategory && matchSearch;
    });

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* SEARCH BAR & CART BUTTON */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity style={styles.filterButton}>
                        <SlidersHorizontal size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <ShoppingCart size={24} color="white" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>
                                {cartCount > 9 ? '9+' : cartCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* KATEGORI */}
            <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedCategory(item)}
                        style={[
                            styles.categoryButton,
                            selectedCategory === item && styles.categoryButtonActive
                        ]}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === item && styles.categoryTextActive
                            ]}
                        >
                            {item}
                        </Text>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
            />

            {/* GRID PRODUK */}
            <FlatList
                data={filteredProducts}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image
                            source={{ uri: item.gambar_url }}
                            style={styles.image}
                        />

                        <Text style={styles.name} numberOfLines={2}>
                            {item.nama_produk}
                        </Text>

                        <Text style={styles.price}>
                            Rp. {item.harga.toLocaleString('id-ID')}
                        </Text>

                        <Text style={styles.stock}>
                            Stok: {item.stok}
                        </Text>

                        {/* ICON LOVE + CART */}
                        <View style={styles.iconRow}>
                            <TouchableOpacity
                                onPress={() => toggleFavorite(item.id)}
                                style={styles.iconButton}
                            >
                                <Heart
                                    size={20}
                                    color={favorites.includes(item.id) ? '#10B981' : '#10B981'}
                                    fill={favorites.includes(item.id) ? '#10B981' : 'none'}
                                    strokeWidth={2}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => toggleCart(item.id)}
                                style={[
                                    styles.iconButton,
                                    styles.cartIconButton,
                                    isInCart(item.id) && styles.cartIconButtonActive
                                ]}
                                disabled={updatingCart === item.id || item.stok === 0}
                            >
                                {updatingCart === item.id ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <ShoppingCart
                                        size={20}
                                        color="white"
                                        strokeWidth={2}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Tampilkan status stok habis */}
                        {item.stok === 0 && (
                            <View style={styles.outOfStockOverlay}>
                                <Text style={styles.outOfStockText}>Stok Habis</Text>
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

// Styles tetap sama seperti sebelumnya...
const styles = StyleSheet.create({
    // ... (styles dari code sebelumnya)
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    filterButton: {
        padding: 4,
    },
    cartButton: {
        width: 50,
        height: 50,
        backgroundColor: '#10B981',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#E5E5E5',
        borderRadius: 20,
        marginRight: 10,
        height: 36,
        justifyContent: 'center',
    },
    categoryButtonActive: {
        backgroundColor: '#10B981',
    },
    categoryText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    categoryTextActive: {
        color: 'white',
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 8,
        resizeMode: 'contain',
        backgroundColor: '#F9FAFB',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
        lineHeight: 18,
    },
    price: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
        marginBottom: 4,
    },
    stock: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    cartIconButton: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    cartIconButtonActive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    outOfStockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});