import { useRef, useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Loader2, CheckCircle2, FileText, FileImage, FileVideo, FileArchive, File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { fileApi, tokenStore } from "@/lib/api";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(2)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return { Icon: FileImage, color: "#22c55e" };
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return { Icon: FileVideo, color: "#a855f7" };
  if (["pdf", "doc", "docx", "txt", "md", "xlsx", "csv"].includes(ext)) return { Icon: FileText, color: "var(--primary)" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { Icon: FileArchive, color: "#f97316" };
  return { Icon: FileIcon, color: "var(--muted-foreground)" };
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Simulated progress while uploading
  useEffect(() => {
    if (status !== "uploading") return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 85) { clearInterval(interval); return 85; } return p + Math.random() * 12; });
    }, 200);
    return () => clearInterval(interval);
  }, [status]);

  const upload = async () => {
    if (!file) return;
    if (!tokenStore.get()) { router.push("/login"); return; }
    setStatus("uploading"); setError(null);
    try {
      await fileApi.upload(file);
      setProgress(100);
      setStatus("done");
      setTimeout(() => router.push("/dashboard"), 1400);
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Upload thất bại");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); setStatus("idle"); setError(null); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) { setFile(f); setStatus("idle"); setError(null); }
  };

  const clearFile = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setFile(null); setStatus("idle"); setError(null); setProgress(0);
  };

  const fileInfo = file ? getFileIcon(file.name) : null;
  const FileIcon = fileInfo?.Icon;

  return (
    <>
      <Head><title>Upload · CloudVault</title></Head>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px]" style={{ background: "var(--gradient-hero)" }} />
        <Navbar />
        <section className="relative z-10 mx-auto max-w-2xl px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Upload file mới</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Kéo thả hoặc chọn file từ máy tính.</p>
          </motion.div>

          {/* Dropzone */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => status !== "uploading" && inputRef.current?.click()}
            className="group relative mt-8 cursor-pointer select-none overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300"
            style={{
              borderColor: drag ? "var(--primary)" : status === "done" ? "#22c55e" : "var(--border)",
              background: drag ? "oklch(0.78 0.14 195 / 0.06)" : "var(--card)",
            }}>
            <AnimatePresence>
              {drag && (
                <motion.div key="glow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{ boxShadow: "inset 0 0 40px oklch(0.78 0.14 195 / 0.15)" }} />
              )}
            </AnimatePresence>

            <input ref={inputRef} type="file" hidden onChange={handleFile} />

            <div className="flex flex-col items-center p-12 text-center">
              <AnimatePresence mode="wait">
                {status === "done" ? (
                  <motion.div key="done" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="font-semibold text-green-400">Upload thành công!</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Đang chuyển về dashboard…</p>
                  </motion.div>
                ) : file ? (
                  <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex w-full flex-col items-center gap-4">
                    <div className="flex w-full max-w-sm items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)]/60 p-4 text-left">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${fileInfo!.color}18` }}>
                        {FileIcon && <FileIcon className="h-6 w-6" style={{ color: fileInfo?.color }} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                      </div>
                      <button onClick={clearFile} className="shrink-0 rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">Click để chọn file khác</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col items-center gap-3">
                    <motion.div animate={drag ? { scale: 1.12, rotate: -4 } : { scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                      <UploadCloud className="h-8 w-8 text-[var(--primary)]" />
                    </motion.div>
                    <div>
                      <p className="font-semibold">{drag ? "Thả file vào đây" : "Kéo thả file vào đây"}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        hoặc{" "}
                        <span className="text-[var(--primary)] underline underline-offset-2">click để chọn</span>{" "}
                        từ máy tính
                      </p>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">Hỗ trợ tất cả định dạng file phổ biến</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <AnimatePresence>
              {status === "uploading" && (
                <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-2xl bg-[var(--secondary)]">
                  <motion.div className="h-full rounded-full" style={{ background: "var(--gradient-primary)" }}
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: "easeOut" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Progress text */}
          <AnimatePresence>
            {status === "uploading" && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải lên… {Math.round(progress)}%
              </motion.p>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          {status !== "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setFile(null); setStatus("idle"); setError(null); setProgress(0); }} disabled={!file || status === "uploading"}>
                Huỷ
              </Button>
              <Button onClick={upload} disabled={!file || status === "uploading"} className="gap-2">
                {status === "uploading"
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang upload…</>
                  : <><UploadCloud className="h-4 w-4" /> Upload</>}
              </Button>
            </motion.div>
          )}
        </section>
      </main>
    </>
  );
}
