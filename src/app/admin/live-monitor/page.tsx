"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveMonitorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/submissions");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center text-sm text-[var(--text-muted)]">
      Redirecting to Submissions...
    </div>
  );
}
