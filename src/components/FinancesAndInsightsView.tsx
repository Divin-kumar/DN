import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Edit3,
  Heart,
  Info,
  ListFilter,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
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

  const [confirmDeleteTx, setConfirmDeleteTx] = useState<FinanceRecord | null>(null);

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
    .map(([category, stats]) => ({
      category,
      amount: stats.amount,
      count: stats.count,
      pct: totalExpenses > 0 ? Math.round((stats.amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  db.finances.forEach((f) => {
    const ym = f.date.slice(0, 7);
    const prev = monthlyMap.get(ym) || { income: 0, expense: 0 };
    if (f.type === 'income') prev.income += f.amount;
    else prev.expense += f.amount;
    monthlyMap.set(ym, prev);
  });

  const monthlySummaries = Array.from(monthlyMap.entries())
    .map(([ym, vals]) => ({
      ym,
      income: vals.income,
      expense: vals.expense,
      net: vals.income - vals.expense,
    }))
    .sort((a, b) => b.ym.localeCompare(a.ym))
    .slice(0, 6);

  const allCategories = Array.from(new Set(db.finances.map((f) => f.category)));

  const filteredTransactions = periodFinances
    .filter((f) => {
      if (txTypeFilter !== 'all' && f.type !== txTypeFilter) return false;
      if (txCategoryFilter !== 'all' && f.category !== txCategoryFilter) return false;
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.notes && f.notes.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (txSort === 'amount') return b.amount - a.amount;
      return b.date.localeCompare(a.date);
    });

  const upcomingMomentsCount = db.moments.filter(
    (m) => m.status === 'upcoming' || m.status === 'in-progress'
  ).length;
  const completedMomentsCount = db.moments.filter((m) => m.status === 'completed').length;

  const momentsByTypeMap = new Map<string, number>();
  db.moments.forEach((m) => {
    momentsByTypeMap.set(m.type, (momentsByTypeMap.get(m.type) || 0) + 1);
  });
  const momentDistribution = Array.from(momentsByTypeMap.entries()).sort((a, b) => b[1] - a[1]);

  const totalActivitiesCount = db.activities.length;
  const completedActivitiesCount = db.activities.filter((a) => a.completed).length;
  const activityCompletionRate =
    totalActivitiesCount > 0
      ? Math.round((completedActivitiesCount / totalActivitiesCount) * 100)
      : 0;

  const historicalTimeline = [
    ...db.moments.map((m) => ({
      id: `hist-mom-${m.id}`,
      date: m.date,
      title: m.title,
      subtitle: `${m.type} · Status: ${m.status}`,
      domain: 'Moment' as const,
      onClick: () => onNavigate('moments', { momentId: m.id }),
    })),
    ...db.memories.map((mem) => ({
      id: `hist-mem-${mem.id}`,
      date: mem.date,
      title: mem.title,
      subtitle: mem.location ? `Memory at ${mem.location}` : 'Personal Journal Entry',
      domain: 'Memory' as const,
      onClick: () => onNavigate('memories', { memoriesTab: 'journal' }),
    })),
    ...db.finances.map((fin) => ({
      id: `hist-fin-${fin.id}`,
      date: fin.date,
      title: `${fin.title} (${fin.type === 'income' ? '+' : '-'}${formatCurrency(
        fin.amount,
        currency
      )})`,
      subtitle: `${fin.type.toUpperCase()} · ${fin.category}`,
      domain: 'Finance' as const,
      onClick: () => onChangeSubTab('transactions'),
    })),
    ...db.activities.map((act) => ({
      id: `hist-act-${act.id}`,
      date: act.date,
      title: act.title,
      subtitle: `Activity · ${act.completed ? 'Completed' : 'Open'} (${act.priority} priority)`,
      domain: 'Activity' as const,
      onClick: () =>
        act.momentId
          ? onNavigate('moments', { momentId: act.momentId })
          : onNavigate('home'),
    })),
  ]
    .filter((item) => {
      if (!isWithinPeriod(item.date, period)) return false;
      if (timelineSearch.trim()) {
        const q = timelineSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.domain.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {activeSubTab === 'insights'
              ? 'Personal Life & Financial Insights'
              : 'Personal Finances & Cash Flow'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {activeSubTab === 'insights'
              ? 'Unified analytics across your moments, activities, memories, and recorded spending.'
              : 'Understand your recorded income, occasion spending, and category trends in Indian Rupees (₹).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onChangeSubTab('overview')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSubTab('transactions')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'transactions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Transactions ({db.finances.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSubTab('insights')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'insights'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Insights & Reports</span>
            </button>
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 whitespace-nowrap">
            Reporting Window:
          </span>
          {(
            [
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: '365d', label: 'Past Year' },
              { id: 'all', label: 'All Time' },
            ] as { id: PeriodFilter; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                period === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenQuickCreate('expense')}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('income')}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Record Income</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Recorded Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalIncome, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {periodFinances.filter((f) => f.type === 'income').length} income entries in period
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Recorded Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalExpenses, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {periodFinances.filter((f) => f.type === 'expense').length} expense entries in period
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Net Recorded Cash Flow</span>
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p
            className={`mt-2 text-2xl font-mono font-semibold tabular-nums ${
              netCashFlow >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {netCashFlow >= 0 ? '+' : ''}
            {formatCurrency(netCashFlow, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {totalIncome > 0
              ? `${savingsRatePct}% net retention of recorded income`
              : 'Manual ledger · No bank auto-sync'}
          </p>
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Spending Breakdown by Category
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tap any category to inspect its underlying transactions
                  </p>
                </div>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No expenses recorded for this period
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Log an expense to see your category distribution.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {categoryBreakdown.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => {
                        setTxCategoryFilter(item.category);
                        setTxTypeFilter('expense');
                        onChangeSubTab('transactions');
                      }}
                      className="w-full text-left group space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {item.category} ({item.count})
                        </span>
                        <span className="font-mono text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(item.amount, currency)} · {item.pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all"
                          style={{ width: `${Math.max(item.pct, 4)}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Monthly Comparisons
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Income versus expenses by calendar month
              </p>

              {monthlySummaries.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No monthly data recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {monthlySummaries.map((m) => (
                    <div key={m.ym} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {m.ym}
                        </span>
                        <span
                          className={`font-mono font-medium tabular-nums ${
                            m.net >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Net: {m.net >= 0 ? '+' : ''}
                          {formatCurrency(m.net, currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>In: {formatCurrency(m.income, currency)}</span>
                        <span>Out: {formatCurrency(m.expense, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Figures reflect your manually recorded personal cash flow inside DN and do not connect to external bank accounts.
                </p>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search transactions by description, category, or notes..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
                aria-label="Filter by transaction type"
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>

              <select
                value={txCategoryFilter}
                onChange={(e) => setTxCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={txSort}
                onChange={(e) => setTxSort(e.target.value as 'date' | 'amount')}
                aria-label="Sort transactions"
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="date">Sort: Date</option>
                <option value="amount">Sort: Highest Amount</option>
              </select>
            </div>
          </section>

          {filteredTransactions.length === 0 ? (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
              <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No transactions match your current filters
              </p>
              {txCategoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setTxCategoryFilter('all')}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear category filter
                </button>
              )}
            </section>
          ) : (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredTransactions.map((tx) => {
                const linkedMoment = db.moments.find((m) => m.id === tx.momentId);
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatDate(tx.date, dateFormat)}</span>
                        {linkedMoment && (
                          <>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() => onNavigate('moments', { momentId: linkedMoment.id })}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Moment: {linkedMoment.title}
                            </button>
                          </>
                        )}
                        {tx.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xs">{tx.notes}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-mono font-semibold tabular-nums ${
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
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label="Edit transaction"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteTx(tx)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('moments')}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 cursor-pointer hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Moments & Occasions</span>
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {db.moments.length}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {upcomingMomentsCount} upcoming · {completedMomentsCount} completed
              </p>
            </div>

            <div
              onClick={() => onNavigate('home')}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 cursor-pointer hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Activity Completion</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {activityCompletionRate}%
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {completedActivitiesCount} of {totalActivitiesCount} tasks finished
              </p>
            </div>

            <div
              onClick={() => onNavigate('memories', { memoriesTab: 'journal' })}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 cursor-pointer hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Memory Collection</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {db.memories.length}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {db.memories.filter((m) => !!m.photoUrl).length} with photographs
              </p>
            </div>

            <div
              onClick={() => onNavigate('memories', { memoriesTab: 'attachments' })}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 cursor-pointer hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Vault & Greetings</span>
                <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {db.attachments.length + db.greetings.length}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {db.attachments.length} files · {db.greetings.length} greetings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Moments Distribution by Type
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Breakdown of your recorded occasions and milestones
              </p>

              {momentDistribution.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Add moments to view distribution by type.
                </p>
              ) : (
                <div className="space-y-3">
                  {momentDistribution.map(([type, count]) => {
                    const pct =
                      db.moments.length > 0 ? Math.round((count / db.moments.length) * 100) : 0;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {type}
                          </span>
                          <span className="font-mono text-slate-900 dark:text-white tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-600 dark:bg-violet-500"
                            style={{ width: `${Math.max(pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Spending Linked to Moments
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                How your recorded expenses connect to meaningful family occasions
              </p>

              {db.moments.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No moments recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {db.moments.slice(0, 5).map((mom) => {
                    const spend = db.finances
                      .filter((f) => f.momentId === mom.id && f.type === 'expense')
                      .reduce((sum, f) => sum + f.amount, 0);
                    return (
                      <div
                        key={mom.id}
                        onClick={() => onNavigate('moments', { momentId: mom.id })}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 truncate">
                            {mom.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {mom.type} · {formatDate(mom.date, dateFormat)}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white shrink-0 tabular-nums">
                          {formatCurrency(spend, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Searchable Historical Timeline
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every moment, activity, memory, and financial transaction in chronological order. Tap any entry to open it.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  placeholder="Filter timeline..."
                  className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {historicalTimeline.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No historical records match your selected date range or search query.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-96 overflow-y-auto pr-1">
                {historicalTimeline.map((item) => (
                  <div
                    key={item.id}
                    onClick={item.onClick}
                    className="py-3 flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {item.domain}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatDate(item.date, dateFormat)}</span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteTx}
        title="Delete Transaction?"
        description={`Are you sure you want to delete "${confirmDeleteTx?.title}" (${
          confirmDeleteTx ? formatCurrency(confirmDeleteTx.amount, currency) : ''
        })?`}
        confirmLabel="Delete Entry"
        onCancel={() => setConfirmDeleteTx(null)}
        onConfirm={() => {
          if (confirmDeleteTx) {
            onDeleteFinance(confirmDeleteTx.id);
            setConfirmDeleteTx(null);
          }
        }}
      />
    </div>
  );
};
