"use client";

import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import styles from "./peer-detail-modal.module.css";
import { formatCurrency, displayCategory } from "@/utils/expense-utils";
import { useDashboard } from "@/context/dashboard-context";

interface PeerDetailModalProps {
  peerId: string | null;
  onClose: () => void;
  onRepay: (peerId: string) => void;
  onSettle: (splitId: string, peerId: string) => void;
}

export function PeerDetailModal({ peerId, onClose, onRepay, onSettle }: PeerDetailModalProps) {
  const { peers, splits } = useDashboard();

  const peer = peerId ? peers.find((p) => p.id === peerId) : null;
  if (!peer) return null;

  const peerSplits = splits.filter((s) =>
    s.peer_breakdown.some((pb) => pb.peer_id === peer.id)
  );

  const openSplits = peerSplits.filter((s) => {
    const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
    return s.status === "open" && entry?.status !== "voided" && Boolean(entry && entry.amount_owed > entry.amount_repaid);
  });

  const totalOutstanding = openSplits.reduce((sum, s) => {
    const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
    if (!entry) return sum;
    return entry.status === "voided" ? sum : sum + Math.max(0, entry.amount_owed - entry.amount_repaid);
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
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onSettle(s.id, peer.id)}
                    >
                      Settle up
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Modal>
  );
}
