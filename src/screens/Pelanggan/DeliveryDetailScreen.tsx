import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { ArrowLeft, MapPin, Package, Truck, Clock, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';
import { useTransactions } from '../../context/TransactionContext';

export default function DeliveryDetailScreen({ navigation, route }: any) {
    const { transactionId } = route.params;
    const { getTransactionById, refreshTransactions, refreshing, updateTransactionStatus } = useTransactions();
    const [loading, setLoading] = useState(false);

    // Get transaction from context - DATA REALTIME
    const transaction = getTransactionById(transactionId);

    useEffect(() => {
        // Jika transaction tidak ditemukan di context, refresh data
        if (!transaction) {
            refreshTransactions();
        }
    }, [transaction, transactionId]);

    const loadTransactionDetail = async () => {
        try {
            setLoading(true);
            await refreshTransactions();
        } catch (error: any) {
            console.log('Error loading transaction detail:', error);
            Alert.alert('Error', 'Gagal memuat detail pengiriman');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper functions untuk status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered':
            case 'completed': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'cancelled': return '#EF4444';
            case 'assigned':
            case 'picked_up': return '#3B82F6';
            case 'on_delivery': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const getDeliveryStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Menunggu Pickup';
            case 'assigned': return 'Kurir Ditugaskan';
            case 'picked_up': return 'Diambil Kurir';
            case 'on_delivery': return 'Dalam Pengiriman';
            case 'delivered': return 'Terkirim';
            case 'completed': return 'Selesai';
            default: return status;
        }
    };

    const handleCompleteOrder = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            await api.put(`/transactions/${transactionId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Update status di context secara realtime
            updateTransactionStatus(transactionId, 'completed');

            Alert.alert('Berhasil', 'Pesanan telah diselesaikan');
        } catch (error: any) {
            console.log('Error completing order:', error);
            Alert.alert('Error', 'Gagal menyelesaikan pesanan');
        } finally {
            setLoading(false);
        }
    };

    // Refresh control untuk pull-to-refresh
    const onRefresh = () => {
        refreshTransactions();
    };

    if ((loading && !transaction) || refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Memuat detail pengiriman...</Text>
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Data pengiriman tidak ditemukan</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Aktivitas</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#10B981']}
                        tintColor="#10B981"
                    />
                }
            >
                {/* Informasi Transaksi */}
                <View style={styles.section}>
                    <Text style={styles.transactionInfo}>
                        Transaksi #{transaction.id}
                    </Text>
                    <Text style={styles.transactionDate}>
                        {formatDate(transaction.created_at)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.delivery_status) + '20' }]}>
                        <Text style={[
                            styles.statusText,
                            { color: getStatusColor(transaction.delivery_status) }
                        ]}>
                            {getDeliveryStatusText(transaction.delivery_status)}
                        </Text>
                    </View>
                </View>

                {/* Lokasi Cabang */}
                <View style={styles.section}>
                    <Text style={styles.branchName}>
                        {transaction.branch?.nama_cabang || 'Cabang'}
                    </Text>
                    <View style={styles.locationInfo}>
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.distanceText}>Distance ke rumah</Text>
                    </View>
                    <Text style={styles.addressText}>
                        {transaction.branch?.alamat || 'Alamat cabang tidak tersedia'}
                    </Text>
                </View>

                {/* Daftar Pesanan */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pesan</Text>
                    <View style={styles.itemsList}>
                        {transaction.details.map((detail) => (
                            <View key={detail.id} style={styles.itemRow}>
                                <Text style={styles.itemName}>
                                    {detail.product.nama_produk}
                                </Text>
                                <Text style={styles.itemQty}>x{detail.qty}</Text>
                                <Text style={styles.itemPrice}>
                                    {formatCurrency(detail.product.harga)}
                                </Text>
                            </View>
                        ))}
                        {/* Ongkir */}
                        <View style={styles.itemRow}>
                            <Text style={styles.itemName}>Ongkir</Text>
                            <Text style={styles.itemPrice}>Rp 15.000</Text>
                        </View>
                    </View>

                    {/* Total */}
                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>
                            {formatCurrency(transaction.total)}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Status Pengiriman */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Status Pengiriman</Text>

                    {/* Status Steps */}
                    <View style={styles.statusSteps}>
                        {/* Menunggu Pickup */}
                        <View style={styles.statusStep}>
                            <View style={[
                                styles.statusCheckbox,
                                ['pending', 'assigned', 'picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status)
                                && styles.checkedCheckbox
                            ]}>
                                {['pending', 'assigned', 'picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status) && (
                                    <CheckCircle size={16} color="#10B981" />
                                )}
                            </View>
                            <Text style={styles.statusText}>Menunggu Pickup</Text>
                        </View>

                        {/* Dalam Pengantaran */}
                        <View style={styles.statusStep}>
                            <View style={[
                                styles.statusCheckbox,
                                ['assigned', 'picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status)
                                && styles.checkedCheckbox
                            ]}>
                                {['assigned', 'picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status) && (
                                    <CheckCircle size={16} color="#10B981" />
                                )}
                            </View>
                            <Text style={styles.statusText}>Dalam Pengantaran</Text>
                        </View>

                        {/* Driver menuju lokasi */}
                        <View style={styles.statusStep}>
                            <View style={[
                                styles.statusCheckbox,
                                ['picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status)
                                && styles.checkedCheckbox
                            ]}>
                                {['picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status) && (
                                    <CheckCircle size={16} color="#10B981" />
                                )}
                            </View>
                            <Text style={styles.statusText}>
                                Driver menuju {transaction.pelanggan?.alamat || 'Alamat'}
                            </Text>
                        </View>
                    </View>

                    {/* Info Kurir jika sudah di-pickup */}
                    {(transaction.delivery_status === 'picked_up' || transaction.delivery_status === 'on_delivery') && transaction.kurir && (
                        <View style={styles.kurirInfo}>
                            <Text style={styles.kurirText}>
                                Kurir: {transaction.kurir.user.name}
                            </Text>
                        </View>
                    )}

                    {/* Button Selesaikan Pesanan jika delivered */}
                    {transaction.delivery_status === 'delivered' && transaction.status !== 'completed' && (
                        <TouchableOpacity
                            style={styles.completeButton}
                            onPress={handleCompleteOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <CheckCircle size={20} color="#FFF" />
                                    <Text style={styles.completeButtonText}>Selesaikan Pesanan</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Status completed */}
                    {transaction.status === 'completed' && (
                        <View style={styles.completedInfo}>
                            <CheckCircle size={20} color="#10B981" />
                            <Text style={styles.completedText}>Pesanan telah diselesaikan</Text>
                        </View>
                    )}
                </View>

                {/* Delivery Updates */}
                {transaction.delivery_updates && transaction.delivery_updates.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Update Pengiriman</Text>
                        <View style={styles.updatesList}>
                            {transaction.delivery_updates
                                .slice()
                                .reverse()
                                .map((update, index) => (
                                    <View key={update.id} style={styles.updateItem}>
                                        <View style={styles.updateContent}>
                                            <Text style={styles.updateMessage}>
                                                {update.status_message}
                                            </Text>
                                            <Text style={styles.updateTime}>
                                                {formatTime(update.created_at)}
                                            </Text>
                                        </View>
                                        {index < transaction.delivery_updates!.length - 1 && (
                                            <View style={styles.updateConnector} />
                                        )}
                                    </View>
                                ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
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
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 16,
    },
    backButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    transactionInfo: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    branchName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    distanceText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
    },
    addressText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    itemsList: {
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
        color: '#374151',
        flex: 2,
    },
    itemQty: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 8,
    },
    itemPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
        textAlign: 'right',
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    statusSteps: {
        gap: 16,
    },
    statusStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedCheckbox: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    kurirInfo: {
        marginTop: 12,
        padding: 8,
        backgroundColor: '#F0F9FF',
        borderRadius: 6,
    },
    kurirText: {
        fontSize: 12,
        color: '#0369A1',
        fontWeight: '500',
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 12,
    },
    completeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    completedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 12,
    },
    completedText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    updatesList: {
        marginTop: 8,
    },
    updateItem: {
        marginBottom: 12,
    },
    updateContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    updateMessage: {
        fontSize: 12,
        color: '#374151',
        flex: 2,
    },
    updateTime: {
        fontSize: 11,
        color: '#6B7280',
        flex: 1,
        textAlign: 'right',
    },
    updateConnector: {
        width: 2,
        height: 8,
        backgroundColor: '#E5E7EB',
        marginLeft: 9,
        marginTop: 2,
    },
});