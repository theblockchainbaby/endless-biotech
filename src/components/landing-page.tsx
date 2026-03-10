"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical, Scan, ShieldAlert, BarChart3, Microscope, Users,
  FileText, AlertTriangle, Eye, Clock, Check, ArrowRight,
  Leaf, TestTubes, LineChart, Upload,
} from "lucide-react";
import { WordRotate } from "@/components/magicui/word-rotate";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { MagicCard } from "@/components/magicui/magic-card";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Marquee } from "@/components/magicui/marquee";
import { Particles } from "@/components/magicui/particles";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const PROBLEMS = [
  {
    icon: FileText,
    title: "Paper & Spreadsheet Chaos",
    description: "Hours lost every week tracking vessels manually. Data siloed in notebooks no one can search.",
  },
  {
    icon: AlertTriangle,
    title: "Contamination Blind Spots",
    description: "No early warning system. You find out about contamination trends weeks too late.",
  },
  {
    icon: Eye,
    title: "Zero Production Visibility",
    description: "Can't answer 'how many vessels are in Stage 2?' without counting by hand.",
  },
];

const FEATURES = [
  {
    icon: FlaskConical,
    title: "Vessel Tracking",
    description: "Barcode-based tracking from initiation through every subculture to hardening and ship-out.",
    highlight: true,
  },
  {
    icon: Scan,
    title: "Barcode Scanning",
    description: "Scan vessel barcodes with your phone camera. No dedicated hardware required.",
  },
  {
    icon: ShieldAlert,
    title: "Contamination Analytics",
    description: "Spot contamination trends by cultivar, location, and media type before they spread.",
  },
  {
    icon: BarChart3,
    title: "Production Pipeline",
    description: "See every stage of production at a glance. Know exactly what's ready and what's coming.",
  },
  {
    icon: Microscope,
    title: "Media Management",
    description: "Track media recipes, prep schedules, and batch quality all in one place.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Role-based access control with full activity audit logs for every team member.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: 499,
    description: "For small labs getting started",
    features: [
      "Up to 2,000 active vessels",
      "5 team members",
      "Barcode scanning",
      "Basic contamination tracking",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 1299,
    description: "For growing labs that need analytics",
    popular: true,
    features: [
      "Up to 10,000 active vessels",
      "15 team members",
      "Advanced analytics & reports",
      "Contamination trend analysis",
      "Production pipeline views",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: 2499,
    description: "For large-scale operations",
    features: [
      "Unlimited vessels",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-site training",
    ],
  },
];

const VERTICALS = [
  { icon: Leaf, text: "Tissue Culture Labs" },
  { icon: FlaskConical, text: "Plant Propagation" },
  { icon: TestTubes, text: "Research Facilities" },
  { icon: LineChart, text: "Commercial Nurseries" },
  { icon: Microscope, text: "Cannabis Cultivation" },
  { icon: Upload, text: "Ag Biotech" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Image src="/logo.png" alt="VitrOS" width={36} height={36} className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tight">VitrOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="#pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 md:py-40 px-4 overflow-hidden">
        <Particles className="absolute inset-0" quantity={40} size={0.3} />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
              Purpose-built for tissue culture labs
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            Tissue Culture Management,{" "}
            <WordRotate
              words={["Modernized", "Automated", "Simplified", "Streamlined"]}
              className="text-primary"
              duration={2500}
            />
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Track every vessel, prevent contamination, and scale your lab with
            confidence. VitrOS replaces paper logs and spreadsheets with a
            platform built for the way you work.
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <ShimmerButton className="w-full sm:w-auto">
                Start Free <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof Marquee */}
      <section className="py-8 border-y bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Built for teams across
          </p>
          <Marquee pauseOnHover duration="30s" className="[--gap:2rem]">
            {VERTICALS.map((v) => (
              <div key={v.text} className="flex items-center gap-2 text-muted-foreground/70 px-4">
                <v.icon className="h-4 w-4" />
                <span className="text-sm font-medium whitespace-nowrap">{v.text}</span>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Problems */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Sound familiar?
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="text-muted-foreground text-lg">
              Every tissue culture lab hits the same walls as they grow.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {PROBLEMS.map((problem) => (
              <motion.div key={problem.title} variants={fadeUp} transition={{ duration: 0.5 }}>
                <MagicCard className="h-full" gradientColor="oklch(0.60 0.20 30)" gradientOpacity={0.08}>
                  <div className="p-6">
                    <problem.icon className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{problem.title}</h3>
                    <p className="text-muted-foreground text-sm">{problem.description}</p>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Everything your lab needs
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="text-muted-foreground text-lg">
              From initiation to ship-out — one platform for the entire workflow.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} transition={{ duration: 0.5 }}>
                <MagicCard className="h-full relative">
                  {feature.highlight && <BorderBeam size={150} duration={10} />}
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Efficiency stat */}
      <section className="py-20 md:py-28 px-4 bg-primary text-primary-foreground relative overflow-hidden">
        <Particles className="absolute inset-0 opacity-20" quantity={30} color="#ffffff" size={0.5} />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Clock className="h-12 w-12 mx-auto mb-6 opacity-80" />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="text-5xl md:text-8xl font-bold mb-4">
              <NumberTicker value={5} />x Faster
            </div>
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
            <p className="text-2xl md:text-3xl font-medium mb-3 opacity-90">
              <NumberTicker value={15} /> seconds &rarr; <NumberTicker value={3} /> seconds per vessel
            </p>
          </motion.div>
          <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="text-lg opacity-75 max-w-xl mx-auto">
            Real results from a real lab. VitrOS cuts vessel logging time by 80%,
            giving your team hours back every single day.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 px-4 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="text-muted-foreground text-lg">
              Start free. Upgrade when you&apos;re ready.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {PRICING.map((tier) => (
              <motion.div key={tier.name} variants={fadeUp} transition={{ duration: 0.5 }}>
                <MagicCard className={`h-full relative ${tier.popular ? "shadow-lg" : ""}`}>
                  {tier.popular && <BorderBeam size={200} duration={8} />}
                  <div className="p-8">
                    {tier.popular && (
                      <div className="flex justify-center mb-4">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        $<NumberTicker value={tier.price} delay={0.3} />
                      </span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <Link href="/signup">
                      {tier.popular ? (
                        <ShimmerButton className="w-full mb-6">Get Started</ShimmerButton>
                      ) : (
                        <Button className="w-full mb-6" variant="outline">
                          Get Started
                        </Button>
                      )}
                    </Link>
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 px-4 bg-muted/30 overflow-hidden">
        <Particles className="absolute inset-0" quantity={25} size={0.3} />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to modernize your lab?
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="text-lg text-muted-foreground mb-8">
            Join labs already using VitrOS to track vessels, prevent contamination, and scale production.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
            <Link href="/signup">
              <ShimmerButton>
                Start Free <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Image src="/logo.png" alt="VitrOS" width={28} height={28} className="w-7 h-7" />
            <span className="font-semibold">VitrOS Labs</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VitrOS Labs. Powered by Caipher.
          </p>
        </div>
      </footer>
    </div>
  );
}
