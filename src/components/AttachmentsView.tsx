import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Link2,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AttachmentKind,
  AttachmentRecord,
  DNDatabase,
} from '../types/dn';
import { formatDate } from '../utils/dnHelpers';
import { ConfirmDialog } from './ConfirmDialog';
import { FilterSheet } from './FilterSheet';
import { QuickCreateMode } from './QuickCreateModal';

interface AttachmentsViewProps {
  db: DNDatabase;
  onOpenQuickCreate: (mode: QuickCreateMode) => void;
  onEditAttachment: (attachment: AttachmentRecord) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onNavigateToEvent?: (momentId: string) => void;
}

export const AttachmentsView: React.FC<AttachmentsViewProps> = ({
  db,
  onOpenQuickCreate,
  onEditAttachment,
  onDeleteAttachment,
  onNavigateToEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | AttachmentKind>('all');
  const [linkFilter, setLinkFilter] = useState<'all' | 'unlinked' | 'linked'>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AttachmentRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AttachmentRecord | null>(null);

  const activeFiltersCount = (kindFilter !== 'all' ? 1 : 0) + (linkFilter !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    setKindFilter('all');
    setLinkFilter('all');
    setSearchQuery('');
  };

  const filteredAttachments = db.attachments.filter((att) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = att.name.toLowerCase().includes(q);
      const matchDesc = (att.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    if (kindFilter !== 'all' && att.kind !== kindFilter) return false;

    if (linkFilter === 'unlinked' && (att.momentId || att.activityId)) return false;
    if (linkFilter === 'linked' && !att.momentId && !att.activityId) return false;

    return true;
  });

  const getKindIcon = (kind: AttachmentKind) => {
    switch (kind) {
      case 'photo':
      case 'camera':
        return <ImageIcon className="h-4 w-4 text-[#286747] dark:text-[#70A987]" />;
      case 'link':
        return <ExternalLink className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case 'document':
      default:
        return <FileText className="h-4 w-4 text-[#286747] dark:text-[#70A987]" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* 1. Header with Exactly 1 Primary Action */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attachments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {db.attachments.length} files saved · Private document & photo library
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickCreate('attachment')}
          className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Add File</span>
        </button>
      </div>

      {/* 2. Search + Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attachments..."
            className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#19211B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#286747]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
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
      </div>

      {/* Active Filter Strip */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Showing:</span>
            {kindFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium capitalize">
                {kindFilter}
              </span>
            )}
            {linkFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {linkFilter === 'unlinked' ? 'Independent only' : 'Linked to events'}
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

      {/* Filter Bottom Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        activeCount={activeFiltersCount}
        onClose={() => setFilterSheetOpen(false)}
        onReset={handleResetFilters}
        title="Filter Attachments"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              File Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'photo', label: 'Photos & Images' },
                { id: 'document', label: 'Documents & PDFs' },
                { id: 'link', label: 'Web Links' },
              ].map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKindFilter(k.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                    kindFilter === k.id
                      ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Occasion Association
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'unlinked', label: 'Independent' },
                { id: 'linked', label: 'Linked' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLinkFilter(l.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-colors ${
                    linkFilter === l.id
                      ? 'bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSheet>

      {/* Grid of Attachments */}
      {filteredAttachments.length === 0 ? (
        <div className="dn-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#286747] dark:text-[#70A987] flex items-center justify-center mx-auto mb-3">
            <Paperclip className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery || activeFiltersCount > 0
              ? 'No matching files found'
              : 'Attachment vault is empty'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || activeFiltersCount > 0
              ? 'Try adjusting your search terms or filters.'
              : 'Store documents, trip tickets, photos, or reference links safely.'}
          </p>
          <div className="mt-4">
            {searchQuery || activeFiltersCount > 0 ? (
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
                onClick={() => onOpenQuickCreate('attachment')}
                className="px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold shadow-xs"
              >
                + Add File
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredAttachments.map((att) => {
            const isImage = att.kind === 'photo' || att.kind === 'camera';
            const linkedMoment = att.momentId
              ? db.moments.find((m) => m.id === att.momentId)
              : null;
            const fileSize = formatFileSize(att.sizeBytes);

            return (
              <div
                key={att.id}
                className="dn-card overflow-hidden hover:border-[#286747]/50 dark:hover:border-[#70A987]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  {isImage && att.url && (
                    <div
                      onClick={() => setPreviewItem(att)}
                      className="relative h-36 bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                    </div>
                  )}

                  <div className="p-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getKindIcon(att.kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          onClick={() => setPreviewItem(att)}
                          className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
                        >
                          {att.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="capitalize">{att.kind}</span>
                          {fileSize && <span>· {fileSize}</span>}
                          <span>· {formatDate(att.createdAt.split('T')[0], db.settings.dateFormat)}</span>
                        </div>
                      </div>
                    </div>

                    {att.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {att.description}
                      </p>
                    )}

                    {linkedMoment && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 text-[11px] text-[#286747] dark:text-[#70A987]">
                        <Link2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">Event: {linkedMoment.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3.5 py-2 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(att)}
                    className="text-xs font-semibold text-[#286747] dark:text-[#70A987] hover:underline"
                  >
                    View
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditAttachment(att)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(att)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg dn-card p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {previewItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3.5">
              {previewItem.kind === 'photo' && previewItem.url && (
                <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-80">
                  <img
                    src={previewItem.url}
                    alt={previewItem.name}
                    className="max-h-80 w-auto object-contain"
                  />
                </div>
              )}

              {previewItem.kind === 'link' && previewItem.url && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400 mb-1">Target Web URL</p>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#286747] dark:text-[#70A987] break-all hover:underline flex items-center gap-1.5"
                  >
                    <span>{previewItem.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {previewItem.description && (
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {previewItem.description}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {previewItem.url && (
                  <a
                    href={previewItem.url}
                    download={previewItem.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(itemToDelete)}
        title="Delete Attachment?"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? Linked occasions or activities will remain intact.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteAttachment(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
