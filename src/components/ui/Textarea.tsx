"use client";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2.5 text-sm rounded-lg transition-colors duration-150 outline-none resize-none ${
            error ? "border-2 border-red-500" : "border focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          } ${className}`}
          style={{
            backgroundColor: "var(--surface2-color)",
            color: "var(--text-primary)",
            borderColor: error ? undefined : "var(--border-color)",
          }}
          rows={4}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
