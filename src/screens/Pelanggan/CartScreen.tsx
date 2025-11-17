// screens/CartScreen.tsx - Update dengan useCart
import React, { useEffect } from 'react';
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
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';

export default function CartScreen({ navigation }: any) {
    const {
        cartItems,
        cartCount,
        refreshCart,
        addToCart,
        removeFromCart,
        updatingCart
    } = useCart();

    const [loading, setLoading] = React.useState(false);

    // Hitung total
    const total = cartItems.reduce((sum, item) => {
        return sum + (item.product.harga * item.qty);
    }, 0);

    const updateQuantity = async (itemId: number, newQty: number) => {
        if (newQty < 1) {
            // Hapus item jika quantity 0
            const item = cartItems.find(item => item.id === itemId);
            if (item) {
                await removeFromCart(item.product_id);
            }
            return;
        }

        try {
            // Untuk update quantity, kita hapus dulu lalu tambah dengan quantity baru
            const item = cartItems.find(item => item.id === itemId);
            if (item) {
                await removeFromCart(item.product_id);
                // Tunggu sebentar sebelum menambah kembali
                setTimeout(async () => {
                    for (let i = 0; i < newQty; i++) {
                        await addToCart(item.product_id);
                    }
                }, 100);
            }
        } catch (error) {
            console.log('Error update quantity:', error);
            Alert.alert('Error', 'Gagal update quantity');
            refreshCart(); // Refresh untuk sync dengan server
        }
    };

    const removeItem = async (itemId: number) => {
        Alert.alert(
            'Hapus Item',
            'Yakin ingin menghapus item dari keranjang?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        const item = cartItems.find(item => item.id === itemId);
                        if (item) {
                            await removeFromCart(item.product_id);
                        }
                    }
                }
            ]
        );
    };

    const clearCart = async () => {
        if (cartItems.length === 0) return;

        Alert.alert(
            'Bersihkan Keranjang',
            'Yakin ingin menghapus semua item dari keranjang?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus Semua',
                    style: 'destructive',
                    onPress: async () => {
                        // Hapus semua item satu per satu
                        for (const item of cartItems) {
                            await removeFromCart(item.product_id);
                        }
                    }
                }
            ]
        );
    };

    // Di CartScreen.tsx - update proceedToCheckout function
    const proceedToCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Keranjang Kosong', 'Tambahkan produk terlebih dahulu');
            return;
        }
        navigation.navigate('Checkout', {
            cartItems,
            total
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={{ marginTop: 10 }}>Memuat keranjang...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🛒 Keranjang Belanja ({cartCount})</Text>
                {cartItems.length > 0 && (
                    <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                        <Text style={styles.clearText}>Hapus Semua</Text>
                    </TouchableOpacity>
                )}
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ShoppingBag size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Keranjang belanja kosong</Text>
                    <Text style={styles.emptySubText}>Yuk tambahkan produk favoritmu!</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Product')}
                    >
                        <Text style={styles.shopButtonText}>Belanja Sekarang</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Image
                                    source={{ uri: item.product.gambar }}
                                    style={styles.image}
                                />

                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.product.nama_produk}</Text>
                                    <Text style={styles.productPrice}>
                                        Rp {item.product.harga.toLocaleString('id-ID')}
                                    </Text>
                                    <Text style={styles.stock}>
                                        Stok: {item.product.stok}
                                    </Text>

                                    <View style={styles.quantityContainer}>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateQuantity(item.id, item.qty - 1)}
                                            disabled={updatingCart === item.product_id}
                                        >
                                            <Minus size={16} color="#333" />
                                        </TouchableOpacity>

                                        <Text style={styles.quantityText}>
                                            {updatingCart === item.product_id ? '...' : item.qty}
                                        </Text>

                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateQuantity(item.id, item.qty + 1)}
                                            disabled={updatingCart === item.product_id || item.qty >= item.product.stok}
                                        >
                                            <Plus size={16} color="#333" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.actions}>
                                    <Text style={styles.subtotal}>
                                        Rp {(item.product.harga * item.qty).toLocaleString('id-ID')}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => removeItem(item.id)}
                                    >
                                        <Trash2 size={20} color="#dc3545" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                    />

                    <View style={styles.footer}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Belanja:</Text>
                            <Text style={styles.totalAmount}>
                                Rp {total.toLocaleString('id-ID')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={proceedToCheckout}
                        >
                            <Text style={styles.checkoutButtonText}>Lanjut ke Checkout</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

// Styles tetap sama seperti sebelumnya...

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    clearButton: {
        padding: 8,
    },
    clearText: {
        color: '#dc3545',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    shopButton: {
        backgroundColor: '#007BFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    shopButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: '#28a745',
        fontWeight: '600',
        marginBottom: 4,
    },
    stock: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    quantityButton: {
        padding: 8,
        backgroundColor: '#f8f9fa',
    },
    quantityText: {
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        minWidth: 40,
        textAlign: 'center',
    },
    actions: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    subtotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    deleteButton: {
        padding: 4,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007BFF',
    },
    checkoutButton: {
        backgroundColor: '#28a745',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});