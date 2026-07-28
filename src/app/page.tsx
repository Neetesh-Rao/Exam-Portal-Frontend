"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-primary)",
      }}
    >
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/bitmax-logo.png"
              alt="BITMAX Technology (P) Ltd"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button size="sm">Admin Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="accent" className="mb-6">
            BITMAX Technology (P) Ltd — STEP AHEAD
          </Badge>

          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Technical Assessment & <br />
            <span style={{ color: "#0284c7" }}>Evaluation Portal</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Dedicated assessment platform for BITMAX Technology (P) Ltd. Conduct technical evaluations, live webcam proctoring, and automated code testing seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto shadow-md">
                Admin Login →
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 lg:px-8 border-t border-b"
        style={{
          backgroundColor: "var(--surface2-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              BITMAX Technical Evaluation Infrastructure
            </h2>
            <p
              className="max-w-xl mx-auto text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              From advanced proctoring to detailed analytics, we provide the tools to evaluate candidates fairly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📝",
                title: "Rich Question Types",
                description: "MCQ, coding, fill-in-blanks, and text responses — create diverse assessments for technical roles.",
              },
              {
                icon: "🔒",
                title: "Advanced Proctoring",
                description: "Tab-switch detection, fullscreen enforcement, and copy-paste blocking to ensure assessment integrity.",
              },
              {
                icon: "⚡",
                title: "Real-time Monitoring",
                description: "Watch candidate progress live and receive instant alerts for rule violations or suspicious activity.",
              },
              {
                icon: "📊",
                title: "Smart Analytics",
                description: "Deep insights into score distributions, question difficulty, and overall candidate performance metrics.",
              },
              {
                icon: "🎯",
                title: "Automated Code Scoring",
                description: "Save time with instant scoring for objective questions and automated test case evaluation for code.",
              },
              {
                icon: "📧",
                title: "Streamlined Invites",
                description: "Easily manage candidate pools and send unique, secure test links with custom expiration settings.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border flex flex-col h-full transition-transform hover:-translate-y-1 shadow-sm"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Build", desc: "Create assessments from your custom question bank" },
              { step: "02", title: "Invite", desc: "Send secure, unique links to your candidates" },
              { step: "03", title: "Monitor", desc: "Track progress and violations in real-time" },
              { step: "04", title: "Evaluate", desc: "Review detailed reports and select top talent" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border text-center transition-transform hover:-translate-y-1 shadow-sm flex flex-col items-center"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-lg font-bold"
                  style={{
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                  }}
                >
                  {item.step}
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12 px-6 lg:px-8"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/bitmax-logo.png"
              alt="BITMAX Technology (P) Ltd"
              className="h-8 w-auto object-contain"
            />
          </div>
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            © 2026 BITMAX Technology (P) Ltd - STEP AHEAD. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
