'use client';

import { useRef, useState } from 'react';
import type { Bill } from '@/lib/supabase';
import styles from './ActionButtons.module.css';

interface Props {
    bill: Bill;
    billRef: React.RefObject<HTMLDivElement | null>;
}

export default function ActionButtons({ bill, billRef }: Props) {
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    // ─── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = () => window.print();

    // ─── Download PDF ──────────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (!billRef.current) return;
        setDownloading(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: html2canvas } = await import('html2canvas');

            const canvas = await html2canvas(billRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a5' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`bill-${bill.id}.pdf`);
        } finally {
            setDownloading(false);
        }
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
        <div className={`${styles.container} no-print`}>
            <button className={`${styles.btn} ${styles.print}`} onClick={handlePrint}>
                <span>🖨️</span> Print
            </button>

            <button
                className={`${styles.btn} ${styles.download}`}
                onClick={handleDownload}
                disabled={downloading}
            >
                <span>⬇️</span> {downloading ? 'Generating…' : 'Download PDF'}
            </button>

            <button className={`${styles.btn} ${styles.share}`} onClick={handleShare}>
                <span>📤</span> {copied ? 'Link Copied!' : 'Share'}
            </button>
        </div>
    );
}
