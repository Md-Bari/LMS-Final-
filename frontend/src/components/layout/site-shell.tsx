"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NavigationChrome } from "@/components/layout/navigation-chrome";
import type { HeroStat, Panel } from "@/lib/constants/site-data";

const shellFrame = "mx-auto w-full max-w-[1840px] px-4 sm:px-6 lg:px-8";

type ShellProps = {
  children: ReactNode;
};

type HeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats: HeroStat[];
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function SiteShell({ children }: ShellProps) {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isDashboard = pathname.startsWith("/admin") || pathname.startsWith("/teacher") || pathname.startsWith("/student");
  const isLogin = pathname === "/login";

  if (isHome || isDashboard || isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:90px_90px] opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(232,160,32,0.18),transparent_52%),radial-gradient(circle_at_18%_18%,rgba(255,246,233,0.82),transparent_32%)] dark:bg-[radial-gradient(circle_at_top,rgba(240,184,79,0.16),transparent_48%),radial-gradient(circle_at_18%_18%,rgba(39,120,140,0.14),transparent_34%)]" />
      <div className="relative z-10">
        <NavigationChrome />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}

export function HeroSection({
  eyebrow,
  title,
  description,
  stats,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref
}: HeroProps) {
  return (
    <section className={`${shellFrame} pb-12 pt-12 md:pb-20 md:pt-16`}>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-foreground/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground shadow-soft dark:border-white/8 dark:bg-white/5">
            {eyebrow}
          </p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-balance md:text-7xl">
            {title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            {description}
          </p>

          {(ctaLabel || secondaryLabel) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {ctaLabel && ctaHref ? (
                <Link href={ctaHref} className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-soft transition hover:translate-y-[-1px]">
                  {ctaLabel}
                </Link>
              ) : null}
              {secondaryLabel && secondaryHref ? (
                <Link href={secondaryHref} className="rounded-full border border-foreground/15 px-5 py-3 text-sm font-semibold transition hover:border-foreground/35">
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/65 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-black/5 bg-background/90 p-5 dark:border-white/8 dark:bg-[#13212a]">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
                <p className="mt-3 font-serif text-4xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturePanel({ panels }: { panels: Panel[] }) {
  return (
    <section className={`${shellFrame} py-12 md:py-24`}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {panels.map((panel) => (
          <div
            key={panel.title}
            className={`group relative overflow-hidden rounded-[2rem] border p-8 transition hover:shadow-soft ${
              panel.tone === "accent"
                ? "border-[#E8A020]/20 bg-[#1A1A2E] text-white"
                : panel.tone === "warm"
                  ? "border-orange-300/35 bg-orange-50"
                  : "border-foreground/5 bg-white dark:bg-white/5"
            }`}
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 font-serif text-xl text-foreground transition group-hover:scale-110">
              {panel.title.slice(0, 1)}
            </div>
            <h3 className="font-serif text-2xl">{panel.title}</h3>
            <p className={`mt-4 ${panel.tone === "accent" ? "text-white/75" : "text-muted-foreground"}`}>
              {panel.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const PanelGrid = FeaturePanel;

export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/5 bg-white/50 py-12 backdrop-blur dark:bg-black/20">
      <div className={`${shellFrame} flex flex-col items-center justify-between gap-6 md:flex-row`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background font-serif text-lg font-bold">SL</div>
          <span className="font-serif text-xl">Smart LMS</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Smart LMS. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
