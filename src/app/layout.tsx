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
import { HeartbeatProvider } from "@/components/heartbeat-provider";

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
  title: "VitrOS | Lab Management Software for Tissue Culture Labs",
  description:
    "VitrOS is the modern lab management software built for tissue culture. Track vessels, schedule subcultures, and manage your entire operation in one platform.",
  keywords: [
    "lab management software",
    "tissue culture lab",
    "tissue culture operating system",
    "lab inventory software",
    "lab workflow software",
    "tissue culture tracking",
    "vessel tracking",
    "plant propagation software",
    "laboratory automation software",
    "lab tracking software",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitrOS",
  },
  openGraph: {
    title: "VitrOS | Lab Management Software for Tissue Culture Labs",
    description:
      "VitrOS is the modern lab management software built for tissue culture. Track vessels, schedule subcultures, and manage your entire operation in one platform.",
    type: "website",
    siteName: "VitrOS",
    url: "https://vitroslabs.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitrOS | Lab Management Software for Tissue Culture Labs",
    description:
      "VitrOS is the modern lab management software built for tissue culture. Track vessels, schedule subcultures, and manage your entire operation in one platform.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "VitrOS",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "Lab management software built for tissue culture. Track vessels, schedule subcultures, and manage your entire operation in one platform.",
              "url": "https://vitroslabs.com",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": "499",
                "highPrice": "2499",
                "priceCurrency": "USD",
                "offerCount": "3",
              },
              "publisher": {
                "@type": "Organization",
                "name": "VitrOS Labs",
                "url": "https://vitroslabs.com",
              },
            }),
          }}
        />
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
            <HeartbeatProvider />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
