import styles from './BillNotFound.module.css';

interface Props { billId: string }

export default function BillNotFound({ billId }: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.icon}>🔍</div>
            <h2 className={styles.title}>Bill Not Found</h2>
            <p className={styles.desc}>
                We could not find bill <strong>{billId}</strong>.<br />
                Please check that you scanned the correct QR code.
            </p>
            <p className={styles.hint}>
                If you believe this is an error, please speak with cafe staff.
            </p>
        </div>
    );
}
