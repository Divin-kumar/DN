import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Heart,
  Plus,
  Sparkles,
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
    .slice(0, 5);

  // On this day in past years
  const onThisDayMemories = db.memories
    .map((mem) => ({
      memory: mem,
      pastInfo: isOnThisDayInPast(mem.date, todayISO),
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

  const recentMemories = [...db.memories]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Serene Greeting Header with 1 Primary Action */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <p className="text-xs font-mono text-slate-400">
            {formatDate(todayISO, dateFormat)} · Private Life Space
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white font-editorial">
            {salutation}, {userName}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            {isEmptyWorkspace
              ? 'Your private life companion is ready.'
              : `${todaysMoments.length} ${
                  todaysMoments.length === 1 ? 'occasion' : 'occasions'
                } and ${todaysActivities.filter((a) => !a.completed).length} open tasks today.`}
          </p>
        </div>

        {/* Exactly 1 Primary Action on Home */}
        <button
          type="button"
          onClick={() => onOpenQuickCreate('moment')}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </section>

      {/* Empty State Banner (Minimal, helpful) */}
      {isEmptyWorkspace && (
        <section className="dn-card p-6 sm:p-7 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Start fresh or explore with sample life records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              DN is designed to keep your private moments, checklists, stories, and finances organized in quiet harmony.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onLoadDemoData}
                className="px-4 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-xs font-semibold text-white dark:text-[#101612] inline-flex items-center gap-2 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('moment')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Create First Event
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Today's Focus & Upcoming */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Focus */}
          {homeSections.activities !== false && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                    Today’s Focus
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Occasions & tasks scheduled for today
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuickCreate('activity')}
                  className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                >
                  + Add Task
                </button>
              </div>

              {todaysMoments.length === 0 && todaysActivities.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No scheduled events or tasks for today
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    A peaceful, clear day.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {todaysMoments.map(({ moment }) => (
                    <div
                      key={moment.id}
                      onClick={() => onNavigate('events', { momentId: moment.id })}
                      className="py-2.5 flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-[#286747] dark:text-[#70A987]">
                          Today · {moment.type}
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] truncate">
                          {moment.title}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#286747] shrink-0" />
                    </div>
                  ))}

                  {todaysActivities.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleActivity(act.id)}
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                      >
                        {act.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#286747] dark:text-[#70A987] shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            act.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200 font-medium'
                          }`}
                        >
                          {act.title}
                        </span>
                      </button>

                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {act.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Upcoming Occasions */}
          {homeSections.events !== false && (
            <section className="dn-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                    Upcoming Occasions
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Next 90 days of milestones & celebrations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('events')}
                  className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                >
                  View All →
                </button>
              </div>

              {upcomingMoments.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400">
                  No upcoming occasions scheduled.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {upcomingMoments.map(({ moment, nextDate, daysUntil }) => (
                    <div
                      key={moment.id}
                      onClick={() => onNavigate('events', { momentId: moment.id })}
                      className="py-2.5 flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] truncate">
                          {moment.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {moment.type} · {formatDate(nextDate, dateFormat)}
                        </p>
                      </div>

                      <span className="text-xs font-mono font-semibold text-[#286747] dark:text-[#70A987] shrink-0">
                        {getRelativeDayText(daysUntil)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* On This Day Capsule (Only shown when entries exist) */}
          {onThisDayMemories.length > 0 && (
            <section className="dn-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#286747] dark:text-[#70A987]">
                <Clock className="w-3.5 h-3.5" />
                <span>On This Day In Past Years</span>
              </div>

              {onThisDayMemories.map(({ memory, pastInfo }) => (
                <div
                  key={memory.id}
                  onClick={() => onNavigate('memories', { memoriesTab: 'journal' })}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex gap-3 items-center"
                >
                  {memory.photoUrl && (
                    <img
                      src={memory.photoUrl}
                      alt={memory.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-400">
                      {pastInfo.yearsAgo} {pastInfo.yearsAgo === 1 ? 'Year' : 'Years'} Ago Today
                    </p>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {memory.title}
                    </h3>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Column: Financial Pulse & Recent Memories */}
        <div className="lg:col-span-5 space-y-5">
          {/* Financial Snapshot */}
          {homeSections.finances !== false && !hideFinances && (
            <section className="dn-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Monthly Ledger Pulse
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('finances')}
                  className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                >
                  Ledger →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[11px] text-slate-400">Recorded Income</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                    {formatCurrency(totalIncome, currency)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[11px] text-slate-400">Recorded Expenses</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {formatCurrency(totalExpenses, currency)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Recent Memories */}
          {homeSections.memories !== false && (
            <section className="dn-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent Memories
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('memories')}
                  className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                >
                  Journal →
                </button>
              </div>

              {recentMemories.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No memories recorded yet.</p>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {recentMemories.map((mem) => (
                    <div
                      key={mem.id}
                      onClick={() => onNavigate('memories')}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      {mem.photoUrl ? (
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                          <Heart className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {mem.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(mem.date, dateFormat)}
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
