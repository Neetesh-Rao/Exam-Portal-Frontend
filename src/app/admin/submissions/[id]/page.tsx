"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CodeEditor from "@/components/editor/CodeEditor";
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Video,
  FileText,
  User,
  Film,
  Calendar,
  Check,
  X,
  Code,
  HelpCircle,
  Play,
} from "lucide-react";

interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  title: string;
  description?: string;
  type: string;
  marks: number;
  options?: QuestionOption[];
  codeConfig?: { language?: string; starterCode?: string; disablePaste?: boolean };
  fillBlankKeys?: string[];
}

interface RecordingSnapshot {
  timestamp: string;
  imageUrl: string;
  event?: string;
}

interface RecordingHistoryItem {
  type: "camera" | "screen" | "snapshot";
  url: string;
  timestamp: string;
  event?: string;
}

interface SubmissionData {
  submission: {
    id: string;
    status: string;
    autoScore: number;
    manualScore: number | null;
    finalScore: number;
    totalMarks: number;
    answers: { questionId: string; answerText?: string; selectedOptionIds?: string[]; codeAnswer?: string; isMarkedForReview?: boolean }[];
    recordingSnapshots?: RecordingSnapshot[];
    recordingsHistory?: RecordingHistoryItem[];
    videoRecordingUrl?: string | null;
    screenRecordingUrl?: string | null;
    startedAt: string;
    submittedAt: string;
    createdAt: string;
  };
  candidate: { id: string; name: string; email: string };
  test: { id: string; title: string };
  questions: Question[];
  violations: { id: string; type: string; createdAt: string }[];
}

interface RecordingItem {
  id: string;
  isCamera: boolean;
  url: string;
  timestamp: string;
  label: string;
}

interface RecordingSessionGroup {
  id: string;
  timestamp: string;
  items: RecordingItem[];
}

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualScore, setManualScore] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [activeSnapshotIdx, setActiveSnapshotIdx] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState<number>(0);

  const getApiUrl = (path: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base ? `${base}/api${path}` : `/api${path}`;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetch(getApiUrl(`/submissions/${id}`), {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setManualScore(d.submission?.manualScore || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Video Playback Animation Timer for Snapshots
  useEffect(() => {
    if (!isPlayingVideo) return;

    const interval = setInterval(() => {
      setActiveSnapshotIdx((prevIdx) => {
        const snapshotsCount = data?.submission?.recordingSnapshots?.length || 0;
        if (snapshotsCount === 0) return 0;
        if (prevIdx >= snapshotsCount - 1) {
          setIsPlayingVideo(false);
          return prevIdx;
        }
        return prevIdx + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isPlayingVideo, data]);

  const handleGrade = async () => {
    setSaving(true);
    await fetch(getApiUrl(`/submissions/${id}/grade`), {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ manualScore }),
    });
    setSaving(false);
    window.location.reload();
  };

  if (loading) return (
    <div>
      <AdminHeader title="Loading submission details..." />
      <div className="p-8 max-w-5xl mx-auto text-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  );

  if (!data?.submission) return (
    <div>
      <AdminHeader title="Submission Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">Submission not found.</div>
    </div>
  );

  const submission = data.submission;
  const candidate = data.candidate || (submission as any)?.candidate;
  const test = data.test || (submission as any)?.test;
  const questions = data.questions || (submission as any)?.questions || [];
  const violations = data.violations || (submission as any)?.violations || [];
  const snapshots = submission?.recordingSnapshots || [];
  const history = submission?.recordingsHistory || [];
  const currentSnapshot = snapshots[activeSnapshotIdx];

  // ── Construct Unique Deduplicated List of Stream Recordings ───────────────────────
  const rawRecordings: RecordingItem[] = [
    ...(submission?.videoRecordingUrl ? [{
      id: "cam_main",
      isCamera: true,
      url: submission.videoRecordingUrl,
      timestamp: submission.submittedAt || submission.createdAt || new Date().toISOString(),
      label: "Camera Video Stream",
    }] : []),
    ...(submission?.screenRecordingUrl ? [{
      id: "screen_main",
      isCamera: false,
      url: submission.screenRecordingUrl,
      timestamp: submission.submittedAt || submission.createdAt || new Date().toISOString(),
      label: "Screen Activity Video",
    }] : []),
    ...history.map((h, i) => ({
      id: `hist_${i}`,
      isCamera: h.type === "camera",
      url: h.url,
      timestamp: h.timestamp || submission.createdAt || new Date().toISOString(),
      label: h.event || (h.type === "camera" ? "Webcam Recording Stream" : "Screen Recording Stream"),
    })),
  ];

  // Unique deduplication by URL
  const seenUrls = new Set<string>();
  const deduplicatedRecordings = rawRecordings.filter((rec) => {
    if (!rec.url || seenUrls.has(rec.url)) return false;
    seenUrls.add(rec.url);
    return true;
  });

  // ── Group Recordings by Session Timestamp (Bucket by Minute) ───────
  const groupedSessionsMap = new Map<string, RecordingItem[]>();

  for (const item of deduplicatedRecordings) {
    const d = new Date(item.timestamp);
    const timeKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    if (!groupedSessionsMap.has(timeKey)) {
      groupedSessionsMap.set(timeKey, []);
    }
    groupedSessionsMap.get(timeKey)!.push(item);
  }

  const groupedSessions: RecordingSessionGroup[] = Array.from(groupedSessionsMap.entries()).map(([ts, items], i) => ({
    id: `session_${i}`,
    timestamp: items[0]?.timestamp || ts,
    items,
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Derive Active Camera & Screen Video URLs based on 1-Click Selected Session Group
  const activeSession = groupedSessions[selectedSessionIdx] || groupedSessions[0];
  const cameraUrl = activeSession?.items.find((i) => i.isCamera)?.url || submission?.videoRecordingUrl || undefined;
  const screenUrl = activeSession?.items.find((i) => !i.isCamera)?.url || submission?.screenRecordingUrl || undefined;

  return (
    <div>
      <AdminHeader title={`Submission Review`} subtitle={`${candidate?.name || "Candidate"} • ${test?.title || "Assessment"}`} />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Submissions List
        </Link>

        {/* Top Summary Header */}
        <Card className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{candidate?.name || "Candidate"}</h2>
              <Badge variant={submission.status === "graded" ? "neutral" : "accent"}>{submission.status?.replace("_", " ") || "submitted"}</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{candidate?.email} • Assessment: {test?.title}</p>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-xl border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Total Score</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{submission.finalScore ?? submission.autoScore ?? 0}</p>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: "var(--border-color)" }}></div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Violations</p>
              <p className={`text-2xl font-bold ${violations?.length > 0 ? "text-danger" : ""}`} style={{ color: violations?.length > 0 ? undefined : "var(--text-primary)" }}>
                {violations?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* ── 1-Click Dual Player Session Attempt Recordings Selector ────────────────────────── */}
        {groupedSessions.length > 0 && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Film className="w-5 h-5 text-sky-500" />
                  Select Test Session Attempt ({groupedSessions.length} Date Sessions Recorded)
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Click any Session Attempt card below to load BOTH Camera Video & Screen Activity Video into players simultaneously!
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                1-Click Dual Video Load
              </span>
            </div>

            <div className="space-y-4">
              {groupedSessions.map((session, sIdx) => {
                const isSelectedSession = selectedSessionIdx === sIdx;

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionIdx(sIdx)}
                    className="p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md space-y-3"
                    style={{
                      backgroundColor: isSelectedSession ? "var(--surface2-color)" : "var(--surface-color)",
                      borderColor: isSelectedSession ? "#0284c7" : "var(--border-color)",
                      boxShadow: isSelectedSession ? "0 0 0 2px #0284c7" : "none",
                    }}
                  >
                    {/* Session Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {sIdx === 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Current / Latest Test Session
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Previous Attempt #{groupedSessions.length - sIdx}
                          </span>
                        )}
                        <span className="text-xs font-mono font-semibold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          {new Date(session.timestamp).toLocaleString([], { dateStyle: "full", timeStyle: "medium" })}
                        </span>
                      </div>

                      {isSelectedSession ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white flex items-center gap-1 shadow-sm">
                          <Play className="w-3 h-3 fill-current" /> Active Session Loaded
                        </span>
                      ) : (
                        <span className="text-xs text-sky-600 font-semibold hover:underline">
                          Click to Load Both Videos →
                        </span>
                      )}
                    </div>

                    {/* Session Streams Preview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {session.items.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3 rounded-xl border flex items-center gap-3"
                          style={{
                            backgroundColor: "var(--surface-color)",
                            borderColor: "var(--border-color)",
                          }}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                              rec.isCamera ? "bg-emerald-600" : "bg-sky-600"
                            }`}
                          >
                            {rec.isCamera ? "📹" : "🖥️"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                              {rec.isCamera ? "Camera & Audio Video Stream" : "Screen Activity Video Stream"}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                              Recorded at: {new Date(rec.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Video Recordings Section (Camera & Screen Recording Players) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Video Player */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Video className="w-4 h-4 text-emerald-500" />
                Camera & Audio Recording Stream
              </h3>
              <Badge variant="neutral">Webcam Feed</Badge>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 flex items-center justify-center">
              {cameraUrl ? (
                <video src={cameraUrl} controls preload="auto" playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-neutral-400 text-xs">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                  <p>No camera video stream recorded for this session attempt.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Screen Recording Video Player */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Video className="w-4 h-4 text-blue-500" />
                Candidate Screen & Activity Video
              </h3>
              <Badge variant="neutral">Screen Capture</Badge>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 flex items-center justify-center">
              {screenUrl ? (
                <video src={screenUrl} controls preload="auto" playsInline className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6 text-neutral-400 text-xs">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                  <p>No screen recording stream uploaded for this session attempt.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Live Video / Screen Proctoring Snapshots Recording Player */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Video className="w-4 h-4 text-sky-500" />
              Proctoring Video Stream Timeline & Playback
            </h3>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{snapshots.length} Recording Frames</span>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-8 text-center rounded-xl border text-xs" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
              No webcam snapshots recorded for this test session yet. Camera recording captures frames periodically during exam execution.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Snapshot Frame Display */}
              <div className="md:col-span-2 space-y-3">
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 flex items-center justify-center">
                  {currentSnapshot?.imageUrl?.startsWith("data:video") ? (
                    <video
                      src={currentSnapshot.imageUrl}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={currentSnapshot?.imageUrl}
                      alt="Proctoring Frame"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-mono font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{currentSnapshot?.imageUrl?.startsWith("data:video") ? "Video Stream Chunk" : "Camera Frame"} {activeSnapshotIdx + 1} / {snapshots.length}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur text-neutral-300 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between">
                    <span>Captured: {currentSnapshot ? new Date(currentSnapshot.timestamp).toLocaleString() : "—"}</span>
                    <span className="capitalize font-medium text-emerald-400">{currentSnapshot?.event || "Camera Snapshot"}</span>
                  </div>
                </div>

                {/* Playback Navigation & Video Control Bar */}
                <div className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                        className="bg-sky-600 text-white font-semibold text-xs px-4"
                      >
                        {isPlayingVideo ? "⏸ Pause Video" : "▶ Play Video Recording"}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={activeSnapshotIdx === 0}
                        onClick={() => {
                          setIsPlayingVideo(false);
                          setActiveSnapshotIdx(Math.max(0, activeSnapshotIdx - 1));
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={activeSnapshotIdx === snapshots.length - 1}
                        onClick={() => {
                          setIsPlayingVideo(false);
                          setActiveSnapshotIdx(Math.min(snapshots.length - 1, activeSnapshotIdx + 1));
                        }}
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>
                      Frame {activeSnapshotIdx + 1} of {snapshots.length}
                    </span>
                  </div>

                  {/* Seek Bar */}
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, snapshots.length - 1)}
                    value={activeSnapshotIdx}
                    onChange={(e) => {
                      setIsPlayingVideo(false);
                      setActiveSnapshotIdx(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>
              </div>

              {/* Snapshot Timeline Frame Thumbnails List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                <p className="text-xs font-bold uppercase tracking-wider sticky top-0 py-1" style={{ backgroundColor: "var(--surface-color)", color: "var(--text-muted)" }}>
                  Captured Frame Archive
                </p>
                {snapshots.map((snap, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlayingVideo(false);
                      setActiveSnapshotIdx(idx);
                    }}
                    className="w-full p-2 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer hover:border-sky-500"
                    style={{
                      backgroundColor: idx === activeSnapshotIdx ? "var(--surface2-color)" : "var(--surface-color)",
                      borderColor: idx === activeSnapshotIdx ? "#0284c7" : "var(--border-color)",
                      boxShadow: idx === activeSnapshotIdx ? "0 0 0 1px #0284c7" : "none",
                    }}
                  >
                    <div className="w-12 h-9 rounded bg-black overflow-hidden flex-shrink-0 relative border border-neutral-800">
                      {snap.imageUrl?.startsWith("data:video") ? (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-[9px] font-bold text-emerald-400">
                          VIDEO
                        </div>
                      ) : (
                        <img src={snap.imageUrl} alt="Thumb" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {snap.event || "Camera Frame"} #{idx + 1}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(snap.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Candidate Questions & Answers Evaluation Section */}
        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <HelpCircle className="w-5 h-5 text-sky-500" />
              Candidate Submitted Answers & Test Evaluation ({questions.length} Questions)
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
              Detailed Question Review
            </span>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
              No question details attached to this submission.
            </p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const ans = submission.answers?.find(
                  (a) => a.questionId?.toString() === q.id || (a.questionId as any)?._id?.toString() === q.id
                );

                return (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-xl border space-y-4"
                    style={{
                      backgroundColor: "var(--surface2-color)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-mono font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                            {q.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h4 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                          {q.title}
                        </h4>
                      </div>
                      <Badge variant="neutral">{q.marks} Marks</Badge>
                    </div>

                    {/* Question Description */}
                    {q.description && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {q.description}
                      </p>
                    )}

                    {/* MCQ Options Rendering */}
                    {["mcq_single", "mcq_multi", "true_false"].includes(q.type) && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                          Options & Candidate Choices:
                        </p>
                        {q.options?.map((opt) => {
                          const isSelected = ans?.selectedOptionIds?.includes(opt.id);
                          const isCorrect = opt.isCorrect;

                          return (
                            <div
                              key={opt.id}
                              className="p-3 rounded-lg border flex items-center justify-between text-xs"
                              style={{
                                backgroundColor: isSelected
                                  ? isCorrect
                                    ? "#ecfdf5"
                                    : "#fef2f2"
                                  : "var(--surface-color)",
                                borderColor: isSelected
                                  ? isCorrect
                                    ? "#10b981"
                                    : "#ef4444"
                                  : "var(--border-color)",
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {opt.text}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Candidate Selected
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Answer / Fill In The Blanks */}
                    {["text_area", "fill_blank"].includes(q.type) && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          Candidate Submitted Response:
                        </p>
                        <div
                          className="p-3.5 rounded-lg border text-sm font-medium leading-relaxed"
                          style={{
                            backgroundColor: "var(--surface-color)",
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {ans?.answerText || "No answer submitted by candidate."}
                        </div>
                        {q.fillBlankKeys && q.fillBlankKeys.length > 0 && (
                          <p className="text-xs text-emerald-600 font-medium">
                            ✓ Expected Answer Key: {q.fillBlankKeys.join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Monaco Coding Questions */}
                    {q.type === "coding" && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                            <Code className="w-4 h-4 text-sky-500" />
                            Candidate Submitted Monaco Code Solution:
                          </p>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
                            Language: {q.codeConfig?.language || "javascript"}
                          </span>
                        </div>

                        <CodeEditor
                          value={ans?.codeAnswer || q.codeConfig?.starterCode || "// No code written by candidate"}
                          onChange={() => {}}
                          language={q.codeConfig?.language || "javascript"}
                          readOnly={true}
                          height="320px"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Proctoring Violation Logs */}
        <Card className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Proctoring & System Violation Log
          </h3>
          {violations.length === 0 ? (
            <p className="text-xs py-2 text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> No proctoring violations recorded for this candidate submission.
            </p>
          ) : (
            <div className="space-y-2">
              {violations.map((v) => (
                <div key={v.id} className="p-3 rounded-lg border flex items-center justify-between text-xs" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{v.type.replace("_", " ")}</span>
                  </div>
                  <span style={{ color: "var(--text-muted)" }}>{new Date(v.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Manual Grading Card */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FileText className="w-4 h-4 text-sky-500" />
            Manual Score & Evaluation
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Manual Bonus / Adjustment Marks</label>
              <input
                type="number"
                value={manualScore}
                onChange={(e) => setManualScore(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border text-sm outline-none focus:border-sky-500"
                style={{
                  backgroundColor: "var(--surface2-color)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="pt-5">
              <Button onClick={handleGrade} disabled={saving}>
                {saving ? "Saving Grade..." : "Save Grade & Finalize"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
