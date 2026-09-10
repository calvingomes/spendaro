"use client";

import { useState, useEffect, useRef } from "react";
import { ReceiptText, BarChart3, PlusCircle, PiggyBank, Home, LucideIcon } from "lucide-react";
import styles from "./mobile-navigation.module.css";
import clsx from "clsx";
import type { NavTab } from "@/lib/types";
import { useDashboard } from "@/context/dashboard-context";

interface TabItem {
  id: NavTab;
  icon: LucideIcon;
  isAction?: boolean;
}

const TABS: TabItem[] = [
  { id: "home", icon: Home },
  { id: "transactions", icon: ReceiptText },
  { id: "pots", icon: PiggyBank },
  { id: "analytics", icon: BarChart3 },
];

const ADD_SLOT_VISUAL_INDEX = 2;
const TOTAL_SLOTS = TABS.length + 1;

export function MobileNavigation() {
  const { activeTab, setActiveTab, openExpenseModal } = useDashboard();
  const [isShrunk, setIsShrunk] = useState(false);
  const lastScrollRef = useRef(0);

  const tabVisualIndex = (id: NavTab): number => {
    const rawIdx = TABS.findIndex((t) => t.id === id);
    if (rawIdx === -1) return -1;
    return rawIdx >= ADD_SLOT_VISUAL_INDEX ? rawIdx + 1 : rawIdx;
  };

  const activeVisualIndex = tabVisualIndex(activeTab);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target;
      const currentScrollY = target === document
        ? window.scrollY
        : target instanceof HTMLElement ? target.scrollTop : 0;

      const delta = currentScrollY - lastScrollRef.current;
      if (Math.abs(delta) < 10) return;

      if (delta > 0 && currentScrollY > 30) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
      lastScrollRef.current = currentScrollY;
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  const renderSlots = () => {
    const slots: React.ReactNode[] = [];

    TABS.forEach((tab, rawIdx) => {
      if (rawIdx === ADD_SLOT_VISUAL_INDEX) {
        slots.push(
          <button
            key="add-action"
            type="button"
            className={clsx(styles.mobileButton, styles.addButton)}
            onClick={() => openExpenseModal()}
            aria-label="Add transaction"
          >
            <PlusCircle size={26} />
          </button>
        );
      }

      const isActive = activeTab === tab.id;
      const Icon = tab.icon;
      slots.push(
        <button
          key={tab.id}
          type="button"
          className={clsx(styles.mobileButton, isActive && styles.activeMobileButton)}
          onClick={() => setActiveTab(tab.id)}
        >
          <Icon size={22} className={styles.mobileIcon} />
        </button>
      );
    });

    return slots;
  };

  return (
    <nav
      className={clsx(styles.mobileNav, isShrunk && styles.shrunk)}
      aria-label="Mobile navigation"
    >
      <div
        className={styles.mobileNavInner}
        style={{
          "--active-index": activeVisualIndex !== -1 ? activeVisualIndex : 0,
          "--options-count": TOTAL_SLOTS,
        } as React.CSSProperties}
      >
        {activeVisualIndex !== -1 && (
          <div className={styles.indicator}>
            <div className={styles.indicatorInner} />
          </div>
        )}
        {renderSlots()}
      </div>
    </nav>
  );
}
