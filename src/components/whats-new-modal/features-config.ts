import { Zap, PiggyBank, Compass } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.5.0";

export const RELEASE_FEATURES = [
  {
    id: "savings-pot",
    icon: PiggyBank,
    title: "Introducting Pots",
    description: "A smart way to segregate your savings for various purposes."
  },
  {
    id: "all-new-UI",
    icon: Zap,
    title: "All New Navbar",
    description: "A fresh Navbar UI that feels intuitive."
  },
  {
    id: "dedicated-transactions",
    icon: Compass,
    title: "Dedicated Transactions Workspace",
    description: "A brand-new dedicated page to search, scope, and filter all transactions."
  }
];
