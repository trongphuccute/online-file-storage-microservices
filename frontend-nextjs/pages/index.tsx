import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Cloud,
  Database,
  FolderOpen,
  Github,
  HardDrive,
  Images,
  LayoutDashboard,
  Loader2,
  Lock,
  Shield,
  Share2,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/Button";
import CircularGallery from "@/components/CircularGallery";
import { Navbar } from "@/components/Navbar";
import AnimatedShaderBackground from "@/components/ui/animated-shader-background";
import { authApi, fileApi, tokenStore, type CloudFile, type UserProfile } from "@/lib/api";

type GalleryItem = {
  image: string;
  text: string;
  file: CloudFile;
};

const services = [
  {
    icon: Shield,
    name: "Auth Service",
    desc: "JWT, hồ sơ người dùng và phân quyền được tách riêng để dễ kiểm soát.",
    port: ":8001",
    color: "#38bdf8",
  },
  {
    icon: Database,
    name: "File Service",
    desc: "Quản lý metadata, quota dung lượng và sẵn sàng kết nối Azure Blob Storage.",
    port: ":8002",
    color: "#2dd4bf",
  },
  {
    icon: Share2,
    name: "Share Service",
    desc: "Tạo public link, thời hạn truy cập và lớp kiểm soát chia sẻ an toàn.",
    port: ":8003",
    color: "#a78bfa",
  },
];

const features = [
  { icon: Upload, title: "Upload rõ ràng", desc: "Theo dõi quota, định dạng và trạng thái file trong cùng một luồng." },
  { icon: Lock, title: "Bảo mật JWT", desc: "Token, profile và quyền truy cập được xử lý qua Auth Service." },
  { icon: Cloud, title: "Cloud-native", desc: "Ba service độc lập giúp demo, scale và triển khai từng phần." },
  { icon: Zap, title: "UI nhất quán", desc: "Dashboard, gallery và share dùng chung màu, button, card và spacing." },
];

const perks = ["10 GB miễn phí", "Chia sẻ public link", "Kiến trúc microservices", "Dùng Django và Next.js"];

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

function useAuthHomeState() {
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(tokenStore.get()));
    setChecked(true);
  }, []);

  return { checked, loggedIn };
}

function GuestHome() {
  return (
    <>
      <section className="relative min-h-[760px] overflow-hidden">
        <AnimatedShaderBackground />
        {/* Dark mode: fade shader to bg. Light mode: keep bg visible */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.145_0.012_235/0.28),var(--background)_92%)] dark:block" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_bottom,oklch(0.975_0.008_200/0.55),var(--background)_88%)] light:block" />

        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-center px-5 pb-16 pt-24 md:px-6 md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            {/* Badge — adaptive text/bg */}
            <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-black/24 px-3 py-2 text-xs text-white/75 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Cloud file storage
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-normal text-white [.light_&]:text-[var(--foreground)] md:text-7xl">
              CloudVault
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78 [.light_&]:text-[var(--muted-foreground)] md:text-xl">
              Lưu trữ, quản lý và chia sẻ file trong một giao diện gọn.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2 shadow-[var(--shadow-glow)]">
                  <Sparkles className="h-4 w-4" />
                  Bắt đầu miễn phí
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-black/25 text-white [.light_&]:bg-white/80 [.light_&]:text-[var(--foreground)] [.light_&]:shadow-[var(--shadow-elegant)]"
                >
                  Đăng nhập
                </Button>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {perks.map((perk) => (
                <span key={perk} className="flex items-center gap-1.5 text-sm text-white/72 [.light_&]:text-[var(--muted-foreground)]">
                  <CheckCircle className="h-4 w-4 text-[var(--accent)]" />
                  {perk}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hero-stat-bar mt-12 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-white/12 bg-black/28 backdrop-blur [.light_&]:border-[var(--border)] [.light_&]:bg-white/70 [.light_&]:shadow-[var(--shadow-elegant)]"
          >
            {[
              { val: "3", label: "Services" },
              { val: "1 GB", label: "Free quota" },
              { val: "JWT", label: "Auth layer" },
            ].map(({ val, label }) => (
              <div key={label} className="border-r border-white/10 px-4 py-4 last:border-r-0 [.light_&]:border-[var(--border)]">
                <p className="hero-stat-val text-2xl font-semibold text-white [.light_&]:text-[var(--foreground)]">{val}</p>
                <p className="hero-stat-label mt-1 text-xs text-white/62 [.light_&]:text-[var(--muted-foreground)]">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="services" className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-sm font-medium text-[var(--primary)]">Backend rõ ranh giới</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Ba dịch vụ, một trải nghiệm.</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            UI hiển thị đúng mô hình hệ thống: xác thực, quản lý file và chia sẻ được tách thành từng service độc lập.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="surface group rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-glow)]"
            >
              <div
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: `${service.color}1f`, boxShadow: `inset 0 0 0 1px ${service.color}42` }}
              >
                <service.icon className="h-5 w-5" style={{ color: service.color }} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{service.name}</h3>
                <span className="rounded-md border border-[var(--border)] px-2 py-1 font-mono text-xs text-[var(--muted-foreground)]">
                  {service.port}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-sm font-medium text-[var(--primary)]">UI Thân Thiện - Dễ Dàng Sử Dụng</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Cùng một hệ thống màu, nút và surface.</h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="surface rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/12">
                <feature.icon className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="surface flex flex-col gap-6 rounded-xl p-6 md:flex-row md:items-center md:justify-between md:p-8"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-normal md:text-3xl">Sẵn sàng quản lý kho file?</h2>
            <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
              Tạo tài khoản để upload, theo dõi quota và tạo link chia sẻ từ cùng một giao diện.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button className="gap-2 shadow-[var(--shadow-glow)]">
                Đăng ký ngay
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com/trongphuccute/online-file-storage-microservices" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <Github className="h-4 w-4" />
                Source
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
}

function LoggedInHome() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [quota, setQuota] = useState<{ used: number; total: number } | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrls: string[] = [];

    async function loadUserHome() {
      setLoading(true);
      setError(null);
      try {
        const [me, userFiles, userQuota] = await Promise.all([
          authApi.me(),
          fileApi.list(),
          fileApi.quota().catch(() => null),
        ]);

        const imageFiles = userFiles.filter(isImage).slice(0, 12);
        const previews = await Promise.allSettled(
          imageFiles.map(async (file) => ({
            file,
            image: await fileApi.previewUrl(file),
            text: file.original_name || file.name || `file-${file.id}`,
          }))
        );

        const items = previews
          .filter((result): result is PromiseFulfilledResult<GalleryItem> => result.status === "fulfilled")
          .map((result) => result.value);

        objectUrls = items.map((item) => item.image);

        if (!active) return;
        setProfile(me);
        setFiles(userFiles);
        setQuota(userQuota);
        setGalleryItems(items);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không tải được dữ liệu trang chủ.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUserHome();

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const imageCount = useMemo(() => files.filter(isImage).length, [files]);
  const quotaPercent = quota ? Math.min((quota.used / quota.total) * 100, 100) : 0;

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">Trang chủ của bạn</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
                Xin chào{profile?.username ? `, ${profile.username}` : ""}.
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
                Đây là không gian quản lý nhanh sau khi đăng nhập: xem ảnh đã upload, theo dõi dung lượng và đi tới các thao tác chính.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/upload">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload ảnh
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="surface rounded-lg p-5">
              <div className="flex items-center gap-3">
                <Images className="h-5 w-5 text-[var(--primary)]" />
                <span className="text-sm text-[var(--muted-foreground)]">Ảnh đã upload</span>
              </div>
              <p className="mt-3 text-3xl font-semibold">{imageCount}</p>
            </div>
            <div className="surface rounded-lg p-5">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-[var(--primary)]" />
                <span className="text-sm text-[var(--muted-foreground)]">Tổng file</span>
              </div>
              <p className="mt-3 text-3xl font-semibold">{files.length}</p>
            </div>
            <div className="surface rounded-lg p-5">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-[var(--primary)]" />
                <span className="text-sm text-[var(--muted-foreground)]">Dung lượng</span>
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {quota ? `${formatBytes(quota.used)} / ${formatBytes(quota.total)}` : "Đang cập nhật"}
              </p>
              {quota && (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${quotaPercent}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16">
        <div className="mx-auto mb-8 flex max-w-7xl flex-col gap-4 px-5 md:flex-row md:items-end md:justify-between md:px-6">
          <div>
            <p className="text-sm font-medium text-[var(--primary)]">Ảnh của bạn</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Gallery từ file bạn đã upload.</h2>
            <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
              Phần scrollable này chỉ xuất hiện sau đăng nhập và chỉ dùng ảnh thuộc tài khoản hiện tại.
            </p>
          </div>
          <Link href="/gallery">
            <Button variant="outline" className="gap-2">
              <Images className="h-4 w-4" />
              Xem gallery
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-16 text-sm text-[var(--muted-foreground)] md:px-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải ảnh của bạn...
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-7xl px-5 md:px-6">
            <div className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && galleryItems.length > 0 && (
          <CircularGallery
            items={galleryItems}
            radius={Math.min(420, Math.max(260, galleryItems.length * 70))}
            onClickItem={(index) => router.push(`/gallery?open=${index}`)}
          />
        )}

        {!loading && !error && galleryItems.length === 0 && (
          <div className="mx-auto max-w-7xl px-5 md:px-6">
            <div className="surface rounded-lg p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--primary)]/12">
                <Images className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Bạn chưa có ảnh để hiển thị</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                Upload ảnh đầu tiên, sau đó quay lại trang chủ để xem gallery scrollable của riêng bạn.
              </p>
              <Link href="/upload">
                <Button className="mt-5 gap-2">
                  <Upload className="h-4 w-4" />
                  Upload ảnh
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default function Home() {
  const { checked, loggedIn } = useAuthHomeState();

  return (
    <>
      <Head>
        <title>CloudVault - Lưu trữ file đám mây Microservices</title>
        <meta
          name="description"
          content="Nền tảng lưu trữ file đám mây với Next.js, Django microservices, JWT, quota và chia sẻ link an toàn."
        />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        {!checked ? (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--muted-foreground)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang kiểm tra phiên đăng nhập...
          </div>
        ) : loggedIn ? (
          <LoggedInHome />
        ) : (
          <GuestHome />
        )}

        <footer className="relative z-10 border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 text-sm text-[var(--muted-foreground)] sm:flex-row md:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/12">
                <Cloud className="h-3.5 w-3.5 text-[var(--primary)]" />
              </span>
              <span>© 2026 CloudVault - Cloud Computing Microservices</span>
            </div>
            <span>Django · Next.js · Azure-ready</span>
          </div>
        </footer>
      </main>
    </>
  );
}
