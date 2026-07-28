"use client";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full h-10 px-3 pr-8 text-sm rounded-lg transition-colors duration-150 outline-none appearance-none cursor-pointer ${
              error ? "border-2 border-red-500" : "border"
            } ${className}`}
            style={{
              backgroundColor: "var(--surface-color)",
              color: "var(--text-primary)",
              borderColor: error ? undefined : "var(--border-color)",
            }}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                style={{
                  backgroundColor: "var(--surface-color)",
                  color: "var(--text-primary)",
                }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
