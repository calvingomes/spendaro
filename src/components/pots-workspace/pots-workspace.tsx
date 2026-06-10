import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import { PotDetailModal } from "@/components/pot-detail-modal/pot-detail-modal";
import { NewPotModal } from "@/components/new-pot-modal/new-pot-modal";
import { DeletePotModal } from "@/components/delete-pot-modal/delete-pot-modal";
import { Button } from "@/components/ui/button/button";
import styles from "./pots-workspace.module.css";
import type { Expense, Pot } from "@/lib/types";
import { formatCurrency } from "@/utils/expense-utils";
import { getLocalExpenses, saveLocalExpenses } from "@/utils/db";

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

  const fetchPots = async () => {
    try {
      const res = await fetch("/api/pots");
      if (!res.ok) throw new Error("Failed to fetch pots");
      const data = await res.json();
      onPotsChange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pots");
    }
  };

  const fetchExpenses = async () => {
    const isOffline = typeof window !== "undefined" && !navigator.onLine;
    if (isOffline) {
      const cached = await getLocalExpenses();
      if (cached && onExpensesChange) {
        onExpensesChange(cached);
      }
      return;
    }
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        if (data.expenses && onExpensesChange) {
          onExpensesChange(data.expenses);
          await saveLocalExpenses(data.expenses);
        }
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  // Derive balances for each pot
  const potBalances = pots?.reduce((acc, pot) => {
    // Find all 'savings' transactions that point to this pot
    const potTxs = expenses.filter(e => e.type === "savings" && e.pot_id === pot.id);
    const balance = potTxs.reduce((sum, e) => sum + (Number.parseFloat(e.amount) || 0), 0);
    acc[pot.id] = balance;
    return acc;
  }, {} as Record<string, number>);

  if (error) return <div className={styles.container}>{error}</div>;

  return (
    <div className={styles.container}>
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
        onSubmitSuccess={() => fetchPots()}
        pot={editingPot}
      />

      {selectedPot && (
        <PotDetailModal
          pot={selectedPot}
          balance={potBalances?.[selectedPot.id] || 0}
          onClose={() => setSelectedPot(null)}
          onTransactionSuccess={() => {
            fetchExpenses();
          }}
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
          onDeleteSuccess={() => fetchPots()}
        />
      )}
    </div>
  );
}
