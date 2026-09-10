"use client";

import { useEffect, useState } from "react";
import { Share, MoreVertical } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import styles from "./pwa-install-prompt.module.css";
import { useDashboard } from "@/context/dashboard-context";

export function PwaInstallPrompt() {
  const { isExpenseModalOpen } = useDashboard();
  const [showPrompt, setShowPrompt] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (isStandalone) return;

    const isDismissed = sessionStorage.getItem("xpenses_pwa_dismissed") === "true";
    if (isDismissed) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad/.test(userAgent);
    const detectAndroid = /android/.test(userAgent);
    setIsIOS(detectIOS);
    setIsAndroid(detectAndroid);

    if (detectIOS || detectAndroid) {
      setShouldShow(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldShow || isExpenseModalOpen) return;
    const timer = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, [shouldShow, isExpenseModalOpen]);

  const handleDismiss = () => {
    sessionStorage.setItem("xpenses_pwa_dismissed", "true");
    setShowPrompt(false);
  };

  if (!isIOS && !isAndroid) return null;

  return (
    <Modal
      isOpen={showPrompt}
      onClose={handleDismiss}
      title="Install Xpenses"
      description="Add Xpenses to your device for quick, native-feeling expense tracking."
    >
      <div className={styles.promptContent}>
        <p className={styles.promptText}>
          Add Xpenses to your home screen for quick access.
        </p>
        <div className={styles.instructions}>
          {isIOS ? (
            <>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>1</span>
                <p>
                  Tap the share button <Share className={styles.inlineIcon} /> in the browser bar.
                </p>
              </div>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>2</span>
                <p>
                  Scroll down and select <strong className={styles.strongText}>Add to Home Screen</strong>.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>1</span>
                <p>
                  Tap the menu icon <MoreVertical className={styles.inlineIcon} /> in Chrome&apos;s top right.
                </p>
              </div>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>2</span>
                <p>
                  Select <strong className={styles.strongText}>Install app</strong> or <strong className={styles.strongText}>Add to Home Screen</strong>.
                </p>
              </div>
            </>
          )}
        </div>
        <button className={styles.actionButton} onClick={handleDismiss} type="button">
          Got it
        </button>
      </div>
    </Modal>
  );
}
