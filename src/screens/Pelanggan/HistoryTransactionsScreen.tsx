import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { ArrowLeft, Package, Clock, CheckCircle, Truck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';
import { useTransactions } from '../../context/TransactionContext';

type TabType = 'transactions' | 'activity';

export default function OrderHistoryScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<TabType>('transactions');
    const {
        transactions,
        loading,
        refreshing,
        refreshTransactions,
        updateTransactionStatus
    } = useTransactions();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
            case 'completed':
            case 'delivered': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'cancelled': return '#EF4444';
            case 'assigned':
            case 'picked_up': return '#3B82F6';
            case 'on_delivery': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid': return 'Dibayar';
            case 'pending': return 'Menunggu Pembayaran';
            case 'completed': return 'Selesai';
            case 'cancelled': return 'Dibatalkan';
            case 'assigned': return 'Kurir Ditugaskan';
            case 'picked_up': return 'Diambil Kurir';
            case 'on_delivery': return 'Dalam Pengiriman';
            case 'delivered': return 'Terkirim';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const handleCompleteOrder = async (transactionId: number) => {
        try {
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
        }
    };

    // Refresh control untuk pull-to-refresh
    const onRefresh = () => {
        refreshTransactions();
    };

    // Render Transactions Tab
    const renderTransactionsTab = () => {
        if (loading && transactions.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.emptyStateText}>Memuat transaksi...</Text>
                </View>
            );
        }

        if (transactions.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Package size={64} color="#9CA3AF" />
                    <Text style={styles.emptyStateTitle}>Belum ada transaksi</Text>
                    <Text style={styles.emptyStateText}>Transaksi Anda akan muncul di sini</Text>
                </View>
            );
        }

        return (
            <ScrollView
                style={styles.tabContent}
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
                {transactions.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionCard}>
                        {/* Baris 1: Total Amount dan Status */}
                        <View style={styles.cardRow}>
                            <Text style={styles.transactionAmount}>
                                {formatCurrency(transaction.total)}
                            </Text>
                            {transaction.status === 'cancelled' ? (
                                <Text style={styles.cancelledBadge}>Dibatalkan</Text>
                            ) : (
                                <Text style={[
                                    styles.statusBadge,
                                    transaction.status === 'completed' && styles.completedBadge,
                                    transaction.status === 'paid' && styles.paidBadge,
                                    transaction.status === 'pending' && styles.pendingBadge,
                                ]}>
                                    {transaction.status === 'completed' ? 'Selesai' :
                                        transaction.status === 'paid' ? 'Dibayar' :
                                            transaction.status === 'pending' ? 'Menunggu' :
                                                getStatusText(transaction.status)}
                                </Text>
                            )}
                        </View>

                        {/* Baris 2: Branch Info dan Date */}
                        <View style={styles.cardRow}>
                            <View style={styles.branchInfo}>
                                <Text style={styles.branchName}>
                                    {transaction.branch?.nama_cabang || 'DailyMart'}
                                </Text>
                                <Text style={styles.transactionDate}>
                                    {formatDate(transaction.created_at)}
                                </Text>
                            </View>

                            {/* Tombol Lihat Detail */}
                            <TouchableOpacity
                                style={styles.detailButton}
                                onPress={() => navigation.navigate('ReceiptDetail', {
                                    transactionId: transaction.id
                                })}
                            >
                                <Text style={styles.detailButtonText}>Lihat Detail</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Garis pemisah */}
                        <View style={styles.divider} />
                    </View>
                ))}
            </ScrollView>
        );
    };

    // Render Activity Tab
    const renderActivityTab = () => {
        // Filter hanya transaksi dengan delivery_status sebelum delivered
        const activeDeliveries = transactions.filter(transaction =>
            transaction.delivery_status !== 'delivered' &&
            transaction.delivery_status !== 'completed' &&
            transaction.status !== 'cancelled'
        );

        if (activeDeliveries.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Truck size={64} color="#9CA3AF" />
                    <Text style={styles.emptyStateTitle}>Belum ada aktivitas</Text>
                    <Text style={styles.emptyStateText}>
                        Tidak ada pesanan yang sedang dalam pengiriman
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView
                style={styles.tabContent}
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
                {activeDeliveries.map((transaction) => (
                    <TouchableOpacity
                        key={transaction.id}
                        style={styles.activityCard}
                        onPress={() => navigation.navigate('DeliveryDetail', {
                            transactionId: transaction.id
                        })}
                    >
                        {/* Header dengan info cabang dan jarak */}
                        <View style={styles.activityHeader}>
                            <View style={styles.branchInfo}>
                                <Text style={styles.branchName}>
                                    {transaction.branch?.nama_cabang || 'Cabang'}
                                </Text>
                                <Text style={styles.distanceText}>
                                    {transaction.branch?.alamat || 'Alamat cabang'}
                                </Text>
                            </View>
                        </View>

                        {/* Daftar produk */}
                        <View style={styles.productsSection}>
                            <Text style={styles.sectionTitle}>Pesan</Text>
                            {transaction.details.map((detail, index) => (
                                <View key={detail.id} style={styles.productRow}>
                                    <Text style={styles.productName}>
                                        {detail.product.nama_produk}
                                    </Text>
                                    <Text style={styles.productQty}>x{detail.qty}</Text>
                                    <Text style={styles.productPrice}>
                                        Rp{detail.product.harga.toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            ))}
                            {/* Ongkir */}
                            <View style={styles.productRow}>
                                <Text style={styles.productName}>Ongkir</Text>
                                <Text style={styles.productPrice}>Rp 15.000</Text>
                            </View>

                            {/* Total */}
                            <View style={styles.totalRow}>
                                <Text style={styles.totalText}>Total:</Text>
                                <Text style={styles.totalAmount}>
                                    Rp{transaction.total.toLocaleString('id-ID')}
                                </Text>
                            </View>
                        </View>

                        {/* Status pengiriman */}
                        <View style={styles.deliveryStatus}>
                            <Text style={styles.statusTitle}>Status</Text>

                            {/* Status Steps */}
                            <View style={styles.statusSteps}>
                                <View style={styles.statusStep}>
                                    <View style={[
                                        styles.statusIcon,
                                        transaction.delivery_status === 'pending' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'assigned' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'picked_up' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'on_delivery' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'delivered' && styles.activeStatusIcon,
                                    ]}>
                                        <Package size={16} color={
                                            ['pending', 'assigned', 'picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status)
                                                ? '#10B981' : '#9CA3AF'
                                        } />
                                    </View>
                                    <Text style={styles.statusText}>Menunggu Pickup</Text>
                                </View>

                                <View style={styles.statusStep}>
                                    <View style={[
                                        styles.statusIcon,
                                        transaction.delivery_status === 'assigned' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'picked_up' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'on_delivery' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'delivered' && styles.activeStatusIcon,
                                    ]}>
                                        <Truck size={16} color={
                                            ['assigned', 'picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status)
                                                ? '#10B981' : '#9CA3AF'
                                        } />
                                    </View>
                                    <Text style={styles.statusText}>Dalam Pengantaran</Text>
                                </View>

                                <View style={styles.statusStep}>
                                    <View style={[
                                        styles.statusIcon,
                                        transaction.delivery_status === 'picked_up' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'on_delivery' && styles.activeStatusIcon,
                                        transaction.delivery_status === 'delivered' && styles.activeStatusIcon,
                                    ]}>
                                        <Clock size={16} color={
                                            ['picked_up', 'on_delivery', 'delivered'].includes(transaction.delivery_status)
                                                ? '#10B981' : '#9CA3AF'
                                        } />
                                    </View>
                                    <Text style={styles.statusText}>Driver menuju {transaction.pelanggan?.alamat || 'Alamat'}</Text>
                                </View>
                            </View>

                            {/* Info Kurir jika sudah di-pickup */}
                            {transaction.kurir && (
                                <View style={styles.kurirInfo}>
                                    <Text style={styles.kurirText}>
                                        Kurir: {transaction.kurir?.user?.name ?? 'Tidak diketahui'}
                                    </Text>
                                </View>
                            )}

                            {/* Button Selesaikan Pesanan jika delivered */}
                            {transaction.delivery_status === 'delivered' && (
                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => handleCompleteOrder(transaction.id)}
                                >
                                    <CheckCircle size={20} color="#FFF" />
                                    <Text style={styles.completeButtonText}>Selesaikan Pesanan</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* TAB NAVIGATION */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
                    onPress={() => setActiveTab('transactions')}
                >
                    <Package size={18} color={activeTab === 'transactions' ? '#10B981' : '#6B7280'} />
                    <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
                        Transaksi
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
                    onPress={() => setActiveTab('activity')}
                >
                    <Truck size={18} color={activeTab === 'activity' ? '#10B981' : '#6B7280'} />
                    <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
                        Aktivitas
                    </Text>
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
                {activeTab === 'transactions' && renderTransactionsTab()}
                {activeTab === 'activity' && renderActivityTab()}
            </View>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#10B981',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#10B981',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    // Transaction Card Styles
    transactionCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    transactionAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    branchInfo: {
        flex: 1,
    },
    branchName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    detailButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    detailButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginTop: 4,
    },

    // Status Badges
    statusBadge: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    completedBadge: {
        backgroundColor: '#F0FDF4',
        color: '#10B981',
    },
    paidBadge: {
        backgroundColor: '#EFF6FF',
        color: '#3B82F6',
    },
    pendingBadge: {
        backgroundColor: '#FFFBEB',
        color: '#F59E0B',
    },
    cancelledBadge: {
        backgroundColor: '#FEF2F2',
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    
    // Activity Card Styles
    activityCard: {
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
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    distanceText: {
        fontSize: 12,
        color: '#6B7280',
    },
    productsSection: {
        marginBottom: 16,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    productName: {
        fontSize: 12,
        color: '#374151',
        flex: 2,
    },
    productQty: {
        fontSize: 11,
        color: '#6B7280',
        marginRight: 8,
    },
    productPrice: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    totalText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
    },
    deliveryStatus: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    statusSteps: {
        gap: 16,
    },
    statusStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeStatusIcon: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    statusText: {
        fontSize: 12,
        color: '#374151',
        flex: 1,
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
    deliveryUpdates: {
        marginTop: 12,
    },
    updatesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    updateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 6,
    },
    updateMessage: {
        fontSize: 11,
        color: '#374151',
        flex: 2,
    },
    updateTime: {
        fontSize: 10,
        color: '#6B7280',
        flex: 1,
        textAlign: 'right',
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
    // Receipt Card Styles
    simpleReceiptCard: {
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
    simpleReceiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    simpleReceiptInfo: {
        flex: 1,
    },
    simpleReceiptTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    simpleReceiptDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    simpleReceiptAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
    simpleReceiptFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    simpleReceiptId: {
        fontSize: 12,
        color: '#6B7280',
    },
    viewReceiptButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    viewReceiptButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    estimatedTime: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
    },
    deliveryCard: {
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
    storeInfo: {
        flex: 1,
    },
    storeHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    storeLocation: {
        fontSize: 14,
        color: '#6B7280',
    },
    progressIndicator: {
        marginBottom: 12,
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    activeStep: {
        backgroundColor: '#10B981',
    },
    stepText: {
        fontSize: 12,
        color: '#374151',
        flex: 1,
    },
    actionSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    itemsCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    viewButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewButtonText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '600',
    },
});