"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WelcomeModal } from "@/components/welcome-modal";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  // Auth pages: no sidebar
  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  // Public marketing pages: no sidebar, always render children (SSR-friendly)
  const publicPaths = ["/", "/pricing", "/features", "/demo", "/why-vitros"];
  if (publicPaths.includes(pathname) && status !== "authenticated") {
    return <>{children}</>;
  }

  // Authenticated pages: full app shell
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <WelcomeModal />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
