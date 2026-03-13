import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/app-layout";
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
  metadataBase: new URL("https://vitroslabs.com"),
  title: "VitrOS — Lab Management Software for Tissue Culture Labs",
  description:
    "VitrOS is lab management software purpose-built for tissue culture. Track vessels, manage lab inventory, streamline workflows, and monitor contamination — all in one platform.",
  keywords: [
    "lab management software",
    "tissue culture lab",
    "lab inventory software",
    "lab workflow software",
    "tissue culture tracking",
    "vessel tracking",
    "tissue culture management",
    "plant propagation software",
    "lab contamination tracking",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitrOS",
  },
  openGraph: {
    title: "VitrOS — Lab Management Software for Tissue Culture Labs",
    description:
      "Purpose-built lab management software for tissue culture. Track every vessel, manage inventory, and streamline your lab workflow.",
    type: "website",
    siteName: "VitrOS",
    url: "https://vitroslabs.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitrOS — Lab Management Software for Tissue Culture Labs",
    description:
      "Purpose-built lab management software for tissue culture. Track every vessel, manage inventory, and streamline your lab workflow.",
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
        <meta name="theme-color" content="#3d8b3d" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <TooltipProvider>
              <AppLayout>
                {children}
              </AppLayout>
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
