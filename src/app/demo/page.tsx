import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Clock, Scan, BarChart3, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Get a Demo | VitrOS Tissue Culture Lab Software",
  description:
    "See how VitrOS replaces spreadsheets and legacy systems with modern vessel tracking, barcode scanning, and real-time dashboards. Book a demo in 30 seconds.",
  keywords: [
    "lab sample tracking system",
    "tissue culture tools",
    "plant lab OS",
    "tissue culture lab software demo",
    "lab management demo",
  ],
  openGraph: {
    title: "Get a Demo | VitrOS Tissue Culture Lab Software",
    description:
      "See how VitrOS replaces spreadsheets and legacy systems with modern vessel tracking, barcode scanning, and real-time dashboards.",
  },
};

const DEMO_HIGHLIGHTS = [
  {
    icon: Scan,
    title: "Barcode Scanning",
    description: "Watch a vessel get logged in 3 seconds flat — no dedicated hardware, just your phone camera.",
  },
  {
    icon: BarChart3,
    title: "Production Pipeline",
    description: "See your entire operation in one view — every stage, every cultivar, every vessel accounted for.",
  },
  {
    icon: ShieldAlert,
    title: "Contamination Tracking",
    description: "Real-time contamination analytics that spot trends before they become outbreaks.",
  },
  {
    icon: Clock,
    title: "Demand Forecasting",
    description: "Project vessel output weeks ahead based on your actual pipeline data and order schedule.",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="VitrOS" width={500} height={488} className="h-14 w-auto" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/features"><Button variant="ghost" size="sm">Features</Button></Link>
            <Link href="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link href="/blog" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Blog</Button></Link>
            <Link href="/demo"><Button variant="ghost" size="sm">Demo</Button></Link>
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/signup"><Button size="sm">Start Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            See VitrOS in Action
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            VitrOS is the lab sample tracking system that replaces spreadsheets, paper logs, and legacy
            software with modern tissue culture tools built for how labs actually work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="mailto:support@vitroslabs.com?subject=VitrOS Demo Request">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Schedule a Live Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Video Walkthrough */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">
            Watch VitrOS in Action
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-10 max-w-2xl mx-auto">
            See how tissue culture labs use VitrOS to track vessels, manage cultivars, and monitor contamination — all in under two minutes.
          </p>
          <div className="aspect-video rounded-xl overflow-hidden border">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/SZJQchXmCtU"
              title="VitrOS Demo — Tissue Culture Lab Management Software"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Try It Now */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">
            Try the Demo Yourself
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-10 max-w-2xl mx-auto">
            No signup required. Log into our demo environment and explore the full plant lab OS
            with pre-loaded data from a real tissue culture workflow.
          </p>
          <div className="bg-background rounded-xl border p-8 max-w-lg mx-auto">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Demo Login</p>
                <code className="text-sm bg-muted px-3 py-2 rounded block">demo@vitros.app</code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Password</p>
                <code className="text-sm bg-muted px-3 py-2 rounded block">demo1234</code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Quick PIN</p>
                <code className="text-sm bg-muted px-3 py-2 rounded block">0000</code>
              </div>
              <Link href="/login" className="block mt-6">
                <Button className="w-full">Open Demo <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll See */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">
            What You&apos;ll See in the Demo
          </h2>
          <p className="text-muted-foreground text-lg text-center mb-14 max-w-2xl mx-auto">
            A fully loaded lab sample tracking system with real cultivar data, vessel pipelines, and analytics.
          </p>
          <div className="grid sm:grid-cols-2 gap-8">
            {DEMO_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <h.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{h.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{h.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo CTA */}
      <section className="py-16 md:py-24 px-4 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Want a Personalized Walkthrough?
          </h2>
          <p className="text-lg opacity-90 mb-4">
            We&apos;ll set up a demo environment with your cultivars, your stages, and your data.
            See exactly how VitrOS fits your operation.
          </p>
          <ul className="inline-flex flex-col gap-2 text-left mb-8">
            <li className="flex items-center gap-2"><Check className="h-4 w-4" /> 30-minute live walkthrough</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Your cultivars pre-loaded</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4" /> No commitment required</li>
          </ul>
          <div>
            <a href="mailto:support@vitroslabs.com?subject=VitrOS Demo Request&body=Hi, I'd like to schedule a personalized demo of VitrOS for my lab.">
              <Button size="lg" variant="secondary">
                Schedule a Demo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/why-vitros" className="hover:text-foreground transition-colors">Why VitrOS</Link></li>
                <li><a href="mailto:support@vitroslabs.com" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Start Free</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Built For</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tissue Culture Labs</li>
                <li>Plant Propagation</li>
                <li>Commercial Nurseries</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <Image src="/logo.png" alt="VitrOS" width={100} height={67} className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} VitrOS Labs. Powered by Caipher. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
