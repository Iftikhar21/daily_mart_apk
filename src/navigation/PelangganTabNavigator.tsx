// navigation/PelangganTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Heart, ShoppingCart, Clock, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import DashboardPelanggan from '../screens/Pelanggan/DashboardPelangganScreen';
import FavoriteProducts from '../screens/Pelanggan/FavoriteProductsScreen';
import ProductsList from '../screens/Pelanggan/ProductsScreen';
import { useCart } from '../context/CartContext';
import ProfileScreen from '../screens/Pelanggan/ProfileScreen';
import OrderHistoryScreen from '../screens/Pelanggan/HistoryTransactionsScreen';

const Tab = createBottomTabNavigator();

// Component untuk badge di tab
const TabBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;

    return (
        <View
            style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: '#EF4444',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#fff',
            }}
        >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                {count > 9 ? '9+' : count}
            </Text>
        </View>
    );
};

export default function PelangganTabNavigator() {
    const { cartCount } = useCart();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#28a745',
                tabBarInactiveTintColor: '#777',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0.5,
                    borderTopColor: '#ccc',
                    height: 60,
                    paddingBottom: 5,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    let icon;

                    if (route.name === 'Dashboard') {
                        icon = <Home color={color} size={22} />;
                    } else if (route.name === 'Favorite') {
                        icon = <Heart color={color} size={22} />;
                    } else if (route.name === 'Product') {
                        icon = (
                            <View style={{ position: 'relative' }}>
                                <ShoppingCart color={color} size={22} />
                                <TabBadge count={cartCount} />
                            </View>
                        );
                    } else if (route.name === 'History') {
                        icon = <Clock color={color} size={22} />;
                    } else if (route.name === 'Profile') {
                        icon = <User color={color} size={22} />;
                    }

                    return icon;
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardPelanggan}
                options={{ tabBarLabel: 'Beranda' }}
            />
            <Tab.Screen
                name="Favorite"
                component={FavoriteProducts}
                options={{ tabBarLabel: 'Favorit' }}
            />
            <Tab.Screen
                name="Product"
                component={ProductsList}
                options={{
                    tabBarLabel: 'Belanja',
                }}
            />
            <Tab.Screen name="History" component={OrderHistoryScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}