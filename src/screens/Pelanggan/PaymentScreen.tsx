import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { ArrowLeft, Download, Clock, CheckCircle, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

export default function PaymentScreen({ navigation, route }: any) {
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
    const [countdown, setCountdown] = useState(5);
    const [loading, setLoading] = useState(false);

    const transaction = route.params?.transaction;
    const total = route.params?.total || transaction?.total || 0;

    useEffect(() => {
        // Auto payment setelah 5 detik
        if (paymentStatus === 'pending') {
            const timer = setTimeout(() => {
                handlePaymentSuccess();
            }, 5000);

            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearTimeout(timer);
                clearInterval(countdownInterval);
            };
        }
    }, [paymentStatus]);

    const handlePaymentSuccess = async () => {
        setPaymentStatus('paid');
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');

            // 👇 GUNAKAN ENDPOINT updateStatus YANG SUDAH ADA
            await api.put(`/transactions/${transaction.id}/status`,
                { status: 'paid' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Simulasikan delay untuk efek realism
            setTimeout(() => {
                setLoading(false);
            }, 1000);

        } catch (error: any) {
            console.log('Error updating transaction status:', error);
            Alert.alert('Error', 'Gagal mengupdate status transaksi');
            setLoading(false);
            setPaymentStatus('pending'); // Reset ke pending jika gagal
        }
    };

    const handleSaveImage = () => {
        Alert.alert(
            'Simpan QR Code',
            'QR Code berhasil disimpan ke galeri',
            [{ text: 'OK' }]
        );
    };

    const handleCancel = () => {
        Alert.alert(
            'Batalkan Pembayaran',
            'Apakah Anda yakin ingin membatalkan pembayaran?',
            [
                { text: 'Tidak', style: 'cancel' },
                {
                    text: 'Ya, Batalkan',
                    style: 'destructive',
                    onPress: () => {
                        // Cancel transaction di backend juga
                        cancelTransaction();
                    }
                }
            ]
        );
    };

    const cancelTransaction = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            await api.put(`/transactions/${transaction.id}/status`,
                { status: 'cancelled' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigation.goBack();
        } catch (error) {
            console.log('Error cancelling transaction:', error);
            Alert.alert('Error', 'Gagal membatalkan transaksi');
        }
    };

    const handleBackToHome = () => {
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'DashboardPelanggan',
                    state: {
                        index: 2, // Tab ke-2 → Product
                        routes: [{ name: 'Product' }]
                    }
                }
            ]
        });
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pembayaran QRIS</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* TOTAL SECTION */}
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>Rp {total.toLocaleString('id-ID')}</Text>
                </View>

                <View style={styles.divider} />

                {/* QRIS INFO */}
                <View style={styles.qrisSection}>
                    <Text style={styles.qrisTitle}>QRIS</Text>
                    <Text style={styles.qrisSubtitle}>QR Code Standard</Text>
                    <Text style={styles.qrisSubtitle}>Pembayaran National</Text>
                </View>

                {/* QR CODE PLACEHOLDER */}
                <View style={styles.qrContainer}>
                    <View style={styles.qrCode}>
                        <Text style={styles.qrPlaceholderText}>QR Code akan muncul di sini</Text>
                        <View style={styles.qrPattern}>
                            <View style={styles.qrCorner} />
                            <View style={styles.qrCenter} />
                        </View>
                    </View>
                </View>

                {/* PAYMENT STATUS */}
                <View style={[
                    styles.statusContainer,
                    paymentStatus === 'paid' ? styles.statusPaid : styles.statusPending
                ]}>
                    {paymentStatus === 'paid' ? (
                        <>
                            <CheckCircle size={24} color="#10B981" />
                            <Text style={styles.statusTextPaid}>Pembayaran Berhasil</Text>
                        </>
                    ) : (
                        <>
                            <Clock size={24} color="#F59E0B" />
                            <Text style={styles.statusTextPending}>
                                Menunggu Pembayaran - {countdown}s
                            </Text>
                        </>
                    )}
                </View>

                {/* INSTRUCTION */}
                <View style={styles.instructionSection}>
                    <Text style={styles.instructionText}>
                        Unduh atau screenshot gambar QRIS
                    </Text>
                </View>

                {/* ACTION BUTTONS */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveImage}
                    >
                        <Download size={20} color="#10B981" />
                        <Text style={styles.saveButtonText}>Simpan Gambar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={paymentStatus === 'paid'}
                    >
                        <Text style={[
                            styles.cancelButtonText,
                            paymentStatus === 'paid' && styles.cancelButtonDisabled
                        ]}>
                            Batalkan
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* TRANSACTION INFO */}
                <View style={styles.transactionInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Totals</Text>
                        <Text style={styles.infoValue}>Rp {total.toLocaleString('id-ID')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Text style={[
                            styles.statusValue,
                            paymentStatus === 'paid' ? styles.statusValuePaid : styles.statusValuePending
                        ]}>
                            {paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Metode</Text>
                        <Text style={styles.infoValue}>QRIS</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* SUCCESS MODAL */}
            {paymentStatus === 'paid' && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIcon}>
                            <CheckCircle size={48} color="#10B981" />
                        </View>
                        <Text style={styles.modalTitle}>Pembayaran Berhasil!</Text>
                        <Text style={styles.modalSubtitle}>
                            Transaksi Anda telah berhasil diproses.
                        </Text>

                        {/* TAMBAH BUTTON LIHAT STRUK */}
                        <TouchableOpacity
                            style={styles.receiptButton}
                            onPress={() => navigation.navigate('ReceiptDetail', {
                                transactionId: transaction.id
                            })}
                        >
                            <FileText size={20} color="#10B981" />
                            <Text style={styles.receiptButtonText}>Lihat Struk</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleBackToHome}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.modalButtonText}>Kembali Berbelanja</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
    },
    totalSection: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    totalLabel: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 8,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    qrisSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        padding: 20,
        alignItems: 'center',
    },
    qrisTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    qrisSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    qrContainer: {
        alignItems: 'center',
        padding: 20,
    },
    qrCode: {
        width: 250,
        height: 250,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    qrPlaceholderText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 10,
    },
    qrPattern: {
        position: 'relative',
        width: 150,
        height: 150,
        backgroundColor: '#F3F4F6',
    },
    qrCorner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderWidth: 3,
        borderColor: '#000',
        top: 10,
        left: 10,
    },
    qrCenter: {
        position: 'absolute',
        width: 20,
        height: 20,
        backgroundColor: '#000',
        top: '50%',
        left: '50%',
        marginLeft: -10,
        marginTop: -10,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 16,
        padding: 16,
        borderRadius: 12,
    },
    statusPending: {
        backgroundColor: '#FFFBEB',
        borderColor: '#F59E0B',
        borderWidth: 1,
    },
    statusPaid: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981',
        borderWidth: 1,
    },
    statusTextPending: {
        fontSize: 16,
        fontWeight: '600',
        color: '#D97706',
        marginLeft: 8,
    },
    statusTextPaid: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
        marginLeft: 8,
    },
    instructionSection: {
        alignItems: 'center',
        padding: 16,
    },
    instructionText: {
        fontSize: 14,
        color: '#6B7280',
    },
    actionButtons: {
        paddingHorizontal: 16,
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 12,
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonDisabled: {
        color: '#9CA3AF',
    },
    transactionInfo: {
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
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusValuePending: {
        color: '#F59E0B',
    },
    statusValuePaid: {
        color: '#10B981',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 300,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    // Tambah di styles PaymentScreen
    receiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#10B981',
        gap: 8,
    },
    receiptButtonText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '700',
    },
});