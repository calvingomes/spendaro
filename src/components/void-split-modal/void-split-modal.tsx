"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import styles from "./void-split-modal.module.css";
import { putLocalSplit } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useDashboard } from "@/context/dashboard-context";

interface VoidSplitModalProps {
  splitId: string | null;
  onClose: () => void;
}

export function VoidSplitModal({ splitId, onClose }: VoidSplitModalProps) {
  const { splits, setSplits } = useDashboard();
  const [isPending, setIsPending] = useState(false);

  const split = splitId ? splits.find((s) => s.id === splitId) : null;

  const handleVoid = async () => {
    if (!split) return;
    setIsPending(true);
    const updated = { ...split, status: "voided" as const, updated_at: new Date().toISOString() };
    setSplits(splits.map((s) => s.id === split.id ? updated : s));
    await putLocalSplit(updated);
    queueAction("PATCH", { id: split.id, action: "void" }, "splits");
    setIsPending(false);
    onClose();
  };

  if (!split) return null;

  return (
    <Modal isOpen={Boolean(splitId)} onClose={onClose} title="Void split?">
      <div className={styles.container}>
        <p className={styles.description}>
          Voiding <strong>{split.label}</strong> will hide it from open balances.
          All existing expense rows stay intact — no money is reversed.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isPending}
            onClick={handleVoid}
          >
            {isPending ? "Voiding..." : "Void split"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
