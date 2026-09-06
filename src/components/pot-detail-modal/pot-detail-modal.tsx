"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { RectangleToggle } from "@/components/ui/rectangle-toggle/rectangle-toggle";
import styles from "./pot-detail-modal.module.css";
import type { Pot, Expense } from "@/lib/types";

interface PotDetailModalProps {
  pot: Pot;
  balance: number;
  onClose: () => void;
  onTransaction: (payload: Partial<Expense>) => Promise<void>;
  onEdit: () => void;
  onDeleteInitiated: () => void;
}

export function PotDetailModal({
  pot,
  balance,
  onClose,
  onTransaction,
  onEdit,
  onDeleteInitiated,
}: PotDetailModalProps) {
  const [view, setView] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const numAmount = Number.parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount");
      setIsSubmitting(false);
      return;
    }

    if (view === "withdraw" && numAmount > balance) {
      setErrorMsg("Insufficient funds in this pot");
      setIsSubmitting(false);
      return;
    }

    // Amount is positive for Add, negative for Withdraw
    const finalAmount = view === "withdraw" ? -numAmount : numAmount;
    try {
      await onTransaction({
        label: view === "add" ? `Added to ${pot.name}` : `Withdrew from ${pot.name}`,
        category: "Pots",
        amount: finalAmount.toString(),
        type: "savings",
        pot_id: pot.id,
        created_at: new Date().toISOString()
      });
      setAmount("");
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const numAmount = Number.parseFloat(amount) || 0;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={pot.name}
      headerAction={
        <button
          type="button"
          className={styles.editHeaderButton}
          onClick={onEdit}
          title="Edit Pot"
        >
          <Pencil size={14} />
        </button>
      }
    >
      <form className={styles.form} onSubmit={handleTransaction}>
        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={(val) => {
            setAmount(val);
            setErrorMsg("");
          }}
        />

        <RectangleToggle
          options={[
            { value: "add", label: "Add Money" },
            { value: "withdraw", label: "Withdraw" },
          ]}
          value={view}
          onChange={(val) => {
            setView(val as "add" | "withdraw");
            setErrorMsg("");
          }}
          colorMap={{ add: "green", withdraw: "red" }}
        />

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <div className={styles.actionButtonsContainer}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || numAmount <= 0 || (view === "withdraw" && numAmount > balance)}
            fullWidth
          >
            {isSubmitting ? "Saving..." : view === "add" ? "Add Amount" : "Withdraw Amount"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onDeleteInitiated}
            className={styles.deleteButton}
            fullWidth
            disabled={isSubmitting}
          >
            Delete Pot
          </Button>
        </div>
      </form>
    </Modal>
  );
}
