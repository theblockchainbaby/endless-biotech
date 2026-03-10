"use client";

import { useSession } from "next-auth/react";
import Dashboard from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";

export default function Home() {
  const { status } = useSession();

  if (status === "loading") return null;
  if (status === "authenticated") return <Dashboard />;
  return <LandingPage />;
}
