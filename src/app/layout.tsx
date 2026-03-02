import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/session-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeProvider } from "next-themes";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VitrOS - Tissue Culture Management",
  description: "Enterprise tissue culture vessel tracking and lab management platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitrOS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#16a34a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
            <Toaster />
            <ServiceWorkerRegister />
            <KeyboardShortcuts />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
