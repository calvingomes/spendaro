"use client";

import { Plus, Users } from "lucide-react";
import styles from "./splits-workspace.module.css";
import { formatCurrency } from "@/utils/expense-utils";
import { Button } from "@/components/ui/button/button";
import { useDashboard } from "@/context/dashboard-context";

export function SplitsWorkspace() {
  const { peers, splits, openSplitModal, openPeerDetail } = useDashboard();

  const peerBalances = peers.map((peer) => {
    const outstanding = splits
      .filter((s) => s.status === "open")
      .reduce((sum, s) => {
        const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
        if (!entry) return sum;
        return sum + Math.max(0, entry.amount_owed - entry.amount_repaid);
      }, 0);
    return { ...peer, outstanding };
  }).filter((p) => {
    const hasAnySplit = splits.some((s) =>
      s.peer_breakdown.some((pb) => pb.peer_id === p.id)
    );
    return hasAnySplit;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Splits</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={openSplitModal}
          icon={<Plus size={16} />}
        >
          Add split
        </Button>
      </header>

      {peerBalances.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Users size={32} />
          </div>
          <p className={styles.emptyTitle}>No splits yet</p>
          <p className={styles.emptyDesc}>
            When you split a bill, your share hits your analytics immediately.
            Peer repayments keep your balance in sync.
          </p>
          <Button variant="primary" size="md" onClick={openSplitModal} icon={<Plus size={14} />}>
            Add your first split
          </Button>
        </div>
      ) : (
        <div className={styles.peersGrid}>
          {peerBalances.map((peer) => (
            <div
              key={peer.id}
              className={styles.peerCard}
              onClick={() => openPeerDetail(peer.id)}
            >
              <span className={styles.peerInitial}>
                {peer.name.charAt(0).toUpperCase()}
              </span>
              <p className={styles.peerName}>{peer.name}</p>
              <div className={styles.peerBalance}>
                {peer.outstanding > 0 ? (
                  <>
                    <span className={styles.owesLabel}>owes you</span>
                    <strong className={styles.owesAmount}>{formatCurrency(peer.outstanding)}</strong>
                  </>
                ) : (
                  <span className={styles.settledLabel}>all settled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
