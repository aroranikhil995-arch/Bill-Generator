import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';

import MenuSelectionScreen from '../screens/MenuSelectionScreen';
import BillPreviewScreen from '../screens/BillPreviewScreen';
import PrintSuccessScreen from '../screens/PrintSuccessScreen';
import BillsListScreen from '../screens/BillsListScreen';
import BillDetailsScreen from '../screens/BillDetailsScreen';

export type RootStackParamList = {
    MenuSelection: undefined;
    BillPreview: undefined;
    PrintSuccess: { billId: string };
    BillsList: undefined;
    BillDetails: { bill: { id: string; subtotal: number; tax_amount: number; total_amount: number; payment_status: 'paid' | 'unpaid'; created_at: string } };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="MenuSelection"
                screenOptions={{
                    headerStyle: { backgroundColor: Colors.primary },
                    headerTintColor: Colors.accent,
                    headerTitleStyle: { fontWeight: '700', fontSize: 17 },
                    contentStyle: { backgroundColor: Colors.bg },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen
                    name="MenuSelection"
                    component={MenuSelectionScreen}
                    options={({ navigation }) => ({
                        title: '☕  Barista Cafe',
                        headerRight: () => (
                            <TouchableOpacity onPress={() => navigation.navigate('BillsList')} style={{ marginRight: 10 }}>
                                <Text style={{ fontSize: 24 }}>📄</Text>
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen
                    name="BillPreview"
                    component={BillPreviewScreen}
                    options={{ title: 'Bill Preview' }}
                />
                <Stack.Screen
                    name="PrintSuccess"
                    component={PrintSuccessScreen}
                    options={{ title: 'Printed!', headerLeft: () => null }}
                />
                <Stack.Screen
                    name="BillsList"
                    component={BillsListScreen}
                    options={{ title: 'Generated Bills' }}
                />
                <Stack.Screen
                    name="BillDetails"
                    component={BillDetailsScreen}
                    options={{ title: 'Bill Summary' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
