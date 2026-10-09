import React, { useState } from 'react';
import {
  Award,
  Check,
  Database,
  Download,
  Edit3,
  FileSpreadsheet,
  HelpCircle,
  Moon,
  Plus,
  RefreshCw,
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
  CurrencyCode,
  CustomTaxonomyItem,
  DateFormatStyle,
  DNDatabase,
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

export const SettingsAndBackupView: React.FC<SettingsAndBackupViewProps> = ({
  db,
  onUpdateProfile,
  onUpdateSettings,
  onRestoreDatabase,
  onResetDatabase,
  onLoadDemoDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'taxonomy' | 'backup'>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = useState(db.profile.displayName);
  const [nickname, setNickname] = useState(db.profile.nickname);
  const [bio, setBio] = useState(db.profile.bio);
  const [deviceName, setDeviceName] = useState(db.profile.deviceName);
  const [photoUrl, setPhotoUrl] = useState(db.profile.photoUrl || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Taxonomy new item states
  const [newMomentType, setNewMomentType] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeType, setNewIncomeType] = useState('');

  // Backup & Restore states
  const [includeAttachmentsInBackup, setIncludeAttachmentsInBackup] = useState(true);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
    showToast('Profile updated successfully');
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

  // Taxonomy helpers
  const toggleTaxonomy = (
    listName: 'momentTypes' | 'expenseCategories' | 'incomeTypes',
    itemId: string
  ) => {
    const list = db.settings[listName];
    const updated = list.map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    onUpdateSettings({ [listName]: updated });
    showToast('Updated taxonomy options');
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
  const handleExportCSV = (type: 'moments' | 'finances' | 'memories') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'moments') {
      headers = ['ID', 'Title', 'Type', 'Date', 'Recurrence', 'Status', 'Description', 'Notes'];
      rows = db.moments.map((m) => [
        m.id,
        `"${m.title.replace(/"/g, '""')}"`,
        m.type,
        m.date,
        m.recurrence,
        m.status,
        `"${(m.description || '').replace(/"/g, '""')}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ]);
      filename = `dn-moments-${new Date().toISOString().split('T')[0]}.csv`;
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

  // Restore file picker
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
    // Reset file input value so same file can be picked again if desired
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-xl text-xs sm:text-sm font-medium border border-slate-700 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {db.profile.photoUrl ? (
                <img
                  src={db.profile.photoUrl}
                  alt={db.profile.displayName}
                  className="h-14 w-14 rounded-full object-cover border-2 border-indigo-500 shadow-xs"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl shadow-xs">
                  {db.profile.displayName ? db.profile.displayName.charAt(0).toUpperCase() : 'D'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {db.profile.displayName}
                </h1>
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 font-medium">
                  {db.profile.nickname}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {db.profile.bio || 'Your private life companion'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Offline & Private on device</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              activeTab === 'profile'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <User className="h-4 w-4" />
            Profile & Identity
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              activeTab === 'preferences'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Preferences & Format
          </button>
          <button
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              activeTab === 'taxonomy'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Categories & Types
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              activeTab === 'backup'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-4 w-4" />
            Backup & Data
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Personal Profile
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
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="e.g. Aarav"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Personal Bio / Life Intention
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What is your focus or personal motto?"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Device Name / Companion Label
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Personal iPhone"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Avatar / Profile Photo
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Choose File</span>
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

            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-xs transition-colors"
              >
                {profileSaved ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {profileSaved ? 'Profile Saved' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Quick Life Stats Summary */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-500" />
              Life Journal Milestones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {db.moments.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Moments Logged</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                  {db.memories.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Memories Preserved</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {db.activities.filter((a) => a.completed).length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Completed Tasks</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {db.finances.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Financial Entries</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES & FORMAT */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Visual Appearance & Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Choose your preferred interface theme. Changes take effect instantly and stay saved.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
              <button
                onClick={() => {
                  onUpdateSettings({ theme: 'light' });
                  showToast('Light mode active');
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  db.settings.theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Light Theme</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Clean, crisp daylight palette</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onUpdateSettings({ theme: 'dark' });
                  showToast('Dark mode active');
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  db.settings.theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="h-10 w-10 rounded-lg bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Dark Theme</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Deep slate midnight palette</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onUpdateSettings({ theme: 'system' });
                  showToast('System theme enabled');
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  db.settings.theme === 'system'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">System Sync</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Matches device settings</p>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Currency & Date Formats
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Tailor financial and calendar presentation to your regional preference.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency Display
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { code: 'INR', label: 'INR (₹)' },
                      { code: 'USD', label: 'USD ($)' },
                      { code: 'EUR', label: 'EUR (€)' },
                      { code: 'GBP', label: 'GBP (£)' },
                    ] as { code: CurrencyCode; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        onUpdateSettings({ currency: item.code });
                        showToast(`Currency changed to ${item.label}`);
                      }}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        db.settings.currency === item.code
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date Formatting
                </label>
                <div className="space-y-2">
                  {(
                    [
                      { style: 'dd-mmm-yyyy', label: '09 Oct 2026 (DD MMM YYYY)' },
                      { style: 'mmm-dd-yyyy', label: 'Oct 09, 2026 (MMM DD, YYYY)' },
                      { style: 'yyyy-mm-dd', label: '2026-10-09 (ISO Standard)' },
                    ] as { style: DateFormatStyle; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.style}
                      onClick={() => {
                        onUpdateSettings({ dateFormat: item.style });
                        showToast(`Date format set to ${item.style}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        db.settings.dateFormat === item.style
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & TAXONOMY */}
      {activeTab === 'taxonomy' && (
        <div className="space-y-6">
          {/* Moment Types */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Moment Occasion Types
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Toggle types on or off. Disabling an item hides it from new dropdowns without deleting past records.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {db.settings.momentTypes.map((type) => (
                <div
                  key={type.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    type.enabled
                      ? 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
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
                      title="Delete custom occasion"
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
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomTaxonomy('momentTypes', newMomentType, () => setNewMomentType(''))
                }
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Expense Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Categories used to categorize spending entries and budget trends.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {db.settings.expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    cat.enabled
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-400 line-through'
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
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomTaxonomy('expenseCategories', newExpenseCategory, () =>
                    setNewExpenseCategory('')
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Income Types */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Income Sources
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sources used to classify inbound cashflow and salary entries.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {db.settings.incomeTypes.map((inc) => (
                <div
                  key={inc.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    inc.enabled
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-400 line-through'
                  }`}
                >
                  <button
                    onClick={() => toggleTaxonomy('incomeTypes', inc.id)}
                    className="hover:underline"
                  >
                    {inc.name}
                  </button>
                  {!inc.isBuiltIn && (
                    <button
                      onClick={() => removeCustomTaxonomy('incomeTypes', inc.id)}
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
                placeholder="Add custom income type..."
                value={newIncomeType}
                onChange={(e) => setNewIncomeType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTaxonomy('incomeTypes', newIncomeType, () => setNewIncomeType(''));
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomTaxonomy('incomeTypes', newIncomeType, () => setNewIncomeType(''))
                }
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & DATA */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Download Backup */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Download Full JSON Backup
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Export your entire database into an encrypted-ready, human-readable JSON format.
                  Keep this file on your personal storage for complete peace of mind.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Download className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mb-4 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                id="includeAttachments"
                checked={includeAttachmentsInBackup}
                onChange={(e) => setIncludeAttachmentsInBackup(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="includeAttachments" className="cursor-pointer">
                Include attached photo data and base64 media (uncheck for a smaller, faster text-only backup)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Download className="h-4 w-4" />
                Download JSON Backup
              </button>

              {db.profile.lastBackupAt && (
                <span className="text-xs text-slate-400">
                  Last downloaded: {formatDate(db.profile.lastBackupAt.split('T')[0], db.settings.dateFormat)}
                </span>
              )}
            </div>
          </div>

          {/* CSV Exports */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Spreadsheet CSV Exports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Export specific areas into standard CSV files suitable for Microsoft Excel or Google Sheets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleExportCSV('moments')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Moments CSV</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {db.moments.length} occasions
                  </p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-indigo-500 shrink-0" />
              </button>

              <button
                onClick={() => handleExportCSV('finances')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Finances CSV</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {db.finances.length} records
                  </p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
              </button>

              <button
                onClick={() => handleExportCSV('memories')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Memories CSV</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {db.memories.length} entries
                  </p>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-violet-500 shrink-0" />
              </button>
            </div>
          </div>

          {/* Restore Database */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Restore from Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select a valid DN JSON backup file. You will see a detailed summary preview before anything is applied.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold cursor-pointer transition-colors">
              <Upload className="h-4 w-4 text-indigo-500" />
              <span>Select Backup File (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />
            </label>
          </div>

          {/* Workspace Controls & Reset */}
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">
              Workspace Presets & Reset
            </h2>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mb-4">
              Use sample data for testing, or reset the local database to an empty pristine state.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDemoConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
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

      {/* Restore Validation Modal */}
      {showRestoreModal && restoreValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {restoreValidation.valid ? 'Backup Verification Preview' : 'Invalid Backup File'}
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
                  The backup file is verified and ready to load. Here is the summary of contents that will replace your current workspace:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-400">Profile Name:</span>{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {restoreValidation.summary.profileName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Database Schema:</span>{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      v{restoreValidation.summary.version}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Moments:</span>{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {restoreValidation.summary.momentsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Activities:</span>{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {restoreValidation.summary.activitiesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Memories:</span>{' '}
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      {restoreValidation.summary.memoriesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Attachments:</span>{' '}
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      {restoreValidation.summary.attachmentsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Finances:</span>{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {restoreValidation.summary.financesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Greeting Cards:</span>{' '}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {restoreValidation.summary.greetingsCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreValidation(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs"
                  >
                    Apply & Restore Workspace
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                  {restoreValidation.error || 'The file provided does not conform to the DN database schema.'}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreValidation(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset All Local Data?"
        description="This will permanently delete all logged moments, activities, memories, attachments, and financial journal entries on this device. Make sure you downloaded a backup first."
        confirmLabel="Yes, Reset Everything"
        variant="danger"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetDatabase();
          showToast('Workspace reset to empty');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Demo Load Confirmation */}
      <ConfirmDialog
        open={showDemoConfirm}
        title="Load Sample Life Workspace?"
        description="This will replace your current local workspace with realistic sample moments (birthdays, festivals, trips), curated memory photos, task activities, and financial entries."
        confirmLabel="Load Sample Data"
        variant="primary"
        onConfirm={() => {
          setShowDemoConfirm(false);
          onLoadDemoDatabase();
          showToast('Sample workspace loaded');
        }}
        onCancel={() => setShowDemoConfirm(false)}
      />
    </div>
  );
};
