"use client";

import { useSession } from "next-auth/react";
import Dashboard from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";

export default function Home() {
  const { status } = useSession();

  if (status === "authenticated") return <Dashboard />;

  // Always render landing page during loading + unauthenticated
  // This ensures crawlers see full HTML content (SSR)
  return <LandingPage />;
}
