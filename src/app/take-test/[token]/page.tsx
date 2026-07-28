"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Camera, Monitor, ShieldCheck } from "lucide-react";
import { useValidateInviteQuery } from "@/redux/api/invitesApi";
import { useStartSubmissionMutation } from "@/redux/api/submissionsApi";

export default function TestInstructionsPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const rawToken = Array.isArray((resolvedParams as any).token)
    ? (resolvedParams as any).token.join("")
    : (resolvedParams as any).token || "";
  const token = String(rawToken).replace(/\//g, "").trim();

  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const [cameraReady, setCameraReady] = useState(false);
  const [screenReady, setScreenReady] = useState(false);
  const [permissionsRequesting, setPermissionsRequesting] = useState(false);

  const { data, isLoading: loading, isError } = useValidateInviteQuery(token);
  const [startSubmission, { isLoading: starting }] = useStartSubmissionMutation();

  const handleDeviceSetup = async () => {
    setPermissionsRequesting(true);
    
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      (window as any).__cameraStream = camStream;
      setCameraReady(true);
    } catch (err) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        (window as any).__cameraStream = camStream;
        setCameraReady(true);
      } catch (err2) {
        alert("⚠️ Camera permission blocked. Please click the lock/settings icon in the browser URL bar to allow Camera.");
      }
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const scrStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        (window as any).__screenStream = scrStream;
        setScreenReady(true);
      }
    } catch (err) {
      setScreenReady(true);
    }

    setPermissionsRequesting(false);
  };

  const handleStart = async () => {
    if (!cameraReady) {
      alert("Please click 'Step 1: Enable Camera & Share Entire Screen' to verify device access.");
      return;
    }

    // Trigger Fullscreen on candidate click gesture
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request on click:", e);
    }

    try {
      const result = await startSubmission({ token }).unwrap();

      if (result?.alreadySubmitted || result?.expired || result?.error === "Test already completed") {
        router.push(`/take-test/${token}/submitted`);
        return;
      }

      if (result?.submission?.id) {
        router.push(`/take-test/${token}/exam?submissionId=${result.submission.id}`);
      } else {
        setError(result?.error || "Failed to initialize test submission");
      }
    } catch (err: any) {
      if (err?.data?.alreadySubmitted || err?.data?.expired || err?.data?.error === "Test already completed") {
        router.push(`/take-test/${token}/submitted`);
        return;
      }
      setError(err?.data?.error || err?.message || "Failed to start submission");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-ink dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || error || (data && (data.error || data.alreadySubmitted))) {
    if (data?.alreadySubmitted || data?.error === "Test already completed") {
      router.push(`/take-test/${token}/submitted`);
      return null;
    }

    return (
      <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Unable to Access Test</h1>
          <p className="text-sm text-[var(--text-muted)] mb-4">{error || data?.error || "Invalid test link or session expired"}</p>
          <Button variant="secondary" onClick={() => router.push(`/take-test/${token}/submitted`)}>
            View Submission Status
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { test, candidate } = data;
  const duration = Math.floor((test?.totalDurationSeconds || 3600) / 60);
  const proctoring = test?.proctoringConfig || { tabSwitchLimit: 3 };
  const isDevicesReady = cameraReady && screenReady;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/bitmax-logo.png" alt="BITMAX Technology" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{test?.title}</h1>
          <p className="text-sm text-slate-600 mt-1">Welcome, {candidate?.name}</p>
        </div>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Test Overview</h2>
          {test?.description && <p className="text-sm text-slate-600 mb-4">{test.description}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Duration</p>
              <p className="text-lg font-bold text-slate-900">{duration} minutes</p>
            </div>
            <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Tab Switch Limit</p>
              <p className="text-lg font-bold text-slate-900">{proctoring.tabSwitchLimit} max allowed</p>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-emerald-400 bg-emerald-50/70 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Step 1: Pre-Exam Device & Screen Sharing Setup</h2>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            To prevent accidental proctoring violations during the exam, please grant Camera & Screen Sharing permissions now before clicking Start Test.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Webcam & Microphone Check</span>
              </div>
              {cameraReady ? (
                <Badge variant="success">✓ Camera Active</Badge>
              ) : (
                <Badge variant="neutral">Pending</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
                <Monitor className="w-4 h-4 text-sky-600" />
                <span>Entire Screen Sharing Check</span>
              </div>
              {screenReady ? (
                <Badge variant="success">✓ Screen Sharing Active</Badge>
              ) : (
                <Badge variant="neutral">Pending</Badge>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleDeviceSetup}
            loading={permissionsRequesting}
            variant={isDevicesReady ? "secondary" : "primary"}
            className="w-full font-bold text-sm py-2.5 shadow-sm"
          >
            {isDevicesReady ? "✓ Device & Screen Verification Complete" : "🎥 Step 1: Enable Camera & Share Entire Screen"}
          </Button>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Proctoring & Assessment Rules</h2>
          <ul className="space-y-3 text-xs text-slate-700 font-medium">
            <li className="flex items-start gap-3">
              <span className="text-rose-600 font-bold">⚠️</span>
              <span>Do not switch tabs or windows during the test. Exceeding {proctoring.tabSwitchLimit} violations will automatically submit your exam.</span>
            </li>
            {proctoring.fullScreenRequired && (
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold">🖥️</span>
                <span>The exam runs in mandatory full screen mode.</span>
              </li>
            )}
            {proctoring.disableCopyPaste && (
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold">📋</span>
                <span>Copy, paste, and cut actions are disabled.</span>
              </li>
            )}
          </ul>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-semibold">
              I understand and agree to follow all test proctoring rules.
            </span>
          </label>
        </Card>

        <div className="flex justify-center pt-2">
          <Button
            onClick={handleStart}
            loading={starting}
            disabled={!agreed || !isDevicesReady}
            size="lg"
            className="px-12 w-full sm:w-auto"
          >
            Step 2: Start Proctored Exam →
          </Button>
        </div>
      </div>
    </div>
  );
}
