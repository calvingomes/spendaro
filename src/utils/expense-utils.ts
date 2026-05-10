export const DEFAULT_CATEGORIES = ["Bills", "Entertainment", "Food", "Investment", "Salary", "Shopping", "Subscriptions", "Travel"];

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

export function formatCurrency(value: string) {
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

export function normalizeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
