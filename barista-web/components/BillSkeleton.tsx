import styles from './BillSkeleton.module.css';

export default function BillSkeleton() {
    return (
        <div className={styles.card}>
            <div className={`${styles.pulse} ${styles.header}`} />
            <div className={styles.body}>
                {[1, 2].map(i => (
                    <div key={i} className={styles.metaRow}>
                        <div className={`${styles.pulse} ${styles.short}`} />
                        <div className={`${styles.pulse} ${styles.medium}`} />
                    </div>
                ))}
                <div className={`${styles.pulse} ${styles.divider}`} />
                {[1, 2, 3].map(i => (
                    <div key={i} className={styles.itemRow}>
                        <div className={`${styles.pulse} ${styles.long}`} />
                        <div className={`${styles.pulse} ${styles.small}`} />
                        <div className={`${styles.pulse} ${styles.small}`} />
                        <div className={`${styles.pulse} ${styles.small}`} />
                    </div>
                ))}
                <div className={`${styles.pulse} ${styles.divider}`} />
                {[1, 2, 3].map(i => (
                    <div key={i} className={styles.metaRow}>
                        <div className={`${styles.pulse} ${styles.medium}`} />
                        <div className={`${styles.pulse} ${styles.medium}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
