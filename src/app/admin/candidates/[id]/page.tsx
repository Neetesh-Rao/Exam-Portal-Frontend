"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Video, Calendar, ChevronRight, FileText } from "lucide-react";

interface CandidateData {
  candidate: { id: string; name: string; email: string; phone: string | null; position: string | null; resumeUrl: string | null; source: string | null; createdAt: string };
  submissions: {
    id: string;
    status: string;
    autoScore: number;
    finalScore: number;
    totalMarks: number;
    startedAt: string;
    submittedAt: string;
    createdAt: string;
    videoRecordingUrl?: string;
    screenRecordingUrl?: string;
    test: { id: string; title: string } | null;
    violations: { id: string; type: string; createdAt: string }[];
  }[];
  invites: { id: string; status: string; expiresAt: string; token: string }[];
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/apiFetch").then(({ apiFetch }) => {
      apiFetch(`/candidates/${id}`)
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [id]);

  if (loading) return (
    <div>
      <AdminHeader title="Loading candidate profile..." />
      <div className="p-8 max-w-4xl mx-auto"><CardSkeleton /></div>
    </div>
  );

  if (!data?.candidate) return (
    <div>
      <AdminHeader title="Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">Candidate profile not found.</div>
    </div>
  );

  const { candidate, submissions = [], invites = [] } = data;

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "neutral"> = {
      completed: "success", invited: "accent" as "neutral", started: "warning", expired: "danger", in_progress: "warning", submitted: "success", auto_submitted: "danger", graded: "success"
    };
    return <Badge variant={map[s] || "neutral"}>{s.replace("_", " ")}</Badge>;
  };

  return (
    <div>
      <AdminHeader title={candidate.name} subtitle={`${candidate.email} • Candidate Profile & Test Recordings History`} />
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Candidate Details</h3>
            {candidate.resumeUrl && (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
              >
                📄 Download Resume
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Full Name</p><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{candidate.name}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Email Address</p><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{candidate.email}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Mobile Phone</p><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{candidate.phone || "—"}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Source / Pipeline</p><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{candidate.source || "Direct Onboarding"}</p></div>
          </div>
        </Card>

        {/* Test Invitations */}
        <Card>
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Test Invitations ({invites.length})</h3>
          {invites.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No invitations sent to this candidate yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-xl" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                  <div>
                    <p className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>Invite Token: {inv.token}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Expires: {new Date(inv.expiresAt).toLocaleString()}</p>
                  </div>
                  {statusBadge(inv.status)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* All Test Submissions & Full Recording History */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                All Test Submissions & Recording Archives ({submissions.length})
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Complete history of all technical tests taken by {candidate.name} with camera & screen recordings
              </p>
            </div>
          </div>

          {submissions.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No test submissions recorded for this candidate yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 border rounded-xl space-y-3 transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: "var(--surface-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{sub.test?.title || "Assessment"}</h4>
                      <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--text-muted)" }}>
                        <Calendar className="w-3.5 h-3.5 text-sky-500" />
                        Date Taken: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : sub.startedAt ? new Date(sub.startedAt).toLocaleString() : new Date(sub.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {statusBadge(sub.status)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 rounded-lg border" style={{ backgroundColor: "var(--surface2-color)", borderColor: "var(--border-color)" }}>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Score Achieved</p>
                      <p className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                        {sub.finalScore ?? sub.autoScore ?? 0} / {sub.totalMarks || 100}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Violations</p>
                      <p className={`text-lg font-extrabold ${sub.violations?.length > 0 ? "text-danger" : ""}`} style={{ color: sub.violations?.length > 0 ? undefined : "var(--text-primary)" }}>
                        {sub.violations?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Camera Video</p>
                      <p className="text-xs font-semibold text-emerald-600">
                        {sub.videoRecordingUrl ? "✓ Recorded" : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Screen Capture</p>
                      <p className="text-xs font-semibold text-sky-600">
                        {sub.screenRecordingUrl ? "✓ Recorded" : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5">
                      {sub.violations?.map((v) => (
                        <Badge key={v.id} variant="danger">{v.type.replace("_", " ")}</Badge>
                      ))}
                    </div>

                    <Link href={`/admin/submissions/${sub.id}`}>
                      <Button size="sm" className="flex items-center gap-1.5 shadow-sm">
                        <Video className="w-4 h-4" /> View Recordings & Grade <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
