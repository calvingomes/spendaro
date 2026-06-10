"use client";

import { ReceiptText, BarChart3, User, PlusCircle, PiggyBank, LucideIcon } from "lucide-react";
import styles from "./desktop-navigation.module.css";
import clsx from "clsx";
import type { NavTab } from "@/lib/types";

interface DesktopNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "pots", label: "Pots", icon: PiggyBank },
  { id: "add", label: "Add", icon: PlusCircle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

export function DesktopNavigation({ activeTab, onTabChange }: DesktopNavigationProps) {
  return (
    <nav className={styles.desktopNav} aria-label="Desktop navigation">
      <div className={styles.desktopNavInner}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              className={clsx(styles.desktopButton, isActive && styles.activeDesktopButton)}
              onClick={() => onTabChange(id)}
            >
              <Icon size={16} className={styles.desktopIcon} />
              <span>{label}</span>
              {isActive && <div className={styles.desktopActiveIndicator} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
