# Design Document — CloudVault Admin Redesign

## Overview

This document covers the technical design for a premium dark UI upgrade of the CloudVault admin
dashboard. The goal is to apply a deep dark aesthetic with purple/violet accents, glassmorphism card
surfaces, an icon-driven sidebar with an active-path indicator, bold KPI metric cards, avatar initials
in tables, and role-coloured badges — all without introducing any new npm packages or routes, and
without touching the API layer.

The change surface is exactly 5 files inside `frontend-nextjs/src/`:

| File | Type of change |
|---|---|
| `styles/globals.css` | Add 7 CSS variables and 2 keyframes |
| `components/ui/Sidebar.tsx` | Full visual rewrite (same props contract) |
| `components/ui/Card.tsx` | Add `variant` prop; keep sub-components |
| `components/ui/Table.tsx` | Add `RoleBadge` export, `AvatarCircle` internal, enrich `TD` and `TBody` |
| `pages/admin/index.tsx` | Full visual redesign; all existing logic preserved |

No new files are created. No existing routes, API calls, or auth guards are modified.

---

## Architecture

### Dependency graph (unchanged)

```
pages/admin/index.tsx
  ├── components/ui/Sidebar.tsx
  ├── components/ui/Card.tsx      (Card, CardHeader, CardBody)
  ├── components/ui/Table.tsx     (Table, THead, TBody, TH, TD, RoleBadge ← new export)
  └── lib/api.ts                  (adminApi, authApi, tokenStore — untouched)
```

### Design token flow

```
globals.css (:root)
  ──► Sidebar.tsx      uses var(--gradient-sidebar), var(--purple), var(--muted-foreground)
  ──► Card.tsx         uses var(--purple), var(--purple-glow), var(--gradient-card-glow), var(--card-glass)
  ──► Table.tsx        uses var(--purple), var(--border), var(--muted-foreground)
  ──► admin/index.tsx  uses var(--background), var(--purple), var(--purple-mid), var(--muted-foreground), var(--destructive)
```

All tokens are consumed via Tailwind arbitrary values (`bg-[var(--purple)]`) or inline `style` props
where needed. No Tailwind config changes are required.

---

## Components and Interfaces

### 1. `globals.css`

**Change:** Append 7 new custom properties to the existing unconditional top-level `:root` block
(after `--shadow-elegant`) and add 2 new `@keyframes` blocks after the existing four.

**New CSS variables (appended to `:root`):**

```css
--purple:            oklch(0.55 0.25 290);
--purple-mid:        oklch(0.65 0.22 290);
--purple-glow:       oklch(0.55 0.25 290 / 0.35);
--violet-dark:       oklch(0.15 0.04 290);
--gradient-sidebar:  linear-gradient(180deg, oklch(0.13 0.05 290) 0%, oklch(0.10 0.03 270) 100%);
--gradient-card-glow:radial-gradient(ellipse at top left, oklch(0.55 0.25 290 / 0.12), transparent 60%);
--card-glass:        oklch(0.18 0.03 270 / 0.85);
```

**No existing variable is removed or overwritten.** The `.light` block is left untouched.

**New keyframes (appended after `@keyframes toast-progress`):**

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Rationale:** Keeping these additions purely additive (append-only) eliminates any risk of breaking
the existing light-mode toggle, toast animations, or global utility classes.

---

### 2. `Sidebar.tsx`

**Props contract — unchanged:**

```typescript
{
  title: string;
  items: { href: string; label: string; icon?: ReactNode }[];
}
```

The call site in `admin/index.tsx` passes `title="CloudVault"` and two items, so no call-site changes
are needed for the visual upgrade.

**New implementation overview:**

- Outer `<aside>`: `style={{ background: 'var(--gradient-sidebar)' }}` + `border-r border-[var(--border)]`
- Logo area: 40×40px circle (`bg-[var(--purple)] rounded-full`) containing a `<LayoutDashboard>` icon
  (or any placeholder icon), followed by `<p>CloudVault</p>` and `<p>Admin Panel</p>`
- `<nav>`: iterates `items`; each `<Link>` uses `useRouter().pathname` to detect the active path

**Active item detection:**

```typescript
const { pathname } = useRouter();
// per item:
const isActive = pathname === item.href;
```

**Active item styles** (applied when `isActive`):
- `border-l-4 border-[var(--purple)]` (4px solid purple left border)
- `bg-[oklch(0.55_0.25_290_/_0.15)]` (highlight background)
- `text-[var(--foreground)]`

**Inactive item styles:**
- `border-l-4 border-transparent`
- `hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]`
- `transition-colors duration-200`

**Icon rendering:**
- When `item.icon` is provided: `<span className="flex-shrink-0">{item.icon}</span>` followed by the
  label in a flex row.
- When `item.icon` is absent: only the label text is rendered. The flex container still aligns
  correctly because `gap-2` creates a stable layout with or without the icon span.

**Required import addition:**

```typescript
import { useRouter } from "next/router";
```

---

### 3. `Card.tsx`

**Updated interface:**

```typescript
type CardVariant = "default" | "glow" | "metric";

// Card
{ children: ReactNode; className?: string; variant?: CardVariant }

// CardHeader and CardBody — unchanged
{ children: ReactNode; className?: string }
```

**Variant style mapping:**

| Variant | Classes / styles applied |
|---|---|
| `"default"` (or unrecognised value) | `border border-[var(--border)] bg-[var(--card)]/80 shadow-elegant` |
| `"glow"` | `border border-[var(--purple)] bg-[var(--gradient-card-glow)] backdrop-blur-sm shadow-[0_0_30px_var(--purple-glow)]` + card-glass bg |
| `"metric"` | all glow styles + `p-6` + `hover:-translate-y-1 transition-transform duration-200 ease-in-out` |

**Implementation note:** The `variant` prop is only used on the `Card` root element. `CardHeader` and
`CardBody` remain structurally unchanged; they still accept and forward `className`.

**Fallback rule:** A `const resolvedVariant = (variant === "glow" || variant === "metric") ? variant : "default"`
guard ensures any unexpected value degrades to default styles rather than producing undefined class
strings.

**Background layering for glow/metric (CSS):**

The `bg-[var(--gradient-card-glow)]` and `bg-[var(--card-glass)]` values are composited using a
Tailwind arbitrary background-image + background-color pattern:

```tsx
style={{
  background: `var(--gradient-card-glow), var(--card-glass)`,
  boxShadow: `0 0 30px var(--purple-glow)`,
}}
```

This inline style is only applied for `glow` and `metric` variants. Default variant continues to use
pure Tailwind classes.

---

### 4. `Table.tsx`

**New exports added:**

```typescript
export function RoleBadge({ role }: { role: string }): JSX.Element
```

`RoleBadge` is defined in the same file and exported directly. No new file.

**`AvatarCircle` — internal component (not exported):**

```typescript
function AvatarCircle({ username }: { username: string }): JSX.Element
```

Derivation of initials:

```typescript
const initials = (username ?? "").slice(0, 2).toUpperCase() || "?";
```

Styles: `h-8 w-8 rounded-full bg-[var(--purple)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`

**Updated `TD` interface:**

```typescript
{ children: ReactNode; className?: string; isFirst?: boolean }
```

When `isFirst` is truthy:

```tsx
<td ...>
  <span className="flex items-center gap-2">
    <AvatarCircle username={String(isFirst)} />
    {children}
  </span>
</td>
```

The `isFirst` prop receives the `row.username` string from `admin/index.tsx`
(`isFirst={row.username}`), so `String(isFirst)` safely passes the username into `AvatarCircle`.

**Updated `TBody`:**

The `children` are mapped such that each `<tr>` child receives additional classes. Because `TBody`
renders `{children}` directly and the rows are authored in `admin/index.tsx`, the hover/transition
styles are applied at the `<tr>` level in `admin/index.tsx` rather than trying to clone children
inside `TBody`. Alternatively, `TBody` can wrap children in a fragment and pass through — the
cleanest approach is to document that every `<tr>` inside `TBody` must carry:

```
className="hover:bg-[oklch(0.55_0.25_290_/_0.06)] transition-all duration-[150ms] cursor-default"
```

These classes are added to each `<tr>` in `admin/index.tsx`. This avoids unsafe `React.Children`
manipulation inside `TBody` while still meeting the requirement.

**`RoleBadge` style logic:**

```typescript
const isAdmin = role === "admin";
const base = "text-xs px-2 py-0.5 rounded-full inline-block";
const variant = isAdmin
  ? "bg-[var(--purple)] text-white"
  : "border border-[var(--border)] text-[var(--muted-foreground)]";
```

---

### 5. `pages/admin/index.tsx`

All existing state variables, hooks, and API calls are preserved:

```typescript
const [me, setMe] = useState<UserProfile | null>(null);
const [rows, setRows] = useState<AdminUserRow[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
```

`formatBytes`, `tokenStore.get()` redirect, `me?.role !== "admin"` redirect, `adminApi.users()` call,
and derived values (`totalUsers`, `totalImages`, `totalStorage`) are all unchanged.

**New import added:**

```typescript
import { RoleBadge } from "@/components/ui/Table";
import { Search } from "lucide-react";
```

`Search` is already available in `lucide-react` (already in `package.json`).

**Layout changes:**

```
<main>
  outer wrapper: bg-[var(--background)] + radial gradient class (both on same div)
  ├── Sidebar (unchanged call site)
  └── content column
      ├── <header> (flex row, gap-4, items-center)
      │     ├── AvatarCircle (me?.username[0] or "A")  ← re-used from Table.tsx (must export or duplicate a minimal version)
      │     ├── <h1>Admin Dashboard</h1>
      │     ├── <button aria-label="Search"><Search size={20} /></button>
      │     └── <Link href="/dashboard"> styled "User view" button
      └── <section> (slide-up animation, space-y-5)
            ├── loading indicator  (while loading)
            ├── error block        (if error)
            └── content (when !loading && !error)
                  ├── 3× <Card variant="metric">  (metric grid)
                  ├── section heading row: "User Management" + count badge + "Last updated just now"
                  └── <Table>
                        <THead> … </THead>
                        <TBody>
                          {rows.map(row => (
                            <tr key={row.id} className="hover:bg-[oklch(...)] transition-all ...">
                              <TD isFirst={row.username}>{row.username}</TD>
                              <TD><RoleBadge role={row.role} /></TD>
                              <TD>{row.image_count}</TD>
                              <TD>{formatBytes(row.storage_used)}</TD>
                              <TD>{formatBytes(row.storage_quota)}</TD>
                            </tr>
                          ))}
                        </TBody>
                      </Table>
```

**AvatarCircle reuse decision:** `AvatarCircle` is a private component inside `Table.tsx`. The header
also needs an avatar. Options:

1. Export `AvatarCircle` from `Table.tsx` — simplest, but exposes an internal component.
2. Duplicate a minimal avatar `<span>` inline in `admin/index.tsx` — avoids the export.

**Decision:** Export `AvatarCircle` from `Table.tsx`. It is a pure presentational component with no
side effects, and exporting it is cleaner than duplicating the initials-slicing logic. The header
avatar renders `(me?.username?.[0] ?? "A").toUpperCase()` (single character, not two, per
requirement 5.3).

**Metric Card structure (per card):**

```tsx
<Card variant="metric">
  <div className="flex items-start gap-4">
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--purple)]">
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</div>
    </div>
  </div>
</Card>
```

Subtitle strings:
- Total Users → "Registered accounts"
- Total Images → "Files uploaded"
- Storage Used → "Disk space consumed"

**Slide-up animation:**

```tsx
<section
  style={{ animation: "slide-up 0.4s ease forwards" }}
  className="flex-1 space-y-5 px-5 py-6"
>
```

The `animation` inline style references the `slide-up` keyframe added to `globals.css`.

**"User view" button styling:**

```tsx
<Link href="/dashboard">
  <button
    style={{ background: "linear-gradient(135deg, var(--purple), var(--purple-mid))" }}
    className="rounded-lg px-4 py-2 text-sm font-medium text-white"
  >
    User view
  </button>
</Link>
```

**Outer wrapper classes:**

```tsx
<div className="bg-[var(--background)] bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,oklch(0.55_0.25_290_/_0.15),transparent_60%)]">
```

Both `bg-` classes coexist. CSS processes them left-to-right; the radial gradient (declared second)
layers on top of the solid background color, which is the intended visual effect.

---

## Data Models

No data model changes. The types consumed are defined in `src/lib/api.ts`:

```typescript
interface AdminUserRow {
  id: number;
  username: string;
  role: string;
  image_count: number;
  storage_used: number;   // bytes
  storage_quota: number;  // bytes
}

interface UserProfile {
  id: number;
  username: string;
  role: string;
  // …other fields
}
```

`formatBytes` is a pure function that remains in `admin/index.tsx` and is not shared or extracted.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a
system — essentially, a formal statement about what the system should do. Properties serve as the
bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Sidebar renders nav items correctly regardless of icon presence

*For any* array of navigation items where each item may or may not have an icon, the Sidebar must
render every item's label text, and for items that include an icon, the icon element must also be
present; items without an icon must render without any placeholder or broken layout artifact.

**Validates: Requirements 2.6, 2.7**

---

### Property 2: Card className passthrough is additive

*For any* non-empty className string passed to `Card`, `CardHeader`, or `CardBody`, the rendered
root element must contain both the internally applied classes and the passed className, with neither
set replacing the other.

**Validates: Requirements 3.6**

---

### Property 3: RoleBadge non-admin role always produces gray outline styling

*For any* role string that is not exactly `"admin"`, the rendered `RoleBadge` must have the gray
outline classes (`border border-[var(--border)] text-[var(--muted-foreground)]`) and must not have
the purple fill classes.

**Validates: Requirements 4.3**

---

### Property 4: RoleBadge layout classes are invariant across all role values

*For any* role string (including `"admin"`, empty string, or arbitrary text), the rendered
`RoleBadge` must always carry `text-xs`, `px-2`, `py-0.5`, and `rounded-full` classes.

**Validates: Requirements 4.4**

---

### Property 5: TD with isFirst always renders AvatarCircle alongside children

*For any* child content rendered inside `<TD isFirst={someString}>`, the output must contain an
`AvatarCircle` element and the original children together in a flex row container, regardless of
what the children are.

**Validates: Requirements 4.6**

---

### Property 6: AvatarCircle initials are the first min(2, length) uppercased characters

*For any* username string of length ≥ 0, the `AvatarCircle` must display exactly the first
`Math.min(2, username.length)` characters of that string converted to uppercase. For an empty
string, a safe fallback character (such as "?") must be shown instead of rendering nothing.

**Validates: Requirements 4.7**

---

### Property 7: Header AvatarCircle shows the correct initial for any me value

*For any* non-null `UserProfile` where `username` is a non-empty string, the header's `AvatarCircle`
displays the first character of `username` uppercased. When `me` is `null` or `undefined`, or when
`username` is an empty string, the avatar displays the fallback character "A".

**Validates: Requirements 5.3**

---

### Property 8: Every metric Card consistently contains icon circle, bold value, and subtitle

*For any* combination of (icon element, numeric/formatted value string, subtitle string), a metric
`Card` rendered with `variant="metric"` must always contain: a `h-12 w-12` purple circular icon
container, the value displayed at `text-3xl font-bold`, and the subtitle string in muted foreground
text — regardless of what the specific values are.

**Validates: Requirements 5.7**

---

### Property 9: First TD in every user row receives a truthy isFirst prop

*For any* non-empty array of `AdminUserRow` objects, the first `<TD>` in every rendered `<tr>` must
have `isFirst` set to a truthy value equal to that row's `username`, ensuring `AvatarCircle` renders
for every user row regardless of row content.

**Validates: Requirements 5.15**

---

## Error Handling

Error handling logic in `admin/index.tsx` is **preserved exactly**:

- `tokenStore.get()` absence → `router.replace("/login")` (synchronous, before any fetch)
- `me?.role !== "admin"` after profile fetch → `router.replace("/dashboard")`
- Any thrown error in the async IIFE → caught, `setError(e?.message || fallback message)`
- Error display: `<div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">`

The loading state block shows a simple muted-text spinner/label while `loading` is `true`.

No new error states are introduced by the visual redesign.

---

## Testing Strategy

This feature is a pure visual redesign with no new business logic. Property-based testing (PBT) is
applicable to a subset of the acceptance criteria where universal rules span a meaningful input space
(initials derivation, className passthrough, role badge logic). For the remaining criteria (CSS
variable presence, loading states, redirects), example-based tests and smoke/snapshot tests are
appropriate.

### Unit tests (example-based)

Cover the following concrete behaviours:

- `RoleBadge` renders purple fill for `role="admin"` and gray outline for `role="user"`
- `Card` applies correct class sets for each of the three variants
- `Card` with an unrecognised variant string falls back to default styles
- `TD` without `isFirst` renders children directly without an avatar wrapper
- `TD` with `isFirst` renders `AvatarCircle` + children side by side
- Sidebar renders "CloudVault" title and "Admin Panel" subtitle
- Sidebar applies active styles when `href === pathname` and normal styles otherwise
- Admin page header contains `aria-label="Search"` button
- Admin page header contains "User view" link pointing to `/dashboard`
- Admin page shows loading indicator while `loading=true`
- Admin page shows error block when an API call rejects
- Admin page redirects to `/login` when `tokenStore.get()` returns null
- Admin page redirects to `/dashboard` when `me?.role !== "admin"`

### Property-based tests

Use a PBT library suitable for the TypeScript/React stack. The recommended choice is
[`fast-check`](https://github.com/dubzzz/fast-check), which is a zero-dependency TypeScript-native
arbitrary generator library. It is already a common dependency in the Next.js ecosystem and requires
no framework integration beyond `npm install --save-dev fast-check`.

> **Note:** `fast-check` is not currently in `package.json`. If adding it is outside scope, the
> properties below can be covered by exhaustive example-based tests with a representative sample
> of inputs (empty string, single char, two chars, long string, non-ASCII, whitespace-only). The
> properties remain valid specifications regardless.

Each property test must run at minimum **100 iterations**.
Tag format: `Feature: cloudvault-admin-redesign, Property {N}: {property_text}`

**P1 — Sidebar icon/no-icon rendering:**
Generate `fc.array(fc.record({ href: fc.string(), label: fc.string(), icon: fc.option(fc.constant(<span/>)) }))`.
For each item with an icon, assert icon is in output. For items without, assert label renders and
no empty placeholder span is present.

**P2 — Card className passthrough:**
Generate `fc.string({ minLength: 1 })` as `className`. For each of `Card`, `CardHeader`, `CardBody`,
assert the generated class is present on the root element alongside at least one internally-defined
class.

**P3 — RoleBadge non-admin gray outline:**
Generate `fc.string().filter(s => s !== "admin")`. Assert rendered `RoleBadge` has
`border-[var(--border)]` and `text-[var(--muted-foreground)]` classes, and does NOT have
`bg-[var(--purple)]`.

**P4 — RoleBadge layout invariant:**
Generate `fc.string()` (any role value). Assert rendered `RoleBadge` always has `text-xs`, `px-2`,
`py-0.5`, `rounded-full`.

**P5 — TD isFirst always shows AvatarCircle + children:**
Generate `fc.string({ minLength: 1 })` as `isFirst` and `fc.string()` as children text.
Assert the rendered TD contains an element with the avatar initials and the children text.

**P6 — AvatarCircle initials correctness:**
Generate `fc.string()` as `username`. Assert displayed text equals
`username.slice(0, 2).toUpperCase()` or the fallback "?" for empty input.

**P7 — Header avatar initial:**
Generate `fc.string({ minLength: 1 })` as `me.username`. Assert header avatar shows
`me.username[0].toUpperCase()`. Generate `fc.constant(null)` as `me`; assert avatar shows "A".

**P8 — Metric Card structure:**
Generate `fc.string()` as `value` and `fc.string()` as `subtitle` with arbitrary icon element.
Assert rendered Card (variant="metric") contains: a `.h-12.w-12` purple circle, the value at
`text-3xl font-bold`, and the subtitle text.

**P9 — isFirst on first TD for every row:**
Generate `fc.array(fc.record({ id: fc.integer(), username: fc.string({ minLength: 1 }), role: fc.string(), image_count: fc.integer(), storage_used: fc.integer(), storage_quota: fc.integer() }), { minLength: 1 })`.
Render the table body with those rows. For every `<tr>`, assert the first `<td>` has a rendered
`AvatarCircle` whose initials derive from that row's username.

### Snapshot / smoke tests

- `globals.css` contains all 7 new variable names after the edit (string search)
- `globals.css` retains all pre-existing variable names (set subtraction)
- `globals.css` contains `@keyframes pulse-glow` and `@keyframes slide-up` blocks
- `RoleBadge` is a named export from `Table.tsx` (static analysis / TypeScript build)
- Admin page builds without TypeScript errors (CI `tsc --noEmit`)
