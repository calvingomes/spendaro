import { Zap, ShieldCheck } from "lucide-react";

// Bump this version string next time you release new features to trigger the modal again!
export const CURRENT_VERSION = "1.1.0";

export const RELEASE_FEATURES = [
  {
    id: "sync",
    icon: Zap,
    title: "Worry-Free Offline Mode",
    description: "Log expenses anytime, anywhere. They will automatically save to your account the moment you're back online."
  },
  {
    id: "stab",
    icon: ShieldCheck,
    title: "Stay Signed In",
    description: "Enjoy a seamless experience with reliable, improved logins that keep you securely connected."
  }
];
