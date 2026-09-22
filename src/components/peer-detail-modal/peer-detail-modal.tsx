"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import styles from "./peer-detail-modal.module.css";
import { formatCurrency, displayCategory } from "@/utils/expense-utils";
import { useDashboard } from "@/context/dashboard-context";

interface PeerDetailModalProps {
  peerId: string | null;
  onClose: () => void;
  onRepay: (peerId: string) => void;
  onVoid: (splitId: string) => void;
}

export function PeerDetailModal({ peerId, onClose, onRepay, onVoid }: PeerDetailModalProps) {
  const { peers, splits } = useDashboard();
  const [showVoided, setShowVoided] = useState(false);

  const peer = peerId ? peers.find((p) => p.id === peerId) : null;
  if (!peer) return null;

  const peerSplits = splits.filter((s) =>
    s.peer_breakdown.some((pb) => pb.peer_id === peer.id)
  );

  const openSplits = peerSplits.filter((s) => s.status === "open");
  const voidedSplits = peerSplits.filter((s) => s.status === "voided");

  const totalOutstanding = openSplits.reduce((sum, s) => {
    const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
    if (!entry) return sum;
    return sum + Math.max(0, entry.amount_owed - entry.amount_repaid);
  }, 0);

  const title = peer.name;

  return (
    <Modal isOpen={Boolean(peerId)} onClose={onClose} title={title}>
      <div className={styles.container}>
        <div className={styles.summary}>
          {totalOutstanding > 0 ? (
            <>
              <p className={styles.summaryLabel}>Owes you</p>
              <p className={styles.summaryAmount}>{formatCurrency(totalOutstanding)}</p>
            </>
          ) : (
            <p className={styles.settledSummary}>All settled up</p>
          )}
        </div>

        {totalOutstanding > 0 && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onRepay(peer.id)}
          >
            Record repayment
          </Button>
        )}

        {openSplits.length > 0 && (
          <div className={styles.splitList}>
            <p className={styles.listLabel}>Open splits</p>
            {openSplits.map((s) => {
              const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
              const remaining = entry ? Math.max(0, entry.amount_owed - entry.amount_repaid) : 0;
              return (
                <div key={s.id} className={styles.splitRow}>
                  <div className={styles.splitInfo}>
                    <span className={styles.splitLabel}>{s.label}</span>
                    <span className={styles.splitMeta}>
                      {displayCategory(s.category)} · {new Date(s.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                  <div className={styles.splitRight}>
                    <span className={styles.splitRemaining}>{formatCurrency(remaining)}</span>
                    <button
                      type="button"
                      className={styles.voidButton}
                      onClick={() => onVoid(s.id)}
                    >
                      Void
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {voidedSplits.length > 0 && (
          <div className={styles.voidedSection}>
            <button
              type="button"
              className={styles.voidedToggle}
              onClick={() => setShowVoided((v) => !v)}
            >
              {showVoided ? "Hide" : "Show"} voided ({voidedSplits.length})
            </button>
            {showVoided && voidedSplits.map((s) => (
              <div key={s.id} className={`${styles.splitRow} ${styles.voided}`}>
                <div className={styles.splitInfo}>
                  <span className={styles.splitLabel}>{s.label}</span>
                  <span className={styles.splitMeta}>
                    {displayCategory(s.category)} · {new Date(s.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </div>
                <span className={styles.voidedBadge}>Voided</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
