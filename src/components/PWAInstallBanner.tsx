import React, { useState } from 'react';
import { Download, RefreshCw, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable ? (
        <button
          type="button"
          onClick={install}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 font-medium text-white hover:bg-indigo-700 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 ${
            compact ? 'min-h-[40px] px-3.5 py-2 text-xs' : 'min-h-[44px] px-4 py-2.5 text-sm'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install DN</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 ${
            compact ? 'min-h-[40px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-4 py-2.5 text-sm'
          }`}
        >
          <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{isIOS ? 'Install on iPhone' : 'Install App'}</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Install DN on Your Device
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add DN to your home screen for instant launch and full offline reliability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Close installation guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  iOS / iPadOS (Safari)
                </p>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  1. Tap the <strong>Share</strong> icon in the Safari bottom bar.<br />
                  2. Scroll down and select <strong>Add to Home Screen</strong>.<br />
                  3. Tap <strong>Add</strong> in the top-right corner.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Android & Desktop (Chrome / Edge)
                </p>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  1. Open the browser menu or address bar install icon.<br />
                  2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const ConnectivityAndUpdateBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { needRefresh, applyUpdate } = usePWAInstall();

  if (isOnline && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex flex-col gap-2 max-w-sm">
      {!isOnline && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode · All changes are saved locally on this device.</span>
        </div>
      )}

      {needRefresh && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 dark:bg-indigo-950 border border-slate-700 dark:border-indigo-700 px-4 py-2.5 text-xs text-white shadow-lg">
          <span>A newer version of DN is ready.</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update</span>
          </button>
        </div>
      )}
    </div>
  );
};
