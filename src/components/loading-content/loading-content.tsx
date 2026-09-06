import styles from "./loading.module.css";
import Image from "next/image";

export function LoadingContent() {
  return (
    <main className={styles.container}>
      <Image
        src="/icons/icon-192x192.png"
        alt="Xpenses"
        width={56}
        height={56}
        priority
        unoptimized
        className={styles.logo}
      />
      <div className={styles.loader} aria-label="Loading Xpenses..." />
    </main>
  );
}
