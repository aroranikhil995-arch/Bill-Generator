'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './PaymentModal.module.css';

interface Props {
    billId: string;
    amount: number;
    onClose: () => void;
    onSuccess: () => void;
}

const METHODS = [
    { id: 'upi', name: 'UPI (GPay, PhonePe)', icon: '📱', desc: 'Scan or enter UPI ID' },
    { id: 'card', name: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Amex' },
    { id: 'cash', name: 'Pay at Counter', icon: '🏪', desc: 'Notify staff for cash payment' },
];

export default function PaymentModal({ billId, amount, onClose, onSuccess }: Props) {
    const [selected, setSelected] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handlePay = async () => {
        if (!selected) return;
        setProcessing(true);

        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const { error } = await supabase
                .from('bills')
                .update({
                    payment_status: 'paid',
                    payment_method: selected
                })
                .eq('id', billId);

            if (error) throw error;

            setIsDone(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Payment update failed:', error);
            alert('Simulation failed, please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (isDone) {
        return (
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✅</div>
                        <h2 className={styles.title}>Payment Successful!</h2>
                        <p>Thank you for your payment of ${amount.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.title}>Checkout</div>
                    <div className={styles.amount}>${amount.toFixed(2)}</div>
                </div>

                <div className={styles.content}>
                    <h3 className={styles.sectionTitle}>Select Payment Method</h3>
                    {METHODS.map(m => (
                        <div
                            key={m.id}
                            className={`${styles.option} ${selected === m.id ? styles.optionActive : ''}`}
                            onClick={() => setSelected(m.id)}
                        >
                            <span className={styles.icon}>{m.icon}</span>
                            <div className={styles.optionInfo}>
                                <span className={styles.optionName}>{m.name}</span>
                                <span className={styles.optionDesc}>{m.desc}</span>
                            </div>
                            {selected === m.id && <span>🔘</span>}
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.payBtn}
                        disabled={!selected || processing}
                        onClick={handlePay}
                    >
                        {processing ? 'Processing Securely...' : `Pay $${amount.toFixed(2)}`}
                    </button>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={processing}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
