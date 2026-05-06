export type DateRange = "this-month" | "last-month" | "last-3-months" | "overall" | "custom";

export function isDateInRange(date: Date, range: DateRange, customStart?: string, customEnd?: string): boolean {
  const now = new Date();
  
  // Set to end of day for comparisons
  const checkDate = new Date(date);
  
  switch (range) {
    case "this-month": {
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return checkDate >= startOfThisMonth;
    }
    case "last-month": {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return checkDate >= startOfLastMonth && checkDate <= endOfLastMonth;
    }
    case "last-3-months": {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      ninetyDaysAgo.setHours(0, 0, 0, 0);
      return checkDate >= ninetyDaysAgo;
    }
    case "overall":
      return true;
    case "custom": {
      if (!customStart || !customEnd) return true;
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59);
      return checkDate >= s && checkDate <= e;
    }
    default:
      return true;
  }
}
