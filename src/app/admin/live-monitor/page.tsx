"use client";

import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { RefreshCw, Eye, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetLiveMonitorSessionsQuery } from "@/redux/api/liveMonitorApi";

export default function LiveMonitorPage() {
  const [activeStreamSession, setActiveStreamSession] = useState<any | null>(null);
  const [streamSnapshots, setStreamSnapshots] = useState<{ timestamp: string; imageUrl: string; event?: string }[]>([]);

  const { data, isLoading: loading, refetch, isFetching } = useGetLiveMonitorSessionsQuery(undefined, {
    pollingInterval: 5000,
  });

  const sessions: any[] = data?.sessions || [];

  const openStreamModal = async (session: any) => {
    setActiveStreamSession(session);
    try {
      const { apiFetch } = await import("@/lib/apiFetch");
      const res = await apiFetch(`/submissions/${session.id}`);
      const data = await res.json();
      setStreamSnapshots(data.submission?.recordingSnapshots || []);
    } catch (e) {
      console.error("Failed to fetch stream snapshots", e);
    }
  };

  const handleManualRefresh = () => {
    refetch();
  };

  const getStatusBadge = (status: string, violations: number, limit: number) => {
    if (violations >= limit || status === "auto_submitted") {
      return <Badge variant="danger">FLAGGED / BLOCKED</Badge>;
    }
    if (status === "in_progress") {
      return <Badge variant="accent">LIVE IN PROGRESS</Badge>;
    }
    if (status === "submitted" || status === "graded") {
      return <Badge variant="neutral">COMPLETED</Badge>;
    }
    return <Badge variant="neutral">{status}</Badge>;
  };

  return (
    <div>
      <AdminHeader
        title="Live Proctoring Monitor"
        subtitle="Real-time candidate test tracking, violation feeds, and active session alerts"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Real-Time Sync Active</p>
              <p className="text-xs text-[var(--text-muted)]">Monitoring candidate screens, tab switches, & camera events</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualRefresh}
              loading={isFetching}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </Card>

        {loading ? (
          <Card>
            <TableSkeleton />
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <EmptyState
              title="No active test sessions"
              description="Candidates currently taking tests will show up here in real time with violation counts and live metrics."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--surface2-color)" }} className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Assessment Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Proctoring Violations</th>
                  <th className="px-6 py-4">Started At</th>
                  <th className="px-6 py-4 text-right">Live Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <AnimatePresence>
                  {sessions.map((session: any) => {
                    const isFlagged = session.violationCount >= session.tabSwitchLimit;

                    return (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ borderBottom: "1px solid var(--border-color)", transition: "background .15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface2-color)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[var(--text-primary)]">{session.candidateName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{session.candidateEmail}</p>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">{session.testTitle}</td>
                        <td className="px-6 py-4">
                          {getStatusBadge(session.status, session.violationCount, session.tabSwitchLimit)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                session.violationCount > 0
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "text-[var(--text-secondary)] border-app-border"
                              }`}
                              style={session.violationCount === 0 ? { backgroundColor: "var(--surface2-color)" } : {}}
                            >
                              {session.violationCount} / {session.tabSwitchLimit}
                            </span>
                            {session.lastViolationType && (
                              <span className="text-xs text-[var(--text-muted)] italic">
                                ({session.lastViolationType.replace("_", " ")})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                          {session.startedAt ? new Date(session.startedAt).toLocaleTimeString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openStreamModal(session)}
                            className="text-xs"
                          >
                            <Video className="w-3.5 h-3.5 mr-1" />
                            Live Camera Feed
                          </Button>
                          <a
                            href={`/admin/submissions/${session.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                            style={{
                              color: "var(--text-primary)",
                              borderColor: "var(--border-color)",
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--surface2-color)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Logs
                          </a>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </Card>
        )}

        <Modal
          open={!!activeStreamSession}
          onClose={() => setActiveStreamSession(null)}
          title={`Live Proctoring Video Feed — ${activeStreamSession?.candidateName}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-app-border pb-2">
              <span>Assessment: {activeStreamSession?.testTitle}</span>
              <span className="font-semibold text-danger">Violations: {activeStreamSession?.violationCount} / {activeStreamSession?.tabSwitchLimit}</span>
            </div>

            <div className="relative bg-black rounded-xl aspect-video border border-neutral-800 flex items-center justify-center overflow-hidden">
              {streamSnapshots.length > 0 ? (
                streamSnapshots[streamSnapshots.length - 1].imageUrl.startsWith("data:video") ? (
                  <video
                    src={streamSnapshots[streamSnapshots.length - 1].imageUrl}
                    controls
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={streamSnapshots[streamSnapshots.length - 1].imageUrl}
                    alt="Live Camera Snapshot"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="text-center p-6 text-neutral-400 text-xs">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Webcam & Live Screen stream active. Stream feeds update automatically.</p>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>Live Camera & Screen Stream</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" onClick={() => setActiveStreamSession(null)}>
                Close Feed
              </Button>
              <a href={`/admin/submissions/${activeStreamSession?.id}`}>
                <Button>Open Full Submission Review →</Button>
              </a>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
