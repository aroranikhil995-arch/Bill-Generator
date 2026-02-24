'use client';

import { use, useEffect, useState } from 'react';
import { fetchBill, type Bill } from '@/lib/supabase';
import BillCard from '@/components/BillCard';
import BillSkeleton from '@/components/BillSkeleton';
import BillNotFound from '@/components/BillNotFound';
import styles from './page.module.css';

interface Props {
    params: Promise<{ billId: string }>;
}

export default function BillPage({ params }: Props) {
    const { billId } = use(params);
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchBill(billId)
            .then((data) => {
                if (data) setBill(data);
                else setError(true);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [billId]);

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.logoWrap}>
                    <span className={styles.logoIcon}>☕</span>
                    <span className={styles.logoText}>Barista Cafe</span>
                </div>
            </header>

            <div className={styles.content}>
                {loading && <BillSkeleton />}
                {!loading && error && <BillNotFound billId={billId} />}
                {!loading && !error && bill && <BillCard bill={bill} />}
            </div>

            <footer className={styles.footer}>
                <p>Thank you for visiting <strong>Barista Cafe</strong> ☕</p>
            </footer>
        </main>
    );
}
