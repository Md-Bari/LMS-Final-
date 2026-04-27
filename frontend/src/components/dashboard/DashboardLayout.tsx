"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  Video,
  X
} from "lucide-react";
import { dashboardPathForRole, useMockLms } from "@/providers/mock-lms-provider";

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
    label: "Dashboard",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/admin/courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/admin/enrollments", label: "Enrollments", icon: <GraduationCap className="w-4 h-4" /> },
      { href: "/admin/live-classes", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
    ],
  },
  {
    label: "Assessment",
    items: [
      { href: "/admin/assessments", label: "Assessments", icon: <ClipboardList className="w-4 h-4" /> },
      { href: "/admin/certificates", label: "Certificates", icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/users", label: "Users", icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/admin/reports/compliance", label: "Compliance", icon: <BarChart3 className="w-4 h-4" /> },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
      { href: "/admin/institute-settings", label: "Institute", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

const teacherNav: NavSection[] = [
  {
    label: "Dashboard",
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
    label: "Communication",
    items: [
      { href: "/teacher/announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/teacher/content-uploads", label: "Content Uploads", icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/teacher/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

const studentNav: NavSection[] = [
  {
    label: "Dashboard",
    items: [
      { href: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/student/courses", label: "My Courses", icon: <BookOpen className="w-4 h-4" /> },
      { href: "/student/live-classes", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
    ],
  },
  {
    label: "Assessment",
    items: [
      { href: "/student/assignments", label: "Assignments", icon: <CheckSquare className="w-4 h-4" /> },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/student/certificates", label: "Certificates", icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/student/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
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

function SidebarItem({ href, label, icon, collapsed = false }: NavItem & { collapsed?: boolean }) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href ||
        (href !== "/admin/dashboard" && href !== "/teacher/dashboard" && href !== "/student/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} className={`dash-nav-item${active ? " active" : ""}`} title={collapsed ? label : undefined}>
      <span className="dash-nav-icon">{icon}</span>
      <span className="dash-nav-text truncate">{label}</span>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const topProfileRef = useRef<HTMLDivElement | null>(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTopProfile = topProfileRef.current?.contains(target);

      if (!clickedTopProfile) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

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
  const planSummary = `${state.billing.plan} Plan`;
  const seatSummary = `${state.billing.activeStudents}/${state.billing.seatLimit} seats active`;
  const profileAction =
    effectiveRole === "admin"
      ? { href: "/admin/billing", label: "View Billing" }
      : effectiveRole === "teacher"
        ? { href: "/teacher/courses", label: "Open Courses" }
        : { href: "/student/courses", label: "Open Courses" };
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageTitle = pathSegments.at(-1)?.replace(/-/g, " ") || "Dashboard";
  const roleHome = dashboardPathForRole(effectiveRole);
  const profileLinks = [
    { href: `/${effectiveRole}/profile`, label: "Profile", icon: <UserCircle className="h-4 w-4" /> },
    { href: `/${effectiveRole}/settings`, label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { href: "/help", label: "Help", icon: <HelpCircle className="h-4 w-4" /> },
  ];

  function ProfilePopover({ compact = false }: { compact?: boolean }) {
    return (
      <div
        className={`rounded-2xl border shadow-xl ${
          compact ? "mt-3 w-full" : "absolute right-0 top-12 z-50 w-80"
        }`}
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        <div className="border-b px-4 py-4" style={{ borderColor: "hsl(var(--border) / 0.6)" }}>
          <div className="flex items-center gap-3">
            <div className="avatar h-11 w-11 text-sm" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor})` }}>
              {avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{currentUser?.name ?? "Guest"}</p>
              <p className="truncate text-xs text-muted-foreground">{currentUser?.email ?? ""}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 px-4 py-4 text-sm">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current Plan</p>
            <p className="mt-2 font-serif text-2xl text-foreground">{planSummary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{seatSummary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Role</p>
              <p className="mt-2 text-sm font-semibold capitalize text-foreground">{effectiveRole}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Learners</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{state.billing.activeStudents}</p>
            </div>
          </div>
          <Link href={profileAction.href} className="btn-secondary w-full justify-center text-center">
            {profileAction.label}
          </Link>
          <div className="my-1 border-t border-border/70" />
          {profileLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dash-layout flex min-h-screen w-full overflow-x-hidden ${sidebarCollapsed ? "dash-collapsed" : ""}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? " open" : ""}${sidebarCollapsed ? " collapsed" : ""}`}>
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
          <button
            type="button"
            className="ml-auto hidden rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* User mini-card */}
        <div className="mx-3 mt-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="avatar h-9 w-9 text-sm" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor})` }}>
              {avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white/90">{currentUser?.name ?? "Guest"}</p>
              <p className="truncate text-[10px] text-white/45">{currentUser?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="dash-sidebar-nav">
          <div className="dash-nav-section">
            <p className="dash-nav-section-label">General</p>
            <SidebarItem href={roleHome} label="Home" icon={<Home className="w-4 h-4" />} collapsed={sidebarCollapsed} />
          </div>

          {navSections.map((section) => (
            <div key={section.label} className="dash-nav-section">
              <p className="dash-nav-section-label">{section.label}</p>
              {section.items.map((item) => (
                <SidebarItem key={item.href} {...item} collapsed={sidebarCollapsed} />
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
            <span className="dash-nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div className="flex min-w-0 items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Link href={roleHome} className="capitalize transition hover:text-foreground">{effectiveRole}</Link>
                {pathSegments.slice(1).map((segment, index) => (
                  <span key={`${segment}-${index}`} className="inline-flex items-center gap-2">
                    <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
                    <span className="capitalize">{segment.replace(/-/g, " ")}</span>
                  </span>
                ))}
              </div>
              <h2 className="truncate text-base font-bold capitalize text-foreground md:text-lg">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="dash-header-search hidden xl:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Search workspace</span>
              <input type="search" placeholder="Search courses, learners, reports..." />
            </label>
            <Link
              href={roleHome}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Open notifications"
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
            <div ref={topProfileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Open profile menu"
              >
                <div className="avatar h-9 w-9 text-sm" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor})` }}>
                  {avatarInitials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold leading-none">{currentUser?.name ?? "Guest"}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">{effectiveRole}</p>
                </div>
                <ChevronDown className={`hidden h-4 w-4 text-muted-foreground transition-transform md:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen ? <ProfilePopover /> : null}
            </div>
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

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`page-container ${className}`}>{children}</div>;
}

export function DataCard({
  title,
  description,
  meta,
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`data-card ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function ActionButton({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "accent" | "ghost" | "danger" }) {
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "accent"
        ? "btn-accent"
        : variant === "ghost"
          ? "btn-ghost"
          : variant === "danger"
            ? "btn-danger"
            : "btn-secondary";

  return <button {...props} className={`${variantClass} ${className}`} />;
}

export function SearchFilterBar({
  children,
  search,
}: {
  children?: ReactNode;
  search?: ReactNode;
}) {
  return (
    <div className="search-filter-bar">
      {search ? <div className="min-w-[15rem] flex-1">{search}</div> : null}
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
