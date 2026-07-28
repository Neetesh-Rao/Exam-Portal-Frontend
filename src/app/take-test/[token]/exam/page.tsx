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
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [isGracePeriod, setIsGracePeriod] = useState(true);

  const [proctoringConfig, setProctoringConfig] = useState<{ disableCopyPaste: boolean; disableRightClick: boolean; fullScreenRequired: boolean }>({
    disableCopyPaste: true,
    disableRightClick: true,
    fullScreenRequired: true,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraBlobsRef = useRef<Blob[]>([]);
  const screenBlobsRef = useRef<Blob[]>([]);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);

  // 10 second grace period on exam load
  useEffect(() => {
    const timer = setTimeout(() => setIsGracePeriod(false), 10000);
    return () => clearTimeout(timer);
  }, []);

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

  // Timer
  useEffect(() => {
    if (loading || testEnded || timeLeft === null) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, testEnded, timeLeft]);

  // Tab switch detection (only document.hidden, NO window.blur)
  useEffect(() => {
    if (loading || testEnded || isGracePeriod) return;

    const handleVisibility = () => {
      if (document.hidden) {
        logViolation("tab_switch");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loading, testEnded, isGracePeriod]);

  // Copy/paste/right-click blocking
  useEffect(() => {
    if (loading || testEnded) return;

    const handleCopy = (e: ClipboardEvent) => {
      if (proctoringConfig.disableCopyPaste) {
        e.preventDefault();
        logViolation("copy_attempt");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (proctoringConfig.disableCopyPaste) {
        e.preventDefault();
        logViolation("paste_attempt");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (proctoringConfig.disableRightClick) {
        e.preventDefault();
        logViolation("right_click");
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
  }, [loading, testEnded, proctoringConfig]);

  // Fullscreen
  useEffect(() => {
    if (loading || testEnded || !proctoringConfig.fullScreenRequired) return;

    const enterFullscreen = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && proctoringConfig.fullScreenRequired && !isGracePeriod) {
        logViolation("fullscreen_exit");
        enterFullscreen();
      }
    };

    enterFullscreen();
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, testEnded, proctoringConfig.fullScreenRequired, isGracePeriod]);

  // Webcam & Screen Stream Capture with Explicit .play() & Snapshot Upload
  useEffect(() => {
    if (loading || testEnded) return;

    let webcamStream: MediaStream | null = null;
    let screenStream: MediaStream | null = null;

    const startProctoringStreams = async () => {
      try {
        if ((window as any).__cameraStream && (window as any).__cameraStream.active) {
          webcamStream = (window as any).__cameraStream;
        } else {
          webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = webcamStream;
          videoRef.current.play().catch(() => {});
        }

        if (window.MediaRecorder && webcamStream) {
          const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
            ? { mimeType: "video/webm;codecs=vp8,opus" }
            : MediaRecorder.isTypeSupported("video/webm")
            ? { mimeType: "video/webm" }
            : undefined;

          const webcamRecorder = options ? new MediaRecorder(webcamStream, options) : new MediaRecorder(webcamStream);
          webcamRecorderRef.current = webcamRecorder;
          webcamRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              cameraBlobsRef.current.push(event.data);
            }
          };
          webcamRecorder.start(1000);
        }
      } catch (err) {
        console.warn("Webcam access error:", err);
      }

      try {
        if ((window as any).__screenStream && (window as any).__screenStream.active) {
          screenStream = (window as any).__screenStream;
        } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }

        if (window.MediaRecorder && screenStream) {
          const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
            ? { mimeType: "video/webm;codecs=vp8,opus" }
            : MediaRecorder.isTypeSupported("video/webm")
            ? { mimeType: "video/webm" }
            : undefined;

          const screenRecorder = options ? new MediaRecorder(screenStream, options) : new MediaRecorder(screenStream);
          screenRecorderRef.current = screenRecorder;
          screenRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              screenBlobsRef.current.push(event.data);
            }
          };
          screenRecorder.start(1000);
        }
      } catch (err) {
        console.warn("Screen recording access denied:", err);
      }
    };

    startProctoringStreams();

    // Helper to capture canvas frame
    const captureSnapshot = () => {
      const activeSubId = subIdState || submissionId;
      if (!videoRef.current || !canvasRef.current || !activeSubId) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      if (ctx) {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        const imageUrl = canvas.toDataURL("image/jpeg", 0.6);

        fetch(`/api/submissions/${activeSubId}/webcam-snapshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, event: "proctoring_snapshot" }),
        }).catch(() => {});
      }
    };

    // Immediate initial snapshot after 1s
    const initialSnapTimer = setTimeout(captureSnapshot, 1200);

    // Periodic snapshot every 8s
    const captureInterval = setInterval(captureSnapshot, 8000);

    return () => {
      clearTimeout(initialSnapTimer);
      clearInterval(captureInterval);
      if (webcamRecorderRef.current && webcamRecorderRef.current.state !== "inactive") webcamRecorderRef.current.stop();
      if (screenRecorderRef.current && screenRecorderRef.current.state !== "inactive") screenRecorderRef.current.stop();
    };
  }, [loading, testEnded, submissionId, subIdState]);

  // Periodic Cloudinary upload every 15s
  useEffect(() => {
    if (loading || testEnded) return;
    const activeSubId = subIdState || submissionId;
    if (!activeSubId) return;

    const interval = setInterval(() => {
      uploadRecordingsToCloudinary();
    }, 15000);

    return () => clearInterval(interval);
  }, [loading, testEnded, subIdState, submissionId]);

  const logViolation = async (type: string) => {
    const activeSubId = subIdState || submissionId;

    setViolations((prevCount) => {
      const nextCount = prevCount + 1;
      setShowWarning(true);

      if (activeSubId) {
        fetch(`/api/submissions/${activeSubId}/violation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        }).catch(() => {});
      }

      if (nextCount >= maxViolations) {
        handleAutoSubmit();
      }
      return nextCount;
    });
  };

  const saveAnswer = useCallback(async (answer: Answer) => {
    const activeSubId = subIdState || submissionId;
    if (!activeSubId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await fetch(`/api/submissions/${activeSubId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });
    }, 500);
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

  const uploadRecordingsToCloudinary = async () => {
    try {
      const activeSubId = subIdState || submissionId;
      if (!activeSubId) return;

      if (webcamRecorderRef.current && webcamRecorderRef.current.state !== "inactive") {
        try { webcamRecorderRef.current.requestData(); } catch (e) {}
      }
      if (screenRecorderRef.current && screenRecorderRef.current.state !== "inactive") {
        try { screenRecorderRef.current.requestData(); } catch (e) {}
      }

      await new Promise((r) => setTimeout(r, 200));

      if (cameraBlobsRef.current.length === 0 && screenBlobsRef.current.length === 0) return;

      const cameraBlob = cameraBlobsRef.current.length > 0
        ? new Blob(cameraBlobsRef.current, { type: "video/webm" })
        : null;

      const screenBlob = screenBlobsRef.current.length > 0
        ? new Blob(screenBlobsRef.current, { type: "video/webm" })
        : null;

      const formData = new FormData();
      if (cameraBlob) formData.append("cameraVideo", cameraBlob, "camera_recording.webm");
      if (screenBlob) formData.append("screenVideo", screenBlob, "screen_recording.webm");

      try {
        const res = await fetch(`/api/submissions/${activeSubId}/upload-full-recordings`, {
          method: "POST",
          body: formData,
        });
        const resData = await res.json();
        console.log("Cloudinary Upload Result:", resData);
      } catch (err) {
        console.warn("FormData upload failed, attempting Base64 fallback...", err);
        // Base64 JSON Fallback
        const cameraBase64 = cameraBlob ? await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(cameraBlob);
        }) : undefined;

        const screenBase64 = screenBlob ? await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(screenBlob);
        }) : undefined;

        if (cameraBase64 || screenBase64) {
          await fetch(`/api/submissions/${activeSubId}/upload-full-recordings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cameraVideoBase64: cameraBase64,
              screenVideoBase64: screenBase64,
            }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Upload recording error:", err);
    }
  };

  const handleAutoSubmit = async () => {
    if (testEnded || submitting) return;
    setTestEnded(true);
    setSubmitting(true);

    const activeSubId = subIdState || submissionId;

    await uploadRecordingsToCloudinary();

    if (activeSubId) {
      await fetch(`/api/submissions/${activeSubId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSubmitted: true }),
      });
    }
    router.push(`/take-test/${token}/submitted`);
  };

  const handleSubmit = async () => {
    if (testEnded || submitting) return;
    setSubmitting(true);
    setTestEnded(true);
    const activeSubId = subIdState || submissionId;

    await uploadRecordingsToCloudinary();

    if (activeSubId) {
      await fetch(`/api/submissions/${activeSubId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSubmitted: false }),
      });
    }
    router.push(`/take-test/${token}/submitted`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-app-text flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-ink dark:border-white border-t-transparent rounded-full" />
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
      className="min-h-screen flex"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-primary)",
      }}
    >
      {/* Sidebar */}
      <div
        className="w-64 border-r flex flex-col fixed left-0 top-0 h-screen z-30"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Timer */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Time Remaining</p>
          <p className={`text-3xl font-bold tracking-tight ${isWarningTime ? "text-danger" : ""}`} style={{ color: isWarningTime ? undefined : "var(--text-primary)" }}>
            {formatTime(displayTime)}
          </p>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-color)" }}>
            <div
              className={`h-full transition-all ${isWarningTime ? "bg-danger" : ""}`}
              style={{
                width: `${(displayTime / totalTime) * 100}%`,
                backgroundColor: isWarningTime ? undefined : "#0284c7",
              }}
            />
          </div>
        </div>

        {/* Violations */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Violations</p>
          <p className={`text-lg font-bold ${violations > 0 ? "text-danger" : ""}`} style={{ color: violations > 0 ? undefined : "var(--text-primary)" }}>
            {violations} / {maxViolations}
          </p>
        </div>

        {/* Live Proctoring Webcam Feed Widget */}
        <div className="p-3 border-b bg-neutral-950 text-white" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Webcam Active
            </span>
            <span className="text-[10px] text-neutral-400">Proctored Session</span>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-neutral-800 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Question Palette */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Questions</p>
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
                  className={`w-9 h-9 rounded-lg text-xs font-medium flex items-center justify-center border transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-sky-600 text-white border-transparent shadow-sm"
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
          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }} /><span style={{ color: "var(--text-muted)" }}>Not visited</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-600" /><span style={{ color: "var(--text-muted)" }}>Answered</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500" /><span style={{ color: "var(--text-muted)" }}>Marked for review</span></div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <Button onClick={() => setShowConfirmSubmit(true)} className="w-full">Submit Test</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Question {currentIdx + 1} of {questions.length}</p>
                <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{currentQuestion.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{currentQuestion.marks} marks</Badge>
                <Badge variant="accent">{currentQuestion.type.replace(/_/g, " ")}</Badge>
              </div>
            </div>

            {/* Question Body */}
            {currentQuestion.description && (
              <div className="prose prose-sm max-w-none mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <p>{currentQuestion.description}</p>
              </div>
            )}

            {/* Answer Area */}
            <div
              className="rounded-xl p-6 border shadow-sm"
              style={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
              }}
            >
              {/* MCQ */}
              {["mcq_single", "mcq_multi", "true_false"].includes(currentQuestion.type) && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    const inputType = currentQuestion.type === "mcq_multi" ? "checkbox" : "radio";

                    return (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150"
                        style={{
                          backgroundColor: isSelected ? "var(--surface2-color)" : "var(--surface-color)",
                          borderColor: isSelected ? "#0284c7" : "var(--border-color)",
                          boxShadow: isSelected ? "0 0 0 1px #0284c7" : "none",
                        }}
                      >
                        <input
                          type={inputType}
                          name="answer"
                          checked={isSelected}
                          onChange={() => {
                            if (currentQuestion.type === "mcq_multi") {
                              const current = currentAnswer?.selectedOptionIds || [];
                              const updated = isSelected ? current.filter((id) => id !== opt.id) : [...current, opt.id];
                              updateAnswer({ selectedOptionIds: updated });
                            } else {
                              updateAnswer({ selectedOptionIds: [opt.id] });
                            }
                          }}
                          className="w-4 h-4 accent-sky-600 cursor-pointer"
                        />
                        <span
                          className="text-sm font-medium leading-relaxed"
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
                  placeholder="Type your answer here..."
                  className="w-full h-40 p-4 border rounded-lg text-sm outline-none focus:border-sky-500 resize-none"
                  style={{
                    backgroundColor: "var(--surface2-color)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                  }}
                />
              )}

              {/* Coding */}
              {currentQuestion.type === "coding" && (
                <div>
                  <CodeEditor
                    value={currentAnswer?.codeAnswer || currentQuestion.codeConfig?.starterCode || ""}
                    onChange={(val) => updateAnswer({ codeAnswer: val })}
                    language={currentQuestion.codeConfig?.language || "javascript"}
                    disablePaste={currentQuestion.codeConfig?.disablePaste}
                    onPasteAttempt={() => logViolation("paste_attempt")}
                    height="380px"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                  ← Previous
                </Button>
                <Button variant="secondary" onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1}>
                  Next →
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    updateAnswer({ selectedOptionIds: [], answerText: "", codeAnswer: "" });
                  }}
                >
                  Clear Response
                </Button>
                <Button
                  variant={currentAnswer?.isMarkedForReview ? "secondary" : "ghost"}
                  onClick={() => updateAnswer({ isMarkedForReview: !currentAnswer?.isMarkedForReview })}
                >
                  {currentAnswer?.isMarkedForReview ? "✓ Marked" : "Mark for Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      <Modal open={showWarning} onClose={() => setShowWarning(false)} title="⚠️ Warning">
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            A violation has been detected. Please stay on this tab and follow the test rules.
          </p>
          <p className="text-lg font-bold text-danger mb-4">
            Violations: {violations} / {maxViolations}
          </p>
          {violations >= maxViolations - 1 && (
            <p className="text-sm text-danger mb-4">
              One more violation will auto-submit your test!
            </p>
          )}
          <Button onClick={() => setShowWarning(false)}>I Understand</Button>
        </div>
      </Modal>

      {/* Submit Confirmation */}
      <Modal open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)} title="Submit Test?">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Are you sure you want to submit? You cannot change your answers after submission.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-3 bg-success-subtle dark:bg-success/10 rounded-lg">
              <p className="text-lg font-bold text-success">{answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Answered</p>
            </div>
            <div className="p-3 bg-warn-subtle dark:bg-warn/10 rounded-lg">
              <p className="text-lg font-bold text-warn">{answers.filter((a) => a.isMarkedForReview).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Marked</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-dark-surface rounded-lg">
              <p className="text-lg font-bold text-[var(--text-secondary)]">{questions.length - answers.filter((a) => a.selectedOptionIds?.length || a.answerText || a.codeAnswer).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Unanswered</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmSubmit(false)}>Continue Test</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit Test</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
