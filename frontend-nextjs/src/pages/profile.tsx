import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  User, Mail, Calendar, HardDrive, Share2, FileText,
  LogOut, LayoutDashboard, Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { authApi, fileApi, shareApi, tokenStore, type UserProfile } from "@/lib/api";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getQuotaColor(pct: number) {
  if (pct < 60) return "var(--primary)";
  if (pct < 85) return "#f97316";
  return "#ef4444";
}

function getInitials(name: string) {
  return name
    .split(/[._-\s]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<{ used: number; total: number } | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [shareCount, setShareCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [prof, q, files, shares] = await Promise.allSettled([
        authApi.me(),
        fileApi.quota(),
        fileApi.list(),
        shareApi.list(),
      ]);
      if (prof.status === "fulfilled") setProfile(prof.value);
      else throw new Error("Không tải được thông tin người dùng");
      if (q.status === "fulfilled") setQuota(q.value);
      if (files.status === "fulfilled") setFileCount(files.value.length);
      if (shares.status === "fulfilled") setShareCount(shares.value.length);
    } catch (e: any) {
      setError(e.message || "Lỗi tải dữ liệu");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) { router.push("/login"); return; }
    load();
  }, [load, router]);

  const onLogout = () => {
    tokenStore.clear();
    router.push("/");
  };

  const quotaPercent = quota ? Math.min((quota.used / quota.total) * 100, 100) : 0;

  return (
    <>
      <Head><title>Hồ sơ · CloudVault</title></Head>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px]" style={{ background: "var(--gradient-hero)" }} />
        <Navbar />

        <section className="relative z-10 mx-auto max-w-2xl px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">Hồ sơ cá nhân</h1>
          </motion.div>

          {loading && (
            <div className="flex items-center gap-2 py-16 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
              {error}
              <button onClick={load} className="ml-3 inline-flex items-center gap-1 underline underline-offset-2">
                <RefreshCw className="h-3 w-3" /> Thử lại
              </button>
            </div>
          )}

          {!loading && profile && (
            <div className="space-y-5">
              {/* Avatar card */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
                <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "var(--gradient-hero)" }} />
                <div className="relative flex items-center gap-5">
                  {/* Avatar */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-[var(--primary-foreground)]"
                    style={{ background: "var(--gradient-primary)" }}>
                    {getInitials(profile.username)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight">{profile.username}</h2>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{profile.email || "—"}</p>
                    {profile.date_joined && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                        <Calendar className="h-3 w-3 text-[var(--primary)]" />
                        Tham gia từ {formatDate(profile.date_joined)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Info fields */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden">
                <InfoRow icon={<User className="h-4 w-4 text-[var(--primary)]" />} label="Tên đăng nhập" value={profile.username} />
                <InfoRow icon={<Mail className="h-4 w-4 text-[var(--primary)]" />} label="Email" value={profile.email || "Chưa cung cấp"} />
                <InfoRow icon={<Calendar className="h-4 w-4 text-[var(--primary)]" />} label="Ngày tham gia" value={formatDate(profile.date_joined)} />
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="grid grid-cols-2 gap-3">
                <StatCard icon={<FileText className="h-5 w-5 text-[var(--primary)]" />}
                  label="Tổng file" value={fileCount !== null ? String(fileCount) : "—"} />
                <StatCard icon={<Share2 className="h-5 w-5" style={{ color: "#a855f7" }} />}
                  label="Share links" value={shareCount !== null ? String(shareCount) : "—"} />
              </motion.div>

              {/* Quota */}
              {quota && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-5 backdrop-blur">
                  <div className="mb-3 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-[var(--primary)]" />
                    <span className="font-semibold text-sm">Dung lượng lưu trữ</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Đã dùng</span>
                    <span className="tabular-nums font-medium">
                      {formatBytes(quota.used)} <span className="text-[var(--muted-foreground)]">/ {formatBytes(quota.total)}</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--secondary)]">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${quotaPercent}%` }}
                      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: getQuotaColor(quotaPercent) }} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    {quotaPercent.toFixed(1)}% đã dùng · còn {formatBytes(quota.total - quota.used)} trống
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="flex flex-col gap-2 sm:flex-row">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Đến Dashboard
                  </Button>
                </Link>
                <Link href="/shares" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <Share2 className="h-4 w-4" /> Quản lý Shares
                  </Button>
                </Link>
                <Button variant="outline" onClick={onLogout} className="flex-1 gap-2 hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </Button>
              </motion.div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)]">
        {icon} {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-5 backdrop-blur">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary)]">
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
