import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    Modal,
    ActivityIndicator
} from 'react-native';
import { ArrowLeft, MapPin, CreditCard, Clock, Edit, LogOut, Phone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

interface Pelanggan {
    id: number;
    alamat: string;
    no_hp?: string;
    branch_id: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    pelanggan?: Pelanggan;
}

interface Transaction {
    id: number;
    total: number;
    status: string;
    delivery_status: string;
    created_at: string;
    payment_method: string;
    details: {
        product: {
            nama_produk: string;
        };
        qty: number;
    }[];
}

export default function ProfileScreen({ navigation }: any) {
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<'nama' | 'alamat' | 'no_hp' | null>(null);
    const [editValue, setEditValue] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadProfile();
        loadTransactions();
    }, []);

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            // Load dari API - akan auto create pelanggan jika belum ada
            const response = await api.get('/pelanggan/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser({
                id: response.data.data.user.id,
                name: response.data.data.user.name,
                email: response.data.data.user.email,
                pelanggan: response.data.data.pelanggan
            });

        } catch (error: any) {
            console.log('Error loading profile:', error);
            // Fallback ke data dari AsyncStorage
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await api.get('/transactions/online', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTransactions(response.data.slice(0, 5)); // Ambil 5 transaksi terbaru
        } catch (error) {
            console.log('Error loading transactions:', error);
        }
    };

    const handleEdit = (field: 'nama' | 'alamat' | 'no_hp', value: string) => {
        setEditField(field);
        setEditValue(value || '');
        setEditModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!user || !editField) return;

        console.log('Updating field:', editField, 'with value:', editValue);

        setUpdating(true);
        try {
            const token = await AsyncStorage.getItem('token');

            const response = await api.put('/pelanggan/profile',
                { [editField]: editValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Update response:', response.data);

            // Update local state dengan data terbaru dari API
            setUser(prev => prev ? {
                ...prev,
                name: response.data.data.user.name,
                pelanggan: response.data.data.pelanggan
            } : null);

            // Update AsyncStorage
            const updatedUser = {
                ...user,
                name: response.data.data.user.name,
                pelanggan: response.data.data.pelanggan
            };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            setEditModalVisible(false);
            Alert.alert('Sukses', 'Profil berhasil diperbarui');
        } catch (error: any) {
            console.log('Error updating profile:', error);
            console.log('Error response:', error.response);

            const errorMessage = error.response?.data?.message || 'Gagal memperbarui profil';
            Alert.alert('Error', errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Apakah Anda yakin ingin logout?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('user');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.log('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'completed': return '#3B82F6';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid': return 'Dibayar';
            case 'pending': return 'Menunggu';
            case 'completed': return 'Selesai';
            case 'cancelled': return 'Dibatalkan';
            default: return status;
        }
    };

    const getFieldLabel = (field: string) => {
        switch (field) {
            case 'nama': return 'Nama Lengkap';
            case 'alamat': return 'Alamat Pengiriman';
            case 'no_hp': return 'Nomor Telepon';
            default: return field;
        }
    };

    const getFieldPlaceholder = (field: string) => {
        switch (field) {
            case 'nama': return 'Masukkan nama lengkap';
            case 'alamat': return 'Masukkan alamat lengkap untuk pengiriman';
            case 'no_hp': return 'Masukkan nomor telepon';
            default: return '';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Memuat profil...</Text>
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
                <Text style={styles.headerTitle}>Profil</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <LogOut size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* PROFILE INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informasi Profil</Text>

                    {/* Name */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Name</Text>
                            <Text style={styles.infoValue}>
                                {user?.name || 'Tidak tersedia'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEdit('nama', user?.name || '')}
                        >
                            <Edit size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Email */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>
                                {user?.email || 'Tidak tersedia'}
                            </Text>
                        </View>
                    </View>

                    {/* Phone Number */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Phone Number</Text>
                            <Text style={styles.infoValue}>
                                {user?.pelanggan?.no_hp || 'Belum diatur'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEdit('no_hp', user?.pelanggan?.no_hp || '')}
                        >
                            <Edit size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Delivery Address */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Delivery address</Text>
                            <Text style={styles.infoValue}>
                                {user?.pelanggan?.alamat || 'Alamat belum diatur'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEdit('alamat', user?.pelanggan?.alamat || '')}
                        >
                            <Edit size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* PAYMENT DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pembayaran</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('PaymentMethods')}
                    >
                        <CreditCard size={20} color="#6B7280" />
                        <Text style={styles.menuText}>Payment Details</Text>
                    </TouchableOpacity>
                </View>

                {/* ORDER HISTORY */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Order history</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
                            <Text style={styles.seeAllText}>Lihat semua ➡️</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* EDIT MODAL */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Edit {editField ? getFieldLabel(editField) : ''}
                        </Text>

                        <TextInput
                            style={[
                                styles.textInput,
                                editField === 'alamat' && styles.textArea
                            ]}
                            value={editValue}
                            onChangeText={setEditValue}
                            placeholder={editField ? getFieldPlaceholder(editField) : ''}
                            multiline={editField === 'alamat'}
                            numberOfLines={editField === 'alamat' ? 4 : 1}
                            keyboardType={editField === 'no_hp' ? 'phone-pad' : 'default'}
                            maxLength={editField === 'no_hp' ? 15 : undefined}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                                disabled={updating}
                            >
                                <Text style={styles.cancelButtonText}>Batal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleUpdate}
                                disabled={updating || !editValue.trim()}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Simpan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
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
    seeAllText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    editButton: {
        padding: 8,
        marginLeft: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
        marginLeft: 12,
        flex: 1,
    },
    menuSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 12,
    },
    orderCard: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    orderStatus: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    orderItems: {
        marginBottom: 8,
    },
    orderItemText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    moreItemsText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
    },
    paymentMethod: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 24,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#10B981',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});