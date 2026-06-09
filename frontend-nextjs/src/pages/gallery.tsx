import { useState, useEffect } from "react";
import CircularGallery from "@/components/CircularGallery";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, X, ChevronLeft, ChevronRight, ZoomIn,
  Calendar, HardDrive, FileImage, Link2, Copy, CheckCheck, Upload,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";

interface GalleryItem {
  image: string;
  thumb: string;
  text: string;
  desc: string;
  size: string;       // ví dụ "2.4 MB"
  uploaded: string;   // ví dụ "2026-06-01"
  shareUrl?: string;
}

const galleryItems: GalleryItem[] = [
  { image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&q=80", text: "sunset-trip.jpg",  desc: "Hoàng hôn trên bầu trời", size: "3.2 MB",  uploaded: "2026-05-28", shareUrl: "https://cloudvault.app/public/token-001" },
  { image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80", text: "mountains.png",    desc: "Dãy núi hùng vĩ",       size: "5.7 MB",  uploaded: "2026-05-25", shareUrl: "https://cloudvault.app/public/token-002" },
  { image: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=600&q=80", text: "city-lights.jpg",  desc: "Ánh đèn thành phố",     size: "4.1 MB",  uploaded: "2026-05-20", shareUrl: "https://cloudvault.app/public/token-003" },
  { image: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600&q=80", text: "ocean.png",        desc: "Đại dương bao la",      size: "6.8 MB",  uploaded: "2026-05-18" },
  { image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80", text: "forest.jpg",       desc: "Rừng xanh bát ngát",   size: "2.9 MB",  uploaded: "2026-05-15", shareUrl: "https://cloudvault.app/public/token-005" },
  { image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80", text: "valley.png",       desc: "Thung lũng mây",       size: "4.4 MB",  uploaded: "2026-05-12" },
  { image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80", text: "lake.jpg",         desc: "Hồ nước tĩnh lặng",    size: "3.6 MB",  uploaded: "2026-05-08", shareUrl: "https://cloudvault.app/public/token-007" },
  { image: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1200&q=90", thumb: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=600&q=80", text: "field.png",        desc: "Cánh đồng rộng lớn",   size: "2.1 MB",  uploaded: "2026-05-03", shareUrl: "https://cloudvault.app/public/token-008" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Detail Panel ── */
function DetailPanel({
  item, index, total,
  onClose, onPrev, onNext,
}: {
  item: GalleryItem; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (!item.shareUrl) return;
    await navigator.clipboard.writeText(item.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    <HardDrive className="h-3 w-3 text-[var(--primary)]" />{item.size}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    <Calendar className="h-3 w-3 text-[var(--primary)]" />{formatDate(item.uploaded)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
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
                      <button className="mt-1 text-xs font-medium text-[var(--primary)] hover:underline">Tạo link →</button>
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
            <Button variant="outline" className="flex-1 gap-1 text-xs h-8" onClick={copyUrl} disabled={!item.shareUrl}>
              <Link2 className="h-3.5 w-3.5" />
              {copied ? "Đã copy!" : "Copy link"}
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
  const [selected, setSelected] = useState<number | null>(null);

  // Mở detail panel nếu có query ?open=N từ trang chủ
  useEffect(() => {
    if (!router.isReady) return;
    const idx = Number(router.query.open);
    if (!isNaN(idx) && idx >= 0 && idx < galleryItems.length) {
      setSelected(idx);
      // Xoá query khỏi URL
      router.replace("/gallery", undefined, { shallow: true });
    }
  }, [router.isReady, router.query.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (i: number) => setSelected(i);
  const close = () => setSelected(null);
  const prev = () => setSelected((i) => (i === null ? 0 : (i - 1 + galleryItems.length) % galleryItems.length));
  const next = () => setSelected((i) => (i === null ? 0 : (i + 1) % galleryItems.length));

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
                {galleryItems.length} ảnh · Click vào ảnh để xem thông tin chi tiết
              </p>
            </div>
            <Link href="/upload">
              <Button className="gap-2"><Upload className="h-4 w-4" /> Upload ảnh</Button>
            </Link>
          </motion.div>

          {/* Masonry grid */}
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {galleryItems.map((item, i) => (
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
        </section>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected !== null && (
            <DetailPanel
              item={galleryItems[selected]}
              index={selected}
              total={galleryItems.length}
              onClose={close}
              onPrev={prev}
              onNext={next}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
