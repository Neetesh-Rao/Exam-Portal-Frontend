"use client";
import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sky-600 hover:bg-sky-700 text-white shadow-sm focus:ring-2 focus:ring-sky-500/30",
  secondary:
    "bg-[var(--surface-color)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-color-strong)] hover:bg-[var(--surface2-color)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface2-color)] hover:text-[var(--text-primary)]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/30",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs font-semibold",
  md: "h-10 px-4 text-sm font-semibold",
  lg: "h-11 px-6 text-base font-semibold",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className = "", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer outline-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
