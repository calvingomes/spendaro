import { CheckCircle, PiggyBank, Zap } from "lucide-react";

export const CURRENT_VERSION = "2.2.0";

export const RELEASE_FEATURES = [
  {
    id: "add-from-anywhere",
    icon: Zap,
    title: "Add from Anywhere",
    description: "The + button now opens the add modal from every screen — Pots, Analytics, Profile — not just the home tab."
  },
  {
    id: "pot-delta",
    icon: PiggyBank,
    title: "Pot Balance Feedback",
    description: "Adding or withdrawing from a pot now shows an animated +/- delta next to the pot balance."
  },
  {
    id: "edit-toggle",
    icon: CheckCircle,
    title: "Switch Type on Edit",
    description: "You can now change a transaction between Expense and Income when editing it."
  }
];
