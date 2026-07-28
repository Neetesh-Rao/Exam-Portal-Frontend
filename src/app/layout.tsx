import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ReduxProvider } from "@/redux/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitmax — Assessment & Examination Platform",
  description: "Professional hiring and test/exam platform for modern teams",
  icons: {
    icon: [
      { url: "/bitmax-logo.png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/bitmax-logo.png",
    apple: "/bitmax-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/bitmax-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/bitmax-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/bitmax-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-app-bg text-[var(--text-primary)] dark:bg-dark-bg dark:text-dark-text antialiased">
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
