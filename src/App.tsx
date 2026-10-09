import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Compass,
  FileSpreadsheet,
  Heart,
  Home,
  Moon,
  Paperclip,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import { ActivitiesView } from './components/ActivitiesView';
import { AttachmentsView } from './components/AttachmentsView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ConnectivityAndUpdateBanner, PWAInstallButton } from './components/PWAInstallBanner';
import { FinancesAndInsightsView } from './components/FinancesAndInsightsView';
import { HomeView } from './components/HomeView';
import { MemoriesAndVaultView } from './components/MemoriesAndVaultView';
import { MomentsView } from './components/MomentsView';
import { QuickCreateModal, QuickCreateMode } from './components/QuickCreateModal';
import { SettingsAndBackupView } from './components/SettingsAndBackupView';
import {
  ActivityRecord,
  AppSettings,
  AttachmentRecord,
  CustomTaxonomyItem,
  DNDatabase,
  FinanceRecord,
  FinancesSubTab,
  GreetingRecord,
  MemoriesSubTab,
  MemoryRecord,
  MomentRecord,
  MomentStatus,
  PrimarySection,
  UserProfile,
} from './types/dn';
import {
  createDemoDatabase,
  createInitialDatabase,
  getTodayISO,
} from './utils/dnHelpers';

const STORAGE_KEY = 'dn_life_companion_db_v1';

export default function App() {
  // Database State with local-first persistence
  const [db, setDb] = useState<DNDatabase>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.moments && parsed.settings && parsed.profile) {
          const initial = createInitialDatabase();
          return {
            ...initial,
            ...parsed,
            settings: {
              ...initial.settings,
              ...parsed.settings,
              homeSections: {
                ...initial.settings.homeSections,
                ...(parsed.settings.homeSections || {}),
              },
            },
          };
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return createInitialDatabase();
  });

  // Navigation State
  const [activeSection, setActiveSection] = useState<PrimarySection>(
    db.settings.defaultLanding || 'home'
  );
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [memoriesSubTab, setMemoriesSubTab] = useState<MemoriesSubTab>('journal');
  const [financesSubTab, setFinancesSubTab] = useState<FinancesSubTab>('overview');
  const [preselectedGreetingMoment, setPreselectedGreetingMoment] = useState<MomentRecord | null>(null);

  // Quick Create Modal State
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateMode, setQuickCreateMode] = useState<QuickCreateMode>('moment');
  const [preselectedMomentId, setPreselectedMomentId] = useState<string | undefined>(undefined);
  const [editingMoment, setEditingMoment] = useState<MomentRecord | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [editingMemory, setEditingMemory] = useState<MemoryRecord | null>(null);
  const [editingFinance, setEditingFinance] = useState<FinanceRecord | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<AttachmentRecord | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) {
      console.warn('LocalStorage save failed (storage may be full):', err);
    }
  }, [db]);

  // Apply Visual Design Tokens & Theme
  useEffect(() => {
    const root = document.documentElement;

    // Theme mode
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    applyTheme(db.settings.theme);

    if (db.settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [db.settings.theme]);

  // Apply fine-grained appearance tokens
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-shade', db.settings.brandGreenShade || 'botanical');
    root.setAttribute('data-density', db.settings.density || 'balanced');
    root.setAttribute('data-card-style', db.settings.cardStyle || 'bordered');
    root.setAttribute('data-radius', db.settings.cornerRadius || 'refined');
    root.setAttribute('data-textscale', db.settings.textScale || 'default');
    root.setAttribute('data-reduced-motion', String(Boolean(db.settings.reducedMotion)));
  }, [
    db.settings.brandGreenShade,
    db.settings.density,
    db.settings.cardStyle,
    db.settings.cornerRadius,
    db.settings.textScale,
    db.settings.reducedMotion,
  ]);

  // Unified Navigation Handler
  const handleNavigate = (
    section: PrimarySection,
    options?: {
      momentId?: string;
      memoriesTab?: MemoriesSubTab;
      financesTab?: FinancesSubTab;
    }
  ) => {
    // Normalize 'moments' to 'events'
    const target = section === 'moments' ? 'events' : section;
    setActiveSection(target);
    if (options?.momentId !== undefined) {
      setSelectedMomentId(options.momentId);
    }
    if (options?.memoriesTab) {
      setMemoriesSubTab(options.memoriesTab);
    }
    if (options?.financesTab) {
      setFinancesSubTab(options.financesTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Quick Create Modal Helpers
  const handleOpenQuickCreate = (mode: QuickCreateMode, momentIdPrefill?: string) => {
    setQuickCreateMode(mode);
    setPreselectedMomentId(momentIdPrefill);
    setEditingMoment(null);
    setEditingActivity(null);
    setEditingMemory(null);
    setEditingFinance(null);
    setEditingAttachment(null);
    setQuickCreateOpen(true);
  };

  const handleEditMoment = (moment: MomentRecord) => {
    setEditingMoment(moment);
    setQuickCreateMode('moment');
    setQuickCreateOpen(true);
  };

  const handleEditActivity = (activity: ActivityRecord) => {
    setEditingActivity(activity);
    setQuickCreateMode('activity');
    setQuickCreateOpen(true);
  };

  const handleEditMemory = (memory: MemoryRecord) => {
    setEditingMemory(memory);
    setQuickCreateMode('memory');
    setQuickCreateOpen(true);
  };

  const handleEditFinance = (finance: FinanceRecord) => {
    setEditingFinance(finance);
    setQuickCreateMode(finance.type === 'income' ? 'income' : 'expense');
    setQuickCreateOpen(true);
  };

  const handleEditAttachment = (attachment: AttachmentRecord) => {
    setEditingAttachment(attachment);
    setQuickCreateMode('attachment');
    setQuickCreateOpen(true);
  };

  // MOMENT / EVENT Operations
  const handleSaveMoment = (
    momentData: Omit<MomentRecord, 'id' | 'createdAt' | 'updatedAt' | 'history'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setDb((prev) => ({
        ...prev,
        moments: prev.moments.map((m) =>
          m.id === existingId
            ? {
                ...m,
                ...momentData,
                updatedAt: now,
                history: [
                  ...m.history,
                  {
                    id: `evt-${Date.now()}`,
                    timestamp: now,
                    title: `Updated details for ${momentData.title}`,
                    category: 'status',
                  },
                ],
              }
            : m
        ),
      }));
    } else {
      const newMoment: MomentRecord = {
        ...momentData,
        id: `moment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: `evt-${Date.now()}`,
            timestamp: now,
            title: `Created occasion ${momentData.title}`,
            category: 'status',
          },
        ],
      };
      setDb((prev) => ({
        ...prev,
        moments: [newMoment, ...prev.moments],
      }));
    }
  };

  const handleDuplicateMoment = (moment: MomentRecord) => {
    const now = new Date().toISOString();
    const duplicated: MomentRecord = {
      ...moment,
      id: `moment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${moment.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `evt-${Date.now()}`,
          timestamp: now,
          title: `Duplicated from ${moment.title}`,
          category: 'status',
        },
      ],
    };
    setDb((prev) => ({
      ...prev,
      moments: [duplicated, ...prev.moments],
    }));
  };

  const handleUpdateMomentStatus = (momentId: string, status: MomentStatus) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      moments: prev.moments.map((m) =>
        m.id === momentId
          ? {
              ...m,
              status,
              updatedAt: now,
              history: [
                ...m.history,
                {
                  id: `evt-${Date.now()}`,
                  timestamp: now,
                  title: `Status changed to ${status}`,
                  category: 'status',
                },
              ],
            }
          : m
      ),
    }));
  };

  const handleUpdateMomentNotes = (momentId: string, notes: string) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      moments: prev.moments.map((m) =>
        m.id === momentId ? { ...m, notes, updatedAt: now } : m
      ),
    }));
  };

  // Safe Deletion: When an event is deleted, clear references on related items rather than deleting them
  const handleDeleteMoment = (momentId: string) => {
    setDb((prev) => ({
      ...prev,
      moments: prev.moments.filter((m) => m.id !== momentId),
      activities: prev.activities.map((a) =>
        a.momentId === momentId ? { ...a, momentId: undefined } : a
      ),
      memories: prev.memories.map((m) =>
        m.momentId === momentId ? { ...m, momentId: undefined } : m
      ),
      finances: prev.finances.map((f) =>
        f.momentId === momentId ? { ...f, momentId: undefined } : f
      ),
      attachments: prev.attachments.map((at) =>
        at.momentId === momentId ? { ...at, momentId: undefined } : at
      ),
    }));
    if (selectedMomentId === momentId) {
      setSelectedMomentId(null);
    }
  };

  // ACTIVITY Operations
  const handleSaveActivity = (
    activityData: Omit<ActivityRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setDb((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === existingId ? { ...a, ...activityData } : a
        ),
      }));
    } else {
      const newActivity: ActivityRecord = {
        ...activityData,
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        activities: [newActivity, ...prev.activities],
      }));

      if (activityData.momentId) {
        setDb((prev) => ({
          ...prev,
          moments: prev.moments.map((m) =>
            m.id === activityData.momentId
              ? {
                  ...m,
                  history: [
                    ...m.history,
                    {
                      id: `evt-${Date.now()}`,
                      timestamp: now,
                      title: `Linked activity "${activityData.title}"`,
                      category: 'activity',
                    },
                  ],
                }
              : m
          ),
        }));
      }
    }
  };

  const handleToggleActivity = (activityId: string) => {
    const now = new Date().toISOString();
    setDb((prev) => {
      const target = prev.activities.find((a) => a.id === activityId);
      if (!target) return prev;
      const willBeCompleted = !target.completed;

      const updatedActivities = prev.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? now : undefined,
            }
          : a
      );

      let updatedMoments = prev.moments;
      if (target.momentId) {
        updatedMoments = prev.moments.map((m) =>
          m.id === target.momentId
            ? {
                ...m,
                history: [
                  ...m.history,
                  {
                    id: `evt-${Date.now()}`,
                    timestamp: now,
                    title: willBeCompleted
                      ? `Completed "${target.title}"`
                      : `Reopened "${target.title}"`,
                    category: 'activity',
                  },
                ],
              }
            : m
        );
      }

      return {
        ...prev,
        activities: updatedActivities,
        moments: updatedMoments,
      };
    });
  };

  const handleDeleteActivity = (activityId: string) => {
    setDb((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== activityId),
      finances: prev.finances.map((f) =>
        f.activityId === activityId ? { ...f, activityId: undefined } : f
      ),
      attachments: prev.attachments.map((at) =>
        at.activityId === activityId ? { ...at, activityId: undefined } : at
      ),
      memories: prev.memories.map((m) =>
        m.activityId === activityId ? { ...m, activityId: undefined } : m
      ),
    }));
  };

  // MEMORY Operations
  const handleSaveMemory = (
    memoryData: Omit<MemoryRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setDb((prev) => ({
        ...prev,
        memories: prev.memories.map((m) =>
          m.id === existingId ? { ...m, ...memoryData } : m
        ),
      }));
    } else {
      const newMemory: MemoryRecord = {
        ...memoryData,
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        memories: [newMemory, ...prev.memories],
      }));
    }
  };

  const handleDeleteMemory = (memoryId: string) => {
    setDb((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== memoryId),
    }));
  };

  // ATTACHMENT Operations
  const handleSaveAttachment = (
    attachmentData: Omit<AttachmentRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setDb((prev) => ({
        ...prev,
        attachments: prev.attachments.map((a) =>
          a.id === existingId ? { ...a, ...attachmentData } : a
        ),
      }));
    } else {
      const newAttachment: AttachmentRecord = {
        ...attachmentData,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        attachments: [newAttachment, ...prev.attachments],
      }));
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setDb((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
      activities: prev.activities.map((a) =>
        a.attachmentId === attachmentId ? { ...a, attachmentId: undefined } : a
      ),
    }));
  };

  // FINANCE Operations
  const handleSaveFinance = (
    financeData: Omit<FinanceRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setDb((prev) => ({
        ...prev,
        finances: prev.finances.map((f) =>
          f.id === existingId ? { ...f, ...financeData } : f
        ),
      }));
    } else {
      const newFinance: FinanceRecord = {
        ...financeData,
        id: `fin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        finances: [newFinance, ...prev.finances],
      }));
    }
  };

  const handleDeleteFinance = (financeId: string) => {
    setDb((prev) => ({
      ...prev,
      finances: prev.finances.filter((f) => f.id !== financeId),
      activities: prev.activities.map((a) =>
        a.expenseId === financeId ? { ...a, expenseId: undefined } : a
      ),
    }));
  };

  // GREETINGS Operations
  const handleSaveGreeting = (
    greetingData: Omit<GreetingRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setDb((prev) => ({
        ...prev,
        greetings: prev.greetings.map((g) =>
          g.id === existingId ? { ...g, ...greetingData } : g
        ),
      }));
    } else {
      const newGreeting: GreetingRecord = {
        ...greetingData,
        id: `greet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        greetings: [newGreeting, ...prev.greetings],
      }));
    }
  };

  const handleDeleteGreeting = (greetingId: string) => {
    setDb((prev) => ({
      ...prev,
      greetings: prev.greetings.filter((g) => g.id !== greetingId),
    }));
  };

  // Settings & Profile Updates
  const handleUpdateProfile = (partial: Partial<UserProfile>) => {
    setDb((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...partial },
    }));
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  };

  const handleAddCustomMomentType = (typeName: string) => {
    if (!typeName.trim()) return;
    const exists = db.settings.momentTypes.some(
      (t) => t.name.toLowerCase() === typeName.trim().toLowerCase()
    );
    if (exists) return;
    const newItem: CustomTaxonomyItem = {
      id: `mt-custom-${Date.now()}`,
      name: typeName.trim(),
      isBuiltIn: false,
      enabled: true,
    };
    setDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        momentTypes: [...prev.settings.momentTypes, newItem],
      },
    }));
  };

  const handleRestoreDatabase = (newDb: DNDatabase) => {
    setDb(newDb);
    setSelectedMomentId(null);
    setActiveSection('home');
  };

  const handleResetDatabase = () => {
    const fresh = createInitialDatabase();
    setDb(fresh);
    setSelectedMomentId(null);
    setActiveSection('home');
  };

  const handleLoadDemoDatabase = () => {
    const sample = createDemoDatabase();
    setDb(sample);
    setSelectedMomentId(null);
    setActiveSection('home');
  };

  const isEventsActive = activeSection === 'events' || activeSection === 'moments';

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 antialiased selection:bg-[#286747]/20 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar (Zone 1: Brand Wordmark, Zone 2: Navigation, Zone 3: Actions) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#19211B]/90 backdrop-blur-md border-b border-[#DFE4DC] dark:border-[#303B32]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Monogram & Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="h-9 w-9 rounded-xl bg-[#286747] dark:bg-[#70A987] flex items-center justify-center text-white dark:text-[#101612] font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
                DN
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white block leading-tight font-editorial">
                  DN
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 dark:text-slate-500 block leading-none">
                  Life Space
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Switcher */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-[#202A22]/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={() => handleNavigate('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'home'
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavigate('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isEventsActive
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Events</span>
              {db.moments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-[#286747] dark:text-[#70A987]">
                  {db.moments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavigate('activities')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'activities'
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Activities</span>
              {db.activities.filter((a) => !a.completed).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-[#286747] dark:text-[#70A987]">
                  {db.activities.filter((a) => !a.completed).length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavigate('memories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'memories'
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Heart className="h-3.5 w-3.5" />
              <span>Memories</span>
            </button>

            <button
              onClick={() => handleNavigate('attachments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'attachments'
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attachments</span>
            </button>

            <button
              onClick={() => handleNavigate('finances')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'finances'
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Finances</span>
            </button>

            <button
              onClick={() => handleNavigate('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'settings'
                  ? 'bg-white dark:bg-[#19211B] text-[#286747] dark:text-[#70A987] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Quick Add */}
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />

            {/* Quick Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = db.settings.theme === 'dark' ? 'light' : 'dark';
                handleUpdateSettings({ theme: nextTheme });
              }}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {db.settings.theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[#286747]" />
              )}
            </button>

            {/* Settings button on mobile/tablet */}
            <button
              onClick={() => handleNavigate('settings')}
              className="lg:hidden h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Global Quick Add Button */}
            <button
              onClick={() => handleOpenQuickCreate('moment')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Connectivity & Offline Banners */}
      <ConnectivityAndUpdateBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-12">
        {activeSection === 'home' && (
          <HomeView
            db={db}
            onNavigate={handleNavigate}
            onOpenQuickCreate={handleOpenQuickCreate}
            onToggleActivity={handleToggleActivity}
            onLoadDemoData={handleLoadDemoDatabase}
          />
        )}

        {isEventsActive && (
          <MomentsView
            db={db}
            selectedMomentId={selectedMomentId}
            onSelectMoment={setSelectedMomentId}
            onOpenQuickCreate={handleOpenQuickCreate}
            onEditMoment={handleEditMoment}
            onDuplicateMoment={handleDuplicateMoment}
            onUpdateMomentStatus={handleUpdateMomentStatus}
            onUpdateMomentNotes={handleUpdateMomentNotes}
            onDeleteMoment={handleDeleteMoment}
            onToggleActivity={handleToggleActivity}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            onEditMemory={handleEditMemory}
            onDeleteMemory={handleDeleteMemory}
            onEditFinance={handleEditFinance}
            onEditAttachment={handleEditAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onOpenGreetingsForMoment={(m) => {
              setPreselectedGreetingMoment(m);
              handleNavigate('memories', { memoriesTab: 'greetings' });
            }}
            onAddCustomMomentType={handleAddCustomMomentType}
          />
        )}

        {activeSection === 'activities' && (
          <ActivitiesView
            db={db}
            onOpenQuickCreate={handleOpenQuickCreate}
            onEditActivity={handleEditActivity}
            onToggleActivity={handleToggleActivity}
            onDeleteActivity={handleDeleteActivity}
            onNavigateToEvent={(mId) => handleNavigate('events', { momentId: mId })}
          />
        )}

        {activeSection === 'memories' && (
          <MemoriesAndVaultView
            db={db}
            activeSubTab={memoriesSubTab}
            onChangeSubTab={setMemoriesSubTab}
            preselectedGreetingMoment={preselectedGreetingMoment}
            onClearGreetingMoment={() => setPreselectedGreetingMoment(null)}
            onOpenQuickCreate={handleOpenQuickCreate}
            onEditMemory={handleEditMemory}
            onDeleteMemory={handleDeleteMemory}
            onEditAttachment={handleEditAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onSaveGreeting={handleSaveGreeting}
            onDeleteGreeting={handleDeleteGreeting}
            onNavigateToMoment={(mId) => handleNavigate('events', { momentId: mId })}
          />
        )}

        {activeSection === 'attachments' && (
          <AttachmentsView
            db={db}
            onOpenQuickCreate={handleOpenQuickCreate}
            onEditAttachment={handleEditAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onNavigateToEvent={(mId) => handleNavigate('events', { momentId: mId })}
          />
        )}

        {activeSection === 'finances' && (
          <FinancesAndInsightsView
            db={db}
            activeSubTab={financesSubTab}
            onChangeSubTab={setFinancesSubTab}
            onOpenQuickCreate={handleOpenQuickCreate}
            onEditFinance={handleEditFinance}
            onDeleteFinance={handleDeleteFinance}
            onNavigate={handleNavigate}
          />
        )}

        {activeSection === 'settings' && (
          <SettingsAndBackupView
            db={db}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSettings={handleUpdateSettings}
            onRestoreDatabase={handleRestoreDatabase}
            onResetDatabase={handleResetDatabase}
            onLoadDemoDatabase={handleLoadDemoDatabase}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Refined Botanical Touch Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#19211B]/95 backdrop-blur-lg border-t border-[#DFE4DC] dark:border-[#303B32] px-2 py-1.5 flex items-center justify-around safe-bottom">
        <button
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            activeSection === 'home'
              ? 'text-[#286747] dark:text-[#70A987] font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => handleNavigate('events')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            isEventsActive
              ? 'text-[#286747] dark:text-[#70A987] font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px]">Events</span>
        </button>

        <button
          onClick={() => handleNavigate('activities')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            activeSection === 'activities'
              ? 'text-[#286747] dark:text-[#70A987] font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="h-5 w-5" />
          <span className="text-[10px]">Activities</span>
        </button>

        {/* Center Floating Quick Action Button */}
        <button
          onClick={() => handleOpenQuickCreate('moment')}
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] shadow-md shadow-emerald-950/20 active:scale-95 transition-transform"
          aria-label="Create new entry"
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          onClick={() => handleNavigate('memories')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            activeSection === 'memories'
              ? 'text-[#286747] dark:text-[#70A987] font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px]">Memories</span>
        </button>

        <button
          onClick={() => handleNavigate('finances')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            activeSection === 'finances'
              ? 'text-[#286747] dark:text-[#70A987] font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[10px]">Finances</span>
        </button>
      </nav>

      {/* Global Quick Create Modal */}
      <QuickCreateModal
        open={quickCreateOpen}
        initialMode={quickCreateMode}
        preselectedMomentId={preselectedMomentId}
        editingMoment={editingMoment}
        editingActivity={editingActivity}
        editingMemory={editingMemory}
        editingFinance={editingFinance}
        editingAttachment={editingAttachment}
        db={db}
        onClose={() => setQuickCreateOpen(false)}
        onSaveMoment={handleSaveMoment}
        onSaveActivity={handleSaveActivity}
        onSaveMemory={handleSaveMemory}
        onSaveFinance={handleSaveFinance}
        onSaveAttachment={handleSaveAttachment}
      />
    </div>
  );
}
