"use client";
import { useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useGetTestsQuery, useDeleteTestMutation } from "@/redux/api/testsApi";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export default function TestsPage() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data, isLoading: loading } = useGetTestsQuery(undefined);
  const [removeTest, { isLoading: deleting }] = useDeleteTestMutation();

  const tests = data?.tests || [];

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeTest(deleteTarget.id || deleteTarget._id).unwrap();
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete test:", error);
    }
  };

  const filtered = tests.filter((t: any) => t.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "warning" | "neutral"> = { published: "success", draft: "warning", archived: "neutral" };
    return <Badge variant={map[s] || "neutral"}>{s}</Badge>;
  };

  return (
    <div>
      <AdminHeader title="Tests" subtitle="Manage your assessments" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Input
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Link href="/admin/tests/new">
            <Button>+ Create Test</Button>
          </Link>
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title="No tests yet"
              description="Create your first assessment to start evaluating candidates"
              actionLabel="Create Test"
              onAction={() => window.location.href = "/admin/tests/new"}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Duration</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Questions</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pass %</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((test: any) => {
                  const testId = test.id || test._id;
                  return (
                    <tr
                      key={testId}
                      style={{ borderBottom: "1px solid var(--border-color)", transition: "background .15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface2-color)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/admin/tests/${testId}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                          {test.title}
                        </Link>
                        {test.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{test.description}</p>}
                      </td>
                      <td className="px-6 py-4">{statusBadge(test.status)}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{Math.floor((test.totalDurationSeconds || 3600) / 60)} min</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{(test.sections || []).reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0)}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{test.passPercentage}%</td>
                      <td className="px-6 py-4">
                        {/* Icon Actions */}
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Icon */}
                          <Link href={`/admin/tests/${testId}`}>
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
                          </Link>

                          {/* Edit Icon */}
                          <Link href={`/admin/tests/${testId}/edit`}>
                            <button
                              type="button"
                              title="Edit Test"
                              className="p-2 rounded-lg transition-colors cursor-pointer"
                              style={{ color: "var(--text-secondary)", background: "transparent" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface2-color)";
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                              }}
                            >
                              <EditIcon />
                            </button>
                          </Link>

                          {/* Delete Icon */}
                          <button
                            type="button"
                            title="Delete Test"
                            onClick={() => setDeleteTarget(test)}
                            className="p-2 rounded-lg transition-colors cursor-pointer"
                            style={{ color: "#dc2626", background: "transparent" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Test" size="sm">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <TrashIcon />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Are you sure you want to delete <span className="font-bold">{deleteTarget?.title}</span>?
            </p>
            <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>Yes, Delete</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
