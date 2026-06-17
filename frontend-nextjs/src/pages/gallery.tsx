import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, X, ChevronLeft, ChevronRight, ZoomIn,
  Calendar, HardDrive, FileImage, Link2, Copy, CheckCheck, Upload, Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { fileApi, shareApi, tokenStore, type CloudFile, type ShareLink } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface GalleryItem {
  image: string;
  thumb: string;
  text: string;
  desc: string;
  size: string;       // ví dụ "2.4 MB"
  uploaded: string;   // ví dụ "2026-06-01"
  shareUrl?: string;
  file: CloudFile;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function isImage(file: CloudFile) {
  const contentType = file.content_type?.toLowerCase() ?? "";
  const name = (file.original_name || file.name || "").toLowerCase();
  return (
    contentType.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg"].some((ext) =>
      name.endsWith(ext)
    )
  );
}

/* ── Detail Panel ── */
function DetailPanel({
  item, index, total,
  onClose, onPrev, onNext,
  onShareCreated,
}: {
  item: GalleryItem; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
  onShareCreated: (itemIndex: number, shareUrl: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [creatingShare, setCreatingShare] = useState(false);
  const { success, error: toastError } = useToast();

  const copyUrl = async () => {
    if (!item.shareUrl) return;
    await navigator.clipboard.writeText(item.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateShare = async () => {
    if (!item.file) return;
    setCreatingShare(true);
    try {
      const share = await shareApi.create(item.file.id);
      const url = `${window.location.origin}/public/${share.token}`;
      onShareCreated(index, url);
      await navigator.clipboard.writeText(url);
      success("Đã tạo và copy link chia sẻ!");
    } catch (err: any) {
      toastError(err.message || "Tạo share link thất bại");
    } finally {
      setCreatingShare(false);
    }
  };

  return (
    // Backdrop
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel — click inside không đóng */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col bg-[var(--card)] shadow-elegant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top bar ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button onClick={onPrev}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-[var(--muted-foreground)]">{index + 1} / {total}</span>
            <button onClick={onNext}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Ảnh */}
          <AnimatePresence mode="wait">
            <motion.div key={index}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="relative bg-[var(--background)] py-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.text}
                draggable={false}
                className="w-full object-cover"
                style={{ maxHeight: 220 }}
              />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--card)] to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* ── Info section ── */}
          <div className="px-4 pb-5 pt-1">
            <AnimatePresence mode="wait">
              <motion.div key={`info-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-sm font-bold tracking-tight leading-tight">{item.text}</h2>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{item.desc}</p>

                {/* Meta chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    <HardDrive className="h-3 w-3 text-[var(--primary)]" />{item.size}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    <Calendar className="h-3 w-3 text-[var(--primary)]" />{formatDate(item.uploaded)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    <FileImage className="h-3 w-3 text-[var(--primary)]" />{item.text.split(".").pop()?.toUpperCase()}
                  </span>
                </div>

                <div className="my-3 h-px bg-[var(--border)]" />

                {/* Chi tiết */}
                <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-3 text-xs">
                  <Row label="Tên file" value={item.text} />
                  <div className="h-px bg-[var(--border)]" />
                  <Row label="Dung lượng" value={item.size} />
                  <div className="h-px bg-[var(--border)]" />
                  <Row label="Ngày đăng" value={formatDate(item.uploaded)} />
                  <div className="h-px bg-[var(--border)]" />
                  <Row label="Định dạng" value={`.${item.text.split(".").pop()?.toUpperCase()}`} />
                </div>

                <div className="my-3 h-px bg-[var(--border)]" />

                {/* Share URL */}
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    <Link2 className="h-3 w-3" /> Link chia sẻ
                  </p>
                  {item.shareUrl ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-2">
                      <p className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--muted-foreground)]">
                        {item.shareUrl}
                      </p>
                      <motion.button
                        onClick={copyUrl}
                        animate={copied ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.25 }}
                        className="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all duration-200"
                        style={copied
                          ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }
                          : { background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }
                        }
                      >
                        {copied ? <><CheckCheck className="h-3 w-3" /> OK</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)]/40 px-3 py-3 text-center">
                      <p className="text-xs text-[var(--muted-foreground)]">Chưa có link chia sẻ</p>
                      <button
                        onClick={handleCreateShare}
                        disabled={creatingShare}
                        className="mt-1 text-xs font-medium text-[var(--primary)] hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        {creatingShare ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Đang tạo…
                          </>
                        ) : (
                          "Tạo link →"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* ── Bottom action bar ── */}
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1 text-xs h-8"
              onClick={item.shareUrl ? copyUrl : handleCreateShare}
              disabled={creatingShare}
            >
              <Link2 className="h-3.5 w-3.5" />
              {creatingShare ? "Đang tạo…" : item.shareUrl ? (copied ? "Đã copy!" : "Copy link") : "Tạo link"}
            </Button>
            <a href={item.image} target="_blank" rel="noreferrer" className="flex-1">
              <Button className="w-full gap-1 text-xs h-8">
                <Upload className="h-3.5 w-3.5" /> Xem gốc
              </Button>
            </a>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/* ── Main page ── */
export default function GalleryPage() {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);

    let active = true;
    let objectUrls: string[] = [];

    async function loadGallery() {
      setLoading(true);
      setError(null);
      try {
        const [userFiles, userShares] = await Promise.all([
          fileApi.list(),
          shareApi.list().catch(() => [] as ShareLink[]),
        ]);

        const imageFiles = userFiles.filter(isImage);

        const previews = await Promise.allSettled(
          imageFiles.map(async (file) => {
            const previewUrl = await fileApi.previewUrl(file);
            const matchingShare = userShares.find(
              (s) => Number(s.file_id) === Number(file.id) && s.is_active
            );
            const shareUrl = matchingShare
              ? `${window.location.origin}/public/${matchingShare.token}`
              : undefined;

            return {
              image: previewUrl,
              thumb: previewUrl,
              text: file.original_name || file.name || `file-${file.id}`,
              desc: file.content_type || "Hình ảnh",
              size: formatBytes(file.size),
              uploaded: file.created_at || new Date().toISOString(),
              shareUrl,
              file,
            } as GalleryItem;
          })
        );

        const loadedItems = previews
          .filter((result): result is PromiseFulfilledResult<GalleryItem> => result.status === "fulfilled")
          .map((result) => result.value);

        objectUrls = loadedItems.map((item) => item.image);

        if (!active) {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        setItems(loadedItems);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không tải được dữ liệu thư viện ảnh.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadGallery();

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [router]);

  // Mở detail panel nếu có query ?open=N từ trang chủ
  useEffect(() => {
    if (!router.isReady || loading || items.length === 0) return;
    const idx = Number(router.query.open);
    if (!isNaN(idx) && idx >= 0 && idx < items.length) {
      setSelected(idx);
      // Xoá query khỏi URL
      router.replace("/gallery", undefined, { shallow: true });
    }
  }, [router.isReady, router.query.open, loading, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (i: number) => setSelected(i);
  const close = () => setSelected(null);
  const prev = () => setSelected((i) => (i === null ? 0 : (i - 1 + items.length) % items.length));
  const next = () => setSelected((i) => (i === null ? 0 : (i + 1) % items.length));

  const handleShareCreated = (itemIndex: number, newShareUrl: string) => {
    setItems((prevItems) =>
      prevItems.map((item, idx) =>
        idx === itemIndex ? { ...item, shareUrl: newShareUrl } : item
      )
    );
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Thư viện ảnh · CloudVault</title></Head>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px]" style={{ background: "var(--gradient-hero)" }} />
        <Navbar />

        <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/#gallery" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
                <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
              </Link>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Thư viện ảnh</h1>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                {!loading && !error && `${items.length} ảnh · `}Click vào ảnh để xem thông tin chi tiết
              </p>
            </div>
            <Link href="/upload">
              <Button className="gap-2"><Upload className="h-4 w-4" /> Upload ảnh</Button>
            </Link>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mb-3" />
              <p className="text-sm">Đang tải thư viện ảnh của bạn...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mx-auto max-w-xl rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)] text-center my-10">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && items.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/40 p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <FileImage className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Chưa có ảnh nào</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">Hãy tải ảnh lên để bắt đầu bộ sưu tập của bạn.</p>
              <Link href="/upload"><Button className="mt-6 gap-2"><Upload className="h-4 w-4" /> Upload ngay</Button></Link>
            </motion.div>
          )}

          {/* Masonry grid */}
          {!loading && !error && items.length > 0 && (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:border-[var(--primary)]/50 hover:shadow-glow"
                  onClick={() => open(i)}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb}
                      alt={item.text}
                      draggable={false}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ aspectRatio: i % 3 === 1 ? "3/4" : i % 3 === 2 ? "1/1" : "4/3" }}
                    />
                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/35">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 opacity-0 transition-all duration-300 group-hover:opacity-100 scale-90 group-hover:scale-100">
                        <ZoomIn className="h-5 w-5 text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-medium">{item.text}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>{item.size}</span>
                      <span>{formatDate(item.uploaded)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected !== null && (
            <DetailPanel
              item={items[selected]}
              index={selected}
              total={items.length}
              onClose={close}
              onPrev={prev}
              onNext={next}
              onShareCreated={handleShareCreated}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

