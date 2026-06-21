import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";

export function Sidebar({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; icon?: ReactNode }[];
}) {
  const { pathname } = useRouter();

  return (
    <aside
      className="flex h-full w-full flex-col gap-6 overflow-y-auto border-r border-[var(--border)]/60 p-5"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 0 16px var(--primary-glow)",
          }}
        >
          <LayoutDashboard className="h-5 w-5 text-[var(--primary-foreground)]" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-[var(--foreground)]">CloudVault</p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--primary)] opacity-80">
            Admin Panel
          </p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }}
      />

      {/* ── Navigation ── */}
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-in-out",
                isActive
                  ? "text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--primary)]/8",
              ].join(" ")}
              style={
                isActive
                  ? {
                      background: "linear-gradient(90deg, oklch(0.76 0.14 190 / 0.22), oklch(0.76 0.14 190 / 0.06))",
                      boxShadow: "inset 3px 0 0 var(--primary)",
                    }
                  : undefined
              }
            >
              {/* left glow streak for active */}
              {isActive && (
                <span
                  className="pointer-events-none absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full"
                  style={{ background: "var(--primary)", boxShadow: "0 0 8px var(--primary-glow)" }}
                />
              )}
              {item.icon && (
                <span
                  className={[
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-all duration-200",
                    isActive
                      ? "bg-[var(--primary)]/25 text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
