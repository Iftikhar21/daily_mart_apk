import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { ArrowLeft, MapPin, Store, CreditCard, Smartphone, QrCode } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';
import { useCart } from '../../context/CartContext';

interface CartItem {
    id: number;
    product_id: number;
    qty: number;
    product: {
        id: number;
        nama_produk: string;
        harga: number;
        gambar: string;
    };
}

interface Branch {
    id: number;
    nama_cabang: string;
    alamat: string;
}

export default function CheckoutScreen({ navigation, route }: any) {
    const [selectedPayment, setSelectedPayment] = useState('transfer');
    const [loading, setLoading] = useState(false);
    const [branch, setBranch] = useState<Branch | null>(null);
    const { refreshCart } = useCart();

    // Data dari navigation params atau context
    const cartItems: CartItem[] = route.params?.cartItems || [];
    const total = route.params?.total || 0;

    useEffect(() => {
        loadBranchInfo();
    }, []);

    const loadBranchInfo = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');

            if (userData) {
                const user = JSON.parse(userData);
                // Jika user memiliki branch_id, load branch info
                if (user.pelanggan?.branch_id) {
                    const response = await api.get(`/branches/${user.pelanggan.branch_id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setBranch(response.data);
                }
            }
        } catch (error) {
            console.log('Error loading branch info:', error);
        }
    };

    const paymentMethods = [
        {
            id: 'transfer',
            name: 'Transfer Bank',
            description: 'Transfer ke rekening bank',
            icon: CreditCard,
            color: '#3B82F6',
            bgColor: '#FFFFFF',
        },
        {
            id: 'ewallet',
            name: 'E-Wallet',
            description: 'GoPay, OVO, Dana, dll',
            icon: Smartphone,
            color: '#8B5CF6',
            bgColor: '#FFFFFF',
        },
        {
            id: 'cash',
            name: 'Cash',
            description: 'Bayar di tempat',
            icon: QrCode,
            color: '#10B981',
            bgColor: '#FFFFFF',
        },
    ];

    // Di CheckoutScreen, ganti bagian handleCheckout:
    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Error', 'Keranjang belanja kosong');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Silakan login terlebih dahulu');
                navigation.navigate('Login');
                return;
            }

            // Kirim ke API sesuai pilihan user
            const response = await api.post('/transactions/online/checkout',
                {
                    payment_method: selectedPayment
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            await refreshCart(); // Hapus cart
            const transaction = response.data.data;

            // 👉 Kalau e-wallet, masuk QRIS
            if (selectedPayment === 'ewallet') {
                navigation.navigate('Payment', {
                    transaction: transaction,
                    total: total
                });
            } else {
                // 👉 Selain e-wallet (transfer/cash), cukup tampilkan alert selesai
                Alert.alert(
                    "Berhasil",
                    "Pesanan berhasil dibuat.",
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate("DashboardPelanggan"),
                        }
                    ]
                );
            }

        } catch (error: any) {
            console.log('Checkout error:', error.response?.data || error);
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat checkout';
            Alert.alert('Checkout Gagal', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getPaymentMethodName = (methodId: string) => {
        const method = paymentMethods.find(m => m.id === methodId);
        return method ? method.name : 'Transfer Bank';
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* OUTLET & PICKUP INFO */}
                <View style={styles.locationCard}>
                    <View style={styles.locationRow}>
                        <MapPin size={20} color="#10B981" />
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>Outlet</Text>
                            <Text style={styles.locationValue}>
                                {branch?.nama_cabang || 'Cabang Utama'}
                            </Text>
                            <Text style={styles.locationAddress}>
                                {branch?.alamat || 'Alamat tidak tersedia'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.locationRow, { marginTop: 12 }]}>
                        <Store size={20} color="#10B981" />
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>Metode Pengiriman</Text>
                            <Text style={styles.locationValue}>Delivery ke Alamat</Text>
                            <Text style={styles.locationAddress}>
                                Pesanan akan dikirim ke alamat Anda
                            </Text>
                        </View>
                    </View>
                </View>

                {/* PESANAN */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detail Pesanan</Text>

                    {cartItems.map((item) => (
                        <View key={item.id} style={styles.orderRow}>
                            <View style={styles.orderInfo}>
                                <Text style={styles.orderName}>{item.product.nama_produk}</Text>
                                <Text style={styles.orderQty}>x{item.qty}</Text>
                            </View>
                            <Text style={styles.orderPrice}>
                                Rp {(item.product.harga * item.qty).toLocaleString('id-ID')}
                            </Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Pembayaran:</Text>
                        <Text style={styles.totalValue}>
                            Rp {total.toLocaleString('id-ID')}
                        </Text>
                    </View>
                </View>

                {/* METODE PEMBAYARAN */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
                    </View>

                    {paymentMethods.map((method) => {
                        const IconComponent = method.icon;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.paymentCard,
                                    selectedPayment === method.id && styles.paymentCardSelected
                                ]}
                                onPress={() => setSelectedPayment(method.id)}
                            >
                                <View style={styles.paymentLeft}>
                                    <View style={[styles.paymentIcon, { backgroundColor: method.color }]}>
                                        <IconComponent size={20} color="white" />
                                    </View>
                                    <View>
                                        <Text style={styles.paymentName}>
                                            {method.name}
                                        </Text>
                                        <Text style={styles.paymentDesc}>
                                            {method.description}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.radioButton}>
                                    {selectedPayment === method.id && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* TERMS & CONDITIONS */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsText}>
                        Dengan melanjutkan, saya menyetujui{' '}
                        <Text style={styles.termsLink}>Syarat & Ketentuan</Text>{' '}
                        dan <Text style={styles.termsLink}>Kebijakan Privasi</Text>
                    </Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* BOTTOM BUTTON */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomInfo}>
                    <Text style={styles.bottomLabel}>Total Pembayaran</Text>
                    <Text style={styles.bottomTotal}>
                        Rp {total.toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.bottomMethod}>
                        {getPaymentMethodName(selectedPayment)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.payButton,
                        loading && styles.payButtonDisabled
                    ]}
                    onPress={handleCheckout}
                    disabled={loading || cartItems.length === 0}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            Bayar Sekarang
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },

    // HEADER
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },

    // CONTENT
    content: {
        flex: 1,
    },

    // LOCATION CARD
    locationCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationInfo: {
        marginLeft: 12,
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    locationValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 13,
        color: '#6B7280',
    },

    // SECTION
    section: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },

    // ORDER
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderName: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    orderQty: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
    },
    orderPrice: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
    },

    // PAYMENT
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        backgroundColor: 'white',
    },
    paymentCardSelected: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    paymentDesc: {
        fontSize: 12,
        color: '#6B7280',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
    },

    // TERMS
    termsSection: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    termsText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
    },
    termsLink: {
        color: '#10B981',
        fontWeight: '600',
    },

    // BOTTOM BAR
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    bottomInfo: {
        flex: 1,
    },
    bottomLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    bottomTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 2,
    },
    bottomMethod: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    payButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        minWidth: 140,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowColor: '#9CA3AF',
    },
    payButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
});