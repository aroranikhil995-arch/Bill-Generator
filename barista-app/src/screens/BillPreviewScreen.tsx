import React, { useState, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCartStore } from '../store/cartStore';
import { generateBillId, saveBill } from '../services/supabase';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';
import { TAX_RATE } from '../data/menu';

// ── Vercel deployment URL ─────────────────────────────────────────────────────
const WEB_BASE_URL = 'https://bill-generator-pn8wmcbfo-aroranikhil995-1008s-projects.vercel.app';

type Props = NativeStackScreenProps<RootStackParamList, 'BillPreview'>;

export default function BillPreviewScreen({ navigation }: Props) {
    const { items, subtotal, taxAmount, total, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [billId, setBillId] = useState<string | null>(null);

    const qrUrl = billId ? `${WEB_BASE_URL}/bill/${billId}` : '';
    const now = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    // ── Step 1: Save to Supabase and get Bill ID ─────────────────────────────────
    const handleSave = async () => {
        if (billId) return; // already saved
        setLoading(true);
        try {
            const id = await generateBillId();
            const result = await saveBill(
                { id, subtotal, tax_rate: TAX_RATE, tax_amount: taxAmount, total_amount: total },
                items.map((i) => ({
                    bill_id: id,
                    item_name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    item_total: i.itemTotal,
                })),
            );
            if (result.success) {
                setBillId(id);
            } else {
                Alert.alert('Save Failed', result.error ?? 'Unknown error. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Print via Bluetooth ──────────────────────────────────────────────
    const handlePrint = async () => {
        if (!billId) {
            Alert.alert('Save first', 'Please save the bill before printing.');
            return;
        }
        try {
            // Dynamic import to avoid crash if BT not available on all platforms
            const BluetoothManager = require('react-native-bluetooth-escpos-printer').BluetoothManager;
            const BluetoothEscposPrinter = require('react-native-bluetooth-escpos-printer').BluetoothEscposPrinter;

            // Check connection
            const isConnected = await BluetoothManager.isDeviceBleEnabled();
            if (!isConnected) {
                Alert.alert('Bluetooth Off', 'Please enable Bluetooth and connect your printer.');
                return;
            }

            // Print header
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
            await BluetoothEscposPrinter.printText('BARISTA CAFE\n', { fontSize: 36, fonttype: 1 });
            await BluetoothEscposPrinter.printText(`----------------------------------------\n`, {});
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
            await BluetoothEscposPrinter.printText(`Bill No: ${billId}\n`, {});
            await BluetoothEscposPrinter.printText(`Date   : ${now}\n`, {});
            await BluetoothEscposPrinter.printText(`----------------------------------------\n`, {});

            // Items
            await BluetoothEscposPrinter.printText(
                `${'ITEM'.padEnd(18)}${'QTY'.padEnd(6)}${'AMT'.padStart(8)}\n`, {},
            );
            for (const item of items) {
                const line = `${item.name.slice(0, 17).padEnd(18)}${String(item.quantity).padEnd(6)}${('₹' + item.itemTotal.toFixed(2)).padStart(8)}`;
                await BluetoothEscposPrinter.printText(line + '\n', {});
            }

            await BluetoothEscposPrinter.printText(`----------------------------------------\n`, {});
            await BluetoothEscposPrinter.printText(`Subtotal          ₹${subtotal.toFixed(2)}\n`, {});
            await BluetoothEscposPrinter.printText(`GST (${TAX_RATE}%)            ₹${taxAmount.toFixed(2)}\n`, {});
            await BluetoothEscposPrinter.printText(`TOTAL             ₹${total.toFixed(2)}\n`, {});
            await BluetoothEscposPrinter.printText(`----------------------------------------\n`, {});

            // QR Code
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
            await BluetoothEscposPrinter.printText('Scan to view your bill online\n', {});
            await BluetoothEscposPrinter.printQRCode(qrUrl, 280, BluetoothEscposPrinter.ERROR_CORRECTION.M);
            await BluetoothEscposPrinter.printText('\n\n\n', {});
            await BluetoothEscposPrinter.cutPaper();

            clearCart();
            navigation.replace('PrintSuccess', { billId });
        } catch (e: any) {
            Alert.alert('Print Error', e?.message ?? 'Could not connect to printer.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Bill Card ── */}
                <View style={styles.card}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.cafeName}>☕  Barista Cafe</Text>
                        {billId ? (
                            <Text style={styles.billId}>Bill #{billId}</Text>
                        ) : (
                            <Text style={styles.billIdPending}>Bill ID will be assigned on save</Text>
                        )}
                        <Text style={styles.dateText}>{now}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Items */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, styles.colHead]}>Item</Text>
                        <Text style={[styles.colQty, styles.colHead]}>Qty</Text>
                        <Text style={[styles.colAmt, styles.colHead]}>Total</Text>
                    </View>
                    {items.map((item) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={styles.col1} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colAmt}>₹{item.itemTotal.toFixed(2)}</Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    {/* Totals */}
                    <View style={styles.totalsBlock}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>GST ({TAX_RATE}%)</Text>
                            <Text style={styles.totalValue}>₹{taxAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotalRow]}>
                            <Text style={styles.grandTotalLabel}>TOTAL</Text>
                            <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* QR Code */}
                    {billId ? (
                        <View style={styles.qrBlock}>
                            <QRCode
                                value={qrUrl}
                                size={160}
                                color={Colors.primary}
                                backgroundColor="#fff"
                            />
                            <Text style={styles.qrLabel}>Scan to view your bill online</Text>
                            <Text style={styles.qrUrl} numberOfLines={1}>{qrUrl}</Text>
                        </View>
                    ) : (
                        <View style={styles.qrPlaceholder}>
                            <Text style={styles.qrPlaceholderText}>QR code will appear after saving</Text>
                        </View>
                    )}
                </View>

                {/* ── Action Buttons ── */}
                <View style={styles.actions}>
                    {!billId && (
                        <TouchableOpacity
                            style={[styles.btn, styles.saveBtn, loading && styles.btnDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.btnText}>💾  Save Bill</Text>
                            }
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.btn, styles.printBtn, !billId && styles.btnDisabled]}
                        onPress={handlePrint}
                        disabled={!billId}
                    >
                        <Text style={styles.btnText}>🖨️  Print via Bluetooth</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 16, paddingBottom: 40 },

    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...Shadow.card,
    },

    cardHeader: {
        backgroundColor: Colors.primary,
        padding: 20,
        alignItems: 'center',
    },
    cafeName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.accent },
    billId: { fontSize: FontSize.sm, color: '#fff', marginTop: 4, fontWeight: '600' },
    billIdPending: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    dateText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
        marginVertical: 12,
    },

    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    colHead: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    col1: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
    colQty: { width: 36, textAlign: 'center', fontSize: FontSize.sm, color: Colors.text },
    colAmt: { width: 80, textAlign: 'right', fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },

    totalsBlock: { paddingHorizontal: 16, gap: 6 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
    totalValue: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
    grandTotalRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 2,
        borderTopColor: Colors.accent,
    },
    grandTotalLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
    grandTotalValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },

    qrBlock: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    qrLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600', marginTop: 4 },
    qrUrl: { fontSize: FontSize.xs, color: Colors.textMuted, maxWidth: 260 },

    qrPlaceholder: {
        alignItems: 'center',
        paddingVertical: 28,
        marginHorizontal: 16,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    qrPlaceholderText: { fontSize: FontSize.sm, color: Colors.textMuted },

    actions: { marginTop: 20, gap: 12 },
    btn: {
        borderRadius: Radius.md,
        paddingVertical: 15,
        alignItems: 'center',
        ...Shadow.card,
    },
    saveBtn: { backgroundColor: Colors.accent },
    printBtn: { backgroundColor: Colors.primary },
    btnDisabled: { backgroundColor: Colors.border },
    btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
