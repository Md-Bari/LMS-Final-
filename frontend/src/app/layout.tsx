import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";
import { LmsProvider } from "@/providers/lms-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "Smart LMS",
  description: "Premium multi-tenant LMS frontend built with Next.js."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="font-sans">
        <ThemeProvider>
          <LmsProvider>
            <SiteShell>{children}</SiteShell>
          </LmsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
