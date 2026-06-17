import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, User, Lock, ArrowRight, ShieldCheck, Zap, HardDrive } from "lucide-react";
import { authApi, tokenStore } from "@/lib/api";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const features = [
  { icon: HardDrive, text: "10 GB lưu trữ miễn phí" },
  { icon: ShieldCheck, text: "Bảo mật end-to-end" },
  { icon: Zap, text: "Tốc độ truy cập cao" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const justRegistered = router.query.registered === "1";
  const sessionExpired = router.query.expired === "1";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const data = await authApi.login(username, password);
      tokenStore.set(data.access, data.refresh);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Đăng nhập · CloudVault</title></Head>
      <main className="relative flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        {/* Left branding — desktop only */}
        <div className="relative z-10 hidden w-1/2 flex-col items-start justify-between p-12 lg:flex">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]/30">
              <Cloud className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-xl font-semibold tracking-tight">CloudVault</span>
          </Link>

          <div>
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <h2 className="text-4xl font-bold leading-tight tracking-tight">
                Lưu trữ thông minh,<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  an toàn &amp; nhanh
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-base text-[var(--muted-foreground)]">
                Quản lý toàn bộ file từ một nơi. Chia sẻ, tải lên và truy cập mọi lúc, mọi nơi.
              </p>
            </motion.div>

            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                    <Icon className="h-4 w-4 text-[var(--primary)]" />
                  </span>
                  {text}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="pointer-events-none absolute bottom-24 left-16 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
          <p className="text-xs text-[var(--muted-foreground)]">© 2026 CloudVault.</p>
        </div>

        {/* Right form panel */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]/30">
              <Cloud className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CloudVault</span>
          </Link>

          <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-sm">
            <motion.div variants={fadeUp} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-8 shadow-elegant backdrop-blur-xl">
              <motion.div variants={fadeUp}>
                <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h1>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">Đăng nhập để truy cập kho lưu trữ.</p>
              </motion.div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <AnimatePresence>
                  {justRegistered && (
                    <motion.p key="reg" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                      ✓ Đăng ký thành công! Hãy đăng nhập.
                    </motion.p>
                  )}
                  {sessionExpired && (
                    <motion.p key="exp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                      ⚠ Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div variants={fadeUp}>
                  <IconField label="Tên đăng nhập" type="text" value={username} onChange={setUsername} placeholder="vd: nguyenvana" icon={<User className="h-4 w-4" />} required />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <IconField label="Mật khẩu" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={<Lock className="h-4 w-4" />} required />
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.p key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-xs text-[var(--destructive)]">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div variants={fadeUp}>
                  <button type="submit" disabled={loading}
                    className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium text-[var(--primary-foreground)] transition-all duration-200 disabled:opacity-60"
                    style={{ background: "var(--gradient-primary)" }}>
                    {loading
                      ? <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z" /></svg>
                      : <><span>Đăng nhập</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                </motion.div>
              </form>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-[var(--primary)] hover:underline">Đăng ký miễn phí</Link>
            </motion.p>
          </motion.div>
        </div>
      </main>
    </>
  );
}

function IconField({ label, type, value, onChange, placeholder, icon, required }: {
  label: string; type: string; value: string; placeholder?: string;
  icon: React.ReactNode; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--muted-foreground)]">{icon}</span>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] pl-10 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/50" />
      </div>
    </label>
  );
}
