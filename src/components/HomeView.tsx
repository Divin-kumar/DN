import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Gift,
  Heart,
  Image as ImageIcon,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  DNDatabase,
  FinancesSubTab,
  MemoriesSubTab,
  PrimarySection,
} from '../types/dn';
import {
  formatCurrency,
  formatDate,
  getDaysUntil,
  getNextOccurrenceDate,
  getRelativeDayText,
  getTodayISO,
  isOnThisDayInPast,
} from '../utils/dnHelpers';
import { QuickCreateMode } from './QuickCreateModal';

interface HomeViewProps {
  db: DNDatabase;
  onNavigate: (
    section: PrimarySection,
    options?: {
      momentId?: string;
      memoriesTab?: MemoriesSubTab;
      financesTab?: FinancesSubTab;
    }
  ) => void;
  onOpenQuickCreate: (mode: QuickCreateMode) => void;
  onToggleActivity: (activityId: string) => void;
  onLoadDemoData: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  db,
  onNavigate,
  onOpenQuickCreate,
  onToggleActivity,
  onLoadDemoData,
}) => {
  const [financePeriod, setFinancePeriod] = useState<'month' | 'all'>('month');
  const todayISO = getTodayISO();
  const { currency, dateFormat } = db.settings;

  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = db.profile.nickname || db.profile.displayName || 'Friend';

  const isEmptyWorkspace =
    db.moments.length === 0 &&
    db.activities.length === 0 &&
    db.memories.length === 0 &&
    db.finances.length === 0 &&
    db.attachments.length === 0;

  const activeMomentsWithNext = db.moments
    .filter((m) => m.status !== 'cancelled')
    .map((m) => {
      const nextDate = getNextOccurrenceDate(m, todayISO);
      const daysUntil = getDaysUntil(nextDate, todayISO);
      return { moment: m, nextDate, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const todaysMoments = activeMomentsWithNext.filter((item) => item.daysUntil === 0);
  const upcomingMoments = activeMomentsWithNext
    .filter((item) => item.daysUntil > 0 && item.daysUntil <= 90)
    .slice(0, 5);

  const todaysActivities = db.activities
    .filter((a) => a.date === todayISO || (!a.completed && getDaysUntil(a.date, todayISO) <= 0))
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const onThisDayMemories = db.memories
    .map((mem) => ({
      memory: mem,
      pastInfo: isOnThisDayInPast(mem.date, todayISO),
    }))
    .filter((x) => x.pastInfo.matches);

  const onThisDayMoments = db.moments
    .map((mom) => ({
      moment: mom,
      pastInfo: isOnThisDayInPast(mom.date, todayISO),
    }))
    .filter((x) => x.pastInfo.matches);

  const currentYearMonth = todayISO.slice(0, 7);
  const periodFinances = db.finances.filter((f) =>
    financePeriod === 'month' ? f.date.startsWith(currentYearMonth) : true
  );

  const totalIncome = periodFinances
    .filter((f) => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = periodFinances
    .filter((f) => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const expenseByCategoryMap = new Map<string, number>();
  periodFinances
    .filter((f) => f.type === 'expense')
    .forEach((f) => {
      expenseByCategoryMap.set(f.category, (expenseByCategoryMap.get(f.category) || 0) + f.amount);
    });
  const topExpenseCategories = Array.from(expenseByCategoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const recentMemories = [...db.memories]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);

  const recentAttachments = [...db.attachments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <div className="space-y-8 pb-10">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {formatDate(todayISO, dateFormat)} · Private Personal Workspace
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
            {salutation}, {userName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            {isEmptyWorkspace
              ? 'Your personal space is clean and ready. Begin by adding an important occasion, daily task, memory, or expense below.'
              : `You have ${todaysMoments.length} ${
                  todaysMoments.length === 1 ? 'occasion' : 'occasions'
                } and ${todaysActivities.filter((a) => !a.completed).length} open ${
                  todaysActivities.filter((a) => !a.completed).length === 1 ? 'activity' : 'activities'
                } on your radar for today.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('finances', { financesTab: 'insights' })}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Life & Finance Insights</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('memories', { memoriesTab: 'greetings' })}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Gift className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Greetings Studio</span>
          </button>
        </div>
      </section>

      <section aria-label="Quick Actions" className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2.5 min-w-max">
          <button
            type="button"
            onClick={() => onOpenQuickCreate('moment')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Moment</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickCreate('activity')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Add Activity</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickCreate('memory')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Write Memory</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickCreate('expense')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Log Expense</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickCreate('income')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Record Income</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickCreate('attachment')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Add Attachment</span>
          </button>
        </div>
      </section>

      {isEmptyWorkspace && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Private By Design · Local-First Companion
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white text-balance">
              Start fresh or explore DN with realistic sample records
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Your workspace starts completely clean so your personal moments, journal entries, and ₹ cash flow remain exclusively yours. Want to see how interconnected moments, recurring birthdays, Coorg travel memories, occasion greetings, and finances work together first?
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onLoadDemoData}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm font-medium text-white inline-flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Sample Life Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('moment')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Create First Moment
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Today’s Focus & Activities
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Occasions happening today and tasks scheduled for your attention
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('activity')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors whitespace-nowrap shrink-0"
              >
                + Add Task
              </button>
            </div>

            {todaysMoments.length === 0 && todaysActivities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  A calm, unscheduled day ahead
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  No occasions or pending activities are due today. Add a task or plan an upcoming family moment whenever you are ready.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {todaysMoments.map(({ moment }) => (
                  <div
                    key={moment.id}
                    onClick={() => onNavigate('moments', { momentId: moment.id })}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        <span>Today’s Moment</span>
                        <span aria-hidden="true">·</span>
                        <span>{moment.type}</span>
                        {moment.time && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{moment.time}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {moment.title}
                      </p>
                      {moment.description && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {moment.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}

                {todaysActivities.map((act) => {
                  const linkedMoment = db.moments.find((m) => m.id === act.momentId);
                  return (
                    <div
                      key={act.id}
                      className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleActivity(act.id)}
                        className="min-h-[44px] min-w-[44px] -ml-2 -my-1.5 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
                        aria-label={act.completed ? 'Mark activity incomplete' : 'Mark activity completed'}
                      >
                        {act.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            act.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {act.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span
                            className={
                              act.priority === 'high'
                                ? 'text-rose-600 dark:text-rose-400 font-medium'
                                : act.priority === 'medium'
                                ? 'text-amber-600 dark:text-amber-400'
                                : ''
                            }
                          >
                            {act.priority.charAt(0).toUpperCase() + act.priority.slice(1)} priority
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{formatDate(act.date, dateFormat)}</span>
                          {linkedMoment && (
                            <>
                              <span aria-hidden="true">·</span>
                              <button
                                type="button"
                                onClick={() => onNavigate('moments', { momentId: linkedMoment.id })}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[180px]"
                              >
                                {linkedMoment.title}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Upcoming Moments & Occasions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Birthdays, anniversaries, festivals, and recurring dates over the next 90 days
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('moments')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingMoments.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No upcoming occasions registered yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Add family birthdays, wedding anniversaries, or festivals so DN can track their next occurrence automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {upcomingMoments.map(({ moment, nextDate, daysUntil }) => {
                  const openTasks = db.activities.filter(
                    (a) => a.momentId === moment.id && !a.completed
                  ).length;

                  return (
                    <div
                      key={moment.id}
                      onClick={() => onNavigate('moments', { momentId: moment.id })}
                      className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {moment.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{moment.type}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{formatDate(nextDate, dateFormat)}</span>
                          {moment.recurrence !== 'none' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="capitalize">Repeats {moment.recurrence}</span>
                            </>
                          )}
                          {openTasks > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {openTasks} {openTasks === 1 ? 'task' : 'tasks'} open
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {getRelativeDayText(daysUntil)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  On This Day
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Revisiting past moments and personal memories from previous years
                </p>
              </div>
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {onThisDayMemories.length === 0 && onThisDayMoments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                  No past entries share today’s exact calendar date yet. As you record memories and moments over the years, they will resurface here on their anniversary.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {onThisDayMemories.map(({ memory, pastInfo }) => (
                  <div
                    key={memory.id}
                    onClick={() => onNavigate('memories', { memoriesTab: 'journal' })}
                    className="group cursor-pointer rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-4 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {memory.photoUrl && (
                        <img
                          src={memory.photoUrl}
                          alt={memory.title}
                          referrerPolicy="no-referrer"
                          className="w-full sm:w-28 h-28 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <span>
                            {pastInfo.yearsAgo} {pastInfo.yearsAgo === 1 ? 'Year' : 'Years'} Ago Today
                          </span>
                          {memory.location && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{memory.location}</span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {memory.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                          {memory.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {onThisDayMoments.map(({ moment, pastInfo }) => (
                  <div
                    key={moment.id}
                    onClick={() => onNavigate('moments', { momentId: moment.id })}
                    className="flex items-center justify-between gap-4 py-2 cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                        {pastInfo.yearsAgo} {pastInfo.yearsAgo === 1 ? 'Year' : 'Years'} Ago · {moment.type}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {moment.title}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Financial Snapshot
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recorded personal cash flow ({currency})
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setFinancePeriod('month')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    financePeriod === 'month'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setFinancePeriod('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    financePeriod === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {periodFinances.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No financial entries recorded for this period
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Log income and expenses manually to understand your net cash flow and occasion spending.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenQuickCreate('expense')}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                  >
                    + Log Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenQuickCreate('income')}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    + Add Income
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Income</p>
                    <p className="mt-1 text-base sm:text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(totalIncome, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Expenses</p>
                    <p className="mt-1 text-base sm:text-lg font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatCurrency(totalExpenses, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Net Flow</p>
                    <p
                      className={`mt-1 text-base sm:text-lg font-mono font-semibold tabular-nums ${
                        netCashFlow >= 0
                          ? 'text-slate-900 dark:text-white'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {netCashFlow >= 0 ? '+' : ''}
                      {formatCurrency(netCashFlow, currency)}
                    </p>
                  </div>
                </div>

                {topExpenseCategories.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/70 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Top Spending Categories
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('finances', { financesTab: 'overview' })}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Full Breakdown
                      </button>
                    </div>

                    <div className="space-y-2">
                      {topExpenseCategories.map(([cat, amt]) => {
                        const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-300 truncate">
                                {cat}
                              </span>
                              <span className="font-mono text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(amt, currency)} · {pct}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent Memories
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stories and photographs from your journal
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('memories', { memoriesTab: 'journal' })}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentMemories.length === 0 ? (
              <div className="py-6 text-center">
                <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preserve meaningful stories and photos in your private journal.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {recentMemories.map((mem) => (
                  <div
                    key={mem.id}
                    onClick={() => onNavigate('memories', { memoriesTab: 'journal' })}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5 cursor-pointer group"
                  >
                    {mem.photoUrl && (
                      <img
                        src={mem.photoUrl}
                        alt={mem.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/60 dark:border-slate-800"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(mem.date, dateFormat)}
                        {mem.location ? ` · ${mem.location}` : ''}
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {mem.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {mem.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Attachments
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Documents, receipts, photos, and saved links
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('memories', { memoriesTab: 'attachments' })}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors whitespace-nowrap shrink-0"
              >
                Library ({db.attachments.length})
              </button>
            </div>

            {recentAttachments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                No files or external links saved yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {recentAttachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => onNavigate('memories', { memoriesTab: 'attachments' })}
                    className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {att.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        {att.kind}
                        {att.description ? ` · ${att.description}` : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
