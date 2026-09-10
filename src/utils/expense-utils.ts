import type { Expense } from "@/lib/types";

export const DEFAULT_CATEGORIES = ["Bills", "Entertainment", "Food", "Investment", "Salary", "Savings", "Shopping", "Subscriptions", "Travel"];

/** Returns YYYY-MM-DD in the user's LOCAL timezone (avoids UTC shift). */
export function localDateString(date: Date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");
}

export function formatDateForInput(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return localDateString(d);
}

export function parseAmount(value: string) {
  return Number.parseFloat(value);
}

export function formatCurrency(value: number) {
  const amount = value;
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "₹ 0";
  
  const absoluteAmount = Math.abs(amount);
  const useGrouping = absoluteAmount >= 10000;

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: useGrouping
  }).format(amount);
  
  return formatted.replace("₹", "₹ ").replace(/,/g, " ");
}

export function normalizeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function capitalizeWords(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function calculateAggregates(expenses: Expense[]) {
  return expenses.reduce(
    (acc, e) => {
      const amount = e.amount || 0;
      if (e.type === "credit") {
        acc.income += amount;
      } else if (e.type === "debit") {
        acc.expense += amount;
      }
      return acc;
    },
    { income: 0, expense: 0, savings: 0 }
  );
}

export function getTopCategoryExpenses(
  expenses: Expense[],
  opts: { windowDays: number; limit: number }
): Expense[] {
  const cutoff = Date.now() - opts.windowDays * 86400_000;

  const inWindow = expenses.filter(
    (e) => e.type === "debit" && new Date(e.created_at).getTime() >= cutoff
  );

  if (inWindow.length === 0) return [];

  const groupMap = new Map<string, { count: number; mostRecent: Expense }>();

  for (const e of inWindow) {
    const existing = groupMap.get(e.category);
    if (!existing) {
      groupMap.set(e.category, { count: 1, mostRecent: e });
    } else {
      existing.count += 1;
      if (new Date(e.created_at).getTime() > new Date(existing.mostRecent.created_at).getTime()) {
        existing.mostRecent = e;
      }
    }
  }

  return [...groupMap.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return new Date(b.mostRecent.created_at).getTime() - new Date(a.mostRecent.created_at).getTime();
    })
    .slice(0, opts.limit)
    .map((g) => g.mostRecent);
}
