import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PrintSuccess'>;

export default function PrintSuccessScreen({ navigation, route }: Props) {
    const { billId } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.icon}>✅</Text>
                <Text style={styles.title}>Bill Printed!</Text>
                <Text style={styles.subtitle}>
                    Bill <Text style={styles.billId}>{billId}</Text> has been{'\n'}
                    printed and saved successfully.
                </Text>
                <View style={styles.divider} />
                <Text style={styles.hint}>
                    The QR on the receipt lets the customer view{'\n'}
                    their digital bill online at any time.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.replace('MenuSelection')}
            >
                <Text style={styles.btnText}>+ New Bill</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        width: '100%',
        ...Shadow.card,
    },
    icon: { fontSize: 52, marginBottom: 12 },
    title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
    subtitle: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
    billId: { fontWeight: '700', color: Colors.accent },
    divider: { height: 1, backgroundColor: Colors.border, width: '100%', marginVertical: 20 },
    hint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

    btn: {
        marginTop: 28,
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        paddingVertical: 16,
        paddingHorizontal: 48,
        ...Shadow.card,
    },
    btnText: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '700' },
});
