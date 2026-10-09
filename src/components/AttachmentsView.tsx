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
  const [previewItem, setPreviewItem] = useState<AttachmentRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AttachmentRecord | null>(null);

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
        return <ImageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'link':
        return <ExternalLink className="h-5 w-5 text-sky-600 dark:text-sky-400" />;
      case 'document':
      default:
        return <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="dn-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Attachments & Document Library
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 tabular-nums">
                {db.attachments.length} files
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Store files, photos, vouchers, and web links privately. Reference them in events or activities whenever desired.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQuickCreate('attachment')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#286747] dark:bg-[#70A987] hover:bg-[#194A35] dark:hover:bg-[#84BD9A] text-white dark:text-[#101612] text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Add File / Link</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="relative sm:col-span-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search attachments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#286747]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All File Types</option>
              <option value="photo">Photos & Images</option>
              <option value="document">Documents & PDFs</option>
              <option value="link">Web Links & URLs</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={linkFilter}
              onChange={(e) => setLinkFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Items</option>
              <option value="unlinked">Independent Only</option>
              <option value="linked">Linked to Occasions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Attachments */}
      {filteredAttachments.length === 0 ? (
        <div className="dn-card p-10 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Paperclip className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery || kindFilter !== 'all'
              ? 'No matching files found'
              : 'Your attachment vault is empty'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Upload personal documents, trip reservations, photos, or reference links for safe local keeping.
          </p>
          <button
            onClick={() => onOpenQuickCreate('attachment')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612]"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredAttachments.map((att) => {
            const isImage = att.kind === 'photo' || att.kind === 'camera';
            const linkedMoment = att.momentId
              ? db.moments.find((m) => m.id === att.momentId)
              : null;
            const fileSize = formatFileSize(att.sizeBytes);

            return (
              <div
                key={att.id}
                className="dn-card overflow-hidden flex flex-col justify-between hover:border-[#286747]/40 dark:hover:border-[#70A987]/40 transition-all group"
              >
                <div>
                  {/* Photo Preview Banner if Image */}
                  {isImage && att.url && (
                    <div
                      onClick={() => setPreviewItem(att)}
                      className="h-36 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer relative"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="h-5 w-5 drop-shadow" />
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getKindIcon(att.kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          onClick={() => setPreviewItem(att)}
                          className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:underline"
                        >
                          {att.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="capitalize">{att.kind}</span>
                          {fileSize && <span>• {fileSize}</span>}
                          <span>• {formatDate(att.createdAt.split('T')[0], db.settings.dateFormat)}</span>
                        </div>
                      </div>
                    </div>

                    {att.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {att.description}
                      </p>
                    )}

                    {/* Linked Context Pill if applicable */}
                    {linkedMoment && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-[#286747] dark:text-[#70A987]">
                        <Link2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Occasion: {linkedMoment.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setPreviewItem(att)}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditAttachment(att)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setItemToDelete(att)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xl dn-card p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {previewItem.name}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {previewItem.kind === 'photo' && previewItem.url && (
                <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-96">
                  <img
                    src={previewItem.url}
                    alt={previewItem.name}
                    className="max-h-96 w-auto object-contain"
                  />
                </div>
              )}

              {previewItem.kind === 'link' && previewItem.url && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Target URL</p>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 break-all hover:underline flex items-center gap-1.5"
                  >
                    <span>{previewItem.url}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>
              )}

              {previewItem.description && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Description & Notes
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {previewItem.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400">Category:</span>{' '}
                  <span className="capitalize font-medium">{previewItem.kind}</span>
                </div>
                <div>
                  <span className="text-slate-400">Added:</span>{' '}
                  <span>{formatDate(previewItem.createdAt.split('T')[0], db.settings.dateFormat)}</span>
                </div>
                {previewItem.mimeType && (
                  <div>
                    <span className="text-slate-400">MIME:</span>{' '}
                    <span className="font-mono text-[11px]">{previewItem.mimeType}</span>
                  </div>
                )}
                {previewItem.sizeBytes && (
                  <div>
                    <span className="text-slate-400">File Size:</span>{' '}
                    <span>{formatFileSize(previewItem.sizeBytes)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {previewItem.url && (
                  <a
                    href={previewItem.url}
                    download={previewItem.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#286747] dark:bg-[#70A987] text-white dark:text-[#101612] text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download / Open</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
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
        description={`Are you sure you want to delete "${itemToDelete?.name}"? Any linked occasions or activities referencing it will remain intact.`}
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
