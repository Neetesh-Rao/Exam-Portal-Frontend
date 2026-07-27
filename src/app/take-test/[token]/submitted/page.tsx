"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function TestSubmittedPage() {
  return (
    <div className="min-h-screen bg-app-bg-subtle dark:bg-app-text flex items-center justify-center p-4">
      <Card className="max-w-md text-center space-y-4">
        <div className="flex justify-center mb-2">
          <img src="/bitmax-logo.png" alt="BITMAX Technology" className="h-8 w-auto object-contain" />
        </div>
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 text-3xl font-bold">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Test Completed</h1>
        <p className="text-sm text-[var(--text-muted)]">
          This test session has been completed and submitted. Your responses and proctoring logs have been recorded for BITMAX Technology evaluation.
        </p>

        <div className="p-4 bg-app-bg-subtle dark:bg-dark-surface rounded-lg text-left text-xs space-y-2 text-[var(--text-secondary)] border border-app-border dark:border-dark-border">
          <p className="font-semibold text-[var(--text-primary)]">What happens next?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Your answers are being evaluated by our assessment engine.</li>
            <li>Proctoring video and snapshot logs have been stored securely.</li>
            <li>BITMAX Technology recruitment team will contact you regarding next steps.</li>
          </ul>
        </div>

        <Button variant="secondary" onClick={() => window.close()} className="w-full">
          Close Window
        </Button>
      </Card>
    </div>
  );
}
