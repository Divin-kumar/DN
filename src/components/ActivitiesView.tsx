import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Flag,
  Link2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  ActivityPriority,
  ActivityRecord,
  DNDatabase,
} from '../types/dn';
import { formatDate, getDaysUntil, getRelativeDayText, getTodayISO } from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';
import { FilterSheet } from './FilterSheet';
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityRecord | null>(null);

  const cardStyle = db.settings.activityCardStyle || 'detailed';

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (selectedEventFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'date' ? 1 : 0);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSelectedEventFilter('all');
    setSortBy('date');
    setSearchQuery('');
  };

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

  const getPriorityBadge = (priority: ActivityPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40">
            <Flag className="h-2.5 w-2.5" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded-md">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* 1. Page Header with Exactly 1 Primary Action */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Activities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {pendingCount} open tasks · Independent daily flow & checklist
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickCreate('activity')}
          className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Activity</span>
        </button>
      </div>

      {/* 2. Unobtrusive Search & Filter Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#286747]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
            activeFiltersCount > 0
              ? 'border-[#286747] dark:border-[#70A987] bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filters Summary Strip */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Showing:</span>
            {statusFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium capitalize">
                {statusFilter}
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium capitalize">
                {priorityFilter} priority
              </span>
            )}
            {selectedEventFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {selectedEventFilter === 'unlinked'
                  ? 'Independent only'
                  : selectedEventFilter === 'linked'
                    ? 'Linked to event'
                    : 'Specific event'}
              </span>
            )}
            {sortBy !== 'date' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                Sorted: {sortBy}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-semibold text-[#286747] dark:text-[#70A987] hover:underline shrink-0 ml-2"
          >
            Reset
          </button>
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        activeCount={activeFiltersCount}
        onClose={() => setFilterSheetOpen(false)}
        onReset={handleResetFilters}
        title="Filter & Sort Activities"
      >
        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Completion Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: `All (${db.activities.length})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'completed', label: `Done (${db.activities.length - pendingCount})` },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                    statusFilter === st.id
                      ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['all', 'high', 'medium', 'low'].map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setPriorityFilter(pr)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize text-center transition-colors ${
                    priorityFilter === pr
                      ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion Association */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Occasion Association
            </label>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Activities (Any or None)</option>
              <option value="unlinked">Independent Only (Not linked to any event)</option>
              <option value="linked">Linked to Any Occasion</option>
              {db.moments.map((m) => (
                <option key={m.id} value={m.id}>
                  Linked to: {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sort Order
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'date', label: 'Due Date' },
                { id: 'priority', label: 'Priority' },
                { id: 'alphabetical', label: 'Title (A–Z)' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortBy(s.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                    sortBy === s.id
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

      {/* 3. Activities List */}
      {sortedActivities.length === 0 ? (
        <div className="dn-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery || activeFiltersCount > 0
              ? 'No matching activities'
              : 'All caught up! No tasks left'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || activeFiltersCount > 0
              ? 'Try modifying your search or clearing active filters.'
              : 'Add personal tasks or preparation items anytime without needing an event.'}
          </p>
          <div className="mt-4">
            {searchQuery || activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenQuickCreate('activity')}
                className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold shadow-xs"
              >
                + Add Activity
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedActivities.map((act) => {
            const linkedMoment = act.momentId
              ? db.moments.find((m) => m.id === act.momentId)
              : null;
            const daysUntil = act.date ? getDaysUntil(act.date) : null;

            return (
              <div
                key={act.id}
                className={`dn-card p-3.5 sm:p-4 transition-all hover:border-[#286747]/40 dark:hover:border-[#70A987]/40 ${
                  act.completed ? 'opacity-65 bg-slate-50/50 dark:bg-slate-900/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Completion Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleActivity(act.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-[#286747] dark:hover:text-[#70A987] transition-colors focus:outline-none"
                    title={act.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {act.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-[#286747] dark:text-[#70A987]" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-[#286747]" />
                    )}
                  </button>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-xs sm:text-sm font-semibold truncate ${
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
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(act.date, db.settings.dateFormat)}</span>
                          {daysUntil !== null && !act.completed && (
                            <span
                              className={`font-medium px-1.5 py-0.2 rounded-md ${
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

                    {/* Description */}
                    {act.description && cardStyle === 'detailed' && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    {/* Metadata & Optional Relationships */}
                    <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                      {linkedMoment ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#194A35] dark:text-[#84BD9A] border border-[#286747]/20">
                          <Link2 className="h-2.5 w-2.5" />
                          <span>Event:</span>
                          <button
                            type="button"
                            onClick={() => onNavigateToEvent?.(linkedMoment.id)}
                            className="font-medium hover:underline truncate max-w-[150px]"
                          >
                            {linkedMoment.title}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">
                          Independent activity
                        </span>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditActivity(act)}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
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
