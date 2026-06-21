import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: "" };
  if (pw.length < 6) return { level: 1, label: "Yếu", color: "#ef4444" };
  if (pw.length < 8) return { level: 2, label: "Trung bình", color: "#f97316" };
  if (pw.length < 12) return { level: 3, label: "Tốt", color: "#22c55e" };
  return { level: 4, label: "Mạnh", color: "var(--primary)" };
}

const STEPS = ["Tài khoản", "Email", "Mật khẩu"];

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = !username ? 0 : !email ? 1 : 2;
  const strength = getPasswordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (username.trim().length < 3) { setError("Tên đăng nhập phải có ít nhất 3 ký tự"); return; }
    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    setLoading(true);
    try {
      await authApi.register(username.trim(), email.trim(), password);
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Đăng ký · CloudVault</title></Head>
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
                Bắt đầu miễn phí,<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  không giới hạn ý tưởng
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-base text-[var(--muted-foreground)]">
                Tạo tài khoản và nhận 10 GB lưu trữ miễn phí. Không cần thẻ tín dụng.
              </p>
            </motion.div>

            {/* Testimonial card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-5 backdrop-blur">
              <p className="text-sm text-[var(--muted-foreground)]">
                &ldquo;CloudVault giúp nhóm chúng tôi chia sẻ file dễ dàng và bảo mật hơn nhiều.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--primary)]/20 ring-1 ring-[var(--primary)]/30" />
                <div>
                  <p className="text-xs font-medium">Nguyễn Văn A</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Developer</p>
                </div>
              </div>
            </motion.div>
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
            {/* Step indicator */}
            <motion.div variants={fadeUp} className="mb-6 flex items-center justify-center gap-2">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"
                      style={i < activeStep
                        ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)" }
                        : i === activeStep
                        ? { background: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "0 0 0 3px oklch(0.78 0.14 195 / 0.25)" }
                        : { background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                      {i < activeStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{step}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="mb-3 h-px w-8 transition-all duration-500"
                      style={{ background: i < activeStep ? "var(--primary)" : "var(--border)" }} />
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-8 shadow-elegant backdrop-blur-xl">
              <motion.div variants={fadeUp}>
                <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản</h1>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">10 GB lưu trữ miễn phí cho mỗi tài khoản.</p>
              </motion.div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <motion.div variants={fadeUp}>
                  <IconField label="Tên đăng nhập" type="text" value={username} onChange={setUsername} placeholder="vd: nguyenvana (≥ 3 ký tự)" icon={<User className="h-4 w-4" />} required />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <IconField label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" icon={<Mail className="h-4 w-4" />} required />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <IconField label="Mật khẩu" type="password" value={password} onChange={setPassword} placeholder="Ít nhất 8 ký tự" icon={<Lock className="h-4 w-4" />} required />
                  {/* Password strength */}
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{ background: s <= strength.level ? strength.color : "var(--border)" }} />
                          ))}
                        </div>
                        {strength.label && <p className="mt-1 text-xs" style={{ color: strength.color }}>{strength.label}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                      : <><span>Tạo tài khoản</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                </motion.div>
              </form>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">Đăng nhập</Link>
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
