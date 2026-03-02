"use client";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-4 text-center">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-primary-foreground"
            >
              <path d="M7 20h10" />
              <path d="M10 20c5.5-2.5.8-6.4 3-10" />
              <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
              <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">VitrOS</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Enterprise Tissue Culture Management
        </p>
        <div className="rounded-lg bg-muted/50 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;re finalizing pricing and onboarding. Access will be available shortly.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Interested? Contact us at{" "}
          <a href="mailto:yorksims@gmail.com" className="underline hover:text-foreground">
            yorksims@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
