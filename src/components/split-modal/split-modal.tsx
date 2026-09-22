"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { CategoryPicker } from "@/components/ui/category-picker/category-picker";
import { RectangleToggle } from "@/components/ui/rectangle-toggle/rectangle-toggle";
import { Button } from "@/components/ui/button/button";
import styles from "./split-modal.module.css";
import { SPLIT_CATEGORY_TAG, formatCurrency, formatDateForInput, normalizeText, parseAmount } from "@/utils/expense-utils";import { putLocalExpense, putLocalPeer, putLocalSplit } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useDashboard } from "@/context/dashboard-context";
import type { Expense, Peer, Split } from "@/lib/types";

type SplitMethod = "equal" | "percentage" | "specific";

type PeerEntry = {
  peer_id: string;
  name: string;
  amount_owed: number;
};

type Step1Form = {
  label: string;
  amount: string;
  category: string;
  created_at: string;
};

const emptyStep1: Step1Form = {
  label: "",
  amount: "",
  category: "",
  created_at: "",
};

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SplitModal({ isOpen, onClose }: SplitModalProps) {
  const { expenses, setExpenses, peers, setPeers, splits, setSplits, user, categories, addCategory, removeCategory } = useDashboard();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<Step1Form>(emptyStep1);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [peerEntries, setPeerEntries] = useState<PeerEntry[]>([]);
  const [newPeerName, setNewPeerName] = useState("");
  const [showPeerInput, setShowPeerInput] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const peerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm({ ...emptyStep1, created_at: formatDateForInput(new Date()) });
      setPeerEntries([]);
      setSplitMethod("equal");
      setNewPeerName("");
      setShowPeerInput(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showPeerInput && peerInputRef.current) {
      peerInputRef.current.focus();
    }
  }, [showPeerInput]);

  const allCategories = useMemo(() => Array.from(new Set(categories)).filter(Boolean), [categories]);

  const totalAmount = parseAmount(form.amount) || 0;

  const autoDistribute = (entries: PeerEntry[], method: SplitMethod): PeerEntry[] => {
    if (entries.length === 0) return entries;
    const count = entries.length + 1;
    if (method === "equal") {
      const share = totalAmount / count;
      return entries.map((e) => ({ ...e, amount_owed: Math.round(share * 100) / 100 }));
    }
    return entries;
  };

  const peerTotal = peerEntries.reduce((s, e) => s + (e.amount_owed || 0), 0);
  const myShare = Math.max(0, totalAmount - peerTotal);

  const handleAddPeer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existingPeer = peers.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    const peerId = existingPeer?.id ?? crypto.randomUUID();
    if (peerEntries.some((e) => e.peer_id === peerId)) {
      setNewPeerName("");
      setShowPeerInput(false);
      return;
    }
    const newEntry: PeerEntry = { peer_id: peerId, name: trimmed, amount_owed: 0 };
    const updated = autoDistribute([...peerEntries, newEntry], splitMethod);
    setPeerEntries(updated);
    setNewPeerName("");
    setShowPeerInput(false);
  };

  const handleAmountChange = (peerId: string, val: string) => {
    setPeerEntries((prev) => prev.map((e) => e.peer_id === peerId ? { ...e, amount_owed: parseAmount(val) || 0 } : e));
  };

  const handleMethodChange = (method: SplitMethod) => {
    setSplitMethod(method);
    if (method === "equal") {
      setPeerEntries((prev) => autoDistribute(prev, "equal"));
    }
  };

  const handleRemovePeer = (peerId: string) => {
    const updated = peerEntries.filter((e) => e.peer_id !== peerId);
    setPeerEntries(autoDistribute(updated, splitMethod));
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Today";
    const today = new Date().toISOString().split("T")[0];
    if (dateString === today) return "Today";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const validateStep1 = () => {
    if (!form.amount || parseAmount(form.amount) <= 0) { setError("Enter a valid amount."); return false; }
    if (!form.label.trim()) { setError("Enter a label."); return false; }
    if (!form.category.trim()) { setError("Select a category."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (peerEntries.length === 0) { setError("Add at least one person."); return false; }
    const adjustedPeerTotal = peerEntries.reduce((s, e) => s + (e.amount_owed || 0), 0);
    if (splitMethod !== "equal" && Math.abs(adjustedPeerTotal + myShare - totalAmount) > 0.01) {
      setError(`Amounts don't add up to ${formatCurrency(totalAmount)}.`); return false;
    }
    if (myShare < 0) { setError("Peer total exceeds the bill amount."); return false; }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!validateStep1()) return;
    if (splitMethod === "equal" && peerEntries.length > 0) {
      setPeerEntries(autoDistribute(peerEntries, "equal"));
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateStep2()) return;
    setIsPending(true);

    try {
      const now = form.created_at
        ? new Date(form.created_at + "T" + new Date().toTimeString().slice(0, 8)).toISOString()
        : new Date().toISOString();

      const sourceId = crypto.randomUUID();
      const peerLedgerId = crypto.randomUUID();
      const splitId = crypto.randomUUID();

      const effectivePeerTotal = peerEntries.reduce((s, e) => s + (e.amount_owed || 0), 0);
      const effectiveMyShare = totalAmount - effectivePeerTotal;

      const sourceExpense: Expense = {
        id: sourceId,
        user_id: user.id,
        label: normalizeText(form.label),
        category: form.category,
        amount: effectiveMyShare,
        type: "debit",
        created_at: now,
        updated_at: now,
      };

      const ledgerExpense: Expense = {
        id: peerLedgerId,
        user_id: user.id,
        label: `Split · ${normalizeText(form.label)}`,
        category: SPLIT_CATEGORY_TAG,
        amount: effectivePeerTotal,
        type: "debit",
        created_at: now,
        updated_at: now,
      };

      const newPeersToCreate: Peer[] = [];
      for (const entry of peerEntries) {
        const existingPeer = peers.find((p) => p.id === entry.peer_id);
        if (!existingPeer) {
          const newPeer: Peer = {
            id: entry.peer_id,
            user_id: user.id,
            name: entry.name,
            created_at: now,
            updated_at: now,
          };
          newPeersToCreate.push(newPeer);
          await putLocalPeer(newPeer);
          queueAction("POST", { id: entry.peer_id, name: entry.name }, "peers");
        }
      }

      const newSplit: Split = {
        id: splitId,
        user_id: user.id,
        source_expense_id: sourceId,
        peer_ledger_expense_id: peerLedgerId,
        label: normalizeText(form.label),
        category: form.category,
        my_share: effectiveMyShare,
        peer_total: effectivePeerTotal,
        split_method: splitMethod,
        note: null,
        status: "open",
        created_at: now,
        updated_at: now,
        peer_breakdown: peerEntries.map((e) => ({
          peer_id: e.peer_id,
          peer_name: e.name,
          amount_owed: e.amount_owed,
          amount_repaid: 0,
        })),
      };

      setExpenses([sourceExpense, ledgerExpense, ...expenses]);
      setPeers([...peers, ...newPeersToCreate]);
      setSplits([newSplit, ...splits]);

      await putLocalExpense(sourceExpense);
      await putLocalExpense(ledgerExpense);
      await putLocalSplit(newSplit);
      addCategory(form.category);

      queueAction("POST", {
        id: sourceId,
        peer_ledger_expense_id: peerLedgerId,
        split_id: splitId,
        label: normalizeText(form.label),
        category: form.category,
        my_share: effectiveMyShare,
        peer_total: effectivePeerTotal,
        split_method: splitMethod,
        date: now,
        peers: peerEntries.map((e) => ({ peer_id: e.peer_id, amount_owed: e.amount_owed })),
      }, "splits");

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save split");
    } finally {
      setIsPending(false);
    }
  };

  const title = step === 1 ? "Add split" : "Who's splitting?";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {step === 1 ? (
        <div className={styles.form}>
          <AmountInput
            value={form.amount}
            onChange={(val) => setForm((c) => ({ ...c, amount: val }))}
          />
          <Input
            label="Label"
            id="split-label"
            value={form.label}
            onChange={(val) => setForm((c) => ({ ...c, label: val }))}
            placeholder="e.g. Movie night, Dinner"
            required
          />
          <CategoryPicker
            value={form.category}
            onChange={(cat) => setForm((c) => ({ ...c, category: cat }))}
            categories={allCategories}
            onAddCategory={(newCat) => {
              const normalized = normalizeText(newCat);
              if (!normalized || normalized.toLowerCase() === "splits" || normalized.startsWith("_")) return;
              addCategory(normalized);
              setForm((c) => ({ ...c, category: normalized }));
            }}
            onRemoveCategory={(cat) => {
              removeCategory(cat);
              if (form.category === cat) setForm((c) => ({ ...c, category: "" }));
            }}
          />
          <div
            className={styles.dateLinkContainer}
            onClick={() => dateInputRef.current?.showPicker()}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.dateLink}>
              <span className={styles.dateValue}>{formatDateDisplay(form.created_at)}</span>
              <span className={styles.changeAction}> · change</span>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              className={styles.hiddenDateInput}
              value={form.created_at}
              onChange={(e) => setForm((c) => ({ ...c, created_at: e.target.value }))}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext} icon={<ArrowRight size={14} />}>
            Next — Split with
          </Button>
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.methodRow}>
            <RectangleToggle
              options={[
                { value: "equal", label: "Equal" },
                { value: "percentage", label: "%" },
                { value: "specific", label: "Specific" },
              ]}
              value={splitMethod}
              onChange={(v) => handleMethodChange(v as SplitMethod)}
            />
          </div>

          <div className={styles.peersSection}>
            <div className={styles.peerRows}>
              {peerEntries.map((entry) => (
                <div key={entry.peer_id} className={styles.peerRow}>
                  <span className={styles.peerInitial}>{entry.name.charAt(0).toUpperCase()}</span>
                  <span className={styles.peerName}>{entry.name}</span>
                  {splitMethod === "equal" ? (
                    <span className={styles.peerAmountReadonly}>{formatCurrency(entry.amount_owed)}</span>
                  ) : (
                    <input
                      className={styles.peerAmountInput}
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.amount_owed || ""}
                      onChange={(e) => handleAmountChange(entry.peer_id, e.target.value)}
                      placeholder="0"
                    />
                  )}
                  <button type="button" className={styles.removePeer} onClick={() => handleRemovePeer(entry.peer_id)}>×</button>
                </div>
              ))}

              {showPeerInput ? (
                <div className={styles.addPeerRow}>
                  <input
                    ref={peerInputRef}
                    className={styles.peerNameInput}
                    type="text"
                    placeholder="Name..."
                    value={newPeerName}
                    onChange={(e) => setNewPeerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddPeer(newPeerName); }
                      if (e.key === "Escape") { setShowPeerInput(false); setNewPeerName(""); }
                    }}
                    onBlur={() => {
                      if (newPeerName.trim()) handleAddPeer(newPeerName);
                      else { setShowPeerInput(false); setNewPeerName(""); }
                    }}
                    list="peer-suggestions"
                  />
                  <datalist id="peer-suggestions">
                    {peers.map((p) => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
              ) : (
                <button type="button" className={styles.addPeerButton} onClick={() => setShowPeerInput(true)}>
                  <Plus size={14} /> Add person
                </button>
              )}
            </div>

            <div className={styles.myShareRow}>
              <span className={styles.myShareLabel}>Your share</span>
              <span className={styles.myShareAmount}>{formatCurrency(myShare)}</span>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.stepActions}>
            <button type="button" className={styles.backButton} onClick={() => { setStep(1); setError(null); }}>
              <ArrowLeft size={14} /> Back
            </button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isPending || peerEntries.length === 0}
              onClick={handleSubmit}
            >
              {isPending ? "Saving..." : "Add Split"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
