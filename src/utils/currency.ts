/**
 * Utility functions for formatting and calculating Indian Rupees (INR)
 */

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  // Format using Indian locale grouping (en-IN)
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));

  return `₹${formatted}`;
}

/**
 * Returns a readable Indian denomination like ₹5 Lakhs, ₹1.5 Cr, ₹75,000
 */
export function formatINRCompact(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    const cr = (abs / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${sign}₹${cr} Cr`;
  }
  if (abs >= 100000) {
    const lakhs = (abs / 100000).toFixed(2).replace(/\.00$/, '');
    return `${sign}₹${lakhs} Lakhs`;
  }
  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(1).replace(/\.0$/, '');
    return `${sign}₹${k}k`;
  }

  return `${sign}₹${abs}`;
}

/**
 * Calculate financial totals safely
 */
export function calculateBudgetStats(
  totalBudget: number,
  categories: { allocatedAmount: number; spentAmount: number }[]
) {
  const safeTotalBudget = Math.max(0, totalBudget || 0);

  const totalAllocated = categories.reduce(
    (sum, cat) => sum + (cat.allocatedAmount || 0),
    0
  );

  const totalSpent = categories.reduce(
    (sum, cat) => sum + (cat.spentAmount || 0),
    0
  );

  const remainingBudget = safeTotalBudget - totalSpent;
  const utilizationPercentage =
    safeTotalBudget > 0
      ? Math.min(999, Math.round((totalSpent / safeTotalBudget) * 100))
      : 0;

  const allocationPercentage =
    safeTotalBudget > 0
      ? Math.min(999, Math.round((totalAllocated / safeTotalBudget) * 100))
      : 0;

  let utilizationStatus: 'safe' | 'warning' | 'danger' = 'safe';
  if (utilizationPercentage > 100) {
    utilizationStatus = 'danger';
  } else if (utilizationPercentage >= 85) {
    utilizationStatus = 'warning';
  }

  return {
    totalBudget: safeTotalBudget,
    totalAllocated,
    totalSpent,
    remainingBudget,
    utilizationPercentage,
    allocationPercentage,
    utilizationStatus,
  };
}
