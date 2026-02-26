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

    // Form states
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const isFormValid = () => {
        if (selected === 'upi') return upiId.includes('@');
        if (selected === 'card') return cardNumber.length >= 16 && expiry.length >= 5 && cvv.length >= 3;
        if (selected === 'cash') return true;
        return false;
    };

    const handlePay = async () => {
        if (!selected || !isFormValid()) return;
        setProcessing(true);

        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const { error: updateError } = await supabase
                .from('bills')
                .update({
                    payment_status: 'paid',
                    payment_method: selected
                })
                .eq('id', billId);

            if (updateError) {
                console.error('Supabase update error:', updateError);
                throw new Error(updateError.message);
            }

            setIsDone(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error: any) {
            console.error('Payment update failed:', error);
            alert(`Payment could not be recorded: ${error.message || 'Unknown error'}`);
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
                        <p>Thank you for your payment of Rs.{amount.toFixed(2)}</p>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>Refreshing your bill...</p>
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
                    <div className={styles.amount}>Rs.{amount.toFixed(2)}</div>
                </div>

                <div className={styles.content}>
                    <h3 className={styles.sectionTitle}>Select Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {METHODS.map(m => (
                            <div key={m.id}>
                                <div
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

                                {selected === m.id && m.id === 'upi' && (
                                    <div className={styles.form} style={{ marginTop: '8px' }}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Enter UPI ID</label>
                                            <input
                                                className={styles.input}
                                                placeholder="yourname@bank"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selected === m.id && m.id === 'card' && (
                                    <div className={styles.form} style={{ marginTop: '8px' }}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Card Number</label>
                                            <input
                                                className={styles.input}
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.row}>
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Expiry</label>
                                                <input
                                                    className={styles.input}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    value={expiry}
                                                    onChange={(e) => setExpiry(e.target.value)}
                                                />
                                            </div>
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>CVV</label>
                                                <input
                                                    className={styles.input}
                                                    placeholder="123"
                                                    maxLength={3}
                                                    type="password"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.payBtn}
                        disabled={!selected || !isFormValid() || processing}
                        onClick={handlePay}
                    >
                        {processing ? 'Processing Securely...' : `Pay Rs.${amount.toFixed(2)}`}
                    </button>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={processing}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
