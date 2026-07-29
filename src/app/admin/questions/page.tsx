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

const PRESET_CATEGORIES = [
  "React",
  "Node.js",
  "Aptitude",
  "Python",
  "JavaScript",
  "Core CS & Fundamentals",
  "Data Structures",
  "DBMS",
  "General Reasoning",
  "General",
];

export default function QuestionsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<any | null>(null);

  // Detailed Edit State
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    category: "General",
    customCategory: "",
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

  // Extract all categories dynamically (preset + created custom categories in DB)
  const availableCategories = Array.from(
    new Set([
      ...PRESET_CATEGORIES,
      ...(data?.categories || []),
      ...questions.map((q) => q.category).filter(Boolean),
    ])
  ).filter(Boolean);

  // Extract categories that actually exist in the database for pill filters
  const activeCategories = Array.from(
    new Set(questions.map((q) => q.category || "General").filter(Boolean))
  );

  const filtered = questions.filter((q) => {
    if (categoryFilter !== "All" && (q.category || "General") !== categoryFilter) return false;
    if (typeFilter && q.type !== typeFilter) return false;
    if (diffFilter && q.difficulty !== diffFilter) return false;
    return true;
  });

  // Create Form State
  const [form, setForm] = useState({
    category: "React",
    customCategory: "",
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
    const finalCategory = form.category === "Custom" ? form.customCategory || "General" : form.category;
    const payload: Record<string, unknown> = {
      category: finalCategory,
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
        category: "React", customCategory: "", title: "", description: "", type: "mcq_single", difficulty: "medium", marks: 1, negativeMarks: 0,
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
    const cat = q.category || "General";
    const isKnownCat = availableCategories.includes(cat);

    setEditTarget({ id: qid, ...q });
    setEditForm({
      category: isKnownCat ? cat : "Custom",
      customCategory: isKnownCat ? "" : cat,
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

    const finalCategory = editForm.category === "Custom" ? editForm.customCategory || "General" : editForm.category;

    const payload: Record<string, unknown> = {
      category: finalCategory,
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
      payload.codeConfig = { language: editForm.codeLanguage, starterCode: editForm.starterCode, disablePaste: editForm.disablePaste };
    }

    try {
      await updateQuestion({ id: editTarget.id, ...payload }).unwrap();
      setEditTarget(null);
    } catch (err) {
      console.error("Update question error:", err);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleteErr("");
    const targetId = deleteTarget.id || deleteTarget._id;
    try {
      await removeQuestion(targetId).unwrap();
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteErr(err?.data?.error || err?.message || "Failed to delete question.");
    }
  };

  const diffBadge = (d: string) => {
    if (d === "easy") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Easy
        </span>
      );
    }
    if (d === "hard") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Hard
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Medium
      </span>
    );
  };

  return (
    <div>
      <AdminHeader
        title="Question Bank & Series"
        subtitle="Manage questions categorized by React, Aptitude, Python, Node.js, and CS topics"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Unified Modern Toolbar & Filter Card */}
        <Card className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Search question title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: "All", label: `📁 All Categories (${questions.length} questions)` },
                  ...availableCategories.map((c) => {
                    const count = questions.filter((q) => (q.category || "General") === c).length;
                    return { value: c, label: `📂 ${c} (${count})` };
                  }),
                ]}
              />

              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: "", label: "✨ All Question Types" },
                  { value: "coding", label: `💻 Coding (${questions.filter((q) => q.type === "coding").length})` },
                  { value: "mcq_single", label: `🔘 Single Choice (${questions.filter((q) => q.type === "mcq_single").length})` },
                  { value: "mcq_multi", label: `☑️ Multiple Choice (${questions.filter((q) => q.type === "mcq_multi").length})` },
                  { value: "text_area", label: `📝 Text Area (${questions.filter((q) => q.type === "text_area").length})` },
                  { value: "fill_blank", label: `✏️ Fill Blanks (${questions.filter((q) => q.type === "fill_blank").length})` },
                  { value: "true_false", label: `⚖️ True / False (${questions.filter((q) => q.type === "true_false").length})` },
                ]}
              />

              <Select
                value={diffFilter}
                onChange={(e) => setDiffFilter(e.target.value)}
                options={[
                  { value: "", label: "All Difficulties" },
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />

              <Button onClick={() => setShowCreate(true)} className="shadow-sm">
                + Create Question
              </Button>
            </div>
          </div>

          {/* Active Category Filter Chips Bar */}
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap" style={{ borderColor: "var(--border-color)" }}>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
              Active Topics:
            </span>
            <button
              onClick={() => setCategoryFilter("All")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === "All"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-[var(--surface2-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border"
              }`}
              style={{ borderColor: "var(--border-color)" }}
            >
              All ({questions.length})
            </button>

            {activeCategories.map((cat) => {
              const count = questions.filter((q) => (q.category || "General") === cat).length;
              const isActive = categoryFilter === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-[var(--surface2-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border"
                  }`}
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-sky-500/10 text-sky-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Clean Theme-Matched Questions Table */}
        {loading ? (
          <Card><TableSkeleton rows={5} /></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title="No questions found"
              description="No questions match your current search or category filter criteria."
              actionLabel="Create First Question"
              onAction={() => setShowCreate(true)}
            />
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--surface2-color)",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Question Details
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Category Series
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Type
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Difficulty
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Marks
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-right" style={{ color: "var(--text-muted)" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                  {filtered.map((q) => {
                    const qid = q.id || q._id;
                    return (
                      <tr
                        key={qid}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--border-color)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--surface2-color)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""; }}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sm line-clamp-1" style={{ color: "var(--text-primary)" }}>{q.title}</p>
                          {q.description && <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-muted)" }}>{q.description}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                            {q.category || "General"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="neutral">{q.type ? q.type.replace(/_/g, " ") : "MCQ"}</Badge>
                        </td>
                        <td className="px-5 py-4">{diffBadge(q.difficulty)}</td>
                        <td className="px-5 py-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{q.marks} pts</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewQuestion(q)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-sky-600 hover:bg-sky-500/10 transition-colors cursor-pointer"
                              title="View Question"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(q)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Edit Question"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(q)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Question"
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
      </div>

      {/* CREATE QUESTION MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Question (Category Series)">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Select
            label="Question Category / Topic Series"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              ...availableCategories.map((c) => ({ value: c, label: c })),
              { value: "Custom", label: "+ Add Custom Category..." },
            ]}
          />

          {form.category === "Custom" && (
            <Input
              label="New Custom Category Name"
              placeholder="e.g. Next.js, CyberSecurity, DevOps..."
              value={form.customCategory}
              onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
            />
          )}

          <Input
            label="Question Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Explain the useMemo hook in React..."
          />

          <Textarea
            label="Detailed Description / Problem Statement"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional context or instructions for candidate..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: "mcq_single", label: "Single Choice MCQ" },
                { value: "mcq_multi", label: "Multiple Choice MCQ" },
                { value: "coding", label: "Coding Monaco Editor" },
                { value: "fill_blank", label: "Fill in Blanks" },
                { value: "true_false", label: "True / False" },
                { value: "text_area", label: "Text Area Response" },
              ]}
            />
            <Select
              label="Difficulty *"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              options={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marks / Score"
              type="number"
              value={form.marks}
              onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
            />
            <Input
              label="Negative Marks"
              type="number"
              value={form.negativeMarks}
              onChange={(e) => setForm({ ...form, negativeMarks: Number(e.target.value) })}
            />
          </div>

          {/* MCQ Options */}
          {["mcq_single", "mcq_multi", "true_false"].includes(form.type) && (
            <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">MCQ Options Configuration</p>
              {form.options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={(e) => {
                      const updated = [...form.options];
                      updated[idx].isCorrect = e.target.checked;
                      setForm({ ...form, options: updated });
                    }}
                    className="accent-sky-600"
                  />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...form.options];
                      updated[idx].text = e.target.value;
                      setForm({ ...form, options: updated });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Coding Monaco Config */}
          {form.type === "coding" && (
            <div className="space-y-3 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
              <Select
                label="Programming Language"
                value={form.codeLanguage}
                onChange={(e) => setForm({ ...form, codeLanguage: e.target.value })}
                options={[
                  { value: "javascript", label: "JavaScript (Node.js)" },
                  { value: "typescript", label: "TypeScript" },
                  { value: "python", label: "Python 3" },
                  { value: "java", label: "Java" },
                  { value: "cpp", label: "C++" },
                ]}
              />
              <Textarea
                label="Starter Code Template"
                value={form.starterCode}
                onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
                rows={4}
                placeholder="function solution() {\n  // write code here\n}"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title}>
              {saving ? "Creating..." : "Save Question"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT QUESTION MODAL */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Question">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Select
            label="Question Category"
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            options={[
              ...availableCategories.map((c) => ({ value: c, label: c })),
              { value: "Custom", label: "+ Add Custom Category..." },
            ]}
          />

          {editForm.category === "Custom" && (
            <Input
              label="New Custom Category Name"
              placeholder="e.g. Next.js, CyberSecurity, DevOps..."
              value={editForm.customCategory}
              onChange={(e) => setEditForm({ ...editForm, customCategory: e.target.value })}
            />
          )}
          <Input
            label="Question Title *"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updating || !editForm.title}>
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW QUESTION MODAL */}
      <Modal open={!!viewQuestion} onClose={() => setViewQuestion(null)} title="Question Preview">
        {viewQuestion && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{viewQuestion.type?.replace("_", " ")}</Badge>
              <Badge variant="accent">{viewQuestion.category || "General"}</Badge>
              <span className="text-xs text-[var(--text-muted)]">{viewQuestion.marks} marks</span>
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">{viewQuestion.title}</h4>
            {viewQuestion.description && <p className="text-xs text-[var(--text-muted)] leading-relaxed">{viewQuestion.description}</p>}
            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setViewQuestion(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Question">
        <p className="text-sm text-[var(--text-muted)]">Are you sure you want to delete this question? This action cannot be undone.</p>
        {deleteErr && <p className="text-xs text-red-500 font-semibold mt-2">{deleteErr}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirmed} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Question"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
