"use client";

import { useEffect, useState } from "react";
import { Share, Plus, MoreVertical } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import styles from "./pwa-install-prompt.module.css";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (isStandalone) return;

    // 2. Check if prompt was dismissed in this session
    const isDismissed = sessionStorage.getItem("spendaro_pwa_dismissed") === "true";
    if (isDismissed) return;

    // 3. Detect iOS & Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad/.test(userAgent);
    const detectAndroid = /android/.test(userAgent);
    setIsIOS(detectIOS);
    setIsAndroid(detectAndroid);

    // 4. Handle Android/Chrome beforeinstallprompt event (enables 1-click install)
    const handleBeforeInstallPrompt = (e: Event) => {
      if (!detectAndroid) return;
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. If iOS or Android, show prompt after a short delay (2 seconds) for guaranteed UX
    if (detectIOS || detectAndroid) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("spendaro_pwa_dismissed", "true");
    setShowPrompt(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger the native installation flow
    deferredPrompt.prompt();
    
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      sessionStorage.setItem("spendaro_pwa_dismissed", "true");
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  return (
    <Modal 
      isOpen={showPrompt} 
      onClose={handleDismiss} 
      title="Install Spendaro"
      description="Add Spendaro to your device for quick, native-feeling expense tracking."
    >
      {isIOS ? (
        <div className={styles.promptContent}>
          <p className={styles.promptText}>
            Add Spendaro to your home screen for quick access:
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
      ) : deferredPrompt ? (
        <div className={styles.promptContent}>
          <p className={styles.promptText}>
            Install Spendaro on your device to track expenses faster, directly from your home screen.
          </p>
          <div className={styles.buttonGroup}>
            <button className={styles.actionButton} onClick={handleInstallClick} type="button">
              Add to home screen
            </button>
            <button className={styles.cancelButton} onClick={handleDismiss} type="button">
              Not now
            </button>
          </div>
        </div>
      ) : isAndroid ? (
        <div className={styles.promptContent}>
          <p className={styles.promptText}>
            Add Spendaro to your home screen for quick access:
          </p>
          <div className={styles.iosInstructions}>
            <div className={styles.instructionStep}>
              <span className={styles.stepNumber}>1</span>
              <p>Tap the menu icon <MoreVertical className={styles.inlineIcon} /> in Chrome's top right.</p>
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
      ) : null}
    </Modal>
  );
}
