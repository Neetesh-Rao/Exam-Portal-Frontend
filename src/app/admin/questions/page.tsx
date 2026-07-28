"use client";
import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from "@/redux/api/questionsApi";

// Sleek Uniform Action Icons
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
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

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<any | null>(null);

  // Detailed Edit State
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "mcq_single",
    difficulty: "medium",
    marks: 1,
    negativeMarks: 0,
    tags: "",
    correctTextAnswer: "",
    options: [
      { id: "a", text: "", isCorrect: true },
      { id: "b", text: "", isCorrect: false },
      { id: "c", text: "", isCorrect: false },
      { id: "d", text: "", isCorrect: false },
    ],
    codeLanguage: "javascript",
    starterCode: "",
    disablePaste: false,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteErr, setDeleteErr] = useState("");

  const { data, isLoading: loading } = useGetQuestionsQuery(search);
  const [addQuestion, { isLoading: saving }] = useCreateQuestionMutation();
  const [updateQuestion, { isLoading: updating }] = useUpdateQuestionMutation();
  const [removeQuestion, { isLoading: deleting }] = useDeleteQuestionMutation();

  const questions: any[] = data?.questions || [];

  const filtered = questions.filter((q) => {
    if (typeFilter && q.type !== typeFilter) return false;
    if (diffFilter && q.difficulty !== diffFilter) return false;
    return true;
  });

  // Create Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "mcq_single",
    difficulty: "medium",
    marks: 1,
    negativeMarks: 0,
    tags: "",
    correctTextAnswer: "",
    options: [
      { id: "a", text: "", isCorrect: true },
      { id: "b", text: "", isCorrect: false },
      { id: "c", text: "", isCorrect: false },
      { id: "d", text: "", isCorrect: false },
    ],
    codeLanguage: "javascript",
    starterCode: "",
    disablePaste: false,
  });

  const handleCreate = async () => {
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      type: form.type,
      difficulty: form.difficulty,
      marks: form.marks,
      negativeMarks: form.negativeMarks,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (["mcq_single", "mcq_multi", "true_false"].includes(form.type)) {
      payload.options = form.options;
    }
    if (form.type === "fill_blank") {
      payload.correctTextAnswer = form.correctTextAnswer;
    }
    if (form.type === "coding") {
      payload.codeConfig = { language: form.codeLanguage, starterCode: form.starterCode, disablePaste: form.disablePaste };
    }

    try {
      await addQuestion(payload).unwrap();
      setShowCreate(false);
      setForm({
        title: "", description: "", type: "mcq_single", difficulty: "medium", marks: 1, negativeMarks: 0,
        tags: "", correctTextAnswer: "", options: [
          { id: "a", text: "", isCorrect: true },
          { id: "b", text: "", isCorrect: false },
          { id: "c", text: "", isCorrect: false },
          { id: "d", text: "", isCorrect: false },
        ],
        codeLanguage: "javascript", starterCode: "", disablePaste: false,
      });
    } catch (err) {
      console.error("Create question error:", err);
    }
  };

  const handleOpenEdit = (q: any) => {
    const qid = q.id || q._id;
    setEditTarget({ id: qid, ...q });
    setEditForm({
      title: q.title || "",
      description: q.description || "",
      type: q.type || "mcq_single",
      difficulty: q.difficulty || "medium",
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      tags: (q.tags || []).join(", "),
      correctTextAnswer: q.correctTextAnswer || "",
      options: q.options && q.options.length > 0 ? q.options : [
        { id: "a", text: "", isCorrect: true },
        { id: "b", text: "", isCorrect: false },
        { id: "c", text: "", isCorrect: false },
        { id: "d", text: "", isCorrect: false },
      ],
      codeLanguage: q.codeConfig?.language || "javascript",
      starterCode: q.codeConfig?.starterCode || "",
      disablePaste: q.codeConfig?.disablePaste || false,
    });
  };

  const handleUpdate = async () => {
    if (!editTarget) return;

    const payload: Record<string, unknown> = {
      title: editForm.title,
      description: editForm.description,
      type: editForm.type,
      difficulty: editForm.difficulty,
      marks: editForm.marks,
      negativeMarks: editForm.negativeMarks,
      tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (["mcq_single", "mcq_multi", "true_false"].includes(editForm.type)) {
      payload.options = editForm.options;
    }
    if (editForm.type === "fill_blank") {
      payload.correctTextAnswer = editForm.correctTextAnswer;
    }
    if (editForm.type === "coding") {
      payload.codeConfig = {
        language: editForm.codeLanguage,
        starterCode: editForm.starterCode,
        disablePaste: editForm.disablePaste,
      };
    }

    try {
      await updateQuestion({
        id: editTarget.id,
        ...payload,
      }).unwrap();
      setEditTarget(null);
    } catch (err) {
      console.error("Update question error:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteErr("");
    try {
      const qid = deleteTarget.id || deleteTarget._id;
      await removeQuestion(qid).unwrap();
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Delete question error:", err);
      setDeleteErr(err?.data?.error || "Failed to delete question. Please try again.");
    }
  };

  const diffBadge = (d: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = { easy: "success", medium: "warning", hard: "danger" };
    return <Badge variant={map[d] || "neutral"}>{d}</Badge>;
  };

  const typeLabel = (t: string) => (t ? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A");

  return (
    <div>
      <AdminHeader title="Question Bank" subtitle="Manage your assessment questions" />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: "", label: "All Types" },
                { value: "mcq_single", label: "MCQ Single" },
                { value: "mcq_multi", label: "MCQ Multiple" },
                { value: "true_false", label: "True/False" },
                { value: "fill_blank", label: "Fill Blank" },
                { value: "text_area", label: "Text Area" },
                { value: "coding", label: "Coding" },
              ]}
            />
            <Select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              options={[
                { value: "", label: "All Difficulty" },
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </div>
          <Button onClick={() => setShowCreate(true)}>+ Add Question</Button>
        </div>

        {loading ? (
          <Card><TableSkeleton /></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title="No questions yet"
              description="Build your question bank to create assessments"
              actionLabel="Add Question"
              onAction={() => setShowCreate(true)}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Question</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Difficulty</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Marks</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q: any) => {
                  const qId = q.id || q._id;
                  return (
                    <tr
                      key={qId}
                      style={{ borderBottom: "1px solid var(--border-color)", transition: "background .15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface2-color)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{q.title}</p>
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {q.tags.map((tag: string, i: number) => <Badge key={i} variant="neutral">{tag}</Badge>)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><Badge variant="accent">{typeLabel(q.type)}</Badge></td>
                      <td className="px-6 py-4">{diffBadge(q.difficulty)}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{q.marks}</td>
                      <td className="px-6 py-4">
                        {/* Sleek Action Buttons: View, Edit, Delete */}
                        <div className="flex items-center justify-end gap-1">
                          {/* View Icon */}
                          <button
                            type="button"
                            title="View Detailed Question"
                            onClick={() => setViewQuestion(q)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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

                          {/* Edit Icon */}
                          <button
                            type="button"
                            title="Edit Question"
                            onClick={() => handleOpenEdit(q)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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

                          {/* Delete Icon */}
                          <button
                            type="button"
                            title="Delete Question"
                            onClick={() => { setDeleteErr(""); setDeleteTarget(q); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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

        {/* ── Comprehensive Detailed View Question Modal ────────────────────── */}
        <Modal open={!!viewQuestion} onClose={() => setViewQuestion(null)} title="Detailed Question Information" size="lg">
          {viewQuestion && (
            <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</span>
                <p className="text-base font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{viewQuestion.title}</p>
              </div>

              {viewQuestion.description && (
                <div>
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description / Body</span>
                  <div
                    className="p-3 rounded-lg text-sm mt-1 border whitespace-pre-wrap font-mono"
                    style={{ backgroundColor: "var(--surface2-color)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}
                  >
                    {viewQuestion.description}
                  </div>
                </div>
              )}

              {/* Grid properties */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface2-color)" }}>
                  <span className="text-xs text-[var(--text-muted)] block mb-1">Type</span>
                  <Badge variant="accent">{typeLabel(viewQuestion.type)}</Badge>
                </div>
                <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface2-color)" }}>
                  <span className="text-xs text-[var(--text-muted)] block mb-1">Difficulty</span>
                  {diffBadge(viewQuestion.difficulty)}
                </div>
                <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface2-color)" }}>
                  <span className="text-xs text-[var(--text-muted)] block">Marks</span>
                  <span className="text-base font-bold text-emerald-600">+{viewQuestion.marks}</span>
                </div>
                <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface2-color)" }}>
                  <span className="text-xs text-[var(--text-muted)] block">Negative Marks</span>
                  <span className="text-base font-bold text-red-500">-{viewQuestion.negativeMarks || 0}</span>
                </div>
              </div>

              {/* Tags */}
              {viewQuestion.tags && viewQuestion.tags.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewQuestion.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="neutral">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* MCQ & True/False Options */}
              {viewQuestion.options && viewQuestion.options.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Options & Answer Key</span>
                  <div className="space-y-2">
                    {viewQuestion.options.map((opt: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg text-sm flex items-center justify-between border"
                        style={{
                          borderColor: opt.isCorrect ? "#16a34a" : "var(--border-color)",
                          backgroundColor: opt.isCorrect ? "#f0fdf4" : "var(--surface2-color)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              opt.isCorrect ? "bg-emerald-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {opt.id ? opt.id.toUpperCase() : String.fromCharCode(65 + i)}
                          </span>
                          <span className="font-medium">{opt.text}</span>
                        </div>
                        {opt.isCorrect ? (
                          <Badge variant="success">✓ Correct Answer</Badge>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Incorrect</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fill in the Blank Correct Answer */}
              {viewQuestion.type === "fill_blank" && viewQuestion.correctTextAnswer && (
                <div>
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Fill Blank Answer Key</span>
                  <div className="p-3 rounded-lg border text-sm font-semibold bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
                    {viewQuestion.correctTextAnswer}
                  </div>
                </div>
              )}

              {/* Coding Configuration */}
              {viewQuestion.type === "coding" && viewQuestion.codeConfig && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Coding Details</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Language: <Badge variant="accent">{viewQuestion.codeConfig.language}</Badge></span>
                    <span style={{ color: "var(--text-muted)" }}>Disable Paste: {viewQuestion.codeConfig.disablePaste ? "Yes 🔒" : "No 🔓"}</span>
                  </div>
                  {viewQuestion.codeConfig.starterCode && (
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block mb-1">Starter Code Template</span>
                      <pre className="p-3 rounded-lg border text-xs font-mono overflow-x-auto" style={{ backgroundColor: "#0f172a", color: "#f8fafc", borderColor: "var(--border-color)" }}>
                        <code>{viewQuestion.codeConfig.starterCode}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-app-border">
                <Button variant="secondary" onClick={() => setViewQuestion(null)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Comprehensive Detailed Edit Question Modal ──────────────────────── */}
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Question Details" size="lg">
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <Input label="Question Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <Textarea label="Description / Question Body" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                options={[
                  { value: "mcq_single", label: "MCQ (Single Choice)" },
                  { value: "mcq_multi", label: "MCQ (Multiple Choice)" },
                  { value: "true_false", label: "True / False" },
                  { value: "fill_blank", label: "Fill in the Blank" },
                  { value: "text_area", label: "Subjective / Text Area" },
                  { value: "coding", label: "Coding Problem" },
                ]}
              />
              <Select
                label="Difficulty"
                value={editForm.difficulty}
                onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Marks (+)" type="number" value={editForm.marks} onChange={(e) => setEditForm({ ...editForm, marks: parseInt(e.target.value) || 1 })} />
              <Input label="Negative Marks (-)" type="number" value={editForm.negativeMarks} onChange={(e) => setEditForm({ ...editForm, negativeMarks: parseInt(e.target.value) || 0 })} />
            </div>

            <Input label="Tags (comma separated)" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="javascript, react, frontend" />

            {/* Options Editor for MCQ & True/False */}
            {["mcq_single", "mcq_multi", "true_false"].includes(editForm.type) && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-[var(--text-primary)]">
                  Edit Options & Correct Answers
                </label>
                <div className="space-y-2">
                  {editForm.options.map((opt, i) => (
                    <div key={opt.id || i} className="flex items-center gap-3">
                      <input
                        type={editForm.type === "mcq_multi" ? "checkbox" : "radio"}
                        name="correct_edit"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const updated = editForm.options.map((o, j) => ({
                            ...o,
                            isCorrect: editForm.type === "mcq_multi" ? (j === i ? !o.isCorrect : o.isCorrect) : j === i,
                          }));
                          setEditForm({ ...editForm, options: updated });
                        }}
                        className="w-4 h-4 accent-sky-600"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...editForm.options];
                          updated[i] = { ...updated[i], text: e.target.value };
                          setEditForm({ ...editForm, options: updated });
                        }}
                        placeholder={`Option ${opt.id ? opt.id.toUpperCase() : String.fromCharCode(65 + i)}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fill Blank Edit */}
            {editForm.type === "fill_blank" && (
              <Input
                label="Correct Answer Key"
                value={editForm.correctTextAnswer}
                onChange={(e) => setEditForm({ ...editForm, correctTextAnswer: e.target.value })}
                placeholder="Enter exact correct text..."
              />
            )}

            {/* Coding Config Edit */}
            {editForm.type === "coding" && (
              <div className="space-y-4 pt-2">
                <Select
                  label="Programming Language"
                  value={editForm.codeLanguage}
                  onChange={(e) => setEditForm({ ...editForm, codeLanguage: e.target.value })}
                  options={[
                    { value: "javascript", label: "JavaScript" },
                    { value: "python", label: "Python" },
                    { value: "java", label: "Java" },
                    { value: "cpp", label: "C++" },
                    { value: "typescript", label: "TypeScript" },
                  ]}
                />
                <Textarea
                  label="Starter Code Template"
                  value={editForm.starterCode}
                  onChange={(e) => setEditForm({ ...editForm, starterCode: e.target.value })}
                  placeholder="// Starter code template..."
                  rows={4}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editDisablePaste"
                    checked={editForm.disablePaste}
                    onChange={(e) => setEditForm({ ...editForm, disablePaste: e.target.checked })}
                    className="w-4 h-4 accent-sky-600"
                  />
                  <label htmlFor="editDisablePaste" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                    Disable Paste in Code Editor during exam
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-app-border">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updating} disabled={!editForm.title}>
              Save Question Changes
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeleteErr(""); }} title="Delete Question" size="sm">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <TrashIcon />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Are you sure you want to delete <span className="font-bold">{deleteTarget?.title}</span>?
            </p>
            <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
            {deleteErr && <p className="text-xs text-red-600 font-medium">{deleteErr}</p>}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => { setDeleteTarget(null); setDeleteErr(""); }}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteConfirm}>Yes, Delete</Button>
          </div>
        </Modal>

        {/* Add Question Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Question" size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter question title" />
            <Textarea label="Description / Question Body" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full question text..." />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={[
                  { value: "mcq_single", label: "MCQ (Single)" },
                  { value: "mcq_multi", label: "MCQ (Multiple)" },
                  { value: "true_false", label: "True/False" },
                  { value: "fill_blank", label: "Fill in the Blank" },
                  { value: "text_area", label: "Text Area" },
                  { value: "coding", label: "Coding" },
                ]}
              />
              <Select
                label="Difficulty"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Marks" type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 1 })} />
              <Input label="Negative Marks" type="number" value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: parseInt(e.target.value) || 0 })} />
            </div>

            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="javascript, react, frontend" />

            {["mcq_single", "mcq_multi", "true_false"].includes(form.type) && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Options</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type={form.type === "mcq_multi" ? "checkbox" : "radio"}
                        name="correct"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const newOpts = form.options.map((o, j) => ({
                            ...o,
                            isCorrect: form.type === "mcq_multi" ? (j === i ? !o.isCorrect : o.isCorrect) : j === i,
                          }));
                          setForm({ ...form, options: newOpts });
                        }}
                        className="accent-accent"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...form.options];
                          newOpts[i] = { ...newOpts[i], text: e.target.value };
                          setForm({ ...form, options: newOpts });
                        }}
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-app-border">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.title}>Create Question</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
