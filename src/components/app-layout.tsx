"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  // Auth pages: no sidebar
  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  // Root page: sidebar only when authenticated
  if (pathname === "/" && status !== "authenticated") {
    if (status === "loading") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Authenticated pages: full app shell
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
