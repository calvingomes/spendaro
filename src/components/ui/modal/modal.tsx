"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, description, headerAction, children }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.modalOverlay} />
        <Dialog.Content className={styles.modalCard}>
          <Dialog.Title className={`${styles.modalTitle} ${subtitle ? styles.modalTitleWithSubtitle : ""}`}>{title}</Dialog.Title>
          {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
          <Dialog.Description className={styles.visuallyHidden}>
            {description ?? `Modal content for ${title}`}
          </Dialog.Description>
          {headerAction && (
            <div className={styles.headerAction}>
              {headerAction}
            </div>
          )}
          <Dialog.Close className={styles.closeButton}>
            <X size={16} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
