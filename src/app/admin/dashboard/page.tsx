"use client";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useGetAnalyticsOverviewQuery } from "@/redux/api/analyticsApi";
import { useGetCandidatesQuery } from "@/redux/api/candidatesApi";
import { useGetSubmissionsQuery } from "@/redux/api/submissionsApi";
import { useGetTestsQuery } from "@/redux/api/testsApi";

// Sleek SVG Icons
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats }            = useGetAnalyticsOverviewQuery(undefined);
  const { data: candidatesData, isLoading: loadingCandidates } = useGetCandidatesQuery(undefined);
  const { data: submissionsData }                             = useGetSubmissionsQuery({});
  const { data: testsData }                                   = useGetTestsQuery(undefined);

  const candidates: any[]  = candidatesData?.candidates || [];
  const submissions: any[] = submissionsData?.submissions || [];
  const tests: any[]       = testsData?.tests || [];

  const recentCandidates  = candidates.slice(0, 5);
  const recentSubmissions = submissions.slice(0, 5);

  const statCards = [
    {
      label: "Assessments",
      value: stats?.totalTests || tests.length || 0,
      icon: "📋",
      badgeText: `${stats?.publishedTests || tests.filter((t) => t.status === "published").length || 0} Published`,
      badgeVariant: "success" as const,
      link: "/admin/tests",
    },
    {
      label: "Candidate Pool",
      value: stats?.totalCandidates || candidates.length || 0,
      icon: "👥",
      badgeText: `${stats?.totalInvites || 0} Invited`,
      badgeVariant: "accent" as const,
      link: "/admin/candidates",
    },
    {
      label: "Test Submissions",
      value: stats?.totalSubmissions || submissions.length || 0,
      icon: "📄",
      badgeText: "Evaluated",
      badgeVariant: "neutral" as const,
      link: "/admin/submissions",
    },
    {
      label: "Avg Score Pass Rate",
      value: `${stats?.avgScore || 0}%`,
      icon: "📊",
      badgeText: "System Average",
      badgeVariant: (stats?.avgScore || 0) >= 50 ? ("success" as const) : ("warning" as const),
      link: "/admin/analytics",
    },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard Overview" subtitle="BITMAX Assessment & Technical Hiring Pipeline" />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div
          className="p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                BITMAX Evaluation Hub
              </h2>
              <Badge variant="success">Live Operational</Badge>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Real-time candidate tracking, auto-grading engine, and CRM webhook integration active.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Link href="/admin/tests/new">
              <Button size="sm" className="flex items-center gap-1.5">
                <PlusIcon /> New Assessment
              </Button>
            </Link>
            <Link href="/admin/live-monitor">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <ActivityIcon /> Live Monitor
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            statCards.map((stat, i) => (
              <Link key={i} href={stat.link}>
                <div
                  className="p-5 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group flex flex-col justify-between h-full"
                  style={{
                    backgroundColor: "var(--surface-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {stat.label}
                      </p>
                      <p className="text-3xl font-extrabold mt-1 tracking-tight" style={{ color: "var(--text-primary)" }}>
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: "var(--surface2-color)" }}
                    >
                      {stat.icon}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border-color)" }}>
                    <Badge variant={stat.badgeVariant}>{stat.badgeText}</Badge>
                    <span className="text-xs font-medium group-hover:underline flex items-center gap-0.5" style={{ color: "#0284c7" }}>
                      View <ChevronRightIcon />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "/admin/tests/new",
                icon: <PlusIcon />,
                title: "Create Test",
                desc: "Build new assessment",
                color: "#0284c7",
                bg: "#eff6ff",
              },
              {
                href: "/admin/questions",
                icon: <QuestionIcon />,
                title: "Question Bank",
                desc: "Manage & edit questions",
                color: "#8b5cf6",
                bg: "#f5f3ff",
              },
              {
                href: "/admin/candidates",
                icon: <UserPlusIcon />,
                title: "Invite Candidates",
                desc: "Send test links via email",
                color: "#10b981",
                bg: "#ecfdf5",
              },
              {
                href: "/admin/live-monitor",
                icon: <ActivityIcon />,
                title: "Live Proctor",
                desc: "Monitor active test takers",
                color: "#f59e0b",
                bg: "#fffbeb",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.bg, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 2-Column Section: Recent Candidates & Recent Submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Candidates Card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Recent Candidates
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Candidates registered or auto-synced via CRM
                </p>
              </div>
              <Link href="/admin/candidates" className="text-xs font-semibold hover:underline" style={{ color: "#0284c7" }}>
                View All →
              </Link>
            </div>

            {loadingCandidates ? (
              <div className="space-y-2 py-4">
                <CardSkeleton />
              </div>
            ) : recentCandidates.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No candidates in pipeline yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentCandidates.map((c: any) => {
                  const cid = c.id || c._id;
                  return (
                    <div
                      key={cid}
                      className="p-3 rounded-lg border flex items-center justify-between transition-colors"
                      style={{
                        backgroundColor: "var(--surface2-color)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: "var(--surface-color)", color: "var(--text-secondary)" }}
                        >
                          {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{c.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.source === "crm_onboarding_form" && <Badge variant="accent">CRM</Badge>}
                        <Link href={`/admin/candidates/${cid}`}>
                          <button
                            type="button"
                            className="p-1.5 rounded-md hover:bg-sky-100 text-sky-600 transition-colors text-xs font-medium cursor-pointer"
                          >
                            View
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Submissions Card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Recent Submissions
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Latest test evaluations & grading statuses
                </p>
              </div>
              <Link href="/admin/submissions" className="text-xs font-semibold hover:underline" style={{ color: "#0284c7" }}>
                View All →
              </Link>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No candidate submissions completed yet.</p>
                <Link href="/admin/tests">
                  <Button variant="secondary" size="sm">Invite Candidates To Test</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSubmissions.map((sub: any) => {
                  const sid = sub.id || sub._id;
                  return (
                    <div
                      key={sid}
                      className="p-3 rounded-lg border flex items-center justify-between transition-colors"
                      style={{
                        backgroundColor: "var(--surface2-color)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {sub.candidateName || sub.candidate?.name || "Candidate"}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {sub.testTitle || sub.test?.title || "Assessment"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {sub.finalScore ?? sub.autoScore ?? 0} pts
                        </span>
                        <Link href={`/admin/submissions/${sid}`}>
                          <button
                            type="button"
                            className="p-1.5 rounded-md hover:bg-sky-100 text-sky-600 transition-colors text-xs font-medium cursor-pointer"
                          >
                            Grade
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* System Integration Status Banner */}
        <Card>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  CRM Webhook & Real-time Socket Listener
                </h4>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Endpoint: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-[11px]">POST /api/webhooks/crm-candidate</code> — HMAC SHA256 Signature Verified
                </p>
              </div>
            </div>
            <Link href="/admin/settings">
              <Button variant="secondary" size="sm">System Settings →</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
