"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Award,
  CreditCard,
  ClipboardList,
  Video,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  MessageSquare,
  Megaphone,
  CheckSquare,
  ShieldCheck,
  MoonStar,
  SunMedium
} from "lucide-react";
import { dashboardPathForRole, useMockLms } from "@/providers/mock-lms-provider";
import { useThemeMode } from "@/providers/theme-provider";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const adminNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: <Users className="w-4 h-4" /> },
      { href: "/admin/courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/admin/enrollments", label: "Enrollments", icon: <GraduationCap className="w-4 h-4" /> },
      { href: "/admin/live-classes", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
    ],
  },
  {
    label: "Academic",
    items: [
      { href: "/admin/assessments", label: "Assessments", icon: <ClipboardList className="w-4 h-4" /> },
      { href: "/admin/certificates", label: "Certificates", icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/reports/compliance", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
      { href: "/admin/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
];

const teacherNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/teacher/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/teacher/courses", label: "My Courses", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/teacher/live-classes", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
      { href: "/teacher/students", label: "My Students", icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: "Assessment",
    items: [
      { href: "/teacher/assessments", label: "Assessments", icon: <ClipboardList className="w-4 h-4" /> },
      { href: "/teacher/assignments", label: "Assignments", icon: <CheckSquare className="w-4 h-4" /> },
      { href: "/teacher/submissions", label: "Submissions", icon: <MessageSquare className="w-4 h-4" /> },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/teacher/content-uploads", label: "Content Uploads", icon: <FileText className="w-4 h-4" /> },
      { href: "/teacher/announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
    ],
  },
];

const studentNav: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/student/courses", label: "My Courses", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/student/live-classes", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
      { href: "/student/assignments", label: "Assignments", icon: <CheckSquare className="w-4 h-4" /> },
    ],
  },
  {
    label: "Achievements",
    items: [
      { href: "/student/certificates", label: "Certificates", icon: <Award className="w-4 h-4" /> },
    ],
  },
];

function getNavForRole(role?: string): NavSection[] {
  if (role === "teacher") return teacherNav;
  if (role === "student") return studentNav;
  return adminNav;
}

function getRoleLabel(role?: string) {
  if (role === "teacher") return "Teacher Portal";
  if (role === "student") return "Student Portal";
  return "Admin Portal";
}

function getRoleColor(role?: string) {
  if (role === "teacher") return "#0f766e"; // teal
  if (role === "student") return "#7c3aed"; // purple
  return "#E8A020"; // gold for admin
}

function getProfileHref(role?: string) {
  if (role === "teacher") return "/teacher/settings";
  if (role === "student") return "/student/profile";
  return "/admin/settings";
}

function SidebarItem({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin/dashboard" && href !== "/teacher/dashboard" && href !== "/student/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} className={`dash-nav-item${active ? " active" : ""}`}>
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

type DashboardLayoutProps = {
  children: ReactNode;
  role?: "admin" | "teacher" | "student";
};

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const { authReady, currentUser, isAuthenticated, signOut, state } = useMockLms();
  const effectiveRole = role ?? (currentUser?.role as "admin" | "teacher" | "student" | undefined) ?? "admin";
  const navSections = getNavForRole(effectiveRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { mounted, theme, toggleTheme } = useThemeMode();
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (currentUser && currentUser.role !== effectiveRole) {
      router.replace(dashboardPathForRole(currentUser.role));
    }
  }, [authReady, currentUser, effectiveRole, isAuthenticated, pathname, router]);

  if (!authReady || !isAuthenticated || currentUser?.role !== effectiveRole) {
    return (
      <div className="dash-main min-h-screen">
        <main className="dash-page flex min-h-screen items-center justify-center">
          <div className="card max-w-md text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <h1 className="font-serif text-2xl text-foreground">Checking workspace access</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting to the right Smart LMS dashboard.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const unreadNotifs = state.notifications.filter((n) =>
    n.audience === "All" ||
    (effectiveRole === "admin" && n.audience === "Admin") ||
    (effectiveRole === "teacher" && n.audience === "Teacher") ||
    (effectiveRole === "student" && n.audience === "Student")
  ).slice(0, 5);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const avatarInitials = (currentUser?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const accentColor = getRoleColor(effectiveRole);
  const profileHref = getProfileHref(effectiveRole);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div className="dash-sidebar-header">
          <div className="dash-sidebar-logo">SL</div>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-white leading-none truncate">Smart LMS</p>
            <p className="text-[10px] mt-1 uppercase tracking-[0.22em] truncate" style={{ color: accentColor }}>
              {getRoleLabel(effectiveRole)}
            </p>
          </div>
          <button
            type="button"
            className="ml-auto p-1 text-white/40 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User mini-card */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="avatar w-9 h-9 text-sm" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor})` }}>
              {avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate">{currentUser?.name ?? "Guest"}</p>
              <p className="text-[10px] text-white/45 truncate">{currentUser?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="dash-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="dash-nav-section">
              <p className="dash-nav-section-label">{section.label}</p>
              {section.items.map((item) => (
                <SidebarItem key={item.href} {...item} />
              ))}
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            type="button"
            onClick={handleSignOut}
            className="dash-nav-item w-full text-left hover:text-red-400"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground capitalize">{effectiveRole}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground rotate-[-90deg]" />
              <span className="font-semibold text-foreground capitalize">
                {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/15 bg-card/80 text-foreground transition hover:-translate-y-0.5 hover:border-[#E8A020]/60 dark:border-white/10 dark:bg-white/5"
              aria-label={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
            >
              {mounted && theme === "dark" ? <SunMedium className="w-4 h-4 text-[#E8A020]" /> : <MoonStar className="w-4 h-4 text-[#1A1A2E]" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl border shadow-xl z-50 p-3"
                  style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground px-2 pb-2">
                    Notifications
                  </p>
                  {unreadNotifs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p>
                  ) : (
                    <div className="grid gap-1">
                      {unreadNotifs.map((n) => (
                        <div key={n.id} className="rounded-xl p-3 text-sm hover:bg-muted/50 transition-colors cursor-default">
                          <p className="font-medium text-foreground leading-snug">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">{n.type}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            <Link href={profileHref} className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-muted/60">
              <div className="avatar w-9 h-9 text-sm" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor})` }}>
                {avatarInitials}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold leading-none">{currentUser?.name ?? "Guest"}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{effectiveRole}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="dash-page">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ===== Reusable UI Components ===== */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dash-page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="dash-page-title">{title}</h1>
        {subtitle && <p className="dash-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  note,
  icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  trend,
}: {
  label: string;
  value: string | number;
  note?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; up: boolean };
}) {
  return (
    <div className="stat-card">
      {icon && (
        <div className={`stat-card-icon ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      )}
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value mt-2">{value}</p>
      {trend && (
        <p className={`text-xs font-semibold mt-2 ${trend.up ? "text-success" : "text-destructive"}`}>
          {trend.up ? "↑" : "↓"} {trend.value}
        </p>
      )}
      {note && <p className="stat-card-note">{note}</p>}
    </div>
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card space-y-3 animate-pulse">
      <div className="skeleton-shimmer h-4 rounded w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-3 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton-shimmer h-10 rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50">
          <div className="skeleton-shimmer h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 rounded w-1/3" />
            <div className="skeleton-shimmer h-3 rounded w-1/2" />
          </div>
          <div className="skeleton-shimmer h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-state-icon text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-2xl text-foreground mt-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "badge-success",
    active: "badge-success",
    completed: "badge-success",
    live: "badge-success",
    enrolled: "badge-success",
    paid: "badge-success",
    draft: "badge-muted",
    scheduled: "badge-primary",
    pending: "badge-warning",
    overdue: "badge-destructive",
    revoked: "badge-destructive",
    recorded: "badge-muted",
    failed: "badge-destructive",
    passed: "badge-success",
  };

  const cls = map[status.toLowerCase()] ?? "badge-muted";

  return <span className={cls}>{status}</span>;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-bar">
      <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AlertBanner({
  type = "success",
  message,
  onDismiss,
}: {
  type?: "success" | "error" | "warning";
  message: string;
  onDismiss?: () => void;
}) {
  const cls = type === "error" ? "alert-error" : type === "warning" ? "alert-warning" : "alert-success";
  return (
    <div className={cls}>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
