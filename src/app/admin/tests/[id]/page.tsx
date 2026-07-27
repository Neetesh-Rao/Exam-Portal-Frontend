"use client";
import { useState, use } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  useGetTestByIdQuery,
  useUpdateTestMutation,
  usePublishTestMutation,
} from "@/redux/api/testsApi";
import { useSendBulkInvitesMutation } from "@/redux/api/invitesApi";

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading: loading } = useGetTestByIdQuery(id);
  const [updateTest, { isLoading: saving }] = useUpdateTestMutation();
  const [publishTest] = usePublishTestMutation();
  const [sendInvites, { isLoading: inviting }] = useSendBulkInvitesMutation();

  const test = data?.test;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(test?.title || "");
  const [description, setDescription] = useState(test?.description || "");

  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteResults, setInviteResults] = useState<{ token: string; email: string }[]>([]);

  const handleSave = async () => {
    try {
      await updateTest({ id, title: title || test?.title, description }).unwrap();
      setEditing(false);
    } catch (err) {
      console.error("Update test error:", err);
    }
  };

  const handlePublish = async () => {
    try {
      await publishTest(id).unwrap();
    } catch (err) {
      console.error("Publish test error:", err);
    }
  };

  const handleInvite = async () => {
    const emails = inviteEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
    try {
      const res = await sendInvites({ testId: id, candidateEmails: emails, expiresInDays: 7 }).unwrap();
      setInviteResults(res.invites || []);
    } catch (err) {
      console.error("Invite candidates error:", err);
    }
  };

  if (loading) return (
    <div>
      <AdminHeader title="Loading..." />
      <div className="p-8 max-w-4xl mx-auto"><CardSkeleton /></div>
    </div>
  );

  if (!test) return (
    <div>
      <AdminHeader title="Test Not Found" />
      <div className="p-8 text-center text-[var(--text-muted)]">This test does not exist.</div>
    </div>
  );

  const totalQuestions = (test.sections || []).reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0);

  return (
    <div>
      <AdminHeader title={test.title} subtitle={`Test #${test.id}`} />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          {test.status === "draft" && (
            <Button onClick={handlePublish}>Publish Test</Button>
          )}
          <Button variant="secondary" onClick={() => { setTitle(test.title); setDescription(test.description || ""); setEditing(true); }}>Edit Details</Button>
          <Button variant="secondary" onClick={() => setInviteModal(true)}>Invite Candidates</Button>
          <Badge variant={test.status === "published" ? "success" : "warning"}>{test.status}</Badge>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Duration</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{Math.floor((test.totalDurationSeconds || 3600) / 60)} minutes</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Pass Percentage</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{test.passPercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Total Questions</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Sections</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{test.sections?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Proctoring Settings</h3>
          <div className="flex flex-wrap gap-2">
            {test.proctoringConfig?.fullScreenRequired && <Badge variant="neutral">Fullscreen Required</Badge>}
            {test.proctoringConfig?.disableCopyPaste && <Badge variant="neutral">Copy/Paste Disabled</Badge>}
            {test.proctoringConfig?.disableRightClick && <Badge variant="neutral">Right-Click Disabled</Badge>}
            <Badge variant="neutral">Tab Switch Limit: {test.proctoringConfig?.tabSwitchLimit || 3}</Badge>
          </div>
        </Card>

        <Modal open={editing} onClose={() => setEditing(false)} title="Edit Test">
          <div className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        </Modal>

        <Modal open={inviteModal} onClose={() => { setInviteModal(false); setInviteResults([]); }} title="Invite Candidates" size="lg">
          {inviteResults.length > 0 ? (
            <div>
              <p className="text-sm text-success mb-4">✓ {inviteResults.length} invitations created!</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {inviteResults.map((inv) => (
                  <div key={inv.token} className="p-3 border border-app-border dark:border-dark-border rounded-lg">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{inv.email}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 break-all">
                      Link: {typeof window !== "undefined" ? window.location.origin : ""}/take-test/{inv.token}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => { setInviteModal(false); setInviteResults([]); }}>Done</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                label="Candidate Emails"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="Enter emails separated by commas or new lines..."
              />
              <p className="text-xs text-[var(--text-muted)]">Each candidate will receive a unique test link valid for 7 days.</p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setInviteModal(false)}>Cancel</Button>
                <Button onClick={handleInvite} loading={inviting}>Send Invitations</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
