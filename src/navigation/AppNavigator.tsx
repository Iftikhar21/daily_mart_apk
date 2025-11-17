import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import DashboardPetugas from '../screens/Petugas/DashboardPetugasScreen';
import DashboardKurir from '../screens/Kurir/DashboardKurirScreen';

import PelangganTabNavigator from './PelangganTabNavigator';

// 👉 Import screens
import CartScreen from '../screens/Pelanggan/CartScreen';
import CheckoutScreen from '../screens/Pelanggan/CheckoutScreen';
import PaymentScreen from '../screens/Pelanggan/PaymentScreen';
import DeliveryDetailScreen from '../screens/Pelanggan/DeliveryDetailScreen';
import ReceiptDetailScreen from '../screens/Pelanggan/ReceiptDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                {/* Dashboard pelanggan pakai tab */}
                <Stack.Screen name="DashboardPelanggan" component={PelangganTabNavigator} />

                {/* Screens Pelanggan */}
                <Stack.Screen name="Cart" component={CartScreen} />

                <Stack.Screen
                    name="Checkout"
                    component={CheckoutScreen}
                    options={{
                        headerShown: false,
                        gestureEnabled: false // Optional: disable swipe back
                    }}
                />

                {/* 👇 Tambahkan QRIS Payment Screen */}
                <Stack.Screen
                    name="Payment"
                    component={PaymentScreen}
                    options={{
                        headerShown: false,
                        gestureEnabled: false // Biasanya di payment screen disable swipe back
                    }}
                />

                <Stack.Screen
                    name="DeliveryDetail"
                    component={DeliveryDetailScreen}
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="ReceiptDetail"
                    component={ReceiptDetailScreen}
                    options={{ title: 'Struk Pembayaran' }}
                />

                <Stack.Screen name="DashboardPetugas" component={DashboardPetugas} />
                <Stack.Screen name="DashboardKurir" component={DashboardKurir} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}