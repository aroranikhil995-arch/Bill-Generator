import React, { useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, SafeAreaView, SectionList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MENU_ITEMS, CATEGORIES, MenuItem } from '../data/menu';
import { useCartStore } from '../store/cartStore';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';
import TaxSummaryBar from '../components/TaxSummaryBar';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuSelection'>;

const SECTIONS = CATEGORIES.map((cat) => ({
    title: cat,
    data: MENU_ITEMS.filter((m) => m.category === cat),
}));

export default function MenuSelectionScreen({ navigation }: Props) {
    const { items: cartItems, addItem, removeItem, subtotal, taxAmount, total } = useCartStore();

    const getQty = (id: string) => cartItems.find((i) => i.id === id)?.quantity ?? 0;

    const renderItem = ({ item }: { item: MenuItem }) => {
        const qty = getQty(item.id);
        return (
            <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                    </View>
                </View>
                <View style={styles.qtyRow}>
                    <TouchableOpacity
                        style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                        onPress={() => removeItem(item.id)}
                        disabled={qty === 0}
                    >
                        <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(item.id, item.name, item.price)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
    );

    const canGenerate = cartItems.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <SectionList
                sections={SECTIONS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.list}
                stickySectionHeadersEnabled
                ListFooterComponent={<View style={{ height: 220 }} />}
            />

            {/* ── Live Tax Summary Bar ── */}
            <TaxSummaryBar subtotal={subtotal} taxAmount={taxAmount} total={total} />

            {/* ── Generate Bill CTA ── */}
            <TouchableOpacity
                style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
                onPress={() => navigation.navigate('BillPreview')}
                disabled={!canGenerate}
            >
                <Text style={styles.generateBtnText}>Generate Bill →</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    list: { paddingBottom: 8 },

    sectionHeader: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    sectionTitle: {
        color: Colors.accent,
        fontSize: FontSize.sm,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },

    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        marginHorizontal: 14,
        marginVertical: 5,
        padding: 14,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.card,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    itemEmoji: { fontSize: 26 },
    itemName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    itemPrice: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.accent,
        alignItems: 'center', justifyContent: 'center',
    },
    qtyBtnDisabled: { backgroundColor: Colors.border },
    qtyBtnText: { fontSize: 18, color: '#fff', fontWeight: '700', lineHeight: 22 },
    qtyText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, minWidth: 20, textAlign: 'center' },

    generateBtn: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        paddingVertical: 16,
        alignItems: 'center',
        ...Shadow.card,
    },
    generateBtnDisabled: { backgroundColor: Colors.border },
    generateBtnText: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '700', letterSpacing: 0.4 },
});
