import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pricing | VitrOS Lab Management Software",
  description:
    "Simple, scalable pricing for tissue culture labs. Starter from $199/mo with vessel tracking, barcode scanning, dashboards, and more. Try VitrOS today.",
  keywords: [
    "lab workflow software",
    "tissue tracking software",
    "lab inventory software",
    "lab management software pricing",
    "tissue culture software cost",
  ],
  openGraph: {
    title: "Pricing | VitrOS Lab Management Software",
    description:
      "Simple, scalable pricing for tissue culture labs. Starter from $199/mo with vessel tracking, barcode scanning, dashboards, and more.",
  },
};

const PLANS = [
  {
    name: "Starter",
    price: 199,
    contactUs: false,
    description: "For small labs getting started with lab workflow software",
    features: [
      "Up to 2,000 active vessels",
      "5 team members",
      "Barcode scanning",
      "Vessel tracking & stage pipeline",
      "Basic contamination tracking",
      "Media recipe management",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: null,
    contactUs: true,
    description: "For growing labs that need tissue tracking software with advanced analytics",
    popular: true,
    features: [
      "Up to 10,000 active vessels",
      "15 team members",
      "Everything in Starter, plus:",
      "Advanced analytics & dashboards",
      "Contamination trend analysis",
      "Production pipeline views",
      "Demand forecasting",
      "Lineage tree tracking",
      "Batch operations",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    contactUs: true,
    description: "For large-scale operations needing full lab inventory software",
    features: [
      "Unlimited vessels",
      "Unlimited team members",
      "Everything in Pro, plus:",
      "Custom integrations & API access",
      "Dedicated account manager",
      "SLA guarantee (99.9% uptime)",
      "On-site training & onboarding",
      "Custom reporting",
      "SSO / advanced security",
    ],
  },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes — every plan comes with a 30-day free trial. No credit card required to start.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle.",
  },
  {
    q: "What counts as an 'active vessel'?",
    a: "Any vessel that hasn't been disposed or shipped out. Archived vessels don't count toward your limit.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes — save 20% when you pay annually. Contact us for details.",
  },
  {
    q: "What if I need more than 10,000 vessels but don't need Enterprise features?",
    a: "Reach out to us — we can customize a plan based on your vessel count and team size.",
  },
];

export default function PricingPage() {
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
            <Link href="/blog" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Blog</Button></Link>
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
            Simple, Scalable Pricing for Every Lab
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Lab workflow software that grows with your operation. Every plan includes vessel tracking,
            barcode scanning, and real-time dashboards. Starter from $199/mo — Pro and Enterprise priced to fit your lab.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 md:pb-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border bg-background p-8 flex flex-col ${
                plan.popular ? "border-primary shadow-lg ring-1 ring-primary/20 relative" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                {plan.contactUs ? (
                  <span className="text-2xl font-bold text-muted-foreground">Contact Us</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">${plan.price!.toLocaleString()}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </>
                )}
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.contactUs ? (
                  <a href="mailto:support@vitroslabs.com">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      Contact Us
                    </Button>
                  </a>
                ) : (
                  <Link href={`/signup?plan=${plan.name.toLowerCase()}`}>
                    <Button className="w-full" variant="outline">
                      Start Free Trial
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Founding Partner */}
      <section className="pb-16 md:pb-24 px-4">
        <div className="max-w-2xl mx-auto">
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
            <Link href="/signup?plan=starter&founding=true">
              <Button>Claim Founding Partner Rate <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-background rounded-lg border p-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-muted-foreground text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Start tracking today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Try VitrOS free for 30 days. No credit card required. Includes full access to tissue tracking software,
            lab inventory software, and all platform features.
          </p>
          <Link href="/signup">
            <Button size="lg">Start Free Trial <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Link>
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
