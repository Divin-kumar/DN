import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Gift,
  Heart,
  List,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ActivityRecord,
  AttachmentRecord,
  DNDatabase,
  FinanceRecord,
  MemoryRecord,
  MomentRecord,
  MomentStatus,
} from '../types/dn';
import {
  formatCurrency,
  formatDate,
  getDaysUntil,
  getNextOccurrenceDate,
  getRelativeDayText,
  getTodayISO,
} from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';
import { FilterSheet } from './FilterSheet';
import { QuickCreateMode } from './QuickCreateModal';

interface MomentsViewProps {
  db: DNDatabase;
  selectedMomentId: string | null;
  onSelectMoment: (momentId: string | null) => void;
  onOpenQuickCreate: (mode: QuickCreateMode, preselectedMomentId?: string) => void;
  onEditMoment: (moment: MomentRecord) => void;
  onDuplicateMoment: (moment: MomentRecord) => void;
  onUpdateMomentStatus: (momentId: string, status: MomentStatus) => void;
  onUpdateMomentNotes: (momentId: string, notes: string) => void;
  onDeleteMoment: (momentId: string) => void;
  onToggleActivity: (activityId: string) => void;
  onEditActivity: (activity: ActivityRecord) => void;
  onDeleteActivity: (activityId: string) => void;
  onEditMemory: (memory: MemoryRecord) => void;
  onDeleteMemory: (memoryId: string) => void;
  onEditFinance: (finance: FinanceRecord) => void;
  onEditAttachment: (attachment: AttachmentRecord) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onOpenGreetingsForMoment: (moment: MomentRecord) => void;
  onAddCustomMomentType: (typeName: string) => void;
}

type WorkspaceTab = 'overview' | 'activities' | 'timeline' | 'memories' | 'attachments';

export const MomentsView: React.FC<MomentsViewProps> = ({
  db,
  selectedMomentId,
  onSelectMoment,
  onOpenQuickCreate,
  onEditMoment,
  onDuplicateMoment,
  onUpdateMomentStatus,
  onUpdateMomentNotes,
  onDeleteMoment,
  onToggleActivity,
  onEditActivity,
  onDeleteActivity,
  onEditMemory,
  onDeleteMemory,
  onEditFinance,
  onEditAttachment,
  onDeleteAttachment,
  onOpenGreetingsForMoment,
  onAddCustomMomentType,
}) => {
  const [viewLayout, setViewLayout] = useState<'list' | 'timeline'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'upcoming' | 'recent' | 'title'>('upcoming');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');

  // Filter Sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddTypeInput, setShowAddTypeInput] = useState(false);

  // Detail workspace state
  const [showDetailMoreMenu, setShowDetailMoreMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'moment' | 'activity' | 'memory' | 'attachment';
    id: string;
    title: string;
  } | null>(null);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const todayISO = getTodayISO();
  const { currency, dateFormat } = db.settings;

  const activeFiltersCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'upcoming' ? 1 : 0);

  const handleResetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSortBy('upcoming');
    setSearchQuery('');
  };

  const selectedMoment = db.moments.find((m) => m.id === selectedMomentId) || null;

  // Selected Moment Workspace / Detail View
  if (selectedMoment) {
    const nextOccurrence = getNextOccurrenceDate(selectedMoment, todayISO);
    const daysUntil = getDaysUntil(nextOccurrence, todayISO);

    const momentActivities = db.activities
      .filter((a) => a.momentId === selectedMoment.id)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
    const completedCount = momentActivities.filter((a) => a.completed).length;
    const progressPct =
      momentActivities.length > 0
        ? Math.round((completedCount / momentActivities.length) * 100)
        : 0;

    const momentMemories = db.memories
      .filter((mem) => mem.momentId === selectedMoment.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const momentAttachments = db.attachments
      .filter((att) => att.momentId === selectedMoment.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const momentExpenses = db.finances
      .filter((f) => f.momentId === selectedMoment.id && f.type === 'expense')
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalMomentSpend = momentExpenses.reduce((sum, f) => sum + f.amount, 0);

    const combinedTimeline = [
      ...selectedMoment.history.map((h) => ({
        id: h.id,
        timestamp: h.timestamp,
        label: h.title,
        kind: 'Status & Updates',
      })),
      ...momentActivities.map((a) => ({
        id: `tl-act-${a.id}`,
        timestamp: a.completedAt || a.createdAt,
        label: `${a.completed ? 'Completed activity' : 'Added activity'}: ${a.title}`,
        kind: 'Activity',
      })),
      ...momentMemories.map((m) => ({
        id: `tl-mem-${m.id}`,
        timestamp: m.createdAt,
        label: `Recorded memory: ${m.title}`,
        kind: 'Memory',
      })),
      ...momentExpenses.map((f) => ({
        id: `tl-fin-${f.id}`,
        timestamp: f.createdAt,
        label: `Logged expense: ${f.title} (${formatCurrency(f.amount, currency)})`,
        kind: 'Finance',
      })),
      ...momentAttachments.map((att) => ({
        id: `tl-att-${att.id}`,
        timestamp: att.createdAt,
        label: `Attached ${att.kind}: ${att.name}`,
        kind: 'Attachment',
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        {/* Navigation & Actions Header */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectMoment(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Events</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditMoment(selectedMoment)}
              className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </button>

            {/* Contextual More Actions */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDetailMoreMenu(!showDetailMoreMenu)}
                className="h-8.5 w-8.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showDetailMoreMenu && (
                <div
                  className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-[#19211B] border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 animate-fade-in"
                  onClick={() => setShowDetailMoreMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => onOpenGreetingsForMoment(selectedMoment)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Greeting Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateMoment(selectedMoment)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete({
                        kind: 'moment',
                        id: selectedMoment.id,
                        title: selectedMoment.title,
                      })
                    }
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Header Banner */}
        <section className="dn-card p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-[#286747] dark:text-[#70A987] px-2 py-0.5 rounded-md bg-[#286747]/10 dark:bg-[#70A987]/15">
                  {selectedMoment.type}
                </span>
                <span>·</span>
                <span className="font-mono">
                  {formatDate(nextOccurrence, dateFormat)}
                  {selectedMoment.time ? ` at ${selectedMoment.time}` : ''}
                </span>
                <span>·</span>
                <span className="capitalize">
                  {selectedMoment.recurrence === 'none'
                    ? 'One-time event'
                    : `Repeats ${selectedMoment.recurrence}`}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {selectedMoment.title}
              </h1>

              {selectedMoment.description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                  {selectedMoment.description}
                </p>
              )}
            </div>

            {/* Countdown Badge & Status */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="px-3.5 py-1.5 rounded-xl bg-[#286747]/10 dark:bg-[#70A987]/15 border border-[#286747]/20 dark:border-[#70A987]/30 text-[#286747] dark:text-[#70A987] font-semibold text-xs tabular-nums">
                {getRelativeDayText(daysUntil)}
              </div>

              <select
                value={selectedMoment.status}
                onChange={(e) => onUpdateMomentStatus(selectedMoment.id, e.target.value as MomentStatus)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setWorkspaceTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                workspaceTab === 'overview'
                  ? 'bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('activities')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                workspaceTab === 'activities'
                  ? 'bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Activities ({momentActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('memories')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                workspaceTab === 'memories'
                  ? 'bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Memories ({momentMemories.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('attachments')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                workspaceTab === 'attachments'
                  ? 'bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Files ({momentAttachments.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('timeline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                workspaceTab === 'timeline'
                  ? 'bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Timeline ({combinedTimeline.length})
            </button>
          </div>
        </section>

        {/* Tab 1: Overview */}
        {workspaceTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 space-y-5">
              {/* Personal Notes */}
              <section className="dn-card p-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Personal Notes & Ideas
                  </h2>
                  {editingNotesId !== selectedMoment.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesId(selectedMoment.id);
                        setNotesDraft(selectedMoment.notes || '');
                      }}
                      className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                    >
                      {selectedMoment.notes ? 'Edit Notes' : '+ Add Notes'}
                    </button>
                  )}
                </div>

                {editingNotesId === selectedMoment.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={4}
                      placeholder="Jot down gift ideas, guest lists, reservation codes, or personal reminders..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#286747]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateMomentNotes(selectedMoment.id, notesDraft.trim());
                          setEditingNotesId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : selectedMoment.notes ? (
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedMoment.notes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No notes recorded yet.
                  </p>
                )}
              </section>

              {/* Linked Activities */}
              <section className="dn-card p-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Event Activities ({completedCount}/{momentActivities.length})
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Checklist items specifically linked to this occasion
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenQuickCreate('activity', selectedMoment.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:bg-[#286747]/10 transition-colors"
                  >
                    + Add Task
                  </button>
                </div>

                {momentActivities.length > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-[#286747] dark:bg-[#70A987] transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}

                {momentActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
                    No tasks linked to this event.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {momentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleActivity(act.id)}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                        >
                          {act.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#286747] dark:text-[#70A987] shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0" />
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
                          {formatDate(act.date, dateFormat)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Financials & Vault Summary */}
            <div className="lg:col-span-5 space-y-5">
              <section className="dn-card p-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Occasion Expenses
                  </h2>
                  <button
                    type="button"
                    onClick={() => onOpenQuickCreate('expense', selectedMoment.id)}
                    className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                  >
                    + Log Expense
                  </button>
                </div>

                <div className="py-1">
                  <p className="text-xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(totalMomentSpend, currency)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Across {momentExpenses.length} recorded {momentExpenses.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>

                {momentExpenses.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {momentExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() => onEditFinance(exp)}
                        className="py-2 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {exp.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {exp.category} · {formatDate(exp.date, dateFormat)}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 shrink-0 tabular-nums">
                          {formatCurrency(exp.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Linked Items Quick Links */}
              <section className="dn-card p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Preserved Memories & Files
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('memories')}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-rose-500 mb-1" />
                    <p className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {momentMemories.length}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Memories</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('attachments')}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#286747] dark:text-[#70A987] mb-1" />
                    <p className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {momentAttachments.length}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Files & Links</p>
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Tab 2: Activities */}
        {workspaceTab === 'activities' && (
          <section className="dn-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Event Checklist
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedCount} of {momentActivities.length} items completed
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('activity', selectedMoment.id)}
                className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {momentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No tasks assigned to this occasion yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {momentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleActivity(act.id)}
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      {act.completed ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-[#286747] dark:text-[#70A987] shrink-0" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-medium truncate ${
                            act.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {act.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono">{formatDate(act.date, dateFormat)}</span>
                          <span>·</span>
                          <span className="capitalize">{act.priority} priority</span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditActivity(act)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            kind: 'activity',
                            id: act.id,
                            title: act.title,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Memories */}
        {workspaceTab === 'memories' && (
          <section className="dn-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Preserved Memories
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stories and photos linked to this occasion
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('memory', selectedMoment.id)}
                className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory</span>
              </button>
            </div>

            {momentMemories.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No memories saved for this occasion yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {momentMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    {mem.photoUrl && (
                      <img
                        src={mem.photoUrl}
                        alt={mem.title}
                        className="w-full h-36 object-cover rounded-lg"
                      />
                    )}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {mem.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                      {mem.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatDate(mem.date, dateFormat)}</span>
                      <button
                        type="button"
                        onClick={() => onEditMemory(mem)}
                        className="text-[#286747] dark:text-[#70A987] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 4: Attachments */}
        {workspaceTab === 'attachments' && (
          <section className="dn-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Event Files & Links
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Documents, tickets, and photos stored for this occasion
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('attachment', selectedMoment.id)}
                className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add File</span>
              </button>
            </div>

            {momentAttachments.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No files linked to this event.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {momentAttachments.map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {att.name}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize">
                          {att.kind}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {att.kind === 'link' ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs text-[#286747] dark:text-[#70A987] hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          download={att.name}
                          className="px-2 py-1 text-xs text-[#286747] dark:text-[#70A987] hover:underline"
                        >
                          Save
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            kind: 'attachment',
                            id: att.id,
                            title: att.name,
                          })
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 5: Timeline */}
        {workspaceTab === 'timeline' && (
          <section className="dn-card p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Event History & Updates
            </h2>
            {combinedTimeline.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No timeline activity logged.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {combinedTimeline.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#286747] dark:text-[#70A987] mr-2">
                        {item.kind}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                    </div>
                    <span className="font-mono text-slate-400 shrink-0">
                      {formatDate(item.timestamp.slice(0, 10), dateFormat)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Deletion Dialog */}
        <ConfirmDialog
          open={!!confirmDelete}
          title={`Delete ${confirmDelete?.kind || 'item'}?`}
          description={`Are you sure you want to permanently delete "${confirmDelete?.title}"? Related independent records will remain safe.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (!confirmDelete) return;
            if (confirmDelete.kind === 'moment') {
              onDeleteMoment(confirmDelete.id);
              onSelectMoment(null);
            } else if (confirmDelete.kind === 'activity') {
              onDeleteActivity(confirmDelete.id);
            } else if (confirmDelete.kind === 'memory') {
              onDeleteMemory(confirmDelete.id);
            } else if (confirmDelete.kind === 'attachment') {
              onDeleteAttachment(confirmDelete.id);
            }
            setConfirmDelete(null);
          }}
        />
      </div>
    );
  }

  // ALL EVENTS LIST VIEW
  const allMomentTypes = db.settings.momentTypes.filter((t) => t.enabled);

  const enrichedMoments = db.moments.map((moment) => {
    const nextDate = getNextOccurrenceDate(moment, todayISO);
    const daysUntil = getDaysUntil(nextDate, todayISO);
    const activitiesCount = db.activities.filter((a) => a.momentId === moment.id).length;
    const completedActivities = db.activities.filter(
      (a) => a.momentId === moment.id && a.completed
    ).length;
    const memoriesCount = db.memories.filter((mem) => mem.momentId === moment.id).length;
    const totalSpend = db.finances
      .filter((f) => f.momentId === moment.id && f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      moment,
      nextDate,
      daysUntil,
      activitiesCount,
      completedActivities,
      memoriesCount,
      totalSpend,
    };
  });

  const filteredMoments = enrichedMoments
    .filter(({ moment }) => {
      if (typeFilter !== 'all' && moment.type !== typeFilter) return false;
      if (statusFilter !== 'all' && moment.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          moment.title.toLowerCase().includes(q) ||
          moment.description.toLowerCase().includes(q) ||
          moment.notes.toLowerCase().includes(q) ||
          moment.type.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.moment.title.localeCompare(b.moment.title);
      }
      if (sortBy === 'recent') {
        return b.moment.createdAt.localeCompare(a.moment.createdAt);
      }
      const aActive = a.moment.status === 'upcoming' || a.moment.status === 'in-progress' ? 0 : 1;
      const bActive = b.moment.status === 'upcoming' || b.moment.status === 'in-progress' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.daysUntil - b.daysUntil;
    });

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* 1. Page Header with Exactly 1 Primary Action */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Events & Occasions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {db.moments.length} saved occasions · Birthdays, anniversaries & milestones
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickCreate('moment')}
          className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* 2. Unobtrusive Filter & Search Row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
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

        {/* Filter Trigger Button with Count Badge */}
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

        {/* List / Timeline View Switch */}
        <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] shrink-0">
          <button
            type="button"
            onClick={() => setViewLayout('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewLayout === 'list'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('timeline')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewLayout === 'timeline'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Timeline view"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Filters Summary Strip (Shown only when filtered) */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Showing:</span>
            {typeFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                Type: {typeFilter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium capitalize">
                Status: {statusFilter}
              </span>
            )}
            {sortBy !== 'upcoming' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                Sorted: {sortBy === 'recent' ? 'Recently Added' : 'Title'}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                &ldquo;{searchQuery}&rdquo;
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
        title="Filter & Sort Events"
      >
        <div className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['all', 'upcoming', 'in-progress', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize text-center transition-colors ${
                    statusFilter === st
                      ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {st === 'all' ? 'All' : st.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Type / Occasion Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Occasion Type
              </label>
              <button
                type="button"
                onClick={() => setShowAddTypeInput(!showAddTypeInput)}
                className="text-[11px] text-[#286747] dark:text-[#70A987] font-semibold hover:underline"
              >
                + Custom Type
              </button>
            </div>

            {showAddTypeInput && (
              <div className="mb-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="New type name..."
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTypeName.trim()) {
                      onAddCustomMomentType(newTypeName.trim());
                      setTypeFilter(newTypeName.trim());
                      setNewTypeName('');
                      setShowAddTypeInput(false);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-0.5">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                All Types
              </button>
              {allMomentTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.name)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === t.name
                      ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sort Order
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'upcoming', label: 'Next Due' },
                { id: 'recent', label: 'Recently Added' },
                { id: 'title', label: 'Title (A–Z)' },
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

      {/* 3. Empty State */}
      {filteredMoments.length === 0 ? (
        <div className="dn-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery || activeFiltersCount > 0 ? 'No matching events found' : 'No events yet'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || activeFiltersCount > 0
              ? 'Try adjusting your search query or reset your filters.'
              : 'Add your first birthday, anniversary, or milestone to build your calm life timeline.'}
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
                onClick={() => onOpenQuickCreate('moment')}
                className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold shadow-xs"
              >
                + Create Event
              </button>
            )}
          </div>
        </div>
      ) : viewLayout === 'list' ? (
        /* List Mode: Clean, compact cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredMoments.map(
            ({
              moment,
              nextDate,
              daysUntil,
              activitiesCount,
              completedActivities,
              memoriesCount,
              totalSpend,
            }) => (
              <article
                key={moment.id}
                onClick={() => onSelectMoment(moment.id)}
                className="dn-card p-4.5 cursor-pointer hover:border-[#286747]/60 dark:hover:border-[#70A987]/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#286747] dark:text-[#70A987] px-2 py-0.5 rounded-md bg-[#286747]/10 dark:bg-[#70A987]/15">
                      {moment.type}
                    </span>

                    <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {getRelativeDayText(daysUntil)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors truncate">
                    {moment.title}
                  </h3>

                  <p className="mt-0.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                    {formatDate(nextDate, dateFormat)}
                    {moment.time ? ` · ${moment.time}` : ''}
                  </p>

                  {moment.description && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {moment.description}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    {activitiesCount > 0 && (
                      <span>
                        Tasks: {completedActivities}/{activitiesCount}
                      </span>
                    )}
                    {memoriesCount > 0 && <span>· {memoriesCount} memories</span>}
                    {totalSpend > 0 && (
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        · {formatCurrency(totalSpend, currency)}
                      </span>
                    )}
                  </div>

                  <span className="font-medium text-[#286747] dark:text-[#70A987] group-hover:translate-x-0.5 transition-transform">
                    Open →
                  </span>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        /* Timeline Mode */
        <div className="dn-card p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/70">
          {filteredMoments.map(({ moment, nextDate, daysUntil, activitiesCount }) => (
            <div
              key={moment.id}
              onClick={() => onSelectMoment(moment.id)}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-mono text-[#286747] dark:text-[#70A987] font-semibold">
                    {formatDate(nextDate, dateFormat)}
                  </span>
                  <span>·</span>
                  <span>{moment.type}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] truncate">
                  {moment.title}
                </h3>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {getRelativeDayText(daysUntil)}
                </p>
                {activitiesCount > 0 && (
                  <p className="text-[11px] text-slate-400 font-mono">{activitiesCount} tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deletion Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Moment?"
        description={`Are you sure you want to delete "${confirmDelete?.title}"? Associated memories, attachments, and expenses will be preserved and unlinked.`}
        confirmLabel="Delete Moment"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            onDeleteMoment(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
};
