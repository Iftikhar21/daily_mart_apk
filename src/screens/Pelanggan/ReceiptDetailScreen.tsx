// ReceiptDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { ArrowLeft, Download, Share2, Printer } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from "react-native-view-shot";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

import { useRef } from "react";
import api from '../../config/api';

const { width } = Dimensions.get('window');

interface Transaction {
    id: number;
    total: number;
    status: string;
    payment_method: string;
    created_at: string;
    branch?: {
        nama_cabang: string;
        alamat: string;
    };
    pelanggan?: {
        name: string;
        alamat: string;
    };
    details: {
        id: number;
        qty: number;
        subtotal: number;
        product: {
            id: number;
            nama_produk: string;
            harga: number;
        };
    }[];
}

export default function ReceiptDetailScreen({ navigation, route }: any) {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const shotRef = useRef(null);
    const transactionId = route.params?.transactionId;

    useEffect(() => {
        loadTransactionDetail();
    }, [transactionId]);

    const loadTransactionDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await api.get(`/transactions/${transactionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTransaction(response.data);
        } catch (error: any) {
            console.log('Error loading transaction:', error);
            Alert.alert('Error', 'Gagal memuat detail transaksi');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleDownload = async () => {
        if (!shotRef.current) return; // cegah error saat null

        try {
            const uri = await shotRef.current.capture();
            await CameraRoll.saveAsset(uri);
            Alert.alert("Berhasil", "Struk disimpan ke galeri!");
        } catch (err) {
            console.log(err);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Struk Pembayaran</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Memuat struk...</Text>
                </View>
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Struk Pembayaran</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Struk tidak ditemukan</Text>
                </View>
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
                <Text style={styles.headerTitle}>Struk Pembayaran</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* STRUK CONTENT */}
                <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
                    <View style={styles.receiptContainer}>
                        {/* HEADER STRUK */}
                        <View style={styles.receiptHeader}>
                            <Text style={styles.storeName}>DailyMart, {transaction.branch?.nama_cabang}</Text>
                            <Text style={styles.storeAddress}>
                                {transaction.branch?.alamat || 'Alamat cabang tidak tersedia'}
                            </Text>
                            <View style={styles.divider} />
                        </View>

                        {/* INFO PEMBAYARAN */}
                        <View style={styles.paymentInfo}>
                            <Text style={styles.sectionTitle}>Dibuat oleh</Text>
                            <View style={styles.infoGrid}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Metode Pembayaran</Text>
                                    <Text style={styles.infoLabel}>Nama Pelanggan</Text>
                                    <Text style={styles.infoLabel}>Tanggal Transaksi</Text>
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoValue}>{transaction.payment_method.toUpperCase()}</Text>
                                    <Text style={styles.infoValue}>{transaction.pelanggan?.name || 'Pelanggan'}</Text>
                                    <Text style={styles.infoValue}>{formatDate(transaction.created_at)}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                        </View>

                        {/* DETAIL TRANSAKSI */}
                        <View style={styles.transactionDetails}>
                            <Text style={styles.sectionTitle}>Detail Transaksi</Text>

                            {transaction.details.map((detail, index) => (
                                <View key={detail.id} style={styles.detailItem}>
                                    <View style={styles.productRow}>
                                        <Text style={styles.productName}>{detail.product.nama_produk}</Text>
                                        <Text style={styles.productPrice}>{formatCurrency(detail.product.harga)}</Text>
                                    </View>
                                    <View style={styles.qtyRow}>
                                        <Text style={styles.qtyText}>Qty : {detail.qty} Produk</Text>
                                        <Text style={styles.subtotal}>{formatCurrency(detail.subtotal)}</Text>
                                    </View>
                                    {index < transaction.details.length - 1 && <View style={styles.itemDivider} />}
                                </View>
                            ))}

                            <View style={styles.divider} />
                        </View>

                        {/* TOTAL */}
                        <View style={styles.totalSection}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalAmount}>{formatCurrency(transaction.total)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Pembayaran</Text>
                                <Text style={styles.totalAmount}>{formatCurrency(transaction.total)}</Text>
                            </View>
                            <View style={styles.divider} />
                        </View>

                        {/* FOOTER */}
                        <View style={styles.receiptFooter}>
                            <Text style={styles.thankYouText}>Terimakasih</Text>
                            <Text style={styles.footerText}>
                                Terimakasih telah berbelanja di DailyMart. Kami berharap dapat melayani Anda kembali di masa mendatang.
                            </Text>
                            <Text style={styles.printText}>-- Struk ini dicetak secara digital --
                            </Text>
                        </View>
                    </View>
                </ViewShot>

                {/* ACTION BUTTONS */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                        <Download size={20} color="#10B981" />
                        <Text style={styles.actionButtonText}>Unduh</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
    receiptContainer: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    receiptHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    storeName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    storeAddress: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
    },
    paymentInfo: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoColumn: {
        gap: 6,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    infoValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    transactionDetails: {
        marginBottom: 20,
    },
    detailItem: {
        marginBottom: 12,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    qtyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 12,
        color: '#6B7280',
    },
    subtotal: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 8,
    },
    totalSection: {
        marginBottom: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    totalAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    receiptFooter: {
        alignItems: 'center',
    },
    thankYouText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 16,
    },
    printText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
        width: '100%',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        marginTop: 20,
    },
    actionButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'white',
        minWidth: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginTop: 4,
    },
});