import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius } from '../theme/colors';
import { TAX_RATE } from '../data/menu';

interface Props {
    subtotal: number;
    taxAmount: number;
    total: number;
}

export default function TaxSummaryBar({ subtotal, taxAmount, total }: Props) {
    return (
        <View style={styles.bar}>
            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Subtotal</Text>
                    <Text style={styles.value}>Rs.{subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.sep} />
                <View style={styles.col}>
                    <Text style={styles.label}>GST ({TAX_RATE}%)</Text>
                    <Text style={styles.value}>Rs.{taxAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.sep} />
                <View style={styles.col}>
                    <Text style={[styles.label, styles.totalLabel]}>TOTAL</Text>
                    <Text style={[styles.value, styles.totalValue]}>Rs.{total.toFixed(2)}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    col: { flex: 1, alignItems: 'center' },
    sep: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
    label: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
    value: { fontSize: FontSize.md, fontWeight: '700', color: '#fff', marginTop: 2 },
    totalLabel: { color: Colors.accent },
    totalValue: { color: Colors.accent, fontSize: FontSize.lg },
});
