import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, FileImage, FileVideo, FileArchive, File as FileIcon,
  Trash2, Share2, Upload, Loader2, FolderOpen,
  AlertTriangle, Search, LayoutGrid, List, X,
  HardDrive, ShieldAlert, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, Download, ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fileApi, shareApi, tokenStore, type CloudFile } from "@/lib/api";
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

type FilterType = "all" | "image" | "video" | "doc" | "archive";
type ViewMode = "grid" | "list";

const FILTERS: { key: FilterType; label: string; icon: any }[] = [
  { key: "all", label: "Tất cả tệp", icon: FolderOpen },
  { key: "image", label: "Hình ảnh", icon: FileImage },
  { key: "video", label: "Video", icon: FileVideo },
  { key: "doc", label: "Tài liệu", icon: FileText },
  { key: "archive", label: "Tệp nén", icon: FileArchive },
];

export default function Dashboard() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; total: number } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [preview, setPreview] = useState<CloudFile | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, q] = await Promise.all([
        fileApi.list(),
        fileApi.quota().catch(() => null),
      ]);
      setFiles(data);
      setQuota(q);
    } catch (e: any) {
      setError(e.message || "Không tải được danh sách tệp");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
    } else {
      setAuthorized(true);
      load();
    }
  }, [load, router]);

  // Connect Navbar global search dispatch to dashboard local search query
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearch(customEvent.detail);
    };
    window.addEventListener("dashboardSearch", handleGlobalSearch);
    return () => window.removeEventListener("dashboardSearch", handleGlobalSearch);
  }, []);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const filtered = files.filter((f) => {
    const name = f.original_name ?? f.name ?? "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const { type } = getFileIcon(name);
    const matchFilter = filter === "all" || type === filter;
    return matchSearch && matchFilter;
  });

  const quotaPercent = quota ? Math.min((quota.used / quota.total) * 100, 100) : 0;

  // Pagination navigation within preview modal
  const handlePrevPreview = () => {
    if (!preview) return;
    const currentIndex = filtered.findIndex((f) => f.id === preview.id);
    if (currentIndex > 0) {
      setPreview(filtered[currentIndex - 1]);
      setZoomScale(1);
    }
  };

  const handleNextPreview = () => {
    if (!preview) return;
    const currentIndex = filtered.findIndex((f) => f.id === preview.id);
    if (currentIndex < filtered.length - 1) {
      setPreview(filtered[currentIndex + 1]);
      setZoomScale(1);
    }
  };

  const toggleFullscreen = () => {
    if (!previewContainerRef.current) return;
    if (!document.fullscreenElement) {
      previewContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <Head>
        <title>Kho lưu trữ · CloudVault</title>
      </Head>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between">
        <div>
          <Navbar />

          <div className="flex max-w-7xl w-full mx-auto px-4 py-6 md:py-8 gap-6 items-stretch mb-16">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 hidden md:flex flex-col gap-6 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/40 backdrop-blur-md">
              <div>
                <Link href="/upload" className="w-full block">
                  <Button className="w-full gap-2 py-6 rounded-xl text-sm font-semibold tracking-wide">
                    <Upload className="h-4 w-4" /> Tải lên mới
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-foreground)] px-2 mb-2">DANH MỤC TỆP</span>
                {FILTERS.map((f) => {
                  const Icon = f.icon;
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        active
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shadow-glow"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {quota && (
                <div className="mt-auto pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <HardDrive className="h-4 w-4 text-[var(--primary)]" />
                    <span className="text-xs font-semibold">Bộ nhớ lưu trữ</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${quotaPercent}%`,
                        backgroundColor: getQuotaColor(quotaPercent),
                      }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--muted-foreground)] flex justify-between">
                    <span>{formatBytes(quota.used)} sử dụng</span>
                    <span className="font-mono">{quotaPercent.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </aside>

            {/* Main Workspace */}
            <section className="flex-1 flex flex-col min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
                    {getGreeting()}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5">Kho tài liệu của tôi</h1>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full max-w-xs shrink-0">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm tên tệp..."
                      className="h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] pl-9 pr-8 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shrink-0">
                    <button
                      onClick={() => setView("grid")}
                      className={`p-1.5 rounded-lg transition-all ${
                        view === "grid" ? "bg-[var(--secondary)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`p-1.5 rounded-lg transition-all ${
                        view === "list" ? "bg-[var(--secondary)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-5 rounded-2xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 text-sm text-[var(--destructive)] flex gap-3 items-start mb-6">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lỗi tải dữ liệu</p>
                    <p className="mt-1 opacity-90">{error}</p>
                    <Button size="sm" variant="outline" className="mt-3 border-[var(--destructive)]/50 text-[var(--destructive)] hover:bg-[var(--destructive)]/10" onClick={load}>
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading Skeletons */}
              {loading && (
                <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-2"}>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <SkeletonLoader key={idx} mode={view} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && files.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--card)]/20 rounded-2xl py-16 px-6 text-center"
                >
                  <div className="h-16 w-16 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4 shadow-glow">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold">Thư mục trống rỗng</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-sm">
                    Hãy bắt đầu tải lên tài liệu đầu tiên của bạn để lưu trữ thông tin trực tuyến an toàn.
                  </p>
                  <Link href="/upload" className="mt-6">
                    <Button className="gap-2"><ArrowUpCircle className="h-4.5 w-4.5" /> Tải lên ngay</Button>
                  </Link>
                </motion.div>
              )}

              {/* Search result empty state */}
              {!loading && !error && files.length > 0 && filtered.length === 0 && (
                <div className="py-16 text-center border border-[var(--border)] bg-[var(--card)]/20 rounded-2xl">
                  <Search className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3" />
                  <p className="text-sm font-semibold">Không tìm thấy tài liệu phù hợp</p>
                </div>
              )}

              {/* Files list */}
              {!loading && !error && filtered.length > 0 && (
                <>
                  {view === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <AnimatePresence mode="popLayout">
                        {filtered.map((f, i) => (
                          <FileCard key={f.id} file={f} index={i} onDeleted={load} onPreview={() => { setPreview(f); setZoomScale(1); }} />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/30 overflow-hidden backdrop-blur-md">
                      <AnimatePresence mode="popLayout">
                        {filtered.map((f, i) => (
                          <FileRow key={f.id} file={f} index={i} onDeleted={load} onPreview={() => { setPreview(f); setZoomScale(1); }} isLast={i === filtered.length - 1} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>

        {/* Dynamic visual preview modal with advanced controls */}
        <AnimatePresence>
          {preview && (
            <motion.div
              key="preview-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
              onClick={() => { setPreview(null); setIsFullscreen(false); }}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative max-h-[90vh] max-w-4xl w-full bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--border)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--secondary)]/40">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm font-bold truncate">{getFileName(preview)}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatBytes(preview.size)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoomScale(s => Math.min(s + 0.25, 3))}
                      className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--foreground)] transition"
                      title="Phóng to"
                    >
                      <ZoomIn className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => setZoomScale(s => Math.max(s - 0.25, 0.5))}
                      className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--foreground)] transition"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--foreground)] transition"
                      title="Toàn màn hình"
                    >
                      <Maximize2 className="h-4.5 w-4.5" />
                    </button>
                    <a href={preview.url} download={getFileName(preview)}>
                      <button
                        className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--foreground)] transition"
                        title="Tải về máy"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                    </a>
                    <button
                      onClick={() => { setPreview(null); setIsFullscreen(false); }}
                      className="h-8.5 w-8.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] flex items-center justify-center transition"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Main preview box */}
                <div
                  ref={previewContainerRef}
                  className="flex-1 relative overflow-hidden bg-black/40 flex items-center justify-center min-h-[400px] p-6 select-none"
                >
                  {/* Left arrow navigation */}
                  <button
                    onClick={handlePrevPreview}
                    className="absolute left-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition"
                    title="Tệp trước"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Right arrow navigation */}
                  <button
                    onClick={handleNextPreview}
                    className="absolute right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition"
                    title="Tệp sau"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Render based on MIME type */}
                  <div
                    style={{
                      transform: `scale(${zoomScale})`,
                      transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    className="max-h-[60vh] max-w-full flex items-center justify-center"
                  >
                    {preview.url && getFileIcon(getFileName(preview)).type === "image" ? (
                      <img src={preview.url} alt={preview.name} className="max-h-[60vh] object-contain rounded-lg shadow-elegant" />
                    ) : preview.url && getFileIcon(getFileName(preview)).type === "video" ? (
                      <video src={preview.url} controls className="max-h-[60vh] max-w-full rounded-lg outline-none" />
                    ) : (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 rounded-full bg-[var(--secondary)] flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
                          <FileIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--muted-foreground)]">Không hỗ trợ xem thử tệp này trực tuyến</p>
                        <a href={preview.url} download className="inline-block mt-4">
                          <Button size="sm" className="gap-2">Tải tài liệu về</Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </main>
    </>
  );
}

function SkeletonLoader({ mode }: { mode: ViewMode }) {
  if (mode === "grid") {
    return (
      <div className="h-[210px] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/40 p-4 animate-pulse flex flex-col justify-between">
        <div className="h-28 w-full bg-[var(--secondary)] rounded-xl" />
        <div className="space-y-2.5 mt-3">
          <div className="h-4 w-3/4 bg-[var(--secondary)] rounded" />
          <div className="h-3 w-1/2 bg-[var(--secondary)] rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="h-[70px] w-full border border-[var(--border)] bg-[var(--card)]/40 px-5 py-3.5 rounded-xl animate-pulse flex items-center gap-4">
      <div className="h-9 w-9 bg-[var(--secondary)] rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-[var(--secondary)] rounded" />
        <div className="h-3 w-1/5 bg-[var(--secondary)] rounded" />
      </div>
    </div>
  );
}

function FileCard({ file, index, onDeleted, onPreview }: {
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
      success("Đã sao chép link chia sẻ!");
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--primary)]/45 hover:shadow-glow flex flex-col justify-between"
    >
      <div
        className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-[var(--secondary)]/40 cursor-pointer"
        onClick={onPreview}
      >
        {isImage && file.url ? (
          <img src={file.url} alt={file.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${color}18` }}>
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <span className="text-[10px] font-bold font-mono text-[var(--muted-foreground)] uppercase">
              {getFileName(file).split(".").pop()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/25 flex items-center justify-center">
          <span className="rounded-full bg-white text-black px-3.5 py-1.5 text-xs font-semibold opacity-0 transition-all transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            Xem nhanh
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <p className="truncate text-sm font-bold" title={getFileName(file)}>{getFileName(file)}</p>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
          {formatBytes(file.size)}
          {file.created_at && <span className="ml-2">· {new Date(file.created_at).toLocaleDateString("vi-VN")}</span>}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onShare}
            disabled={sharing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-semibold transition hover:bg-[var(--secondary)] disabled:opacity-60"
          >
            {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>Chia sẻ</span>
          </button>

          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.button
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-1 rounded-lg border border-[var(--destructive)]/50 bg-[var(--destructive)]/10 px-3 py-2 text-xs font-bold text-[var(--destructive)] disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                <span>{deleting ? "" : "Xác nhận?"}</span>
              </motion.button>
            ) : (
              <motion.button
                key="delete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={onDelete}
                className="flex items-center justify-center rounded-lg border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function FileRow({ file, index, onDeleted, onPreview, isLast }: {
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
      success("Đã sao chép link chia sẻ!");
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
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className={`flex items-center gap-4 px-5 py-3.5 transition hover:bg-[var(--secondary)]/35 ${!isLast ? "border-b border-[var(--border)]" : ""}`}
    >
      <div
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition hover:scale-105"
        style={{ background: `${color}18` }}
        onClick={onPreview}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={onPreview}>
        <p className="truncate text-sm font-semibold">{getFileName(file)}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          {formatBytes(file.size)}
          {file.created_at && <span className="ml-2.5">· {new Date(file.created_at).toLocaleDateString("vi-VN")}</span>}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onShare}
          disabled={sharing}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--secondary)] transition disabled:opacity-60"
        >
          {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>Chia sẻ</span>
        </button>

        <button
          onClick={onDelete}
          disabled={deleting}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            confirmDelete
              ? "border-[var(--destructive)]/50 bg-[var(--destructive)]/10 text-[var(--destructive)]"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]"
          }`}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {confirmDelete && !deleting && <span>Xác nhận?</span>}
        </button>
      </div>
    </motion.div>
  );
}
