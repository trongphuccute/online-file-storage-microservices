import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  File as FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  Loader2,
  AlertCircle,
  Calendar,
  HardDrive,
  Download,
} from "lucide-react";
import { Button } from "@/components/Button";
import { shareApi, type PublicShareFile } from "@/lib/api";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(name: string, type: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const mime = type.toLowerCase();
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "tif"].includes(ext)) {
    return { Icon: FileImage, color: "#22c55e" };
  }
  if (mime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return { Icon: FileVideo, color: "#a855f7" };
  }
  if (["pdf", "doc", "docx", "txt", "md", "xlsx", "csv"].includes(ext)) {
    return { Icon: FileText, color: "var(--primary)" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { Icon: FileArchive, color: "#f97316" };
  }
  return { Icon: FileIcon, color: "var(--muted-foreground)" };
}

export default function PublicSharePage() {
  const router = useRouter();
  const { token } = router.query as { token: string };

  const [share, setShare] = useState<PublicShareFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    shareApi.publicShare(token)
      .then(setShare)
      .catch((e) => setError(e?.message || "Không thể tải file chia sẻ"))
      .finally(() => setLoading(false));
  }, [token]);

  const isImage = !!share?.type?.toLowerCase().startsWith("image/");
  const { Icon, color } = share ? getFileIcon(share.name, share.type) : { Icon: FileIcon, color: "var(--primary)" };
  const downloadUrl = share?.downloadUrl || share?.url || "#";

  return (
    <>
      <Head>
        <title>{share ? `${share.name} · CloudVault` : "File được chia sẻ · CloudVault"}</title>
      </Head>
      <main className="relative flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px]" style={{ background: "var(--gradient-hero)" }} />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]/30">
              <Cloud className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CloudVault</span>
          </Link>
          <Link href="/login">
            <Button size="sm" variant="outline">Đăng nhập</Button>
          </Link>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-3xl">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-12 text-center backdrop-blur-xl shadow-elegant"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">Đang tải thông tin file...</p>
                </motion.div>
              )}

              {!loading && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--destructive)]/30 bg-[var(--card)]/80 p-10 text-center backdrop-blur-xl shadow-elegant"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--destructive)]/10">
                    <AlertCircle className="h-8 w-8 text-[var(--destructive)]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Không thể truy cập</h1>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{error}</p>
                  </div>
                  <Link href="/">
                    <Button variant="outline">Về trang chủ</Button>
                  </Link>
                </motion.div>
              )}

              {!loading && !error && share && (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl shadow-elegant"
                >
                  <div className="px-8 pb-6 pt-8 text-center">
                    <div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ring-1"
                      style={{ background: `${color}18`, boxShadow: `inset 0 0 0 1px ${color}30` }}
                    >
                      <Icon className="h-8 w-8" style={{ color }} />
                    </div>
                    <h1 className="mt-4 truncate px-4 text-xl font-bold" title={share.name}>
                      {share.name}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {formatBytes(share.size)} · {share.type || "application/octet-stream"}
                    </p>
                  </div>

                  <div className="grid gap-0 border-t border-[var(--border)] lg:grid-cols-[1.35fr_0.9fr]">
                    <div className="border-b border-[var(--border)] bg-[var(--background)]/40 p-4 lg:border-b-0 lg:border-r">
                      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-black/5">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={share.url}
                            alt={share.name}
                            className="h-full w-full max-h-[560px] object-contain bg-black/5"
                          />
                        ) : (
                          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                              <Icon className="h-10 w-10" style={{ color }} />
                            </div>
                            <div>
                              <p className="font-medium">File này chưa có preview ảnh</p>
                              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Vui lòng tải xuống để mở bằng ứng dụng phù hợp.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 p-4 text-sm">
                        <MetaRow label="Tên file" value={share.name} />
                        <div className="h-px bg-[var(--border)]" />
                        <MetaRow label="Dung lượng" value={formatBytes(share.size)} />
                        <div className="h-px bg-[var(--border)]" />
                        <MetaRow label="Định dạng" value={share.type || "application/octet-stream"} />
                        <div className="h-px bg-[var(--border)]" />
                        <MetaRow label="Tạo lúc" value={formatDate(share.createdAt)} />
                      </div>

                      <div className="mt-5 space-y-3">
                        <a href={downloadUrl} download={share.name} target="_blank" rel="noreferrer" className="block">
                          <button
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 hover:shadow-glow"
                            style={{ background: "var(--gradient-primary)" }}
                          >
                            <Download className="h-4 w-4" /> Tải xuống
                          </button>
                        </a>
                        <Link href="/register" className="block">
                          <Button variant="outline" className="w-full">Tạo tài khoản miễn phí</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
        {label === "Tạo lúc" ? <Calendar className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
        {label}
      </span>
      <span className="max-w-[60%] truncate text-right font-medium">{value}</span>
    </div>
  );
}
