"use client";

import { useSession } from "next-auth/react";
import Dashboard from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";

export default function Home() {
  const { status } = useSession();

  if (status === "authenticated") return <Dashboard />;

  // Always render landing page during loading + unauthenticated
  // Root metadata is set in layout.tsx since this is a client component
  return <LandingPage />;
}
