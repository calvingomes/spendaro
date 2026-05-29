import type { Expense } from "@/lib/types";

export const DEFAULT_CATEGORIES = ["Bills", "Entertainment", "Food", "Investment", "Salary", "Savings", "Shopping", "Subscriptions", "Travel"];

export function formatDateForInput(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate())
  ].join("-");
}

export function parseAmount(value: string) {
  return Number.parseFloat(value);
}

export function formatCurrency(value: string | number) {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value;
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

export function calculateAggregates(expenses: Expense[]) {
  return expenses.reduce(
    (acc, e) => {
      const amount = Number.parseFloat(e.amount) || 0;
      if (e.type === "credit") {
        acc.income += amount;
      } else if (e.type === "debit") {
        acc.expense += amount;
      } else if (e.type === "savings") {
        acc.savings += amount;
        if (amount < 0) {
          acc.expense += Math.abs(amount);
        }
      }
      return acc;
    },
    { income: 0, expense: 0, savings: 0 }
  );
}
