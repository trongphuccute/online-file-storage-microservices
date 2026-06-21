# Requirements Document

## Introduction

This feature delivers a full premium dark UI redesign of the CloudVault admin dashboard. The redesign targets a deep dark aesthetic with purple/violet accents, glassmorphism card surfaces, an icon sidebar with an active pill indicator, large bold metric displays, avatar initials in tables with role badges, and a radial gradient background — all implemented using the existing Next.js (Pages Router) + TypeScript + TailwindCSS + Lucide icons stack. No new npm packages are introduced. All existing business logic (API calls, auth guards, data formatting) is fully preserved.

## Glossary

- **Admin_Dashboard**: The page rendered at `/admin/index.tsx` that displays platform-wide statistics and a user management table; accessible only to users with `role === "admin"`.
- **Sidebar**: The `src/components/ui/Sidebar.tsx` component rendered as a collapsible left-hand navigation panel.
- **Card**: The `src/components/ui/Card.tsx` component wrapping content in a rounded surface.
- **Table**: The `src/components/ui/Table.tsx` component and its sub-components (`THead`, `TBody`, `TH`, `TD`) used to display tabular data.
- **RoleBadge**: A new inline component (defined inside `Table.tsx`) that renders a styled pill label based on user role.
- **AvatarCircle**: A circular element showing two-letter initials derived from a username, with a purple background.
- **MetricCard**: A `Card` rendered with `variant="metric"` showing a single KPI (key performance indicator) value.
- **CSS_Vars**: Custom properties defined inside `:root` in `globals.css` and consumed by components via `var(--name)` syntax.
- **TokenStore**: The `tokenStore` object in `src/lib/api.ts` used for JWT persistence and auth guards.
- **formatBytes**: The utility function in `admin/index.tsx` that converts raw byte counts to human-readable strings (B / KB / MB / GB).

---

## Requirements

### Requirement 1: Global CSS Variables and Animations

**User Story:** As a frontend developer, I want the purple/violet design tokens and animation keyframes declared as CSS variables, so that all components can reference them consistently without hard-coded colour values.

#### Acceptance Criteria

1. THE CSS_Vars SHALL include `--purple: oklch(0.55 0.25 290)`, `--purple-mid: oklch(0.65 0.22 290)`, `--purple-glow: oklch(0.55 0.25 290 / 0.35)`, `--violet-dark: oklch(0.15 0.04 290)`, `--gradient-sidebar: linear-gradient(180deg, oklch(0.13 0.05 290) 0%, oklch(0.10 0.03 270) 100%)`, `--gradient-card-glow: radial-gradient(ellipse at top left, oklch(0.55 0.25 290 / 0.12), transparent 60%)`, and `--card-glass: oklch(0.18 0.03 270 / 0.85)` inside the unconditional top-level `:root` block of `globals.css` — specifically the `:root` selector that is NOT nested inside any `@media`, `@layer`, or other selector-scoped block.
2. THE CSS_Vars SHALL preserve all existing variables already present in the `:root` block; none shall be removed or overwritten.
3. THE `globals.css` file SHALL declare a `@keyframes pulse-glow` animation where opacity animates `1 → 0.6 → 1` between `0%/100%` and `50%` keyframes.
4. THE `globals.css` file SHALL declare a `@keyframes slide-up` animation where the element transitions `from { opacity: 0; transform: translateY(12px) }` `to { opacity: 1; transform: translateY(0) }`.

---

### Requirement 2: Premium Dark Sidebar

**User Story:** As an admin user, I want a visually distinct sidebar with a dark gradient background, a branded logo area, and a highlighted active navigation item, so that the admin panel feels premium and I can orient myself quickly.

#### Acceptance Criteria

1. THE Sidebar SHALL render its outer `<aside>` element with the background gradient defined by `var(--gradient-sidebar)`.
2. THE Sidebar SHALL display a logo area containing a circular icon element and a title text that SHALL be exactly "CloudVault" above the navigation list.
3. THE Sidebar SHALL render subtitle text "Admin Panel" below the title in `font-size: 0.75rem; color: var(--muted-foreground)`.
4. WHEN a navigation item's `href` matches the current page path, THE Sidebar SHALL apply a `4px solid var(--purple)` left border and a highlight background of `oklch(0.55 0.25 290 / 0.15)` to that item's element.
5. WHEN a navigation item is hovered, THE Sidebar SHALL apply a CSS transition of at least `200ms` (e.g. `transition-colors duration-200`) to the item's background and text color.
6. THE Sidebar SHALL display each navigation item with its provided icon alongside its label text.
7. WHEN a navigation item's icon is not provided, THE Sidebar SHALL render the item label text only, with no broken layout or missing icon placeholder.

---

### Requirement 3: Card Variants (Default, Glow, Metric)

**User Story:** As a developer, I want the `Card` component to support three visual variants, so that different content contexts — plain content, highlighted content, and KPI metrics — can each receive the appropriate visual treatment.

#### Acceptance Criteria

1. THE Card SHALL accept an optional `variant` prop typed as `"default" | "glow" | "metric"` with a default value of `"default"`.
2. WHEN `variant` is `"default"`, THE Card SHALL render with its current styles (border `var(--border)`, background `var(--card)/80`, shadow).
3. WHEN `variant` is `"glow"`, THE Card SHALL render with a purple border colour (`var(--purple)`), a combined background of `var(--gradient-card-glow)` and `var(--card-glass)`, and `box-shadow: 0 0 30px var(--purple-glow)`.
4. WHEN `variant` is `"metric"`, THE Card SHALL apply all styles from the `"glow"` variant, `padding: 1.5rem`, and a `hover:-translate-y-1` transform with `transition: transform 200ms ease`.
5. WHEN an invalid or undefined `variant` value is passed, THE Card SHALL fall back to `"default"` styles.
6. THE Card, CardHeader, and CardBody sub-components SHALL apply any `className` prop value to their respective root elements alongside internally applied class names.

---

### Requirement 4: Enhanced Table with Avatars and Role Badges

**User Story:** As an admin user, I want user rows in the table to show avatar initials and colour-coded role badges, so that I can scan roles and identify users at a glance without reading full text labels.

#### Acceptance Criteria

1. THE Table SHALL export a `RoleBadge` component that accepts a `role: string` prop.
2. IF `role` is `"admin"`, THE RoleBadge SHALL render a filled purple pill (`bg-[var(--purple)] text-white`).
3. IF `role` is any value other than `"admin"`, THE RoleBadge SHALL render a gray outline pill (`border border-[var(--border)] text-[var(--muted-foreground)]`).
4. THE RoleBadge SHALL use small text (`text-xs`) and horizontal padding (`px-2 py-0.5`) with fully rounded corners (`rounded-full`).
5. THE `TD` component SHALL accept an optional `isFirst?: boolean` prop.
6. IF `isFirst` is `true`, THEN THE `TD` SHALL render an `AvatarCircle` element and the cell's child content side by side in a flex row.
7. THE `AvatarCircle` SHALL display the first two characters (uppercased) of the `username` prop inside a circle with a purple background (`bg-[var(--purple)]`) and white text; IF `username` has fewer than 2 characters, all available characters uppercased SHALL be displayed.
8. WHEN a table body row is hovered, THE `TBody` row element SHALL apply background `hover:bg-[oklch(0.55_0.25_290_/_0.06)]` with `transition-duration: 150ms` and a translucent purple background highlight, alongside `cursor-default`.

---

### Requirement 5: Admin Dashboard Full Redesign

**User Story:** As an admin user, I want the admin dashboard page to reflect the new premium dark aesthetic with a radial gradient page background, a redesigned header with my avatar and quick actions, metric cards with icons and subtitles, and the updated user table, so that the page is visually consistent with the new design system.

#### Acceptance Criteria

1. THE Admin_Dashboard outer wrapper SHALL apply `bg-[var(--background)]` combined with `bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,oklch(0.55_0.25_290_/_0.15),transparent_60%)]`; both classes SHALL coexist on the same element.
2. THE Admin_Dashboard header SHALL be a flex row (`display: flex; align-items: center; gap: 1rem`) containing an `AvatarCircle` and the heading "Admin Dashboard".
3. THE `AvatarCircle` in the header SHALL display the first character of `me?.username` uppercased; IF `me` is null/undefined, it SHALL display "A".
4. THE Admin_Dashboard header SHALL contain a `<button>` element with an accessible `aria-label="Search"` that renders the Lucide `Search` icon (size 20px); clicking it SHALL not navigate or cause a page error.
5. THE Admin_Dashboard header SHALL contain a link/button labeled "User view" styled with a CSS gradient from `var(--purple)` to `var(--purple-mid)`; clicking it SHALL navigate to `/dashboard`.
6. WHEN `loading` state is `false` and `error` is null, THE Admin_Dashboard SHALL render exactly three `Card` components with `variant="metric"`: one for Total Users, one for Total Images, one for Storage Used.
7. Each metric `Card` SHALL contain: (a) an icon wrapped in a `h-12 w-12` circular container with purple background, (b) the metric value displayed at `font-size: 1.875rem; font-weight: 700`, and (c) a subtitle string — "Registered accounts" for users, "Files uploaded" for images, "Disk space consumed" for storage.
8. THE Admin_Dashboard SHALL render a section heading "User Management" and a count badge displaying `rows.length` adjacent to it.
9. THE Admin_Dashboard SHALL render the text "Last updated just now" in `color: var(--muted-foreground)` near the table header.
10. WHEN the `rows` data first renders, THE Admin_Dashboard content section SHALL play the `slide-up` animation once (no repeat).
11. THE Admin_Dashboard SHALL call `tokenStore.get()` inside `useEffect`; IF the token is absent, THEN `router.replace("/login")` SHALL be called immediately.
12. THE Admin_Dashboard SHALL check `me?.role === "admin"` after fetching user data; IF the role is not "admin", THEN `router.replace("/dashboard")` SHALL be called.
13. THE Admin_Dashboard SHALL display a loading indicator WHILE `loading` is `true`.
14. IF an API call rejects or returns an error, THEN THE Admin_Dashboard SHALL display a styled error block using `border-[var(--destructive)]/30` and `bg-[var(--destructive)]/10` containing the error message text.
15. THE Admin_Dashboard SHALL pass `isFirst={row.username}` (or equivalent truthy string value) to the first `TD` in each user row so that `AvatarCircle` renders.
16. THE Admin_Dashboard SHALL not import any identifier from a package not already listed in `frontend-nextjs/package.json`.
