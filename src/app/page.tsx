"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app-bg dark:bg-dark-bg transition-colors">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-app-border dark:border-dark-border">
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

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="accent" className="mb-6">BITMAX Technology (P) Ltd — STEP AHEAD</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight mb-8">
            Technical Assessment & <br />
            <span className="text-brand">Evaluation Portal</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-primary)]-sub dark:text-dark-text-sub max-w-2xl mx-auto mb-10">
            Dedicated assessment platform for BITMAX Technology (P) Ltd. Conduct technical evaluations, live webcam proctoring, and automated code testing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">Admin Login →</Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">Explore Features</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-app-bg-subtle dark:bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              BITMAX Technical Evaluation Infrastructure
            </h2>
            <p className="text-[var(--text-primary)]-sub dark:text-dark-text-sub max-w-xl mx-auto">
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
              <Card key={i} hover className="flex flex-col h-full">
                <span className="text-4xl mb-6 block">{feature.icon}</span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{feature.title}</h3>
                <p className="text-[var(--text-primary)]-sub dark:text-dark-text-sub flex-1">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: "01", title: "Build", desc: "Create assessments from your custom question bank" },
              { step: "02", title: "Invite", desc: "Send secure, unique links to your candidates" },
              { step: "03", title: "Monitor", desc: "Track progress and violations in real-time" },
              { step: "04", title: "Evaluate", desc: "Review detailed reports and select top talent" },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-[var(--text-primary)] text-[var(--bg-color)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-primary)]-sub dark:text-dark-text-sub">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-app-border dark:border-dark-border py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img
              src="/bitmax-logo.png"
              alt="BITMAX Technology (P) Ltd"
              className="h-8 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-[var(--text-primary)]-sub dark:text-dark-text-sub">
            © 2026 BITMAX Technology (P) Ltd - STEP AHEAD. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
