import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.container}>
      <div className={styles.loader} aria-label="Loading Spendaro..." />
    </main>
  );
}
