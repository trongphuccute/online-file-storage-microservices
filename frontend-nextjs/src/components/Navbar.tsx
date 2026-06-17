import { useEffect, useRef, useState, memo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Cloud,
  LayoutDashboard,
  LogOut,
  Share2,
  User,
  Sun,
  Moon,
  Search,
  Bell,
  Upload,
  Home,
  Menu,
  ChevronDown
} from "lucide-react";
import { authApi, tokenStore } from "@/lib/api";

function getInitials(name: string) {
  return name
    .split(/[._\-\s]/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export const Navbar = memo(function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const token = tokenStore.get();
    if (token) {
      setLoggedIn(true);
      authApi
        .me()
        .then((profile) => setUsername(profile.username))
        .catch(() => {});
    } else {
      setLoggedIn(false);
      setUsername("");
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
    setDropdownOpen(false);
  }, [router.pathname]);

  // Click outside to close dropdown
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

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("cloudvault_theme", nextTheme);
    setTheme(nextTheme);
  }, [theme]);

  const onLogout = useCallback(() => {
    authApi.logout();
    setLoggedIn(false);
    setUsername("");
    setDropdownOpen(false);
  }, []);

  const isActive = (href: string) => router.pathname === href;

  // Debounced search trigger (simulate search query param change after 500ms delay)
  useEffect(() => {
    if (searchVal === "") return;
    const delayDebounceFn = setTimeout(() => {
      // Direct router trigger or trigger internal custom event if page is dashboard
      if (router.pathname === "/dashboard") {
        const event = new CustomEvent("dashboardSearch", { detail: searchVal });
        window.dispatchEvent(event);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, router.pathname]);

  return (
    <>
      {/* Top sticky Header for Desktop and general branding */}
      <header
        className="sticky top-0 z-40 w-full transition-all duration-300 backdrop-blur-md border-b"
        style={{
          background: scrolled ? "color-mix(in oklch, var(--card) 85%, transparent)" : "var(--card)/25",
          borderColor: scrolled ? "var(--border)" : "transparent",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-85">
            <span className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10">
              <Cloud className="h-4.5 w-4.5 text-[var(--primary)]" />
            </span>
            <span className="text-base font-bold tracking-tight">CloudVault</span>
          </Link>

          {/* Search bar on Desktop */}
          {loggedIn && (
            <div className="hidden md:flex relative w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Tìm kiếm nhanh tệp tin..."
                className="h-9 w-full rounded-xl border border-[var(--input)] bg-[var(--background)]/50 pl-9 pr-4 text-xs outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--ring)]/40"
              />
            </div>
          )}

          {/* Desktop Right navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {loggedIn && (
              <>
                <Link href="/upload" className="hidden md:block">
                  <button className="flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-glow text-xs font-semibold transition">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                </Link>

                <button
                  className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                </button>

                {/* Avatar and drop-down menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 px-2.5 py-1.5 text-xs transition hover:border-[var(--primary)]/45"
                  >
                    <span
                      className="flex h-5.5 w-5.5 items-center justify-center rounded-full text-[9px] font-bold text-[var(--primary-foreground)] bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)]"
                    >
                      {username ? getInitials(username) : <User className="h-3 w-3" />}
                    </span>
                    <span className="max-w-[100px] truncate font-medium hidden sm:inline">{username || "User"}</span>
                    <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-elegant z-50">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
                      >
                        <User className="h-4 w-4" /> Hồ sơ cá nhân
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Bảng điều khiển
                      </Link>
                      <Link
                        href="/shares"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
                      >
                        <Share2 className="h-4 w-4" /> Tệp đã chia sẻ
                      </Link>
                      <div className="h-px bg-[var(--border)]" />
                      <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition"
                      >
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!loggedIn && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="text-xs font-semibold px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Đăng nhập</Link>
                <Link href="/register" className="text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:shadow-glow transition">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      {loggedIn && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)]/90 backdrop-blur-lg border-t border-[var(--border)] px-6 py-2 flex items-center justify-between shadow-elegant">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
              isActive("/") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Trang chủ</span>
          </Link>
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
              isActive("/dashboard") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Tệp tin</span>
          </Link>
          <Link
            href="/shares"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
              isActive("/shares") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            <Share2 className="h-5 w-5" />
            <span>Chia sẻ</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
              isActive("/profile") ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            <User className="h-5 w-5" />
            <span>Tôi</span>
          </Link>
        </nav>
      )}
    </>
  );
});
