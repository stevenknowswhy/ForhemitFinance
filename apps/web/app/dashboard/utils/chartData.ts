/**
 * Utility functions to process transaction data for charts
 */

interface Transaction {
  _id: string;
  amount: number;
  date: string | number;
  dateTimestamp?: number;
  categoryName?: string;
  category?: string[];
  merchantName?: string;
  merchant?: string;
  description?: string;
}

interface Analytics {
  totalIncome: number;
  totalSpent: number;
  netCashFlow: number;
  topCategories: Array<{
    category: string;
    amount: number;
  }>;
}

/**
 * Generate cash flow data from transactions (last 30 days)
 */
export function generateCashFlowData(
  transactions: Transaction[] | undefined
): Array<{ date: string; income: number; expenses: number; net: number }> {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const now = new Date();
  const daysAgo = 30;
  const data: Record<string, { income: number; expenses: number }> = {};

  // Initialize last 30 days
  for (let i = daysAgo; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    data[dateKey] = { income: 0, expenses: 0 };
  }

  // Process transactions
  transactions.forEach((transaction) => {
    const date = new Date(
      transaction.dateTimestamp || transaction.date
    );
    const dateKey = date.toISOString().split("T")[0];
    
    if (data[dateKey]) {
      if (transaction.amount >= 0) {
        data[dateKey].income += transaction.amount;
      } else {
        data[dateKey].expenses += Math.abs(transaction.amount);
      }
    }
  });

  return Object.entries(data).map(([date, values]) => ({
    date,
    income: values.income,
    expenses: values.expenses,
    net: values.income - values.expenses,
  }));
}

/**
 * Generate spending by category data
 */
export function generateCategoryData(
  analytics: Analytics | null | undefined
): Array<{ name: string; value: number }> {
  if (!analytics || !analytics.topCategories || analytics.topCategories.length === 0) {
    return [];
  }

  return analytics.topCategories.map((cat) => ({
    name: cat.category || "Uncategorized",
    value: cat.amount,
  }));
}

/**
 * Generate monthly income vs expenses data (last 6 months)
 */
export function generateMonthlyIncomeVsExpenses(
  transactions: Transaction[] | undefined
): Array<{ month: string; income: number; expenses: number }> {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const now = new Date();
  const months: Record<string, { income: number; expenses: number }> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    months[monthKey] = { income: 0, expenses: 0 };
  }

  // Process transactions
  transactions.forEach((transaction) => {
    const date = new Date(
      transaction.dateTimestamp || transaction.date
    );
    const monthKey = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    if (months[monthKey]) {
      if (transaction.amount >= 0) {
        months[monthKey].income += transaction.amount;
      } else {
        months[monthKey].expenses += Math.abs(transaction.amount);
      }
    }
  });

  return Object.entries(months).map(([month, values]) => ({
    month,
    income: values.income,
    expenses: values.expenses,
  }));
}

/**
 * Generate monthly trend data (net cash flow and balance)
 */
export function generateMonthlyTrends(
  transactions: Transaction[] | undefined,
  accounts: Array<{ balance?: number }> | undefined
): Array<{ month: string; netCashFlow: number; balance: number }> {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const now = new Date();
  const months: Record<
    string,
    { netCashFlow: number; balance: number }
  > = {};

  // Calculate total balance
  const totalBalance =
    accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    months[monthKey] = { netCashFlow: 0, balance: totalBalance };
  }

  // Process transactions backwards to calculate running balance
  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(b.dateTimestamp || b.date).getTime() -
      new Date(a.dateTimestamp || a.date).getTime()
  );

  let runningBalance = totalBalance;

  sortedTransactions.forEach((transaction) => {
    const date = new Date(transaction.dateTimestamp || transaction.date);
    const monthKey = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    if (months[monthKey]) {
      runningBalance -= transaction.amount;
      months[monthKey].netCashFlow += transaction.amount;
      months[monthKey].balance = runningBalance;
    }
  });

  return Object.entries(months).map(([month, values]) => ({
    month,
    netCashFlow: values.netCashFlow,
    balance: Math.max(0, values.balance), // Ensure non-negative for display
  }));
}

