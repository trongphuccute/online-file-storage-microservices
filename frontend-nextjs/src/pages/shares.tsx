import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Loader2, Trash2, Link2, Copy, CheckCheck,
  ToggleLeft, ToggleRight, Calendar, AlertTriangle,
  FolderOpen, Search, X, Clock,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { shareApi, tokenStore, type ShareLink } from "@/lib/api";
import { useToast } from "@/components/Toast";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isExpired(link: ShareLink): boolean {
  if (!link.expires_at) return false;
  return new Date(link.expires_at) <= new Date();
}

function StatusBadge({ link }: { link: ShareLink }) {
  if (isExpired(link))
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
        style={{ borderColor: "var(--destructive)", color: "var(--destructive)", background: "oklch(0.577 0.245 27.325 / 0.1)" }}>
        <Clock className="h-3 w-3" /> Hết hạn
      </span>
    );
  if (!link.is_active)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
        Đã tắt
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
      style={{ borderColor: "rgba(34,197,94,0.4)", color: "#22c55e", background: "rgba(34,197,94,0.08)" }}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e]" />
      Hoạt động
    </span>
  );
}

export default function SharesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const data = await shareApi.list();
      setShares(data);
    } catch (e: any) {
      setErr(e.message || "Không tải được danh sách");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
    } else {
      setAuthorized(true);
      load();
    }
  }, [load, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const handleCopy = async (link: ShareLink) => {
    const url = `${window.location.origin}/public/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(link.token);
    success("Đã copy link chia sẻ!");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleToggle = async (link: ShareLink) => {
    setTogglingId(link.token);
    try {
      const updated = await shareApi.update(link.token, { is_active: !link.is_active });
      setShares((prev) => prev.map((s) => (s.token === link.token ? updated : s)));
      success(updated.is_active ? "Đã bật share link" : "Đã tắt share link");
    } catch (e: any) {
      toastError(e.message || "Cập nhật thất bại");
    } finally { setTogglingId(null); }
  };

  const handleDelete = async (link: ShareLink) => {
    setDeletingId(link.token);
    try {
      await shareApi.remove(link.token);
      setShares((prev) => prev.filter((s) => s.token !== link.token));
      success("Đã xóa share link");
    } catch (e: any) {
      toastError(e.message || "Xóa thất bại");
      setDeletingId(null);
    }
  };

  const filtered = shares.filter((s) =>
    s.token.toLowerCase().includes(search.toLowerCase()) ||
    String(s.file_id).includes(search)
  );

  const activeCount = shares.filter((s) => s.is_active && !isExpired(s)).length;
  const expiredCount = shares.filter((s) => isExpired(s)).length;

  return (
    <>
      <Head><title>Quản lý Share Links · CloudVault</title></Head>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[350px]" style={{ background: "var(--gradient-hero)" }} />
        <Navbar />

        <section className="relative z-10 mx-auto max-w-5xl px-6 py-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Tổng quan</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Share Links</h1>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <FolderOpen className="h-4 w-4" /> Về Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "Tổng links", val: shares.length, color: "var(--primary)" },
              { label: "Đang hoạt động", val: activeCount, color: "#22c55e" },
              { label: "Hết hạn", val: expiredCount, color: "var(--destructive)" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 text-center backdrop-blur">
                <p className="text-2xl font-bold" style={{ color }}>{val}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-5">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo token hoặc file ID…"
                className="h-9 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] pl-9 pr-8 text-sm placeholder:text-[var(--muted-foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* States */}
          {loading && (
            <div className="flex items-center gap-2 py-12 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          )}
          {err && (
            <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">{err}</div>
          )}
          {!loading && !err && shares.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/40 p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <Share2 className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Chưa có share link nào</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">Vào Dashboard và chia sẻ file để tạo link.</p>
              <Link href="/dashboard"><Button className="mt-6 gap-2"><FolderOpen className="h-4 w-4" /> Đến Dashboard</Button></Link>
            </motion.div>
          )}

          {/* Table */}
          {!loading && !err && filtered.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <AnimatePresence mode="popLayout">
                {filtered.map((link, i) => (
                  <motion.div key={link.token}
                    layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className={`flex flex-col gap-3 px-5 py-4 transition hover:bg-[var(--background)]/30 sm:flex-row sm:items-center sm:justify-between ${i < filtered.length - 1 ? "border-b border-[var(--border)]" : ""}`}>

                    {/* Left: info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                        <StatusBadge link={link} />
                        <span className="rounded-md border border-[var(--border)] bg-[var(--background)]/60 px-1.5 py-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                          File #{link.file_id}
                        </span>
                      </div>
                      <p className="truncate font-mono text-xs text-[var(--muted-foreground)]">
                        {link.token}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[var(--primary)]" /> Tạo: {formatDate(link.created_at)}
                        </span>
                        {link.expires_at && (
                          <span className="flex items-center gap-1" style={{ color: isExpired(link) ? "var(--destructive)" : undefined }}>
                            <Clock className="h-3 w-3" /> Hết hạn: {formatDate(link.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Copy */}
                      <motion.button
                        onClick={() => handleCopy(link)}
                        animate={copiedToken === link.token ? { scale: [1, 1.08, 1] } : {}}
                        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all"
                        style={copiedToken === link.token
                          ? { borderColor: "#22c55e", background: "rgba(34,197,94,0.1)", color: "#22c55e" }
                          : { borderColor: "var(--border)", color: "var(--foreground)" }}>
                        {copiedToken === link.token
                          ? <><CheckCheck className="h-3 w-3" /> Copied</>
                          : <><Copy className="h-3 w-3" /> Copy link</>}
                      </motion.button>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(link)}
                        disabled={isExpired(link) || togglingId === link.token}
                        title={link.is_active ? "Tắt link" : "Bật link"}
                        className="flex items-center justify-center rounded-lg border border-[var(--border)] px-2 py-1.5 transition hover:border-[var(--primary)]/50 disabled:opacity-40">
                        {togglingId === link.token
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--muted-foreground)]" />
                          : link.is_active
                            ? <ToggleRight className="h-4 w-4 text-[#22c55e]" />
                            : <ToggleLeft className="h-4 w-4 text-[var(--muted-foreground)]" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(link)}
                        disabled={deletingId === link.token}
                        className="flex items-center justify-center rounded-lg border border-[var(--border)] px-2 py-1.5 text-[var(--muted-foreground)] transition hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)] disabled:opacity-40">
                        {deletingId === link.token
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && !err && shares.length > 0 && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Không tìm thấy link nào khớp với &ldquo;{search}&rdquo;
            </div>
          )}
        </section>
      </main>
    </>
  );
}
