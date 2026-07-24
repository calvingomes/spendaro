import { useState } from "react";
import { Plus, Repeat, Trash2, Calendar, ArrowLeft } from "lucide-react";
import { SubscriptionModal } from "@/components/subscription-modal/subscription-modal";
import { Button } from "@/components/ui/button/button";
import styles from "./subscriptions-workspace.module.css";
import type { Subscription } from "@/lib/types";
import { formatCurrency } from "@/utils/expense-utils";
import { deleteLocalSubscription, saveLocalSubscriptions } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";

interface SubscriptionsWorkspaceProps {
  subscriptions: Subscription[];
  onSubscriptionsChange: (subs: Subscription[]) => void;
  onBack?: () => void;
}

export function SubscriptionsWorkspace({
  subscriptions,
  onSubscriptionsChange,
  onBack
}: SubscriptionsWorkspaceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSubscriptionsChange(data);
      await saveLocalSubscriptions(data);
    } catch {
      console.warn("Failed to fetch fresh subscriptions from server");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingSubId(id);
    const isOffline = typeof window !== "undefined" && !navigator.onLine;

    const remaining = subscriptions.filter((sub) => sub.id !== id);
    onSubscriptionsChange(remaining);

    if (isOffline) {
      await deleteLocalSubscription(id);
      queueAction("DELETE", { id }, "subscriptions");
      setDeletingSubId(null);
      return;
    }

    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await deleteLocalSubscription(id);
        await saveLocalSubscriptions(remaining);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback to queue offline action
      await deleteLocalSubscription(id);
      queueAction("DELETE", { id }, "subscriptions");
    } finally {
      setDeletingSubId(null);
    }
  };

  const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
    return sum + (Number.parseFloat(sub.amount) || 0);
  }, 0);

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Recurring Payments</h2>
          <p className={styles.subtitle}>Manage your monthly subscriptions and auto-deductions.</p>
        </div>
        <Button 
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingSub(null);
            setIsModalOpen(true);
          }}
          icon={<Plus size={16} />}
        >
          Add Subscription
        </Button>
      </header>

      {/* Overview Stat Card */}
      <div className={styles.overviewCard}>
        <div className={styles.overviewHeader}>
          <div className={styles.iconPill}>
            <Repeat size={16} />
          </div>
          <span className={styles.overviewLabel}>Total Monthly Commitment</span>
        </div>
        <strong className={styles.overviewValue}>{formatCurrency(totalMonthlyCost)}/mo</strong>
      </div>

      {subscriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Repeat size={32} />
          </div>
          <h3>No recurring subscriptions</h3>
          <p>Add subscriptions to auto-generate monthly debits on their renewal dates.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {subscriptions.map((sub) => (
            <div key={sub.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.info}>
                  <h3 className={styles.subName}>{sub.name}</h3>
                  <span className={styles.categoryPill}>{sub.category}</span>
                </div>
                <div className={styles.amountWrap}>
                  <span className={styles.amount}>{formatCurrency(Number.parseFloat(sub.amount))}</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.schedule}>
                  <Calendar size={14} className={styles.calendarIcon} />
                  <span>Renews every {sub.renewal_day}{getOrdinalSuffix(sub.renewal_day)}</span>
                </div>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  disabled={deletingSubId === sub.id}
                  onClick={() => handleDelete(sub.id)}
                  aria-label={`Delete ${sub.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSub(null);
        }}
        onSubmitSuccess={() => fetchSubscriptions()}
        subscription={editingSub}
      />
    </div>
  );
}
