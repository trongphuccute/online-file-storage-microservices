import { useEffect, useState, useCallback, useMemo, memo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, FileImage, FileVideo, FileArchive, File as FileIcon,
  Trash2, Share2, Upload, Loader2, FolderOpen,
  AlertTriangle, Search, LayoutGrid, List, X,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { fileApi, shareApi, authApi, tokenStore, type CloudFile } from "@/lib/api";
import { useToast } from "@/components/Toast";

function getFileName(f: CloudFile) {
  return f.original_name ?? f.name ?? "";
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return { Icon: FileImage, color: "#22c55e", type: "image" };
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return { Icon: FileVideo, color: "#a855f7", type: "video" };
  if (["pdf", "doc", "docx", "txt", "md", "xlsx", "csv"].includes(ext)) return { Icon: FileText, color: "var(--primary)", type: "doc" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { Icon: FileArchive, color: "#f97316", type: "archive" };
  return { Icon: FileIcon, color: "var(--muted-foreground)", type: "other" };
}

function getQuotaColor(pct: number) {
  if (pct < 60) return "var(--primary)";
  if (pct < 85) return "#f97316";
  return "#ef4444";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng ☀️";
  if (h < 18) return "Chào buổi chiều 🌤️";
  return "Chào buổi tối 🌙";
}

type FilterType = "all" | "image" | "video" | "doc" | "archive" | "other";
type ViewMode = "grid" | "list";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "image", label: "Ảnh" },
  { key: "video", label: "Video" },
  { key: "doc", label: "Tài liệu" },
  { key: "archive", label: "Nén" },
];

export default function Dashboard() {
  const router = useRouter();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; total: number } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [preview, setPreview] = useState<CloudFile | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [data, q] = await Promise.all([
        fileApi.list(),
        fileApi.quota().catch(() => null),
      ]);
      setFiles(data);
      setQuota(q);
    } catch (e: any) {
      setError(e.message || "Không tải được danh sách");
    } finally { setLoading(false); }
  }, []);

  const routerReplace = router.replace;
  useEffect(() => {
    if (!tokenStore.get()) {
      routerReplace("/login");
    } else {
      setAuthorized(true);
      authApi.me().then((profile) => {
        if (profile.role === "admin") {
          routerReplace("/admin");
          return;
        }
        load();
      }).catch(() => {
        load();
      });
    }
  }, [load, routerReplace]);

  // ── All hooks must come before any early return ──
  // Memoize filtered list — avoids re-running on preview open/close
  const filtered = useMemo(() => files.filter((f) => {
    const name = f.original_name ?? f.name ?? "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const { type } = getFileIcon(name);
    const matchFilter = filter === "all" || type === filter;
    return matchSearch && matchFilter;
  }), [files, search, filter]);

  const quotaPercent = quota ? Math.min((quota.used / quota.total) * 100, 100) : 0;

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Dashboard · CloudVault</title></Head>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px]" style={{ background: "var(--gradient-hero)" }} />
        <Navbar />

        <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">{getGreeting()}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Kho file của bạn</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/shares">
                <Button variant="outline" className="gap-2"><Share2 className="h-4 w-4" /> Shares</Button>
              </Link>
              <Link href="/upload">
                <Button className="gap-2"><Upload className="h-4 w-4" /> Upload mới</Button>
              </Link>
            </div>
          </motion.div>

          {/* Quota */}
          <AnimatePresence>
            {quota && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Dung lượng</span>
                  <span className="tabular-nums text-[var(--muted-foreground)]">{formatBytes(quota.used)} / {formatBytes(quota.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${quotaPercent}%` }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: getQuotaColor(quotaPercent) }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-[var(--muted-foreground)]">{quotaPercent.toFixed(1)}% đã dùng · {files.length} file</p>
                  {quotaPercent >= 85 && (
                    <p className="flex items-center gap-1 text-xs text-orange-400"><AlertTriangle className="h-3 w-3" /> Sắp đầy</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar: search + filter + view toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm file…"
                className="h-9 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] pl-9 pr-8 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
                {FILTERS.map((f) => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className="rounded-md px-3 py-1 text-xs font-medium transition-all duration-200"
                    style={filter === f.key
                      ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                      : { color: "var(--muted-foreground)" }}>
                    {f.label}
                  </button>
                ))}
              </div>
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
                <button onClick={() => setView("grid")}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition"
                  style={view === "grid" ? { background: "var(--secondary)" } : {}}>
                  <LayoutGrid className="h-3.5 w-3.5" style={{ color: view === "grid" ? "var(--foreground)" : "var(--muted-foreground)" }} />
                </button>
                <button onClick={() => setView("list")}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition"
                  style={view === "list" ? { background: "var(--secondary)" } : {}}>
                  <List className="h-3.5 w-3.5" style={{ color: view === "list" ? "var(--foreground)" : "var(--muted-foreground)" }} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* States */}
          {loading && (
            <div className="flex items-center gap-2 py-12 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">{error}</div>
          )}
          {!loading && !error && files.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/40 p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <FolderOpen className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Kho file trống</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">Upload file đầu tiên để bắt đầu.</p>
              <Link href="/upload"><Button className="mt-6 gap-2"><Upload className="h-4 w-4" /> Upload ngay</Button></Link>
            </motion.div>
          )}
          {!loading && !error && files.length > 0 && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Không tìm thấy file nào khớp với &ldquo;{search}&rdquo;
            </div>
          )}

          {/* Grid view */}
          {view === "grid" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((f, i) => (
                  <FileCard key={f.id} file={f} index={Math.min(i, 12)} onDeleted={load} onPreview={() => setPreview(f)} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* List view */}
          {view === "list" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <AnimatePresence mode="popLayout">
                {filtered.map((f, i) => (
                  <FileRow key={f.id} file={f} index={Math.min(i, 12)} onDeleted={load} onPreview={() => setPreview(f)} isLast={i === filtered.length - 1} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {preview && (
            <motion.div key="preview-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
              onClick={() => setPreview(null)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
                {preview.url
                  ? <img src={preview.url} alt={preview.name} className="max-h-[80vh] rounded-2xl object-contain shadow-elegant" />
                  : (
                    <div className="flex h-64 w-80 flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--card)]">
                      <FileIcon className="h-12 w-12 text-[var(--muted-foreground)]" />
                      <p className="text-sm text-[var(--muted-foreground)]">Preview không khả dụng</p>
                    </div>
                  )}
                <button onClick={() => setPreview(null)}
                  className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30">
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-3 text-center">
                  <p className="text-sm font-medium text-white">{getFileName(preview)}</p>
                  <p className="text-xs text-white/60">{formatBytes(preview.size)}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

/* ── File Card (grid) ── */
const FileCard = memo(function FileCard({ file, index, onDeleted, onPreview }: {
  file: CloudFile; index: number; onDeleted: () => void; onPreview: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { Icon, color, type } = getFileIcon(getFileName(file));
  const isImage = type === "image";

  const onShare = async () => {
    setSharing(true);
    try {
      const share = await shareApi.create(file.id);
      await navigator.clipboard.writeText(`${window.location.origin}/public/${share.token}`);
      success("Đã copy link chia sẻ!");
    } catch (e: any) {
      toastError(e.message || "Tạo share link thất bại");
    } finally { setSharing(false); }
  };

  const onDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    setDeleting(true);
    try {
      await fileApi.remove(file.id);
      success("Đã xóa file thành công");
      onDeleted();
    } catch (e: any) {
      toastError(e.message || "Xóa file thất bại");
      setDeleting(false); setConfirmDelete(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--primary)]/40 hover:shadow-glow">

      {/* Image thumbnail or icon */}
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-[var(--background)]/40 cursor-pointer"
        onClick={onPreview}>
        {isImage && file.url
          ? <img src={file.url} alt={file.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <span className="text-xs font-mono text-[var(--muted-foreground)]">.{getFileName(file).split(".").pop()?.toUpperCase()}</span>
            </div>
          )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black opacity-0 transition-opacity group-hover:opacity-100">
            Preview
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-medium" title={getFileName(file)}>{getFileName(file)}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {formatBytes(file.size)}
          {file.created_at && <span className="ml-2">· {new Date(file.created_at).toLocaleDateString("vi-VN")}</span>}
        </p>

        <div className="mt-3 flex gap-1.5">
          <button onClick={onShare} disabled={sharing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all disabled:opacity-60"
            style={{ borderColor: "var(--border)", background: "transparent", color: "var(--foreground)" }}>
            {sharing ? <><Loader2 className="h-3 w-3 animate-spin" /> Đang tạo…</> : <><Share2 className="h-3 w-3" /> Share</>}
          </button>

          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.button key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={onDelete} disabled={deleting}
                className="flex items-center gap-1 rounded-lg border border-[var(--destructive)]/50 bg-[var(--destructive)]/10 px-2 py-1.5 text-xs text-[var(--destructive)] disabled:opacity-60">
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
                {deleting ? "…" : "OK?"}
              </motion.button>
            ) : (
              <motion.button key="delete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={onDelete}
                className="flex items-center justify-center rounded-lg border border-[var(--border)] px-2 py-1.5 text-[var(--muted-foreground)] transition hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]">
                <Trash2 className="h-3 w-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

/* ── File Row (list) ── */
const FileRow = memo(function FileRow({ file, index, onDeleted, onPreview, isLast }: {
  file: CloudFile; index: number; onDeleted: () => void; onPreview: () => void; isLast: boolean;
}) {
  const { success, error: toastError } = useToast();
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { Icon, color } = getFileIcon(getFileName(file));

  const onShare = async () => {
    setSharing(true);
    try {
      const share = await shareApi.create(file.id);
      await navigator.clipboard.writeText(`${window.location.origin}/public/${share.token}`);
      success("Đã copy link chia sẻ!");
    } catch (e: any) {
      toastError(e.message || "Tạo share link thất bại");
    } finally { setSharing(false); }
  };

  const onDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    setDeleting(true);
    try {
      await fileApi.remove(file.id);
      success("Đã xóa file thành công");
      onDeleted();
    } catch (e: any) {
      toastError(e.message || "Xóa file thất bại");
      setDeleting(false); setConfirmDelete(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      className={`flex items-center gap-4 px-5 py-3.5 transition hover:bg-[var(--background)]/40 ${!isLast ? "border-b border-[var(--border)]" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition hover:scale-105"
        style={{ background: `${color}18` }} onClick={onPreview}>
        <Icon className="h-4.5 w-4.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{getFileName(file)}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {formatBytes(file.size)}
          {file.created_at && <span className="ml-2">· {new Date(file.created_at).toLocaleDateString("vi-VN")}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={onShare} disabled={sharing}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-60"
          style={{ borderColor: "var(--border)", background: "transparent", color: "var(--foreground)" }}>
          {sharing ? <><Loader2 className="h-3 w-3 animate-spin" /> Đang tạo…</> : <><Share2 className="h-3 w-3" /> Share</>}
        </button>
        <button onClick={onDelete} disabled={deleting}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition ${
            confirmDelete
              ? "border-[var(--destructive)]/50 bg-[var(--destructive)]/10 text-[var(--destructive)]"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]"
          }`}>
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          {confirmDelete && !deleting && "OK?"}
        </button>
      </div>
    </motion.div>
  );
});
