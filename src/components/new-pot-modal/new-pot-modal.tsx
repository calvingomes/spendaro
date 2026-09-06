import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { ColorPicker } from "@/components/ui/color-picker/color-picker";
import { AmountInput } from "@/components/ui/amount-input/amount-input";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import styles from "./new-pot-modal.module.css";
import type { Pot } from "@/lib/types";
import { capitalizeWords } from "@/utils/expense-utils";

interface NewPotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; goal: string; color: string }) => Promise<void>;
  pot?: Pot | null; // If provided, we are in Edit mode
}

export function NewPotModal({ isOpen, onClose, onSubmit, pot }: NewPotModalProps) {
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

    try {
      await onSubmit({ name: formattedName, goal: potGoal || "0", color: potColor });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
              fullWidth
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || potName.trim() === "" || !potGoal || Number(potGoal) <= 0}
            fullWidth
          >
            {isSubmitting ? "Saving..." : pot ? "Save" : "Create Pot"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
