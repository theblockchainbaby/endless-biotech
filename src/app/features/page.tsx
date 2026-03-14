import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  FlaskConical, Scan, ShieldAlert, BarChart3, Microscope, Users,
  ArrowRight, Check, GitBranch, Bell, Layers, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features | Vessel Tracking & Lab Automation | VitrOS",
  description:
    "Track vessels from initiation to ship-out, automate subculture scheduling, scan barcodes in 3 seconds, and monitor contamination—all in one tissue culture platform.",
  keywords: [
    "lab tracking software",
    "laboratory automation software",
    "vessel management platform",
    "culture lifecycle platform",
    "plant lab command center",
    "tissue culture workflow automation",
  ],
  openGraph: {
    title: "Features | Vessel Tracking & Lab Automation | VitrOS",
    description:
      "Track vessels from initiation to ship-out, automate subculture scheduling, scan barcodes in 3 seconds, and monitor contamination—all in one tissue culture platform.",
  },
};

const CORE_FEATURES = [
  {
    icon: FlaskConical,
    title: "Vessel-Level Tracking",
    description:
      "Every vessel gets a unique ID from initiation through subculture, rooting, acclimation, and ship-out. Know exactly where every culture is in your pipeline at all times.",
    keywords: "vessel management platform",
  },
  {
    icon: Scan,
    title: "Barcode Scanning",
    description:
      "Scan vessel barcodes with your phone camera — no dedicated hardware required. Log a vessel in 3 seconds instead of 15. That's 5x faster than manual entry.",
    keywords: "lab tracking software",
  },
  {
    icon: ShieldAlert,
    title: "Contamination Analytics",
    description:
      "Spot contamination trends by cultivar, location, media type, and technician before they spread. Real-time alerts when contamination rates spike above your thresholds.",
    keywords: "contamination tracking",
  },
  {
    icon: BarChart3,
    title: "Production Pipeline",
    description:
      "See every stage of production at a glance. Know exactly how many vessels are in initiation, multiplication, rooting, and acclimation — broken down by cultivar.",
    keywords: "culture lifecycle platform",
  },
  {
    icon: Microscope,
    title: "Media Management",
    description:
      "Track media recipes, prep schedules, batch quality, and inventory levels. Assign media to vessels and trace any issues back to the batch.",
    keywords: "lab inventory software",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Role-based access control with Admin, Manager, Lead Tech, Tech, and Media Maker roles. Full activity audit logs for every action every team member takes.",
    keywords: "laboratory automation software",
  },
];

const ADDITIONAL_FEATURES = [
  { icon: GitBranch, title: "Lineage Trees", description: "Trace any vessel back to its mother plant through a visual family tree. Full parent-child lineage tracking across generations." },
  { icon: Layers, title: "Batch Operations", description: "Select multiple vessels and advance stages, update health, or dispose in bulk. Process hundreds of vessels in seconds." },
  { icon: Bell, title: "Smart Notifications", description: "Get alerted when vessels are due for subculture, when contamination spikes, or when stages are overdue." },
  { icon: Smartphone, title: "Mobile-First Design", description: "Built for the lab floor. Scan barcodes, log health checks, and update vessels from your phone or tablet." },
  { icon: BarChart3, title: "Demand Forecasting", description: "Project vessel output weeks ahead based on your pipeline. Plan production around customer orders and seasonal demand." },
  { icon: ShieldAlert, title: "Full Audit Trail", description: "Every action logged with who, what, and when. Exportable reports for compliance, client deliverables, and internal review." },
];

export default function FeaturesPage() {
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
            Every Tool Your Tissue Culture Lab Needs
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            VitrOS is a vessel management platform that replaces spreadsheets, paper logs, and disconnected tools
            with one integrated laboratory automation software built for tissue culture.
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

      {/* Core Features */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Core Platform Capabilities
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-14 max-w-2xl mx-auto">
            Lab tracking software designed for every step of the tissue culture workflow — from initiation to ship-out.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_FEATURES.map((f) => (
              <div key={f.title} className="bg-background rounded-xl border p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            And That&apos;s Just the Start
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-14 max-w-2xl mx-auto">
            Tissue culture workflow automation features that grow with your lab.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADDITIONAL_FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Efficiency */}
      <section className="py-16 md:py-24 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">5x Faster</h2>
          <p className="text-2xl font-medium mb-3 opacity-90">15 seconds → 3 seconds per vessel</p>
          <p className="text-lg opacity-75 max-w-xl mx-auto">
            VitrOS cuts vessel logging time by 80%, giving your team hours back every day.
            That&apos;s the power of a plant lab command center built for speed.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to see lifecycle tracking for your tissue lab?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start free or get a personalized demo of every feature.
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
