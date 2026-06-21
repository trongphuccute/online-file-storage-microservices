import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ChevronDown,
  Cloud,
  Github,
  LayoutDashboard,
  LogOut,
  Menu,
  Share2,
  User,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "./Button";
import { authApi, tokenStore } from "@/lib/api";

function getInitials(name: string) {
  return name
    .split(/[._\-\s]/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const token = tokenStore.get();
    if (token) {
      setLoggedIn(true);
      authApi
        .me()
        .then((profile) => {
          setUsername(profile.username);
          setRole(profile.role ?? null);
        })
        .catch(() => {});
    } else {
      setLoggedIn(false);
      setUsername("");
      setRole(null);
    }

    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(activeTheme);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("cloudvault_theme", nextTheme);
    setTheme(nextTheme);
  };

  const onLogout = () => {
    authApi.logout();
    setLoggedIn(false);
    setUsername("");
    setRole(null);
    setDropdownOpen(false);
  };

  const isActive = (href: string) => router.pathname === href;

  const navLinks = [
    { href: "/#services", label: "Dịch vụ" },
    { href: "/features", label: "Tính năng" },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? "color-mix(in oklch, var(--card) 84%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        boxShadow: scrolled ? "var(--shadow-elegant)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-85">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--primary)]/25 bg-[var(--primary)]/12">
            <Cloud className="h-5 w-5 text-[var(--primary)]" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CloudVault</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
            >
              {label}
            </Link>
          ))}
          {loggedIn && role !== "admin" && (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive("/dashboard")
                    ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link
                href="/shares"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive("/shares")
                    ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
                }`}
              >
                <Share2 className="h-3.5 w-3.5" /> Chia sẻ
              </Link>
            </>
          )}
          {loggedIn && role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                isActive("/admin")
                  ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)]/45 hover:text-[var(--foreground)]"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href="https://github.com/trongphuccute/online-file-storage-microservices"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)]/45 hover:text-[var(--foreground)]"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>

          {loggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/70 px-3 py-1.5 text-sm transition hover:border-[var(--primary)]/45 hover:bg-[var(--card)]"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-[var(--primary-foreground)]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {username ? getInitials(username) : <User className="h-3.5 w-3.5" />}
                </span>
                <span className="max-w-[120px] truncate font-medium">{username || "Tài khoản"}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-elegant">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--background)]/70 hover:text-[var(--foreground)]"
                  >
                    <User className="h-4 w-4" /> Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/shares"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--background)]/70 hover:text-[var(--foreground)]"
                  >
                    <Share2 className="h-4 w-4" /> Quản lý chia sẻ
                  </Link>
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--background)]/70 hover:text-[var(--foreground)]"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Admin
                    </Link>
                  )}
                  <div className="h-px bg-[var(--border)]" />
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/register">
                <Button size="sm" variant="outline">
                  Đăng ký
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Đăng nhập</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)]/95 px-5 py-4 backdrop-blur-xl md:hidden">
          <nav className="mb-4 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
              >
                {label}
              </Link>
            ))}
            {loggedIn && role !== "admin" && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <Link
                  href="/shares"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
                >
                  <Share2 className="h-3.5 w-3.5" /> Chia sẻ
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
                >
                  <User className="h-3.5 w-3.5" /> Hồ sơ
                </Link>
              </>
            )}
            {loggedIn && role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>
          <div className="flex flex-col gap-2">
            {loggedIn ? (
              <Button
                variant="outline"
                onClick={onLogout}
                className="gap-2 hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </Button>
            ) : (
              <>
                <Link href="/login" className="w-full">
                  <Button className="w-full">Đăng nhập</Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
