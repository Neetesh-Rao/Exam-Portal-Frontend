"use client";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  useUpdateCandidateMutation,
  useDeleteCandidateMutation,
} from "@/redux/api/candidatesApi";
import { useGetTestsQuery } from "@/redux/api/testsApi";
import { useSendBulkInvitesMutation } from "@/redux/api/invitesApi";
import { apiSlice } from "@/redux/api/apiSlice";
import { useDispatch } from "react-redux";

// ── CRM Toast ────────────────────────────────────────────────────────────────
function useCRMToast() {
  const [toast, setToast] = useState<{ name: string; email: string } | null>(null);
  const showToast = (candidate: { name: string; email: string }) => {
    setToast(candidate);
    setTimeout(() => setToast(null), 4000);
  };
  return { toast, showToast };
}

// ── Sleek Action Icons ───────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export default function CandidatesPage() {
  const [search, setSearch]           = useState("");
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState({ name: "", email: "", phone: "", resumeUrl: "", source: "" });
  const [newCandidateIds, setNewCandidateIds] = useState<Set<string>>(new Set());

  // Direct Invite Modal state
  const [inviteCandidateTarget, setInviteCandidateTarget] = useState<any | null>(null);
  const [selectedTestId, setSelectedTestId]               = useState<string>("");

  // Custom Expiry state
  const [expiryOption, setExpiryOption] = useState<string>("24_hours");
  const [customVal, setCustomVal]         = useState<number>(30);
  const [customUnit, setCustomUnit]       = useState<string>("minutes");

  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string>("");

  // Edit State
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm]     = useState({ name: "", email: "", phone: "", resumeUrl: "", source: "", status: "pending_invite" });

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError]   = useState("");

  const { data, isLoading: loading } = useGetCandidatesQuery(undefined);
  const { data: testsData } = useGetTestsQuery(undefined);
  const tests: any[] = testsData?.tests || [];

  const [addCandidate, { isLoading: saving }]       = useCreateCandidateMutation();
  const [updateCandidate, { isLoading: updating }] = useUpdateCandidateMutation();
  const [deleteCandidate, { isLoading: deleting }] = useDeleteCandidateMutation();
  const [sendInvites, { isLoading: sendingInvite }] = useSendBulkInvitesMutation();
  const dispatch = useDispatch();
  const { toast, showToast } = useCRMToast();

  // ── Real-time Socket Listener ──────────────────────────────────────────────
  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket: Socket = io(BACKEND_URL, { withCredentials: true, transports: ["websocket", "polling"] });

    socket.on("candidate:added", (candidate: any) => {
      showToast({ name: candidate.name, email: candidate.email });
      const cid = candidate.id || candidate._id?.toString();
      setNewCandidateIds((prev) => new Set(prev).add(cid));
      dispatch(apiSlice.util.invalidateTags(["Candidate"]));
      setTimeout(() => {
        setNewCandidateIds((prev) => { const s = new Set(prev); s.delete(cid); return s; });
      }, 5000);
    });

    return () => { socket.disconnect(); };
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
      setForm({ name: "", email: "", phone: "", resumeUrl: "", source: "" });
    } catch (err) {
      console.error("Create candidate error:", err);
    }
  };

  const handleOpenInvite = (c: any) => {
    setInviteCandidateTarget(c);
    setInviteSuccessMsg("");
    if (tests.length > 0) {
      setSelectedTestId(tests[0].id || tests[0]._id);
    }
  };

  const handleSendDirectInvite = async () => {
    if (!inviteCandidateTarget || !selectedTestId) return;

    let payload: any = { testId: selectedTestId, candidateEmails: [inviteCandidateTarget.email] };

    if (expiryOption === "15_mins")       payload.expiresInMinutes = 15;
    else if (expiryOption === "30_mins")  payload.expiresInMinutes = 30;
    else if (expiryOption === "1_hour")   payload.expiresInHours = 1;
    else if (expiryOption === "2_hours")  payload.expiresInHours = 2;
    else if (expiryOption === "6_hours")  payload.expiresInHours = 6;
    else if (expiryOption === "24_hours") payload.expiresInHours = 24;
    else if (expiryOption === "7_days")   payload.expiresInDays = 7;
    else if (expiryOption === "30_days")  payload.expiresInDays = 30;
    else if (expiryOption === "custom") {
      if (customUnit === "seconds")      payload.expiresInSeconds = customVal;
      else if (customUnit === "minutes") payload.expiresInMinutes = customVal;
      else if (customUnit === "hours")   payload.expiresInHours = customVal;
      else if (customUnit === "days")    payload.expiresInDays = customVal;
    }

    try {
      await sendInvites(payload).unwrap();
      setInviteSuccessMsg(`✓ Assessment invite dispatched to ${inviteCandidateTarget.email}!`);
      setTimeout(() => {
        setInviteCandidateTarget(null);
        setInviteSuccessMsg("");
      }, 2500);
    } catch (err) {
      console.error("Failed to send direct invite:", err);
    }
  };

  const handleOpenEdit = (c: any) => {
    const candidateId = c.id || c._id?.toString();
    setEditTarget({ id: candidateId, ...c });
    setEditForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      resumeUrl: c.resumeUrl || "",
      source: c.source || "",
      status: c.status || "pending_invite",
    });
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      await updateCandidate({ id: editTarget.id, ...editForm }).unwrap();
      setEditTarget(null);
    } catch (err) {
      console.error("Update candidate error:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteCandidate(deleteTarget.id).unwrap();
      setDeleteTarget(null);
    } catch {
      setDeleteError("Delete failed. Please try again.");
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "invited")        return <Badge variant="accent">Invited</Badge>;
    if (status === "completed")      return <Badge variant="success">Completed</Badge>;
    if (status === "pending_invite")  return <Badge variant="warning">Pending Invite</Badge>;
    return null;
  };

  return (
    <div>
      {/* CRM Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 9999,
          background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white",
          padding: "14px 20px", borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(2,132,199,0.4)",
          display: "flex", alignItems: "center", gap: "12px",
          minWidth: "300px", animation: "slideIn 0.3s ease",
        }}>
          <span style={{ fontSize: "20px" }}>🎯</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>New Candidate via CRM</div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>{toast.name} — {toast.email}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn  { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes highlightRow { 0% { background:rgba(14,165,233,.18); } 100% { background:transparent; } }
        .crm-new-row { animation: highlightRow 5s ease forwards; }
      `}</style>

      <AdminHeader title="Candidates" subtitle="Manage candidate profiles & resumes" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Input placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Button onClick={() => setShowCreate(true)}>+ Add Candidate</Button>
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    {["Name", "Email", "Phone", "Resume", "Source", "Status", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-xs font-semibold uppercase tracking-wider"
                        style={{
                          textAlign: i === 6 ? "right" : "left",
                          color: "var(--text-muted)",
                          minWidth: i === 6 ? "150px" : undefined,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => {
                    const candidateId = c.id || c._id?.toString();
                    const isNew = newCandidateIds.has(candidateId);
                    return (
                      <tr
                        key={candidateId}
                        className={isNew ? "crm-new-row" : ""}
                        style={{ borderBottom: "1px solid var(--border-color)", transition: "background .15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface2-color)"; }}
                        onMouseLeave={(e) => { if (!isNew) (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                      >
                        {/* Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: "var(--surface2-color)", color: "var(--text-secondary)" }}
                            >
                              {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                              {isNew && (
                                <span style={{ fontSize: "10px", color: "#0ea5e9", fontWeight: 600 }}>✦ Just added via CRM</span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-4 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>{c.email}</td>
                        {/* Phone */}
                        <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{c.phone || "—"}</td>
                        {/* Resume Column (Download Link / View) */}
                        <td className="px-4 py-3.5 text-sm">
                          {c.resumeUrl ? (
                            <a
                              href={c.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border"
                              style={{
                                color: "#0284c7",
                                backgroundColor: "#eff6ff",
                                borderColor: "#bfdbfe",
                              }}
                              title="View / Download Resume"
                            >
                              <FileTextIcon /> Resume
                            </a>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        {/* Source */}
                        <td className="px-4 py-3.5">{c.source ? <Badge variant="neutral">{c.source}</Badge> : "—"}</td>
                        {/* Status */}
                        <td className="px-4 py-3.5">{getStatusBadge(c.status)}</td>
                        {/* Actions Column: Invite, View, Edit, Delete (Guaranteed Visible) */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1 min-w-[140px]">
                            {/* Direct Invite Icon */}
                            <button
                              type="button"
                              title="Send Test Invitation Email"
                              onClick={() => handleOpenInvite(c)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                              style={{ color: "#0284c7", background: "transparent" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#eff6ff";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                              }}
                            >
                              <SendIcon />
                            </button>

                            {/* View Icon */}
                            <a href={`/admin/candidates/${candidateId}`}>
                              <button
                                type="button"
                                title="View Candidate Details"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
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

                            {/* Edit Icon */}
                            <button
                              type="button"
                              title="Edit Candidate"
                              onClick={() => handleOpenEdit(c)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
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

                            {/* Delete Icon (Trash) — High Contrast & Clear */}
                            <button
                              type="button"
                              title="Delete Candidate"
                              onClick={() => setDeleteTarget({ id: candidateId, name: c.name })}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
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
            </div>
          </Card>
        )}

        {/* Direct Send Test Invite Modal with Custom Expiration */}
        <Modal
          open={!!inviteCandidateTarget}
          onClose={() => { setInviteCandidateTarget(null); setInviteSuccessMsg(""); }}
          title={`Invite ${inviteCandidateTarget?.name || "Candidate"} to Assessment`}
        >
          <div className="space-y-4">
            {inviteSuccessMsg ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 font-medium text-sm text-center">
                {inviteSuccessMsg}
              </div>
            ) : (
              <>
                <div className="p-3 rounded-lg border text-xs space-y-1" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface2-color)" }}>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Recipient: {inviteCandidateTarget?.name}</p>
                  <p style={{ color: "var(--text-muted)" }}>Email: {inviteCandidateTarget?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Select Assessment / Test
                  </label>
                  {tests.length === 0 ? (
                    <p className="text-xs text-amber-600">No published tests found. Please create a test first.</p>
                  ) : (
                    <select
                      value={selectedTestId}
                      onChange={(e) => setSelectedTestId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border text-sm outline-none"
                      style={{
                        backgroundColor: "var(--surface-color)",
                        color: "var(--text-primary)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      {tests.map((t: any) => (
                        <option key={t.id || t._id} value={t.id || t._id}>
                          {t.title} ({Math.floor((t.totalDurationSeconds || 3600) / 60)} min)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Custom Expiration Settings */}
                <div className="space-y-2">
                  <Select
                    label="Link Expiration Window"
                    value={expiryOption}
                    onChange={(e) => setExpiryOption(e.target.value)}
                    options={[
                      { value: "15_mins", label: "⚡ 15 Minutes Expiration" },
                      { value: "30_mins", label: "⚡ 30 Minutes Expiration" },
                      { value: "1_hour", label: "⚡ 1 Hour Expiration" },
                      { value: "2_hours", label: "⚡ 2 Hours Expiration" },
                      { value: "6_hours", label: "⚡ 6 Hours Expiration" },
                      { value: "24_hours", label: "📅 24 Hours (1 Day)" },
                      { value: "7_days", label: "📅 7 Days" },
                      { value: "30_days", label: "📅 30 Days" },
                      { value: "custom", label: "⚙️ Custom Expiration (Set exact minutes/hours/seconds)..." },
                    ]}
                  />

                  {expiryOption === "custom" && (
                    <div className="p-3 rounded-lg border flex items-center gap-3" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                      <div className="flex-1">
                        <Input
                          label="Custom Expiration Value"
                          type="number"
                          min="1"
                          value={customVal}
                          onChange={(e) => setCustomVal(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                      <div className="w-40">
                        <Select
                          label="Time Unit"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          options={[
                            { value: "seconds", label: "Seconds" },
                            { value: "minutes", label: "Minutes" },
                            { value: "hours", label: "Hours" },
                            { value: "days", label: "Days" },
                          ]}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setInviteCandidateTarget(null)}>Cancel</Button>
                  <Button onClick={handleSendDirectInvite} loading={sendingInvite} disabled={!selectedTestId}>
                    Send Assessment Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Add Candidate Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Candidate">
          <div className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Resume URL (Cloudinary / PDF link)" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} placeholder="https://res.cloudinary.com/..." />
            <Input label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g., LinkedIn, Referral" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.name || !form.email}>Add Candidate</Button>
          </div>
        </Modal>

        {/* Edit Candidate Modal */}
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Candidate">
          <div className="space-y-4">
            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <Input label="Resume URL" value={editForm.resumeUrl} onChange={(e) => setEditForm({ ...editForm, resumeUrl: e.target.value })} />
            <Input label="Source" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: "pending_invite", label: "Pending Invite" },
                { value: "invited", label: "Invited" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updating} disabled={!editForm.name || !editForm.email}>Save Changes</Button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeleteError(""); }} title="Delete Candidate" size="sm">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <TrashIcon />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Are you sure you want to delete <span style={{ fontWeight: 700 }}>{deleteTarget?.name}</span>?
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                This will also delete all their test invites. This action cannot be undone.
              </p>
            </div>
            {deleteError && <p className="text-xs text-center" style={{ color: "#dc2626" }}>{deleteError}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => { setDeleteTarget(null); setDeleteError(""); }}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>Yes, Delete</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
