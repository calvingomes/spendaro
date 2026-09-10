"use client";

import { ReceiptText, BarChart3, PlusCircle, PiggyBank, Home, LucideIcon } from "lucide-react";
import styles from "./desktop-navigation.module.css";
import clsx from "clsx";
import type { NavTab } from "@/lib/types";
import { useDashboard } from "@/context/dashboard-context";

interface TabItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "pots", label: "Pots", icon: PiggyBank },
];

export function DesktopNavigation() {
  const { activeTab, setActiveTab, openExpenseModal } = useDashboard();

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
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} className={styles.desktopIcon} />
              <span>{label}</span>
              {isActive && <div className={styles.desktopActiveIndicator} />}
            </button>
          );
        })}

        <button
          type="button"
          className={clsx(styles.desktopButton, styles.addDesktopButton)}
          onClick={() => openExpenseModal()}
        >
          <PlusCircle size={16} className={styles.desktopIcon} />
          <span>Add</span>
        </button>
      </div>
    </nav>
  );
}
