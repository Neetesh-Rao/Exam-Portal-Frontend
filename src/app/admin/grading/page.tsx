"use client";

import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { CheckCircle2, BookOpen } from "lucide-react";
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
    status: s.status,
    submittedAt: s.submittedAt,
  }));

  const handleGrade = async () => {
    if (!selectedSub) return;
    try {
      await gradeSub({ id: selectedSub.id, manualScore: manualScoreInput }).unwrap();
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
            <div className="lg:col-span-2 space-y-4">
              <Card className="!p-0 overflow-hidden">
                <div className="p-4 bg-app-bg-subtle dark:bg-dark-surface border-b border-app-border dark:border-dark-border font-semibold text-sm flex items-center justify-between text-[var(--text-primary)]">
                  <span>Candidate Submissions ({submissions.length})</span>
                </div>
                <div className="divide-y divide-app-border dark:divide-dark-border">
                  {submissions.map((sub) => {
                    const isSelected = selectedSub?.id === sub.id;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSub(sub);
                          setManualScoreInput(sub.manualScore);
                        }}
                        className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? "bg-app-bg-subtle dark:bg-dark-surface border-l-4 border-l-black dark:border-l-white" : "hover:bg-app-bg-subtle dark:hover:bg-dark-surface"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[var(--text-primary)] text-base">{sub.candidateName}</h4>
                            <Badge variant={sub.status === "graded" ? "neutral" : "accent"}>
                              {sub.status ? sub.status.replace("_", " ") : "N/A"}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">{sub.candidateEmail} • {sub.testTitle}</p>
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-sm font-bold text-[var(--text-primary)]">Score: {sub.finalScore}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Auto: {sub.autoScore} | Manual: {sub.manualScore}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              {selectedSub ? (
                <Card className="space-y-6">
                  <div className="border-b border-app-border dark:border-dark-border pb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Grade Assessment</h3>
                    <p className="text-xs text-[var(--text-muted)]">{selectedSub.candidateName} ({selectedSub.testTitle})</p>
                  </div>

                  <div className="space-y-3 bg-app-bg-subtle dark:bg-dark-surface p-4 rounded-xl border border-app-border dark:border-dark-border text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Auto-Evaluated Score:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedSub.autoScore} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Current Manual Score:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedSub.manualScore} pts</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Assign Additional Manual Marks
                      </label>
                      <Input
                        type="number"
                        value={manualScoreInput}
                        onChange={(e) => setManualScoreInput(Number(e.target.value))}
                        placeholder="Enter manual marks"
                      />
                    </div>

                    <Button
                      onClick={handleGrade}
                      loading={grading}
                      className="w-full"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save & Finalize Score
                    </Button>
                  </div>
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
