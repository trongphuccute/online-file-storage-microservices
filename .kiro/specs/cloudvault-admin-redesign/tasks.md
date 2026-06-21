# Implementation Plan: CloudVault Admin Redesign

## Overview

Apply a premium dark UI redesign across exactly 5 files in `frontend-nextjs/src/`. Changes are purely additive in `globals.css`, a full visual rewrite of `Sidebar.tsx`, a `variant` prop addition to `Card.tsx`, new exports and enriched sub-components in `Table.tsx`, and a full visual redesign of `pages/admin/index.tsx` — with all existing business logic preserved throughout.

## Tasks

- [x] 1. Add CSS variables and keyframes to `globals.css`
  - Open `frontend-nextjs/src/styles/globals.css`
  - Locate the unconditional top-level `:root` block (not nested inside `@media`, `@layer`, or any selector)
  - Append the 7 new custom properties after the last existing variable in that block:
    `--purple`, `--purple-mid`, `--purple-glow`, `--violet-dark`, `--gradient-sidebar`, `--gradient-card-glow`, `--card-glass`
  - Do **not** remove or overwrite any existing variable; the `.light` block is left untouched
  - After the existing `@keyframes toast-progress` block, append `@keyframes pulse-glow` (opacity `1 → 0.6 → 1`) and `@keyframes slide-up` (`opacity:0, translateY(12px)` → `opacity:1, translateY(0)`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Rewrite `Sidebar.tsx` with premium dark styles
  - Open `frontend-nextjs/src/components/ui/Sidebar.tsx`
  - Keep the existing props contract exactly: `{ title: string; items: { href: string; label: string; icon?: ReactNode }[] }`
  - Add `import { useRouter } from "next/router"` at the top
  - Render outer `<aside>` with `style={{ background: 'var(--gradient-sidebar)' }}` and `border-r border-[var(--border)]`
  - Add a logo area above `<nav>`: a 40×40px purple circle (`bg-[var(--purple)] rounded-full`) containing a `<LayoutDashboard>` icon, followed by `<p>CloudVault</p>` and `<p className="text-xs text-[var(--muted-foreground)]">Admin Panel</p>`
  - Use `useRouter().pathname` to compute `isActive = pathname === item.href` per nav item
  - Active item classes: `border-l-4 border-[var(--purple)] bg-[oklch(0.55_0.25_290_/_0.15)] text-[var(--foreground)]`
  - Inactive item classes: `border-l-4 border-transparent hover:bg-[var(--background)]/60 hover:text-[var(--foreground)] transition-colors duration-200`
  - Render icon in a `<span className="flex-shrink-0">` when present; render label-only when icon is absent — no placeholder element
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.1 Write property test for Sidebar icon/no-icon rendering (Property 1)
    - Use `fast-check`: generate `fc.array(fc.record({ href: fc.string(), label: fc.string(), icon: fc.option(fc.constant(<span/>)) }))`
    - For items with icon: assert icon element is in rendered output
    - For items without icon: assert label renders and no empty placeholder `<span>` is present
    - Run at minimum 100 iterations
    - **Property 1: Sidebar renders nav items correctly regardless of icon presence**
    - **Validates: Requirements 2.6, 2.7**

- [x] 3. Add `variant` prop to `Card.tsx`
  - Open `frontend-nextjs/src/components/ui/Card.tsx`
  - Define `type CardVariant = "default" | "glow" | "metric"` and add `variant?: CardVariant` to the `Card` props interface
  - Add a guard: `const resolvedVariant = (variant === "glow" || variant === "metric") ? variant : "default"` to handle invalid/undefined values
  - `"default"`: existing Tailwind classes (`border border-[var(--border)] bg-[var(--card)]/80 shadow-elegant`)
  - `"glow"`: `border border-[var(--purple)] backdrop-blur-sm` + inline `style={{ background: 'var(--gradient-card-glow), var(--card-glass)', boxShadow: '0 0 30px var(--purple-glow)' }}`
  - `"metric"`: all glow styles + `p-6 hover:-translate-y-1 transition-transform duration-200 ease-in-out`
  - Ensure `Card`, `CardHeader`, and `CardBody` all merge any passed `className` with internal classes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 3.1 Write property test for Card className passthrough (Property 2)
    - Use `fast-check`: generate `fc.string({ minLength: 1 })` as `className`
    - For each of `Card`, `CardHeader`, `CardBody`: assert generated class is present on root element alongside at least one internally-defined class
    - **Property 2: Card className passthrough is additive**
    - **Validates: Requirements 3.6**

- [x] 4. Add `RoleBadge`, `AvatarCircle`, and enrich `TD` / `TBody` in `Table.tsx`
  - Open `frontend-nextjs/src/components/ui/Table.tsx`
  - Add internal `AvatarCircle` component: `function AvatarCircle({ username }: { username: string })` — initials via `(username ?? "").slice(0, 2).toUpperCase() || "?"`, styles: `h-8 w-8 rounded-full bg-[var(--purple)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`
  - Export `AvatarCircle` (needed by `admin/index.tsx` header)
  - Add exported `RoleBadge` component: `export function RoleBadge({ role }: { role: string })` — base classes `text-xs px-2 py-0.5 rounded-full inline-block`; `role === "admin"` → `bg-[var(--purple)] text-white`; anything else → `border border-[var(--border)] text-[var(--muted-foreground)]`
  - Add `isFirst?: boolean` to `TD` props; when truthy, wrap children in `<span className="flex items-center gap-2"><AvatarCircle username={String(isFirst)} />{children}</span>`
  - Document (via comment) that each `<tr>` inside `TBody` must carry `hover:bg-[oklch(0.55_0.25_290_/_0.06)] transition-all duration-[150ms] cursor-default` — these classes are applied in `admin/index.tsx`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 4.1 Write property test for RoleBadge non-admin gray outline (Property 3)
    - Use `fast-check`: generate `fc.string().filter(s => s !== "admin")`
    - Assert rendered `RoleBadge` has `border-[var(--border)]` and `text-[var(--muted-foreground)]` classes; assert it does NOT have `bg-[var(--purple)]`
    - **Property 3: RoleBadge non-admin role always produces gray outline styling**
    - **Validates: Requirements 4.3**

  - [ ]* 4.2 Write property test for RoleBadge layout invariant (Property 4)
    - Use `fast-check`: generate `fc.string()` as any role value
    - Assert rendered `RoleBadge` always carries `text-xs`, `px-2`, `py-0.5`, `rounded-full`
    - **Property 4: RoleBadge layout classes are invariant across all role values**
    - **Validates: Requirements 4.4**

  - [ ]* 4.3 Write property test for TD isFirst renders AvatarCircle (Property 5)
    - Use `fast-check`: generate `fc.string({ minLength: 1 })` as `isFirst` and `fc.string()` as children text
    - Assert rendered `TD` contains an `AvatarCircle` element and the children text in a flex row
    - **Property 5: TD with isFirst always renders AvatarCircle alongside children**
    - **Validates: Requirements 4.6**

  - [ ]* 4.4 Write property test for AvatarCircle initials correctness (Property 6)
    - Use `fast-check`: generate `fc.string()` as `username`
    - Assert displayed initials equal `username.slice(0, 2).toUpperCase()` or fallback "?" for empty string
    - **Property 6: AvatarCircle initials are the first min(2, length) uppercased characters**
    - **Validates: Requirements 4.7**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Redesign `pages/admin/index.tsx` with full premium layout
  - Open `frontend-nextjs/src/pages/admin/index.tsx`
  - Preserve all existing state, hooks, and logic exactly: `me`, `rows`, `loading`, `error` state; `formatBytes`; `tokenStore.get()` redirect; `me?.role !== "admin"` redirect; `adminApi.users()` call; `totalUsers`, `totalImages`, `totalStorage` derived values
  - Add imports: `import { RoleBadge, AvatarCircle } from "@/components/ui/Table"` and `import { Search } from "lucide-react"` — no packages outside existing `package.json`
  - Outer wrapper: `<div className="bg-[var(--background)] bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,oklch(0.55_0.25_290_/_0.15),transparent_60%)]">` (both `bg-` classes on the same element)
  - Header: flex row (`flex items-center gap-4`) containing:
    - `<AvatarCircle username={(me?.username?.[0] ?? "A").toUpperCase()} />` (single char)
    - `<h1>Admin Dashboard</h1>`
    - `<button aria-label="Search"><Search size={20} /></button>` (no navigation on click)
    - `<Link href="/dashboard"><button style={{ background: "linear-gradient(135deg, var(--purple), var(--purple-mid))" }} className="rounded-lg px-4 py-2 text-sm font-medium text-white">User view</button></Link>`
  - Content `<section>` with `style={{ animation: "slide-up 0.4s ease forwards" }}` for requirement 5.10
  - Loading block inside section while `loading === true` (_Requirements: 5.13_)
  - Error block when `error` is non-empty: `<div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">` (_Requirements: 5.14_)
  - When `!loading && !error`: render 3× `<Card variant="metric">` in a grid (Total Users / Total Images / Storage Used), each containing a `h-12 w-12` purple icon circle, `text-3xl font-bold` value, and muted subtitle string per design
  - Render section heading "User Management" + `rows.length` count badge + "Last updated just now" in `text-[var(--muted-foreground)]`
  - In `<TBody>`, map `rows` with `<tr key={row.id} className="hover:bg-[oklch(0.55_0.25_290_/_0.06)] transition-all duration-[150ms] cursor-default">`; first `<TD isFirst={row.username}>` per row
  - Render `<RoleBadge role={row.role} />` inside the role `<TD>`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 5.16_

  - [ ]* 6.1 Write property test for header AvatarCircle initial (Property 7)
    - Use `fast-check`: generate `fc.string({ minLength: 1 })` as `me.username`; assert header avatar shows `me.username[0].toUpperCase()`
    - Also generate `fc.constant(null)` as `me`; assert avatar shows "A"
    - **Property 7: Header AvatarCircle shows the correct initial for any me value**
    - **Validates: Requirements 5.3**

  - [ ]* 6.2 Write property test for metric Card structure (Property 8)
    - Use `fast-check`: generate `fc.string()` as `value` and `fc.string()` as `subtitle` with arbitrary icon element
    - Assert `Card` with `variant="metric"` contains: a `.h-12.w-12` purple circle, value at `text-3xl font-bold`, and subtitle text
    - **Property 8: Every metric Card consistently contains icon circle, bold value, and subtitle**
    - **Validates: Requirements 5.7**

  - [ ]* 6.3 Write property test for isFirst on first TD for every row (Property 9)
    - Use `fast-check`: generate `fc.array(fc.record({ id: fc.integer(), username: fc.string({ minLength: 1 }), role: fc.string(), image_count: fc.integer(), storage_used: fc.integer(), storage_quota: fc.integer() }), { minLength: 1 })`
    - Render the table body with those rows; for every `<tr>`, assert the first `<td>` has a rendered `AvatarCircle` whose initials derive from that row's `username`
    - **Property 9: First TD in every user row receives a truthy isFirst prop**
    - **Validates: Requirements 5.15**

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for an MVP
- Tasks 1–4 must be completed before task 6 because `admin/index.tsx` imports from all other modified files
- Property tests require `fast-check`; if it is not in `package.json`, cover each property with exhaustive example-based tests (empty string, single char, two chars, long string, non-ASCII, whitespace-only) — the properties remain valid specifications
- No new npm packages beyond `fast-check` (dev dependency) are required; all runtime imports come from packages already in `frontend-nextjs/package.json`
- No new files are created; no routes, API calls, or auth guards are modified

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3", "4"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 3, "tasks": ["6"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3"] }
  ]
}
```
