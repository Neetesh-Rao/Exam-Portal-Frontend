"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useLoginMutation } from "@/redux/api/authApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data: any = await login({ email, password }).unwrap();
      const token = data?.token || data?.accessToken;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }
      if (data?.user?.role === "candidate") {
        router.push("/candidate/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img
            src="/bitmax-logo.png"
            alt="BITMAX Technology (P) Ltd"
            className="h-14 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Admin Assessment Portal</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">BITMAX Technology (P) Ltd — STEP AHEAD</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/20 rounded-lg text-sm text-[var(--color-danger)] font-medium"
              >
                {error}
              </motion.div>
            )}

            <Input
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bitmaxtech.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Remember me</span>
              </label>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
              Sign In to Bitmax Portal
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          © 2026 BITMAX Technology (P) Ltd. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
