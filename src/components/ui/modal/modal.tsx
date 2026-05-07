"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const updateViewport = () => {
      document.documentElement.style.setProperty("--vv-height", `${window.visualViewport!.height}px`);
    };

    window.visualViewport.addEventListener("resize", updateViewport);
    updateViewport(); // Initial set

    return () => window.visualViewport?.removeEventListener("resize", updateViewport);
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.modalOverlay} />
        <Dialog.Content className={styles.modalCard}>
          <div className={styles.modalScrollArea}>
            <Dialog.Title className={styles.modalTitle}>{title}</Dialog.Title>
            <Dialog.Description className={styles.visuallyHidden}>
              {description ?? `Modal content for ${title}`}
            </Dialog.Description>
            <Dialog.Close className={styles.closeButton}>
              <X size={16} />
            </Dialog.Close>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
