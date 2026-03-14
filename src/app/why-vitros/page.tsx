import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, Scan, ShieldAlert, Clock, BarChart3, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Why VitrOS | Modern Software for Plant Propagation Labs",
  description:
    "Tired of outdated lab software? VitrOS replaces spreadsheets, paper logs, and legacy systems with automated tracking built for tissue culture operations.",
  keywords: [
    "automated plant propagation",
    "tissue culture equipment",
    "plant propagation automation",
    "tissue culture lab software",
    "lab management software",
  ],
  openGraph: {
    title: "Why VitrOS | Modern Software for Plant Propagation Labs",
    description:
      "Tired of outdated lab software? VitrOS replaces spreadsheets, paper logs, and legacy systems with automated tracking built for tissue culture operations.",
  },
};

const PAIN_POINTS = [
  {
    icon: FileText,
    problem: "Paper logs and spreadsheets",
    solution: "Digital vessel tracking with barcode scanning",
    detail:
      "Every lab starts on paper or Excel. It works until it doesn't — lost notebooks, unsearchable data, no real-time visibility. VitrOS gives every vessel a digital identity from day one.",
  },
  {
    icon: ShieldAlert,
    problem: "Contamination found too late",
    solution: "Real-time contamination analytics and alerts",
    detail:
      "Most labs discover contamination trends weeks after the damage is done. VitrOS tracks contamination by cultivar, location, media batch, and technician — and alerts you when rates spike.",
  },
  {
    icon: Clock,
    problem: "No idea what's coming next week",
    solution: "Demand forecasting and production pipeline",
    detail:
      "When you can't see your pipeline, you can't plan. VitrOS shows you exactly how many vessels are in each stage, projects output weeks ahead, and ties production to customer orders.",
  },
  {
    icon: Layers,
    problem: "Slow, manual data entry",
    solution: "3-second barcode scanning from any phone",
    detail:
      "Manual vessel logging takes ~15 seconds per vessel. Multiply that by hundreds or thousands of vessels per day. VitrOS cuts that to 3 seconds with phone-based barcode scanning — no dedicated hardware required.",
  },
];

const COMPARISONS = [
  { label: "Spreadsheets", issues: ["No real-time data", "Version conflicts", "No barcode support", "Manual everything"] },
  { label: "Paper Logs", issues: ["Unsearchable", "Lost notebooks", "No analytics", "No audit trail"] },
  { label: "Custom Software", issues: ["Developer dependency", "No updates", "No support", "Breaks on OS upgrades"] },
  { label: "VitrOS", wins: ["Real-time vessel tracking", "Phone-based scanning", "Built-in analytics", "Always up to date"] },
];

export default function WhyVitrOSPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="VitrOS" width={500} height={488} className="h-10 w-auto" />
            <Image src="/logo-text.png" alt="VitrOS" width={573} height={155} className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/features"><Button variant="ghost" size="sm">Features</Button></Link>
            <Link href="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link href="/demo" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Demo</Button></Link>
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/signup"><Button size="sm">Start Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Built for Labs That Have Outgrown Spreadsheets
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Most tissue culture labs rely on paper, Excel, or aging custom software that can&apos;t keep up.
            VitrOS is modern plant propagation automation software designed for how labs actually operate today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Free <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">See a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points → Solutions */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            The Problems We Solve
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-14 max-w-2xl mx-auto">
            Automated plant propagation starts with the right software.
            Here&apos;s what labs tell us they were dealing with before VitrOS.
          </p>
          <div className="space-y-8">
            {PAIN_POINTS.map((p) => (
              <div key={p.problem} className="bg-background rounded-xl border p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <p.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-lg line-through text-muted-foreground">{p.problem}</h3>
                      <ArrowRight className="h-4 w-4 text-primary hidden sm:block" />
                      <h3 className="font-semibold text-lg text-primary">{p.solution}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-14">
            How VitrOS Compares
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPARISONS.map((c) => (
              <div
                key={c.label}
                className={`rounded-xl border p-6 ${
                  c.wins ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""
                }`}
              >
                <h3 className={`font-bold text-lg mb-4 ${c.wins ? "text-primary" : ""}`}>{c.label}</h3>
                <ul className="space-y-2">
                  {(c.issues || c.wins || []).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      {c.wins ? (
                        <span className="text-primary mt-0.5">&#10003;</span>
                      ) : (
                        <span className="text-destructive mt-0.5">&#10007;</span>
                      )}
                      <span className={c.wins ? "" : "text-muted-foreground"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Who Uses VitrOS
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-12 max-w-2xl mx-auto">
            Any lab that propagates plants at scale — whether tissue culture, nursery propagation, or research.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-background rounded-xl border p-6 text-center">
              <Scan className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Tissue Culture Labs</h3>
              <p className="text-muted-foreground text-sm">
                Commercial TC labs running thousands of vessels through multi-stage pipelines.
              </p>
            </div>
            <div className="bg-background rounded-xl border p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Large Nurseries</h3>
              <p className="text-muted-foreground text-sm">
                High-throughput propagation operations that need to track millions of jars and plugs.
              </p>
            </div>
            <div className="bg-background rounded-xl border p-6 text-center">
              <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Research Facilities</h3>
              <p className="text-muted-foreground text-sm">
                University and corporate R&D labs that need rigorous tracking and audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to upgrade from spreadsheets?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start free, see results in your first week. VitrOS is the plant propagation automation
            platform your lab has been waiting for.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Free <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">Get a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="VitrOS" width={100} height={67} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground">Features</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/demo" className="hover:text-foreground">Demo</Link>
            <Link href="/why-vitros" className="hover:text-foreground">Why VitrOS</Link>
          </div>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} VitrOS Labs</p>
        </div>
      </footer>
    </div>
  );
}
