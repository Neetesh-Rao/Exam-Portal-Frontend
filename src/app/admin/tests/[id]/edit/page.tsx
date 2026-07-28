"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Stepper from "@/components/ui/Stepper";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useGetTestByIdQuery, useUpdateTestMutation } from "@/redux/api/testsApi";

interface Question {
  id: string | number;
  _id?: string;
  title: string;
  type: string;
  difficulty: string;
  marks: number;
}

const steps = ["Basic Info", "Questions", "Proctoring", "Timing & Scoring", "Review"];

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading: loadingTest } = useGetTestByIdQuery(id);
  const [updateTest, { isLoading: saving }] = useUpdateTestMutation();

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [totalDuration, setTotalDuration] = useState(60);
  const [passPercentage, setPassPercentage] = useState(50);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [fullScreenRequired, setFullScreenRequired] = useState(true);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [disableRightClick, setDisableRightClick] = useState(true);

  // Load existing test data into form state
  useEffect(() => {
    if (data?.test) {
      const t = data.test;
      setTitle(t.title || "");
      setDescription(t.description || "");
      setTotalDuration(Math.floor((t.totalDurationSeconds || 3600) / 60));
      setPassPercentage(t.passPercentage ?? 50);

      if (t.proctoringConfig) {
        setTabSwitchLimit(t.proctoringConfig.tabSwitchLimit ?? 3);
        setFullScreenRequired(t.proctoringConfig.fullScreenRequired ?? true);
        setDisableCopyPaste(t.proctoringConfig.disableCopyPaste ?? true);
        setDisableRightClick(t.proctoringConfig.disableRightClick ?? true);
      }

      // Extract existing question IDs
      if (t.sections && t.sections.length > 0) {
        const qids: string[] = [];
        t.sections.forEach((sec: any) => {
          (sec.questionIds || []).forEach((q: any) => {
            const qid = typeof q === "object" ? (q.id || q._id?.toString()) : q?.toString();
            if (qid) qids.push(qid);
          });
        });
        setSelectedQuestionIds(qids);
      }
    }
  }, [data]);

  // Fetch questions bank
  useEffect(() => {
    import("@/lib/apiFetch").then(({ apiFetch }) => {
      apiFetch("/questions")
        .then((r) => r.json())
        .then((d) => setQuestions(d.questions || []));
    });
  }, []);

  const toggleQuestion = (qid: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]
    );
  };

  const handleSave = async () => {
    try {
      await updateTest({
        id,
        title,
        description,
        sections: [
          {
            title: "Section 1",
            questionIds: selectedQuestionIds,
            timeLimitSeconds: totalDuration * 60,
            randomizeQuestions: false,
          },
        ],
        totalDurationSeconds: totalDuration * 60,
        passPercentage,
        proctoringConfig: {
          tabSwitchLimit,
          fullScreenRequired,
          webcamRequired: false,
          disableCopyPaste,
          disableRightClick,
        },
      }).unwrap();

      router.push("/admin/tests");
    } catch (err) {
      console.error("Failed to update test:", err);
    }
  };

  const diffBadge = (d: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = { easy: "success", medium: "warning", hard: "danger" };
    return <Badge variant={map[d] || "neutral"}>{d}</Badge>;
  };

  if (loadingTest) {
    return (
      <div>
        <AdminHeader title="Edit Test" />
        <div className="p-8 max-w-4xl mx-auto"><CardSkeleton /></div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Edit Test" subtitle={`Update assessment settings: ${title}`} />
      <div className="p-8 max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="mb-12">
          <Stepper steps={steps.map((s) => ({ label: s }))} currentStep={step} />
        </div>

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Basic Information</h3>
            <div className="space-y-4">
              <Input
                label="Test Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Frontend Developer Assessment"
              />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this test evaluates..."
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => router.push("/admin/tests")}>Cancel</Button>
              <Button onClick={() => setStep(1)} disabled={!title}>Next →</Button>
            </div>
          </Card>
        )}

        {/* Step 1: Select Questions */}
        {step === 1 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Select Questions</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{selectedQuestionIds.length} questions selected</p>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                No questions in bank. <a href="/admin/questions" className="text-sky-500 underline">Add questions first →</a>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questions.map((q) => {
                  const qid = (q.id || q._id)?.toString();
                  const isChecked = selectedQuestionIds.includes(qid);
                  return (
                    <label
                      key={qid}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? "border-sky-500 bg-sky-500/10"
                          : "border-app-border dark:border-dark-border hover:border-app-border-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleQuestion(qid)}
                        className="accent-sky-600"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="neutral">{q.type ? q.type.replace("_", " ") : "mcq"}</Badge>
                          {diffBadge(q.difficulty)}
                          <span className="text-xs text-[var(--text-muted)]">{q.marks} marks</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
              <Button onClick={() => setStep(2)}>Next →</Button>
            </div>
          </Card>
        )}

        {/* Step 2: Proctoring Settings */}
        {step === 2 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Proctoring Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Full Screen Required</p>
                  <p className="text-xs text-[var(--text-muted)]">Force test to run in fullscreen mode</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFullScreenRequired(!fullScreenRequired)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    fullScreenRequired ? "bg-sky-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      fullScreenRequired ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Disable Copy/Paste</p>
                  <p className="text-xs text-[var(--text-muted)]">Prevent copying and pasting during assessment</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDisableCopyPaste(!disableCopyPaste)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    disableCopyPaste ? "bg-sky-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      disableCopyPaste ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-app-border dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Disable Right Click</p>
                  <p className="text-xs text-[var(--text-muted)]">Prevent right-click context menu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDisableRightClick(!disableRightClick)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    disableRightClick ? "bg-sky-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      disableRightClick ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
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

        {/* Step 3: Timing & Scoring */}
        {step === 3 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Timing & Scoring</h3>
            <div className="space-y-4">
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
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)}>Next →</Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review & Save */}
        {step === 4 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Review & Save Changes</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Title</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-app-border dark:border-dark-border">
                <span className="text-sm text-[var(--text-muted)]">Selected Questions</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{selectedQuestionIds.length}</span>
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
              <Button onClick={handleSave} loading={saving}>Save Test Changes</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
