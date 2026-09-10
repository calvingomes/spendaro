"use client";

import { useEffect, useRef } from "react";
import type { Expense } from "@/lib/types";
import { saveLocalExpenses, getLocalExpenses } from "@/utils/db";
import { processSyncQueue, getQueuedActions } from "@/utils/sync-queue";

interface UseExpenseSyncOptions {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  onSyncError: (message: string | null) => void;
}

export interface ExpenseSyncHandle {
  syncAndRefresh: () => Promise<void>;
  rollbackByActionId: React.MutableRefObject<Map<string, Expense[]>>;
}

export function useExpenseSync({
  expenses,
  setExpenses,
  onSyncError,
}: UseExpenseSyncOptions): ExpenseSyncHandle {
  const rollbackByActionId = useRef(new Map<string, Expense[]>());

  const syncAndRefresh = async () => {
    const result = await processSyncQueue();

    if (result.failedActionIds.length > 0) {
      const rollback = result.failedActionIds
        .map((id) => rollbackByActionId.current.get(id))
        .find((snapshot): snapshot is Expense[] => Boolean(snapshot));

      if (rollback) {
        setExpenses(rollback);
        await saveLocalExpenses(rollback);
      }

      result.failedActionIds.forEach((id) => rollbackByActionId.current.delete(id));
      onSyncError("Couldn't sync the latest change. Your previous data was restored.");
    }

    if (result.remainingCount === 0) {
      try {
        const response = await fetch("/api/expenses");
        if (response.ok) {
          const body = await response.json();
          if (body.expenses) {
            setExpenses(body.expenses);
            await saveLocalExpenses(body.expenses);
          }
        }
      } catch (err) {
        console.error("Failed to refresh expenses after online sync:", err);
      }
    }
  };

  useEffect(() => {
    const initializeLocalCache = async () => {
      const isOffline = typeof window !== "undefined" && !navigator.onLine;
      const hasUnsyncedActions = getQueuedActions().length > 0;

      if (!isOffline && hasUnsyncedActions) {
        await syncAndRefresh();
        return;
      }

      if (isOffline || hasUnsyncedActions) {
        const cached = await getLocalExpenses();
        if (cached && cached.length > 0) {
          setExpenses(cached);
          return;
        }
      }

      if (expenses !== undefined) {
        await saveLocalExpenses(expenses);
      }
    };
    initializeLocalCache();
  }, []);

  useEffect(() => {
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        syncAndRefresh();
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    return () => window.removeEventListener("online", handleOnlineStatus);
  }, []);

  return { syncAndRefresh, rollbackByActionId };
}
