import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase, BillItemPayload } from '../services/supabase';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';
import QRCode from 'react-native-qrcode-svg';

// ── Vercel deployment URL ─────────────────────────────────────────────────────
const WEB_BASE_URL = 'https://bill-generator-aroranikhil995-1008s-projects.vercel.app';

type Props = NativeStackScreenProps<RootStackParamList, 'BillDetails'>;

export default function BillDetailsScreen({ route }: Props) {
    const { bill } = route.params;
    const [items, setItems] = useState<BillItemPayload[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('bill_items')
                    .select('*')
                    .eq('bill_id', bill.id);

                if (error) throw error;
                if (data) setItems(data);
            } catch (err) {
                console.error('Failed to fetch bill items:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [bill.id]);

    const renderItemRow = ({ item }: { item: BillItemPayload }) => (
        <View style={styles.itemRow}>
            <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemMeta}>${item.price.toFixed(2)} x {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>${item.item_total.toFixed(2)}</Text>
        </View>
    );

    const date = new Date(bill.created_at);
    const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Barista Cafe</Text>
                    <Text style={styles.gstText}>GSTIN: 07AAAAA0000A1Z5</Text>
                    <Text style={styles.subtitle}>Order: {bill.id}</Text>
                    <Text style={styles.date}>{dateString}</Text>
                </View>

                {loading ? (
                    <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />
                ) : (
                    <>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.columnHeader, { flex: 1 }]}>ITEM</Text>
                            <Text style={styles.columnHeader}>TOTAL</Text>
                        </View>
                        <FlatList
                            data={items}
                            keyExtractor={(item, index) => `${item.bill_id}-${index}`}
                            renderItem={renderItemRow}
                            style={styles.list}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* Grand Totals */}
                        <View style={styles.totalsContainer}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Grand Total</Text>
                                <Text style={styles.grandTotalValue}>${bill.total_amount.toFixed(2)}</Text>
                            </View>
                        </View>

                        <View style={styles.qrContainer}>
                            <QRCode
                                value={`${WEB_BASE_URL}/bill/${bill.id}`}
                                size={120}
                                color={Colors.text}
                                backgroundColor="transparent"
                            />
                            <Text style={styles.qrText}>Scan for digital receipt</Text>
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
        margin: 16,
        borderRadius: Radius.lg,
        ...Shadow.card,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        borderStyle: 'dashed',
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 2,
    },
    gstText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textMuted,
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.7,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        fontWeight: '600',
        marginBottom: 2,
    },
    date: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 12,
    },
    columnHeader: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 1,
    },
    list: {
        flex: 1,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    itemMain: {
        flex: 1,
        paddingRight: 10,
    },
    itemName: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    itemMeta: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    itemTotal: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
    },
    totalsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        borderStyle: 'dashed',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    grandTotalValue: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.primary,
    },
    qrContainer: {
        marginTop: 32,
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        borderStyle: 'solid',
    },
    qrText: {
        marginTop: 12,
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    loader: {
        marginTop: 40,
    },
});
