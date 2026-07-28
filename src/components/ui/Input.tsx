"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-10 px-3 text-base rounded-lg transition-colors duration-150 outline-none ${
            error
              ? "border-2 border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)]"
          } ${className}`}
          style={{
            backgroundColor: "var(--surface2-color)",
            color: "var(--text-primary)",
            borderColor: error ? undefined : "var(--border-color)",
          }}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--text-muted)]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
