"use client";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";

const variantStyles: Record<BadgeVariant, { light: string; dark: string }> = {
  neutral: {
    light: "background:#F5F5F5; color:#525252;",
    dark:  "background:#262626; color:#A3A3A3;",
  },
  success: {
    light: "background:#f0fdf4; color:#16a34a;",
    dark:  "background:#052e16; color:#4ade80;",
  },
  warning: {
    light: "background:#fffbeb; color:#d97706;",
    dark:  "background:#1c1500; color:#fbbf24;",
  },
  danger: {
    light: "background:#fef2f2; color:#dc2626;",
    dark:  "background:#1c0505; color:#f87171;",
  },
  accent: {
    light: "background:#eff6ff; color:#2563eb;",
    dark:  "background:#0a1628; color:#60a5fa;",
  },
};

// CSS-variable-based approach so badges automatically adapt to theme
const variantCSSVars: Record<BadgeVariant, { bg: string; text: string }> = {
  neutral: { bg: "var(--badge-neutral-bg, #F5F5F5)", text: "var(--badge-neutral-text, #525252)" },
  success: { bg: "var(--badge-success-bg, #f0fdf4)", text: "var(--badge-success-text, #16a34a)" },
  warning: { bg: "var(--badge-warning-bg, #fffbeb)", text: "var(--badge-warning-text, #d97706)" },
  danger:  { bg: "var(--badge-danger-bg,  #fef2f2)", text: "var(--badge-danger-text,  #dc2626)" },
  accent:  { bg: "var(--badge-accent-bg,  #eff6ff)", text: "var(--badge-accent-text,  #2563eb)" },
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const { bg, text } = variantCSSVars[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}
