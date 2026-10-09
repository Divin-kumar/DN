import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Gift,
  Grid,
  Heart,
  Link2,
  MapPin,
  Plus,
  RotateCcw,
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
import { FilterSheet } from './FilterSheet';
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
  'ivory-botanical': {
    name: 'Ivory Botanical',
    containerClass: 'bg-[#FAF8F5] text-slate-900 border-stone-200',
    kickerClass: 'text-emerald-800',
    titleClass: 'text-stone-900',
    bodyClass: 'text-stone-700',
    footerClass: 'text-stone-500 border-stone-200',
  },
  'indigo-dusk': {
    name: 'Forest Dusk',
    containerClass:
      'bg-gradient-to-br from-[#122419] via-[#1A3123] to-[#0D1812] text-white border-emerald-900/60',
    kickerClass: 'text-emerald-300',
    titleClass: 'text-white',
    bodyClass: 'text-emerald-100/90',
    footerClass: 'text-emerald-300 border-emerald-800/50',
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
    containerClass: 'bg-slate-950 text-amber-50 border-amber-500/30',
    kickerClass: 'text-amber-400',
    titleClass: 'text-amber-200',
    bodyClass: 'text-slate-200',
    footerClass: 'text-amber-400 border-amber-500/20',
  },
  'minimal-linen': {
    name: 'Minimal Linen',
    containerClass: 'bg-white text-slate-900 border-slate-200',
    kickerClass: 'text-slate-500',
    titleClass: 'text-slate-900',
    bodyClass: 'text-slate-700',
    footerClass: 'text-slate-400 border-slate-100',
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

  const [memorySearch, setMemorySearch] = useState('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<'all' | 'photos' | 'written'>('all');
  const [memoryYearFilter, setMemoryYearFilter] = useState<string>('all');
  const [memorySort, setMemorySort] = useState<'newest' | 'oldest'>('newest');
  const [memoryView, setMemoryView] = useState<'journal' | 'gallery'>('journal');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Reader View State
  const [readingMemory, setReadingMemory] = useState<MemoryRecord | null>(null);

  // Greeting Studio State
  const [gRecipient, setGRecipient] = useState('');
  const [gOccasion, setGOccasion] = useState('');
  const [gMessage, setGMessage] = useState('');
  const [gStyle, setGStyle] = useState<GreetingCardStyle>('ivory-botanical');
  const [gSender, setGSender] = useState(db.profile.displayName || 'Friend');
  const [gMomentId, setGMomentId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [greetingToast, setGreetingToast] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'memory' | 'greeting';
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (preselectedGreetingMoment) {
      setGOccasion(preselectedGreetingMoment.type || 'Special Occasion');
      setGRecipient(preselectedGreetingMoment.title);
      setGMomentId(preselectedGreetingMoment.id);
      const match = GREETING_TEMPLATES.find((t) =>
        preselectedGreetingMoment.type.toLowerCase().includes(t.occasion.toLowerCase())
      );
      if (match) {
        setGMessage(match.buildMessage(preselectedGreetingMoment.title));
      } else {
        setGMessage(
          `Warmest wishes and congratulations on ${preselectedGreetingMoment.title}! Celebrating with you.`
        );
      }
      onClearGreetingMoment();
    }
  }, [preselectedGreetingMoment, onClearGreetingMoment]);

  const activeFiltersCount =
    (memoryTypeFilter !== 'all' ? 1 : 0) +
    (memoryYearFilter !== 'all' ? 1 : 0) +
    (memorySort !== 'newest' ? 1 : 0);

  const handleResetFilters = () => {
    setMemoryTypeFilter('all');
    setMemoryYearFilter('all');
    setMemorySort('newest');
    setMemorySearch('');
  };

  const availableMemoryYears = Array.from(
    new Set(db.memories.map((m) => m.date.slice(0, 4)).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const filteredMemories = db.memories
    .filter((mem) => {
      if (memoryTypeFilter === 'photos' && !mem.photoUrl) return false;
      if (memoryTypeFilter === 'written' && mem.photoUrl) return false;
      if (memoryYearFilter !== 'all' && !mem.date.startsWith(memoryYearFilter)) return false;
      if (memorySearch.trim()) {
        const q = memorySearch.toLowerCase();
        return (
          mem.title.toLowerCase().includes(q) ||
          mem.description.toLowerCase().includes(q) ||
          (mem.caption && mem.caption.toLowerCase().includes(q)) ||
          (mem.location && mem.location.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (memorySort === 'oldest') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCardStyle = CARD_STYLE_CONFIG[gStyle] || CARD_STYLE_CONFIG['ivory-botanical'];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* 1. Header with Exactly 1 Primary Action */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Memories & Stories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {db.memories.length} preserved reflections · Private journal & greetings studio
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickCreate('memory')}
          className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Memory</span>
        </button>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 w-fit text-xs">
        <button
          type="button"
          onClick={() => onChangeSubTab('journal')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'journal'
              ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Stories & Journal ({db.memories.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab('greetings')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
            activeSubTab === 'greetings'
              ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Greetings Studio ({db.greetings.length})
        </button>
      </div>

      {/* Subtab 1: Journal & Stories */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memorySearch}
                onChange={(e) => setMemorySearch(e.target.value)}
                placeholder="Search memories by title, story, or place..."
                className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#286747]"
              />
              {memorySearch && (
                <button
                  type="button"
                  onClick={() => setMemorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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

            {/* View Mode Switch */}
            <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] shrink-0">
              <button
                type="button"
                onClick={() => setMemoryView('journal')}
                className={`p-1.5 rounded-lg transition-colors ${
                  memoryView === 'journal'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Journal list"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMemoryView('gallery')}
                className={`p-1.5 rounded-lg transition-colors ${
                  memoryView === 'gallery'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Photo gallery"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Filter Strip */}
          {(activeFiltersCount > 0 || memorySearch) && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>Showing:</span>
                {memoryTypeFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium capitalize">
                    {memoryTypeFilter}
                  </span>
                )}
                {memoryYearFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    Year: {memoryYearFilter}
                  </span>
                )}
                {memorySort !== 'newest' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    Oldest first
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

          {/* Filter Sheet */}
          <FilterSheet
            open={filterSheetOpen}
            activeCount={activeFiltersCount}
            onClose={() => setFilterSheetOpen(false)}
            onReset={handleResetFilters}
            title="Filter Memories"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All Memories' },
                    { id: 'photos', label: 'Photos Only' },
                    { id: 'written', label: 'Written Only' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMemoryTypeFilter(f.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                        memoryTypeFilter === f.id
                          ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {availableMemoryYears.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Year
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMemoryYearFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        memoryYearFilter === 'all'
                          ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      All Years
                    </button>
                    {availableMemoryYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setMemoryYearFilter(yr)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-medium ${
                          memoryYearFilter === yr
                            ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sort
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'oldest', label: 'Oldest First' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setMemorySort(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                        memorySort === s.id
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

          {/* List or Gallery of Memories */}
          {filteredMemories.length === 0 ? (
            <div className="dn-card p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {memorySearch || activeFiltersCount > 0
                  ? 'No matching memories found'
                  : 'Your journal is waiting'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {memorySearch || activeFiltersCount > 0
                  ? 'Try modifying your search or clearing active filters.'
                  : 'Capture quiet stories, family moments, or trip photographs.'}
              </p>
              <div className="mt-4">
                {memorySearch || activeFiltersCount > 0 ? (
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
                    onClick={() => onOpenQuickCreate('memory')}
                    className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold shadow-xs"
                  >
                    + Write First Memory
                  </button>
                )}
              </div>
            </div>
          ) : memoryView === 'journal' ? (
            <div className="space-y-3.5">
              {filteredMemories.map((mem) => {
                const linkedMoment = db.moments.find((m) => m.id === mem.momentId);
                return (
                  <article
                    key={mem.id}
                    className="dn-card p-4 sm:p-5 hover:border-[#286747]/40 dark:hover:border-[#70A987]/40 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {mem.photoUrl && (
                        <div
                          onClick={() => setReadingMemory(mem)}
                          className="sm:w-44 h-40 sm:h-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 cursor-pointer"
                        >
                          <img
                            src={mem.photoUrl}
                            alt={mem.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono text-[#286747] dark:text-[#70A987] font-semibold">
                              {formatDate(mem.date, dateFormat)}
                            </span>
                            {mem.location && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {mem.location}
                                </span>
                              </>
                            )}
                            {linkedMoment && (
                              <>
                                <span>·</span>
                                <button
                                  type="button"
                                  onClick={() => onNavigateToMoment(linkedMoment.id)}
                                  className="text-[#286747] dark:text-[#70A987] hover:underline"
                                >
                                  {linkedMoment.title}
                                </button>
                              </>
                            )}
                          </div>

                          <h3
                            onClick={() => setReadingMemory(mem)}
                            className="mt-1 text-base font-bold text-slate-900 dark:text-white cursor-pointer hover:text-[#286747] dark:hover:text-[#70A987] transition-colors"
                          >
                            {mem.title}
                          </h3>

                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {mem.description}
                          </p>

                          {mem.caption && (
                            <p className="mt-1.5 text-[11px] italic text-slate-400">
                              &ldquo;{mem.caption}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => setReadingMemory(mem)}
                            className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                          >
                            Read Full Story →
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onEditMemory(mem)}
                              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            /* Gallery Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  onClick={() => setReadingMemory(mem)}
                  className="dn-card overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  {mem.photoUrl ? (
                    <div className="h-36 overflow-hidden bg-slate-900">
                      <img
                        src={mem.photoUrl}
                        alt={mem.title}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-36 p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                      <p className="text-xs text-slate-500 italic line-clamp-3 text-center">
                        &ldquo;{mem.description}&rdquo;
                      </p>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-[10px] font-mono text-slate-400">
                      {formatDate(mem.date, dateFormat)}
                    </p>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {mem.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Greetings Studio */}
      {activeSubTab === 'greetings' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Card Form */}
            <section className="lg:col-span-6 dn-card p-5 space-y-3.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Personalized Card Composer
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={gRecipient}
                    onChange={(e) => setGRecipient(e.target.value)}
                    placeholder="e.g., Mom, Priya, Rahul"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Occasion Title
                  </label>
                  <input
                    type="text"
                    value={gOccasion}
                    onChange={(e) => setGOccasion(e.target.value)}
                    placeholder="e.g., Birthday, Diwali, Anniversary"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Card Message
                </label>
                <textarea
                  rows={4}
                  value={gMessage}
                  onChange={(e) => setGMessage(e.target.value)}
                  placeholder="Write your personal heartfelt greeting..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#286747]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Signed By
                  </label>
                  <input
                    type="text"
                    value={gSender}
                    onChange={(e) => setGSender(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Card Style
                  </label>
                  <select
                    value={gStyle}
                    onChange={(e) => setGStyle(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {(Object.keys(CARD_STYLE_CONFIG) as GreetingCardStyle[]).map((k) => (
                      <option key={k} value={k}>
                        {CARD_STYLE_CONFIG[k].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Card Live Preview */}
            <div className="lg:col-span-6 space-y-3.5">
              <div
                className={`rounded-2xl border p-6 sm:p-8 shadow-sm transition-all ${activeCardStyle.containerClass}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider ${activeCardStyle.kickerClass}`}>
                  {gOccasion || 'Special Celebration'}
                </p>
                <h3 className={`mt-2.5 text-xl sm:text-2xl font-editorial font-bold ${activeCardStyle.titleClass}`}>
                  Dearest {gRecipient || 'Friend'},
                </h3>
                <p className={`mt-4 text-sm sm:text-base leading-relaxed whitespace-pre-line font-editorial ${activeCardStyle.bodyClass}`}>
                  {gMessage || 'Wishing you happiness and peace today and always.'}
                </p>
                <div className={`mt-6 pt-3.5 border-t text-xs font-medium ${activeCardStyle.footerClass}`}>
                  With warm wishes, {gSender || 'Friend'}
                </div>
              </div>

              {greetingToast && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                  {greetingToast}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveGreeting({
                      recipientName: gRecipient.trim() || 'Friend',
                      occasion: gOccasion.trim() || 'Occasion',
                      message: gMessage.trim() || 'Wishing you all the best!',
                      style: gStyle,
                      senderName: gSender.trim() || 'Friend',
                      momentId: gMomentId || undefined,
                    });
                    setGreetingToast('Saved to your collection below.');
                    setTimeout(() => setGreetingToast(null), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
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
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5"
                >
                  {copiedId === 'live-card' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'live-card' ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Greetings */}
          <section className="dn-card p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Saved Occasion Greetings ({db.greetings.length})
            </h3>

            {db.greetings.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No saved greetings in library yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {db.greetings.map((grt) => {
                  const st = CARD_STYLE_CONFIG[grt.style] || CARD_STYLE_CONFIG['ivory-botanical'];
                  return (
                    <div
                      key={grt.id}
                      className={`rounded-xl border p-4 flex flex-col justify-between ${st.containerClass}`}
                    >
                      <div>
                        <p className={`text-[11px] font-medium ${st.kickerClass}`}>
                          {grt.occasion} · For {grt.recipientName}
                        </p>
                        <p className={`mt-1.5 text-xs leading-relaxed font-editorial ${st.bodyClass}`}>
                          &ldquo;{grt.message}&rdquo;
                        </p>
                      </div>
                      <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${st.footerClass}`}>
                        <span>From {grt.senderName}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setGRecipient(grt.recipientName);
                              setGOccasion(grt.occasion);
                              setGMessage(grt.message);
                              setGStyle(grt.style);
                              setGSender(grt.senderName);
                            }}
                            className="hover:underline font-semibold"
                          >
                            Edit
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

      {/* Reader Modal */}
      {readingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xl dn-card p-6 max-h-[85vh] overflow-y-auto space-y-4">
            {readingMemory.photoUrl && (
              <img
                src={readingMemory.photoUrl}
                alt={readingMemory.title}
                className="w-full max-h-72 object-cover rounded-xl"
              />
            )}

            <div>
              <p className="text-xs font-mono text-[#286747] dark:text-[#70A987]">
                {formatDate(readingMemory.date, dateFormat)}
                {readingMemory.location ? ` · ${readingMemory.location}` : ''}
              </p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {readingMemory.title}
              </h2>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-editorial">
              {readingMemory.description}
            </p>

            {readingMemory.caption && (
              <p className="text-xs italic text-slate-400">
                &ldquo;{readingMemory.caption}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReadingMemory(null)}
                className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold"
              >
                Close Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.kind || 'item'}?`}
        description={`Are you sure you want to permanently delete "${confirmDelete?.title}"?`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.kind === 'memory') onDeleteMemory(confirmDelete.id);
          if (confirmDelete.kind === 'greeting') onDeleteGreeting(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
};
