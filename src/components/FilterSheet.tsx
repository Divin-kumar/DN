import React from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';

interface FilterSheetProps {
  open: boolean;
  title?: string;
  activeCount?: number;
  onClose: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  open,
  title = 'Filter & Sort',
  activeCount = 0,
  onClose,
  onReset,
  children,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#19211B] border border-[#DFE4DC] dark:border-[#303B32] shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Grab Handle for iOS Touch */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DFE4DC]/80 dark:border-[#303B32]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#286747] dark:text-[#70A987]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            {activeCount > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]">
                {activeCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-md transition-colors"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {children}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DFE4DC]/80 dark:border-[#303B32] bg-slate-50/50 dark:bg-[#202A22]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold shadow-xs transition-colors text-center"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};
