"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import styles from "./whats-new-modal.module.css";
import { CURRENT_VERSION, RELEASE_FEATURES } from "./features-config";

const STORAGE_KEY = "xpenses_last_seen_version";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Explicitly ensure we are inside the installed standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (!isStandalone) return;

    // 2. Gating check for versioning
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Short delay to let main dashboard paint first for smooth arrival feel
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="What's New"
      description={`Update summary for release v${CURRENT_VERSION}`}
    >
      <div className={styles.content}>
        <div className={styles.featureList}>
          {RELEASE_FEATURES.map(({ id, icon: Icon, title, description }) => (
            <div key={id} className={styles.featureItem}>
              <div className={styles.iconWrapper}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className={styles.textGroup}>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{description}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          className={styles.actionButton} 
          onClick={handleDismiss}
        >
          Great, let&apos;s go
        </button>
      </div>
    </Modal>
  );
}
