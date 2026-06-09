import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  Cloud, Upload, Shield, Share2, Zap, Database, Lock,
  ArrowRight, Github, Sparkles, CheckCircle, Images,
} from "lucide-react";
import { Button } from "@/components/Button";
import CircularGallery from "@/components/CircularGallery";import { Navbar } from "@/components/Navbar";

const galleryItems = [
  { image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&q=80", text: "sunset-trip.jpg" },
  { image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80", text: "mountains.png" },
  { image: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=600&q=80", text: "city-lights.jpg" },
  { image: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600&q=80", text: "ocean.png" },
  { image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80", text: "forest.jpg" },
  { image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80", text: "valley.png" },
  { image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80", text: "lake.jpg" },
  { image: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=600&q=80", text: "field.png" },
];

const services = [
  { icon: Shield, name: "Auth Service", desc: "Xác thực JWT, quản lý hồ sơ người dùng và phân quyền chi tiết.", port: ":8001", color: "#3b82f6" },
  { icon: Database, name: "File Service", desc: "Metadata, quota dung lượng và sẵn sàng Azure Blob Storage.", port: ":8002", color: "var(--primary)" },
  { icon: Share2, name: "Share Service", desc: "Tạo public link chia sẻ với expiration và kiểm soát truy cập.", port: ":8003", color: "#a855f7" },
];

const features = [
  { icon: Zap, title: "Tốc độ cao", desc: "Upload song song, streaming hiệu năng tối ưu." },
  { icon: Lock, title: "Bảo mật", desc: "Mã hóa end-to-end, JWT tokens và phân quyền chi tiết." },
  { icon: Cloud, title: "Cloud-native", desc: "Microservices độc lập, scale theo từng dịch vụ." },
  { icon: Sparkles, title: "Trải nghiệm mượt", desc: "UI tối giản, animation tinh tế, responsive." },
];

const perks = ["10 GB miễn phí", "Không cần thẻ tín dụng", "Chia sẻ link public", "Bảo mật JWT"];

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>CloudVault — Lưu trữ file đám mây Microservices</title>
        <meta name="description" content="Nền tảng lưu trữ file đám mây hiện đại với kiến trúc Microservices: xác thực JWT, quản lý quota, chia sẻ link an toàn." />
      </Head>
      <main className="relative overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
        {/* Background glows */}
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[700px]" style={{ background: "var(--gradient-hero)" }} />
        <div className="pointer-events-none fixed left-1/2 top-32 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--primary)]/8 blur-[140px]" />

        <Navbar />

        {/* ── Hero ── */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-20 text-center md:pb-24 md:pt-28">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/60 px-4 py-1.5 text-xs text-[var(--muted-foreground)] backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            Lưu trữ file đám mây,{" "}
            <span className="gradient-text">tối giản và mạnh mẽ.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg"
          >
            Upload, chia sẻ và quản lý dung lượng với ba dịch vụ độc lập. Kiến trúc cloud-native, hiệu năng cao, bảo mật.
          </motion.p>

          {/* Perks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {perks.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <CheckCircle className="h-3.5 w-3.5 text-[var(--primary)]" /> {p}
              </span>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register">
              <button className="group inline-flex h-12 items-center gap-2 rounded-xl px-7 font-semibold text-[var(--primary-foreground)] transition-all duration-200 hover:opacity-90 hover:shadow-glow"
                style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="h-4 w-4" />
                Đăng ký miễn phí
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Đăng nhập</Button>
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)]"
          >
            {[
              { val: "3", label: "Microservices" },
              { val: "10 GB", label: "Free quota" },
              { val: "JWT", label: "Authentication" },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center bg-[var(--card)] px-6 py-5">
                <span className="text-2xl font-bold gradient-text">{val}</span>
                <span className="mt-1 text-xs text-[var(--muted-foreground)]">{label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Gallery ── */}
        <section id="gallery" className="relative z-10 py-20">
          <div className="mx-auto mb-12 max-w-2xl px-6 text-center">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight md:text-4xl">
              Thư viện ảnh của bạn.
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-3 text-[var(--muted-foreground)]">
              Mỗi tệp ảnh được trình bày trong không gian xoay tròn. Kéo để khám phá.
            </motion.p>
          </div>
          <CircularGallery
              items={galleryItems}
              radius={420}
              onClickItem={(i) => router.push(`/gallery?open=${i}`)}
            />
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="mt-10 flex justify-center">
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="group gap-2">
                <Images className="h-4 w-4" />
                Xem toàn bộ album
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight md:text-4xl">
              Ba dịch vụ, một hệ thống.
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-3 text-[var(--muted-foreground)]">
              Tách biệt rõ ràng, dễ scale, dễ deploy từng phần độc lập.
            </motion.p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {services.map((s, i) => (
              <motion.div key={s.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:border-[var(--primary)]/40 hover:-translate-y-1 hover:shadow-glow">
                {/* Subtle color tint on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${s.color}18, transparent)` }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${s.color}18`, boxShadow: `inset 0 0 0 1px ${s.color}30` }}>
                    <s.icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{s.name}</h3>
                    <span className="font-mono text-xs text-[var(--muted-foreground)] rounded-md border border-[var(--border)] px-1.5 py-0.5">{s.port}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight md:text-4xl">
              Tính năng nổi bật.
            </motion.h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-6 backdrop-blur transition-all duration-300 hover:border-[var(--primary)]/40 hover:bg-[var(--card)]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                  <f.icon className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-hero)" }} />
            <div className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, var(--primary)/0.2, transparent)" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Sẵn sàng bắt đầu?</h2>
              <p className="mx-auto mt-3 max-w-xl text-[var(--muted-foreground)]">
                Clone repo, chạy ba service và frontend trong vài phút. Tài liệu setup đầy đủ.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/register">
                  <button className="inline-flex h-12 items-center gap-2 rounded-xl px-7 font-semibold text-[var(--primary-foreground)] transition-all duration-200 hover:opacity-90 hover:shadow-glow"
                    style={{ background: "var(--gradient-primary)" }}>
                    <Sparkles className="h-4 w-4" /> Đăng ký ngay
                  </button>
                </Link>
                <a href="https://github.com/trongphuccute/online-file-storage-microservices" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline"><Github className="mr-2 h-4 w-4" /> View Source</Button>
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[var(--muted-foreground)] sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)]/15">
                <Cloud className="h-3.5 w-3.5 text-[var(--primary)]" />
              </div>
              <span>© 2026 CloudVault — Cloud Computing Microservices</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Built with Django · Next.js · Azure</span>
              <a href="https://github.com/trongphuccute/online-file-storage-microservices" target="_blank" rel="noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] transition hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]">
                <Github className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
