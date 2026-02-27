import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase, BillItemPayload, BillPayload } from '../services/supabase';
import { Colors, FontSize, Radius, Shadow } from '../theme/colors';
import QRCode from 'react-native-qrcode-svg';
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { TouchableOpacity, Alert, Modal } from 'react-native';

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

    const handlePrint = async () => {
        try {
            const isConnected = await BluetoothEscposPrinter.printerInit();

            console.log('[PRINT] Starting print sequence for old bill...');
            // Print header
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
            await BluetoothEscposPrinter.setBlob(1);
            await BluetoothEscposPrinter.printText('Barista Cafe\n', { widthtimes: 1, heigthtimes: 1, encoding: 'UTF-8' });
            await BluetoothEscposPrinter.setBlob(0);
            await BluetoothEscposPrinter.printText('GSTIN: 07AAAAA0000A1Z5\n', { encoding: 'UTF-8' });
            await BluetoothEscposPrinter.printText(`Bill #${bill.id}\n`, { encoding: 'UTF-8' });
            await BluetoothEscposPrinter.printText(`${dateString}\n`, { encoding: 'UTF-8' });
            await BluetoothEscposPrinter.printText('--------------------------------\n', { encoding: 'UTF-8' });

            // Print Items List Header
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
            await BluetoothEscposPrinter.printColumn(
                [14, 10, 8],
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
                ['Item', 'Qty', 'Total'],
                { encoding: 'UTF-8' }
            );
            await BluetoothEscposPrinter.printText('--------------------------------\n', { encoding: 'UTF-8' });

            // Print Items
            for (const item of items) {
                await BluetoothEscposPrinter.printColumn(
                    [14, 10, 8],
                    [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
                    [item.item_name.substring(0, 14), `${item.quantity}`, `Rs.${item.item_total.toFixed(2)}`],
                    { encoding: 'UTF-8' }
                );
            }

            // Print Totals
            await BluetoothEscposPrinter.printText('--------------------------------\n', { encoding: 'UTF-8' });
            await BluetoothEscposPrinter.printColumn(
                [20, 12],
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                ['Subtotal:', `Rs.${bill.subtotal.toFixed(2)}`],
                { encoding: 'UTF-8' }
            );
            await BluetoothEscposPrinter.printColumn(
                [20, 12],
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                ['GST (5%):', `Rs.${bill.tax_amount.toFixed(2)}`],
                { encoding: 'UTF-8' }
            );
            await BluetoothEscposPrinter.printText('--------------------------------\n', { encoding: 'UTF-8' });
            await BluetoothEscposPrinter.setBlob(1);
            await BluetoothEscposPrinter.printColumn(
                [20, 12],
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                ['TOTAL:', `Rs.${bill.total_amount.toFixed(2)}`],
                { encoding: 'UTF-8' }
            );
            await BluetoothEscposPrinter.setBlob(0);
            await BluetoothEscposPrinter.printText('--------------------------------\n\n', { encoding: 'UTF-8' });

            // Print QR Code
            const qrUrlForPrint = encodeURI(`${WEB_BASE_URL}/bill/${bill.id}`);
            await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
            await BluetoothEscposPrinter.printText('Scan to view your bill online\n', { encoding: 'UTF-8' });
            await BluetoothEscposPrinter.printQRCode(qrUrlForPrint, 280, BluetoothEscposPrinter.ERROR_CORRECTION.M);
            await BluetoothEscposPrinter.printText('\n\n\n', { encoding: 'UTF-8' });

        } catch (e: any) {
            console.error('Print error:', e);
            Alert.alert('Printer Error', String(e));
        }
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
                                <td>Rs.${item.price.toFixed(2)}</td>
                                <td>Rs.${item.item_total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <hr/>
                    <p style="text-align: right;"><strong>Subtotal:</strong> Rs.${bill.subtotal.toFixed(2)}</p>
                    <p style="text-align: right;"><strong>GST:</strong> Rs.${bill.tax_amount.toFixed(2)}</p>
                    <h2 style="text-align: right;"><strong>Total:</strong> Rs.${bill.total_amount.toFixed(2)}</h2>
                </body>
                </html>
            `;

            // Requires `react-native-html-to-pdf` to be fully linked (auto-linking mostly).
            // Check if RNHTMLtoPDF is available
            const RNHTMLtoPDF = require('react-native-html-to-pdf');
            if (RNHTMLtoPDF) {
                let options = {
                    html: html,
                    fileName: `bill-${bill.id}`,
                    directory: 'Documents',
                };

                let file = await RNHTMLtoPDF.convert(options);

                await Share.open({
                    url: `file://${file.filePath}`,
                    title: 'Download PDF',
                });
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
                                <AMOUNT>${bill.subtotal}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>

                            <!-- Tax Ledger Entry (GST) -->
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>Output GST</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <AMOUNT>${bill.tax_amount}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>
                        </VOUCHER>
                    </TALLYMESSAGE>
                </REQUESTDATA>
            </IMPORTDATA>
        </BODY>
    </ENVELOPE>`;

            const path = `${RNFS.DocumentDirectoryPath}/tally-${bill.id}.xml`;
            await RNFS.writeFile(path, xml.trim(), 'utf8');

            await Share.open({
                title: `Tally XML - ${bill.id}`,
                url: `file://${path}`,
                type: 'application/xml',
                message: `Tally Data for Bill ${bill.id}`,
            });

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
            Alert.alert("Success", `Payment recorded via ${method}.`);
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
                    <TouchableOpacity style={[styles.actionBtn, styles.printBtn]} onPress={handlePrint} disabled={updatingPayment}>
                        <Text style={styles.btnText}>🖨️ Print</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={handleDownloadPDF} disabled={updatingPayment}>
                        <Text style={styles.btnText}>⬇️ Download PDF</Text>
                    </TouchableOpacity>

                    {bill.payment_status === 'unpaid' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.payBtn]} onPress={() => setShowPaymentModal(true)} disabled={updatingPayment}>
                            <Text style={styles.btnTextLight}>💰 Pay Now</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.actionBtn, styles.tallyBtn]} onPress={handleExportTally} disabled={updatingPayment}>
                        <Text style={styles.btnTextLight}>📊 Tally XML</Text>
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
                            <View style={styles.paymentOptions}>
                                <TouchableOpacity style={styles.payOptionBtn} onPress={() => handlePaymentAction('QR Code')}>
                                    <Text style={styles.payOptionIcon}>📱</Text>
                                    <Text style={styles.payOptionText}>QR Code</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.payOptionBtn} onPress={() => handlePaymentAction('Card')}>
                                    <Text style={styles.payOptionIcon}>💳</Text>
                                    <Text style={styles.payOptionText}>Card</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.payOptionBtn} onPress={() => handlePaymentAction('Cash')}>
                                    <Text style={styles.payOptionIcon}>💵</Text>
                                    <Text style={styles.payOptionText}>Cash</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.cancelModalBtn}
                            onPress={() => setShowPaymentModal(false)}
                            disabled={updatingPayment}
                        >
                            <Text style={styles.cancelModalTxt}>Cancel</Text>
                        </TouchableOpacity>
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
        gap: 10,
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
    printBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pdfBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    payBtn: {
        backgroundColor: Colors.primary,
        width: '100%',
    },
    tallyBtn: {
        backgroundColor: '#1E3A8A', // A distinct blue for Tally
        width: '100%',
    },
    shareBtn: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        width: '100%', // full width
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
    payOptionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    payOptionText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.text,
    },
    cancelModalBtn: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: Radius.md,
        backgroundColor: Colors.bg,
    },
    cancelModalTxt: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textMuted,
    },
});
