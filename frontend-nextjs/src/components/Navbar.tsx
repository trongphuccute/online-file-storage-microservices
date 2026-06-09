import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Cloud, Github, LogOut, LayoutDashboard, Menu, X,
  Share2, User, ChevronDown,
} from "lucide-react";
import { Button } from "./Button";
import { tokenStore, authApi } from "@/lib/api";

function getInitials(name: string) {
  return name.split(/[._\-\s]/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = tokenStore.get();
    if (token) {
      setLoggedIn(true);
      // Lấy tên user từ profile nếu có
      authApi.me().then((p) => setUsername(p.username)).catch(() => {});
    } else {
      setLoggedIn(false);
      setUsername("");
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [router.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const onLogout = () => {
    tokenStore.clear();
    setLoggedIn(false);
    setUsername("");
    setDropdownOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => router.pathname === href;

  const navLinks = [
    { href: "/#services", label: "Services" },
    { href: "/#gallery",  label: "Thư viện" },
    { href: "/#features", label: "Tính năng" },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: scrolled ? "oklch(0.16 0.015 240 / 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 24px oklch(0 0 0 / 0.3)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]/30">
              <Cloud className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CloudVault</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)]/60 hover:text-[var(--foreground)]">
                {label}
              </Link>
            ))}
            {loggedIn && (
              <Link href="/dashboard"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-[var(--card)]/60 ${
                  isActive("/dashboard") ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}>
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
            )}
            {loggedIn && (
              <Link href="/shares"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-[var(--card)]/60 ${
                  isActive("/shares") ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}>
                <Share2 className="h-3.5 w-3.5" /> Shares
              </Link>
            )}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <a href="https://github.com/trongphuccute/online-file-storage-microservices" target="_blank" rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]">
              <Github className="h-4 w-4" />
            </a>

            {loggedIn ? (
              /* Profile dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 px-3 py-1.5 text-sm transition hover:border-[var(--primary)]/40 hover:bg-[var(--card)]">
                  {/* Avatar initials */}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-[var(--primary-foreground)]"
                    style={{ background: "var(--gradient-primary)" }}>
                    {username ? getInitials(username) : <User className="h-3.5 w-3.5" />}
                  </div>
                  <span className="max-w-[100px] truncate font-medium">{username || "Profile"}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-elegant">
                    <Link href="/profile"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]">
                      <User className="h-4 w-4" /> Hồ sơ cá nhân
                    </Link>
                    <Link href="/shares"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]">
                      <Share2 className="h-4 w-4" /> Quản lý Shares
                    </Link>
                    <div className="h-px bg-[var(--border)]" />
                    <button onClick={onLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]">
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/register"><Button size="sm" variant="outline">Đăng ký</Button></Link>
                <Link href="/login"><Button size="sm">Đăng nhập</Button></Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] md:hidden">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--background)]/95 px-6 py-4 backdrop-blur-xl md:hidden">
            <nav className="mb-4 flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}
                  className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/60 hover:text-[var(--foreground)]">
                  {label}
                </Link>
              ))}
              {loggedIn && (
                <>
                  <Link href="/dashboard"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/60 hover:text-[var(--foreground)]">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                  </Link>
                  <Link href="/shares"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/60 hover:text-[var(--foreground)]">
                    <Share2 className="h-3.5 w-3.5" /> Shares
                  </Link>
                  <Link href="/profile"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/60 hover:text-[var(--foreground)]">
                    <User className="h-3.5 w-3.5" /> Hồ sơ
                  </Link>
                </>
              )}
            </nav>
            <div className="flex flex-col gap-2">
              {loggedIn ? (
                <Button variant="outline" onClick={onLogout} className="gap-2 hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </Button>
              ) : (
                <>
                  <Link href="/login" className="w-full"><Button className="w-full">Đăng nhập</Button></Link>
                  <Link href="/register" className="w-full"><Button variant="outline" className="w-full">Đăng ký</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
