import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  CheckSquare,
  Database,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Layout,
  Moon,
  Paintbrush,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  AppSettings,
  BrandGreenShade,
  CardStyle,
  CornerRadius,
  CurrencyCode,
  CustomTaxonomyItem,
  DateFormatStyle,
  DNDatabase,
  HomeSectionsVisibility,
  InterfaceDensity,
  PrimarySection,
  RecurrenceType,
  TextScale,
  ThemeMode,
  UserProfile,
} from '../types/dn';
import {
  BackupValidationResult,
  formatDate,
  validateBackupJSON,
} from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsAndBackupViewProps {
  db: DNDatabase;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onRestoreDatabase: (newDb: DNDatabase) => void;
  onResetDatabase: () => void;
  onLoadDemoDatabase: () => void;
}

type SettingsSectionTab =
  | 'essential'
  | 'home'
  | 'modules'
  | 'appearance'
  | 'taxonomy'
  | 'data'
  | 'profile';

export const SettingsAndBackupView: React.FC<SettingsAndBackupViewProps> = ({
  db,
  onUpdateProfile,
  onUpdateSettings,
  onRestoreDatabase,
  onResetDatabase,
  onLoadDemoDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsSectionTab>('essential');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile form state
  const [displayName, setDisplayName] = useState(db.profile.displayName);
  const [nickname, setNickname] = useState(db.profile.nickname);
  const [bio, setBio] = useState(db.profile.bio);
  const [deviceName, setDeviceName] = useState(db.profile.deviceName);
  const [photoUrl, setPhotoUrl] = useState(db.profile.photoUrl || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Taxonomy states
  const [newMomentType, setNewMomentType] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeType, setNewIncomeType] = useState('');

  // Backup & Restore states
  const [includeAttachmentsInBackup, setIncludeAttachmentsInBackup] = useState(true);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [showResetAppearanceConfirm, setShowResetAppearanceConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentSettings = db.settings;

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim() || 'Aarav',
      nickname: nickname.trim() || displayName.trim() || 'Aarav',
      bio: bio.trim(),
      deviceName: deviceName.trim() || 'Personal Companion',
      photoUrl: photoUrl.trim() || undefined,
    });
    setProfileSaved(true);
    showToast('Profile updated');
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset Appearance Settings to Defaults
  const handleResetAppearance = () => {
    onUpdateSettings({
      theme: 'system',
      brandGreenShade: 'botanical',
      density: 'balanced',
      cardStyle: 'bordered',
      cornerRadius: 'refined',
      textScale: 'default',
      reducedMotion: false,
    });
    showToast('Appearance restored to natural defaults');
  };

  // Taxonomy Helpers
  const toggleTaxonomy = (
    listName: 'momentTypes' | 'expenseCategories' | 'incomeTypes',
    itemId: string
  ) => {
    const list = db.settings[listName];
    const updated = list.map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    onUpdateSettings({ [listName]: updated });
    showToast('Taxonomy option updated');
  };

  const removeCustomTaxonomy = (
    listName: 'momentTypes' | 'expenseCategories' | 'incomeTypes',
    itemId: string
  ) => {
    const list = db.settings[listName];
    const updated = list.filter((item) => item.id !== itemId);
    onUpdateSettings({ [listName]: updated });
    showToast('Removed custom taxonomy item');
  };

  const addCustomTaxonomy = (
    listName: 'momentTypes' | 'expenseCategories' | 'incomeTypes',
    name: string,
    resetInput: () => void
  ) => {
    if (!name.trim()) return;
    const list = db.settings[listName];
    if (list.some((item) => item.name.toLowerCase() === name.trim().toLowerCase())) {
      showToast('This item already exists.');
      return;
    }
    const newItem: CustomTaxonomyItem = {
      id: `${listName.slice(0, 2)}-custom-${Date.now()}`,
      name: name.trim(),
      isBuiltIn: false,
      enabled: true,
    };
    onUpdateSettings({ [listName]: [...list, newItem] });
    resetInput();
    showToast(`Added "${newItem.name}"`);
  };

  // Backup Download
  const handleDownloadBackup = () => {
    const payload = {
      ...db,
      attachments: includeAttachmentsInBackup
        ? db.attachments
        : db.attachments.map((a) => ({
            ...a,
            url: a.kind === 'photo' ? '' : a.url,
            description: `${a.description || ''} [photo data omitted in compact backup]`,
          })),
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `dn-backup-${db.profile.nickname.toLowerCase() || 'life'}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onUpdateProfile({
      lastBackupAt: new Date().toISOString(),
      backupCount: (db.profile.backupCount || 0) + 1,
    });
    showToast('JSON Backup downloaded safely');
  };

  // CSV Exports
  const handleExportCSV = (type: 'moments' | 'finances' | 'memories' | 'activities') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'moments') {
      headers = ['ID', 'Title', 'Type', 'Date', 'Recurrence', 'Status', 'Description'];
      rows = db.moments.map((m) => [
        m.id,
        `"${m.title.replace(/"/g, '""')}"`,
        m.type,
        m.date,
        m.recurrence,
        m.status,
        `"${(m.description || '').replace(/"/g, '""')}"`,
      ]);
      filename = `dn-events-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'activities') {
      headers = ['ID', 'Title', 'Date', 'Priority', 'Completed', 'LinkedEventID'];
      rows = db.activities.map((a) => [
        a.id,
        `"${a.title.replace(/"/g, '""')}"`,
        a.date,
        a.priority,
        String(a.completed),
        a.momentId || '',
      ]);
      filename = `dn-activities-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'finances') {
      headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Title', 'Notes'];
      rows = db.finances.map((f) => [
        f.id,
        f.date,
        f.type,
        String(f.amount),
        `"${f.category.replace(/"/g, '""')}"`,
        `"${f.title.replace(/"/g, '""')}"`,
        `"${(f.notes || '').replace(/"/g, '""')}"`,
      ]);
      filename = `dn-finances-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ['ID', 'Date', 'Title', 'Location', 'Caption', 'Description'];
      rows = db.memories.map((m) => [
        m.id,
        m.date,
        `"${m.title.replace(/"/g, '""')}"`,
        `"${(m.location || '').replace(/"/g, '""')}"`,
        `"${(m.caption || '').replace(/"/g, '""')}"`,
        `"${(m.description || '').replace(/"/g, '""')}"`,
      ]);
      filename = `dn-memories-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${type} to CSV`);
  };

  // Restore file picked
  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = validateBackupJSON(text);
        setRestoreValidation(result);
        setShowRestoreModal(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (restoreValidation?.data) {
      onRestoreDatabase(restoreValidation.data);
      setShowRestoreModal(false);
      setRestoreValidation(null);
      showToast('Database restored successfully');
    }
  };

  // Toggle Home Section
  const toggleHomeSection = (key: keyof HomeSectionsVisibility) => {
    const current = db.settings.homeSections || {
      focus: true,
      events: true,
      activities: true,
      memories: true,
      onThisDay: true,
      finances: true,
    };
    onUpdateSettings({
      homeSections: {
        ...current,
        [key]: !current[key],
      },
    });
    showToast('Updated home dashboard visibility');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-xl text-xs sm:text-sm font-medium border border-slate-700 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header Profile Summary Card */}
      <div className="dn-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {db.profile.photoUrl ? (
                <img
                  src={db.profile.photoUrl}
                  alt={db.profile.displayName}
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#286747] dark:border-[#70A987] shadow-xs"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-bold text-xl shadow-xs">
                  {db.profile.displayName ? db.profile.displayName.charAt(0).toUpperCase() : 'D'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {db.profile.displayName}
                </h1>
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 font-medium border border-emerald-200/50 dark:border-emerald-900/50">
                  {db.profile.nickname}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {db.profile.bio || 'Your private, intentional digital space'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Private & Local on Device</span>
            </div>
          </div>
        </div>

        {/* Search bar inside Settings */}
        <div className="mt-5 relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search settings (e.g., theme, density, currency, events, finances)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#286747]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'essential', label: 'Essential', icon: Sliders },
              { id: 'home', label: 'Home Screen', icon: Layout },
              { id: 'modules', label: 'Modules', icon: CheckSquare },
              { id: 'appearance', label: 'Appearance', icon: Paintbrush },
              { id: 'taxonomy', label: 'Categories', icon: Sparkles },
              { id: 'data', label: 'Backup & Data', icon: Database },
              { id: 'profile', label: 'Profile', icon: User },
            ] as { id: SettingsSectionTab; label: string; icon: any }[]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#286747] dark:text-[#70A987] font-semibold border border-emerald-200/50 dark:border-emerald-900/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. ESSENTIAL SETTINGS */}
      {(activeTab === 'essential' || searchQuery) && (
        <div className="dn-card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Essential Controls
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Theme, regional conventions, and default application landing screen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Theme */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Color Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'light', label: 'Light', icon: Sun },
                  { mode: 'dark', label: 'Dark Forest', icon: Moon },
                  { mode: 'system', label: 'System', icon: Sliders },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onUpdateSettings({ theme: mode as ThemeMode });
                      showToast(`Theme set to ${label}`);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      currentSettings.theme === mode
                        ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/60 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Interface Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { density: 'compact', label: 'Compact' },
                  { density: 'balanced', label: 'Balanced' },
                  { density: 'comfortable', label: 'Comfortable' },
                ].map(({ density, label }) => (
                  <button
                    key={density}
                    onClick={() => {
                      onUpdateSettings({ density: density as InterfaceDensity });
                      showToast(`Density set to ${label}`);
                    }}
                    className={`py-3 px-2 rounded-xl border text-xs font-medium text-center transition-all ${
                      (currentSettings.density || 'balanced') === density
                        ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/60 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Currency
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((cur) => (
                  <button
                    key={cur}
                    onClick={() => {
                      onUpdateSettings({ currency: cur });
                      showToast(`Currency set to ${cur}`);
                    }}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-medium ${
                      currentSettings.currency === cur
                        ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/60 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Date Display
              </label>
              <select
                value={currentSettings.dateFormat}
                onChange={(e) => {
                  onUpdateSettings({ dateFormat: e.target.value as DateFormatStyle });
                  showToast('Date format updated');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                <option value="dd-mmm-yyyy">09 Oct 2026 (DD MMM YYYY)</option>
                <option value="mmm-dd-yyyy">Oct 09, 2026 (MMM DD, YYYY)</option>
                <option value="yyyy-mm-dd">2026-10-09 (ISO)</option>
              </select>
            </div>

            {/* Default Landing Screen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Default Landing Screen
              </label>
              <select
                value={currentSettings.defaultLanding || 'home'}
                onChange={(e) => {
                  onUpdateSettings({ defaultLanding: e.target.value as PrimarySection });
                  showToast('Default landing screen saved');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                <option value="home">Home (Overview Dashboard)</option>
                <option value="events">Events & Occasions</option>
                <option value="activities">Activities & Tasks</option>
                <option value="memories">Memories & Journal</option>
                <option value="attachments">Attachments Library</option>
                <option value="finances">Personal Finances</option>
              </select>
            </div>

            {/* Week start day */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Week Starts On
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['monday', 'sunday'] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      onUpdateSettings({ weekStartDay: day });
                      showToast(`Week start set to ${day}`);
                    }}
                    className={`py-2 px-2 capitalize rounded-xl border text-xs font-medium text-center ${
                      (currentSettings.weekStartDay || 'monday') === day
                        ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/60 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HOME SCREEN PERSONALIZATION */}
      {(activeTab === 'home' || searchQuery) && (
        <div className="dn-card p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Home Screen Personalization
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control which sections appear on your day view, privacy settings, and visual focus.
            </p>
          </div>

          {/* Section Visibility Toggles */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Dashboard Sections
            </h3>

            {(
              [
                { key: 'focus', label: "Today's Focus & Quick Actions", desc: 'Greeting header with quick entries' },
                { key: 'events', label: 'Upcoming Occasions & Countdowns', desc: 'Birthdays, anniversaries, and holidays' },
                { key: 'activities', label: "Today's Activities & Checklists", desc: 'Quick completion of pending tasks' },
                { key: 'onThisDay', label: 'On This Day Flashbacks', desc: 'Resurface meaningful memories from this day in past years' },
                { key: 'memories', label: 'Recent Memories Gallery', desc: 'Highlights from your photo and written journal' },
                { key: 'finances', label: 'Monthly Cash Flow Snapshot', desc: 'Income, recorded spending, and net balance' },
              ] as { key: keyof HomeSectionsVisibility; label: string; desc: string }[]
            ).map(({ key, label, desc }) => {
              const visible = currentSettings.homeSections
                ? currentSettings.homeSections[key] !== false
                : true;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleHomeSection(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      visible
                        ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    <span>{visible ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Privacy Toggle: Hide finances on home */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Privacy: Hide Financial Figures on Home
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Keeps numbers masked or hides financial widgets when opening DN in public.
              </p>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ hideFinancesOnHome: !currentSettings.hideFinancesOnHome });
                showToast('Home privacy preference updated');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentSettings.hideFinancesOnHome
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {currentSettings.hideFinancesOnHome ? 'Figures Hidden' : 'Show Figures'}
            </button>
          </div>
        </div>
      )}

      {/* 3. MODULE PREFERENCES */}
      {(activeTab === 'modules' || searchQuery) && (
        <div className="dn-card p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Module-Specific Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize how each independent area behaves and displays its information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Events Preferences */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Events & Occasions
              </h3>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Default View Layout
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['list', 'calendar', 'timeline'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        onUpdateSettings({ eventViewMode: view });
                        showToast(`Events layout set to ${view}`);
                      }}
                      className={`py-1.5 capitalize rounded-lg border text-center ${
                        (currentSettings.eventViewMode || 'list') === view
                          ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Default Recurrence
                </label>
                <select
                  value={currentSettings.defaultRecurrence || 'none'}
                  onChange={(e) => {
                    onUpdateSettings({ defaultRecurrence: e.target.value as RecurrenceType });
                    showToast('Default recurrence updated');
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <option value="none">One-time (No Recurrence)</option>
                  <option value="yearly">Yearly (Birthdays, Anniversaries)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Activities Preferences */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Activities & Tasks
              </h3>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Default Sorting
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'date', label: 'By Date' },
                    { id: 'priority', label: 'Priority' },
                    { id: 'alphabetical', label: 'Name' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => {
                        onUpdateSettings({ activitySort: id as any });
                        showToast(`Activity sort set to ${label}`);
                      }}
                      className={`py-1.5 rounded-lg border text-center ${
                        (currentSettings.activitySort || 'date') === id
                          ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Card Style
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {(['detailed', 'compact'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        onUpdateSettings({ activityCardStyle: style });
                        showToast(`Activity card set to ${style}`);
                      }}
                      className={`py-1.5 capitalize rounded-lg border text-center ${
                        (currentSettings.activityCardStyle || 'detailed') === style
                          ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Memories Preferences */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Memories & Journal
              </h3>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Preferred Presentation
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['gallery', 'timeline', 'list'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        onUpdateSettings({ memoryViewMode: mode });
                        showToast(`Memories layout set to ${mode}`);
                      }}
                      className={`py-1.5 capitalize rounded-lg border text-center ${
                        (currentSettings.memoryViewMode || 'gallery') === mode
                          ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] font-semibold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Finances Preferences */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Personal Finances
              </h3>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Start Day of Financial Month (1-28)
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={currentSettings.financialMonthStartDay || 1}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(28, parseInt(e.target.value) || 1));
                    onUpdateSettings({ financialMonthStartDay: val });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Default Reporting Window
                </label>
                <select
                  value={currentSettings.defaultReportingPeriod || 'month'}
                  onChange={(e) => {
                    onUpdateSettings({ defaultReportingPeriod: e.target.value as any });
                    showToast('Reporting period updated');
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">Last 90 Days</option>
                  <option value="year">Full Year (365 Days)</option>
                  <option value="all">All-Time History</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. APPEARANCE & AESTHETICS (Personal) */}
      {(activeTab === 'appearance' || searchQuery) && (
        <div className="dn-card p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Appearance & Tactile Design
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fine-tune green shades, surface styles, corner radii, and text scaling.
              </p>
            </div>
            <button
              onClick={() => setShowResetAppearanceConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="space-y-5 pt-2">
            {/* Green Shade Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Signature Green Palette
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { shade: 'botanical', name: 'Botanical Green', hex: '#286747' },
                  { shade: 'forest', name: 'Deep Forest', hex: '#194A35' },
                  { shade: 'evergreen', name: 'Evergreen Pine', hex: '#1E5A3D' },
                  { shade: 'moss', name: 'Muted Moss', hex: '#3D6E50' },
                ].map(({ shade, name, hex }) => {
                  const selected = (currentSettings.brandGreenShade || 'botanical') === shade;
                  return (
                    <button
                      key={shade}
                      onClick={() => {
                        onUpdateSettings({ brandGreenShade: shade as BrandGreenShade });
                        showToast(`Green shade changed to ${name}`);
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/40 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full shrink-0 shadow-xs border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-medium text-slate-900 dark:text-white">
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Card Presentation
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'minimal', label: 'Minimal', desc: 'Flat with subtle surface contrast' },
                  { id: 'bordered', label: 'Bordered', desc: 'Fine hairline border (Recommended)' },
                  { id: 'softly-elevated', label: 'Soft Elevation', desc: 'Gentle, restrained shadow' },
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => {
                      onUpdateSettings({ cardStyle: id as CardStyle });
                      showToast(`Card style set to ${label}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      (currentSettings.cardStyle || 'bordered') === id
                        ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Corner Geometry
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'sharp', label: 'Sharp (6px)' },
                  { id: 'refined', label: 'Refined (12px)' },
                  { id: 'rounded', label: 'Softly Rounded (20px)' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => {
                      onUpdateSettings({ cornerRadius: id as CornerRadius });
                      showToast(`Corner radius set to ${label}`);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      (currentSettings.cornerRadius || 'refined') === id
                        ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold text-[#286747] dark:text-[#70A987]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Scale & Motion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Typography Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'Small' },
                    { id: 'default', label: 'Standard' },
                    { id: 'large', label: 'Comfortable' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => {
                        onUpdateSettings({ textScale: id as TextScale });
                        showToast(`Text scale set to ${label}`);
                      }}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-medium ${
                        (currentSettings.textScale || 'default') === id
                          ? 'border-[#286747] dark:border-[#70A987] bg-emerald-50/40 dark:bg-emerald-950/30 font-semibold text-[#286747] dark:text-[#70A987]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Reduced Motion
                </label>
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Minimize UI animations
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentSettings.reducedMotion)}
                    onChange={(e) => {
                      onUpdateSettings({ reducedMotion: e.target.checked });
                      showToast(e.target.checked ? 'Reduced motion enabled' : 'Smooth animations enabled');
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-[#286747] focus:ring-[#286747]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAXONOMY & CATEGORIES */}
      {(activeTab === 'taxonomy' || searchQuery) && (
        <div className="space-y-5">
          {/* Moment Types */}
          <div className="dn-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Event & Occasion Types
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Toggle types on or off. Disabling hides an option from new pickers without deleting past records.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {currentSettings.momentTypes.map((type) => (
                <div
                  key={type.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    type.enabled
                      ? 'border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-400 line-through'
                  }`}
                >
                  <button
                    onClick={() => toggleTaxonomy('momentTypes', type.id)}
                    className="hover:underline"
                    title={type.enabled ? 'Click to disable' : 'Click to enable'}
                  >
                    {type.name}
                  </button>
                  {!type.isBuiltIn && (
                    <button
                      onClick={() => removeCustomTaxonomy('momentTypes', type.id)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add custom occasion..."
                value={newMomentType}
                onChange={(e) => setNewMomentType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTaxonomy('momentTypes', newMomentType, () => setNewMomentType(''));
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomTaxonomy('momentTypes', newMomentType, () => setNewMomentType(''))
                }
                className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="dn-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Expense Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Categories used to group spending records and budget insights.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {currentSettings.expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    cat.enabled
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/20 text-slate-400 line-through'
                  }`}
                >
                  <button
                    onClick={() => toggleTaxonomy('expenseCategories', cat.id)}
                    className="hover:underline"
                  >
                    {cat.name}
                  </button>
                  {!cat.isBuiltIn && (
                    <button
                      onClick={() => removeCustomTaxonomy('expenseCategories', cat.id)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add custom expense category..."
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTaxonomy('expenseCategories', newExpenseCategory, () =>
                      setNewExpenseCategory('')
                    );
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomTaxonomy('expenseCategories', newExpenseCategory, () =>
                    setNewExpenseCategory('')
                  )
                }
                className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DATA & BACKUP */}
      {(activeTab === 'data' || searchQuery) && (
        <div className="space-y-5">
          {/* Download JSON Backup */}
          <div className="dn-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Download Encrypted-Ready JSON Backup
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Export your entire database into human-readable JSON format for private safe-keeping.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#286747] dark:text-[#70A987] shrink-0">
                <Download className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mb-4 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                id="includeAttachments"
                checked={includeAttachmentsInBackup}
                onChange={(e) => setIncludeAttachmentsInBackup(e.target.checked)}
                className="rounded border-slate-300 text-[#286747] focus:ring-[#286747]"
              />
              <label htmlFor="includeAttachments" className="cursor-pointer">
                Include attached photo data and base64 files
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Download className="h-4 w-4" />
                Download JSON Backup
              </button>

              {db.profile.lastBackupAt && (
                <span className="text-xs text-slate-400">
                  Last backup: {formatDate(db.profile.lastBackupAt.split('T')[0], currentSettings.dateFormat)}
                </span>
              )}
            </div>
          </div>

          {/* CSV Exports */}
          <div className="dn-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Spreadsheet CSV Exports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Export independent area records for use in Microsoft Excel or Google Sheets.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleExportCSV('moments')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Events CSV</p>
                  <p className="text-[11px] text-slate-400">{db.moments.length} records</p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-[#286747] dark:text-[#70A987]" />
              </button>

              <button
                onClick={() => handleExportCSV('activities')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Activities CSV</p>
                  <p className="text-[11px] text-slate-400">{db.activities.length} tasks</p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              </button>

              <button
                onClick={() => handleExportCSV('finances')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Finances CSV</p>
                  <p className="text-[11px] text-slate-400">{db.finances.length} records</p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-amber-600" />
              </button>

              <button
                onClick={() => handleExportCSV('memories')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Memories CSV</p>
                  <p className="text-[11px] text-slate-400">{db.memories.length} entries</p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-violet-500" />
              </button>
            </div>
          </div>

          {/* Restore Database */}
          <div className="dn-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Restore from Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select a valid DN JSON backup. A comprehensive verification preview will appear before any data is replaced.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold cursor-pointer transition-colors">
              <Upload className="h-4 w-4 text-[#286747] dark:text-[#70A987]" />
              <span>Select Backup File (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />
            </label>
          </div>

          {/* Presets and Workspace Reset */}
          <div className="p-5 sm:p-6 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/20">
            <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">
              Workspace Presets & Reset
            </h2>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mb-4">
              Load realistic sample data or reset your local workspace to an empty pristine state.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDemoConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#286747]/30 text-[#286747] dark:text-[#70A987] bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Load Sample Life Workspace
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset All Local Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PROFILE TAB */}
      {(activeTab === 'profile' || searchQuery) && (
        <div className="dn-card p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Personal Identity & Device
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Your identity details are stored purely inside this browser session and device storage.
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Greeting / Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Personal Intention / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What is your focus or personal motto?"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Device Label
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Avatar Photo
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-sm font-semibold shadow-xs transition-colors"
              >
                {profileSaved ? <Check className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                <span>{profileSaved ? 'Saved' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Restore Validation Modal */}
      {showRestoreModal && restoreValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg dn-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {restoreValidation.valid ? 'Backup Verification Preview' : 'Invalid Backup'}
              </h3>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreValidation(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {restoreValidation.valid && restoreValidation.summary ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  The backup file is verified. Summary of records to restore:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400">Profile Name:</span>{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {restoreValidation.summary.profileName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Events:</span>{' '}
                    <span className="font-semibold text-[#286747] dark:text-[#70A987]">
                      {restoreValidation.summary.momentsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Activities:</span>{' '}
                    <span className="font-semibold text-emerald-600">
                      {restoreValidation.summary.activitiesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Memories:</span>{' '}
                    <span className="font-semibold text-violet-600">
                      {restoreValidation.summary.memoriesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Attachments:</span>{' '}
                    <span className="font-semibold text-sky-600">
                      {restoreValidation.summary.attachmentsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Finances:</span>{' '}
                    <span className="font-semibold text-amber-600">
                      {restoreValidation.summary.financesCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreValidation(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    className="px-4 py-2 text-xs font-semibold bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] rounded-xl"
                  >
                    Apply & Restore Workspace
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700">
                  {restoreValidation.error || 'The file provided does not conform to schema.'}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreValidation(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded-xl"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset All Local Data?"
        description="This will permanently delete all records on this device. Make sure you downloaded a backup first."
        confirmLabel="Reset Everything"
        variant="danger"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetDatabase();
          showToast('Workspace reset');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmDialog
        open={showDemoConfirm}
        title="Load Sample Life Workspace?"
        description="This will replace current data with realistic sample events, activities, memories, and financial entries."
        confirmLabel="Load Sample Data"
        variant="primary"
        onConfirm={() => {
          setShowDemoConfirm(false);
          onLoadDemoDatabase();
          showToast('Sample workspace loaded');
        }}
        onCancel={() => setShowDemoConfirm(false)}
      />

      <ConfirmDialog
        open={showResetAppearanceConfirm}
        title="Restore Default Appearance?"
        description="This will reset theme, green shade, density, corner radius, and card style back to their original botanical defaults."
        confirmLabel="Restore Defaults"
        variant="primary"
        onConfirm={() => {
          setShowResetAppearanceConfirm(false);
          handleResetAppearance();
        }}
        onCancel={() => setShowResetAppearanceConfirm(false)}
      />
    </div>
  );
};
