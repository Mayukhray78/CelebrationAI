import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { BudgetCategory } from '../types';
import { formatINR, formatINRCompact, calculateBudgetStats } from '../utils/currency';

interface BudgetTrackerProps {
  categories: BudgetCategory[];
  totalBudgetINR: number;
  onUpdateCategorySpent: (categoryId: string, spentAmount: number) => void;
  onRegenerateBudget: () => void;
  isRegenerating: boolean;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = React.memo(({
  categories,
  totalBudgetINR,
  onUpdateCategorySpent,
  onRegenerateBudget,
  isRegenerating,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const stats = useMemo(
    () => calculateBudgetStats(totalBudgetINR, categories),
    [totalBudgetINR, categories],
  );

  const startEdit = (cat: BudgetCategory) => {
    setEditingCategoryId(cat.id);
    setEditValue(cat.spentAmount.toString());
  };

  const saveEdit = (catId: string) => {
    const val = parseFloat(editValue);
    onUpdateCategorySpent(catId, isNaN(val) ? 0 : Math.max(0, val));
    setEditingCategoryId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-8 space-y-6">
      {/* Header & Regenerate action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <PieChart className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Budget Allocation & Spend Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Financially verified allocation across all event streams with interactive actual expense tracking.
          </p>
        </div>

        <button
          onClick={onRegenerateBudget}
          disabled={isRegenerating}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-semibold transition disabled:opacity-50 self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-purple-600"
          aria-label="Regenerate budget section"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-purple-600' : ''}`} />
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Budget'}</span>
        </button>
      </div>

      {/* Top Level Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Budget */}
        <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
            Total Budget
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-950 font-serif">
            {formatINR(stats.totalBudget)}
          </div>
          <div className="text-[11px] text-purple-700 mt-0.5">
            {formatINRCompact(stats.totalBudget)} target ceiling
          </div>
        </div>

        {/* Total Allocated */}
        <div className="bg-cream-50 border border-cream-200 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Estimated Allocation
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            {formatINR(stats.totalAllocated)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.allocationPercentage}% of planned budget
          </div>
        </div>

        {/* Actual Spent */}
        <div className="bg-cream-50 border border-cream-200 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Actual Spent
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            {formatINR(stats.totalSpent)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.utilizationPercentage}% spent so far
          </div>
        </div>

        {/* Remaining Balance */}
        <div
          className={`p-4 rounded-2xl border ${
            stats.remainingBudget < 0
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1">
            {stats.remainingBudget < 0 ? 'Budget Overrun' : 'Remaining Balance'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif">
            {formatINR(Math.abs(stats.remainingBudget))}
          </div>
          <div className="text-[11px] opacity-80 mt-0.5">
            {stats.remainingBudget < 0 ? 'Exceeds budget cap' : 'Available for contingencies'}
          </div>
        </div>
      </div>

      {/* Utilization Visual Bar */}
      <div className="bg-cream-50/80 p-4 sm:p-5 rounded-2xl border border-cream-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Budget Utilization Status</span>
          </div>
          <div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                stats.utilizationStatus === 'danger'
                  ? 'bg-rose-100 text-rose-800'
                  : stats.utilizationStatus === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {stats.utilizationPercentage}% Utilized ({stats.utilizationStatus === 'danger' ? 'Over Budget' : stats.utilizationStatus === 'warning' ? 'Near Cap' : 'On Track'})
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div
          className="w-full bg-cream-200 rounded-full h-3.5 overflow-hidden flex shadow-inner"
          role="progressbar"
          aria-valuenow={stats.utilizationPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Budget utilization ${stats.utilizationPercentage} percent`}
        >
          <div
            className={`h-full transition-all duration-500 ${
              stats.utilizationStatus === 'danger'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                : stats.utilizationStatus === 'warning'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500'
                : 'bg-gradient-to-r from-purple-700 to-indigo-600'
            }`}
            style={{ width: `${Math.min(100, stats.utilizationPercentage)}%` }}
          ></div>
        </div>

        {/* Multi-category proportional breakdown bar */}
        <div className="pt-2">
          <div className="text-[11px] text-slate-500 font-medium mb-1">
            Category Breakdown Distribution:
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100" role="group" aria-label="Category proportional distribution">
            {categories.map((cat) => (
              <div
                key={cat.id}
                title={`${cat.name}: ${formatINR(cat.allocatedAmount)} (${cat.percentage}%)`}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color || '#6D28D9',
                }}
                className="h-full hover:opacity-80 transition cursor-pointer"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Categories Table / Cards */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Stream-by-Stream Allocations & Expense Tracker
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {categories.map((cat) => {
            const isEditing = editingCategoryId === cat.id;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-cream-200 hover:border-purple-200 bg-white shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#6D28D9' }}
                      ></span>
                      <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        cat.priority === 'essential'
                          ? 'bg-purple-100 text-purple-800'
                          : cat.priority === 'recommended'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cat.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-cream-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400">Allocated: </span>
                    <span className="font-bold text-slate-800">
                      {formatINR(cat.allocatedAmount)}
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold ml-1">
                      ({cat.percentage}%)
                    </span>
                  </div>

                  {/* Interactive Spend Editor */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400">Spent:</span>
                    {isEditing ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(cat.id);
                            if (e.key === 'Escape') setEditingCategoryId(null);
                          }}
                          className="w-20 px-1.5 py-0.5 border border-purple-400 rounded text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                          aria-label={`Enter spent amount for ${cat.name}`}
                        />
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(cat)}
                        className="group flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-cream-50 hover:bg-purple-50 border border-cream-200 text-xs font-semibold text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-purple-600"
                        title="Click to record actual spend"
                        aria-label={`Record spent amount for ${cat.name}, currently ${formatINR(cat.spentAmount)}`}
                      >
                        <span>{formatINR(cat.spentAmount)}</span>
                        <span className="text-[10px] text-purple-600 opacity-60 group-hover:opacity-100">
                          ✎
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

BudgetTracker.displayName = 'BudgetTracker';
