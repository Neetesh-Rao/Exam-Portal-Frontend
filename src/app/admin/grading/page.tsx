"use client";

import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { CheckCircle2, BookOpen, AlertCircle } from "lucide-react";
import { useGetSubmissionsQuery, useGradeSubmissionMutation } from "@/redux/api/submissionsApi";

export default function GradingQueuePage() {
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [manualScoreInput, setManualScoreInput] = useState<number>(0);

  const { data, isLoading: loading } = useGetSubmissionsQuery(undefined);
  const [gradeSub, { isLoading: grading }] = useGradeSubmissionMutation();

  const submissions: any[] = (data?.submissions || []).map((s: any) => ({
    id: s.id || s._id,
    candidateName: s.candidate?.name || "Candidate",
    candidateEmail: s.candidate?.email || "candidate@email.com",
    testTitle: s.test?.title || "Assessment",
    autoScore: s.autoScore || 0,
    manualScore: s.manualScore || 0,
    finalScore: s.finalScore || s.autoScore || 0,
    totalMarks: s.totalMarks || 100,
    status: s.status,
    submittedAt: s.submittedAt,
  }));

  const totalMarks = selectedSub?.totalMarks || 100;
  // Final score preview: cannot exceed totalMarks, cannot be less than 0
  const previewFinal = Math.min(totalMarks, Math.max(0, (selectedSub?.autoScore || 0) + manualScoreInput));
  const isOverLimit = (selectedSub?.autoScore || 0) + manualScoreInput > totalMarks;

  const handleGrade = async () => {
    if (!selectedSub) return;
    // Clamp before sending: manual score should not push final above totalMarks
    const maxManual = Math.max(0, totalMarks - (selectedSub.autoScore || 0));
    const validManual = Math.min(maxManual, Math.max(0, manualScoreInput));
    try {
      await gradeSub({ id: selectedSub.id, manualScore: validManual }).unwrap();
      setSelectedSub(null);
    } catch (e) {
      console.error("Grading failed", e);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Grading & Evaluation Queue"
        subtitle="Review code answers, subjective responses, and assign final marks"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {loading ? (
          <Card>
            <TableSkeleton />
          </Card>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-12">
            <EmptyState
              title="No submissions pending evaluation"
              description="Candidate test submissions requiring manual review or grading will appear here."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submissions List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="!p-0 overflow-hidden">
                <div
                  className="p-4 border-b font-semibold text-sm flex items-center justify-between"
                  style={{ backgroundColor: "var(--surface2-color)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}
                >
                  <span>Candidate Submissions ({submissions.length})</span>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                  {submissions.map((sub) => {
                    const isSelected = selectedSub?.id === sub.id;
                    const pct = sub.totalMarks > 0 ? Math.round((sub.finalScore / sub.totalMarks) * 100) : 0;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSub(sub);
                          setManualScoreInput(sub.manualScore);
                        }}
                        className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? "border-l-4 border-l-sky-600" : ""}`}
                        style={{ backgroundColor: isSelected ? "var(--surface2-color)" : "transparent" }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface2-color)"; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>{sub.candidateName}</h4>
                            <Badge variant={sub.status === "graded" ? "neutral" : "accent"}>
                              {sub.status ? sub.status.replace("_", " ") : "N/A"}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">{sub.candidateEmail} • {sub.testTitle}</p>
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {sub.finalScore} <span className="font-normal text-[var(--text-muted)]">/ {sub.totalMarks}</span>
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{pct}% • Auto: {sub.autoScore} | Manual: {sub.manualScore}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Grading Panel */}
            <div className="lg:col-span-1">
              {selectedSub ? (
                <Card className="space-y-5">
                  <div className="border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Grade Assessment</h3>
                    <p className="text-xs text-[var(--text-muted)]">{selectedSub.candidateName} — {selectedSub.testTitle}</p>
                  </div>

                  {/* Score Summary */}
                  <div className="space-y-2 p-4 rounded-xl border text-sm" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Test Total Marks:</span>
                      <span className="font-bold text-sky-600">{totalMarks} Marks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Auto-Graded Score:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedSub.autoScore} pts</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-1" style={{ borderColor: "var(--border-color)" }}>
                      <span className="text-[var(--text-muted)]">Remaining for Manual:</span>
                      <span className="font-bold text-emerald-600">
                        {Math.max(0, totalMarks - (selectedSub.autoScore || 0))} pts max
                      </span>
                    </div>
                  </div>

                  {/* Manual Marks Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Manual Bonus Marks
                      <span className="ml-2 text-sky-600 normal-case font-normal">(0 to {Math.max(0, totalMarks - (selectedSub.autoScore || 0))})</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, totalMarks - (selectedSub.autoScore || 0))}
                      value={manualScoreInput}
                      onChange={(e) => {
                        const maxAllowed = Math.max(0, totalMarks - (selectedSub.autoScore || 0));
                        // Hard-clamp: never allow value above max or below 0
                        const val = Math.min(maxAllowed, Math.max(0, Number(e.target.value)));
                        setManualScoreInput(val);
                      }}
                      className="w-full p-3 rounded-xl border text-lg font-extrabold outline-none transition-all text-center"
                      style={{
                        backgroundColor: "var(--surface2-color)",
                        borderColor: isOverLimit ? "#ef4444" : "var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    />

                    {isOverLimit && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Total cannot exceed {totalMarks} marks
                      </p>
                    )}
                  </div>

                  {/* Final Score Preview */}
                  <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: previewFinal >= totalMarks * 0.5 ? "#ecfdf5" : "#fef2f2", borderColor: previewFinal >= totalMarks * 0.5 ? "#10b981" : "#ef4444" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: previewFinal >= totalMarks * 0.5 ? "#059669" : "#dc2626" }}>
                      Final Score Preview
                    </p>
                    <p className="text-3xl font-extrabold" style={{ color: previewFinal >= totalMarks * 0.5 ? "#059669" : "#dc2626" }}>
                      {previewFinal} <span className="text-base font-bold opacity-60">/ {totalMarks}</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: previewFinal >= totalMarks * 0.5 ? "#059669" : "#dc2626" }}>
                      {totalMarks > 0 ? Math.round((previewFinal / totalMarks) * 100) : 0}%
                    </p>
                  </div>

                  <Button
                    onClick={handleGrade}
                    loading={grading}
                    className="w-full"
                    disabled={isOverLimit}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save & Finalize Grade
                  </Button>
                </Card>
              ) : (
                <Card className="text-center py-16 text-[var(--text-muted)]">
                  <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Select a submission from the queue to start grading</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
