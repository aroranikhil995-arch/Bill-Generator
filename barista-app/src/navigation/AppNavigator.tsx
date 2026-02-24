import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';

import MenuSelectionScreen from '../screens/MenuSelectionScreen';
import BillPreviewScreen from '../screens/BillPreviewScreen';
import PrintSuccessScreen from '../screens/PrintSuccessScreen';

export type RootStackParamList = {
    MenuSelection: undefined;
    BillPreview: undefined;
    PrintSuccess: { billId: string };
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
                    options={{ title: '☕  Barista Cafe' }}
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}
