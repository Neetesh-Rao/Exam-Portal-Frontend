"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <img
          src="/bitmax-logo.png"
          alt="BITMAX Technology (P) Ltd"
          className="h-12 w-auto mx-auto object-contain"
        />
        <p className="text-sm text-[var(--text-muted)]">Public registration is disabled. Redirecting to Admin Login...</p>
      </div>
    </div>
  );
}
