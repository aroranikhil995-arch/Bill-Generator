'use client';

import { useRef, useState } from 'react';
import type { Bill } from '@/lib/supabase';
import PaymentModal from './PaymentModal';
import styles from './ActionButtons.module.css';

interface Props {
    bill: Bill;
    billRef: React.RefObject<HTMLDivElement | null>;
}

export default function ActionButtons({ bill, billRef }: Props) {
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    // ─── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = () => window.print();

    // ─── Download PDF ──────────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (!billRef.current) return;
        setDownloading(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: html2canvas } = await import('html2canvas');

            const canvas = await html2canvas(billRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: null
            });
            const imgData = canvas.toDataURL('image/png');

            // Calculate dimensions to match content exactly
            const pdfWidth = (canvas.width / 3);
            const pdfHeight = (canvas.height / 3);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`bill-${bill.id}.pdf`);
        } catch (error) {
            console.error('PDF generation error:', error);
        } finally {
            setDownloading(false);
        }
    };

    // ─── Export Tally XML ──────────────────────────────────────────────────────
    const handleExportTally = () => {
        const date = new Date(bill.created_at).toISOString().split('T')[0].replace(/-/g, '');

        // Generate Inventory Entries for XML
        const inventoryEntries = bill.bill_items.map(item => `
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>${item.item_name}</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${item.price}</RATE>
                            <AMOUNT>${item.item_total}</AMOUNT>
                            <ACTUALQTY>${item.quantity} Nos</ACTUALQTY>
                            <BILLEDQTY>${item.quantity} Nos</BILLEDQTY>
                        </ALLINVENTORYENTRIES.LIST>`).join('');

        const xml = `<?xml version="1.0"?>
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Sales" ACTION="Create">
                        <DATE>${date}</DATE>
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

        const blob = new Blob([xml.trim()], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tally-detailed-${bill.id}.xml`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ─── Share ─────────────────────────────────────────────────────────────────
    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: `Barista Cafe — Bill ${bill.id}`, url });
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <>
            <div className={`${styles.container} no-print`}>
                <button className={`${styles.btn} ${styles.print}`} onClick={handlePrint}>
                    <span>🖨️</span> Print
                </button>

                <button
                    className={`${styles.btn} ${styles.download}`}
                    onClick={handleDownload}
                    disabled={downloading}
                >
                    <span>⬇️</span> {downloading ? 'PDF' : 'Download PDF'}
                </button>

                {bill.payment_status === 'unpaid' && (
                    <button className={`${styles.btn} ${styles.pay}`} onClick={() => setShowPayment(true)}>
                        <span>💰</span> Pay Now
                    </button>
                )}

                <button className={`${styles.btn} ${styles.tally}`} onClick={handleExportTally}>
                    <span>📊</span> Tally XML
                </button>

                <button className={`${styles.btn} ${styles.share}`} onClick={handleShare}>
                    <span>📤</span> {copied ? 'Copied' : 'Share'}
                </button>
            </div>

            {showPayment && (
                <PaymentModal
                    billId={bill.id}
                    amount={bill.total_amount}
                    onClose={() => setShowPayment(false)}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </>
    );
}
