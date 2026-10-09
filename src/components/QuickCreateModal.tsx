import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Camera,
  CheckSquare,
  FileText,
  Heart,
  Image as ImageIcon,
  Link2,
  Sparkles,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import {
  ActivityPriority,
  ActivityRecord,
  AttachmentKind,
  AttachmentRecord,
  DNDatabase,
  FinanceRecord,
  MemoryRecord,
  MomentRecord,
  MomentStatus,
  RecurrenceType,
} from '../types/dn';
import { getTodayISO } from '../utils/dnHelpers';

export type QuickCreateMode = 'moment' | 'activity' | 'memory' | 'expense' | 'income' | 'attachment';

interface QuickCreateModalProps {
  open: boolean;
  initialMode: QuickCreateMode;
  preselectedMomentId?: string;
  editingMoment?: MomentRecord | null;
  editingActivity?: ActivityRecord | null;
  editingMemory?: MemoryRecord | null;
  editingFinance?: FinanceRecord | null;
  editingAttachment?: AttachmentRecord | null;
  db: DNDatabase;
  onClose: () => void;
  onSaveMoment: (moment: Omit<MomentRecord, 'id' | 'createdAt' | 'updatedAt' | 'history'>, existingId?: string) => void;
  onSaveActivity: (activity: Omit<ActivityRecord, 'id' | 'createdAt'>, existingId?: string) => void;
  onSaveMemory: (memory: Omit<MemoryRecord, 'id' | 'createdAt'>, existingId?: string) => void;
  onSaveFinance: (finance: Omit<FinanceRecord, 'id' | 'createdAt'>, existingId?: string) => void;
  onSaveAttachment: (attachment: Omit<AttachmentRecord, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  open,
  initialMode,
  preselectedMomentId,
  editingMoment,
  editingActivity,
  editingMemory,
  editingFinance,
  editingAttachment,
  db,
  onClose,
  onSaveMoment,
  onSaveActivity,
  onSaveMemory,
  onSaveFinance,
  onSaveAttachment,
}) => {
  const [mode, setMode] = useState<QuickCreateMode>(initialMode);
  const [error, setError] = useState<string | null>(null);

  const enabledMomentTypes = db.settings.momentTypes.filter((t) => t.enabled || t.name === editingMoment?.type);
  const [mTitle, setMTitle] = useState('');
  const [mType, setMType] = useState(db.settings.defaultMomentType || 'Birthday');
  const [mDate, setMDate] = useState(getTodayISO());
  const [mTime, setMTime] = useState('');
  const [mRecurrence, setMRecurrence] = useState<RecurrenceType>('none');
  const [mStatus, setMStatus] = useState<MomentStatus>('upcoming');
  const [mDescription, setMDescription] = useState('');
  const [mNotes, setMNotes] = useState('');

  const [aTitle, setATitle] = useState('');
  const [aDate, setADate] = useState(getTodayISO());
  const [aPriority, setAPriority] = useState<ActivityPriority>('medium');
  const [aDescription, setADescription] = useState('');
  const [aMomentId, setAMomentId] = useState(preselectedMomentId || '');
  const [aCompleted, setACompleted] = useState(false);
  const [aExpenseId, setAExpenseId] = useState('');
  const [aAttachmentId, setAAttachmentId] = useState('');

  const [memTitle, setMemTitle] = useState('');
  const [memDesc, setMemDesc] = useState('');
  const [memCaption, setMemCaption] = useState('');
  const [memDate, setMemDate] = useState(getTodayISO());
  const [memLocation, setMemLocation] = useState('');
  const [memPhotoUrl, setMemPhotoUrl] = useState('');
  const [memMomentId, setMemMomentId] = useState(preselectedMomentId || '');
  const [memActivityId, setMemActivityId] = useState('');

  const enabledExpenseCats = db.settings.expenseCategories.filter((c) => c.enabled || c.name === editingFinance?.category);
  const enabledIncomeTypes = db.settings.incomeTypes.filter((c) => c.enabled || c.name === editingFinance?.category);
  const [fAmount, setFAmount] = useState('');
  const [fDate, setFDate] = useState(getTodayISO());
  const [fTitle, setFTitle] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fMomentId, setFMomentId] = useState(preselectedMomentId || '');
  const [fActivityId, setFActivityId] = useState('');

  const [attName, setAttName] = useState('');
  const [attKind, setAttKind] = useState<AttachmentKind>('photo');
  const [attMime, setAttMime] = useState('image/jpeg');
  const [attSize, setAttSize] = useState<number | undefined>(undefined);
  const [attUrl, setAttUrl] = useState('');
  const [attDesc, setAttDesc] = useState('');
  const [attMomentId, setAttMomentId] = useState(preselectedMomentId || '');
  const [attActivityId, setAttActivityId] = useState('');

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setError(null);
    setCameraError(null);

    if (editingMoment) {
      setMode('moment');
      setMTitle(editingMoment.title);
      setMType(editingMoment.type);
      setMDate(editingMoment.date);
      setMTime(editingMoment.time || '');
      setMRecurrence(editingMoment.recurrence);
      setMStatus(editingMoment.status);
      setMDescription(editingMoment.description);
      setMNotes(editingMoment.notes);
    } else if (editingActivity) {
      setMode('activity');
      setATitle(editingActivity.title);
      setADate(editingActivity.date);
      setAPriority(editingActivity.priority);
      setADescription(editingActivity.description);
      setAMomentId(editingActivity.momentId || '');
      setACompleted(editingActivity.completed);
      setAExpenseId(editingActivity.expenseId || '');
      setAAttachmentId(editingActivity.attachmentId || '');
    } else if (editingMemory) {
      setMode('memory');
      setMemTitle(editingMemory.title);
      setMemDesc(editingMemory.description);
      setMemCaption(editingMemory.caption || '');
      setMemDate(editingMemory.date);
      setMemLocation(editingMemory.location || '');
      setMemPhotoUrl(editingMemory.photoUrl || '');
      setMemMomentId(editingMemory.momentId || '');
      setMemActivityId(editingMemory.activityId || '');
    } else if (editingFinance) {
      setMode(editingFinance.type);
      setFAmount(String(editingFinance.amount));
      setFDate(editingFinance.date);
      setFTitle(editingFinance.title);
      setFCategory(editingFinance.category);
      setFNotes(editingFinance.notes || '');
      setFMomentId(editingFinance.momentId || '');
      setFActivityId(editingFinance.activityId || '');
    } else if (editingAttachment) {
      setMode('attachment');
      setAttName(editingAttachment.name);
      setAttKind(editingAttachment.kind);
      setAttMime(editingAttachment.mimeType);
      setAttSize(editingAttachment.sizeBytes);
      setAttUrl(editingAttachment.url);
      setAttDesc(editingAttachment.description || '');
      setAttMomentId(editingAttachment.momentId || '');
      setAttActivityId(editingAttachment.activityId || '');
    } else {
      setMode(initialMode);
      setMTitle('');
      setMType(db.settings.defaultMomentType || 'Birthday');
      setMDate(getTodayISO());
      setMTime('');
      setMRecurrence('none');
      setMStatus('upcoming');
      setMDescription('');
      setMNotes('');

      setATitle('');
      setADate(getTodayISO());
      setAPriority('medium');
      setADescription('');
      setAMomentId(preselectedMomentId || '');
      setACompleted(false);
      setAExpenseId('');
      setAAttachmentId('');

      setMemTitle('');
      setMemDesc('');
      setMemCaption('');
      setMemDate(getTodayISO());
      setMemLocation('');
      setMemPhotoUrl('');
      setMemMomentId(preselectedMomentId || '');
      setMemActivityId('');

      setFAmount('');
      setFDate(getTodayISO());
      setFTitle('');
      setFCategory(
        initialMode === 'income'
          ? enabledIncomeTypes[0]?.name || 'Salary'
          : enabledExpenseCats[0]?.name || 'Food & Dining'
      );
      setFNotes('');
      setFMomentId(preselectedMomentId || '');
      setFActivityId('');

      setAttName('');
      setAttKind('photo');
      setAttMime('image/jpeg');
      setAttSize(undefined);
      setAttUrl('');
      setAttDesc('');
      setAttMomentId(preselectedMomentId || '');
      setAttActivityId('');
    }
  }, [
    open,
    initialMode,
    preselectedMomentId,
    editingMoment,
    editingActivity,
    editingMemory,
    editingFinance,
    editingAttachment,
  ]);

  useEffect(() => {
    if (!editingFinance) {
      if (mode === 'income') {
        setFCategory(enabledIncomeTypes[0]?.name || 'Salary');
      } else if (mode === 'expense') {
        setFCategory(enabledExpenseCats[0]?.name || 'Food & Dining');
      }
    }
  }, [mode]);

  if (!open) return null;

  const isEditing = !!(
    editingMoment ||
    editingActivity ||
    editingMemory ||
    editingFinance ||
    editingAttachment
  );

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'memory' | 'attachment'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError('File size exceeds 4 MB. Please select a smaller photo or document.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (target === 'memory') {
        setMemPhotoUrl(result);
      } else {
        setAttUrl(result);
        if (!attName.trim()) {
          setAttName(file.name);
        }
        setAttMime(file.type || 'application/octet-stream');
        setAttSize(file.size);
        if (file.type.startsWith('image/')) {
          setAttKind('photo');
        } else {
          setAttKind('document');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera capture is not supported in this browser. Please upload a photo instead.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setCameraError('Camera access declined or unavailable.');
    }
  };

  const capturePhotoFromVideo = (target: 'memory' | 'attachment') => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      if (target === 'memory') {
        setMemPhotoUrl(dataUrl);
      } else {
        setAttUrl(dataUrl);
        if (!attName.trim()) {
          setAttName(`Camera_Capture_${getTodayISO()}.jpg`);
        }
        setAttKind('camera');
        setAttMime('image/jpeg');
        setAttSize(Math.round(dataUrl.length * 0.75));
      }
    }
    stopCamera();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'moment') {
      if (!mTitle.trim()) {
        setError('Please enter a title for this moment.');
        return;
      }
      if (!mDate) {
        setError('Please select a date for this moment.');
        return;
      }
      onSaveMoment(
        {
          title: mTitle.trim(),
          type: mType,
          date: mDate,
          time: mTime || undefined,
          recurrence: mRecurrence,
          status: mStatus,
          description: mDescription.trim(),
          notes: mNotes.trim(),
        },
        editingMoment?.id
      );
      onClose();
      return;
    }

    if (mode === 'activity') {
      if (!aTitle.trim()) {
        setError('Please enter an activity title.');
        return;
      }
      onSaveActivity(
        {
          title: aTitle.trim(),
          date: aDate || getTodayISO(),
          priority: aPriority,
          description: aDescription.trim(),
          momentId: aMomentId || undefined,
          completed: aCompleted,
          completedAt: aCompleted ? editingActivity?.completedAt || new Date().toISOString() : undefined,
          expenseId: aExpenseId || undefined,
          attachmentId: aAttachmentId || undefined,
        },
        editingActivity?.id
      );
      onClose();
      return;
    }

    if (mode === 'memory') {
      if (!memTitle.trim()) {
        setError('Please give your memory a title.');
        return;
      }
      if (!memDesc.trim() && !memPhotoUrl) {
        setError('Please write a personal recollection or attach a photo.');
        return;
      }
      onSaveMemory(
        {
          title: memTitle.trim(),
          description: memDesc.trim(),
          caption: memCaption.trim() || undefined,
          date: memDate || getTodayISO(),
          location: memLocation.trim() || undefined,
          photoUrl: memPhotoUrl || undefined,
          momentId: memMomentId || undefined,
          activityId: memActivityId || undefined,
        },
        editingMemory?.id
      );
      onClose();
      return;
    }

    if (mode === 'expense' || mode === 'income') {
      const parsedAmount = Number(fAmount);
      if (!fAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid positive amount.');
        return;
      }
      if (!fTitle.trim()) {
        setError(mode === 'income' ? 'Please enter the income source.' : 'Please enter an expense description.');
        return;
      }
      onSaveFinance(
        {
          type: mode,
          amount: parsedAmount,
          date: fDate || getTodayISO(),
          title: fTitle.trim(),
          category: fCategory || (mode === 'income' ? 'Salary' : 'Other'),
          notes: fNotes.trim() || undefined,
          momentId: fMomentId || undefined,
          activityId: mode === 'expense' ? fActivityId || undefined : undefined,
        },
        editingFinance?.id
      );
      onClose();
      return;
    }

    if (mode === 'attachment') {
      if (!attName.trim()) {
        setError('Please provide a name for this attachment.');
        return;
      }
      if (!attUrl.trim()) {
        setError(
          attKind === 'link'
            ? 'Please enter a valid external URL (https://...).'
            : 'Please select a file or capture a photo to attach.'
        );
        return;
      }
      if (attKind === 'link' && !/^https?:\/\//i.test(attUrl.trim())) {
        setError('External links must start with http:// or https://');
        return;
      }
      onSaveAttachment(
        {
          name: attName.trim(),
          kind: attKind,
          mimeType: attKind === 'link' ? 'text/uri-list' : attMime,
          sizeBytes: attSize,
          url: attUrl.trim(),
          description: attDesc.trim() || undefined,
          momentId: attMomentId || undefined,
          activityId: attActivityId || undefined,
        },
        editingAttachment?.id
      );
      onClose();
    }
  };

  const modeTabs: { id: QuickCreateMode; label: string; icon: React.ReactNode }[] = [
    { id: 'moment', label: 'Moment', icon: <Calendar className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'memory', label: 'Memory', icon: <Heart className="w-4 h-4" /> },
    { id: 'expense', label: 'Expense', icon: <Wallet className="w-4 h-4" /> },
    { id: 'income', label: 'Income', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'attachment', label: 'Attachment', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? `Edit ${mode.charAt(0).toUpperCase() + mode.slice(1)}` : 'Add to Your Space'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stored privately on your device with instant offline access.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditing && (
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {modeTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    setError(null);
                  }}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    mode === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {mode === 'moment' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Moment Title *
                </label>
                <input
                  type="text"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g., Amma's Birthday, Coorg Family Trip, Diwali Gathering"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Moment Type
                  </label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {enabledMomentTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as MomentStatus)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Optional Time
                  </label>
                  <input
                    type="time"
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Recurrence
                  </label>
                  <select
                    value={mRecurrence}
                    onChange={(e) => setMRecurrence(e.target.value as RecurrenceType)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="What makes this occasion meaningful?"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Personal Notes & Ideas
                </label>
                <textarea
                  rows={2}
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  placeholder="Gift ideas, preferences, guest notes, or reminders..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {mode === 'activity' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Activity or Task Title *
                </label>
                <input
                  type="text"
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  placeholder="e.g., Order pistachio cake, Book window table, Pack camera"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={aDate}
                    onChange={(e) => setADate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={aPriority}
                    onChange={(e) => setAPriority(e.target.value as ActivityPriority)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Link to Moment (Optional)
                </label>
                <select
                  value={aMomentId}
                  onChange={(e) => setAMomentId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Independent daily activity (No linked moment)</option>
                  {db.moments.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Details
                </label>
                <textarea
                  rows={2}
                  value={aDescription}
                  onChange={(e) => setADescription(e.target.value)}
                  placeholder="Helpful steps, address, or phone number..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aCompleted}
                  onChange={(e) => setACompleted(e.target.checked)}
                  className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Mark as already completed
                </span>
              </label>
            </>
          )}

          {mode === 'memory' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Memory Title *
                </label>
                <input
                  type="text"
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="e.g., Sunrise Walk Through Pollibetta Coffee Slopes"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date of Memory
                  </label>
                  <input
                    type="date"
                    value={memDate}
                    onChange={(e) => setMemDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={memLocation}
                    onChange={(e) => setMemLocation(e.target.value)}
                    placeholder="e.g., Pollibetta, Coorg · Indiranagar Home"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Personal Story & Recollection *
                </label>
                <textarea
                  rows={4}
                  value={memDesc}
                  onChange={(e) => setMemDesc(e.target.value)}
                  placeholder="Write what happened, how it felt, and what you want to remember years from now..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Photograph (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer inline-flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'memory')}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{cameraActive ? 'Close Camera' : 'Take Photo'}</span>
                  </button>

                  {memPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setMemPhotoUrl('')}
                      className="min-h-[44px] px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {cameraError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{cameraError}</p>
                )}

                {cameraActive && (
                  <div className="rounded-xl overflow-hidden bg-slate-950 p-3 space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => capturePhotoFromVideo('memory')}
                      className="w-full min-h-[44px] rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                    >
                      Capture Frame
                    </button>
                  </div>
                )}

                {memPhotoUrl && (
                  <div className="mt-2 space-y-2">
                    <img
                      src={memPhotoUrl}
                      alt="Memory preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={memCaption}
                      onChange={(e) => setMemCaption(e.target.value)}
                      placeholder="Add a short photo caption..."
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Related Moment (Optional)
                </label>
                <select
                  value={memMomentId}
                  onChange={(e) => setMemMomentId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Standalone personal memory</option>
                  {db.moments.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.type})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(mode === 'expense' || mode === 'income') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Amount ({db.settings.currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={fAmount}
                    onChange={(e) => setFAmount(e.target.value)}
                    placeholder="e.g., 3450"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-base font-mono font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {mode === 'income' ? 'Income Source / Description *' : 'Expense Description *'}
                  </label>
                  <input
                    type="text"
                    value={fTitle}
                    onChange={(e) => setFTitle(e.target.value)}
                    placeholder={
                      mode === 'income'
                        ? 'e.g., Monthly Salary, Design Advisory'
                        : 'e.g., Kanjeevaram Saree, Organic Groceries'
                    }
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {mode === 'income' ? 'Income Type' : 'Expense Category'}
                  </label>
                  <select
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {(mode === 'income' ? enabledIncomeTypes : enabledExpenseCats).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Associated Moment (Optional)
                  </label>
                  <select
                    value={fMomentId}
                    onChange={(e) => setFMomentId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">None</option>
                    {db.moments.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === 'expense' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Associated Activity (Optional)
                    </label>
                    <select
                      value={fActivityId}
                      onChange={(e) => setFActivityId(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">None</option>
                      {db.activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Payment method, warranty note, or context..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {mode === 'attachment' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Attachment Source Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttKind('photo')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      attKind === 'photo' || attKind === 'document'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>File / Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttKind('camera');
                      startCamera();
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      attKind === 'camera'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setAttKind('link');
                      setAttMime('text/uri-list');
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      attKind === 'link'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    <span>External Link</span>
                  </button>
                </div>
              </div>

              {attKind === 'link' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    External URL *
                  </label>
                  <input
                    type="url"
                    value={attUrl}
                    onChange={(e) => setAttUrl(e.target.value)}
                    placeholder="https://example.com/guide-or-document"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800">
                    <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Tap to choose an image, PDF, receipt, or text file (Max 4 MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, 'attachment')}
                      className="hidden"
                    />
                  </label>

                  {cameraError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{cameraError}</p>
                  )}

                  {cameraActive && (
                    <div className="rounded-xl overflow-hidden bg-slate-950 p-3 space-y-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => capturePhotoFromVideo('attachment')}
                        className="w-full min-h-[44px] rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                      >
                        Capture Photo Attachment
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Attachment Name *
                </label>
                <input
                  type="text"
                  value={attName}
                  onChange={(e) => setAttName(e.target.value)}
                  placeholder="e.g., Silk Saree Warranty Receipt.pdf"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={attDesc}
                  onChange={(e) => setAttDesc(e.target.value)}
                  placeholder="Why is this file or link important?"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Link to Moment (Optional)
                  </label>
                  <select
                    value={attMomentId}
                    onChange={(e) => setAttMomentId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Unattached (Library only)</option>
                    {db.moments.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Link to Activity (Optional)
                  </label>
                  <select
                    value={attActivityId}
                    onChange={(e) => setAttActivityId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">None</option>
                    {db.activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              {isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
