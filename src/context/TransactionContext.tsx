// context/TransactionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

interface Transaction {
    id: number;
    total: number;
    status: 'pending' | 'paid' | 'completed' | 'cancelled';
    delivery_status: 'pending' | 'assigned' | 'picked_up' | 'on_delivery' | 'delivered' | 'completed';
    payment_method: string;
    created_at: string;
    branch?: {
        nama_cabang: string;
        alamat: string;
    };
    pelanggan?: {
        nama: string;
        alamat: string;
    };
    kurir?: {
        user: {
            name: string;
        };
    };
    details: {
        id: number;
        qty: number;
        subtotal: number;
        product: {
            id: number;
            nama_produk: string;
            harga: number;
            gambar?: string;
        };
    }[];
    delivery_updates?: {
        id: number;
        status_message: string;
        created_at: string;
        kurir?: {
            user: {
                name: string;
            };
        };
    }[];
}

interface TransactionContextType {
    transactions: Transaction[];
    loading: boolean;
    refreshing: boolean;
    loadTransactions: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
    updateTransactionStatus: (transactionId: number, status: string) => void;
    getTransactionById: (id: number) => Transaction | undefined;
    updateTransactionDeliveryStatus: (transactionId: number, deliveryStatus: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTransactions = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await api.get('/transactions/online', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTransactions(response.data);
        } catch (error: any) {
            console.log('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshTransactions = async () => {
        try {
            setRefreshing(true);
            await loadTransactions();
        } finally {
            setRefreshing(false);
        }
    };

    const updateTransactionStatus = (transactionId: number, status: string) => {
        setTransactions(prev =>
            prev.map(transaction =>
                transaction.id === transactionId
                    ? { ...transaction, status: status as any }
                    : transaction
            )
        );
    };

    const updateTransactionDeliveryStatus = (transactionId: number, deliveryStatus: string) => {
        setTransactions(prev =>
            prev.map(transaction =>
                transaction.id === transactionId
                    ? { ...transaction, delivery_status: deliveryStatus as any }
                    : transaction
            )
        );
    };

    const getTransactionById = (id: number) => {
        return transactions.find(transaction => transaction.id === id);
    };

    // Auto-load transactions ketika provider mount
    useEffect(() => {
        loadTransactions();
    }, []);

    const value = {
        transactions,
        loading,
        refreshing,
        loadTransactions,
        refreshTransactions,
        updateTransactionStatus,
        getTransactionById,
        updateTransactionDeliveryStatus,
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};