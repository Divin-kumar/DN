import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Gift,
  Grid,
  Heart,
  Link2,
  MapPin,
  Paperclip,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  AttachmentRecord,
  DNDatabase,
  GreetingCardStyle,
  GreetingRecord,
  MemoriesSubTab,
  MemoryRecord,
  MomentRecord,
} from '../types/dn';
import {
  formatDate,
  GREETING_TEMPLATES,
} from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';
import { QuickCreateMode } from './QuickCreateModal';

interface MemoriesAndVaultViewProps {
  db: DNDatabase;
  activeSubTab: MemoriesSubTab;
  onChangeSubTab: (tab: MemoriesSubTab) => void;
  preselectedGreetingMoment?: MomentRecord | null;
  onClearGreetingMoment: () => void;
  onOpenQuickCreate: (mode: QuickCreateMode) => void;
  onEditMemory: (memory: MemoryRecord) => void;
  onDeleteMemory: (memoryId: string) => void;
  onEditAttachment: (attachment: AttachmentRecord) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onSaveGreeting: (greeting: Omit<GreetingRecord, 'id' | 'createdAt'>, existingId?: string) => void;
  onDeleteGreeting: (greetingId: string) => void;
  onNavigateToMoment: (momentId: string) => void;
}

const CARD_STYLE_CONFIG: Record<
  GreetingCardStyle,
  {
    name: string;
    containerClass: string;
    kickerClass: string;
    titleClass: string;
    bodyClass: string;
    footerClass: string;
  }
> = {
  'indigo-dusk': {
    name: 'Indigo Dusk',
    containerClass:
      'bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white border-indigo-800/60',
    kickerClass: 'text-indigo-300',
    titleClass: 'text-white',
    bodyClass: 'text-indigo-100/90',
    footerClass: 'text-indigo-300 border-indigo-800/50',
  },
  'ivory-botanical': {
    name: 'Ivory Botanical',
    containerClass:
      'bg-[#FAF8F5] text-slate-900 border-stone-200',
    kickerClass: 'text-emerald-800',
    titleClass: 'text-stone-900',
    bodyClass: 'text-stone-700',
    footerClass: 'text-stone-500 border-stone-200',
  },
  'warm-terracotta': {
    name: 'Warm Terracotta',
    containerClass:
      'bg-gradient-to-br from-amber-950 via-stone-900 to-rose-950 text-amber-50 border-amber-800/50',
    kickerClass: 'text-amber-300',
    titleClass: 'text-amber-50',
    bodyClass: 'text-amber-100/90',
    footerClass: 'text-amber-300/80 border-amber-800/40',
  },
  'midnight-gold': {
    name: 'Midnight Gold',
    containerClass:
      'bg-slate-950 text-amber-50 border-amber-500/30',
    kickerClass: 'text-amber-400',
    titleClass: 'text-amber-200',
    bodyClass: 'text-slate-200',
    footerClass: 'text-amber-400/80 border-slate-800',
  },
  'minimal-linen': {
    name: 'Minimalist Linen',
    containerClass:
      'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800',
    kickerClass: 'text-indigo-600 dark:text-indigo-400',
    titleClass: 'text-slate-900 dark:text-white',
    bodyClass: 'text-slate-600 dark:text-slate-300',
    footerClass: 'text-slate-500 border-slate-100 dark:border-slate-800',
  },
};

export const MemoriesAndVaultView: React.FC<MemoriesAndVaultViewProps> = ({
  db,
  activeSubTab,
  onChangeSubTab,
  preselectedGreetingMoment,
  onClearGreetingMoment,
  onOpenQuickCreate,
  onEditMemory,
  onDeleteMemory,
  onEditAttachment,
  onDeleteAttachment,
  onSaveGreeting,
  onDeleteGreeting,
  onNavigateToMoment,
}) => {
  const { dateFormat } = db.settings;

  const [memoryView, setMemoryView] = useState<'journal' | 'gallery'>('journal');
  const [memorySearch, setMemorySearch] = useState('');
  const [memoryYearFilter, setMemoryYearFilter] = useState<string>('all');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<'all' | 'photos' | 'written'>('all');
  const [readingMemory, setReadingMemory] = useState<MemoryRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [attSearch, setAttSearch] = useState('');
  const [attFilter, setAttFilter] = useState<'all' | 'photo' | 'document' | 'link' | 'unattached'>('all');
  const [attSort, setAttSort] = useState<'recent' | 'name' | 'size'>('recent');
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentRecord | null>(null);

  const [gRecipient, setGRecipient] = useState('Amma');
  const [gOccasion, setGOccasion] = useState('Birthday');
  const [gStyle, setGStyle] = useState<GreetingCardStyle>('ivory-botanical');
  const [gMessage, setGMessage] = useState(
    GREETING_TEMPLATES[0].buildMessage('Amma')
  );
  const [gSender, setGSender] = useState(db.profile.nickname || db.profile.displayName || '');
  const [gMomentId, setGMomentId] = useState('');
  const [greetingToast, setGreetingToast] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'memory' | 'attachment' | 'greeting';
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (preselectedGreetingMoment) {
      const guessedRecipient = preselectedGreetingMoment.title.split("'s")[0] || preselectedGreetingMoment.title;
      setGRecipient(guessedRecipient);
      setGOccasion(preselectedGreetingMoment.type || 'Birthday');
      setGMomentId(preselectedGreetingMoment.id);
      const matchingTpl =
        GREETING_TEMPLATES.find(
          (t) => t.occasion.toLowerCase() === preselectedGreetingMoment.type.toLowerCase()
        ) || GREETING_TEMPLATES[0];
      setGStyle(matchingTpl.style);
      setGMessage(matchingTpl.buildMessage(guessedRecipient));
      onClearGreetingMoment();
    }
  }, [preselectedGreetingMoment]);

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback copy
    }
  };

  const handleExportMemory = (mem: MemoryRecord) => {
    const content = `${mem.title}\nDate: ${formatDate(mem.date, dateFormat)}${
      mem.location ? ` · Location: ${mem.location}` : ''
    }\n\n${mem.description}${mem.caption ? `\n\nCaption: "${mem.caption}"` : ''}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGreetingCard = () => {
    const htmlContent = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Greeting for ${gRecipient}</title>
<style>
  body { font-family: Georgia, serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
  .card { max-width: 520px; width: 100%; border-radius: 24px; padding: 48px 40px; background: #1e1b4b; color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
  .kicker { font-family: sans-serif; font-size: 12px; letter-spacing: 0.08em; color: #a5b4fc; margin-bottom: 12px; }
  h1 { font-size: 28px; margin: 0 0 20px 0; }
  p { font-size: 17px; line-height: 1.7; margin: 0 0 32px 0; white-space: pre-line; }
  .sender { font-size: 14px; color: #c7d2fe; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 16px; }
</style>
</head>
<body>
  <div class="card">
    <div class="kicker">${gOccasion} Greeting</div>
    <h1>Dearest ${gRecipient},</h1>
    <p>${gMessage}</p>
    <div class="sender">With warm regards, ${gSender || 'Friend'}</div>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Greeting_${gRecipient.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const availableMemoryYears = Array.from(
    new Set<string>(db.memories.map((m) => m.date.slice(0, 4)).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const filteredMemories = db.memories
    .filter((m) => {
      if (memoryYearFilter !== 'all' && !m.date.startsWith(memoryYearFilter)) return false;
      if (memoryTypeFilter === 'photos' && !m.photoUrl) return false;
      if (memoryTypeFilter === 'written' && m.photoUrl) return false;
      if (memorySearch.trim()) {
        const q = memorySearch.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.location && m.location.toLowerCase().includes(q)) ||
          (m.caption && m.caption.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredAttachments = db.attachments
    .filter((att) => {
      if (attFilter === 'unattached' && (att.momentId || att.activityId)) return false;
      if (attFilter === 'photo' && att.kind !== 'photo' && att.kind !== 'camera') return false;
      if (attFilter === 'document' && att.kind !== 'document') return false;
      if (attFilter === 'link' && att.kind !== 'link') return false;
      if (attSearch.trim()) {
        const q = attSearch.toLowerCase();
        return (
          att.name.toLowerCase().includes(q) ||
          (att.description && att.description.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (attSort === 'name') return a.name.localeCompare(b.name);
      if (attSort === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      return b.createdAt.localeCompare(a.createdAt);
    });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const activeCardStyle = CARD_STYLE_CONFIG[gStyle];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {activeSubTab === 'journal'
              ? 'Memories & Personal Journal'
              : activeSubTab === 'attachments'
              ? 'Attachments Library'
              : 'Greetings & Occasion Messages'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {activeSubTab === 'journal'
              ? 'Preserve personal recollections, photographs, and meaningful stories across the years.'
              : activeSubTab === 'attachments'
              ? 'Centralized vault for photos, camera captures, receipts, documents, and external web links.'
              : 'Craft thoughtful, personalized occasion cards and messages for the people you care about.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 self-start">
          <button
            type="button"
            onClick={() => onChangeSubTab('journal')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'journal'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Memories ({db.memories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSubTab('attachments')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'attachments'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Attachments ({db.attachments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSubTab('greetings')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'greetings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Greetings ({db.greetings.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'journal' && (
        <div className="space-y-6">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder="Search memories by title, story, caption, or place..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={memoryTypeFilter}
                  onChange={(e) =>
                    setMemoryTypeFilter(e.target.value as 'all' | 'photos' | 'written')
                  }
                  aria-label="Filter memories by format"
                  className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Memories</option>
                  <option value="photos">Photo Memories</option>
                  <option value="written">Written Stories Only</option>
                </select>

                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setMemoryView('journal')}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      memoryView === 'journal'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Journal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryView('gallery')}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      memoryView === 'gallery'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Gallery</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenQuickCreate('memory')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Memory</span>
                </button>
              </div>
            </div>

            {availableMemoryYears.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                <span className="text-xs text-slate-400 mr-1 whitespace-nowrap">Revisit Year:</span>
                <button
                  type="button"
                  onClick={() => setMemoryYearFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    memoryYearFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Years
                </button>
                {availableMemoryYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setMemoryYearFilter(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                      memoryYearFilter === yr
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}
          </section>

          {filteredMemories.length === 0 ? (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Heart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Your personal journal is waiting for your stories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Record a favorite conversation, attach a photograph from a trip, or preserve a quiet family evening.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onOpenQuickCreate('memory')}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                >
                  + Write First Memory
                </button>
              </div>
            </section>
          ) : memoryView === 'journal' ? (
            <div className="space-y-6">
              {filteredMemories.map((mem) => {
                const linkedMoment = db.moments.find((m) => m.id === mem.momentId);
                return (
                  <article
                    key={mem.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      {mem.photoUrl && (
                        <div
                          onClick={() => setReadingMemory(mem)}
                          className="md:col-span-5 cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
                        >
                          <img
                            src={mem.photoUrl}
                            alt={mem.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-64 md:h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div
                        className={`p-6 sm:p-8 flex flex-col justify-between ${
                          mem.photoUrl ? 'md:col-span-7' : 'md:col-span-12'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                              {formatDate(mem.date, dateFormat)}
                            </span>
                            {mem.location && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {mem.location}
                                </span>
                              </>
                            )}
                            {linkedMoment && (
                              <>
                                <span aria-hidden="true">·</span>
                                <button
                                  type="button"
                                  onClick={() => onNavigateToMoment(linkedMoment.id)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                >
                                  {linkedMoment.title}
                                </button>
                              </>
                            )}
                          </div>

                          <h2
                            onClick={() => setReadingMemory(mem)}
                            className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {mem.title}
                          </h2>

                          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                            {mem.description}
                          </p>

                          {mem.caption && (
                            <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
                              “{mem.caption}”
                            </p>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setReadingMemory(mem)}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Open Reader View
                          </button>

                          <div className="flex items-center gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() => handleExportMemory(mem)}
                              className="text-slate-500 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Export</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditMemory(mem)}
                              className="text-slate-500 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
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
                              className="text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMemories.map((mem) => (
                <article
                  key={mem.id}
                  onClick={() => setReadingMemory(mem)}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {mem.photoUrl ? (
                      <div className="h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-slate-50 dark:bg-slate-800/50 p-5 flex items-center justify-center">
                        <p className="text-xs italic text-slate-500 dark:text-slate-400 line-clamp-3 text-center">
                          “{mem.description}”
                        </p>
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {formatDate(mem.date, dateFormat)}
                        {mem.location ? ` · ${mem.location}` : ''}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {mem.title}
                      </h3>
                      {mem.caption && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {mem.caption}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'attachments' && (
        <div className="space-y-6">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  placeholder="Search attachments by filename or description..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={attSort}
                  onChange={(e) => setAttSort(e.target.value as 'recent' | 'name' | 'size')}
                  aria-label="Sort attachments"
                  className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="recent">Sort: Date Added</option>
                  <option value="name">Sort: Name (A–Z)</option>
                  <option value="size">Sort: File Size</option>
                </select>

                <button
                  type="button"
                  onClick={() => onOpenQuickCreate('attachment')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Attachment</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              {(
                [
                  { id: 'all', label: `All Items (${db.attachments.length})` },
                  { id: 'photo', label: 'Photos & Camera' },
                  { id: 'document', label: 'Documents & Receipts' },
                  { id: 'link', label: 'External URLs' },
                  {
                    id: 'unattached',
                    label: `Unattached (${
                      db.attachments.filter((a) => !a.momentId && !a.activityId).length
                    })`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAttFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    attFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {filteredAttachments.length === 0 ? (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                No attachments match your current filter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Upload device photos, capture a camera frame, store PDFs/receipts, or save external web links.
              </p>
            </section>
          ) : (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredAttachments.map((att) => {
                const linkedMoment = db.moments.find((m) => m.id === att.momentId);
                const linkedActivity = db.activities.find((a) => a.id === att.activityId);
                const isUnattached = !linkedMoment && !linkedActivity;

                return (
                  <div
                    key={att.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {(att.kind === 'photo' || att.kind === 'camera') && att.url ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          referrerPolicy="no-referrer"
                          onClick={() => setPreviewAttachment(att)}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        />
                      ) : (
                        <div
                          onClick={() => setPreviewAttachment(att)}
                          className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {att.kind === 'link' ? (
                            <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {att.name}
                        </p>
                        {att.description && (
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                            {att.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="capitalize">{att.kind}</span>
                          {att.sizeBytes && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{formatFileSize(att.sizeBytes)}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            {formatDate(att.createdAt.slice(0, 10), dateFormat)}
                          </span>
                          <span aria-hidden="true">·</span>
                          {isUnattached ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Unattached item
                            </span>
                          ) : (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              Linked to {linkedMoment?.title || linkedActivity?.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {att.kind === 'link' ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          download={att.name}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditAttachment(att)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        title="Relink or Replace"
                      >
                        Relink / Edit
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
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600"
                        aria-label="Delete attachment"
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

      {activeSubTab === 'greetings' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Personalize Your Occasion Message
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Start with a thoughtful suggestion below or write your own personal message.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Thoughtful Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {GREETING_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setGOccasion(tpl.occasion);
                        setGStyle(tpl.style);
                        setGMessage(tpl.buildMessage(gRecipient));
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-colors"
                    >
                      {tpl.occasion} · {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={gRecipient}
                    onChange={(e) => setGRecipient(e.target.value)}
                    placeholder="e.g., Amma, Meera, Rohan"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={gOccasion}
                    onChange={(e) => setGOccasion(e.target.value)}
                    placeholder="e.g., Birthday, Anniversary, Diwali"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Personal Message (Editable)
                </label>
                <textarea
                  rows={4}
                  value={gMessage}
                  onChange={(e) => setGMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 p-3.5 text-sm leading-relaxed text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Signed By (Sender)
                  </label>
                  <input
                    type="text"
                    value={gSender}
                    onChange={(e) => setGSender(e.target.value)}
                    placeholder="Your name"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Link to Moment (Optional)
                  </label>
                  <select
                    value={gMomentId}
                    onChange={(e) => setGMomentId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">None</option>
                    {db.moments.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Card Aesthetic Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CARD_STYLE_CONFIG) as GreetingCardStyle[]).map((styleKey) => (
                    <button
                      key={styleKey}
                      type="button"
                      onClick={() => setGStyle(styleKey)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        gStyle === styleKey
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {CARD_STYLE_CONFIG[styleKey].name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="lg:col-span-6 space-y-4">
              <div
                className={`rounded-3xl border p-8 sm:p-10 shadow-lg transition-all ${activeCardStyle.containerClass}`}
              >
                <p className={`text-xs font-medium tracking-wide ${activeCardStyle.kickerClass}`}>
                  {gOccasion || 'Special Occasion'}
                </p>
                <h3
                  className={`mt-3 text-2xl sm:text-3xl font-editorial font-semibold ${activeCardStyle.titleClass}`}
                >
                  Dearest {gRecipient || 'Friend'},
                </h3>
                <p
                  className={`mt-5 text-base sm:text-lg leading-relaxed whitespace-pre-line font-editorial ${activeCardStyle.bodyClass}`}
                >
                  {gMessage}
                </p>
                <div className={`mt-8 pt-5 border-t text-xs font-medium ${activeCardStyle.footerClass}`}>
                  With warm wishes, {gSender || 'Friend'}
                </div>
              </div>

              {greetingToast && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {greetingToast}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onSaveGreeting({
                      recipientName: gRecipient.trim() || 'Friend',
                      occasion: gOccasion.trim() || 'Occasion',
                      message: gMessage.trim(),
                      style: gStyle,
                      senderName: gSender.trim() || 'Friend',
                      momentId: gMomentId || undefined,
                    });
                    setGreetingToast('Greeting saved to your collection below.');
                    setTimeout(() => setGreetingToast(null), 3000);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save Greeting</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      `Dearest ${gRecipient},\n\n${gMessage}\n\nWith warm wishes, ${gSender}`,
                      'live-card'
                    )
                  }
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  {copiedId === 'live-card' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied Text</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportGreetingCard}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Card</span>
                </button>
              </div>
            </div>
          </div>

          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              Saved Occasion Greetings ({db.greetings.length})
            </h3>

            {db.greetings.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                No saved greetings yet. Personalize a card above and click “Save Greeting”.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {db.greetings.map((grt) => {
                  const st = CARD_STYLE_CONFIG[grt.style] || CARD_STYLE_CONFIG['indigo-dusk'];
                  return (
                    <div
                      key={grt.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between ${st.containerClass}`}
                    >
                      <div>
                        <p className={`text-xs font-medium ${st.kickerClass}`}>
                          {grt.occasion} · For {grt.recipientName}
                        </p>
                        <p className={`mt-2 text-sm leading-relaxed font-editorial ${st.bodyClass}`}>
                          “{grt.message}”
                        </p>
                      </div>
                      <div
                        className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${st.footerClass}`}
                      >
                        <span>From {grt.senderName}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setGRecipient(grt.recipientName);
                              setGOccasion(grt.occasion);
                              setGMessage(grt.message);
                              setGStyle(grt.style);
                              setGSender(grt.senderName);
                              setGMomentId(grt.momentId || '');
                            }}
                            className="hover:underline font-medium"
                          >
                            Load in Studio
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDelete({
                                kind: 'greeting',
                                id: grt.id,
                                title: `Greeting for ${grt.recipientName}`,
                              })
                            }
                            className="hover:underline opacity-80"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {readingMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            {readingMemory.photoUrl && (
              <img
                src={readingMemory.photoUrl}
                alt={readingMemory.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-80 object-cover"
              />
            )}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                    {formatDate(readingMemory.date, dateFormat)}
                    {readingMemory.location ? ` · ${readingMemory.location}` : ''}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {readingMemory.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setReadingMemory(null)}
                  className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line">
                {readingMemory.description}
              </p>

              {readingMemory.caption && (
                <p className="text-xs italic text-slate-500 dark:text-slate-400 pt-2">
                  Caption: “{readingMemory.caption}”
                </p>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleExportMemory(readingMemory)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Export Text
                </button>
                <button
                  type="button"
                  onClick={() => setReadingMemory(null)}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {previewAttachment.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {previewAttachment.kind} · Added{' '}
                  {formatDate(previewAttachment.createdAt.slice(0, 10), dateFormat)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(previewAttachment.kind === 'photo' || previewAttachment.kind === 'camera') &&
            previewAttachment.url ? (
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                referrerPolicy="no-referrer"
                className="w-full max-h-96 object-contain rounded-xl bg-slate-950"
              />
            ) : previewAttachment.kind === 'link' ? (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2">
                <p className="text-xs font-mono break-all text-indigo-600 dark:text-indigo-400">
                  {previewAttachment.url}
                </p>
                {previewAttachment.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {previewAttachment.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-6 text-center space-y-2">
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {previewAttachment.description || 'Document attachment stored locally.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {previewAttachment.kind === 'link' ? (
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <span>Open External URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.kind}?`}
        description={`Are you sure you want to permanently remove "${confirmDelete?.title}"?`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.kind === 'memory') onDeleteMemory(confirmDelete.id);
          if (confirmDelete.kind === 'attachment') onDeleteAttachment(confirmDelete.id);
          if (confirmDelete.kind === 'greeting') onDeleteGreeting(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
};
