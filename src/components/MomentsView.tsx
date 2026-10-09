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
  Gift,
  Heart,
  List,
  Plus,
  Search,
  Trash2,
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

  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'moment' | 'activity' | 'memory' | 'attachment';
    id: string;
    title: string;
  } | null>(null);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const todayISO = getTodayISO();
  const { currency, dateFormat } = db.settings;

  const selectedMoment = db.moments.find((m) => m.id === selectedMomentId) || null;

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
      <div className="space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectMoment(null)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Moments</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenGreetingsForMoment(selectedMoment)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>Greeting Card</span>
            </button>

            <button
              type="button"
              onClick={() => onDuplicateMoment(selectedMoment)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => onEditMoment(selectedMoment)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setConfirmDelete({
                  kind: 'moment',
                  id: selectedMoment.id,
                  title: selectedMoment.title,
                })
              }
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedMoment.type}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  Next: {formatDate(nextOccurrence, dateFormat)}
                  {selectedMoment.time ? ` at ${selectedMoment.time}` : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">
                  {selectedMoment.recurrence === 'none'
                    ? 'One-time occasion'
                    : `Repeats ${selectedMoment.recurrence}`}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {getRelativeDayText(daysUntil)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white text-balance">
                {selectedMoment.title}
              </h1>

              {selectedMoment.description && (
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedMoment.description}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <label className="text-xs text-slate-500 dark:text-slate-400">
                Moment Status
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(['upcoming', 'in-progress', 'completed', 'cancelled'] as MomentStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateMomentStatus(selectedMoment.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                        selectedMoment.status === st
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  {
                    id: 'activities',
                    label: `Activities (${completedCount}/${momentActivities.length})`,
                  },
                  { id: 'timeline', label: `Timeline (${combinedTimeline.length})` },
                  { id: 'memories', label: `Memories (${momentMemories.length})` },
                  { id: 'attachments', label: `Attachments (${momentAttachments.length})` },
                ] as { id: WorkspaceTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWorkspaceTab(tab.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    workspaceTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {workspaceTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Personal Notes & Planning Ideas
                  </h2>
                  {editingNotesId !== selectedMoment.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesId(selectedMoment.id);
                        setNotesDraft(selectedMoment.notes || '');
                      }}
                      className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      Edit Notes
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateMomentNotes(selectedMoment.id, notesDraft);
                          setEditingNotesId(null);
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {editingNotesId === selectedMoment.id ? (
                  <textarea
                    rows={4}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add gift ideas, guest preferences, menus, or reminders..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                ) : selectedMoment.notes ? (
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {selectedMoment.notes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    No personal notes added yet. Tap “Edit Notes” to jot down gift ideas or details.
                  </p>
                )}
              </section>

              <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Preparation & Activities
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {completedCount} of {momentActivities.length} completed ({progressPct}%)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenQuickCreate('activity', selectedMoment.id)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 whitespace-nowrap shrink-0"
                  >
                    + Add Activity
                  </button>
                </div>

                {momentActivities.length > 0 && (
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}

                {momentActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                    No tasks linked to this moment yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {momentActivities.slice(0, 4).map((act) => (
                      <div
                        key={act.id}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleActivity(act.id)}
                          className="flex items-center gap-3 text-left min-w-0 flex-1"
                        >
                          {act.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`text-sm font-medium truncate ${
                              act.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {act.title}
                          </span>
                        </button>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          {formatDate(act.date, dateFormat)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Associated Expenses
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total recorded spend for this occasion
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenQuickCreate('expense', selectedMoment.id)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    + Log Expense
                  </button>
                </div>

                <div className="py-2">
                  <p className="text-2xl font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(totalMomentSpend, currency)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Across {momentExpenses.length}{' '}
                    {momentExpenses.length === 1 ? 'recorded entry' : 'recorded entries'}
                  </p>
                </div>

                {momentExpenses.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 divide-y divide-slate-100 dark:divide-slate-800/70">
                    {momentExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() => onEditFinance(exp)}
                        className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {exp.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
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

              <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Preserved Memories & Files
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('memories')}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-rose-500 mb-1.5" />
                    <p className="text-lg font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {momentMemories.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Linked Memories</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('attachments')}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                    <p className="text-lg font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {momentAttachments.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Attachments</p>
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {workspaceTab === 'activities' && (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Moment Activities & Checklist
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedCount} of {momentActivities.length} completed ({progressPct}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('activity', selectedMoment.id)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Activity</span>
              </button>
            </div>

            {momentActivities.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No activities created for this moment yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Break down your preparation into simple tasks with target dates and priorities.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {momentActivities.map((act) => {
                  const linkedExp = db.finances.find((f) => f.id === act.expenseId);
                  const linkedAtt = db.attachments.find((a) => a.id === act.attachmentId);
                  return (
                    <div
                      key={act.id}
                      className="py-4 first:pt-1 last:pb-1 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleActivity(act.id)}
                          className="min-h-[44px] min-w-[44px] -ml-2 -mt-2 flex items-center justify-center text-slate-400 hover:text-indigo-600 shrink-0"
                        >
                          {act.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              act.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {act.title}
                          </p>
                          {act.description && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {act.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{formatDate(act.date, dateFormat)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{act.priority} priority</span>
                            {linkedExp && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-rose-600 dark:text-rose-400">
                                  Expense: {formatCurrency(linkedExp.amount, currency)}
                                </span>
                              </>
                            )}
                            {linkedAtt && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-indigo-600 dark:text-indigo-400">
                                  File: {linkedAtt.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditActivity(act)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          aria-label="Edit activity"
                        >
                          <Edit3 className="w-4 h-4" />
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
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600"
                          aria-label="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {workspaceTab === 'timeline' && (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Chronological Moment Timeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Complete history of updates, completed tasks, memories, attachments, and expenses for this moment
            </p>

            {combinedTimeline.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No timeline activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {combinedTimeline.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {item.kind}
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">{item.label}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      {formatDate(item.timestamp.slice(0, 10), dateFormat)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {workspaceTab === 'memories' && (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Memories From This Moment
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Written stories, captions, and photographs preserved for this occasion
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('memory', selectedMoment.id)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Memory</span>
              </button>
            </div>

            {momentMemories.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Heart className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No memories linked to this moment yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Capture a photo or write down a favorite story from this occasion.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {momentMemories.map((mem) => (
                  <article
                    key={mem.id}
                    className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {mem.photoUrl && (
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-5">
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {formatDate(mem.date, dateFormat)}
                          {mem.location ? ` · ${mem.location}` : ''}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                          {mem.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {mem.description}
                        </p>
                        {mem.caption && (
                          <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                            “{mem.caption}”
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="px-5 py-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onEditMemory(mem)}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            kind: 'memory',
                            id: mem.id,
                            title: mem.title,
                          })
                        }
                        className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {workspaceTab === 'attachments' && (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Moment Attachments & Links
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receipts, invitations, photos, and external reference links for this occasion
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('attachment', selectedMoment.id)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Attachment</span>
              </button>
            </div>

            {momentAttachments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No attachments linked to this moment
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Attach tickets, receipts, photos, or helpful web links so everything stays in one place.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {momentAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {(att.kind === 'photo' || att.kind === 'camera') && att.url ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {att.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          {att.kind}
                          {att.description ? ` · ${att.description}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {att.kind === 'link' ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          download={att.name}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditAttachment(att)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label="Edit attachment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            kind: 'attachment',
                            id: att.id,
                            title: att.name,
                          })
                        }
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600"
                        aria-label="Delete attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <ConfirmDialog
          open={!!confirmDelete}
          title={`Delete ${confirmDelete?.kind || 'item'}?`}
          description={`Are you sure you want to permanently delete "${confirmDelete?.title}"? Related records will remain safe and cleanly unlinked.`}
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Moments & Important Dates
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Organize birthdays, anniversaries, festivals, milestones, and dedicated preparation workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNewTypeInput(!showNewTypeInput)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            + Custom Type
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('moment')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Moment</span>
          </button>
        </div>
      </div>

      {showNewTypeInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTypeName.trim()) {
              onAddCustomMomentType(newTypeName.trim());
              setTypeFilter(newTypeName.trim());
              setNewTypeName('');
              setShowNewTypeInput(false);
            }
          }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center gap-3"
        >
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="Enter custom moment type (e.g., Cultural Event, Reunion, Health Milestone)..."
            className="flex-1 min-w-[220px] min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
            required
          />
          <button
            type="submit"
            className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
          >
            Add Type
          </button>
          <button
            type="button"
            onClick={() => setShowNewTypeInput(false)}
            className="min-h-[40px] px-3 py-2 text-xs text-slate-500"
          >
            Cancel
          </button>
        </form>
      )}

      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search moments by title, notes, or occasion type..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'upcoming' | 'recent' | 'title')}
              aria-label="Sort moments"
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="upcoming">Sort: Next Occurrence</option>
              <option value="recent">Sort: Recently Added</option>
              <option value="title">Sort: Title (A–Z)</option>
            </select>

            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  viewLayout === 'list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('timeline')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  viewLayout === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              typeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
            }`}
          >
            All Types ({db.moments.length})
          </button>
          {allMomentTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === t.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      {filteredMoments.length === 0 ? (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            No moments match your current view
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Add important birthdays, family functions, festivals, or personal milestones to build your timeline.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onOpenQuickCreate('moment')}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
            >
              + Create Moment
            </button>
          </div>
        </section>
      ) : viewLayout === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 transition-colors group"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {moment.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{moment.status.replace('-', ' ')}</span>
                      {moment.recurrence !== 'none' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">Repeats {moment.recurrence}</span>
                        </>
                      )}
                    </div>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                      {getRelativeDayText(daysUntil)}
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {moment.title}
                  </h2>

                  <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                    Next occurrence: {formatDate(nextDate, dateFormat)}
                    {moment.time ? ` · ${moment.time}` : ''}
                  </p>

                  {moment.description && (
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                      {moment.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      Tasks: {completedActivities}/{activitiesCount}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Memories: {memoriesCount}</span>
                    {totalSpend > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                          {formatCurrency(totalSpend, currency)}
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {moment.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateMomentStatus(moment.id, 'completed')}
                        className="px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium"
                        title="Mark Completed"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditMoment(moment)}
                      className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({
                          kind: 'moment',
                          id: moment.id,
                          title: moment.title,
                        })
                      }
                      className="px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredMoments.map(({ moment, nextDate, daysUntil, activitiesCount }) => (
              <div
                key={moment.id}
                onClick={() => onSelectMoment(moment.id)}
                className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatDate(nextDate, dateFormat)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{moment.type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{moment.status.replace('-', ' ')}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {moment.title}
                  </h3>
                  {moment.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {moment.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  <span>{activitiesCount} tasks</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {getRelativeDayText(daysUntil)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
