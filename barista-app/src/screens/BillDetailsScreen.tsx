import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase, BillItemPayload, BillPayload } from '../services/supabase';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { TouchableOpacity, Alert, Modal, Platform, PermissionsAndroid } from 'react-native';

// ── Vercel deployment URL ─────────────────────────────────────────────────────
const WEB_BASE_URL = 'https://bill-generator-aroranikhil995-1008s-projects.vercel.app';

type Props = NativeStackScreenProps<RootStackParamList, 'BillDetails'>;

export default function BillDetailsScreen({ route }: Props) {
    const { bill: initialBill } = route.params;
    // The bill passed from the list might be a partial view from the database,
    // so we cast it to any and then to our state type to avoid TS complaining about missing fields
    const [bill, setBill] = useState<BillPayload & { created_at?: string }>(initialBill as any);
    const [items, setItems] = useState<BillItemPayload[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [selectedPayMethod, setSelectedPayMethod] = useState<'QR Code' | 'Card' | 'Cash' | null>(null);

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
                <Text style={styles.itemMeta}>Rs.{item.price.toFixed(2)} x {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>Rs.{item.item_total.toFixed(2)}</Text>
        </View>
    );

    // @ts-ignore - created_at exists in DB but might be missing from partial type
    const date = new Date(bill.created_at || new Date().toISOString());
    const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ─── Actions ─────────────────────────────────────────────────────────────

    // Request Storage Permission for Android to write to public Download directory
    const requestStoragePermission = async () => {
        if (Platform.OS !== 'android') return true;

        // Android 13+ handles saving downloaded files explicitly or automatically via the system
        // We only explicitly need WRITE_EXTERNAL_STORAGE for API 32 and below usually, 
        // but we'll try requesting it anyway.
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission',
                    message: 'Barista Cafe needs access to save files to your downloads folder.',
                    buttonPositive: 'OK',
                    buttonNegative: 'Cancel',
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    // Platform-specific download directory
    const getDownloadPath = (filename: string) => {
        const dir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
        return `${dir}/${filename}`;
    };

    const handleDownloadPDF = async () => {
        try {
            // A simple implementation using react-native-html-to-pdf
            // We generate a basic HTML string representation of the bill
            const html = `
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1>Barista Cafe</h1>
                    <p><strong>Order ID:</strong> ${bill.id}</p>
                    <p><strong>Date:</strong> ${dateString}</p>
                    <p><strong>Payment Status:</strong> ${bill.payment_status.toUpperCase()}</p>
                    <hr/>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="text-align: left; border-bottom: 1px solid #ccc;">
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                        ${items.map(item => `
                            <tr>
                                <td>${item.item_name}</td>
                                <td>${item.quantity}</td>
                                <td>Rs.${(item.price || 0).toFixed(2)}</td>
                                <td>Rs.${(item.item_total || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <hr/>
                    <p style="text-align: right;"><strong>Subtotal:</strong> Rs.${(bill.subtotal || 0).toFixed(2)}</p>
                    <p style="text-align: right;"><strong>GST:</strong> Rs.${(bill.tax_amount || 0).toFixed(2)}</p>
                    <h2 style="text-align: right;"><strong>Total:</strong> Rs.${(bill.total_amount || 0).toFixed(2)}</h2>
                </body>
                </html>
            `;

            // Requires `react-native-html-to-pdf` to be fully linked (auto-linking mostly).
            // Check if RNHTMLtoPDF is available
            const RNHTMLtoPDF = require('react-native-html-to-pdf');
            if (RNHTMLtoPDF) {
                const options = {
                    html: html,
                    fileName: `bill-${bill.id}`,
                    directory: 'Documents',
                };

                const file = await RNHTMLtoPDF.convert(options);

                // Ensure permissions before writing
                if (Platform.OS === 'android') {
                    const hasPermission = await requestStoragePermission();
                    if (!hasPermission) {
                        // Fallback to internal storage or just share
                        Alert.alert("Permission denied", "Cannot save directly to Downloads. Please share the file instead.");
                        return;
                    }
                }

                // Copy to public downloads folder
                const destPath = getDownloadPath(`bill-${bill.id}.pdf`);

                if (await RNFS.exists(destPath)) {
                    await RNFS.unlink(destPath);
                }
                await RNFS.copyFile(file.filePath, destPath);

                Alert.alert("Success", `PDF downloaded to:\n${destPath}`);
            } else {
                Alert.alert("Error", "PDF generator module not available.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    const handleExportTally = async () => {
        try {
            // Generate Inventory Entries for XML
            const inventoryEntries = items.map(item => `
                            <ALLINVENTORYENTRIES.LIST>
                                <STOCKITEMNAME>${item.item_name}</STOCKITEMNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <RATE>${item.price}</RATE>
                                <AMOUNT>${item.item_total}</AMOUNT>
                                <ACTUALQTY>${item.quantity} Nos</ACTUALQTY>
                                <BILLEDQTY>${item.quantity} Nos</BILLEDQTY>
                            </ALLINVENTORYENTRIES.LIST>`).join('');

            // Format date as YYYYMMDD for Tally
            const tallyDate = date.toISOString().split('T')[0].replace(/-/g, '');

            const xml = `<?xml version="1.0"?>
    <ENVELOPE>
        <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
        <BODY>
            <IMPORTDATA>
                <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
                <REQUESTDATA>
                    <TALLYMESSAGE xmlns:UDF="TallyUDF">
                        <VOUCHER VCHTYPE="Sales" ACTION="Create">
                            <DATE>${tallyDate}</DATE>
                            <VOUCHERNUMBER>${bill.id}</VOUCHERNUMBER>
                            <REFERENCE>${bill.id}</REFERENCE>
                            <PARTYLEDGERNAME>Cash</PARTYLEDGERNAME>
                            <STATENAME>Delhi</STATENAME>
                            <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
                            <PERSISTEDVIEW>InvoiceView</PERSISTEDVIEW>
                            
                            <!-- Party Entry (Total Amount) -->
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>Cash</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                <AMOUNT>-${bill.total_amount}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>

                            <!-- Items & Inventory Breakdown -->
                            ${inventoryEntries}

                            <!-- Sales Ledger Entry (Subtotal) -->
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>Sales</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <AMOUNT>${bill.subtotal || 0}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>

                            <!-- Tax Ledger Entry (GST) -->
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>Output GST</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <AMOUNT>${bill.tax_amount || 0}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>
                        </VOUCHER>
                    </TALLYMESSAGE>
                </REQUESTDATA>
            </IMPORTDATA>
        </BODY>
    </ENVELOPE>`;

            // Ensure permissions before writing
            if (Platform.OS === 'android') {
                const hasPermission = await requestStoragePermission();
                if (!hasPermission) {
                    Alert.alert("Permission denied", "Cannot save directly to Downloads. Please share the file instead.");
                    return;
                }
            }

            const path = getDownloadPath(`tally-${bill.id}.xml`);
            await RNFS.writeFile(path, xml.trim(), 'utf8');

            Alert.alert("Success", `Tally XML downloaded to:\n${path}`);

        } catch (error) {
            console.error('Error exporting Tally XML: ', error);
            Alert.alert("Error", "Could not export Tally file.");
        }
    };

    const handleShare = async () => {
        const url = `${WEB_BASE_URL}/bill/${bill.id}`;
        try {
            await Share.open({
                title: `Barista Cafe — Bill ${bill.id}`,
                message: `Here is your online bill from Barista Cafe: ${url}`,
                url: url, // Some apps prefer URL separated
            });
        } catch (error: any) {
            if (error.message !== 'User did not share') {
                console.error("Error sharing:", error);
            }
        }
    };

    const handlePaymentAction = async (method: string) => {
        setUpdatingPayment(true);
        try {
            const { error } = await supabase
                .from('bills')
                .update({ payment_status: 'paid' }) // We can add payment_method column later if needed
                .eq('id', bill.id);

            if (error) throw error;

            setBill(prev => ({ ...prev, payment_status: 'paid' }));
            setShowPaymentModal(false);
            setSelectedPayMethod(null);
            Alert.alert("Success", `Payment recorded via ${selectedPayMethod}.`);
        } catch (error) {
            console.error("Payment update failed", error);
            Alert.alert("Error", "Could not update payment status.");
        } finally {
            setUpdatingPayment(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Barista Cafe</Text>
                    <Text style={styles.gstText}>GSTIN: 07AAAAA0000A1Z5</Text>
                    <Text style={styles.subtitle}>Order: {bill.id}</Text>
                    <Text style={styles.date}>{dateString}</Text>
                    <View style={[styles.statusBadge, bill.payment_status === 'paid' ? styles.statusPaid : styles.statusUnpaid]}>
                        <Text style={styles.statusText}>{bill.payment_status === 'paid' ? '● PAID' : '○ UNPAID'}</Text>
                    </View>
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
                                <Text style={styles.grandTotalValue}>Rs.{bill.total_amount.toFixed(2)}</Text>
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

            {/* Action Buttons Section */}
            {!loading && (
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={handleDownloadPDF} disabled={updatingPayment}>
                        <Text style={styles.btnText}>⬇️ PDF</Text>
                    </TouchableOpacity>

                    {bill.payment_status === 'unpaid' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.payBtn]} onPress={() => setShowPaymentModal(true)} disabled={updatingPayment}>
                            <Text style={styles.btnTextLight}>💰 Pay</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.actionBtn, styles.tallyBtn]} onPress={handleExportTally} disabled={updatingPayment}>
                        <Text style={styles.btnTextLight}>📊 Tally</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare} disabled={updatingPayment}>
                        <Text style={styles.btnText}>📤 Share</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Payment Modal */}
            <Modal visible={showPaymentModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Payment Method</Text>
                            <Text style={styles.modalAmount}>Rs.{bill.total_amount.toFixed(2)}</Text>
                        </View>

                        {updatingPayment ? (
                            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 30 }} />
                        ) : (
                            <View>
                                {/* Methods */}
                                <View style={styles.paymentOptions}>
                                    <TouchableOpacity
                                        style={[styles.payOptionBtn, selectedPayMethod === 'QR Code' && styles.selectedOption]}
                                        onPress={() => setSelectedPayMethod('QR Code')}
                                    >
                                        <Text style={styles.payOptionIcon}>📱</Text>
                                        <Text style={[styles.payOptionText, selectedPayMethod === 'QR Code' && styles.selectedOptionText]}>QR Code</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.payOptionBtn, selectedPayMethod === 'Card' && styles.selectedOption]}
                                        onPress={() => setSelectedPayMethod('Card')}
                                    >
                                        <Text style={styles.payOptionIcon}>💳</Text>
                                        <Text style={[styles.payOptionText, selectedPayMethod === 'Card' && styles.selectedOptionText]}>Card</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.payOptionBtn, selectedPayMethod === 'Cash' && styles.selectedOption]}
                                        onPress={() => setSelectedPayMethod('Cash')}
                                    >
                                        <Text style={styles.payOptionIcon}>💵</Text>
                                        <Text style={[styles.payOptionText, selectedPayMethod === 'Cash' && styles.selectedOptionText]}>Cash</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Sample Content based on Selection */}
                                {selectedPayMethod === 'QR Code' && (
                                    <View style={styles.methodPreview}>
                                        <QRCode value="upi://pay?pa=merchant@upi&pn=Barista" size={120} />
                                        <Text style={styles.previewText}>Ask customer to scan</Text>
                                    </View>
                                )}
                                {selectedPayMethod === 'Card' && (
                                    <View style={styles.methodPreview}>
                                        <Text style={{ fontSize: 40 }}>💳 Terminal</Text>
                                        <Text style={styles.previewText}>Waiting for tape / insert...</Text>
                                    </View>
                                )}
                                {selectedPayMethod === 'Cash' && (
                                    <View style={styles.methodPreview}>
                                        <Text style={{ fontSize: 40 }}>💵 Cash</Text>
                                        <Text style={styles.previewText}>Receive cash from customer</Text>
                                    </View>
                                )}

                                {/* Action Buttons */}
                                <View style={styles.modalActionButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelModalBtnRow}
                                        onPress={() => {
                                            setShowPaymentModal(false);
                                            setSelectedPayMethod(null);
                                        }}
                                        disabled={updatingPayment}
                                    >
                                        <Text style={styles.cancelModalTxtRow}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.acceptModalBtn, !selectedPayMethod && styles.acceptModalBtnDisabled]}
                                        onPress={() => {
                                            if (selectedPayMethod) handlePaymentAction(selectedPayMethod);
                                        }}
                                        disabled={!selectedPayMethod || updatingPayment}
                                    >
                                        <Text style={styles.acceptModalTxt}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
    statusBadge: {
        alignSelf: 'center',
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Radius.md,
    },
    statusPaid: {
        backgroundColor: '#E6F4EA',
    },
    statusUnpaid: {
        backgroundColor: '#FCE8E6',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 1,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20,
        marginHorizontal: 16,
        gap: 12,
    },
    actionBtn: {
        width: '48%',
        paddingVertical: 14,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        ...Shadow.card,
    },
    pdfBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    payBtn: {
        backgroundColor: Colors.primary,
    },
    tallyBtn: {
        backgroundColor: '#1E3A8A', // A distinct blue for Tally
    },
    shareBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    btnText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
    },
    btnTextLight: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radius.lg,
        borderTopRightRadius: Radius.lg,
        padding: 24,
        paddingBottom: 40,
        ...Shadow.card,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    modalAmount: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.primary,
    },
    paymentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    payOptionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginHorizontal: 4,
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedOption: {
        borderColor: Colors.primary,
        backgroundColor: '#F3ECE7',
        borderWidth: 2,
    },
    payOptionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    payOptionText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.text,
    },
    selectedOptionText: {
        color: Colors.primary,
        fontWeight: '800',
    },
    methodPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        marginBottom: 24,
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    previewText: {
        marginTop: 12,
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelModalBtnRow: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: Radius.md,
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelModalTxtRow: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    acceptModalBtn: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: Radius.md,
        backgroundColor: Colors.primary,
    },
    acceptModalBtnDisabled: {
        backgroundColor: Colors.border,
    },
    acceptModalTxt: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
