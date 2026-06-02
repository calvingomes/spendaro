import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { ColorPicker } from "@/components/ui/color-picker/color-picker";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import styles from "./new-pot-modal.module.css";
import type { Pot } from "@/lib/types";
import { capitalizeWords } from "@/utils/expense-utils";
import { putLocalPot } from "@/utils/db";
import { queueAction } from "@/utils/sync-queue";

interface NewPotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  pot?: Pot | null; // If provided, we are in Edit mode
}

export function NewPotModal({ isOpen, onClose, onSubmitSuccess, pot }: NewPotModalProps) {
  const [potName, setPotName] = useState("");
  const [potGoal, setPotGoal] = useState("");
  const [potColor, setPotColor] = useState("#f5a623");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with pot prop if editing
  useEffect(() => {
    if (pot) {
      setPotName(pot.name);
      setPotGoal(pot.goal === "0" ? "" : pot.goal);
      setPotColor(pot.color || "#f5a623");
    } else {
      setPotName("");
      setPotGoal("");
      setPotColor("#f5a623");
    }
  }, [pot, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = capitalizeWords(potName);
    if (!formattedName) return;
    setIsSubmitting(true);

    const isOffline = typeof window !== "undefined" && !navigator.onLine;
    const isEdit = !!pot;

    if (isEdit && pot) {
      // Edit Pot Mode
      if (isOffline) {
        const updatedPot: Pot = {
          ...pot,
          name: formattedName,
          goal: potGoal || "0",
          color: potColor,
          updated_at: new Date().toISOString()
        };
        await putLocalPot(updatedPot);
        queueAction("PUT", { id: pot.id, name: formattedName, goal: potGoal || "0", color: potColor }, "pots");
        setIsSubmitting(false);
        onSubmitSuccess();
        onClose();
        return;
      }

      try {
        const res = await fetch("/api/pots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pot.id, name: formattedName, goal: potGoal || "0", color: potColor })
        });
        if (res.ok) {
          const body = await res.json();
          await putLocalPot(body);
          onSubmitSuccess();
          onClose();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Create Pot Mode
      if (isOffline) {
        const offlinePot: Pot = {
          id: crypto.randomUUID(),
          user_id: "offline-user",
          name: formattedName,
          goal: potGoal || "0",
          color: potColor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await putLocalPot(offlinePot);
        queueAction("POST", { name: formattedName, goal: potGoal || "0", color: potColor }, "pots");
        setIsSubmitting(false);
        onSubmitSuccess();
        onClose();
        return;
      }

      try {
        const res = await fetch("/api/pots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formattedName, goal: potGoal || "0", color: potColor })
        });
        if (res.ok) {
          const body = await res.json();
          await putLocalPot(body);
          onSubmitSuccess();
          onClose();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pot ? "Edit Pot" : "Create New Pot"}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Goal Amount Section */}
        <AmountInput value={potGoal} onChange={setPotGoal} label="Goal" />

        <Input
          label="Pot Name"
          value={potName}
          onChange={setPotName}
          placeholder="e.g. Vacation, New Phone"
          required
        />

        <div className={styles.field}>
          <label>Color</label>
          <ColorPicker selectedColor={potColor} onChange={setPotColor} />
        </div>

        <div className={styles.actions}>
          {pot && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || potName.trim() === "" || !potGoal || Number(potGoal) <= 0}
            fullWidth={!pot}
          >
            {isSubmitting ? "Saving..." : pot ? "Save" : "Create Pot"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
