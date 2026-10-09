import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Flag,
  Link2,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Unlink,
  Wallet,
} from 'lucide-react';
import {
  ActivityPriority,
  ActivityRecord,
  DNDatabase,
  MomentRecord,
} from '../types/dn';
import { formatDate, getDaysUntil, getRelativeDayText, getTodayISO } from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';
import { QuickCreateMode } from './QuickCreateModal';

interface ActivitiesViewProps {
  db: DNDatabase;
  onOpenQuickCreate: (mode: QuickCreateMode, preselectedMomentId?: string) => void;
  onEditActivity: (activity: ActivityRecord) => void;
  onToggleActivity: (activityId: string) => void;
  onDeleteActivity: (activityId: string) => void;
  onNavigateToEvent?: (momentId: string) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  db,
  onOpenQuickCreate,
  onEditActivity,
  onToggleActivity,
  onDeleteActivity,
  onNavigateToEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'alphabetical'>(
    db.settings.activitySort || 'date'
  );
  const [activityToDelete, setActivityToDelete] = useState<ActivityRecord | null>(null);

  // Quick inline task creation state
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDate, setInlineDate] = useState(getTodayISO());
  const [inlinePriority, setInlinePriority] = useState<ActivityPriority>('medium');
  const [inlineMomentId, setInlineMomentId] = useState<string>('');
  const [showInlineForm, setShowInlineForm] = useState(false);

  const cardStyle = db.settings.activityCardStyle || 'detailed';

  // Filter activities
  const filteredActivities = db.activities.filter((act) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchDesc = (act.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Status filter
    if (statusFilter === 'pending' && act.completed) return false;
    if (statusFilter === 'completed' && !act.completed) return false;

    // Priority filter
    if (priorityFilter !== 'all' && act.priority !== priorityFilter) return false;

    // Event link filter
    if (selectedEventFilter === 'unlinked' && act.momentId) return false;
    if (selectedEventFilter === 'linked' && !act.momentId) return false;
    if (
      selectedEventFilter !== 'all' &&
      selectedEventFilter !== 'unlinked' &&
      selectedEventFilter !== 'linked' &&
      act.momentId !== selectedEventFilter
    ) {
      return false;
    }

    return true;
  });

  // Sort activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortBy === 'priority') {
      const pWeights: Record<ActivityPriority, number> = { high: 3, medium: 2, low: 1 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    }
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    // Date
    return (a.date || '').localeCompare(b.date || '');
  });

  const pendingCount = db.activities.filter((a) => !a.completed).length;
  const completedCount = db.activities.filter((a) => a.completed).length;

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    onOpenQuickCreate('activity', inlineMomentId || undefined);
    // If the modal opens, we can also let quick create handle it or trigger direct save.
    // For directness, reset inline form:
    setInlineTitle('');
    setShowInlineForm(false);
  };

  const getPriorityBadge = (priority: ActivityPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40">
            <Flag className="h-3 w-3" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/40">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="dn-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Activities & Daily Flow
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 tabular-nums">
                {pendingCount} pending
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Independent activities and checklists. Link to occasions optionally whenever helpful.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQuickCreate('activity')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Activity</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#286747]"
            />
          </div>

          {/* Status buttons */}
          <div className="sm:col-span-4 flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({db.activities.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          {/* Priority filter */}
          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Any Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Secondary filters: Event link & Sort */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Filter by Occasion:</span>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Occasions</option>
              <option value="unlinked">Unlinked (Independent only)</option>
              <option value="linked">Linked to any Occasion</option>
              {db.moments.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <button
              onClick={() => setSortBy('date')}
              className={`px-2 py-0.5 rounded-md ${sortBy === 'date' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium' : ''}`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('priority')}
              className={`px-2 py-0.5 rounded-md ${sortBy === 'priority' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium' : ''}`}
            >
              Priority
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`px-2 py-0.5 rounded-md ${sortBy === 'alphabetical' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium' : ''}`}
            >
              Name
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      {sortedActivities.length === 0 ? (
        <div className="dn-card p-10 text-center">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#286747] dark:text-[#70A987] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No matching activities'
              : 'No activities created yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms or filters.'
              : 'Add stand-alone activities, tasks, or preparation items anytime without needing an event.'}
          </p>
          <button
            onClick={() => onOpenQuickCreate('activity')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Activity
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedActivities.map((act) => {
            const linkedMoment = act.momentId
              ? db.moments.find((m) => m.id === act.momentId)
              : null;
            const daysUntil = act.date ? getDaysUntil(act.date) : null;

            return (
              <div
                key={act.id}
                className={`dn-card p-3.5 sm:p-4 transition-all hover:border-[#286747]/40 dark:hover:border-[#70A987]/40 ${
                  act.completed ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Completion Checkbox */}
                  <button
                    onClick={() => onToggleActivity(act.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-[#286747] dark:hover:text-[#70A987] transition-colors focus:outline-none"
                    title={act.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {act.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-emerald-600" />
                    )}
                  </button>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            act.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {act.title}
                        </span>
                        {getPriorityBadge(act.priority)}
                      </div>

                      {/* Due date tag */}
                      {act.date && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(act.date, db.settings.dateFormat)}</span>
                          {daysUntil !== null && !act.completed && (
                            <span
                              className={`text-[11px] font-medium px-1.5 py-0.2 rounded-md ${
                                daysUntil < 0
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                                  : daysUntil === 0
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60'
                                    : 'text-slate-400'
                              }`}
                            >
                              {getRelativeDayText(daysUntil)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Optional description (if detailed card mode or present) */}
                    {act.description && cardStyle === 'detailed' && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    {/* Metadata & Optional Relationships (Quiet, unobtrusive pills) */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      {/* Linked Event Pill */}
                      {linkedMoment ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#194A35] dark:text-[#84BD9A] border border-[#286747]/20">
                          <Link2 className="h-3 w-3" />
                          <span>Occasion:</span>
                          <button
                            onClick={() => onNavigateToEvent?.(linkedMoment.id)}
                            className="font-medium hover:underline"
                          >
                            {linkedMoment.title}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">
                          Independent task
                        </span>
                      )}

                      {/* Actions */}
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => onEditActivity(act)}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setActivityToDelete(act)}
                          className="text-xs text-rose-500 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(activityToDelete)}
        title="Delete Activity?"
        description={`Are you sure you want to delete "${activityToDelete?.title}"? Any linked occasion or financial record will not be affected.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (activityToDelete) {
            onDeleteActivity(activityToDelete.id);
            setActivityToDelete(null);
          }
        }}
        onCancel={() => setActivityToDelete(null)}
      />
    </div>
  );
};
