"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Stepper from "@/components/ui/Stepper";

import CategoryQuestionPicker, { Question } from "@/components/admin/CategoryQuestionPicker";

const steps = ["Basic Info", "Add Questions by Category", "Proctoring", "Timing & Scoring", "Review"];

export default function NewTestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [totalDuration, setTotalDuration] = useState(60);
  const [passPercentage, setPassPercentage] = useState(50);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [fullScreenRequired, setFullScreenRequired] = useState(true);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [disableRightClick, setDisableRightClick] = useState(true);

  useEffect(() => {
    import("@/lib/apiFetch").then(({ apiFetch }) => {
      apiFetch("/questions").then((r) => r.json()).then((d) => setQuestions(d.questions || []));
    });
  }, []);

  const getQId = (q: Question): string => (q.id || q._id)?.toString() || "";

  // Auto-computed total marks from selected questions
  const totalMarks = selectedQuestionIds.reduce((sum, qid) => {
    const q = questions.find((q) => getQId(q) === qid);
    return sum + ((q as any)?.marks || 1);
  }, 0);

  const toggleQuestion = (idStr: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(idStr) ? prev.filter((qid) => qid !== idStr) : [...prev, idStr]
    );
  };

  // Select all questions in a category
  const selectAllCategory = (catName: string) => {
    const catQIds = questions
      .filter((q) => (q.category || "General") === catName)
      .map(getQId);
    
    const allSelected = catQIds.every((qid) => selectedQuestionIds.includes(qid));

    if (allSelected) {
      // Unselect category
      setSelectedQuestionIds((prev) => prev.filter((id) => !catQIds.includes(id)));
    } else {
      // Select category
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...catQIds])));
    }
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    const { apiFetch } = await import("@/lib/apiFetch");
    const res = await apiFetch("/tests", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        sections: [{ title: "Section 1", questionIds: selectedQuestionIds, timeLimitSeconds: totalDuration * 60, randomizeQuestions: false }],
        totalDurationSeconds: totalDuration * 60,
        totalMarks,
        passPercentage,
        proctoringConfig: {
          tabSwitchLimit,
          fullScreenRequired,
          webcamRequired: false,
          disableCopyPaste,
          disableRightClick,
        },
      }),
    });
    const data = await res.json();

    if (publish && data.test?.id) {
      await apiFetch(`/tests/${data.test.id}/publish`, { method: "POST" });
    }

    setSaving(false);
    router.push("/admin/tests");
  };

  return (
    <div>
      <AdminHeader title="Create Assessment Test" subtitle="Build tests by selecting questions category series-wise (React, Aptitude, Python, etc.)" />
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper 
            steps={steps.map(s => ({ label: s }))} 
            currentStep={step} 
          />
        </div>

        {/* Step Content */}
        {step === 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Basic Information</h3>
            <div className="space-y-4">
              <Input label="Test Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior Full-Stack Assessment (React + Node + Aptitude)" />
              <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what skills this test evaluates..." />
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(1)} disabled={!title}>Next: Add Questions →</Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Category-Wise Question Picker</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Pick questions by React, Aptitude, Python, or Node.js topic series with instant description preview & option details
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="accent">{selectedQuestionIds.length} Questions Selected</Badge>
                {totalMarks > 0 && (
                  <Badge variant="neutral" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                    Total: {totalMarks} Marks
                  </Badge>
                )}
              </div>
            </div>

            <CategoryQuestionPicker
              questions={questions}
              selectedQuestionIds={selectedQuestionIds}
              onToggleQuestion={toggleQuestion}
              onSelectAllCategory={selectAllCategory}
            />

            <div className="flex justify-between mt-6 pt-3 border-t" style={{ borderColor: "var(--border-color)" }}>
              <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
              <Button onClick={() => setStep(2)}>Next: Proctoring Settings →</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Proctoring Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Full Screen Required</p>
                  <p className="text-xs text-[var(--text-muted)]">Force test to run in fullscreen mode</p>
                </div>
                <button onClick={() => setFullScreenRequired(!fullScreenRequired)} className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${fullScreenRequired ? "bg-sky-600" : "bg-gray-300 dark:bg-gray-700"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${fullScreenRequired ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Disable Copy/Paste</p>
                  <p className="text-xs text-[var(--text-muted)]">Prevent copying and pasting in the test</p>
                </div>
                <button onClick={() => setDisableCopyPaste(!disableCopyPaste)} className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${disableCopyPaste ? "bg-sky-600" : "bg-gray-300 dark:bg-gray-700"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${disableCopyPaste ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Disable Right Click</p>
                  <p className="text-xs text-[var(--text-muted)]">Prevent right-click context menu</p>
                </div>
                <button onClick={() => setDisableRightClick(!disableRightClick)} className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${disableRightClick ? "bg-sky-600" : "bg-gray-300 dark:bg-gray-700"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${disableRightClick ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <Input
                label="Tab Switch Limit"
                type="number"
                value={tabSwitchLimit}
                onChange={(e) => setTabSwitchLimit(parseInt(e.target.value) || 3)}
                helperText="Number of tab switches before auto-submit"
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Timing & Scoring</h3>
            <div className="space-y-4">
              {/* Auto-calculated total marks */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Test Total Marks (Auto-Calculated)</p>
                <p className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                  {totalMarks} <span className="text-sm font-semibold text-[var(--text-muted)]">marks ({selectedQuestionIds.length} questions)</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Automatically summed from marks assigned to each selected question. To change this, update question marks or selection.</p>
              </div>

              <Input
                label="Total Duration (minutes)"
                type="number"
                value={totalDuration}
                onChange={(e) => setTotalDuration(parseInt(e.target.value) || 60)}
              />
              <Input
                label="Pass Percentage (%)"
                type="number"
                value={passPercentage}
                onChange={(e) => setPassPercentage(parseInt(e.target.value) || 50)}
                helperText={totalMarks > 0 ? `Pass mark = ${Math.ceil(totalMarks * passPercentage / 100)} / ${totalMarks}` : undefined}
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)}>Next →</Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Review & Publish</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Title</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Questions Selected</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{selectedQuestionIds.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Total Marks</span>
                <span className="text-sm font-bold text-emerald-600">{totalMarks} Marks</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Pass Mark</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{Math.ceil(totalMarks * passPercentage / 100)} / {totalMarks}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Duration</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{totalDuration} minutes</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Pass Percentage</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{passPercentage}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-[var(--text-muted)]">Proctoring</span>
                <div className="flex gap-2">
                  {fullScreenRequired && <Badge variant="neutral">Fullscreen</Badge>}
                  {disableCopyPaste && <Badge variant="neutral">No Copy</Badge>}
                  {disableRightClick && <Badge variant="neutral">No Right-click</Badge>}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => handleSave(false)} loading={saving}>Save as Draft</Button>
                <Button onClick={() => handleSave(true)} loading={saving}>Publish Test</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
