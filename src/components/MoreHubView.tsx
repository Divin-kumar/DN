import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Database,
  Download,
  Gift,
  Heart,
  Moon,
  Paperclip,
  Palette,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  User,
  Wallet,
} from 'lucide-react';
import { DNDatabase, PrimarySection } from '../types/dn';

interface MoreHubViewProps {
  db: DNDatabase;
  onNavigate: (section: PrimarySection) => void;
  onUpdateSettings: (settings: Partial<DNDatabase['settings']>) => void;
  onExportJson: () => void;
}

export const MoreHubView: React.FC<MoreHubViewProps> = ({
  db,
  onNavigate,
  onUpdateSettings,
  onExportJson,
}) => {
  const { profile, settings } = db;
  const userName = profile.nickname || profile.displayName || 'Friend';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Profile & Hub Header */}
      <div className="dn-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={userName}
                className="w-13 h-13 rounded-2xl object-cover border border-[#DFE4DC] dark:border-[#303B32] shrink-0"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-[#286747]/10 dark:bg-[#70A987]/15 text-[#286747] dark:text-[#70A987] flex items-center justify-center shrink-0 border border-[#286747]/20">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {userName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile.bio || 'Personal Life Companion'}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span>{profile.deviceName || 'Personal device'}</span>
                <span>·</span>
                <span>Private & local</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick theme toggle */}
            <button
              type="button"
              onClick={() => {
                const next = settings.theme === 'dark' ? 'light' : 'dark';
                onUpdateSettings({ theme: next });
              }}
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Toggle dark/light mode"
            >
              {settings.theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[#286747]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Additional Modules Section */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Personal Life Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Memories & Journal */}
          <button
            type="button"
            onClick={() => onNavigate('memories')}
            className="dn-card p-4.5 text-left hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex items-start justify-between group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-900/40">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors">
                  Memories & Journal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Private reflections, photographs, and saved moments.
                </p>
                <div className="mt-2 text-[11px] font-medium text-[#286747] dark:text-[#70A987]">
                  {db.memories.length} {db.memories.length === 1 ? 'memory' : 'memories'} saved →
                </div>
              </div>
            </div>
          </button>

          {/* Attachments & Files */}
          <button
            type="button"
            onClick={() => onNavigate('attachments')}
            className="dn-card p-4.5 text-left hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex items-start justify-between group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-900/40">
                <Paperclip className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors">
                  Attachments & Files
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Store reservations, documents, images, and web links.
                </p>
                <div className="mt-2 text-[11px] font-medium text-[#286747] dark:text-[#70A987]">
                  {db.attachments.length} {db.attachments.length === 1 ? 'file' : 'files'} in library →
                </div>
              </div>
            </div>
          </button>

          {/* Greetings Studio */}
          <button
            type="button"
            onClick={() => onNavigate('memories')}
            className="dn-card p-4.5 text-left hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex items-start justify-between group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-900/40">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors">
                  Greetings Studio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Personal card generator for birthdays and celebrations.
                </p>
                <div className="mt-2 text-[11px] font-medium text-[#286747] dark:text-[#70A987]">
                  {db.greetings.length} cards crafted →
                </div>
              </div>
            </div>
          </button>

          {/* Financial Overview */}
          <button
            type="button"
            onClick={() => onNavigate('finances')}
            className="dn-card p-4.5 text-left hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex items-start justify-between group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-900/40">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors">
                  Finances & Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Occasion budgets, category insights, and transactions.
                </p>
                <div className="mt-2 text-[11px] font-medium text-[#286747] dark:text-[#70A987]">
                  {db.finances.length} transactions recorded →
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Preferences & Data Vault */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Preferences & Data Security
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Customization & Appearance */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="dn-card p-4.5 text-left hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors">
                Appearance & Palettes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Botanical green shades, card density, typography, and theme.
              </p>
            </div>
          </button>

          {/* Backup & Vault */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="dn-card p-4.5 text-left hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#286747] dark:text-[#70A987]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#286747] dark:group-hover:text-[#70A987] transition-colors">
                Data Backup & Restore
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Export encrypted JSON, download CSVs, or restore backups.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick 1-Tap Backup Button */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-[#286747] dark:text-[#70A987] shrink-0" />
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Instant Local Backup
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Save your entire life workspace as a private JSON file.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExportJson}
          className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] text-white dark:text-[#101612] text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Backup</span>
        </button>
      </div>
    </div>
  );
};
