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
  { icon: Microscope, text: "Horticulture & Biotech" },
  { icon: Upload, text: "Ag Biotech" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VitrOS" width={500} height={488} className="h-12 w-auto" />
            <Image src="/logo-text.png" alt="VitrOS" width={573} height={155} className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/features">
              <Button variant="ghost" size="sm">Features</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/blog" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link href="/demo" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Demo</Button>
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
            The Operating System for{" "}
            <span className="inline">
              Tissue Culture{" "}
              <WordRotate
                words={["Labs", "Operations", "Teams", "Production"]}
                className="text-primary inline"
                duration={2500}
              />
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            The lab management software built for tissue culture. Track every
            vessel, manage your lab inventory, and streamline workflows —
            VitrOS replaces paper logs and spreadsheets so you can scale with confidence.
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
              30-day free trial. Upgrade when you&apos;re ready.
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
              <motion.div key={tier.name} variants={fadeUp} transition={{ duration: 0.5 }} className="h-full">
                <MagicCard className={`h-full relative ${tier.popular ? "shadow-lg" : ""}`}>
                  {tier.popular && <BorderBeam size={200} duration={8} />}
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex justify-center mb-4 h-6">
                      {tier.popular && (
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-1 text-center">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">{tier.description}</p>
                    <div className="mb-6 text-center">
                      <span className="text-4xl font-bold">
                        $<NumberTicker value={tier.price} delay={0.3} />
                      </span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <Link href={`/signup?plan=${tier.name.toLowerCase()}`}>
                        {tier.popular ? (
                          <ShimmerButton className="w-full">Get Started</ShimmerButton>
                        ) : (
                          <Button className="w-full" variant="outline">
                            Get Started
                          </Button>
                        )}
                      </Link>
                    </div>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Founding Partner */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="relative rounded-xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                Limited — 1 spot remaining
              </Badge>
              <h3 className="text-xl font-bold mt-1 mb-2">Founding Partner Program</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Be one of our first 3 customers and lock in{" "}
                <span className="font-bold text-foreground">$99/mo for the first 3 months, no matter which plan you choose.</span>{" "}
                In exchange, we ask for a short case study and testimonial.
              </p>
              <div className="flex justify-center">
                <Link href="/signup?plan=starter&founding=true">
                  <ShimmerButton>
                    Claim Founding Partner Rate <ArrowRight className="h-4 w-4" />
                  </ShimmerButton>
                </Link>
              </div>
            </div>
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
          <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center">
            <Link href="/signup">
              <ShimmerButton>
                Start Free <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
            </Link>
          </motion.div>
        </motion.div>
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
