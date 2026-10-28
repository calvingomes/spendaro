"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal/modal";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { CategoryPicker } from "@/components/ui/category-picker/category-picker";
import { RectangleToggle } from "@/components/ui/rectangle-toggle/rectangle-toggle";
import { DateInput } from "@/components/ui/date-input/date-input";
import { Button } from "@/components/ui/button/button";
import styles from "./split-modal.module.css";
import { SPLIT_CATEGORY_TAG, formatCurrency, formatDateForInput, normalizeText, parseAmount } from "@/utils/expense-utils";
import { deleteLocalExpense, putLocalExpense, putLocalPeer, putLocalSplit, saveLocalSplits } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";
import { useDashboard } from "@/context/dashboard-context";
import type { Expense, Peer, Split } from "@/lib/types";

type SplitMethod = "equal" | "specific";
type SplitDirection = "they_owe_me" | "i_owe_them";

type PeerEntry = {
  peer_id: string;
  name: string;
  amount_owed: number;
  amount_is_manual?: boolean;
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
  editingSplit?: Split | null;
}

export function SplitModal({ isOpen, onClose, editingSplit = null }: SplitModalProps) {
  const { expenses, setExpenses, peers, setPeers, splits, setSplits, user, categories, addCategory, removeCategory } = useDashboard();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<Step1Form>(emptyStep1);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [direction, setDirection] = useState<SplitDirection>("they_owe_me");
  const [peerEntries, setPeerEntries] = useState<PeerEntry[]>([]);
  const [specificMyShare, setSpecificMyShare] = useState<number | null>(null);
  const [myShareIsManual, setMyShareIsManual] = useState(false);
  const [includeMe, setIncludeMe] = useState(true);
  const [newPeerName, setNewPeerName] = useState("");
  const [showPeerInput, setShowPeerInput] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const peerInputRef = useRef<HTMLInputElement>(null);

  const sharesLocked = Boolean(editingSplit?.peer_breakdown.some((entry) => Number(entry.amount_repaid) > 0 || entry.status === "voided"));

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm(editingSplit ? {
        label: editingSplit.label,
        amount: String(editingSplit.direction === "i_owe_them"
          ? editingSplit.peer_breakdown.reduce((sum, entry) => sum + entry.amount_owed, 0)
          : editingSplit.my_share + editingSplit.peer_total),
        category: editingSplit.category,
        created_at: formatDateForInput(editingSplit.created_at),
      } : { ...emptyStep1, created_at: formatDateForInput(new Date()) });
      setPeerEntries(editingSplit ? editingSplit.peer_breakdown.map((entry) => ({
        peer_id: entry.peer_id,
        name: entry.peer_name,
        amount_owed: entry.amount_owed,
        amount_is_manual: true,
      })) : []);
      setSpecificMyShare(editingSplit?.my_share ?? null);
      setMyShareIsManual(Boolean(editingSplit));
      setIncludeMe(editingSplit ? editingSplit.my_share > 0 : true);
      setSplitMethod(editingSplit?.split_method === "specific" ? "specific" : "equal");
      setDirection(editingSplit?.direction ?? "they_owe_me");
      setNewPeerName("");
      setShowPeerInput(false);
      setConfirmDelete(false);
      setError(null);
    }
  }, [isOpen, editingSplit]);

  useEffect(() => {
    if (showPeerInput && peerInputRef.current) {
      peerInputRef.current.focus();
    }
  }, [showPeerInput]);

  const allCategories = useMemo(() => Array.from(new Set(categories)).filter(Boolean), [categories]);

  const handleAddCategory = (newCat: string) => {
    addCategory(newCat);
    setForm((c) => ({ ...c, category: normalizeText(newCat) }));
  };
  const totalAmount = parseAmount(form.amount) || 0;

  const handleDirectionChange = (nextDirection: SplitDirection) => {
    setDirection(nextDirection);
    setPeerEntries([]);
    setSpecificMyShare(null);
    setMyShareIsManual(false);
    setIncludeMe(true);
    setError(null);
  };

  const autoDistribute = (entries: PeerEntry[], method: SplitMethod, hasMe = includeMe): PeerEntry[] => {
    if (entries.length === 0) return entries;
    const count = entries.length + (hasMe ? 1 : 0);
    if (count === 0) return entries;
    if (method === "equal") {
      const share = totalAmount / count;
      return entries.map((e) => ({ ...e, amount_owed: Math.round(share * 100) / 100 }));
    }
    return entries;
  };

  const peerTotal = peerEntries.reduce((s, e) => s + (e.amount_owed || 0), 0);
  const myShare = direction === "i_owe_them" ? totalAmount : includeMe
    ? sharesLocked
      ? Math.max(0, Math.round((totalAmount - peerTotal) * 100) / 100)
      : splitMethod === "specific" && specificMyShare !== null
      ? specificMyShare
      : Math.max(0, totalAmount - peerTotal)
    : 0;

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
    const newEntry: PeerEntry = { peer_id: peerId, name: trimmed, amount_owed: direction === "i_owe_them" ? totalAmount : 0 };
    if (direction === "i_owe_them") {
      setPeerEntries([newEntry]);
      setNewPeerName("");
      setShowPeerInput(false);
      return;
    }
    const updatedEntries = [...peerEntries, newEntry];
    const updated = splitMethod === "specific" ? redistributeSpecific(updatedEntries) : autoDistribute(updatedEntries, splitMethod);
    setPeerEntries(updated);
    setNewPeerName("");
    setShowPeerInput(false);
  };

  const handleTogglePeer = (peer: Peer) => {
    const selected = peerEntries.some((entry) => entry.peer_id === peer.id);
    if (selected) {
      handleRemovePeer(peer.id);
      return;
    }
    if (direction === "i_owe_them") {
      setPeerEntries([{ peer_id: peer.id, name: peer.name, amount_owed: totalAmount }]);
      return;
    }
    setPeerEntries((prev) => {
      const updated = [
      ...prev,
      { peer_id: peer.id, name: peer.name, amount_owed: 0 },
      ];
      return splitMethod === "specific" ? redistributeSpecific(updated) : autoDistribute(updated, splitMethod);
    });
  };

  const handleAmountChange = (peerId: string, val: string) => {
    setPeerEntries((prev) => redistributeSpecific(prev.map((e) => e.peer_id === peerId
      ? { ...e, amount_owed: parseAmount(val) || 0, amount_is_manual: true }
      : e)));
  };

  const redistributeSpecific = (entries: PeerEntry[], hasMe = includeMe, manualMyShare = myShareIsManual, myShareValue = specificMyShare) => {
    const fixedTotalCents = Math.round((entries.reduce((sum, entry) => sum + (entry.amount_is_manual ? entry.amount_owed : 0), 0)
      + (hasMe && manualMyShare ? (myShareValue || 0) : 0)) * 100);
    const unassigned = entries.filter((entry) => !entry.amount_is_manual);
    const hasUnassignedMe = hasMe && !manualMyShare;
    const remainingParticipants = unassigned.length + (hasUnassignedMe ? 1 : 0);
    if (remainingParticipants === 0) return entries;

    const remainingCents = Math.max(0, Math.round(totalAmount * 100) - fixedTotalCents);
    const baseCents = Math.floor(remainingCents / remainingParticipants);
    let extraCents = remainingCents - baseCents * remainingParticipants;
    const adjustedEntries = entries.map((entry) => {
      if (entry.amount_is_manual) return entry;
      const amountCents = baseCents + (extraCents > 0 ? 1 : 0);
      if (extraCents > 0) extraCents -= 1;
      return { ...entry, amount_owed: amountCents / 100 };
    });
    return adjustedEntries;
  };

  useEffect(() => {
    if (splitMethod !== "specific" || !includeMe || myShareIsManual) return;
    const nextShare = Math.max(0, Math.round((totalAmount - peerEntries.reduce((sum, entry) => sum + entry.amount_owed, 0)) * 100) / 100);
    setSpecificMyShare((current) => current === nextShare ? current : nextShare);
  }, [splitMethod, includeMe, myShareIsManual, peerEntries, totalAmount]);

  const handleMyAmountChange = (val: string) => {
    const amount = parseAmount(val) || 0;
    setSpecificMyShare(amount);
    setMyShareIsManual(true);
    setPeerEntries((prev) => redistributeSpecific(prev, includeMe, true, amount));
  };

  const handleMethodChange = (method: SplitMethod) => {
    if (method === "specific" && splitMethod !== "specific") {
      setSpecificMyShare(includeMe ? Math.round((totalAmount / (peerEntries.length + 1)) * 100) / 100 : 0);
      setMyShareIsManual(false);
      const count = peerEntries.length + (includeMe ? 1 : 0);
      setPeerEntries((prev) => prev.map((entry) => ({
        ...entry,
        amount_is_manual: false,
        amount_owed: count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0,
      })));
    } else if (method === "equal") {
      setSpecificMyShare(null);
      setMyShareIsManual(false);
    }
    setSplitMethod(method);
    if (method === "equal") {
      setPeerEntries((prev) => autoDistribute(prev, "equal"));
    }
  };

  const handleIncludeMeChange = (checked: boolean) => {
    setIncludeMe(checked);
    if (splitMethod === "equal") setPeerEntries((prev) => autoDistribute(prev, "equal", checked));
    if (splitMethod === "specific") setPeerEntries((prev) => redistributeSpecific(prev, checked, myShareIsManual));
  };

  const selectedPeerIds = new Set(peerEntries.map((entry) => entry.peer_id));

  const handleRemovePeer = (peerId: string) => {
    const updated = peerEntries.filter((e) => e.peer_id !== peerId);
    setPeerEntries(splitMethod === "specific" ? redistributeSpecific(updated) : autoDistribute(updated, splitMethod));
  };

  const validateStep1 = () => {
    if (!form.amount || parseAmount(form.amount) <= 0) { setError("Enter a valid amount."); return false; }
    if (!form.label.trim()) { setError("Enter a label."); return false; }
    if (!form.category.trim()) { setError("Select a category."); return false; }
    if (sharesLocked && direction === "they_owe_me" && includeMe && totalAmount < peerTotal - 0.01) {
      setError("The expense total cannot be less than the locked participant shares."); return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (direction === "i_owe_them") {
      if (peerEntries.length !== 1) { setError("Select who paid for you."); return false; }
      return true;
    }
    if (peerEntries.length === 0 && includeMe) { setError("Add at least one person to split with."); return false; }
    if (peerEntries.length === 0 && !includeMe) { setError("Add at least one person to cover this expense."); return false; }
    const adjustedPeerTotal = peerEntries.reduce((s, e) => s + (e.amount_owed || 0), 0);
    if (includeMe && splitMethod === "specific" && Math.abs(adjustedPeerTotal + myShare - totalAmount) > 0.01) {
      setError(`Amounts don't add up to ${formatCurrency(totalAmount)}.`); return false;
    }
    if (includeMe && adjustedPeerTotal > totalAmount + 0.01) {
      setError("Participant shares exceed the bill amount."); return false;
    }
    if (!includeMe && Math.abs(adjustedPeerTotal - totalAmount) > 0.01) {
      setError(`Amounts don't add up to ${formatCurrency(totalAmount)}.`); return false;
    }
    if (includeMe && myShare < 0) { setError("Peer total exceeds the bill amount."); return false; }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (!validateStep1()) return;
    if (!sharesLocked && splitMethod === "equal" && peerEntries.length > 0) {
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

      const sourceId = editingSplit?.source_expense_id ?? crypto.randomUUID();
      const peerLedgerId = editingSplit?.peer_ledger_expense_id ?? crypto.randomUUID();
      const splitId = editingSplit?.id ?? crypto.randomUUID();

      const effectivePeerTotal = direction === "i_owe_them" ? 0 : peerEntries.reduce((s, e) => s + (e.amount_owed || 0), 0);
      // When someone else paid, this is a liability rather than an expense
      // until the user records a repayment.
      const effectiveMyShare = direction === "i_owe_them" ? 0 : includeMe ? myShare : 0;

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
        direction,
        split_method: splitMethod,
        note: null,
        status: editingSplit?.status ?? "open",
        created_at: now,
        updated_at: now,
        peer_breakdown: peerEntries.map((e) => ({
          peer_id: e.peer_id,
          peer_name: e.name,
          amount_owed: e.amount_owed,
          amount_repaid: editingSplit?.peer_breakdown.find((old) => old.peer_id === e.peer_id)?.amount_repaid ?? 0,
          status: editingSplit?.peer_breakdown.find((old) => old.peer_id === e.peer_id)?.status,
        })),
      };

      setExpenses(editingSplit
        ? expenses.map((expense) => expense.id === sourceId ? sourceExpense : expense.id === peerLedgerId ? ledgerExpense : expense)
        : [sourceExpense, ledgerExpense, ...expenses]);
      setPeers([...peers, ...newPeersToCreate]);
      setSplits(editingSplit
        ? splits.map((split) => split.id === splitId ? newSplit : split)
        : [newSplit, ...splits]);

      await putLocalExpense(sourceExpense);
      await putLocalExpense(ledgerExpense);
      await putLocalSplit(newSplit);
      addCategory(form.category);

      queueAction(editingSplit ? "PATCH" : "POST", {
        id: splitId,
        source_expense_id: sourceId,
        peer_ledger_expense_id: peerLedgerId,
        label: normalizeText(form.label),
        category: form.category,
        my_share: effectiveMyShare,
        peer_total: effectivePeerTotal,
        split_method: splitMethod,
        direction,
        date: now,
        peers: peerEntries.map((e) => ({ peer_id: e.peer_id, amount_owed: e.amount_owed })),
        ...(editingSplit ? { action: "edit" } : { split_id: splitId }),
      }, "splits");

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save split");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSplit || isPending) return;
    setIsPending(true);
    const nextSplits = splits.filter((split) => split.id !== editingSplit.id);
    const nextExpenses = expenses.filter((expense) => expense.id !== editingSplit.source_expense_id && expense.id !== editingSplit.peer_ledger_expense_id);
    setSplits(nextSplits);
    setExpenses(nextExpenses);
    try {
      await Promise.all([
        saveLocalSplits(nextSplits),
        deleteLocalExpense(editingSplit.source_expense_id),
        deleteLocalExpense(editingSplit.peer_ledger_expense_id),
      ]);
      queueAction("DELETE", { id: editingSplit.id }, "splits");
      onClose();
    } catch (err) {
      setSplits(splits);
      setExpenses(expenses);
      await Promise.all([
        saveLocalSplits(splits),
        ...expenses
          .filter((expense) => expense.id === editingSplit.source_expense_id || expense.id === editingSplit.peer_ledger_expense_id)
          .map(putLocalExpense),
      ]);
      setError(err instanceof Error ? err.message : "Failed to delete split");
    } finally {
      setIsPending(false);
    }
  };

  const title = step === 1 ? "Add split" : direction === "i_owe_them" ? "Who paid?" : "Who's splitting?";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingSplit ? "Edit split" : title}>
      {step === 1 ? (
        <div className={styles.form}>
          <RectangleToggle
            options={[
              { value: "they_owe_me", label: "I paid" },
              { value: "i_owe_them", label: "They paid" },
            ]}
            value={direction}
            onChange={(value) => handleDirectionChange(value as SplitDirection)}
            disabled={sharesLocked}
          />
          <AmountInput
            value={form.amount}
            onChange={(val) => setForm((c) => ({ ...c, amount: val }))}
            disabled={sharesLocked && (direction === "i_owe_them" || !includeMe)}
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
            onAddCategory={handleAddCategory}
            onRemoveCategory={(cat) => {
              removeCategory(cat);
              if (form.category === cat) setForm((c) => ({ ...c, category: "" }));
            }}
          />
          <DateInput
            value={form.created_at}
            onChange={(val) => setForm((c) => ({ ...c, created_at: val }))}
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext}>
            {editingSplit ? "Edit participants" : "Split with"}
          </Button>
          {editingSplit && (confirmDelete ? (
            <div className={styles.deleteConfirmation}>
              <p>Delete this split and its linked expense entries? Recorded repayment transactions will remain.</p>
              <div className={styles.deleteConfirmationActions}>
                <button type="button" disabled={isPending} onClick={() => setConfirmDelete(false)}>Keep split</button>
                <button type="button" className={styles.confirmDeleteButton} disabled={isPending} onClick={handleDelete}>
                  {isPending ? "Deleting..." : "Delete split"}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.deleteSplitButton} onClick={() => setConfirmDelete(true)}>
              Delete split
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.form}>
          {direction === "they_owe_me" && (
            <div className={styles.methodRow}>
              <RectangleToggle
                options={[
                  { value: "equal", label: "Equal" },
                  { value: "specific", label: "Specific" },
                ]}
                value={splitMethod}
                onChange={(v) => handleMethodChange(v as SplitMethod)}
                disabled={sharesLocked}
              />
            </div>
          )}

          <div className={styles.peersSection}>
            <div className={styles.participantList}>
              {direction === "i_owe_them" ? (
                <>
                  <p className={styles.participantPrompt}>Who paid for you?</p>
                  {Array.from(new Map([...peers.map((peer) => [peer.id, peer] as const), ...peerEntries.map((entry) => [entry.peer_id, { id: entry.peer_id, name: entry.name }] as const)]).values()).map((peer) => {
                    const selected = selectedPeerIds.has(peer.id);
                    return (
                      <button
                        key={peer.id}
                        type="button"
                        className={`${styles.participantOption} ${selected ? styles.participantSelected : ""}`}
                        aria-pressed={selected}
                        disabled={sharesLocked}
                        onClick={() => handleTogglePeer({ ...peer, user_id: user.id, created_at: "", updated_at: "" })}
                      >
                        <span className={styles.selectionMark}>{selected && <Check size={13} />}</span>
                        <span className={styles.peerInitial}>{peer.name.charAt(0).toUpperCase()}</span>
                        <span className={styles.peerName}>{peer.name}</span>
                        {selected && <span className={styles.participantAmount}>{formatCurrency(totalAmount)}</span>}
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
              <div className={`${styles.participantOption} ${includeMe ? styles.participantSelected : ""}`}>
                <button type="button" className={styles.participantSelect} aria-pressed={includeMe} disabled={sharesLocked} onClick={() => handleIncludeMeChange(!includeMe)}>
                  <span className={styles.selectionMark}>{includeMe && <Check size={13} />}</span>
                  <span className={styles.peerInitial}>{user.email?.charAt(0).toUpperCase() || "Y"}</span>
                  <span className={styles.peerName}>You</span>
                </button>
                {includeMe && (splitMethod === "specific" ? (
                  <input
                    className={styles.peerAmountInput}
                    type="number"
                    min="0"
                    step="0.01"
                    value={sharesLocked ? myShare : specificMyShare ?? ""}
                    onChange={(e) => handleMyAmountChange(e.target.value)}
                    placeholder="0"
                    aria-label="Your share"
                    disabled={sharesLocked}
                  />
                ) : <span className={styles.participantAmount}>{formatCurrency(myShare)}</span>)}
              </div>
              {Array.from(new Map([...peers.map((peer) => [peer.id, peer] as const), ...peerEntries.map((entry) => [entry.peer_id, { id: entry.peer_id, name: entry.name }] as const)]).values()).map((peer) => {
                const selected = selectedPeerIds.has(peer.id);
                const entry = peerEntries.find((item) => item.peer_id === peer.id);
                return (
                  <div key={peer.id} className={`${styles.participantOption} ${selected ? styles.participantSelected : ""}`}>
                    <button
                      type="button"
                      className={styles.participantSelect}
                      aria-pressed={selected}
                    disabled={sharesLocked}
                      onClick={() => handleTogglePeer({ ...peer, user_id: user.id, created_at: "", updated_at: "" })}
                    >
                      <span className={styles.selectionMark}>{selected && <Check size={13} />}</span>
                      <span className={styles.peerInitial}>{peer.name.charAt(0).toUpperCase()}</span>
                      <span className={styles.peerName}>{peer.name}</span>
                    </button>
                    {selected && (splitMethod === "equal" ? (
                      <span className={styles.participantAmount}>{formatCurrency(entry?.amount_owed || 0)}</span>
                    ) : (
                      <input className={styles.peerAmountInput} type="number" min="0" step="0.01" value={entry?.amount_owed || ""} onChange={(e) => handleAmountChange(peer.id, e.target.value)} placeholder="0" aria-label={`${peer.name}'s share`} disabled={sharesLocked} />
                    ))}
                  </div>
                );
              })}
                </>
              )}
            </div>
            <div className={styles.peerRows}>
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
                  />
                </div>
              ) : sharesLocked ? (
                <p className={styles.participantPrompt}>Participant shares are locked after a payment or void.</p>
              ) : (
                <button type="button" className={styles.addPeerButton} onClick={() => setShowPeerInput(true)}>
                  <Plus size={14} /> New person
                </button>
              )}
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
              fullWidth
              disabled={isPending || peerEntries.length === 0}
              onClick={handleSubmit}
            >
              {isPending ? "Saving..." : editingSplit ? "Save changes" : "Add Split"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
