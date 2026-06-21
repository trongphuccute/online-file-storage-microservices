import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-elegant">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-[var(--background)]/50 text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  // Each <tr> inside TBody should carry:
  // className="hover:bg-[oklch(0.55_0.25_290_/_0.06)] transition-all duration-[150ms] cursor-default"
  return <tbody>{children}</tbody>;
}

export function TH({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

export function AvatarCircle({ username }: { username: string }) {
  const initials = (username ?? "").slice(0, 2).toUpperCase() || "?";
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--purple)] text-xs font-semibold text-white">
      {initials}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const base = "text-xs px-2 py-0.5 rounded-full inline-block";
  const variant =
    role === "admin"
      ? "bg-[var(--purple)] text-white"
      : "border border-[var(--border)] text-[var(--muted-foreground)]";
  return <span className={`${base} ${variant}`}>{role}</span>;
}

export function TD({
  children,
  className = "",
  isFirst,
}: {
  children: ReactNode;
  className?: string;
  isFirst?: boolean | string;
}) {
  return (
    <td className={`border-t border-[var(--border)] px-4 py-3 text-sm ${className}`}>
      {isFirst ? (
        <span className="flex items-center gap-2">
          <AvatarCircle username={String(isFirst)} />
          {children}
        </span>
      ) : (
        children
      )}
    </td>
  );
}
