"use client";
import { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("BITMAX Technology (P) Ltd");
  const [tagline, setTagline] = useState("STEP AHEAD");
  const [website, setWebsite] = useState("https://bitmax-technology.vercel.app");
  const [adminEmail, setAdminEmail] = useState("admin@bitmaxtech.com");
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    {
      id: "company",
      label: "Organization Profile",
      content: (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Bitmax Company Profile</h3>
          <div className="space-y-4 max-w-md">
            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-500 font-medium">
                Settings saved successfully!
              </div>
            )}
            <Input label="Organization Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Input label="Company Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            <Input label="Official Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Official Logo</label>
              <div className="flex items-center gap-4 p-3 border border-app-border dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface">
                <img src="/bitmax-logo.png" alt="BITMAX Technology (P) Ltd" className="h-12 w-auto object-contain" />
              </div>
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} loading={saving}>Save Organization Profile</Button>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: "team",
      label: "Recruiter & Admin Access",
      content: (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Bitmax Assessment Team</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Admin authentication is controlled via server environment variables (.env)</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { name: "Bitmax Admin", email: adminEmail, role: "Super Admin", status: "Active (via .env)" },
              { name: "Bitmax Technical Recruiter", email: "recruiter@bitmaxtech.com", role: "Recruiter", status: "Active" },
            ].map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 border border-app-border dark:border-dark-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{member.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">{member.role}</Badge>
                  <span className="text-xs text-emerald-500 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{member.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    {
      id: "proctoring",
      label: "Proctoring Defaults",
      content: (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Bitmax Security & Proctoring Defaults</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">Default enforcement policies applied to candidate technical assessments.</p>
          <div className="space-y-4 max-w-md">
            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-500 font-medium">
                Proctoring defaults saved!
              </div>
            )}
            <Input
              label="Allowed Tab Switches Before Auto-Submit"
              type="number"
              value={tabSwitchLimit}
              onChange={(e) => setTabSwitchLimit(Number(e.target.value))}
            />
            <div className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Force Full Screen Mode</p>
                <p className="text-xs text-[var(--text-muted)]">Require candidate to remain in full screen</p>
              </div>
              <Badge variant="accent">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Block Clipboard (Copy/Paste)</p>
                <p className="text-xs text-[var(--text-muted)]">Disable copy-paste in coding and text fields</p>
              </div>
              <Badge variant="accent">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-app-border dark:border-dark-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Webcam Snapshot Capture</p>
                <p className="text-xs text-[var(--text-muted)]">Periodic proctoring photos during assessment</p>
              </div>
              <Badge variant="accent">Enabled</Badge>
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} loading={saving}>Save Proctoring Defaults</Button>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: "system",
      label: "System Status & Environment",
      content: (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Bitmax Portal Environment Configuration</h3>
          <div className="space-y-3">
            {[
              { key: "Organization", value: "BITMAX Technology (P) Ltd", badge: "Primary Scope" },
              { key: "Portal Mode", value: "Single-Tenant Dedicated Enterprise", badge: "Single Company" },
              { key: "Admin Authentication", value: "Environment Variables (.env)", badge: "Secure" },
              { key: "Database Engine", value: "MongoDB Atlas Cluster", badge: "Connected" },
              { key: "Public Registration", value: "Disabled (Internal System Only)", badge: "Enforced" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 border border-app-border dark:border-dark-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.key}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.value}</p>
                </div>
                <Badge variant="neutral">{item.badge}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader title="Settings" subtitle="BITMAX Technology (P) Ltd assessment portal preferences" />
      <div className="p-8 max-w-5xl mx-auto">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
