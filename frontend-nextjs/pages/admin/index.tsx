import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { LayoutDashboard, Users, Images, HardDrive, TrendingUp, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/Button";
import { Sidebar } from "@/components/ui/Sidebar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, RoleBadge, AvatarCircle } from "@/components/ui/Table";
import { adminApi, authApi, tokenStore, type AdminUserRow, type UserProfile } from "@/lib/api";

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

// ─── Bar Chart with grow animation + tooltip ─────────────────────────────────

const CHART_H = 160;
const LABEL_H = 26;
const VALUE_H = 18;
const MIN_BAR_W = 30;
const BAR_GAP = 10;

interface Tooltip { x: number; y: number; label: string; visible: boolean }

function BarChart({
  rows,
  metric,
}: {
  rows: AdminUserRow[];
  metric: "image_count" | "storage_used";
}) {
  const [tooltip, setTooltip] = useState<Tooltip>({ x: 0, y: 0, label: "", visible: false });
  const svgRef = useRef<SVGSVGElement>(null);

  if (!rows.length) return (
    <p className="py-8 text-center text-xs text-[var(--muted-foreground)]">No data</p>
  );

  const values = rows.map((r) => (metric === "image_count" ? r.image_count : r.storage_used));
  const max = Math.max(...values, 1);
  const barW = Math.max(MIN_BAR_W, Math.floor(560 / rows.length) - BAR_GAP);
  const totalW = rows.length * (barW + BAR_GAP) - BAR_GAP;
  const svgW = Math.max(totalW, 300);
  const svgH = CHART_H + VALUE_H + LABEL_H;

  const showTip = (e: React.MouseEvent, label: string) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, label, visible: true });
  };
  const hideTip = () => setTooltip((t) => ({ ...t, visible: false }));

  return (
    <div className="relative overflow-x-auto">
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-elegant"
          style={{ left: tooltip.x + 8, top: tooltip.y - 8 }}
        >
          {tooltip.label}
        </div>
      )}

      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: "block" }}
        onMouseLeave={hideTip}
      >
        {/* guide lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = VALUE_H + CHART_H - frac * CHART_H;
          return (
            <line
              key={frac}
              x1={0} y1={y} x2={svgW} y2={y}
              stroke="var(--border)"
              strokeWidth={0.6}
              strokeDasharray="4 4"
              opacity={0.5}
            />
          );
        })}

        {/* Y-axis value hints */}
        {[0.5, 1].map((frac) => {
          const rawVal = frac * max;
          const label = metric === "storage_used" ? formatBytes(rawVal) : String(Math.round(rawVal));
          const y = VALUE_H + CHART_H - frac * CHART_H;
          return (
            <text key={frac} x={2} y={y - 3} fontSize={7} fill="var(--muted-foreground)" opacity={0.6}>
              {label}
            </text>
          );
        })}

        {rows.map((row, i) => {
          const val = values[i];
          const barH = val > 0 ? Math.max((val / max) * CHART_H, 4) : 2;
          const x = i * (barW + BAR_GAP);
          const y = VALUE_H + CHART_H - barH;
          const username = row.username.length > 7 ? row.username.slice(0, 6) + "…" : row.username;
          const valLabel = metric === "storage_used" ? formatBytes(val) : String(val);
          const tipText = `${row.username}: ${valLabel}`;

          // bar fill: gradient for admin, solid purple for user
          const fillId = `bar-fill-${i}`;
          const isAdmin = row.role === "admin";

          return (
            <g
              key={row.id}
              style={{ cursor: "crosshair" }}
              onMouseMove={(e) => showTip(e, tipText)}
              onMouseEnter={(e) => showTip(e, tipText)}
              onMouseLeave={hideTip}
            >
              {/* gradient def for this bar */}
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isAdmin ? "var(--accent)" : "var(--primary-glow)"} />
                  <stop offset="100%" stopColor={isAdmin ? "var(--primary)" : "var(--primary)"} />
                </linearGradient>
              </defs>

              {/* background column (hover highlight) */}
              <rect
                x={x} y={VALUE_H} width={barW} height={CHART_H}
                rx={4} fill="var(--primary)" opacity={0} className="bar-hover-bg"
                style={{ transition: "opacity 0.15s" }}
              />

              {/* quota outline for storage chart */}
              {metric === "storage_used" && row.storage_quota > 0 && (
                <rect
                  x={x} y={VALUE_H} width={barW} height={CHART_H}
                  rx={4} fill="none"
                  stroke="var(--accent)" strokeWidth={1} strokeDasharray="3 2"
                  opacity={0.4}
                />
              )}

              {/* main bar — uses transform-origin at bottom for grow animation */}
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={4}
                fill={`url(#${fillId})`}
                opacity={0.9}
                style={{
                  transformOrigin: `${x + barW / 2}px ${VALUE_H + CHART_H}px`,
                  animation: `bar-grow 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms both`,
                }}
              />

              {/* value label above bar */}
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle" fontSize={8}
                fill="var(--foreground)" opacity={0.75}
                style={{ animation: `fade-in 0.4s ease ${i * 40 + 300}ms both` }}
              >
                {valLabel}
              </text>

              {/* username below */}
              <text
                x={x + barW / 2} y={VALUE_H + CHART_H + 17}
                textAnchor="middle" fontSize={8}
                fill="var(--muted-foreground)"
              >
                {username}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  sub,
  delay = 0,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <Card
      variant="metric"
      className="animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" } as React.CSSProperties}
    >
      <div className="flex items-start gap-4">
        {/* icon circle */}
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 4px 16px var(--primary-glow)",
          }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-2xl font-extrabold leading-none tracking-tight text-[var(--foreground)] sm:text-3xl">
            {value}
          </div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)] sm:text-sm">{label}</div>
          {sub && (
            <div className="mt-1 text-[11px] font-medium text-[var(--primary)]">{sub}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) { router.replace("/login"); return; }
    (async () => {
      try {
        const profile = await authApi.me();
        if (profile.role !== "admin") { router.replace("/dashboard"); return; }
        setMe(profile);
        const data = await adminApi.users();
        setRows(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => { setSidebarOpen(false); }, [router.pathname]);

  const totalUsers = rows.length;
  const totalImages = rows.reduce((s, r) => s + r.image_count, 0);
  const totalStorage = rows.reduce((s, r) => s + r.storage_used, 0);
  const avgStorage = totalUsers > 0 ? Math.round(totalStorage / totalUsers) : 0;

  const sidebarItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <>
      <Head><title>Admin · CloudVault</title></Head>

      <main className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        {/* Radial bg glow — matches main app --gradient-hero */}
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar drawer — fixed on mobile, sticky full-height column on desktop */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 lg:flex-shrink-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ height: "100%" }}
        >
          <Sidebar title="CloudVault" items={sidebarItems} />
        </aside>

        {/* Layout — full height flex row on desktop, single column on mobile */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* ── Content column ── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            {/* ── Header ── */}
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)]/60 bg-[var(--card)]/50 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
              {/* Mobile sidebar toggle */}
              <Button
                variant="outline"
                size="sm"
                className="w-9 px-0 lg:hidden"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
              </Button>

              <AvatarCircle username={(me?.username?.[0] ?? "A").toUpperCase()} />

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-bold sm:text-xl">Admin Dashboard</h1>
                {me?.username && (
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    Logged in as{" "}
                    <span className="font-medium text-[var(--primary)]">{me.username}</span>
                  </p>
                )}
              </div>

              {/* Live indicator */}
              <div className="hidden items-center gap-2 sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">Live</span>
              </div>

              {/* Logout */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:border-[var(--destructive)]/50 hover:text-[var(--destructive)]"
                onClick={() => authApi.logout()}
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </header>

            {/* ── Content ── */}
            <section className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-[var(--muted-foreground)]">
                  <svg className="h-5 w-5 animate-spin text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z" />
                  </svg>
                  Loading dashboard…
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="animate-fade-in rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  {/* ── Stat cards: 1→2→4 columns ── */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      delay={0}
                      icon={<Users className="h-5 w-5 text-white" />}
                      value={String(totalUsers)}
                      label="Registered accounts"
                    />
                    <StatCard
                      delay={60}
                      icon={<Images className="h-5 w-5 text-white" />}
                      value={String(totalImages)}
                      label="Files uploaded"
                      sub={totalUsers > 0 ? `≈ ${(totalImages / totalUsers).toFixed(1)} per user` : undefined}
                    />
                    <StatCard
                      delay={120}
                      icon={<HardDrive className="h-5 w-5 text-white" />}
                      value={formatBytes(totalStorage)}
                      label="Disk space consumed"
                    />
                    <StatCard
                      delay={180}
                      icon={<TrendingUp className="h-5 w-5 text-white" />}
                      value={formatBytes(avgStorage)}
                      label="Avg storage per user"
                    />
                  </div>

                  {/* ── Charts ── */}
                  {rows.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {/* Images per user */}
                      <Card
                        className="animate-fade-in-up"
                        style={{ animationDelay: "240ms", animationFillMode: "both" } as React.CSSProperties}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-sm font-semibold">Images per User</h2>
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Total uploads by account</p>
                            </div>
                            <span className="rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                              {totalImages} total
                            </span>
                          </div>
                        </CardHeader>
                        <CardBody className="pb-3 pt-4">
                          <BarChart rows={rows} metric="image_count" />
                          <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border)]/40 pt-3 text-xs text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--primary)" }} />
                              user
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--accent)" }} />
                              admin
                            </span>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Storage per user */}
                      <Card
                        className="animate-fade-in-up"
                        style={{ animationDelay: "300ms", animationFillMode: "both" } as React.CSSProperties}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-sm font-semibold">Storage per User</h2>
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Used vs quota limit (dashed)</p>
                            </div>
                            <span className="rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                              {formatBytes(totalStorage)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardBody className="pb-3 pt-4">
                          <BarChart rows={rows} metric="storage_used" />
                          <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border)]/40 pt-3 text-xs text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--primary)" }} />
                              used
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-sm border"
                                style={{ borderColor: "var(--accent)", borderStyle: "dashed" }}
                              />
                              quota
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )}

                  {/* ── User table ── */}
                  <Card
                    className="animate-fade-in-up"
                    style={{ animationDelay: "360ms", animationFillMode: "both" } as React.CSSProperties}
                  >
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold sm:text-lg">User Management</h2>
                        <span className="rounded-full bg-[var(--primary)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                          {rows.length}
                        </span>
                        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                          Last updated just now
                        </span>
                      </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <Table>
                        <THead>
                          <tr>
                            <TH>User</TH>
                            <TH>Role</TH>
                            <TH>Images</TH>
                            <TH>Storage used</TH>
                            <TH>Quota</TH>
                          </tr>
                        </THead>
                        <TBody>
                          {rows.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-[var(--primary)]/8 transition-colors duration-150 cursor-default"
                            >
                              <TD isFirst={row.username}>{row.username}</TD>
                              <TD><RoleBadge role={row.role} /></TD>
                              <TD>{row.image_count}</TD>
                              <TD>{formatBytes(row.storage_used)}</TD>
                              <TD>
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-sm">{formatBytes(row.storage_quota)}</span>
                                  {row.storage_quota > 0 && (
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--border)]">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.min((row.storage_used / row.storage_quota) * 100, 100)}%`,
                                          background: (() => {
                                            const pct = (row.storage_used / row.storage_quota) * 100;
                                            if (pct >= 85) return "oklch(0.62 0.24 25)"; // red
                                            if (pct >= 60) return "oklch(0.72 0.20 60)"; // amber
                                            return "var(--primary)";
                                          })(),
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </TD>
                            </tr>
                          ))}
                        </TBody>
                      </Table>
                    </div>
                  </Card>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
