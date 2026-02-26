'use client';

import { useRef } from 'react';
import type { Bill } from '@/lib/supabase';
import ActionButtons from './ActionButtons';
import styles from './BillCard.module.css';

interface Props { bill: Bill }

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function formatCurrency(amount: number) {
    return `Rs.${Number(amount).toFixed(2)}`;
}

export default function BillCard({ bill }: Props) {
    const billRef = useRef<HTMLDivElement>(null);

    return (
        <div className={styles.wrapper}>
            {/* ── Bill ───────────────────────────────────────────── */}
            <div className={`${styles.card} bill-card`} ref={billRef} id="bill-card" style={{ position: 'relative' }}>
                {/* Status Badge */}
                <div className={`${styles.statusBadge} ${bill.payment_status === 'paid' ? styles.paid : styles.unpaid}`}>
                    {bill.payment_status === 'paid' ? '✓ Paid' : '⚠ Unpaid'}
                </div>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.headerIcon}>☕</span>
                    <h1 className={styles.cafeName}>Barista Cafe</h1>
                    <h2 className={styles.tagline}>Every cup tells a story</h2>
                    <p className={styles.gstin}>GSTIN: 07AAAAA0000A1Z5</p>
                </div>

                {/* Bill meta */}
                <div className={styles.meta}>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Bill No</span>
                        <span className={styles.metaValue}>{bill.id}</span>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Date & Time</span>
                        <span className={styles.metaValue}>{formatDate(bill.created_at)}</span>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Items table */}
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Item</th>
                            <th className={`${styles.th} ${styles.center}`}>Qty</th>
                            <th className={`${styles.th} ${styles.right}`}>Price</th>
                            <th className={`${styles.th} ${styles.right}`}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.bill_items.map((item) => (
                            <tr key={item.id} className={styles.itemRow}>
                                <td className={styles.td}>{item.item_name}</td>
                                <td className={`${styles.td} ${styles.center}`}>{item.quantity}</td>
                                <td className={`${styles.td} ${styles.right}`}>{formatCurrency(item.price)}</td>
                                <td className={`${styles.td} ${styles.right}`}>{formatCurrency(item.item_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className={styles.divider} />

                {/* Totals */}
                <div className={styles.totals}>
                    <div className={styles.totalRow}>
                        <span>Subtotal</span>
                        <span>{formatCurrency(bill.subtotal)}</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>GST ({bill.tax_rate}%)</span>
                        <span>{formatCurrency(bill.tax_amount)}</span>
                    </div>
                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>Total</span>
                        <span>{formatCurrency(bill.total_amount)}</span>
                    </div>
                </div>

                <div className={styles.divider} />

                <p className={styles.thanks}>Thank you for your visit! 🙏</p>
            </div>

            {/* ── Action Buttons ──────────────────────────────────── */}
            <ActionButtons bill={bill} billRef={billRef} />
        </div>
    );
}
