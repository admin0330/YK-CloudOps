import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Lock,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../api/client';

type DiskEntry = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modifiedAt: string;
  downloadUrl?: string | null;
};

type SelectedUpload = {
  file: File;
  relativePath: string;
};

type UploadProgress = {
  totalBytes: number;
  uploadedBytes: number;
  speedBps: number;
  currentFile: string;
  currentFileBytes: number;
  currentFileUploadedBytes: number;
  totalFiles: number;
  completedFiles: number;
  percent: number;
};


type DiskPreviewKind = 'text' | 'markdown' | 'html' | 'pdf' | 'image' | 'office' | 'unsupported';

type DiskPreview = {
  name: string;
  path: string;
  size: number;
  kind: DiskPreviewKind;
  previewable: boolean;
};

const PREVIEWABLE_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'log', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm',
  'xml', 'yaml', 'yml', 'ini', 'conf', 'env', 'sh', 'bat', 'ps1', 'py', 'java', 'c', 'cpp', 'h',
  'hpp', 'go', 'rs', 'sql', 'csv', 'toml', 'vue', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp',
  'svg', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp',
]);

function canPreviewFile(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() || '';
  return PREVIEWABLE_EXTENSIONS.has(extension);
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800">{part.slice(1, -1)}</code>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function MarkdownPreview({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const nodes: JSX.Element[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (inCode) {
        nodes.push(<pre key={`code-${index}`} className="my-4 overflow-auto rounded-2xl border border-white/10 bg-white/45 p-4 text-xs leading-6 text-slate-700"><code>{codeLines.join('\n')}</code></pre>);
        codeLines = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const className = level === 1 ? 'mt-7 text-3xl' : level === 2 ? 'mt-6 text-2xl' : 'mt-5 text-xl';
      nodes.push(<div key={`heading-${index}`} className={`${className} font-semibold tracking-tight text-slate-800`}>{renderInlineMarkdown(heading[2])}</div>);
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      nodes.push(<div key={`list-${index}`} className="ml-5 list-item list-disc py-0.5 leading-7 text-slate-700">{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</div>);
      return;
    }
    if (line.startsWith('> ')) {
      nodes.push(<blockquote key={`quote-${index}`} className="my-2 border-l-2 border-primary/30 pl-4 leading-7 text-slate-500">{renderInlineMarkdown(line.slice(2))}</blockquote>);
      return;
    }
    if (!line.trim()) {
      nodes.push(<div key={`space-${index}`} className="h-3" />);
      return;
    }
    nodes.push(<p key={`paragraph-${index}`} className="leading-7 text-slate-700">{renderInlineMarkdown(line)}</p>);
  });

  if (codeLines.length) {
    nodes.push(<pre key="code-final" className="my-4 overflow-auto rounded-2xl border border-white/10 bg-white/45 p-4 text-xs leading-6 text-slate-700"><code>{codeLines.join('\n')}</code></pre>);
  }

  return <div className="mx-auto max-w-4xl px-1 py-2 text-sm sm:px-4 sm:text-base">{nodes}</div>;
}

const ease = [0.16, 1, 0.3, 1] as const;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatSpeed(bytesPerSecond: number) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const index = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), units.length - 1);
  return `${(bytesPerSecond / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function parentPath(path: string) {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

export default function DiskPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [entries, setEntries] = useState<DiskEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedUploads, setSelectedUploads] = useState<SelectedUpload[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadPaused, setUploadPaused] = useState(false);
  const [pickerNotice, setPickerNotice] = useState('');
  const [preview, setPreview] = useState<DiskPreview | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadTaskRef = useRef<{ pause: () => void; resume: () => void; suspend: () => void; cancel: () => Promise<void>; isPaused: () => boolean; isCancelled: () => boolean } | null>(null);

  const files = entries.filter((entry) => entry.type === 'file');
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const filteredEntries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(keyword));
  }, [entries, query]);
  const selectedSize = selectedUploads.reduce((sum, item) => sum + item.file.size, 0);
  const crumbs = currentPath.split('/').filter(Boolean);

  const clearUploadHideTimer = () => {
    if (uploadHideTimerRef.current) {
      clearTimeout(uploadHideTimerRef.current);
      uploadHideTimerRef.current = null;
    }
  };

  useEffect(() => () => {
    clearUploadHideTimer();
    // A refresh or tab close must preserve uploaded chunks for breakpoint
    // resume. Only an explicit Cancel upload action removes server data.
    uploadTaskRef.current?.suspend();
  }, []);

  const loadEntries = async (path = currentPath) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDiskFiles(path);
      setEntries(data.entries || []);
      setCurrentPath(data.path || '');
      setUnlocked(true);
    } catch (err: any) {
      if (String(err.message || '').toLowerCase().includes('locked')) {
        setUnlocked(false);
      } else {
        setError(err.message || 'Failed to load files');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    api.getDiskSession()
      .then((data) => {
        if (!mounted) return;
        setUnlocked(Boolean(data.unlocked));
        if (data.unlocked) {
          loadEntries('');
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const unlockDisk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.unlockDisk(unlockPassword);
      setUnlockPassword('');
      setUnlocked(true);
      await loadEntries('');
    } catch (err: any) {
      setError(err.message || 'Invalid password');
    } finally {
      setBusy(false);
    }
  };

  const lockDisk = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.lockDisk();
      setUnlocked(false);
      setEntries([]);
      setCurrentPath('');
      setSelectedUploads([]);
      setUploadProgress(null);
      setUploadPaused(false);
      await uploadTaskRef.current?.cancel();
      uploadTaskRef.current = null;
      closePreview();
      clearUploadHideTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to lock disk');
    } finally {
      setBusy(false);
    }
  };

  const pickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const picked = files.map((file) => ({
      file,
      relativePath: currentPath ? `${currentPath}/${file.name}` : file.name,
    }));
    setSelectedUploads(picked);
    setPickerNotice('');
    setMessage('');
    setError('');
    setUploadProgress(null);
    clearUploadHideTimer();
  };

  const pickFolder = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      setPickerNotice('This mobile browser did not return folder contents. Use Select files to choose multiple items, or upload the folder as a ZIP to preserve its structure.');
      return;
    }
    const picked = files.map((file) => {
      const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      return {
        file,
        relativePath: currentPath ? `${currentPath}/${relative}` : relative,
      };
    });
    setSelectedUploads(picked);
    setPickerNotice(
      picked.some((item) => item.relativePath.includes('/'))
        ? ''
        : 'The browser returned files without folder paths. They will be uploaded into the current folder. Upload a ZIP when the original hierarchy must be preserved.',
    );
    setMessage('');
    setError('');
    setUploadProgress(null);
    clearUploadHideTimer();
  };

  const resetUploadInputs = () => {
    setSelectedUploads([]);
    setUploadProgress(null);
    clearUploadHideTimer();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const uploadFiles = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    clearUploadHideTimer();

    if (!selectedUploads.length) {
      setError('Select files or a folder first');
      return;
    }

    setBusy(true);
    setUploadProgress({
      totalBytes: selectedUploads.reduce((sum, item) => sum + item.file.size, 0),
      uploadedBytes: 0,
      speedBps: 0,
      currentFile: '',
      currentFileBytes: 0,
      currentFileUploadedBytes: 0,
      totalFiles: selectedUploads.length,
      completedFiles: 0,
      percent: 0,
    });
    let uploadSucceeded = false;
    try {
      const task = api.createDiskUploadTask(
        selectedUploads,
        (progress) => setUploadProgress(progress),
        ({ paused }) => setUploadPaused(paused),
      );
      uploadTaskRef.current = task;
      await task.promise;
      uploadSucceeded = true;
      setMessage(`Uploaded ${selectedUploads.length} file${selectedUploads.length > 1 ? 's' : ''}`);
      resetUploadInputs();
      await loadEntries(currentPath);
    } catch (err: any) {
      if (err?.name === 'UploadCancelledError' || err?.message === 'Upload cancelled') {
        setMessage('Upload cancelled. Temporary chunks were removed.');
        setError('');
        resetUploadInputs();
        await loadEntries(currentPath);
      } else {
        setError(err.message || 'Upload failed');
      }
    } finally {
      uploadTaskRef.current = null;
      setUploadPaused(false);
      setBusy(false);
      if (uploadSucceeded) {
        setUploadProgress((current) => (current ? { ...current, percent: 100 } : current));
        clearUploadHideTimer();
        uploadHideTimerRef.current = setTimeout(() => setUploadProgress(null), 1200);
      }
    }
  };


  const toggleUploadPause = () => {
    const task = uploadTaskRef.current;
    if (!task) return;
    if (task.isPaused()) {
      task.resume();
    } else {
      task.pause();
    }
  };

  const cancelUpload = async () => {
    const task = uploadTaskRef.current;
    if (!task) return;
    const confirmed = window.confirm('Cancel this upload? Uploaded temporary chunks will be deleted and cannot be resumed.');
    if (!confirmed) return;
    setMessage('Cancelling upload...');
    setError('');
    await task.cancel();
  };

  const closePreview = () => {
    setPreview(null);
    setPreviewText('');
    setPreviewError('');
    setPreviewLoading(false);
  };

  const openPreview = async (entry: DiskEntry) => {
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewText('');
    try {
      const data = await api.getDiskPreviewMeta(entry.path);
      const file = data.file as DiskPreview;
      if (!file.previewable) throw new Error('This file type cannot be previewed online');
      setPreview(file);
      if (file.kind === 'text' || file.kind === 'markdown') {
        const textData = await api.getDiskPreviewText(entry.path);
        setPreviewText(textData.text || '');
      }
    } catch (err: any) {
      setPreviewError(err.message || 'Preview failed');
      setPreview({
        name: entry.name,
        path: entry.path,
        size: entry.size,
        kind: 'unsupported',
        previewable: false,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const deleteEntry = async (entry: DiskEntry) => {
    setMessage('');
    setError('');
    setBusy(true);
    try {
      await api.deleteDiskFile(entry.path);
      setMessage(`Deleted ${entry.name}`);
      await loadEntries(currentPath);
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const openFolder = (path: string) => {
    setQuery('');
    loadEntries(path);
  };

  if (!unlocked) {
    return (
      <main className="min-h-[100dvh] overflow-hidden bg-slate-50 text-slate-800">
        <Navbar />
        <section className="relative flex min-h-[100dvh] items-center justify-center px-4 py-28 sm:px-6">
          <div className="hidden pointer-events-none absolute inset-0 opacity-[0.12]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-emerald-50/50 to-transparent" />

          <motion.form
            onSubmit={unlockDisk}
            className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/50 sm:p-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-slate-700">
              <Lock size={22} />
            </div>
            <div className="mt-6 text-xs uppercase tracking-[0.28em] text-slate-400">Ym1r Disk</div>
            <h1 className="mt-3 text-4xl font-medium leading-none tracking-[-0.05em] text-slate-800">Unlock disk.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Enter the disk password once to access files, folders, uploads, downloads, and deletion tools.
            </p>

            <label className="mt-6 block">
              <span className="text-xs text-slate-400">Disk password</span>
              <input
                type="password"
                value={unlockPassword}
                onChange={(event) => setUnlockPassword(event.target.value)}
                className="mt-2 h-12 rounded-full border border-slate-200 bg-white/35 px-4 text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Password"
                autoComplete="current-password"
                autoFocus
              />
            </label>

            <button
              type="submit"
              disabled={busy || loading}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:gap-3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShieldCheck size={17} />
              {busy || loading ? 'Checking...' : 'Unlock'}
            </button>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </motion.form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-slate-50 text-slate-800">
      <Navbar />
      <section className="relative px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="hidden pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-emerald-50/50 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
          >
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/50 sm:p-7 lg:p-9">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
                <HardDrive size={16} />
                Ym1r Disk
              </div>
              <h1 className="mt-7 max-w-2xl text-5xl font-medium leading-[0.9] tracking-[-0.06em] text-slate-800 sm:text-6xl lg:text-7xl">
                Private cloud disk.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                A dedicated private disk folder for files and folders. Unlock once on entry, then manage uploads, downloads, and deletion in this session.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/35 p-4">
                  <div className="text-xs text-slate-400">Entries</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-700">{entries.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/35 p-4">
                  <div className="text-xs text-slate-400">Visible size</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-700">{formatBytes(totalSize)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/35 p-4">
                  <div className="text-xs text-slate-400">Path</div>
                  <div className="mt-2 truncate text-lg font-semibold text-slate-700">{currentPath || 'Root'}</div>
                </div>
              </div>
            </div>

            <form onSubmit={uploadFiles} className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/50 sm:p-7 lg:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Upload</div>
                  <h2 className="mt-2 text-2xl font-medium text-slate-700">Session unlocked</h2>
                </div>
                <button
                  type="button"
                  onClick={lockDisk}
                  disabled={busy}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-700 disabled:opacity-40"
                >
                  Lock
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="relative flex min-h-[126px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-dashed border-slate-300 bg-white/30 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-slate-100 active:bg-primary/10">
                  <UploadCloud size={32} className="text-slate-600" />
                  <span className="mt-3 text-sm font-medium text-slate-700">Select files</span>
                  <span className="mt-2 text-xs text-slate-400">Mobile-compatible native picker</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Select files"
                    onClick={(event) => { event.currentTarget.value = ''; }}
                    onChange={pickFiles}
                  />
                </label>
                <label className="relative flex min-h-[126px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-dashed border-slate-300 bg-white/30 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-slate-100 active:bg-primary/10">
                  <FolderOpen size={32} className="text-slate-600" />
                  <span className="mt-3 text-sm font-medium text-slate-700">Select folder</span>
                  <span className="mt-2 text-xs text-slate-400">Desktop browsers preserve structure</span>
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Select folder"
                    onClick={(event) => { event.currentTarget.value = ''; }}
                    onChange={pickFolder}
                    {...({ webkitdirectory: '', directory: '' } as any)}
                  />
                </label>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white/20 px-4 py-3 text-xs leading-5 text-slate-400">
                On mobile, use <span className="font-semibold text-slate-700/75">Select files</span>. Folder picking depends on the browser and operating system. When the mobile picker does not expose folders, select multiple files or upload a ZIP to preserve the complete hierarchy.
              </div>

              {pickerNotice && (
                <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs leading-5 text-amber-100/85">
                  {pickerNotice}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/25 px-4 py-3 text-sm text-slate-500">
                {selectedUploads.length
                  ? `Selected ${selectedUploads.length} file${selectedUploads.length > 1 ? 's' : ''}, ${formatBytes(selectedSize)} total`
                  : `Upload target: /${currentPath || 'root'}`}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:gap-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UploadCloud size={17} />
                {busy ? (uploadPaused ? 'Upload paused' : 'Uploading...') : 'Upload'}
              </button>

              {busy && uploadProgress && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={toggleUploadPause}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/25 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    {uploadPaused ? <Play size={16} /> : <Pause size={16} />}
                    {uploadPaused ? 'Resume upload' : 'Pause upload'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 text-sm font-semibold text-red-500 transition hover:border-red-300 hover:bg-red-50"
                  >
                    <X size={16} />
                    Cancel upload
                  </button>
                </div>
              )}

              {uploadProgress && (
                <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-700">
                        {uploadProgress.currentFile || 'Preparing upload'}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {uploadProgress.completedFiles}/{uploadProgress.totalFiles} files
                        {' · '}
                        {uploadPaused ? 'Paused · uploaded chunks preserved' : formatSpeed(uploadProgress.speedBps)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {Math.min(100, Math.max(0, uploadProgress.percent)).toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-[width] duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, uploadProgress.percent))}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{formatBytes(uploadProgress.uploadedBytes)} / {formatBytes(uploadProgress.totalBytes)}</span>
                    <span>{formatBytes(uploadProgress.currentFileUploadedBytes)} / {formatBytes(uploadProgress.currentFileBytes)}</span>
                  </div>
                </div>
              )}

              {(message || error) && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                  {error || message}
                </div>
              )}
            </form>
          </motion.div>

          <motion.div
            className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/50 sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Files</div>
                <h2 className="mt-2 text-2xl font-medium text-slate-700">Disk files</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-11 min-w-[230px] rounded-full border border-slate-200 bg-white/35 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                    placeholder="Search files"
                  />
                </label>
                <button
                  onClick={() => loadEntries(currentPath)}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-40"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <button onClick={() => openFolder('')} className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-700">Root</button>
              {crumbs.map((crumb, index) => {
                const path = crumbs.slice(0, index + 1).join('/');
                return (
                  <button key={path} onClick={() => openFolder(path)} className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-700">
                    {crumb}
                  </button>
                );
              })}
              {currentPath && (
                <button onClick={() => openFolder(parentPath(currentPath))} className="ml-auto rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-700">
                  Up one level
                </button>
              )}
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-slate-200">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading files...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No files</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => (
                    <div key={entry.path} className="grid gap-3 bg-white/25 p-4 transition hover:bg-slate-100/50 md:grid-cols-[1fr_auto] md:items-center">
                      <button
                        type="button"
                        onClick={() => entry.type === 'folder' && openFolder(entry.path)}
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-slate-700">
                          {entry.type === 'folder' ? <Folder size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-700 sm:text-base">{entry.name}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {entry.type === 'folder' ? 'Folder' : formatBytes(entry.size)} · {formatDate(entry.modifiedAt)}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {entry.type === 'file' ? (
                          <>
                            {canPreviewFile(entry.name) && (
                              <button
                                type="button"
                                onClick={() => openPreview(entry)}
                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 md:flex-none"
                              >
                                <Eye size={15} />
                                Preview
                              </button>
                            )}
                          <a
                            href={api.getDiskDownloadUrl(entry.path)}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 md:flex-none"
                          >
                            <Download size={15} />
                            Download
                          </a>
                          </>
                        ) : (
                          <button
                            onClick={() => openFolder(entry.path)}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 md:flex-none"
                          >
                            <FolderOpen size={15} />
                            Open
                          </button>
                        )}
                        <button
                          onClick={() => deleteEntry(entry)}
                          disabled={busy}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-red-200 px-4 text-sm font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-40 md:flex-none"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {preview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-2000 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex h-[92dvh] w-full max-w-7xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#101010] shadow-xl shadow-slate-300/50">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{preview.name}</div>
                <div className="mt-1 text-xs text-slate-400">{formatBytes(preview.size)} · {preview.kind.toUpperCase()} preview</div>
              </div>
              <a
                href={api.getDiskDownloadUrl(preview.path)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:border-slate-400"
              >
                <Download size={14} />
                Download
              </a>
              <button
                type="button"
                onClick={closePreview}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-400"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-white/25 p-3 sm:p-5">
              {previewLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Preparing preview...</div>
              ) : previewError ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-200">{previewError}</div>
              ) : preview.kind === 'text' ? (
                <pre className="mx-auto max-w-6xl whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-white/35 p-4 font-mono text-xs leading-6 text-slate-700 sm:p-6">{previewText}</pre>
              ) : preview.kind === 'markdown' ? (
                <MarkdownPreview text={previewText} />
              ) : preview.kind === 'image' ? (
                <div className="flex min-h-full items-center justify-center">
                  <img src={api.getDiskPreviewRawUrl(preview.path)} alt={preview.name} className="max-h-full max-w-full object-contain" />
                </div>
              ) : preview.kind === 'html' ? (
                <iframe sandbox="" title={preview.name} src={api.getDiskPreviewRawUrl(preview.path)} className="h-full min-h-[70dvh] w-full rounded-xl bg-white" />
              ) : preview.kind === 'pdf' ? (
                <iframe title={preview.name} src={api.getDiskPreviewRawUrl(preview.path)} className="h-full min-h-[70dvh] w-full rounded-xl bg-white" />
              ) : preview.kind === 'office' ? (
                <iframe title={preview.name} src={api.getDiskPreviewOfficeUrl(preview.path)} className="h-full min-h-[70dvh] w-full rounded-xl bg-white" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">This file type cannot be previewed online.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
