"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const isFoundingPartner = searchParams.get("founding") === "true";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [labName, setLabName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          organizationName: labName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please go to login.");
        setLoading(false);
        return;
      }

      // If a plan was selected from pricing, redirect to checkout
      if (selectedPlan && selectedPlan !== "free") {
        try {
          const checkoutRes = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: selectedPlan,
              ...(isFoundingPartner && { coupon: process.env.NEXT_PUBLIC_STRIPE_FOUNDING_COUPON_ID || "UEceJm3L" }),
            }),
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutData.url) {
            window.location.href = checkoutData.url;
            return;
          }
        } catch {
          // Fall through to onboarding if checkout fails
        }
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-4">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image src="/logo.png" alt="VitrOS" width={500} height={488} className="h-14 w-auto" />
        </div>
        <p className="text-center text-muted-foreground mb-6">
          Start managing your tissue culture lab
        </p>

        {isFoundingPartner && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 text-sm p-3 mb-4 text-center">
            <span className="font-semibold text-primary">Founding Partner</span>
            {" — "}$99/mo for your first year (80% off)
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="labName">Lab / Organization Name</Label>
            <Input
              id="labName"
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. Sunshine Tissue Culture"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourlab.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating your lab..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
