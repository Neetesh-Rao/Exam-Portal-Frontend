"use client";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useGetCandidatesQuery, useCreateCandidateMutation } from "@/redux/api/candidatesApi";
import { apiSlice } from "@/redux/api/apiSlice";
import { useDispatch } from "react-redux";

// ── Toast notification state ─────────────────────────────────────────────────
function useCRMToast() {
  const [toast, setToast] = useState<{ name: string; email: string } | null>(null);

  const showToast = (candidate: { name: string; email: string }) => {
    setToast(candidate);
    setTimeout(() => setToast(null), 4000);
  };

  return { toast, showToast };
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "" });
  const [newCandidateIds, setNewCandidateIds] = useState<Set<string>>(new Set());

  const { data, isLoading: loading } = useGetCandidatesQuery(undefined);
  const [addCandidate, { isLoading: saving }] = useCreateCandidateMutation();
  const dispatch = useDispatch();
  const { toast, showToast } = useCRMToast();

  // ── Real-time socket: listen for CRM webhook candidate:added ──────────────
  useEffect(() => {
    const BACKEND_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const socket: Socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Candidates page: socket connected", socket.id);
    });

    // When CRM webhook fires, backend emits this event
    socket.on("candidate:added", (candidate: any) => {
      console.log("New candidate from CRM:", candidate);

      // Show toast notification
      showToast({ name: candidate.name, email: candidate.email });

      // Highlight new candidate (flash effect)
      setNewCandidateIds((prev) => {
        const updated = new Set(prev);
        updated.add(candidate.id || candidate._id?.toString());
        return updated;
      });

      // Invalidate RTK Query cache so list refreshes with new candidate
      dispatch(apiSlice.util.invalidateTags(["Candidate"]));

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setNewCandidateIds((prev) => {
          const updated = new Set(prev);
          updated.delete(candidate.id || candidate._id?.toString());
          return updated;
        });
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const candidates: any[] = data?.candidates || [];
  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      await addCandidate(form).unwrap();
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", source: "" });
    } catch (err) {
      console.error("Create candidate error:", err);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "invited") return <Badge variant="accent">Invited</Badge>;
    if (status === "completed") return <Badge variant="success">Completed</Badge>;
    if (status === "pending_invite") return <Badge variant="warning">Pending Invite</Badge>;
    return null;
  };

  return (
    <div>
      {/* ── CRM Toast Notification ──────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "white",
            padding: "14px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(2, 132, 199, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: "300px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <span style={{ fontSize: "20px" }}>🎯</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>New Candidate via CRM</div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>
              {toast.name} — {toast.email}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes highlightRow {
          0%   { background: rgba(14, 165, 233, 0.18); }
          100% { background: transparent; }
        }
        .crm-new-row {
          animation: highlightRow 5s ease forwards;
        }
      `}</style>

      <AdminHeader title="Candidates" subtitle="Manage candidate profiles" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setShowCreate(true)}>+ Add Candidate</Button>
        </div>

        {loading ? (
          <Card>
            <TableSkeleton />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title="No candidates yet"
              description="Add candidates or connect your CRM to auto-import them"
              actionLabel="Add Candidate"
              onAction={() => setShowCreate(true)}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border dark:border-dark-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Position
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default dark:divide-dk-border">
                {filtered.map((c: any) => {
                  const candidateId = c.id || c._id?.toString();
                  const isNew = newCandidateIds.has(candidateId);
                  return (
                    <tr
                      key={candidateId}
                      className={`hover:bg-app-bg-subtle dark:hover:bg-dark-surface transition-colors${isNew ? " crm-new-row" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
                            {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {c.name}
                            </span>
                            {isNew && (
                              <span style={{ fontSize: "10px", color: "#0ea5e9", fontWeight: 600 }}>
                                ✦ Just added via CRM
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{c.email}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {c.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {c.position || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {c.source ? <Badge variant="neutral">{c.source}</Badge> : "—"}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <a href={`/admin/candidates/${candidateId}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Candidate">
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="e.g., LinkedIn, Referral"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={saving}
              disabled={!form.name || !form.email}
            >
              Add Candidate
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
