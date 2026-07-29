"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-admin-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-admin-sidebar", handleToggle);
  }, []);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-app-bg-subtle dark:bg-dark-bg">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-0 lg:ml-64 w-full min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
