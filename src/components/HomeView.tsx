import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  EyeOff,
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

  const homeSections = db.settings.homeSections || {
    focus: true,
    events: true,
    activities: true,
    memories: true,
    onThisDay: true,
    finances: true,
  };
  const hideFinances = Boolean(db.settings.hideFinancesOnHome);
  const prominence = db.settings.homeProminence || 'balanced';

  const userName = db.profile.nickname || db.profile.displayName || 'Friend';
  const nowHour = new Date().getHours();
  const salutation =
    nowHour < 12 ? 'Good morning' : nowHour < 17 ? 'Good afternoon' : 'Good evening';

  const isEmptyWorkspace =
    db.moments.length === 0 &&
    db.activities.length === 0 &&
    db.memories.length === 0 &&
    db.finances.length === 0 &&
    db.attachments.length === 0;

  // Today's moments & activities
  const todaysMoments = db.moments
    .map((mom) => ({
      moment: mom,
      nextDate: getNextOccurrenceDate(mom, todayISO),
    }))
    .filter((x) => x.nextDate === todayISO);

  const todaysActivities = db.activities.filter((act) => act.date === todayISO);

  // Upcoming moments next 90 days
  const upcomingMoments = db.moments
    .map((mom) => {
      const nextDate = getNextOccurrenceDate(mom, todayISO);
      const daysUntil = getDaysUntil(nextDate, todayISO);
      return { moment: mom, nextDate, daysUntil };
    })
    .filter((x) => x.daysUntil > 0 && x.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

  // On this day in past years
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

  // Financial figures
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
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Header Greeting & Focus */}
      {homeSections.focus !== false && (
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {formatDate(todayISO, dateFormat)} · Private Life Space
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white font-editorial">
              {salutation}, {userName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {isEmptyWorkspace
                ? 'Your personal space is quiet and ready. Begin by adding an occasion, task, memory, or expense.'
                : `You have ${todaysMoments.length} ${
                    todaysMoments.length === 1 ? 'occasion' : 'occasions'
                  } and ${todaysActivities.filter((a) => !a.completed).length} open ${
                    todaysActivities.filter((a) => !a.completed).length === 1 ? 'activity' : 'activities'
                  } scheduled for today.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('activities')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#286747] dark:text-[#70A987]" />
              <span>Activities ({db.activities.filter((a) => !a.completed).length})</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('memories', { memoriesTab: 'greetings' })}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Greetings Studio</span>
            </button>
          </div>
        </section>
      )}

      {/* Quick Actions Row */}
      {homeSections.focus !== false && (
        <section aria-label="Quick Actions" className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => onOpenQuickCreate('moment')}
              className="px-3.5 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickCreate('activity')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>New Activity</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickCreate('memory')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Record Memory</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickCreate('expense')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Log Expense</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickCreate('attachment')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#286747] dark:text-[#70A987]" />
              <span>Add File</span>
            </button>
          </div>
        </section>
      )}

      {/* Empty State Banner */}
      {isEmptyWorkspace && (
        <section className="dn-card p-6 sm:p-7">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#286747] dark:text-[#70A987]">
              Quiet By Design · Personal Companion
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              Start fresh or explore with sample life records
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Your workspace starts private and clean. You can add your own important dates, personal reflections, tasks, and cash flow—or load realistic sample records to explore the modules.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onLoadDemoData}
                className="px-4 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] text-xs font-semibold text-white dark:text-[#101612] inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Sample Life Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('moment')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Create First Event
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Primary Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Events & Activities */}
          {homeSections.activities !== false && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Today’s Focus & Activities
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Occasions happening today and tasks scheduled for your attention
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuickCreate('activity')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shrink-0"
                >
                  + Add Task
                </button>
              </div>

              {todaysMoments.length === 0 && todaysActivities.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    A calm, unscheduled day ahead
                  </p>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    No occasions or pending activities are due today. Add a task or plan an upcoming moment whenever you are ready.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {todaysMoments.map(({ moment }) => (
                    <div
                      key={moment.id}
                      onClick={() => onNavigate('events', { momentId: moment.id })}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#286747] dark:text-[#70A987] font-medium">
                          <span>Today’s Occasion</span>
                          <span>·</span>
                          <span>{moment.type}</span>
                          {moment.time && <span className="font-mono">· {moment.time}</span>}
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors truncate">
                          {moment.title}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#286747] shrink-0" />
                    </div>
                  ))}

                  {todaysActivities.map((act) => (
                    <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleActivity(act.id)}
                        className="mt-0.5 text-slate-400 hover:text-[#286747] dark:hover:text-[#70A987] shrink-0"
                      >
                        {act.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-medium ${
                            act.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {act.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          <span
                            className={
                              act.priority === 'high'
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : act.priority === 'medium'
                                ? 'text-amber-600 dark:text-amber-400'
                                : ''
                            }
                          >
                            {act.priority.toUpperCase()}
                          </span>
                          <span>·</span>
                          <span>{formatDate(act.date, dateFormat)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Upcoming Events */}
          {homeSections.events !== false && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Upcoming Occasions & Countdowns
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Next 90 days of birthdays, anniversaries, and holidays
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('events')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 inline-flex items-center gap-1 transition-colors shrink-0"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {upcomingMoments.length === 0 ? (
                <div className="py-6 text-center">
                  <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    No upcoming occasions in the next 90 days
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {upcomingMoments.map(({ moment, nextDate, daysUntil }) => (
                    <div
                      key={moment.id}
                      onClick={() => onNavigate('events', { momentId: moment.id })}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors truncate">
                          {moment.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          <span>{moment.type}</span>
                          <span>·</span>
                          <span className="font-mono">{formatDate(nextDate, dateFormat)}</span>
                          {moment.recurrence !== 'none' && (
                            <span>· Repeats {moment.recurrence}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-semibold text-[#286747] dark:text-[#70A987]">
                          {getRelativeDayText(daysUntil)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* On This Day */}
          {homeSections.onThisDay !== false && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    On This Day
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Revisiting past moments and personal memories from previous years
                  </p>
                </div>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {onThisDayMemories.length === 0 && onThisDayMoments.length === 0 ? (
                <div className="py-5 text-center">
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No past entries share today’s exact calendar date. As you record memories and moments over time, they will resurface here on their anniversary.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {onThisDayMemories.map(({ memory, pastInfo }) => (
                    <div
                      key={memory.id}
                      onClick={() => onNavigate('memories', { memoriesTab: 'journal' })}
                      className="group cursor-pointer rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-3.5 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        {memory.photoUrl && (
                          <img
                            src={memory.photoUrl}
                            alt={memory.title}
                            className="w-full sm:w-24 h-24 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-[#286747] dark:text-[#70A987] font-medium">
                            {pastInfo.yearsAgo} {pastInfo.yearsAgo === 1 ? 'Year' : 'Years'} Ago Today
                          </div>
                          <h3 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747]">
                            {memory.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {memory.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Financial Snapshot & Recent Memories */}
        <div className="lg:col-span-5 space-y-5">
          {/* Financial Snapshot */}
          {homeSections.finances !== false && !hideFinances && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Financial Snapshot
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recorded personal cash flow ({currency})
                  </p>
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setFinancePeriod('month')}
                    className={`px-2 py-0.5 rounded-md font-medium ${
                      financePeriod === 'month'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancePeriod('all')}
                    className={`px-2 py-0.5 rounded-md font-medium ${
                      financePeriod === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500">Recorded Income</p>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                    {formatCurrency(totalIncome, currency)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500">Recorded Spending</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {formatCurrency(totalExpenses, currency)}
                  </p>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Net Recorded Balance</p>
                  <p
                    className={`text-base font-bold tabular-nums ${
                      netCashFlow >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(netCashFlow, currency)}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('finances')}
                  className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                >
                  Open Finances →
                </button>
              </div>
            </section>
          )}

          {/* Recent Memories Gallery */}
          {homeSections.memories !== false && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Recent Memories
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reflections and captured moments
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('memories')}
                  className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                >
                  View All →
                </button>
              </div>

              {recentMemories.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-400">No memories recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMemories.map((mem) => (
                    <div
                      key={mem.id}
                      onClick={() => onNavigate('memories')}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      {mem.photoUrl ? (
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="h-12 w-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center shrink-0">
                          <Heart className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {mem.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(mem.date, dateFormat)} {mem.location ? `· ${mem.location}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
