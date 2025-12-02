import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { OrgContextProvider } from "./contexts/OrgContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { StripeProvider } from "./components/StripeProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ImpersonationBanner } from "./components/ImpersonationBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EZ Financial - The Financial Cockpit for Early-Stage Startups",
  description: "Simple bookkeeping that doesn't slow you down. Powerful runway visibility for startups and new businesses across America. Built for founders, not accountants.",
  keywords: ["startup bookkeeping", "burn rate", "runway", "startup finances", "new business accounting", "small business bookkeeping", "solopreneur finances"],
};

// Force dynamic rendering to avoid static generation issues with Clerk
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="ez-financial-theme"
          >
            <StripeProvider>
              <ConvexClientProvider>
                <OrgContextProvider>
                  <NotificationProvider>
                    <ErrorBoundary>
                      <ImpersonationBanner />
                      {children}
                      <Toaster />
                    </ErrorBoundary>
                  </NotificationProvider>
                </OrgContextProvider>
              </ConvexClientProvider>
            </StripeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

