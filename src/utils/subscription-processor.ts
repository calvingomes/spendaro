import type { Subscription, Expense } from "@/lib/types";

function isSameMonthAndYear(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

/**
 * Scans active subscriptions and generates due expenses.
 * Runs reverse chronologically from the current month back to the creation month.
 */
export async function processSubscriptions(
  subscriptions: Subscription[],
  currentExpenses: Expense[],
  onNewExpenseGenerated: (expense: Expense) => Promise<void>
): Promise<Expense[]> {
  const generatedExpenses: Expense[] = [];
  const allExpenses = [...currentExpenses];
  const now = new Date();

  for (const sub of subscriptions) {
    const createdDate = new Date(sub.created_at);
    
    // Start scanning from the current month/year
    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth(); // 0-11
    
    // Safety guard to prevent infinite loops (max 36 months back)
    let iterations = 0;
    const maxIterations = 36;

    while (iterations < maxIterations) {
      iterations++;
      
      // Determine the target day for the specific month/year, capping it at the last day of that month
      const lastDayOfTargetMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const actualDay = Math.min(sub.renewal_day, lastDayOfTargetMonth);
      
      // Create target date at noon UTC/local to avoid timezone shift quirks
      const targetDate = new Date(currentYear, currentMonth, actualDay, 12, 0, 0, 0);

      // 1. If the target renewal date is in the future, skip and check previous month
      if (targetDate > now) {
        // Move to the previous month
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        continue;
      }

      // 2. Stop condition: If the target date is before the subscription was created, we stop scanning back
      if (targetDate < createdDate) {
        break;
      }

      // 3. Check if an expense already exists for this subscription in this specific month
      const exists = allExpenses.some(
        (e) => e.subscription_id === sub.id && isSameMonthAndYear(new Date(e.created_at), targetDate)
      );

      if (exists) {
        // Stop condition: If the closest past date is already added, previous months are also assumed to be added.
        break;
      }

      // 4. Generate the missing recurring expense
      const newExpense: Expense = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        user_id: sub.user_id,
        label: `${sub.name} (Recurring)`,
        category: sub.category,
        amount: sub.amount,
        type: "debit",
        subscription_id: sub.id,
        created_at: targetDate.toISOString(),
        updated_at: new Date().toISOString(),
      };

      await onNewExpenseGenerated(newExpense);
      generatedExpenses.push(newExpense);
      allExpenses.push(newExpense); // Add to the array so subsequent checks see it

      // Move to previous month to check if it's missing too
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    }
  }

  return generatedExpenses;
}
