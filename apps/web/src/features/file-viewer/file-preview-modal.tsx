'use client';

import { PublicShareLinkButton } from '@/components/projects/public-share-link-button';
import { Button } from '@/components/ui/button';
import { errorToast, successToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { dialogContentZ, dialogOverlayZ, useDialogDepth } from '@/lib/z-stack';
import {
  CaretLeftIcon as ChevronLeft,
  CaretRightIcon as ChevronRight,
  CodeIcon as Code,
  DownloadIcon as Download,
  EyeIcon as Eye,
  ClockCounterClockwiseIcon as History,
  ArrowsOutSimpleIcon as Maximize2,
  ArrowsInSimpleIcon as Minimize2,
  XIcon as X,
  FileCodeIcon,
  TableIcon,
  FileDocIcon,
  FilePdfIcon,
  PrinterIcon,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { FileContentRenderer, getLanguageFromExt } from './file-content-renderer';
import { FileSourceProvider, type FileSource } from './file-source';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface FilePreviewState {
  selectedFilePath: string | null;
  panelMode: 'welcome' | 'viewer' | 'history';
  filePathList: string[];
  currentFileIndex: number;
}

export interface FilePreviewModalProps extends FilePreviewState {
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  source: FileSource;
  HistoryContent: ComponentType<{ filePath: string; onClose: () => void }>;
  renderFileIcon: (fileName: string) => ReactNode;
  statusSlot?: ReactNode;
  extraActions?: ReactNode;
  shareContext?: { projectId: string; sessionId: string };
  historyLabel?: string;
  embedded?: boolean;
}

export function FilePreviewModal({
  selectedFilePath,
  panelMode,
  filePathList,
  currentFileIndex,
  onClose,
  onNext,
  onPrev,
  source,
  HistoryContent,
  renderFileIcon,
  statusSlot,
  extraActions,
  shareContext,
  historyLabel = 'History',
  embedded = false,
}: FilePreviewModalProps) {
  const tI18nHardcoded = useTranslations('hardcodedUi');
  const dialogDepth = useDialogDepth();
  const isOpen = panelMode === 'viewer' && !!selectedFilePath;

  const fileName = selectedFilePath?.split('/').pop() || '';
  const hasNext = currentFileIndex < filePathList.length - 1;
  const hasPrev = currentFileIndex > 0;

  const [expanded, setExpanded] = useState(false);
  const fullscreen = !embedded || expanded;

  const [historyPath, setHistoryPath] = useState<string | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState(true);
  const isMarkdownFile = getLanguageFromExt(fileName) === 'markdown';

  // Read file data safely using the source hook
  const fileContentResult = source.useFileContent(selectedFilePath);
  const rawContent = fileContentResult?.data?.content || '';

  // Format switcher: 'json' | 'csv' | 'markdown' | 'pdf'
  const [activeFormat, setActiveFormat] = useState<'json' | 'csv' | 'markdown' | 'pdf'>('json');

  const isDataFile = useMemo(() => {
    if (!selectedFilePath) return false;
    const pathLower = selectedFilePath.toLowerCase();
    return (
      pathLower.includes('campaigns/') ||
      pathLower.endsWith('.json') ||
      pathLower.endsWith('.csv') ||
      pathLower.endsWith('.md')
    );
  }, [selectedFilePath]);

  useEffect(() => {
    if (selectedFilePath?.endsWith('.csv')) setActiveFormat('csv');
    else if (selectedFilePath?.endsWith('.md')) setActiveFormat('markdown');
    else setActiveFormat('json');
  }, [selectedFilePath]);

  // Parse structured data safely
  const parsedData = useMemo(() => {
    if (!rawContent) return null;
    try {
      const trimmed = rawContent.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.leads && Array.isArray(parsed.leads)) return parsed.leads;
        return [parsed];
      }
    } catch {}

    if (rawContent.includes('\n') && rawContent.includes(',')) {
      const lines = rawContent.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map((h) => h.replace(/(^"|"$)/g, '').trim());
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.replace(/(^"|"$)/g, '').trim());
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i] || '';
          });
          return obj;
        });
        return rows;
      }
    }
    return null;
  }, [rawContent]);

  // Generate representation for each format
  const formattedViews = useMemo(() => {
    if (!rawContent) return { json: '', csv: '', md: '', rows: [] as any[] };

    let rows: any[] = parsedData || [];
    let json = rawContent;
    try {
      json = JSON.stringify(JSON.parse(rawContent), null, 2);
    } catch {}

    let csv = rawContent;
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      csv = [
        keys.join(','),
        ...rows.map((r) => keys.map((k) => `"${r[k] ?? ''}"`).join(',')),
      ].join('\n');
    }

    let md = rawContent;
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]).slice(0, 6);
      md = [
        `# ${fileName}`,
        `*Total Records: ${rows.length}*`,
        '',
        `| ${keys.join(' | ')} |`,
        `| ${keys.map(() => '---').join(' | ')} |`,
        ...rows.map((r) => `| ${keys.map((k) => r[k] ?? '—').join(' | ')} |`),
      ].join('\n');
    }

    return { json, csv, md, rows };
  }, [rawContent, parsedData, fileName]);

  const handleDownload = useCallback(async () => {
    if (!selectedFilePath) return;
    const baseName = fileName.replace(/\.[^/.]+$/, '');

    try {
      if (activeFormat === 'json') {
        const blob = new Blob([formattedViews.json || rawContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.json`;
        a.click();
        successToast(`Downloaded ${baseName}.json`);
      } else if (activeFormat === 'csv') {
        const blob = new Blob([formattedViews.csv || rawContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.csv`;
        a.click();
        successToast(`Downloaded ${baseName}.csv`);
      } else if (activeFormat === 'markdown') {
        const blob = new Blob([formattedViews.md || rawContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.md`;
        a.click();
        successToast(`Downloaded ${baseName}.md`);
      } else if (activeFormat === 'pdf') {
        window.print();
      } else {
        await source.download(selectedFilePath, fileName);
        successToast(`Downloaded ${fileName}`);
      }
    } catch {
      errorToast(`Failed to download ${fileName}`);
    }
  }, [selectedFilePath, fileName, activeFormat, formattedViews, rawContent, source]);

  const shareInput = useMemo(() => {
    if (!selectedFilePath || !shareContext) return null;
    return {
      file: {
        label: fileName || selectedFilePath,
        path: selectedFilePath,
      },
      mode: 'view' as const,
    };
  }, [fileName, selectedFilePath, shareContext]);

  const surfaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistoryPath(null);
    setMarkdownPreview(true);
    setExpanded(false);
  }, [selectedFilePath]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (historyPath) setHistoryPath(null);
        else if (embedded && expanded) setExpanded(false);
        else onClose();
        return;
      }
      if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNext();
        return;
      }
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onPrev();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev, historyPath, embedded, expanded]);

  const contentRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const toolbar = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
          onClick={onClose}
          title="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          {renderFileIcon(fileName)}
          <span
            className="max-w-[220px] truncate text-sm font-medium"
            title={selectedFilePath ?? ''}
          >
            {fileName}
          </span>
        </div>
        {statusSlot}

        {/* MULTI-FORMAT SWITCHER PILLS (JSON, CSV Table, Markdown, PDF) */}
        {isDataFile && (
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs ml-2 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveFormat('json')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                activeFormat === 'json'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileCodeIcon className="size-3.5 text-blue-400" />
              JSON
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('csv')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                activeFormat === 'csv'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <TableIcon className="size-3.5 text-emerald-400" />
              CSV Table
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('markdown')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                activeFormat === 'markdown'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileDocIcon className="size-3.5 text-purple-400" />
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('pdf')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                activeFormat === 'pdf'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FilePdfIcon className="size-3.5 text-red-400" />
              PDF View
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-medium"
          onClick={handleDownload}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
          Download {isDataFile ? `.${activeFormat === 'markdown' ? 'md' : activeFormat}` : ''}
        </Button>

        {shareContext && (
          <PublicShareLinkButton
            projectId={shareContext.projectId}
            sessionId={shareContext.sessionId}
            input={shareInput}
            tooltip="Copy Public Link"
            className="text-muted-foreground hover:text-foreground"
          />
        )}
        {extraActions}
        {embedded && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse to panel' : 'Expand'}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
        <div className="bg-border/50 mx-1 h-5 w-px" />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-8 w-8"
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </>
  );

  const body = (
    <>
      {hasPrev && (
        <button
          onClick={onPrev}
          className="bg-background/95 border-border/60 hover:bg-background absolute top-1/2 left-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border opacity-70 shadow-sm backdrop-blur transition-all hover:opacity-100"
          title="Previous File"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="bg-background/95 border-border/60 hover:bg-background absolute top-1/2 right-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border opacity-70 shadow-sm backdrop-blur transition-all hover:opacity-100"
          title="Next File"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div className="h-full w-full overflow-auto p-4">
        {/* 1. CSV TABLE VIEW */}
        {isDataFile && activeFormat === 'csv' && formattedViews.rows.length > 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    {Object.keys(formattedViews.rows[0]).map((col) => (
                      <th key={col} className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {formattedViews.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      {Object.keys(formattedViews.rows[0]).map((col) => (
                        <td key={col} className="px-4 py-2.5 text-[11px]">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : isDataFile && activeFormat === 'markdown' ? (
          /* 2. MARKDOWN VIEW */
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-4xl mx-auto space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold text-foreground">{fileName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Markdown Report Format</p>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground bg-muted/20 p-4 rounded-lg border border-border/60">
              {formattedViews.md}
            </pre>
          </div>
        ) : isDataFile && activeFormat === 'pdf' ? (
          /* 3. PDF PRINTABLE PREVIEW */
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
              <span className="text-xs font-medium text-muted-foreground">PDF Document Format (A4 Layout)</span>
              <Button size="sm" onClick={() => window.print()} className="h-7 text-xs gap-1.5">
                <PrinterIcon className="size-3.5" />
                Print / Save PDF
              </Button>
            </div>

            <div className="rounded-xl border border-border/80 bg-white text-black p-8 shadow-xl space-y-6">
              <div className="border-b border-neutral-200 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-black">{fileName}</h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Google Maps Lead Intelligence Report · Generated {new Date().toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-neutral-100 rounded-md font-mono font-medium">
                  {formattedViews.rows.length} Leads
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-neutral-200">
                  <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-700">
                    <tr>
                      <th className="p-2 border border-neutral-200">#</th>
                      <th className="p-2 border border-neutral-200">Place / Business</th>
                      <th className="p-2 border border-neutral-200">Gmail / Email</th>
                      <th className="p-2 border border-neutral-200">Category</th>
                      <th className="p-2 border border-neutral-200">Phone</th>
                      <th className="p-2 border border-neutral-200">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800">
                    {formattedViews.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="p-2 border border-neutral-200 font-mono text-[10px]">{i + 1}</td>
                        <td className="p-2 border border-neutral-200 font-medium">{row.name || row.company || '—'}</td>
                        <td className="p-2 border border-neutral-200 text-[11px]">{row.email || '—'}</td>
                        <td className="p-2 border border-neutral-200">{row.category || row.industry || '—'}</td>
                        <td className="p-2 border border-neutral-200 text-[11px]">{row.phone || '—'}</td>
                        <td className="p-2 border border-neutral-200 text-[11px]">{row.address || row.location || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* 4. DEFAULT CODE / JSON VIEW */
          <FileSourceProvider value={source}>
            <FileContentRenderer
              filePath={selectedFilePath!}
              showHeader={false}
              readOnly
              markdownPreview={markdownPreview}
              onMarkdownPreviewChange={setMarkdownPreview}
            />
          </FileSourceProvider>
        )}
      </div>

      {historyPath && (
        <div className="bg-popover border-border/60 animate-in slide-in-from-bottom-4 fade-in-0 absolute right-4 bottom-4 z-30 overflow-hidden rounded-2xl border shadow-2xl duration-150">
          <HistoryContent filePath={historyPath} onClose={() => setHistoryPath(null)} />
        </div>
      )}
    </>
  );

  const panelInner = (
    <>
      <div className="border-border/40 bg-background/95 flex h-12 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-sm">
        {toolbar}
      </div>
      <div ref={contentRef} className="relative min-h-0 flex-1 overflow-hidden">
        {body}
      </div>
    </>
  );

  if (embedded && !expanded) {
    return (
      <div
        ref={surfaceRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={fileName}
        className="border-border/60 bg-background relative flex h-full w-full flex-col overflow-hidden outline-none"
      >
        {panelInner}
      </div>
    );
  }

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 flex flex-col"
      style={{ zIndex: dialogContentZ(dialogDepth) }}
    >
      <div
        className="bg-background/80 fixed inset-0 backdrop-blur-md transition-opacity duration-150"
        style={{ zIndex: dialogOverlayZ(dialogDepth) }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={surfaceRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={fileName}
        className="border-border bg-background relative z-10 m-auto flex h-[92vh] w-[95vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none"
      >
        {panelInner}
      </div>
    </div>,
    document.body,
  );
}
