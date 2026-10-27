"use client";

import { History, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./splits-workspace.module.css";
import { displayCategory, formatCurrency } from "@/utils/expense-utils";
import { Button } from "@/components/ui/button/button";
import { Modal } from "@/components/ui/modal/modal";
import { useDashboard } from "@/context/dashboard-context";
import type { Split } from "@/lib/types";

export function SplitsWorkspace({ onEditSplit }: { onEditSplit: (split: Split) => void }) {
  const { peers, splits, openSplitModal, openPeerDetail } = useDashboard();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPeerId, setHistoryPeerId] = useState("all");
  const [settledPeerIds, setSettledPeerIds] = useState<Set<string>>(new Set());
  const previousBalances = useRef<Map<string, { outstanding: number; repaid: number }> | null>(null);
  const settledTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const peerBalances = useMemo(() => peers.map((peer) => {
    const balances = splits
      .filter((s) => s.status === "open")
      .reduce((total, s) => {
        const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
        if (!entry || entry.status === "voided") return total;
        const remaining = Math.max(0, entry.amount_owed - entry.amount_repaid);
        if (s.direction === "i_owe_them") total.iOwe += remaining;
        else total.owedToMe += remaining;
        return total;
      }, { owedToMe: 0, iOwe: 0 });
    const outstanding = balances.owedToMe + balances.iOwe;
    return { ...peer, ...balances, outstanding, netBalance: balances.owedToMe - balances.iOwe };
  }).filter((p) => {
    const hasAnySplit = splits.some((s) =>
      s.peer_breakdown.some((pb) => pb.peer_id === p.id)
    );
    return hasAnySplit;
  }).sort((a, b) => {
    const rank = (balance: number) => balance < 0 ? 0 : balance > 0 ? 1 : 2;
    return rank(a.netBalance) - rank(b.netBalance)
      || (a.netBalance < 0 ? a.netBalance - b.netBalance : b.netBalance - a.netBalance)
      || a.name.localeCompare(b.name);
  }), [peers, splits]);

  const activeGroupSplits = useMemo(() => splits
    .filter((split) => {
      if (split.status !== "open") return false;
      const activeParticipants = split.peer_breakdown.filter((entry) => entry.status !== "voided");
      const includesMe = split.direction === "they_owe_me" && split.my_share > 0;
      const hasOutstandingShare = activeParticipants.some((entry) => entry.amount_owed > entry.amount_repaid);
      return includesMe && activeParticipants.length + 1 > 1 && hasOutstandingShare;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [splits]);

  const historyRows = useMemo(() => splits.flatMap((split) => split.peer_breakdown.flatMap((entry) => {
    const peer = peers.find((item) => item.id === entry.peer_id);
    const remaining = Math.max(0, entry.amount_owed - entry.amount_repaid);
    const isVoided = split.status === "voided" || entry.status === "voided";
    const isPartiallyPaid = !isVoided && entry.amount_repaid > 0 && remaining > 0;
    if (!isVoided && remaining > 0 && !isPartiallyPaid) return [];
    return [{
      id: `${split.id}-${entry.peer_id}`,
      peerId: entry.peer_id,
      peerName: peer?.name ?? entry.peer_name,
      label: split.label,
      category: displayCategory(split.category),
      createdAt: split.created_at,
      amount: entry.amount_owed,
      paid: entry.amount_repaid,
      remaining,
      status: isVoided ? "Voided" : isPartiallyPaid ? "Partially paid" : "Settled",
    }];
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [splits, peers]);

  useEffect(() => {
    const currentBalances = new Map(peerBalances.map((peer) => {
      const repaid = splits.reduce((sum, split) => {
        if (split.status !== "open") return sum;
        const entry = split.peer_breakdown.find((item) => item.peer_id === peer.id);
        return entry && entry.status !== "voided" ? sum + entry.amount_repaid : sum;
      }, 0);
      return [peer.id, { outstanding: peer.outstanding, repaid }] as const;
    }));
    const previous = previousBalances.current;

    if (previous) {
      const newlySettled = [...previous.entries()]
        .filter(([peerId, prior]) => {
          const current = currentBalances.get(peerId);
          return prior.outstanding > 0 && current?.outstanding === 0 && current.repaid > prior.repaid;
        })
        .map(([peerId]) => peerId);

      if (newlySettled.length > 0) {
        setSettledPeerIds((current) => new Set([...current, ...newlySettled]));
        for (const peerId of newlySettled) {
          const existingTimer = settledTimers.current.get(peerId);
          if (existingTimer) clearTimeout(existingTimer);
          settledTimers.current.set(peerId, setTimeout(() => {
            setSettledPeerIds((current) => {
              const next = new Set(current);
              next.delete(peerId);
              return next;
            });
            settledTimers.current.delete(peerId);
          }, 2500));
        }
      }
    }

    previousBalances.current = currentBalances;
  }, [peerBalances, splits]);

  useEffect(() => () => {
    settledTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const visiblePeers = peerBalances.filter((peer) => peer.outstanding > 0 || settledPeerIds.has(peer.id));
  const filteredHistory = historyRows.filter((row) => historyPeerId === "all" || row.peerId === historyPeerId);
  const settledHistory = filteredHistory.filter((row) => row.status === "Settled");
  const partialHistory = filteredHistory.filter((row) => row.status === "Partially paid");
  const voidedHistory = filteredHistory.filter((row) => row.status === "Voided");

  const renderHistoryRows = (rows: typeof historyRows) => rows.map((row) => (
    <div key={row.id} className={styles.historyRow}>
      <div className={styles.historyInfo}>
        <span className={styles.historyTitle}>{row.label}</span>
        <span className={styles.historyMeta}>
          {row.peerName} · {row.category} · {new Date(row.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </span>
      </div>
      <div className={styles.historyRight}>
        <strong className={styles.historyAmount}>{formatCurrency(row.amount)}</strong>
        {row.status === "Partially paid" && <span className={styles.historyMeta}>{formatCurrency(row.paid)} paid · {formatCurrency(row.remaining)} left</span>}
        <span className={row.status === "Voided" ? styles.historyVoided : row.status === "Partially paid" ? styles.historyPartial : styles.historySettled}>{row.status}</span>
      </div>
    </div>
  ));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Splits</h2>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} icon={<History size={15} />}>
            History
          </Button>
          <Button variant="primary" size="sm" onClick={openSplitModal} icon={<Plus size={16} />}>
            Add split
          </Button>
        </div>
      </header>

      {visiblePeers.length === 0 && activeGroupSplits.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Users size={32} />
          </div>
          <p className={styles.emptyTitle}>{peerBalances.length > 0 ? "Everyone is settled up" : "No splits yet"}</p>
          <p className={styles.emptyDesc}>
            {peerBalances.length > 0
              ? "Settled and voided shares are available in your history."
              : "When you split a bill, your share hits your analytics immediately. Peer repayments keep your balance in sync."}
          </p>
          <Button variant="primary" size="md" onClick={openSplitModal} icon={<Plus size={14} />}>
            Add your first split
          </Button>
        </div>
      ) : (
        <div className={styles.overviewContent}>
          <div className={styles.peersList}>
            {visiblePeers.map((peer) => (
              <button
                key={peer.id}
                type="button"
                className={`${styles.peerRow} ${peer.outstanding === 0 ? styles.fullySettledRow : ""}`}
                onClick={() => openPeerDetail(peer.id)}
              >
                <span className={styles.peerIdentity}>
                  <span className={styles.peerInitial}>{peer.name.charAt(0).toUpperCase()}</span>
                  <span className={styles.peerName}>{peer.name.charAt(0).toUpperCase() + peer.name.slice(1)}</span>
                </span>
                <div className={styles.peerBalance}>
                  {peer.netBalance > 0 ? (
                    <span className={styles.peerBalanceLine}><span className={styles.owesLabel}>owes you</span><strong className={styles.owesAmount}>{formatCurrency(peer.netBalance)}</strong></span>
                  ) : peer.netBalance < 0 ? (
                    <span className={styles.peerBalanceLine}><span className={styles.owesLabel}>you owe</span><strong className={styles.youOweAmount}>{formatCurrency(Math.abs(peer.netBalance))}</strong></span>
                  ) : (
                    <span className={styles.settledLabel}>{peer.outstanding === 0 ? "Fully settled" : "Balanced"}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {activeGroupSplits.length > 0 && (
            <section className={styles.groupSplits}>
              <h3 className={styles.groupSplitsTitle}>Shared expenses</h3>
              <div className={styles.groupSplitList}>
                {activeGroupSplits.map((split) => {
                  const canEdit = split.peer_breakdown.every((entry) => Number(entry.amount_repaid) === 0 && entry.status !== "voided");
                  const participantNames = [
                    "You",
                    ...split.peer_breakdown
                      .filter((entry) => entry.status !== "voided")
                      .map((entry) => entry.peer_name.charAt(0).toUpperCase() + entry.peer_name.slice(1)),
                  ];
                  const total = split.direction === "i_owe_them"
                    ? split.peer_breakdown.reduce((sum, entry) => sum + entry.amount_owed, 0)
                    : split.my_share + split.peer_total;

                  return (
                    <button
                      key={split.id}
                      type="button"
                      className={styles.groupSplitRow}
                      disabled={!canEdit}
                      title={canEdit ? "Edit split" : "Splits with recorded payments or voided shares cannot be edited"}
                      onClick={() => { if (canEdit) onEditSplit(split); }}
                    >
                      <span className={styles.groupSplitInfo}>
                        <span className={styles.groupSplitLabel}>{split.label}</span>
                        <span className={styles.groupSplitPeople}>{participantNames.join(" · ")}</span>
                      </span>
                      <span className={styles.groupSplitAmount}>{formatCurrency(total)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Split history">
        {historyRows.length === 0 ? (
          <p className={styles.historyEmpty}>Settled and voided shares will appear here.</p>
        ) : (
          <div className={styles.historyContent}>
            <label className={styles.historyFilterLabel}>
              <select className={styles.historyFilter} value={historyPeerId} onChange={(event) => setHistoryPeerId(event.target.value)}>
                <option value="all">Everyone</option>
                {[...peers].sort((a, b) => a.name.localeCompare(b.name)).map((peer) => <option key={peer.id} value={peer.id}>{peer.name.charAt(0).toUpperCase() + peer.name.slice(1)}</option>)}
              </select>
            </label>
            <div className={styles.historyList}>
              {settledHistory.length > 0 && (
                <section className={styles.historyGroup}>
                  <h3 className={styles.historyGroupTitle}>Settled <span>{settledHistory.length}</span></h3>
                  {renderHistoryRows(settledHistory)}
                </section>
              )}
              {partialHistory.length > 0 && (
                <section className={styles.historyGroup}>
                  <h3 className={styles.historyGroupTitle}>Partially paid <span>{partialHistory.length}</span></h3>
                  {renderHistoryRows(partialHistory)}
                </section>
              )}
              {voidedHistory.length > 0 && (
                <section className={styles.historyGroup}>
                  <h3 className={styles.historyGroupTitle}>Voided <span>{voidedHistory.length}</span></h3>
                  {renderHistoryRows(voidedHistory)}
                </section>
              )}
              {filteredHistory.length === 0 && <p className={styles.historyEmpty}>No history for this person.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
