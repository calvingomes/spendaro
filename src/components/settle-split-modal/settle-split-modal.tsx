"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import styles from "./settle-split-modal.module.css";
import { formatCurrency } from "@/utils/expense-utils";
import { putLocalExpense, putLocalSplit } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useDashboard } from "@/context/dashboard-context";
import type { Expense } from "@/lib/types";

interface SettleSplitModalProps {
  splitId: string | null;
  peerId: string | null;
  onClose: () => void;
  onVoid: (splitId: string, peerId: string) => void;
}

export function SettleSplitModal({ splitId, peerId, onClose, onVoid }: SettleSplitModalProps) {
  const { splits, setSplits, peers, expenses, setExpenses, user } = useDashboard();
  const [isPending, setIsPending] = useState(false);
  const split = splitId ? splits.find((item) => item.id === splitId) : null;
  const peer = peers.find((item) => item.id === peerId);
  const entry = split?.peer_breakdown.find((item) => item.peer_id === peerId);
  const remaining = entry ? Math.max(0, entry.amount_owed - entry.amount_repaid) : 0;

  const handleMarkPaid = async () => {
    if (!split || !peer || !entry || remaining <= 0) return;
    setIsPending(true);
    const now = new Date().toISOString();
    const updatedSplit = {
      ...split,
      updated_at: now,
      peer_breakdown: split.peer_breakdown.map((item) => item.peer_id === peer.id
        ? { ...item, amount_repaid: item.amount_owed }
        : item),
    };
    const repayment: Expense = {
      id: crypto.randomUUID(),
      user_id: user.id,
      label: `Repayment · ${peer.name}`,
      category: "__split__",
      amount: remaining,
      type: "credit",
      created_at: now,
      updated_at: now,
    };

    setSplits(splits.map((item) => item.id === split.id ? updatedSplit : item));
    setExpenses([repayment, ...expenses]);
    await Promise.all([putLocalSplit(updatedSplit), putLocalExpense(repayment)]);
    queueAction("REPAY", { peer_id: peer.id, split_id: split.id, amount: remaining, date: now }, "splits");
    setIsPending(false);
    onClose();
  };

  if (!split || !peer || !entry) return null;

  return (
    <Modal isOpen={Boolean(splitId && peerId)} onClose={onClose} title="Settle up">
      <div className={styles.container}>
        <p className={styles.description}>
          How would you like to settle <strong>{formatCurrency(remaining)}</strong> for <strong>{split.label}</strong> with <strong>{peer.name}</strong>?
        </p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" size="md" disabled={isPending} onClick={() => { onVoid(split.id, peer.id); onClose(); }}>
            Void split
          </Button>
          <Button type="button" variant="primary" size="md" disabled={isPending || remaining <= 0} onClick={handleMarkPaid}>
            {isPending ? "Saving..." : "Mark as paid"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
