import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, User, Mail, Lock, ArrowRight, Check, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

interface CriteriaItem {
  label: string;
  met: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time password validation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteria: CriteriaItem[] = [
    { label: "Ít nhất 8 ký tự", met: hasMinLength },
    { label: "Chữ hoa (A-Z)", met: hasUppercase },
    { label: "Chữ thường (a-z)", met: hasLowercase },
    { label: "Chữ số (0-9)", met: hasNumber },
    { label: "Ký tự đặc biệt (@, #, $, ...)", met: hasSpecial },
  ];

  const getPasswordStrength = () => {
    const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 0) return { level: 0, label: "", color: "bg-[var(--border)]" };
    if (score <= 2) return { level: 1, label: "Yếu 🔴", color: "bg-red-500" };
    if (score <= 4) return { level: 2, label: "Trung bình 🟡", color: "bg-amber-500" };
    return { level: 3, label: "Mạnh 🟢", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    const trimmedUser = username.trim();
    if (trimmedUser.length < 4 || trimmedUser.length > 30) {
      setError("Tên đăng nhập phải chứa từ 4 đến 30 ký tự.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUser)) {
      setError("Tên đăng nhập không được chứa ký tự đặc biệt nguy hiểm.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Địa chỉ email không đúng định dạng RFC.");
      return;
    }
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError("Mật khẩu không đáp ứng đầy đủ yêu cầu bảo mật.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register(trimmedUser, email.trim(), password);
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Đăng ký · CloudVault</title>
      </Head>
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
                  lưu trữ tuyệt đối an toàn
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-base text-[var(--muted-foreground)]">
                Tạo tài khoản và nhận 1 GB lưu trữ đám mây. Bảo vệ dữ liệu với các tiêu chuẩn mã hóa tiên tiến.
              </p>
            </motion.div>

            {/* Feature lists */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-5 backdrop-blur space-y-3"
            >
              <div className="flex items-center gap-2.5 text-xs text-[var(--muted-foreground)]">
                <Check className="h-4 w-4 text-[var(--primary)]" />
                <span>Trải nghiệm xem trước hình ảnh &amp; video mượt mà</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[var(--muted-foreground)]">
                <Check className="h-4 w-4 text-[var(--primary)]" />
                <span>Thiết lập chia sẻ tệp tin tức thì thông qua mã hóa liên kết</span>
              </div>
            </motion.div>
          </div>

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

          <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
            <motion.div variants={fadeUp} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-8 shadow-elegant backdrop-blur-xl">
              <motion.div variants={fadeUp}>
                <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản mới</h1>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">Đăng ký để nhận không gian lưu trữ trực tuyến.</p>
              </motion.div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <motion.div variants={fadeUp}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)]">Tên đăng nhập</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--muted-foreground)]">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="4-30 ký tự, không chứa ký tự lạ"
                        className="h-10.5 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] pl-10 pr-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40"
                        required
                      />
                    </div>
                  </label>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)]">Email</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--muted-foreground)]">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="h-10.5 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] pl-10 pr-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40"
                        required
                      />
                    </div>
                  </label>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)]">Mật khẩu</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--muted-foreground)]">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu an toàn"
                        className="h-10.5 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] pl-10 pr-10 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/40"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  {/* Password strength and requirements checklist */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3.5 space-y-3 text-xs overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted-foreground)]">Độ mạnh mật khẩu:</span>
                        <span className="font-semibold">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] overflow-hidden flex gap-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.level / 3) * 100}%` }}
                        />
                      </div>

                      {/* Criteria check icons */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                        {criteria.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            {c.met ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                            )}
                            <span className={c.met ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
                              {c.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-xs text-[var(--destructive)]"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div variants={fadeUp}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium text-[var(--primary-foreground)] transition-all duration-200 disabled:opacity-60"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>Tạo tài khoản</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
                Đăng nhập
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
