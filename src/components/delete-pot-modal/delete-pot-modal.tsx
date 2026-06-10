"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import { formatCurrency } from "@/utils/expense-utils";
import { deleteLocalPot } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import type { Pot } from "@/lib/types";
import styles from "./delete-pot-modal.module.css";

interface DeletePotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  pot: Pot;
  balance: number;
  onDeleteSuccess: () => void;
}

export function DeletePotModal({ isOpen, onClose, onBack, pot, balance, onDeleteSuccess }: DeletePotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasBalance = balance !== 0;

  const confirmDeletePot = async () => {
    setIsSubmitting(true);
    const isOffline = typeof window !== "undefined" && !navigator.onLine;

    if (isOffline) {
      await deleteLocalPot(pot.id);
      queueAction("DELETE", { id: pot.id }, "pots");
      onDeleteSuccess();
      onClose();
      return;
    }

    try {
      await fetch(`/api/pots?id=${pot.id}`, { method: "DELETE" });
      await deleteLocalPot(pot.id);
      onDeleteSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Pot"
    >
      <div className={styles.deleteConfirmView}>
        {hasBalance ? (
          <>
            <p className={styles.warningText}>
              You must withdraw all money before deleting this pot. Your Current balance is <strong>{formatCurrency(balance)}</strong>.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onBack}
              fullWidth
            >
              Back
            </Button>
          </>
        ) : (
          <>
            <p className={styles.warningText}>
              Are you sure you want to delete <strong>{pot.name}</strong>? This action cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onBack}
                disabled={isSubmitting}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={confirmDeletePot}
                disabled={isSubmitting}
                className={styles.confirmDeleteButton}
                fullWidth
              >
                {isSubmitting ? "Deleting..." : "Delete Pot"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
