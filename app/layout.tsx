import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { VisibilityReloadClient } from "@/components/visibility-reload-client";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Onboardly - Client Onboarding Made Simple",
    template: "%s | Onboardly",
  },
  description:
    "Streamline your client onboarding with customizable workflows, document collection, and real-time progress tracking.",
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.className} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <Providers>
            <VisibilityReloadClient />
            {children}
          </Providers>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
