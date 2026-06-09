import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, File as FileIcon, FileText, FileImage, FileVideo, FileArchive,
  Loader2, AlertCircle, Calendar, Clock, CheckCircle2, Download
} from "lucide-react";
import { Button } from "@/components/Button";
import { shareApi, type ShareLink } from "@/lib/api";

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

export default function PublicSharePage() {
  const router = useRouter();
  const { token } = router.query as { token: string };

  const [share, setShare] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    shareApi.publicShare(token)
      .then((data) => setShare(data))
      .catch((e) => setError(e.message || "Link không hợp lệ hoặc đã hết hạn"))
      .finally(() => setLoading(false));
  }, [token]);

  const isExpired = share?.expires_at ? new Date(share.expires_at) <= new Date() : false;

  const fileInfo = share?.file_info;
  const { Icon, color } = fileInfo ? getFileIcon(fileInfo.original_name) : { Icon: FileIcon, color: "var(--primary)" };

  return (
    <>
      <Head>
        <title>{fileInfo ? `${fileInfo.original_name} · CloudVault` : "File được chia sẻ · CloudVault"}</title>
      </Head>
      <main className="relative flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px]" style={{ background: "var(--gradient-hero)" }} />

        {/* Top bar */}
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

        {/* Content */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="w-full max-w-md">

            <AnimatePresence mode="wait">
              {/* Loading */}
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-12 text-center backdrop-blur-xl shadow-elegant">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">Đang tải thông tin file…</p>
                </motion.div>
              )}

              {/* Error */}
              {!loading && error && (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--destructive)]/30 bg-[var(--card)]/80 p-10 text-center backdrop-blur-xl shadow-elegant">
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

              {/* Success */}
              {!loading && !error && share && (
                <motion.div key="share" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl shadow-elegant">

                  {/* Header gradient band */}
                  <div className="relative overflow-hidden px-8 pb-6 pt-8 text-center"
                    style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.78 0.14 195 / 0.15), transparent)" }}>
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]/30"
                      style={{ background: fileInfo ? `${color}18` : undefined, boxShadow: fileInfo ? `inset 0 0 0 1px ${color}30` : undefined }}>
                      <Icon className="h-8 w-8" style={{ color }} />
                    </motion.div>
                    <h1 className="mt-4 text-xl font-bold truncate px-4" title={fileInfo?.original_name || "File được chia sẻ"}>
                      {fileInfo?.original_name || "File được chia sẻ"}
                    </h1>
                    <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                      {fileInfo ? formatBytes(fileInfo.size) : `ID: ${share.file_id}`}
                    </p>
                  </div>

                  {/* Meta info */}
                  <div className="px-8 pb-6">
                    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <CheckCircle2 className="h-4 w-4" /> Trạng thái
                        </span>
                        <span className={`font-medium ${share.is_active && !isExpired ? "text-green-400" : "text-[var(--destructive)]"}`}>
                          {isExpired ? "Đã hết hạn" : share.is_active ? "Hoạt động" : "Đã tắt"}
                        </span>
                      </div>
                      <div className="h-px bg-[var(--border)]" />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <Clock className="h-4 w-4" /> Hết hạn
                        </span>
                        <span className={isExpired ? "text-[var(--destructive)]" : ""}>
                          {share.expires_at ? new Date(share.expires_at).toLocaleString("vi-VN") : "Không giới hạn"}
                        </span>
                      </div>
                      <div className="h-px bg-[var(--border)]" />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <Calendar className="h-4 w-4" /> Tạo lúc
                        </span>
                        <span>{new Date(share.created_at).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-5 space-y-3">
                      {fileInfo?.url ? (
                        <a href={fileInfo.url} download={fileInfo.original_name} target="_blank" rel="noreferrer" className="block">
                          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 hover:shadow-glow"
                            style={{ background: "var(--gradient-primary)" }}>
                            <Download className="h-4 w-4" /> Tải xuống file
                          </button>
                        </a>
                      ) : (
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center text-xs text-yellow-400">
                          Không tìm thấy file để tải xuống trực tiếp.
                        </div>
                      )}
                      <Link href="/register" className="block">
                        <Button variant="outline" className="w-full">Tạo tài khoản miễn phí</Button>
                      </Link>
                    </div>

                    <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
                      Được chia sẻ qua <span className="text-[var(--primary)]">CloudVault</span>
                    </p>
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
