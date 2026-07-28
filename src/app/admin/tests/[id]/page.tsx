"use client";
import { useState, use } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  useGetTestByIdQuery,
  useUpdateTestMutation,
  usePublishTestMutation,
} from "@/redux/api/testsApi";
import { useGetCandidatesQuery } from "@/redux/api/candidatesApi";
import { useSendBulkInvitesMutation } from "@/redux/api/invitesApi";

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading: loading } = useGetTestByIdQuery(id);
  const { data: candidatesData } = useGetCandidatesQuery(undefined);

  const [updateTest, { isLoading: saving }] = useUpdateTestMutation();
  const [publishTest] = usePublishTestMutation();
  const [sendInvites, { isLoading: inviting }] = useSendBulkInvitesMutation();

  const test = data?.test;
  const candidates: any[] = candidatesData?.candidates || [];

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(test?.title || "");
  const [description, setDescription] = useState(test?.description || "");

  // Invite modal state
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  
  // Custom Expiry state
  const [expiryOption, setExpiryOption] = useState<string>("24_hours");
  const [customVal, setCustomVal]         = useState<number>(30);
  const [customUnit, setCustomUnit]       = useState<string>("minutes");

  const [inviteResults, setInviteResults] = useState<{ token: string; email: string; inviteLink?: string; expiresAt?: string }[]>([]);

  const handleSave = async () => {
    try {
      await updateTest({ id, title: title || test?.title, description }).unwrap();
      setEditing(false);
    } catch (err) {
      console.error("Update test error:", err);
    }
  };

  const handlePublish = async () => {
    try {
      await publishTest(id).unwrap();
    } catch (err) {
      console.error("Publish test error:", err);
    }
  };

  // Helper to toggle candidate email
  const toggleCandidateEmail = (email: string) => {
    const list = inviteEmails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (list.includes(email)) {
      setInviteEmails(list.filter((e) => e !== email).join("\n"));
    } else {
      setInviteEmails([...list, email].join("\n"));
    }
  };

  const handleInvite = async () => {
    const emails = inviteEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
    if (!emails.length) return;

    let payload: any = { testId: id, candidateEmails: emails };

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
      const res = await sendInvites(payload).unwrap();
      setInviteResults(res.invites || []);
    } catch (err) {
      console.error("Invite candidates error:", err);
    }
  };

  if (loading) return (
    <div>
      <AdminHeader title="Loading..." />
      <div className="p-8 max-w-4xl mx-auto"><CardSkeleton /></div>
    </div>
  );

  if (!test) return (
    <div>
      <AdminHeader title="Test Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">This test does not exist.</div>
    </div>
  );

  const totalQuestions = (test.sections || []).reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0);

  const selectedEmailsList = inviteEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  return (
    <div>
      <AdminHeader title={test.title} subtitle={`Test #${test.id}`} />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          {test.status === "draft" && (
            <Button onClick={handlePublish}>Publish Test</Button>
          )}
          <Button variant="secondary" onClick={() => { setTitle(test.title); setDescription(test.description || ""); setEditing(true); }}>Edit Details</Button>
          <Button variant="secondary" onClick={() => setInviteModal(true)}>✉️ Invite Candidates</Button>
          <Badge variant={test.status === "published" ? "success" : "warning"}>{test.status}</Badge>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Duration</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{Math.floor((test.totalDurationSeconds || 3600) / 60)} minutes</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Pass Percentage</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{test.passPercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Total Questions</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Sections</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{test.sections?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Proctoring Settings</h3>
          <div className="flex flex-wrap gap-2">
            {test.proctoringConfig?.fullScreenRequired && <Badge variant="neutral">Fullscreen Required</Badge>}
            {test.proctoringConfig?.disableCopyPaste && <Badge variant="neutral">Copy/Paste Disabled</Badge>}
            {test.proctoringConfig?.disableRightClick && <Badge variant="neutral">Right-Click Disabled</Badge>}
            <Badge variant="neutral">Tab Switch Limit: {test.proctoringConfig?.tabSwitchLimit || 3}</Badge>
          </div>
        </Card>

        <Modal open={editing} onClose={() => setEditing(false)} title="Edit Test">
          <div className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        </Modal>

        {/* ── Candidate Invite Modal with Custom Expiration ──────────────────── */}
        <Modal open={inviteModal} onClose={() => { setInviteModal(false); setInviteResults([]); }} title="Invite Candidates to Assessment" size="lg">
          {inviteResults.length > 0 ? (
            <div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                ✓ {inviteResults.length} invitation(s) created & Nodemailer email dispatches initiated!
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {inviteResults.map((inv) => (
                  <div key={inv.token} className="p-3 border border-app-border rounded-lg bg-app-bg-subtle/50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{inv.email}</p>
                      {inv.expiresAt && (
                        <span className="text-[11px] font-semibold text-amber-500">
                          Expires: {new Date(inv.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(inv.expiresAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sky-500 mt-1.5 break-all font-mono">
                      Link: {inv.inviteLink || `${typeof window !== "undefined" ? window.location.origin : ""}/take-test/${inv.token}`}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => { setInviteModal(false); setInviteResults([]); setInviteEmails(""); }}>Done</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Candidate Suggestions Section */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Select Candidates from Database ({candidates.length} available)
                </label>
                
                <Input
                  placeholder="Search candidate name or email..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="mb-2"
                />

                {candidates.length > 0 && (
                  <div className="border border-app-border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1" style={{ backgroundColor: "var(--surface2-color)" }}>
                    {filteredCandidates.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-2">No matching candidates found.</p>
                    ) : (
                      filteredCandidates.map((c: any) => {
                        const isSelected = selectedEmailsList.includes(c.email);
                        return (
                          <div
                            key={c.id || c._id}
                            onClick={() => toggleCandidateEmail(c.email)}
                            className="flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs"
                            style={{
                              backgroundColor: isSelected ? "#eff6ff" : "transparent",
                              color: isSelected ? "#0284c7" : "var(--text-primary)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{c.name}</span>
                              <span style={{ color: "var(--text-muted)" }}>({c.email})</span>
                            </div>
                            <span className="font-bold">{isSelected ? "✓ Selected" : "+ Add"}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <Textarea
                label="Candidate Email Addresses (auto-filled or type manually)"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="Enter candidate emails (separated by commas or new lines)..."
                rows={3}
              />

              {/* Expiration Settings with Custom Option */}
              <div className="space-y-2">
                <Select
                  label="Assessment Link Expiration Time"
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

              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-500 font-medium">
                📧 Nodemailer will automatically dispatch unique test links to each candidate email address.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setInviteModal(false)}>Cancel</Button>
                <Button onClick={handleInvite} loading={inviting} disabled={!selectedEmailsList.length}>
                  Send Invitations ({selectedEmailsList.length})
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
