"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

type Tab = "email" | "pin";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("pin", {
      pin,
      organizationId: "default",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid PIN");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md mx-4">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Image src="/logo.png" alt="VitrOS" width={500} height={488} className="h-14 w-auto" />
        </div>
        <p className="text-center text-muted-foreground mb-6">
          Enterprise Tissue Culture Management
        </p>

        {/* Tabs */}
        <div className="flex rounded-lg bg-muted p-1 mb-6">
          <button
            onClick={() => { setTab("email"); setError(""); }}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              tab === "email"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => { setTab("pin"); setError(""); }}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              tab === "pin"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Quick PIN
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 mb-4">
            {error}
          </div>
        )}

        {tab === "email" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
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
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                required
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground text-center">
                Use your assigned PIN for quick access on shared devices
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In with PIN"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
