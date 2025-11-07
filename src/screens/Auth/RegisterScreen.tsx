import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import api from '../../config/api';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('kurir'); // default role

    const handleRegister = async () => {
        try {
            await api.post('/register', { name, email, password });
            Alert.alert('Berhasil', 'Registrasi berhasil! Silakan login.');
            navigation.navigate('Login');
        } catch (err: any) {
            Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Register</Text>

            <TextInput placeholder="Nama" value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10, padding: 8 }} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10, padding: 8 }} />
            <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 10, padding: 8 }} />

            <Button title="Register" onPress={handleRegister} />
        </View>
    );
}
