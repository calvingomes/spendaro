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
  peerId: string | null;
  onClose: () => void;
}

export function VoidSplitModal({ splitId, peerId, onClose }: VoidSplitModalProps) {
  const { splits, setSplits, peers } = useDashboard();
  const [isPending, setIsPending] = useState(false);

  const split = splitId ? splits.find((s) => s.id === splitId) : null;

  const handleVoid = async () => {
    if (!split || !peerId) return;
    setIsPending(true);
    const updated = {
      ...split,
      updated_at: new Date().toISOString(),
      peer_breakdown: split.peer_breakdown.map((entry) => entry.peer_id === peerId ? { ...entry, status: "voided" as const } : entry),
    };
    setSplits(splits.map((s) => s.id === split.id ? updated : s));
    await putLocalSplit(updated);
    queueAction("PATCH", { id: split.id, action: "void-peer", peer_id: peerId }, "splits");
    setIsPending(false);
    onClose();
  };

  if (!split) return null;
  const peer = peers.find((item) => item.id === peerId);

  return (
    <Modal isOpen={Boolean(splitId && peerId)} onClose={onClose} title="Void this share?">
      <div className={styles.container}>
        <p className={styles.description}>
          Voiding <strong>{peer?.name ?? "this person's"}</strong> share of <strong>{split.label}</strong> removes it from their open balance. Other participants and the expense remain unchanged.
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
            {isPending ? "Voiding..." : "Void share"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
