import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Edit3,
  Filter,
  Heart,
  Info,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import {
  DNDatabase,
  FinanceRecord,
  FinancesSubTab,
  MemoriesSubTab,
  PrimarySection,
} from '../types/dn';
import {
  formatCurrency,
  formatDate,
  getDaysUntil,
  getTodayISO,
} from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';
import { FilterSheet } from './FilterSheet';
import { QuickCreateMode } from './QuickCreateModal';

interface FinancesAndInsightsViewProps {
  db: DNDatabase;
  activeSubTab: FinancesSubTab;
  onChangeSubTab: (tab: FinancesSubTab) => void;
  onOpenQuickCreate: (mode: QuickCreateMode) => void;
  onEditFinance: (finance: FinanceRecord) => void;
  onDeleteFinance: (financeId: string) => void;
  onNavigate: (
    section: PrimarySection,
    options?: {
      momentId?: string;
      memoriesTab?: MemoriesSubTab;
      financesTab?: FinancesSubTab;
    }
  ) => void;
}

type PeriodFilter = '30d' | '90d' | '365d' | 'all';

export const FinancesAndInsightsView: React.FC<FinancesAndInsightsViewProps> = ({
  db,
  activeSubTab,
  onChangeSubTab,
  onOpenQuickCreate,
  onEditFinance,
  onDeleteFinance,
  onNavigate,
}) => {
  const { currency, dateFormat } = db.settings;
  const todayISO = getTodayISO();

  const [period, setPeriod] = useState<PeriodFilter>('90d');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txSort, setTxSort] = useState<'date' | 'amount'>('date');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [confirmDeleteTx, setConfirmDeleteTx] = useState<FinanceRecord | null>(null);

  const activeTxFiltersCount =
    (txTypeFilter !== 'all' ? 1 : 0) +
    (txCategoryFilter !== 'all' ? 1 : 0) +
    (period !== '90d' ? 1 : 0) +
    (txSort !== 'date' ? 1 : 0);

  const handleResetTxFilters = () => {
    setTxTypeFilter('all');
    setTxCategoryFilter('all');
    setPeriod('90d');
    setTxSort('date');
    setTxSearch('');
  };

  const isWithinPeriod = (dateStr: string, p: PeriodFilter) => {
    if (p === 'all') return true;
    const diffDays = Math.abs(getDaysUntil(dateStr, todayISO));
    if (p === '30d') return diffDays <= 30;
    if (p === '90d') return diffDays <= 90;
    if (p === '365d') return diffDays <= 365;
    return true;
  };

  const periodFinances = db.finances.filter((f) => isWithinPeriod(f.date, period));

  const totalIncome = periodFinances
    .filter((f) => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = periodFinances
    .filter((f) => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;
  const savingsRatePct =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const expenseByCategoryMap = new Map<string, { amount: number; count: number }>();
  periodFinances
    .filter((f) => f.type === 'expense')
    .forEach((f) => {
      const prev = expenseByCategoryMap.get(f.category) || { amount: 0, count: 0 };
      expenseByCategoryMap.set(f.category, {
        amount: prev.amount + f.amount,
        count: prev.count + 1,
      });
    });

  const categoryBreakdown = Array.from(expenseByCategoryMap.entries())
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      count,
      pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const allCategories = Array.from(
    new Set([
      ...db.settings.expenseCategories.filter((c) => c.enabled).map((c) => c.name),
      ...db.settings.incomeTypes.filter((c) => c.enabled).map((c) => c.name),
      ...db.finances.map((f) => f.category),
    ])
  ).sort();

  const filteredTransactions = db.finances
    .filter((f) => {
      if (!isWithinPeriod(f.date, period)) return false;
      if (txTypeFilter !== 'all' && f.type !== txTypeFilter) return false;
      if (txCategoryFilter !== 'all' && f.category !== txCategoryFilter) return false;
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (txSort === 'amount') return b.amount - a.amount;
      return b.date.localeCompare(a.date);
    });

  // Insights computations
  const upcomingMomentsCount = db.moments.filter(
    (m) => m.status === 'upcoming' || m.status === 'in-progress'
  ).length;
  const completedMomentsCount = db.moments.filter((m) => m.status === 'completed').length;
  const completedActivitiesCount = db.activities.filter((a) => a.completed).length;
  const totalActivitiesCount = db.activities.length;
  const activityCompletionRate =
    totalActivitiesCount > 0
      ? Math.round((completedActivitiesCount / totalActivitiesCount) * 100)
      : 0;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* 1. Page Header with Exactly 1 Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finances & Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Private ledger in Indian Rupees (₹) · Independent money tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenQuickCreate('income')}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold"
          >
            + Income
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('expense')}
            className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 w-fit text-xs">
        <button
          type="button"
          onClick={() => onChangeSubTab('overview')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'overview'
              ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab('transactions')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'transactions'
              ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Transactions ({db.finances.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab('insights')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'insights'
              ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Life Insights
        </button>
      </div>

      {/* Subtab 1: Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="dn-card p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Net Cash Flow
              </p>
              <p
                className={`mt-1 text-2xl font-mono font-bold tabular-nums ${
                  netCashFlow >= 0
                    ? 'text-[#286747] dark:text-[#70A987]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {netCashFlow >= 0 ? '+' : ''}
                {formatCurrency(netCashFlow, currency)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {period === '90d' ? 'Last 90 days' : period === '30d' ? 'Last 30 days' : 'Recorded total'}
              </p>
            </div>

            <div className="dn-card p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Recorded Income
              </p>
              <p className="mt-1 text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalIncome, currency)}
              </p>
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {savingsRatePct}% retention
              </p>
            </div>

            <div className="dn-card p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Expenses
              </p>
              <p className="mt-1 text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalExpenses, currency)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Across {periodFinances.filter((f) => f.type === 'expense').length} entries
              </p>
            </div>
          </div>

          {/* Breakdown by Category */}
          <section className="dn-card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Spending Breakdown by Category
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribution of expenses across your life areas
            </p>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No expenses logged for this period.
              </p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => {
                      setTxCategoryFilter(item.category);
                      setTxTypeFilter('expense');
                      onChangeSubTab('transactions');
                    }}
                    className="w-full text-left space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#286747] dark:group-hover:text-[#70A987]">
                        {item.category} ({item.count})
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(item.amount, currency)} · {item.pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#286747] dark:bg-[#70A987] transition-all"
                        style={{ width: `${Math.max(item.pct, 4)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Subtab 2: Transactions */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4 animate-fade-in">
          {/* Search + Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#286747]"
              />
              {txSearch && (
                <button
                  type="button"
                  onClick={() => setTxSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTxFiltersCount > 0
                  ? 'border-[#286747] dark:border-[#70A987] bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeTxFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]">
                  {activeTxFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Strip */}
          {(activeTxFiltersCount > 0 || txSearch) && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>Showing:</span>
                {txTypeFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium capitalize">
                    {txTypeFilter}
                  </span>
                )}
                {txCategoryFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    Category: {txCategoryFilter}
                  </span>
                )}
                {period !== '90d' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    Period: {period}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetTxFilters}
                className="text-[11px] font-semibold text-[#286747] dark:text-[#70A987] hover:underline shrink-0 ml-2"
              >
                Reset
              </button>
            </div>
          )}

          {/* Filter Sheet */}
          <FilterSheet
            open={filterSheetOpen}
            activeCount={activeTxFiltersCount}
            onClose={() => setFilterSheetOpen(false)}
            onReset={handleResetTxFilters}
            title="Filter Transactions"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'expense', label: 'Expenses' },
                    { id: 'income', label: 'Income' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTxTypeFilter(t.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                        txTypeFilter === t.id
                          ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={txCategoryFilter}
                  onChange={(e) => setTxCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date Range
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: '30d', label: '30 Days' },
                    { id: '90d', label: '90 Days' },
                    { id: '365d', label: '1 Year' },
                    { id: 'all', label: 'All Time' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPeriod(p.id as any)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-medium text-center transition-colors ${
                        period === p.id
                          ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sort Order
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'date', label: 'Date (Recent First)' },
                    { id: 'amount', label: 'Amount (Highest)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTxSort(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                        txSort === s.id
                          ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FilterSheet>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="dn-card p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                No matching transactions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try clearing filters or search terms.
              </p>
            </div>
          ) : (
            <div className="dn-card divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              {filteredTransactions.map((tx) => {
                const linkedMoment = db.moments.find((m) => m.id === tx.momentId);
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span className="font-mono">{formatDate(tx.date, dateFormat)}</span>
                        {linkedMoment && (
                          <>
                            <span>·</span>
                            <span className="text-[#286747] dark:text-[#70A987] font-medium truncate max-w-[140px]">
                              {linkedMoment.title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-mono font-bold tabular-nums ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </span>

                      <button
                        type="button"
                        onClick={() => onEditFinance(tx)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteTx(tx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Life Insights */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="dn-card p-3.5">
              <p className="text-[11px] text-slate-400">Occasions</p>
              <p className="mt-1 text-xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {db.moments.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {upcomingMomentsCount} upcoming
              </p>
            </div>

            <div className="dn-card p-3.5">
              <p className="text-[11px] text-slate-400">Task Completion</p>
              <p className="mt-1 text-xl font-mono font-bold text-[#286747] dark:text-[#70A987] tabular-nums">
                {activityCompletionRate}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {completedActivitiesCount} of {totalActivitiesCount} done
              </p>
            </div>

            <div className="dn-card p-3.5">
              <p className="text-[11px] text-slate-400">Memories</p>
              <p className="mt-1 text-xl font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {db.memories.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {db.memories.filter((m) => !!m.photoUrl).length} photos
              </p>
            </div>

            <div className="dn-card p-3.5">
              <p className="text-[11px] text-slate-400">Vault Files</p>
              <p className="mt-1 text-xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {db.attachments.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Secure storage</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        open={!!confirmDeleteTx}
        title="Delete Transaction?"
        description={`Are you sure you want to remove "${confirmDeleteTx?.title}" (${
          confirmDeleteTx ? formatCurrency(confirmDeleteTx.amount, currency) : ''
        })?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteTx) {
            onDeleteFinance(confirmDeleteTx.id);
            setConfirmDeleteTx(null);
          }
        }}
        onCancel={() => setConfirmDeleteTx(null)}
      />
    </div>
  );
};
