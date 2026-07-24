import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import styles from "./subscription-modal.module.css";
import type { Subscription } from "@/lib/types";
import { capitalizeWords } from "@/utils/expense-utils";
import { putLocalSubscription } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (sub: Subscription) => void;
  subscription?: Subscription | null;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  subscription
}: SubscriptionModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [renewalDay, setRenewalDay] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isEdit = !!subscription;

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount);
      setRenewalDay(subscription.renewal_day.toString());
    } else {
      setName("");
      setAmount("");
      setRenewalDay("1");
    }
    setErrorMsg("");
  }, [subscription, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const formattedName = capitalizeWords(name);
    const parsedAmount = Number.parseFloat(amount);
    const day = Number.parseInt(renewalDay, 10);

    if (!formattedName) {
      setErrorMsg("Please enter a valid subscription name");
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      setErrorMsg("Renewal day must be between 1 and 31");
      return;
    }

    setIsSubmitting(true);
    const isOffline = typeof window !== "undefined" && !navigator.onLine;

    const subscriptionData: Subscription = {
      id: subscription?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
      user_id: subscription?.user_id || "offline-user",
      name: formattedName,
      category: "Subscriptions",
      amount: parsedAmount.toString(),
      renewal_day: day,
      created_at: subscription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isOffline) {
      await putLocalSubscription(subscriptionData);
      queueAction(
        isEdit ? "PUT" : "POST",
        {
          id: subscriptionData.id,
          name: subscriptionData.name,
          category: subscriptionData.category,
          amount: subscriptionData.amount,
          renewal_day: subscriptionData.renewal_day,
          created_at: subscriptionData.created_at
        },
        "subscriptions"
      );
      onSubmitSuccess(subscriptionData);
      onClose();
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subscriptionData.id,
          name: subscriptionData.name,
          category: subscriptionData.category,
          amount: subscriptionData.amount,
          renewal_day: subscriptionData.renewal_day,
          created_at: subscriptionData.created_at
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save subscription");
      }

      const body = await res.json();
      const savedSub = body.subscription || subscriptionData;
      await putLocalSubscription(savedSub);
      onSubmitSuccess(savedSub);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while saving the subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Subscription" : "Add Subscription"}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sub-name">Name</label>
          <Input
            id="sub-name"
            placeholder="e.g. Netflix, Spotify"
            value={name}
            onChange={setName}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Amount</label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sub-renewal-day">Renewal Day of Month</label>
          <Input
            id="sub-renewal-day"
            type="number"
            min="1"
            max="31"
            placeholder="e.g. 15"
            value={renewalDay}
            onChange={setRenewalDay}
            disabled={isSubmitting}
            required
          />
          <span className={styles.hint}>Payments are automatically recorded on this day each month.</span>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isEdit ? "Save Changes" : "Add Subscription"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
