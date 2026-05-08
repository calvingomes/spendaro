"use client";

import { useEffect, useState } from "react";
import { Share, Plus, MoreVertical } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import styles from "./pwa-install-prompt.module.css";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (isStandalone) return;

    // 2. Check if prompt was dismissed in this session
    const isDismissed = sessionStorage.getItem("xpenses_pwa_dismissed") === "true";
    if (isDismissed) return;

    // 3. Detect iOS & Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad/.test(userAgent);
    const detectAndroid = /android/.test(userAgent);
    setIsIOS(detectIOS);
    setIsAndroid(detectAndroid);

    // 4. If iOS or Android, show prompt after a short delay (2 seconds) for guaranteed UX
    if (detectIOS || detectAndroid) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

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
      {isIOS ? (
        <div className={styles.promptContent}>
          <p className={styles.promptText}>
            Add Xpenses to your home screen for quick access:
          </p>
          <div className={styles.iosInstructions}>
            <div className={styles.instructionStep}>
              <span className={styles.stepNumber}>1</span>
              <p>Tap the share button <Share className={styles.inlineIcon} /> in the browser bar.</p>
            </div>
            <div className={styles.instructionStep}>
              <span className={styles.stepNumber}>2</span>
              <p>Scroll down and select <strong className={styles.strongText}>Add to Home Screen</strong> <Plus className={styles.inlineIcon} />.</p>
            </div>
          </div>
          <button className={styles.actionButton} onClick={handleDismiss} type="button">
            Got it
          </button>
        </div>
      ) : (
        <div className={styles.promptContent}>
          <p className={styles.promptText}>
            Add Xpenses to your home screen for quick access:
          </p>
          <div className={styles.iosInstructions}>
            <div className={styles.instructionStep}>
              <span className={styles.stepNumber}>1</span>
              <p>Tap the menu icon <MoreVertical className={styles.inlineIcon} /> in Chrome&apos;s top right.</p>
            </div>
            <div className={styles.instructionStep}>
              <span className={styles.stepNumber}>2</span>
              <p>Select <strong className={styles.strongText}>Install app</strong> or <strong className={styles.strongText}>Add to Home Screen</strong>.</p>
            </div>
          </div>
          <button className={styles.actionButton} onClick={handleDismiss} type="button">
            Got it
          </button>
        </div>
      )}
    </Modal>
  );
}
