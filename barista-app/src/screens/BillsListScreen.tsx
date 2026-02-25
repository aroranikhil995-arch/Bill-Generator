import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, SafeAreaView,
    ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../services/supabase';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';

interface Bill {
    id: string;
    total_amount: number;
    payment_status: 'paid' | 'unpaid';
    created_at: string;
}

type FilterType = 'today' | 'week' | 'all';

export default function BillsListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [refreshing, setRefreshing] = useState(false);

    const fetchBills = async () => {
        try {
            setLoading(true);

            let query = supabase.from('bills').select('id,total_amount,payment_status,created_at').order('created_at', { ascending: false });

            // Apply filters
            const now = new Date();
            if (filter === 'today') {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                query = query.gte('created_at', todayStart);
            } else if (filter === 'week') {
                const weekStart = new Date();
                weekStart.setDate(now.getDate() - 7);
                query = query.gte('created_at', weekStart.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            if (data) setBills(data);
        } catch (err) {
            console.error('Failed to fetch bills:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBills();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBills();
    };

    const renderBill = ({ item }: { item: Bill }) => {
        const date = new Date(item.created_at);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isPaid = item.payment_status === 'paid';

        return (
            <TouchableOpacity
                style={styles.billCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('BillDetails', { bill: item })}
            >
                <View style={styles.billHeader}>
                    <View>
                        <Text style={styles.billId}>{item.id}</Text>
                        <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusUnpaid]}>
                            <Text style={styles.statusText}>{isPaid ? 'PAID' : 'UNPAID'}</Text>
                        </View>
                    </View>
                    <Text style={styles.billTotal}>${item.total_amount.toFixed(2)}</Text>
                </View>
                <Text style={styles.billDate}>{dateString}</Text>
            </TouchableOpacity>
        );
    };

    const totalRevenue = bills.reduce((sum, b) => sum + b.total_amount, 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* Filters */}
            <View style={styles.filterRow}>
                {(['today', 'week', 'all'] as FilterType[]).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 Days' : 'All Time'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Bills</Text>
                    <Text style={styles.summaryValue}>{bills.length}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Revenue</Text>
                    <Text style={styles.summaryValue}>${totalRevenue.toFixed(2)}</Text>
                </View>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />
            ) : (
                <FlatList
                    data={bills}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBill}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No bills found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    filterRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 10,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: FontSize.sm,
        color: Colors.text,
        fontWeight: '500',
    },
    filterTextActive: {
        color: Colors.accent,
        fontWeight: '700',
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        margin: 16,
        padding: 16,
        borderRadius: Radius.md,
        ...Shadow.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
    },
    summaryLabel: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    loader: {
        marginTop: 40,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    billCard: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: Radius.md,
        marginBottom: 12,
        ...Shadow.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    billHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    billId: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
    },
    billTotal: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.primary,
    },
    billDate: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    statusPaid: {
        backgroundColor: '#E6F4EA',
    },
    statusUnpaid: {
        backgroundColor: '#FCE8E6',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    emptyState: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: FontSize.md,
    },
});
