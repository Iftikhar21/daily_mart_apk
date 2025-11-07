import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import DashboardPetugas from '../screens/Petugas/DashboardPetugasScreen';
import DashboardKurir from '../screens/Kurir/DashboardKurirScreen';
import DashboardPelanggan from '../screens/Pelanggan/DashboardPelangganScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                <Stack.Screen name="DashboardPelanggan" component={DashboardPelanggan} />
                <Stack.Screen name="DashboardPetugas" component={DashboardPetugas} />
                <Stack.Screen name="DashboardKurir" component={DashboardKurir} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}