"use client";
import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import CodeEditor from "@/components/editor/CodeEditor";

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  marks: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  codeConfig: { language: string; starterCode: string; disablePaste: boolean } | null;
}

interface Answer {
  questionId: number;
  answerText?: string;
  selectedOptionIds?: string[];
  codeAnswer?: string;
  isMarkedForReview?: boolean;
}

export default function ExamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");

  const [subIdState, setSubIdState] = useState<string>(submissionId || "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(3600);
  const [violations, setViolations] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [loading, setLoading] = useState(true);
  
  // Warning & Submitting Modals State
  const [showWarning, setShowWarning] = useState(false);
  const [violationReason, setViolationReason] = useState("");
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [isGracePeriod, setIsGracePeriod] = useState(true);
  const [isFullscreenMode, setIsFullscreenMode] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [proctoringConfig, setProctoringConfig] = useState<{ disableCopyPaste: boolean; disableRightClick: boolean; fullScreenRequired: boolean }>({
    disableCopyPaste: true,
    disableRightClick: true,
    fullScreenRequired: true,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 10 second grace period on exam load
  useEffect(() => {
    const timer = setTimeout(() => setIsGracePeriod(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Request Fullscreen Helper
  const requestFullscreenMode = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().then(() => {
          setIsFullscreenMode(true);
        }).catch(() => {});
      }
    } catch (e) {}
  };

  // Fast Auto Submit Handler (No heavy video uploads, instant response)
  const handleAutoSubmit = useCallback(async (reason: string = "time_up") => {
    if (testEnded || submitting) return;
    setTestEnded(true);
    setSubmitting(true);

    const activeSubId = subIdState || submissionId;
    if (activeSubId) {
      try {
        await fetch(`/api/submissions/${activeSubId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoSubmitted: true, reason }),
        });
      } catch (err) {
        console.error("Auto submit API error:", err);
      }
    }
    router.push(`/take-test/${token}/submitted`);
  }, [testEnded, submitting, subIdState, submissionId, token, router]);

  // Fast Manual Submit Handler
  const handleSubmit = async () => {
    if (testEnded || submitting) return;
    setSubmitting(true);
    setTestEnded(true);
    const activeSubId = subIdState || submissionId;

    if (activeSubId) {
      try {
        await fetch(`/api/submissions/${activeSubId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoSubmitted: false }),
        });
      } catch (err) {
        console.error("Manual submit API error:", err);
      }
    }
    router.push(`/take-test/${token}/submitted`);
  };

  // Load test data
  useEffect(() => {
    fetch("/api/submissions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.alreadySubmitted || d.expired) {
          router.push(`/take-test/${token}/submitted`);
          return;
        }
        if (d.submission?.id) setSubIdState(d.submission.id);
        if (d.questions) setQuestions(d.questions);
        if (d.submission?.answers) setAnswers(d.submission.answers);
        if (d.test?.totalDurationSeconds) {
          setTotalTime(d.test.totalDurationSeconds);
          const started = new Date(d.submission?.startedAt || Date.now()).getTime();
          const elapsed = Math.floor((Date.now() - started) / 1000);
          const rem = Math.max(10, d.test.totalDurationSeconds - elapsed);
          setTimeLeft(rem);
        } else {
          setTimeLeft(3600);
        }
        if (d.test?.proctoringConfig) {
          setProctoringConfig(d.test.proctoringConfig);
          setMaxViolations(d.test.proctoringConfig.tabSwitchLimit || 3);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Start submission error:", err);
        setLoading(false);
      });
  }, [token, router]);

  // Exam Timer
  useEffect(() => {
    if (loading || testEnded || timeLeft === null) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          handleAutoSubmit("time_up");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, testEnded, timeLeft, handleAutoSubmit]);

  // Strict Violation Handler
  const triggerViolation = useCallback((type: string, reasonText: string) => {
    if (loading || testEnded || isGracePeriod || submitting) return;

    const activeSubId = subIdState || submissionId;

    setViolations((prevCount) => {
      const nextCount = prevCount + 1;

      if (activeSubId) {
        fetch(`/api/submissions/${activeSubId}/violation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        }).catch(() => {});
      }

      if (nextCount >= maxViolations) {
        setShowWarning(false);
        handleAutoSubmit("exceeded_max_violations");
      } else {
        setViolationReason(reasonText);
        setShowWarning(true);
      }

      return nextCount;
    });
  }, [loading, testEnded, isGracePeriod, submitting, subIdState, submissionId, maxViolations, handleAutoSubmit]);

  // Tab switch & visibility detection
  useEffect(() => {
    if (loading || testEnded || isGracePeriod) return;

    const handleVisibility = () => {
      if (document.hidden) {
        triggerViolation("tab_switch", "Tab or Window Switch Detected! You navigated away from the exam screen.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loading, testEnded, isGracePeriod, triggerViolation]);

  // Copy/paste/right-click blocking
  useEffect(() => {
    if (loading || testEnded) return;

    const handleCopy = (e: ClipboardEvent) => {
      if (proctoringConfig.disableCopyPaste) {
        e.preventDefault();
        triggerViolation("copy_attempt", "Copy Attempt Detected! Copying text is strictly disabled.");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (proctoringConfig.disableCopyPaste) {
        e.preventDefault();
        triggerViolation("paste_attempt", "Paste Attempt Detected! Pasting text is strictly disabled.");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (proctoringConfig.disableRightClick) {
        e.preventDefault();
        triggerViolation("right_click", "Right Click Detected! Context menu is strictly disabled.");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [loading, testEnded, proctoringConfig, triggerViolation]);

  // Fullscreen Enforcement Listener & Auto-Prompt
  useEffect(() => {
    if (loading || testEnded || !proctoringConfig.fullScreenRequired) return;

    requestFullscreenMode();

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreenMode(isFull);

      if (!isFull && proctoringConfig.fullScreenRequired && !isGracePeriod && !submitting && !testEnded) {
        triggerViolation("fullscreen_exit", "Exited Fullscreen Mode! You must remain in Fullscreen mode throughout the exam.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, testEnded, proctoringConfig.fullScreenRequired, isGracePeriod, submitting, triggerViolation]);

  // Live Webcam Stream Preview & Lightweight Periodic Screenshot Capture (Every 8s)
  useEffect(() => {
    if (loading || testEnded) return;

    let webcamStream: MediaStream | null = null;

    const startWebcamFeed = async () => {
      try {
        if ((window as any).__cameraStream && (window as any).__cameraStream.active) {
          webcamStream = (window as any).__cameraStream;
        } else {
          webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = webcamStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Webcam access error:", err);
      }
    };

    startWebcamFeed();

    // Helper to capture lightweight JPEG snapshot frame
    const captureSnapshot = () => {
      const activeSubId = subIdState || submissionId;
      if (!videoRef.current || !canvasRef.current || !activeSubId || testEnded) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      if (ctx && width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        const imageUrl = canvas.toDataURL("image/jpeg", 0.5);

        fetch(`/api/submissions/${activeSubId}/webcam-snapshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, event: "periodic_exam_snapshot" }),
        }).catch(() => {});
      }
    };

    // Initial snapshot after 1.5s
    const initialSnapTimer = setTimeout(captureSnapshot, 1500);

    // Periodic screenshot capture every 8 seconds
    const captureInterval = setInterval(captureSnapshot, 8000);

    return () => {
      clearTimeout(initialSnapTimer);
      clearInterval(captureInterval);
    };
  }, [loading, testEnded, submissionId, subIdState]);

  // Answer Auto-Save Helper
  const saveAnswer = useCallback(async (answer: Answer) => {
    const activeSubId = subIdState || submissionId;
    if (!activeSubId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await fetch(`/api/submissions/${activeSubId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      }).catch(() => {});
    }, 400);
  }, [submissionId, subIdState]);

  const updateAnswer = (update: Partial<Answer>) => {
    const q = questions[currentIdx];
    if (!q) return;

    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === q.id);
      const newAnswer = { ...existing, questionId: q.id, ...update };
      const newAnswers = existing
        ? prev.map((a) => (a.questionId === q.id ? newAnswer : a))
        : [...prev, newAnswer];
      saveAnswer(newAnswer);
      return newAnswers;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-app-text flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Initializing Secure Assessment Environment...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const displayTime = timeLeft !== null ? timeLeft : totalTime;
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const isWarningTime = displayTime < 120;

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row relative"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-primary)",
      }}
    >
      {/* Fullscreen Restriction Alert Bar */}
      {!isFullscreenMode && proctoringConfig.fullScreenRequired && !testEnded && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>⚠️ FULLSCREEN MODE REQUIRED! Exiting fullscreen is recorded as a security violation.</span>
          </div>
          <button
            type="button"
            onClick={requestFullscreenMode}
            className="px-3 py-1 bg-white text-rose-700 rounded font-extrabold hover:bg-rose-50 transition-colors cursor-pointer shadow-sm shrink-0"
          >
            ⛶ Re-enter Fullscreen Now
          </button>
        </div>
      )}

      {/* Mobile Top Header (Timer & Proctoring Status - Fixed at Top) */}
      <div
        className={`lg:hidden fixed left-0 right-0 z-40 h-14 border-b px-4 flex items-center justify-between shadow-sm backdrop-blur-md transition-all ${
          !isFullscreenMode && proctoringConfig.fullScreenRequired && !testEnded ? "top-11 sm:top-10" : "top-0"
        }`}
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
            Q{currentIdx + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className={`px-2 py-1 rounded ${isWarningTime ? "bg-rose-500 text-white animate-pulse" : "bg-sky-500/10 text-sky-600 dark:text-sky-400"}`}>
            ⏱️ {formatTime(displayTime)}
          </span>
          <span className={`px-2 py-1 rounded ${violations > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
            ⚠️ {violations}/{maxViolations}
          </span>
        </div>
      </div>

      {/* Desktop Permanent Sidebar (Hidden on mobile) */}
      <div
        className="hidden lg:flex w-64 border-r flex-col fixed left-0 top-0 h-screen z-30"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Timer */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Time Remaining</p>
          <p className={`text-3xl font-bold tracking-tight ${isWarningTime ? "text-rose-500" : ""}`} style={{ color: isWarningTime ? undefined : "var(--text-primary)" }}>
            {formatTime(displayTime)}
          </p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-color)" }}>
            <div
              className={`h-full transition-all ${isWarningTime ? "bg-rose-500" : "bg-sky-600"}`}
              style={{
                width: `${(displayTime / totalTime) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Violations Tracker */}
        <div className="p-3.5 border-b" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Proctoring Violations</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${violations > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              {violations} / {maxViolations}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${Math.min(100, (violations / maxViolations) * 100)}%` }}
            />
          </div>
        </div>

        {/* Live Proctoring Webcam Feed */}
        <div className="p-3 border-b bg-neutral-950 text-white" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Camera Feed
            </span>
            <span className="text-[10px] text-neutral-400">Periodic Snapshots</span>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-neutral-800 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Question Palette */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs mb-3 font-semibold" style={{ color: "var(--text-muted)" }}>Question Navigator</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const ans = answers.find((a) => a.questionId === q.id);
              const hasAnswer = ans?.selectedOptionIds?.length || ans?.answerText || ans?.codeAnswer;
              const isMarked = ans?.isMarkedForReview;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-400/30"
                      : isMarked
                      ? "bg-amber-500 text-white border-transparent"
                      : hasAnswer
                      ? "bg-emerald-600 text-white border-transparent"
                      : ""
                  }`}
                  style={
                    !isCurrent && !isMarked && !hasAnswer
                      ? {
                          backgroundColor: "var(--surface2-color)",
                          color: "var(--text-secondary)",
                          borderColor: "var(--border-color)",
                        }
                      : {}
                  }
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }} /><span style={{ color: "var(--text-muted)" }}>Not visited</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-600" /><span style={{ color: "var(--text-muted)" }}>Answered</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500" /><span style={{ color: "var(--text-muted)" }}>Marked for review</span></div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <Button onClick={() => setShowConfirmSubmit(true)} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold">
            Submit Test
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-64 p-3 sm:p-6 lg:p-8 pt-16 lg:pt-10 max-w-full overflow-x-hidden">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {/* Question Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 sm:pb-4 border-b" style={{ borderColor: "var(--border-color)" }}>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  Question {currentIdx + 1} of {questions.length}
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug" style={{ color: "var(--text-primary)" }}>
                  {currentQuestion.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <Badge variant="neutral">{currentQuestion.marks} marks</Badge>
                <Badge variant="accent">{currentQuestion.type.replace(/_/g, " ")}</Badge>
              </div>
            </div>

            {/* Question Description / Statement */}
            {currentQuestion.description && (
              <div className="p-3.5 sm:p-4 rounded-xl border leading-relaxed text-xs sm:text-sm whitespace-pre-wrap" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                {currentQuestion.description}
              </div>
            )}

            {/* Answer Box */}
            <div
              className="rounded-2xl p-4 sm:p-6 border shadow-sm space-y-4"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
              }}
            >
              {/* MCQ Options */}
              {["mcq_single", "mcq_multi", "true_false"].includes(currentQuestion.type) && (
                <div className="space-y-2.5 sm:space-y-3">
                  {currentQuestion.options?.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    const inputType = currentQuestion.type === "mcq_multi" ? "checkbox" : "radio";

                    return (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-150 text-xs sm:text-sm"
                        style={{
                          backgroundColor: isSelected ? "var(--surface2-color)" : "var(--surface-color)",
                          borderColor: isSelected ? "#0284c7" : "var(--border-color)",
                          boxShadow: isSelected ? "0 0 0 1px #0284c7" : "none",
                        }}
                      >
                        <input
                          type={inputType}
                          name="answer"
                          checked={!!isSelected}
                          onChange={() => {
                            if (currentQuestion.type === "mcq_multi") {
                              const current = currentAnswer?.selectedOptionIds || [];
                              const updated = isSelected ? current.filter((id) => id !== opt.id) : [...current, opt.id];
                              updateAnswer({ selectedOptionIds: updated });
                            } else {
                              updateAnswer({ selectedOptionIds: [opt.id] });
                            }
                          }}
                          className="w-4 h-4 accent-sky-600 cursor-pointer shrink-0"
                        />
                        <span
                          className="font-medium leading-relaxed"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Text Area */}
              {["text_area", "fill_blank"].includes(currentQuestion.type) && (
                <textarea
                  value={currentAnswer?.answerText || ""}
                  onChange={(e) => updateAnswer({ answerText: e.target.value })}
                  placeholder="Type your detailed answer here..."
                  className="w-full h-36 sm:h-44 p-3 sm:p-4 border rounded-xl text-xs sm:text-sm outline-none focus:border-sky-500 resize-none font-sans"
                  style={{
                    backgroundColor: "var(--surface2-color)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                  }}
                />
              )}

              {/* Coding Monaco Editor */}
              {currentQuestion.type === "coding" && (
                <div className="w-full overflow-hidden">
                  <CodeEditor
                    value={currentAnswer?.codeAnswer || currentQuestion.codeConfig?.starterCode || ""}
                    onChange={(val) => updateAnswer({ codeAnswer: val })}
                    language={currentQuestion.codeConfig?.language || "javascript"}
                    disablePaste={currentQuestion.codeConfig?.disablePaste}
                    onPasteAttempt={() => triggerViolation("paste_attempt", "Pasting code in the editor is strictly disabled.")}
                    height="320px"
                  />
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex gap-2 sm:gap-3">
                <Button variant="secondary" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                  ← Previous
                </Button>
                <Button variant="secondary" onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1} className="flex-1 sm:flex-initial text-xs sm:text-sm">
                  Next →
                </Button>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    updateAnswer({ selectedOptionIds: [], answerText: "", codeAnswer: "" });
                  }}
                  className="flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  Clear Response
                </Button>
                <Button
                  variant={currentAnswer?.isMarkedForReview ? "secondary" : "ghost"}
                  onClick={() => updateAnswer({ isMarkedForReview: !currentAnswer?.isMarkedForReview })}
                  className="flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  {currentAnswer?.isMarkedForReview ? "✓ Marked" : "Mark for Review"}
                </Button>
              </div>
            </div>

            {/* Mobile Stacked Section: Question Navigator, Camera & Submit Button (Rendered directly below questions on mobile) */}
            <div className="lg:hidden mt-8 space-y-4 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
              {/* Question Navigator Grid Card */}
              <div
                className="p-4 rounded-2xl border shadow-xs"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                    Question Navigator
                  </h3>
                  <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                    {answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}/{questions.length} Answered
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const ans = answers.find((a) => a.questionId === q.id);
                    const hasAnswer = ans?.selectedOptionIds?.length || ans?.answerText || ans?.codeAnswer;
                    const isMarked = ans?.isMarkedForReview;
                    const isCurrent = idx === currentIdx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIdx(idx);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`h-10 rounded-xl text-xs font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-400/30"
                            : isMarked
                            ? "bg-amber-500 text-white border-transparent"
                            : hasAnswer
                            ? "bg-emerald-600 text-white border-transparent"
                            : ""
                        }`}
                        style={
                          !isCurrent && !isMarked && !hasAnswer
                            ? {
                                backgroundColor: "var(--surface2-color)",
                                color: "var(--text-secondary)",
                                borderColor: "var(--border-color)",
                              }
                            : {}
                        }
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-around text-[11px] font-medium pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }} /><span style={{ color: "var(--text-muted)" }}>Not visited</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-600" /><span style={{ color: "var(--text-muted)" }}>Answered</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500" /><span style={{ color: "var(--text-muted)" }}>Marked</span></div>
                </div>
              </div>

              {/* Submit Final Assessment Button Card */}
              <div className="p-4 rounded-2xl border shadow-sm bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-center space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Ready to Finish Your Test?</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                    Review your answers and submit your final assessment.
                  </p>
                </div>
                <Button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm shadow-md rounded-xl"
                >
                  ✓ Submit Assessment Test
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strict Security Violation Modal */}
      <Modal open={showWarning} onClose={() => {}} title="⚠️ Proctoring Violation Warning">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-600 dark:text-rose-400">Security Rule Violation Detected</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              {violationReason || "A security rule violation was detected during your proctored assessment."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm font-bold">
            Violations Recorded: {violations} / {maxViolations}
          </div>

          {violations >= maxViolations - 1 && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              🚨 WARNING: 1 more violation will result in IMMEDIATE AUTOMATIC SUBMISSION of your exam!
            </p>
          )}

          <div className="pt-2">
            <Button
              onClick={() => {
                setShowWarning(false);
                requestFullscreenMode();
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              ⛶ Re-enter Fullscreen & Resume Exam
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)} title="Submit Final Assessment?">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
            Are you sure you want to submit your assessment? You cannot change your answers after submission.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-medium">Answered</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {answers.filter((a) => a.isMarkedForReview).length}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-medium">Marked</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-app-border dark:border-dark-border">
              <p className="text-xl font-bold text-[var(--text-secondary)]">
                {questions.length - answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-medium">Unanswered</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmSubmit(false)}>Continue Test</Button>
            <Button onClick={handleSubmit} loading={submitting} className="bg-sky-600 text-white font-bold">
              Confirm & Submit Test
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mandatory Fullscreen Start / Lock Modal Overlay */}
      {!isFullscreenMode && proctoringConfig.fullScreenRequired && !loading && !testEnded && !submitting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto text-3xl font-extrabold">
              ⛶
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Fullscreen Required for Exam</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                This proctored assessment requires Fullscreen mode to protect exam integrity. Please click below to activate Fullscreen and begin taking your exam.
              </p>
            </div>
            <Button
              onClick={requestFullscreenMode}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 text-sm rounded-xl shadow-lg"
            >
              ⛶ Enter Fullscreen Mode & Begin Exam
            </Button>
          </div>
        </div>
      )}

      {/* Submitting Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full" />
          <h3 className="text-lg font-bold">Submitting Your Test Session...</h3>
          <p className="text-xs text-neutral-300">Evaluating responses & finalizing proctoring logs...</p>
        </div>
      )}
    </div>
  );
}
