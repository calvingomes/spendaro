"use client";

import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import styles from "./peer-detail-modal.module.css";
import { formatCurrency, displayCategory } from "@/utils/expense-utils";
import { useDashboard } from "@/context/dashboard-context";
import type { Split } from "@/lib/types";

interface PeerDetailModalProps {
  peerId: string | null;
  onClose: () => void;
  onRepay: (peerId: string) => void;
  onSettle: (splitId: string, peerId: string) => void;
  onEdit: (split: Split) => void;
}

export function PeerDetailModal({ peerId, onClose, onRepay, onSettle, onEdit }: PeerDetailModalProps) {
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

  const { totalOwedToMe, totalIOwe } = openSplits.reduce((totals, s) => {
    const entry = s.peer_breakdown.find((pb) => pb.peer_id === peer.id);
    if (!entry || entry.status === "voided") return totals;
    const remaining = Math.max(0, entry.amount_owed - entry.amount_repaid);
    if (s.direction === "i_owe_them") totals.totalIOwe += remaining;
    else totals.totalOwedToMe += remaining;
    return totals;
  }, { totalOwedToMe: 0, totalIOwe: 0 });
  const totalOutstanding = totalOwedToMe + totalIOwe;
  const hasEditableOpenSplit = openSplits.some((split) => split.peer_breakdown.every((item) => Number(item.amount_repaid) === 0 && item.status !== "voided"));

  const title = peer.name.charAt(0).toUpperCase() + peer.name.slice(1);

  return (
    <Modal
      isOpen={Boolean(peerId)}
      onClose={onClose}
      title={title}
      subtitle={hasEditableOpenSplit ? "Tap an open split to edit it." : undefined}
    >
      <div className={styles.container}>
        <div className={styles.summary}>
          {totalOutstanding > 0 ? (
            <div className={styles.summaryBalances}>
              {totalOwedToMe > 0 && (
                <div className={styles.summaryBalance}>
                  <p className={styles.summaryLabel}>Owes you</p>
                  <p className={styles.summaryAmount}>{formatCurrency(totalOwedToMe)}</p>
                </div>
              )}
              {totalIOwe > 0 && (
                <div className={styles.summaryBalance}>
                  <p className={styles.summaryLabel}>You owe</p>
                  <p className={styles.youOweSummaryAmount}>{formatCurrency(totalIOwe)}</p>
                </div>
              )}
            </div>
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
              const canEdit = s.peer_breakdown.every((item) => Number(item.amount_repaid) === 0 && item.status !== "voided");
              return (
                <div
                  key={s.id}
                  className={`${styles.splitRow} ${canEdit ? styles.editableSplitRow : ""}`}
                  tabIndex={canEdit ? 0 : undefined}
                  aria-label={canEdit ? `Edit split ${s.label}` : undefined}
                  onClick={() => { if (canEdit) onEdit(s); }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (canEdit) onEdit(s);
                    }
                  }}
                >
                  <div className={styles.splitInfo}>
                    <span className={styles.splitLabel}>{s.label}</span>
                    <span className={styles.splitMeta}>
                      {displayCategory(s.category)} · {new Date(s.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                  <div className={styles.splitRight}>
                    <span className={`${styles.splitRemaining} ${s.direction === "i_owe_them" ? styles.splitYouOwe : styles.splitOwedToYou}`}>
                      {s.direction === "i_owe_them" ? `-${formatCurrency(remaining)}` : formatCurrency(remaining)}
                    </span>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={(event) => { event.stopPropagation(); onSettle(s.id, peer.id); }}
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
