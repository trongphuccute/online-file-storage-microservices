import Link from "next/link";
import { motion } from "framer-motion";
import { Cloud, Github, Twitter, Linkedin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[var(--card)]/40 border-t border-[var(--border)] relative z-10">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="space-y-4 md:col-span-1.5">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10">
                <Cloud className="h-4.5 w-4.5 text-[var(--primary)]" />
              </span>
              <span className="text-base font-bold tracking-tight">CloudVault</span>
            </Link>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xs">
              Hệ thống lưu trữ đám mây microservices hiện đại, tối ưu hóa tốc độ tải lên, chia sẻ an toàn và quản lý tệp tin trực quan.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Liên kết nhanh</h4>
            <ul className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <li>
                <Link href="/dashboard" className="hover:text-[var(--primary)] transition">Kho tài liệu</Link>
              </li>
              <li>
                <Link href="/shares" className="hover:text-[var(--primary)] transition">Tệp đã chia sẻ</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[var(--primary)] transition">Hồ sơ cá nhân</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Tài nguyên</h4>
            <ul className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <li>
                <Link href="https://github.com/trongphuccute/online-file-storage-microservices" target="_blank" className="hover:text-[var(--primary)] transition">GitHub Repo</Link>
              </li>
              <li>
                <span className="hover:text-[var(--primary)] cursor-pointer transition">Tài liệu API</span>
              </li>
              <li>
                <span className="hover:text-[var(--primary)] cursor-pointer transition">Hướng dẫn sử dụng</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Kết nối</h4>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            © 2026 Online File Storage. Built with Next.js + Django + Azure.
          </p>
          <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>by Antigravity &amp; Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
