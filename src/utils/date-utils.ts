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

export function getWeekRange(weeksAgo: number) {
  const today = new Date();
  const day = today.getDay();
  const offset = today.getDate() - day + (day === 0 ? -6 : 1) - (weeksAgo * 7);
  const start = new Date(today.setDate(offset));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getWeekLabel(weeksAgo: number) {
  const today = new Date();
  const day = today.getDay();
  const offset = today.getDate() - day + (day === 0 ? -6 : 1) - (weeksAgo * 7);
  const start = new Date(today.setDate(offset));
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const format = (d: Date) => {
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${d.getDate()}`;
  };
  
  return `${format(start)} - ${format(end)}`;
}
