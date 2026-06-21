import { ReactNode, CSSProperties } from "react";

type CardVariant = "default" | "glow" | "metric";

export function Card({
  children,
  className = "",
  variant,
  style,
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  style?: CSSProperties;
}) {
  const resolvedVariant = (variant === "glow" || variant === "metric") ? variant : "default";

  if (resolvedVariant === "default") {
    return (
      <div
        className={`
          group rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 shadow-elegant
          transition-all duration-200 ease-in-out
          hover:border-[var(--primary)]/40 hover:shadow-[0_0_24px_var(--primary-glow)]
          ${className}
        `}
        style={style}
      >
        {children}
      </div>
    );
  }

  const glowStyle: CSSProperties = {
    background: "var(--gradient-card-glow), var(--card-glass)",
    boxShadow: "0 0 30px oklch(0.76 0.14 190 / 0.28)",
    ...style,
  };

  if (resolvedVariant === "metric") {
    return (
      <div
        className={`
          group relative rounded-2xl border border-[var(--primary)]/50 backdrop-blur-sm p-5
          transition-all duration-200 ease-in-out
          hover:-translate-y-1 hover:scale-[1.02]
          hover:border-[var(--primary)] hover:shadow-[0_0_40px_oklch(0.76_0.14_190_/_0.35)]
          ${className}
        `}
        style={glowStyle}
      >
        {/* subtle inner top gradient highlight using primary color */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-60"
          style={{ background: "linear-gradient(90deg, transparent, var(--primary-glow), transparent)" }}
        />
        {children}
      </div>
    );
  }

  // glow variant
  return (
    <div
      className={`
        rounded-2xl border border-[var(--primary)]/50 backdrop-blur-sm
        transition-all duration-200 ease-in-out
        hover:border-[var(--primary)] hover:shadow-[0_0_36px_oklch(0.76_0.14_190_/_0.28)]
        ${className}
      `}
      style={glowStyle}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-b border-[var(--border)] px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
