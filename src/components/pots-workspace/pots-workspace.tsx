import { useEffect, useRef, useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import { PotDetailModal } from "@/components/pot-detail-modal/pot-detail-modal";
import { NewPotModal } from "@/components/new-pot-modal/new-pot-modal";
import { DeletePotModal } from "@/components/delete-pot-modal/delete-pot-modal";
import { Button } from "@/components/ui/button/button";
import styles from "./pots-workspace.module.css";
import type { Expense, Pot } from "@/lib/types";
import { formatCurrency } from "@/utils/expense-utils";
import { deleteLocalPot, putLocalExpense, putLocalPot, saveLocalExpenses, saveLocalPots } from "@/utils/db";
import { getQueuedActions, processSyncQueue, queueAction } from "@/utils/sync-queue";

interface PotsWorkspaceProps {
  expenses: Expense[];
  onExpensesChange?: (expenses: Expense[]) => void;
  pots: Pot[];
  onPotsChange: (pots: Pot[]) => void;
}

export function PotsWorkspace({ expenses, pots, onPotsChange, onExpensesChange }: PotsWorkspaceProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<Pot | null>(null);
  const [selectedPot, setSelectedPot] = useState<Pot | null>(null);
  const [deletingPot, setDeletingPot] = useState<Pot | null>(null);
  const rollbackByActionId = useRef(new Map<string, { pots: Pot[]; expenses: Expense[] }>());

  const syncAndRefresh = async () => {
    const result = await processSyncQueue();

    if (result.failedActionIds.length > 0) {
      const rollback = result.failedActionIds
        .map((id) => rollbackByActionId.current.get(id))
        .find((snapshot): snapshot is { pots: Pot[]; expenses: Expense[] } => Boolean(snapshot));

      if (rollback) {
        onPotsChange(rollback.pots);
        onExpensesChange?.(rollback.expenses);
        await saveLocalPots(rollback.pots);
        await saveLocalExpenses(rollback.expenses);
      }

      result.failedActionIds.forEach((id) => rollbackByActionId.current.delete(id));
      setError("Couldn't sync the latest pot change. Your previous data was restored.");
    }

    if (result.remainingCount > 0) return;

    try {
      const [potsResponse, expensesResponse] = await Promise.all([
        fetch("/api/pots"),
        fetch("/api/expenses"),
      ]);

      if (potsResponse.ok) {
        const data = await potsResponse.json();
        onPotsChange(data);
        await saveLocalPots(data);
      }

      if (expensesResponse.ok) {
        const data = await expensesResponse.json();
        if (data.expenses && onExpensesChange) {
          onExpensesChange(data.expenses);
          await saveLocalExpenses(data.expenses);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pots");
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) void syncAndRefresh();
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine && getQueuedActions().length > 0) {
      void syncAndRefresh();
    }

    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePotSubmit = async (payload: { name: string; goal: string; color: string }) => {
    const isEditing = !!editingPot;
    const previousPots = pots;
    const optimisticPot: Pot = {
      id: editingPot?.id ?? crypto.randomUUID(),
      user_id: editingPot?.user_id ?? "offline-user",
      name: payload.name,
      goal: payload.goal,
      color: payload.color,
      created_at: editingPot?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const nextPots = isEditing
      ? pots.map((item) => item.id === optimisticPot.id ? optimisticPot : item)
      : [...pots, optimisticPot];

    onPotsChange(nextPots);
    await putLocalPot(optimisticPot);

    const actionId = queueAction(
      isEditing ? "PUT" : "POST",
      { id: optimisticPot.id, ...payload },
      "pots"
    );
    rollbackByActionId.current.set(actionId, { pots: previousPots, expenses });
    void syncAndRefresh();
  };

  const handlePotDelete = async (potId: string) => {
    const previousPots = pots;
    onPotsChange(pots.filter((item) => item.id !== potId));
    await deleteLocalPot(potId);

    const actionId = queueAction("DELETE", { id: potId }, "pots");
    rollbackByActionId.current.set(actionId, { pots: previousPots, expenses });
    void syncAndRefresh();
  };

  const handlePotTransaction = async (payload: Partial<Expense>) => {
    const previousExpenses = expenses;
    const optimisticExpense: Expense = {
      id: crypto.randomUUID(),
      user_id: "offline-user",
      label: String(payload.label ?? ""),
      category: String(payload.category ?? "Pots"),
      amount: String(payload.amount ?? "0"),
      type: "savings",
      pot_id: payload.pot_id ?? null,
      created_at: payload.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const nextExpenses = [optimisticExpense, ...expenses];

    onExpensesChange?.(nextExpenses);
    await putLocalExpense(optimisticExpense);

    const actionId = queueAction("POST", { ...payload, id: optimisticExpense.id }, "expenses");
    rollbackByActionId.current.set(actionId, { pots, expenses: previousExpenses });
    void syncAndRefresh();
  };

  // Derive balances for each pot
  const potBalances = pots?.reduce((acc, pot) => {
    // Find all 'savings' transactions that point to this pot
    const potTxs = expenses.filter(e => e.type === "savings" && e.pot_id === pot.id);
    const balance = potTxs.reduce((sum, e) => sum + (Number.parseFloat(e.amount) || 0), 0);
    acc[pot.id] = balance;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={styles.container}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <header className={styles.header}>
        <h2 className={styles.title}>Your Pots</h2>
        <Button 
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingPot(null);
            setIsFormModalOpen(true);
          }}
          icon={<Plus size={16} />}
        >
          New Pot
        </Button>
      </header>

      <div className={styles.potsGrid}>
        {pots.map((pot) => (
          <div 
            key={pot.id} 
            className={styles.potCard}
            onClick={() => setSelectedPot(pot)}
          >
            <div 
              className={styles.potIcon}
              style={{
                color: pot.color || "#f5a623",
                backgroundColor: `color-mix(in srgb, ${pot.color || "#f5a623"} 12%, transparent)`
              }}
            >
              <PiggyBank size={24} />
            </div>
            <h3 className={styles.potName}>{pot.name}</h3>
            <div className={styles.potProgressContainer}>
              <p className={styles.potBalance}>
                {formatCurrency(potBalances?.[pot.id] || 0)}
              </p>
              {Number(pot.goal) > 0 && (
                <span className={styles.potGoalLimit}>Goal: {formatCurrency(pot.goal)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <NewPotModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPot(null);
        }}
        onSubmit={handlePotSubmit}
        pot={editingPot}
      />

      {selectedPot && (
        <PotDetailModal
          pot={selectedPot}
          balance={potBalances?.[selectedPot.id] || 0}
          onClose={() => setSelectedPot(null)}
          onTransaction={handlePotTransaction}
          onEdit={() => {
            setEditingPot(selectedPot);
            setIsFormModalOpen(true);
            setSelectedPot(null);
          }}
          onDeleteInitiated={() => {
            setDeletingPot(selectedPot);
            setSelectedPot(null);
          }}
        />
      )}

      {deletingPot && (
        <DeletePotModal
          isOpen={true}
          onClose={() => setDeletingPot(null)}
          onBack={() => {
            setSelectedPot(deletingPot);
            setDeletingPot(null);
          }}
          pot={deletingPot}
          balance={potBalances?.[deletingPot.id] || 0}
          onDelete={handlePotDelete}
        />
      )}
    </div>
  );
}
