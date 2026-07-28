"use client";
import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useGetSubmissionsQuery } from "@/redux/api/submissionsApi";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading: loading } = useGetSubmissionsQuery(undefined);

  const submissions: any[] = data?.submissions || [];
  const filtered = statusFilter ? submissions.filter((s) => s.status === statusFilter) : submissions;

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "neutral"> = {
      in_progress: "warning", submitted: "success", auto_submitted: "danger", graded: "success"
    };
    return <Badge variant={map[s] || "neutral"}>{s ? s.replace("_", " ") : "N/A"}</Badge>;
  };

  return (
    <div>
      <AdminHeader title="Submissions" subtitle="Review candidate test submissions" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Status" },
              { value: "in_progress", label: "In Progress" },
              { value: "submitted", label: "Submitted" },
              { value: "auto_submitted", label: "Auto Submitted" },
              { value: "graded", label: "Graded" },
            ]}
          />
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState title="No submissions" description="Submissions will appear here once candidates take tests" />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Candidate</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Test</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Score</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Submitted</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub: any) => {
                  const subId = sub.id || sub._id;
                  return (
                    <tr
                      key={subId}
                      style={{ borderBottom: "1px solid var(--border-color)", transition: "background .15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface2-color)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.candidate?.name || "Unknown"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub.candidate?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{sub.test?.title || "—"}</td>
                      <td className="px-6 py-4">{statusBadge(sub.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {sub.finalScore ?? sub.autoScore ?? 0}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>/{sub.totalMarks ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <a href={`/admin/submissions/${subId}`}>
                            <button
                              type="button"
                              title="View Details"
                              className="p-2 rounded-lg transition-colors cursor-pointer"
                              style={{ color: "var(--text-secondary)", background: "transparent" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--badge-accent-bg)";
                                (e.currentTarget as HTMLButtonElement).style.color = "#0284c7";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                              }}
                            >
                              <EyeIcon />
                            </button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
