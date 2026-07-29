"use client";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string | number;
  _id?: string;
  category?: string;
  title: string;
  description?: string;
  options?: QuestionOption[];
  correctTextAnswer?: string;
  codeConfig?: {
    language?: string;
    starterCode?: string;
    disablePaste?: boolean;
  };
  type: string;
  difficulty: string;
  marks: number;
  negativeMarks?: number;
  tags?: string[];
}

interface CategoryQuestionPickerProps {
  questions: Question[];
  selectedQuestionIds: string[];
  onToggleQuestion: (qid: string) => void;
  onSelectAllCategory: (catName: string) => void;
}

export default function CategoryQuestionPicker({
  questions,
  selectedQuestionIds,
  onToggleQuestion,
  onSelectAllCategory,
}: CategoryQuestionPickerProps) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [modalQuestion, setModalQuestion] = useState<Question | null>(null);

  const getQId = (q: Question): string => (q.id || q._id)?.toString() || "";

  const toggleExpand = (qid: string) => {
    setExpandedIds((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = questions.every((q) => expandedIds[getQId(q)]);
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      questions.forEach((q) => {
        next[getQId(q)] = true;
      });
      setExpandedIds(next);
    }
  };

  const diffBadge = (d: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = {
      easy: "success",
      medium: "warning",
      hard: "danger",
    };
    return <Badge variant={map[d] || "neutral"}>{d}</Badge>;
  };

  const typeBadge = (t: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      coding: { label: "💻 Coding", cls: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
      mcq_single: { label: "🔘 MCQ (Single)", cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
      mcq_multi: { label: "☑️ MCQ (Multi)", cls: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
      text_area: { label: "📝 Text / Essay", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
      fill_blank: { label: "✏️ Fill Blanks", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
      true_false: { label: "⚖️ True / False", cls: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
    };
    const info = map[t] || { label: t.replace("_", " "), cls: "bg-slate-500/10 text-slate-600 border-slate-500/20" };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${info.cls}`}>
        {info.label}
      </span>
    );
  };

  // Category counts list
  const categoryCounts = questions.reduce<Record<string, number>>((acc, q) => {
    const cat = q.category || "General";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoriesList = ["All", ...Object.keys(categoryCounts).sort()];

  // Questions filtered by active Category (to calculate Question Type breakdown for that Category)
  const categoryFilteredQuestions = questions.filter((q) => {
    if (categoryFilter !== "All" && (q.category || "General") !== categoryFilter) {
      return false;
    }
    return true;
  });

  // Question Type counts for active Category
  const typeCounts = categoryFilteredQuestions.reduce<Record<string, number>>((acc, q) => {
    const t = q.type || "mcq_single";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    All: "All Question Types",
    coding: "💻 Coding / Code Editor",
    mcq_single: "🔘 MCQ Single Choice",
    mcq_multi: "☑️ MCQ Multiple Choice",
    text_area: "📝 Text Area / Descriptive",
    fill_blank: "✏️ Fill in the Blanks",
    true_false: "⚖️ True / False",
  };

  // Filtered questions based on Category, Question Type & Search Query
  const filteredQuestions = questions.filter((q) => {
    if (categoryFilter !== "All" && (q.category || "General") !== categoryFilter) {
      return false;
    }
    if (typeFilter !== "All" && (q.type || "mcq_single") !== typeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(term);
      const matchDesc = q.description?.toLowerCase().includes(term);
      const matchTags = q.tags?.some((t) => t.toLowerCase().includes(term));
      const matchCategory = q.category?.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchTags || matchCategory;
    }
    return true;
  });

  // Group questions by Category
  const groupedMap = new Map<string, Question[]>();
  for (const q of filteredQuestions) {
    const cat = q.category || "General";
    if (!groupedMap.has(cat)) groupedMap.set(cat, []);
    groupedMap.get(cat)!.push(q);
  }

  const isAllExpanded = questions.length > 0 && filteredQuestions.every((q) => expandedIds[getQId(q)]);

  // Total Selection Metrics
  const totalSelectedCount = selectedQuestionIds.length;
  const totalUnselectedCount = Math.max(0, questions.length - totalSelectedCount);

  // Selection metrics within current filtered view
  const filteredSelectedCount = filteredQuestions.filter((q) => selectedQuestionIds.includes(getQId(q))).length;
  const filteredUnselectedCount = filteredQuestions.length - filteredSelectedCount;

  return (
    <div className="space-y-4">
      {/* Live Selection Status Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border bg-slate-900 text-white shadow-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>✓ Selected for Test: {totalSelectedCount}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>⭕ Unselected: {totalUnselectedCount}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
            <span>Total Question Bank: {questions.length}</span>
          </div>
        </div>

        {(categoryFilter !== "All" || typeFilter !== "All" || searchQuery) && (
          <div className="text-xs text-sky-300 font-mono font-semibold">
            Filtered View: {filteredSelectedCount} selected / {filteredUnselectedCount} unselected
          </div>
        )}
      </div>

      {/* Optimized Filter Controls Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-2xl border bg-[var(--surface-color)] shadow-xs" style={{ borderColor: "var(--border-color)" }}>
        {/* Search Input */}
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
            Search Questions
          </label>
          <Input
            placeholder="🔍 Search title, description or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Selector Dropdown with Selected/Unselected Counts */}
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
            Category Series ({categoriesList.length - 1} categories)
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setTypeFilter("All");
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none cursor-pointer transition-all focus:border-sky-500"
            style={{
              backgroundColor: "var(--surface2-color)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            <option value="All">📁 All Categories ({totalSelectedCount} selected / {totalUnselectedCount} unselected)</option>
            {Object.entries(categoryCounts).map(([cat, totalCount]) => {
              const catQIds = questions.filter((q) => (q.category || "General") === cat).map(getQId);
              const selCount = catQIds.filter((id) => selectedQuestionIds.includes(id)).length;
              const unselCount = totalCount - selCount;

              return (
                <option key={cat} value={cat}>
                  📂 {cat} ({selCount} selected / {unselCount} unselected)
                </option>
              );
            })}
          </select>
        </div>

        {/* Question Type Selector Dropdown */}
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
            Question Type {categoryFilter !== "All" ? `(in ${categoryFilter})` : ""}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none cursor-pointer transition-all focus:border-sky-500"
            style={{
              backgroundColor: "var(--surface2-color)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            <option value="All">✨ All Types ({categoryFilteredQuestions.length} questions)</option>
            {Object.entries(typeCounts).map(([t, count]) => (
              <option key={t} value={t}>
                {typeLabels[t] || t.replace("_", " ")} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[var(--text-muted)] font-medium">Showing {filteredQuestions.length} of {questions.length} questions</span>
          {categoryFilter !== "All" && (
            <Badge variant="accent" className="flex items-center gap-1">
              <span>Category: {categoryFilter} ({categoryFilteredQuestions.length})</span>
              <button type="button" onClick={() => setCategoryFilter("All")} className="hover:text-white font-bold ml-1 cursor-pointer">✕</button>
            </Badge>
          )}
          {typeFilter !== "All" && (
            <Badge variant="neutral" className="flex items-center gap-1 bg-sky-500/10 text-sky-600 border-sky-500/20">
              <span>Type: {typeLabels[typeFilter] || typeFilter}</span>
              <button type="button" onClick={() => setTypeFilter("All")} className="hover:text-sky-900 font-bold ml-1 cursor-pointer">✕</button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="neutral" className="flex items-center gap-1">
              <span>Search: "{searchQuery}"</span>
              <button type="button" onClick={() => setSearchQuery("")} className="hover:text-slate-900 font-bold ml-1 cursor-pointer">✕</button>
            </Badge>
          )}
          {(categoryFilter !== "All" || typeFilter !== "All" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("All");
                setTypeFilter("All");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer ml-1"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={toggleExpandAll}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer bg-[var(--surface-color)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--surface2-color)]"
        >
          {isAllExpanded ? "Collapse All Descriptions ▲" : "Expand All Descriptions ▼"}
        </button>
      </div>

      {/* Question Bank List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-10 text-sm text-[var(--text-muted)] border rounded-xl p-6 bg-[var(--surface-color)]" style={{ borderColor: "var(--border-color)" }}>
          {questions.length === 0 ? (
            <>
              No questions in bank.{" "}
              <a href="/admin/questions" className="text-sky-500 underline font-medium">
                Add questions to bank first →
              </a>
            </>
          ) : (
            "No questions match your current search or category filter."
          )}
        </div>
      ) : (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1 pt-2">
          {Array.from(groupedMap.entries()).map(([catName, catQuestions]) => {
            const catQIds = catQuestions.map(getQId);
            const catSelCount = catQIds.filter((id) => selectedQuestionIds.includes(id)).length;
            const catUnselCount = catQuestions.length - catSelCount;
            const allSelected = catQIds.length > 0 && catSelCount === catQIds.length;

            return (
              <div
                key={catName}
                className="space-y-3 p-4 rounded-xl border"
                style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{catName} Series</h4>
                    <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      ✓ {catSelCount} Selected
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      ⭕ {catUnselCount} Unselected
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectAllCategory(catName)}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    {allSelected ? "✓ Deselect All Category Questions" : "+ Select All Category Questions"}
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                  {catQuestions.map((q) => {
                    const qid = getQId(q);
                    const isChecked = selectedQuestionIds.includes(qid);
                    const isExpanded = !!expandedIds[qid];

                    return (
                      <div
                        key={qid}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isChecked
                            ? "border-sky-500/80 bg-sky-500/5 shadow-sm"
                            : "border-app-border dark:border-dark-border hover:border-sky-400 bg-[var(--surface-color)]"
                        }`}
                      >
                        {/* Top Header Row */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleQuestion(qid)}
                            className="mt-1 w-4 h-4 accent-sky-600 rounded cursor-pointer shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h5
                                  onClick={() => toggleExpand(qid)}
                                  className="text-sm font-bold text-[var(--text-primary)] cursor-pointer hover:text-sky-600 transition-colors leading-tight"
                                >
                                  {q.title}
                                </h5>

                                {/* Description Preview (2-line truncated) */}
                                {q.description ? (
                                  <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed font-normal">
                                    {q.description}
                                  </p>
                                ) : q.options && q.options.length > 0 ? (
                                  <p className="text-xs text-[var(--text-muted)] mt-1.5 truncate italic">
                                    Options ({q.options.length}): {q.options.map((o) => o.text).filter(Boolean).join(" • ")}
                                  </p>
                                ) : (
                                  <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">
                                    No detailed description provided
                                  </p>
                                )}
                              </div>

                              {/* View Details Expand Button */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(qid)}
                                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 cursor-pointer transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Hide</span>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
                                    </>
                                  ) : (
                                    <>
                                      <span>👁 Details</span>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Badges Bar */}
                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                              {typeBadge(q.type || "mcq_single")}
                              {diffBadge(q.difficulty)}
                              <span className="text-xs text-[var(--text-muted)] font-medium">{q.marks} marks</span>
                              {q.negativeMarks ? (
                                <span className="text-xs text-rose-500 font-medium">(-{q.negativeMarks} negative)</span>
                              ) : null}
                              {q.tags && q.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {q.tags.map((t, idx) => (
                                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Full Question Section */}
                        {isExpanded && (
                          <div
                            className="mt-4 pt-3.5 border-t text-xs space-y-3.5"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            {/* Full Question Text */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                  Full Question Description:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setModalQuestion(q)}
                                  className="text-[11px] font-semibold text-sky-600 hover:underline cursor-pointer"
                                >
                                  Open in Popup ↗
                                </button>
                              </div>
                              <div className="p-3 rounded-lg bg-[var(--surface2-color)] border border-app-border dark:border-dark-border text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed font-sans text-xs">
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
                                  {q.options.map((opt, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    return (
                                      <div
                                        key={opt.id || idx}
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
                                            ✓ Correct
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

                            {/* Action Button */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => onToggleQuestion(qid)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isChecked
                                    ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-200 dark:border-rose-900"
                                    : "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                                }`}
                              >
                                {isChecked ? (
                                  <>
                                    <span>✕ Remove from Test</span>
                                  </>
                                ) : (
                                  <>
                                    <span>+ Add to Test</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Popup for Full Question View */}
      {modalQuestion && (
        <Modal
          open={!!modalQuestion}
          onClose={() => setModalQuestion(null)}
          title={`Question Details: ${modalQuestion.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs text-[var(--text-primary)]">
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
              <Badge variant="accent">{modalQuestion.category || "General"}</Badge>
              <Badge variant="neutral">{modalQuestion.type ? modalQuestion.type.replace("_", " ") : "mcq"}</Badge>
              {diffBadge(modalQuestion.difficulty)}
              <span className="font-semibold text-[var(--text-muted)]">{modalQuestion.marks} marks</span>
              {modalQuestion.negativeMarks ? (
                <span className="text-rose-500">(-{modalQuestion.negativeMarks} neg)</span>
              ) : null}
            </div>

            <div>
              <h4 className="text-sm font-bold mb-2">Description / Statement:</h4>
              <div className="p-4 rounded-xl bg-[var(--surface2-color)] border border-app-border dark:border-dark-border text-sm whitespace-pre-wrap leading-relaxed">
                {modalQuestion.description || modalQuestion.title}
              </div>
            </div>

            {modalQuestion.options && modalQuestion.options.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-2">Options:</h4>
                <div className="space-y-2">
                  {modalQuestion.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={opt.id || idx}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-sm ${
                          opt.isCorrect
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                            : "bg-[var(--surface2-color)] border-app-border dark:border-dark-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              opt.isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {opt.isCorrect && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500 text-white">
                            ✓ Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {modalQuestion.codeConfig?.starterCode && (
              <div>
                <h4 className="text-sm font-bold mb-2">Starter Code ({modalQuestion.codeConfig.language || "code"}):</h4>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
                  <code>{modalQuestion.codeConfig.starterCode}</code>
                </pre>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
              <button
                type="button"
                onClick={() => {
                  const qid = getQId(modalQuestion);
                  onToggleQuestion(qid);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedQuestionIds.includes(getQId(modalQuestion))
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                {selectedQuestionIds.includes(getQId(modalQuestion))
                  ? "✕ Remove from Test"
                  : "+ Add Question to Test"}
              </button>
              <button
                type="button"
                onClick={() => setModalQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface2-color)] hover:bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-primary)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
