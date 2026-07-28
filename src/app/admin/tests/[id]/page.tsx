"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  // Invite modal state
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  
  // Custom Expiry state
  const [expiryOption, setExpiryOption] = useState<string>("24_hours");
  const [customVal, setCustomVal] = useState<number>(30);
  const [customUnit, setCustomUnit] = useState<string>("minutes");

  const [inviteResults, setInviteResults] = useState<{ token: string; email: string; inviteLink?: string; expiresAt?: string }[]>([]);

  const toggleExpandQuestion = (qid: string) => {
    setExpandedQuestionIds((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

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

  const diffBadge = (d: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = {
      easy: "success",
      medium: "warning",
      hard: "danger",
    };
    return <Badge variant={map[d] || "neutral"}>{d || "medium"}</Badge>;
  };

  if (loading) return (
    <div>
      <AdminHeader title="Loading Assessment Test..." />
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );

  if (!test) return (
    <div>
      <AdminHeader title="Test Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">This test does not exist or was deleted.</div>
    </div>
  );

  // Extract all questions across all sections
  const allQuestions: any[] = [];
  (test.sections || []).forEach((sec: any) => {
    (sec.questionIds || []).forEach((q: any) => {
      if (q) allQuestions.push(q);
    });
  });

  const totalQuestions = allQuestions.length;
  const totalMarks = allQuestions.reduce((sum, q) => sum + (typeof q === "object" ? (q.marks || 1) : 1), 0);

  // Category distribution
  const categoryStats = new Map<string, { count: number; marks: number }>();
  allQuestions.forEach((q) => {
    if (typeof q === "object") {
      const cat = q.category || "General";
      const current = categoryStats.get(cat) || { count: 0, marks: 0 };
      categoryStats.set(cat, {
        count: current.count + 1,
        marks: current.marks + (q.marks || 1),
      });
    }
  });

  const isAllExpanded = allQuestions.length > 0 && allQuestions.every((q) => {
    const qid = typeof q === "object" ? (q.id || q._id?.toString()) : q;
    return expandedQuestionIds[qid];
  });

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedQuestionIds({});
    } else {
      const next: Record<string, boolean> = {};
      allQuestions.forEach((q) => {
        const qid = typeof q === "object" ? (q.id || q._id?.toString()) : q;
        if (qid) next[qid] = true;
      });
      setExpandedQuestionIds(next);
    }
  };

  const selectedEmailsList = inviteEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  return (
    <div>
      <AdminHeader
        title={test.title}
        subtitle={`Assessment ID: #${test.id || test._id} • Created ${new Date(test.createdAt || Date.now()).toLocaleDateString()}`}
      />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Top Control Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-color)] p-4 rounded-2xl border" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/tests")}
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              ← Back to Tests
            </button>
            <span className="text-[var(--border-color)]">|</span>
            <Badge variant={test.status === "published" ? "success" : "warning"}>
              {test.status === "published" ? "✓ Published" : "Draft Mode"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {test.status === "draft" && (
              <Button onClick={handlePublish} variant="primary">
                🚀 Publish Test
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => router.push(`/admin/tests/${id}/edit`)}
            >
              ✏️ Edit Questions & Settings
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setTitle(test.title); setDescription(test.description || ""); setEditing(true); }}
            >
              ⚙️ Quick Edit Info
            </Button>
            <Button
              onClick={() => setInviteModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
            >
              ✉️ Invite Candidates
            </Button>
          </div>
        </div>

        {/* Executive Summary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Duration</span>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">
              {Math.floor((test.totalDurationSeconds || 3600) / 60)} <span className="text-sm font-normal text-[var(--text-muted)]">mins</span>
            </p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Passing Mark</span>
            <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
              {test.passPercentage}% <span className="text-sm font-normal text-[var(--text-muted)]">score</span>
            </p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Questions</span>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">
              {totalQuestions} <span className="text-sm font-normal text-[var(--text-muted)]">items</span>
            </p>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Marks</span>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalMarks} <span className="text-sm font-normal text-[var(--text-muted)]">points</span>
            </p>
          </Card>
        </div>

        {/* Test Overview Description Card */}
        {test.description && (
          <Card className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Test Objective / Overview</h4>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {test.description}
            </p>
          </Card>
        )}

        {/* Category Breakdown & Series Stats */}
        {categoryStats.size > 0 && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Category Distribution ({categoryStats.size} Topic Series Included)
              </h4>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {Array.from(categoryStats.entries()).map(([catName, stats]) => (
                <div
                  key={catName}
                  className="px-3 py-2 rounded-xl border flex items-center gap-2 text-xs"
                  style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="font-bold text-[var(--text-primary)]">{catName} Series:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">{stats.count} Qs</span>
                  <span className="text-[var(--text-muted)]">({stats.marks} pts)</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Comprehensive Included Questions List Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Included Questions ({totalQuestions})</h3>
              <p className="text-xs text-[var(--text-muted)]">Full list of questions set for candidate assessment</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleExpandAll}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer bg-[var(--surface-color)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--surface2-color)]"
              >
                {isAllExpanded ? "Collapse All Details ▲" : "Expand All Question Details ▼"}
              </button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/admin/tests/${id}/edit`)}
              >
                + Add / Remove Questions
              </Button>
            </div>
          </div>

          {allQuestions.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--text-muted)] border rounded-xl p-6" style={{ borderColor: "var(--border-color)" }}>
              No questions added to this test yet.{" "}
              <button
                onClick={() => router.push(`/admin/tests/${id}/edit`)}
                className="text-sky-500 underline font-semibold cursor-pointer"
              >
                Add questions from bank →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allQuestions.map((q: any, idx: number) => {
                const isObj = typeof q === "object";
                const qid = isObj ? (q.id || q._id?.toString() || idx) : q;
                const isExpanded = !!expandedQuestionIds[qid];

                if (!isObj) {
                  return (
                    <div key={qid} className="p-3 rounded-lg border text-xs text-[var(--text-muted)]">
                      Question ID: <code className="font-mono">{qid}</code>
                    </div>
                  );
                }

                return (
                  <div
                    key={qid}
                    className="p-4 rounded-xl border transition-all bg-[var(--surface-color)] hover:border-sky-400"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h5
                            onClick={() => toggleExpandQuestion(qid)}
                            className="text-sm font-bold text-[var(--text-primary)] cursor-pointer hover:text-sky-600 transition-colors leading-tight"
                          >
                            {q.title}
                          </h5>

                          {/* Truncated description preview */}
                          {q.description ? (
                            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                              {q.description}
                            </p>
                          ) : q.options && q.options.length > 0 ? (
                            <p className="text-xs text-[var(--text-muted)] mt-1 truncate italic">
                              Options ({q.options.length}): {q.options.map((o: any) => o.text).filter(Boolean).join(" • ")}
                            </p>
                          ) : null}

                          {/* Badges Bar */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <Badge variant="accent">{q.category || "General"}</Badge>
                            <Badge variant="neutral">{q.type ? q.type.replace(/_/g, " ") : "mcq"}</Badge>
                            {diffBadge(q.difficulty)}
                            <span className="text-xs font-semibold text-[var(--text-primary)]">{q.marks || 1} marks</span>
                            {q.negativeMarks ? (
                              <span className="text-xs text-rose-500 font-medium">(-{q.negativeMarks} negative)</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* View Details Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpandQuestion(qid)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 shrink-0 cursor-pointer"
                      >
                        {isExpanded ? "Hide Details ▲" : "👁 Question Details ▼"}
                      </button>
                    </div>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="mt-4 pt-3.5 border-t text-xs space-y-3.5" style={{ borderColor: "var(--border-color)" }}>
                        {/* Full Description */}
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                            Full Question Statement:
                          </span>
                          <div className="p-3.5 rounded-lg bg-[var(--surface2-color)] border border-app-border dark:border-dark-border text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed text-xs">
                            {q.description || q.title}
                          </div>
                        </div>

                        {/* MCQ Options Display */}
                        {q.options && q.options.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                              Options & Answer Key:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt: any, optIdx: number) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                return (
                                  <div
                                    key={opt.id || optIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                                      opt.isCorrect
                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-medium"
                                        : "bg-[var(--surface2-color)] border-app-border dark:border-dark-border text-[var(--text-primary)]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                          opt.isCorrect
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                        }`}
                                      >
                                        {letter}
                                      </span>
                                      <span className="break-words">{opt.text}</span>
                                    </div>
                                    {opt.isCorrect && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white shrink-0">
                                        ✓ Correct Answer
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Starter Code Block */}
                        {q.codeConfig?.starterCode && (
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                              Starter Code ({q.codeConfig.language || "code"}):
                            </span>
                            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
                              <code>{q.codeConfig.starterCode}</code>
                            </pre>
                          </div>
                        )}

                        {/* Text Answer */}
                        {q.correctTextAnswer && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                            <span className="font-bold">Expected Answer: </span>
                            <code>{q.correctTextAnswer}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Proctoring & Security Configuration Settings Card */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)] border-b pb-2" style={{ borderColor: "var(--border-color)" }}>
            Proctoring & System Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border flex items-center justify-between" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
              <span className="font-semibold text-[var(--text-primary)]">Fullscreen Mode Enforcement</span>
              {test.proctoringConfig?.fullScreenRequired !== false ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">✓ Required</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] text-[var(--text-muted)] bg-slate-100 dark:bg-slate-800">Disabled</span>
              )}
            </div>

            <div className="p-3 rounded-lg border flex items-center justify-between" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
              <span className="font-semibold text-[var(--text-primary)]">Tab Switch Violation Limit</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {test.proctoringConfig?.tabSwitchLimit || 3} Max Switches
              </span>
            </div>

            <div className="p-3 rounded-lg border flex items-center justify-between" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
              <span className="font-semibold text-[var(--text-primary)]">Copy / Paste Restriction</span>
              {test.proctoringConfig?.disableCopyPaste !== false ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">✓ Blocked</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] text-[var(--text-muted)] bg-slate-100 dark:bg-slate-800">Allowed</span>
              )}
            </div>

            <div className="p-3 rounded-lg border flex items-center justify-between" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
              <span className="font-semibold text-[var(--text-primary)]">Right Click Restriction</span>
              {test.proctoringConfig?.disableRightClick !== false ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">✓ Blocked</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] text-[var(--text-muted)] bg-slate-100 dark:bg-slate-800">Allowed</span>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Edit Title/Description Modal */}
        <Modal open={editing} onClose={() => setEditing(false)} title="Quick Edit Assessment Info">
          <div className="space-y-4">
            <Input label="Test Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea label="Description / Objective" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save Info</Button>
            </div>
          </div>
        </Modal>

        {/* Candidate Invite Modal with Custom Expiration */}
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
