"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Button } from "@/components/ui/button/button";
import { DateInput } from "@/components/ui/date-input/date-input";
import styles from "./repayment-modal.module.css";
import { SPLIT_CATEGORY_TAG, formatCurrency, formatDateForInput, parseAmount } from "@/utils/expense-utils";
import { putLocalExpense, putLocalSplit } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useDashboard } from "@/context/dashboard-context";
import type { Expense } from "@/lib/types";

interface RepaymentModalProps {
  peerId: string | null;
  onClose: () => void;
}

export function RepaymentModal({ peerId, onClose }: RepaymentModalProps) {
  const { peers, splits, setSplits, expenses, setExpenses, user } = useDashboard();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peer = peerId ? peers.find((p) => p.id === peerId) : null;

  const openSplits = splits.filter(
    (s) => s.status === "open" && s.peer_breakdown.some((pb) => pb.peer_id === peerId && pb.status !== "voided")
  );

  const totalOutstanding = openSplits.reduce((sum, s) => {
    const entry = s.peer_breakdown.find((pb) => pb.peer_id === peerId);
    if (!entry) return sum;
    return sum + Math.max(0, entry.amount_owed - entry.amount_repaid);
  }, 0);
  const remainingAfterRepayment = Math.max(0, totalOutstanding - (parseAmount(amount) || 0));

  useEffect(() => {
    if (peerId) {
      setAmount("");
      setDate(formatDateForInput(new Date()));
      setError(null);
    }
  }, [peerId]);

  const handleSubmit = async () => {
    setError(null);
    const repaymentAmount = parseAmount(amount);
    if (!repaymentAmount || repaymentAmount <= 0) { setError("Enter a valid amount."); return; }
    if (repaymentAmount > totalOutstanding + 0.001) {
      setError(`Cannot exceed outstanding balance of ${formatCurrency(totalOutstanding)}.`); return;
    }
    if (!peer) return;

    setIsPending(true);
    try {
      const now = date
        ? new Date(date + "T" + new Date().toTimeString().slice(0, 8)).toISOString()
        : new Date().toISOString();

      const sortedOpenSplits = [...openSplits].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      let remaining = repaymentAmount;
      const updatedSplits = splits.map((s) => ({ ...s, peer_breakdown: s.peer_breakdown.map((pb) => ({ ...pb })) }));
      const newExpenses: Expense[] = [];

      for (const split of sortedOpenSplits) {
        if (remaining <= 0) break;
        const splitIdx = updatedSplits.findIndex((s) => s.id === split.id);
        const pbIdx = updatedSplits[splitIdx].peer_breakdown.findIndex((pb) => pb.peer_id === peerId);
        if (splitIdx === -1 || pbIdx === -1) continue;

        const pb = updatedSplits[splitIdx].peer_breakdown[pbIdx];
        if (pb.status === "voided") continue;
        const rowRemaining = pb.amount_owed - pb.amount_repaid;
        const allocated = Math.min(remaining, rowRemaining);

        updatedSplits[splitIdx].peer_breakdown[pbIdx].amount_repaid += allocated;
        const expenseType = split.direction === "i_owe_them" ? "debit" : "credit";

        const creditExpense: Expense = {
          id: crypto.randomUUID(),
          user_id: user.id,
          label: `Repayment · ${peer.name}`,
          category: SPLIT_CATEGORY_TAG,
          amount: allocated,
          type: expenseType,
          created_at: now,
          updated_at: now,
        };
        newExpenses.push(creditExpense);
        await putLocalExpense(creditExpense);
        await putLocalSplit(updatedSplits[splitIdx]);

        remaining -= allocated;
      }

      setSplits(updatedSplits);
      setExpenses([...newExpenses, ...expenses]);

      queueAction("REPAY", { peer_id: peerId, amount: repaymentAmount, date: now }, "splits");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record repayment");
    } finally {
      setIsPending(false);
    }
  };

  if (!peer) return null;

  return (
    <Modal isOpen={Boolean(peerId)} onClose={onClose} title={`Repayment · ${peer.name}`}>
      <div className={styles.form}>
        <AmountInput value={amount} onChange={setAmount} />
        <p className={styles.outstandingHint}>
          {formatCurrency(remainingAfterRepayment)} remaining after repayment
        </p>
        <DateInput value={date} onChange={setDate} />
        {error && <p className={styles.error}>{error}</p>}
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isPending || !amount || parseAmount(amount) <= 0}
          onClick={handleSubmit}
        >
          {isPending ? "Saving..." : "Record Repayment"}
        </Button>
      </div>
    </Modal>
  );
}
