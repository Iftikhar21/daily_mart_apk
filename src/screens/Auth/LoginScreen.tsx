import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const res = await api.post('/login', { email, password });
            const { user, token } = res.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('role', user.role);

            // Navigasi berdasarkan role
            if (user.role === 'user') navigation.replace('DashboardPelanggan');
            else if (user.role === 'petugas') navigation.replace('DashboardPetugas');
            else if (user.role === 'kurir') navigation.replace('DashboardKurir');
            else Alert.alert('Role tidak dikenal!');
        } catch (err: any) {
            Alert.alert('Gagal login', err.response?.data?.message || 'Terjadi kesalahan');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Login</Text>

            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />

            <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />

            <Button title="Login" onPress={handleLogin} />

            <Text
                style={{ color: 'blue', marginTop: 10 }}
                onPress={() => navigation.navigate('Register')}
            >
                Belum punya akun? Register
            </Text>
        </View>
    );
}
