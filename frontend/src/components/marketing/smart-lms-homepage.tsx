"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dashboardPathForRole, useMockLms } from "@/providers/mock-lms-provider";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface Course {
  badge: string;
  title: string;
  category: string;
  modules: number;
  hours: number;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  initials: string;
}

interface Plan {
  name: string;
  price: string;
  students: string;
  highlight?: boolean;
  features: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Catalog", href: "/catalog" },
];

const FEATURES: Feature[] = [
  {
    icon: "🎓",
    title: "Course Builder",
    desc: "Create rich courses with video, PDFs, quizzes, and assignments using a drag-and-drop builder. Support for Course > Module > Lesson hierarchy.",
  },
  {
    icon: "🤖",
    title: "AI Assessments",
    desc: "Generate up to 50 quiz questions from any PDF in seconds. AI evaluates essays with rubrics and delivers written feedback within 30 seconds.",
  },
  {
    icon: "📹",
    title: "Live Classroom",
    desc: "Host live sessions for up to 500 concurrent participants via Jitsi. Schedule, record, and send automated reminders to students.",
  },
  {
    icon: "📋",
    title: "Compliance Reports",
    desc: "Track course completion, quiz scores, and time-on-platform. Export audit-ready compliance reports in CSV and PDF formats.",
  },
  {
    icon: "🏅",
    title: "Certificates",
    desc: "Auto-generate branded certificates when students pass assessments. Downloadable as PDF, shareable via secure link, revocable by admins.",
  },
  {
    icon: "💳",
    title: "Billing & Billing",
    desc: "Stripe-powered subscriptions with automated invoicing. Seat overage alerts at 80% and 100% utilization.",
  },
];

const COURSES: Course[] = [
  { badge: "Compliance", title: "Compliance Excellence Bootcamp", category: "Compliance", modules: 6, hours: 12 },
  { badge: "AI", title: "AI Instructor Studio", category: "Teaching", modules: 4, hours: 8 },
  { badge: "Leadership", title: "Future of Product Teams", category: "Leadership", modules: 8, hours: 16 },
  { badge: "Web Dev", title: "Full-Stack Web Development", category: "Technology", modules: 12, hours: 24 },
  { badge: "Excel", title: "Data Analytics with Excel", category: "Data", modules: 5, hours: 10 },
  { badge: "Branding", title: "Personal Branding Masterclass", category: "Marketing", modules: 7, hours: 14 },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marc Pillay",
    role: "Head of L&D, TechCorp",
    initials: "MP",
    rating: 5,
    text: "Smart LMS cut our onboarding time in half. The AI quiz generation alone saves my team 10+ hours a week.",
  },
  {
    name: "Shabnath Shariff",
    role: "Principal, Greenfield Academy",
    initials: "SS",
    rating: 5,
    text: "White-labeling was seamless. Our students see our brand everywhere—not a third-party tool.",
  },
  {
    name: "Ihsan Ul Haque",
    role: "Corporate Trainer",
    initials: "IH",
    rating: 5,
    text: "Compliance reports used to take days. Now I export a full audit-ready PDF in 30 seconds.",
  },
  {
    name: "Shahid Ahmed",
    role: "Independent Tutor",
    initials: "SA",
    rating: 5,
    text: "I launched my first online course in under 30 minutes. The live classroom feature is fantastic.",
  },
];

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$49",
    students: "Up to 100 students",
    features: ["Course Builder", "Basic Compliance Reports", "Email Support", "$5/seat overage"],
  },
  {
    name: "Growth",
    price: "$149",
    students: "Up to 500 students",
    highlight: true,
    features: [
      "Everything in Starter",
      "AI Quiz Generation",
      "Live Classrooms (100 participants)",
      "Advanced Reports + CSV export",
      "Priority Email & Chat Support",
      "$3/seat overage",
    ],
  },
  {
    name: "Professional",
    price: "$349",
    students: "Up to 2,000 students",
    features: [
      "Everything in Growth",
      "Full AI Suite (quiz + essay eval)",
      "Live Classrooms (500 participants)",
      "White-Label + Custom Domain",
      "Advanced Reports (CSV + PDF + API)",
      "Dedicated Account Manager",
      "Full REST API Access",
      "$2/seat overage",
    ],
  },
];

const STATS = [
  { value: "10,000+", label: "Active Learners" },
  { value: "500+", label: "Institutes" },
  { value: "99.5%", label: "Uptime SLA" },
  { value: "30s", label: "AI Essay Feedback" },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────
function StarRating({ count }: { count: number }) {
  return (
    <span style={{ color: "#F59E0B", fontSize: 14, letterSpacing: 1 }}>
      {"★".repeat(count)}
    </span>
  );
}

function Badge({ children, color = "#E8F5FF", textColor = "#185FA5" }: { children: React.ReactNode; color?: string; textColor?: string }) {
  return (
    <span
      style={{
        background: color,
        color: textColor,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        letterSpacing: 0.4,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SmartLMSHomePage() {
  const { state, currentUser, isAuthenticated, resetDemo } = useMockLms();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "teacher" | "student">("admin");
  const activeLearners = state.billing.activeStudents;
  const publishedCourses = state.courses.filter((course) => course.status === "published").length;
  const totalLessons = state.courses.reduce((total, course) => total + course.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0);
  const dashboardHref = isAuthenticated ? dashboardPathForRole(currentUser?.role) : "/login";
  const featureRoutes: Record<string, string> = {
    "Course Builder": "/teacher/courses",
    "AI Assessments": "/teacher/assessments/ai-generate",
    "Live Classroom": "/teacher/live-classes",
    "Compliance Reports": "/admin/reports/compliance",
    Certificates: "/admin/certificates",
    "Billing & Billing": "/admin/billing",
    Billing: "/admin/billing",
  };
  const footerRoutes: Record<string, string> = {
    "Admin Dashboard": "/admin/dashboard",
    "White-label Branding": "/admin/branding",
    Billing: "/admin/billing",
    "Audit Logs": "/admin/audit-logs",
    "Course Builder": "/teacher/courses",
    "Live Classroom": "/teacher/live-classes",
    "Student Courses": "/student/courses",
    "Student Live Classes": "/student/live-classes",
    "AI Studio": "/teacher/assessments/ai-generate",
    "Review Queue": "/teacher/assessments/review",
    "Compliance Reports": "/admin/reports/compliance",
    Certificates: "/admin/certificates",
    Pricing: "/pricing",
    Catalog: "/catalog",
    Login: "/login",
    Signup: "/signup",
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Workspace tab content
  const workspaceContent = {
    admin: {
      title: "Admin workspace",
      desc: "Branding, billing, compliance, certificates, notifications, and audit logs. Full control over your institute's LMS in one place.",
      items: ["White-label branding", "Subscription & billing", "Compliance reports", "Audit logs", "Seat management", "Tenant isolation"],
    },
    teacher: {
      title: "Teacher workspace",
      desc: "Course delivery, live class scheduling, AI review queue, and student submission management.",
      items: ["Course & module builder", "AI quiz generation", "Essay review queue", "Live class hosting", "Drip content scheduling", "Grade book"],
    },
    student: {
      title: "Student workspace",
      desc: "Courses, progress tracking, assessment submission, live classes, and certificates.",
      items: ["Course catalog", "Progress dashboard", "Assessment submission", "Live class access", "Certificate download", "Secure share links"],
    },
  };

  const ws = workspaceContent[activeTab];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#1A1A2E", background: "#fff" }}>

      {/* ── Navbar ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(255,255,255,0.95)" : "#fff",
          backdropFilter: scrolled ? "blur(8px)" : "none",
          borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
          transition: "all 0.3s",
          padding: "0 5%",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #1A1A2E 60%, #E8A020)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              SL
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#1A1A2E" }}>Smart LMS</span>
          </div>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-nav">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#1A1A2E")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6B7280")}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/login"
              style={{ fontSize: 14, fontWeight: 500, color: "#374151", textDecoration: "none", padding: "8px 16px" }}
            >
              Sign in
            </Link>
            <Link
              href="/demo"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "#E8A020",
                textDecoration: "none",
                padding: "9px 20px",
                borderRadius: 8,
                transition: "background 0.2s",
              }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "#CF8F1A")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "#E8A020")}
            >
              Book demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Sub-nav tabs ── */}
      <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "0 5%", overflowX: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            ["AI Studio", "/teacher/assessments/ai-generate"],
            ["Live Classroom", "/teacher/live-classes"],
            ["Compliance", "/admin/reports/compliance"],
            ["Certificates", "/admin/certificates"],
            ["Billing", "/admin/billing"],
          ].map(([tab, href]) => (
            <Link
              key={tab}
              href={href}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#6B7280",
                textDecoration: "none",
                padding: "10px 18px",
                borderBottom: "2px solid transparent",
                whiteSpace: "nowrap",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.target as HTMLElement;
                el.style.color = "#1A1A2E";
                el.style.borderBottomColor = "#E8A020";
              }}
              onMouseLeave={(e) => {
                const el = e.target as HTMLElement;
                el.style.color = "#6B7280";
                el.style.borderBottomColor = "transparent";
              }}
            >
              {tab}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section
        style={{
          background: "linear-gradient(160deg, #F8F9FB 0%, #EEF2FF 100%)",
          padding: "80px 5% 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: "10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(232,160,32,0.07)",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: "5%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(26,26,46,0.04)",
            zIndex: 0,
          }}
        />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 60, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          {/* Left text */}
          <div style={{ flex: "1 1 460px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FEF3E2", border: "1px solid #FCD88A", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8A020", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#B45309" }}>Welcome to Smart LMS</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 5vw, 58px)",
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#1A1A2E",
                margin: "0 0 8px",
              }}
            >
              Smart Learning
            </h1>
            <h1
              style={{
                fontSize: "clamp(36px, 5vw, 58px)",
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#E8A020",
                margin: "0 0 24px",
              }}
            >
              &amp; Course Growth
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "#6B7280", maxWidth: 480, marginBottom: 32 }}>
              Manage courses, AI assessments, live classes, certificates, and compliance reports from one polished LMS workspace. Built for institutes, corporates, and tutors.
            </p>

            {/* Feature pills */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
              {["AI Assessments", "Live Classes", "Certificates"].map((f) => (
                <span
                  key={f}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* CTA row */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 }}>
              <a
                href={dashboardHref}
                style={{
                  background: "#E8A020",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "13px 28px",
                  borderRadius: 10,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(232,160,32,0.35)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.transform = "translateY(0)")}
              >
                Dashboard Access
              </a>
              <Link
                href="/teacher/assessments/ai-generate"
                style={{
                  background: "#fff",
                  color: "#1A1A2E",
                  fontWeight: 600,
                  fontSize: 15,
                  padding: "12px 28px",
                  borderRadius: 10,
                  textDecoration: "none",
                  border: "2px solid #E5E7EB",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.borderColor = "#1A1A2E")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.borderColor = "#E5E7EB")}
              >
                AI Studio →
              </Link>
              {isAuthenticated ? (
                <Link
                  href={dashboardPathForRole(currentUser?.role)}
                  style={{
                    background: "transparent",
                    color: "#6B7280",
                    fontWeight: 500,
                    fontSize: 15,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  Open dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={resetDemo}
                  style={{
                    background: "transparent",
                    color: "#6B7280",
                    fontWeight: 500,
                    fontSize: 15,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Reset demo
                </button>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#1A1A2E" }}>{activeLearners}+</span>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>Active learners</p>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#1A1A2E" }}>{publishedCourses}+</span>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>Published courses</p>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#1A1A2E" }}>{totalLessons}x</span>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>Lessons</p>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Live platform card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "20px 24px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Live Platform</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center", background: "#F3F4F6", borderRadius: 12, padding: "16px 24px", flex: 1 }}>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>ASSESSMENTS</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: "#1A1A2E", margin: 0 }}>{state.assessments.length}</p>
                </div>
                <div style={{ textAlign: "center", background: "#FEF3E2", borderRadius: 12, padding: "16px 24px", flex: 1 }}>
                  <p style={{ fontSize: 12, color: "#B45309", marginBottom: 4 }}>CERTIFICATES</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: "#E8A020", margin: 0 }}>{state.certificates.length}</p>
                </div>
              </div>
            </div>

            {/* Course previews */}
            {[
              { cat: "COMPLIANCE", title: "Compliance Excellence Bootcamp", sub: "Audit-ready compliance training with assessments, certificates, and reporting." },
              { cat: "TEACHING", title: "AI Instructor Studio", sub: "Create AI-assisted quizzes, essay rubrics, and faster teaching workflows." },
              { cat: "LEADERSHIP", title: "Future of Product Teams", sub: "A cohort-driven course on modern product strategy, systems, and delivery." },
            ].map((c) => (
              <div
                key={c.title}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "16px 20px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: "#E8A020", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{c.cat}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>{c.title}</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: "#1A1A2E", padding: "40px 5%" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 24,
            textAlign: "center",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: 32, fontWeight: 800, color: "#E8A020", margin: "0 0 4px" }}>{s.value}</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Better learning ops ── */}
      <section style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 32, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          {/* Left visual card */}
          <div style={{ flex: "1 1 360px", maxWidth: 460 }}>
            <div
              style={{
                background: "linear-gradient(135deg, #1A1A2E, #2D2D50)",
                borderRadius: 20,
                padding: 32,
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(232,160,32,0.15)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Platform utilization</p>
                <p style={{ fontSize: 48, fontWeight: 800, color: "#E8A020", margin: "0 0 4px" }}>82%</p>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Seat utilization this month</p>
                <div style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 8 }}>
                  <div style={{ width: "82%", background: "#E8A020", borderRadius: 8, height: "100%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div style={{ flex: "1 1 520px" }}>
            <p style={{ fontSize: 12, color: "#E8A020", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Welcome to Smart LMS</p>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#1A1A2E", lineHeight: 1.2, marginBottom: 16 }}>
              Better learning operations for institutes and teams.
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
              The interface keeps admin, teacher, and student workflows connected while preserving the working mock and backend-ready flows in your project.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                { title: "Admin Ready", sub: "Branding, billing, reporting, and tenant controls." },
                { title: "Teacher Tools", sub: "Course delivery, live class scheduling, and AI review queue." },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "#F9FAFB",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E", marginBottom: 4 }}>{card.title}</p>
                  <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Link
                href="/catalog"
                style={{
                  background: "#E8A020",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "11px 24px",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                Explore courses
              </Link>
              <Link
                href="/catalog"
                style={{
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "11px 24px",
                  borderRadius: 8,
                  textDecoration: "none",
                  border: "2px solid #E5E7EB",
                }}
              >
                Learner login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: "#F8F9FB", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>What we offer</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Complete LMS Services</h2>
          <p style={{ textAlign: "center", fontSize: 15, color: "#6B7280", maxWidth: 520, margin: "0 auto 48px" }}>
            A focused set of working features from your SRS, styled like the provided reference.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "28px 24px",
                  border: "1px solid #E5E7EB",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 16px 0 80px", background: "#FEF3E2", opacity: 0.6 }} />
                <div style={{ fontSize: 28, marginBottom: 14, position: "relative" }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</p>
                <Link href={featureRoutes[f.title] ?? "/catalog"} style={{ display: "inline-block", marginTop: 16, fontSize: 13, fontWeight: 600, color: "#E8A020", textDecoration: "none" }}>
                  Open now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quality banner ── */}
      <section style={{ background: "#1A1A2E", padding: "60px 5%", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#fff", marginBottom: 20 }}>
          Providing High Quality Learning Tools
        </h2>
        <Link
          href="/catalog"
          style={{
            display: "inline-block",
            background: "#E8A020",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 32px",
            borderRadius: 30,
            textDecoration: "none",
          }}
        >
          Discover more
        </Link>
      </section>

      {/* ── Workspace chooser ── */}
      <section style={{ background: "#fff", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 60, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Workspace access</p>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#1A1A2E", lineHeight: 1.2 }}>
              Choose Your Dashboard
            </h2>
          </div>

          <div style={{ flex: "2 1 500px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #E5E7EB", marginBottom: 24 }}>
              {(["admin", "teacher", "student"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: activeTab === tab ? 700 : 500,
                    color: activeTab === tab ? "#1A1A2E" : "#9CA3AF",
                    borderBottom: activeTab === tab ? "2px solid #E8A020" : "2px solid transparent",
                    marginBottom: -2,
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                >
                  {tab} workspace
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>{ws.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 20 }}>{ws.desc}</p>
                <Link
                  href={activeTab === "admin" ? "/admin/dashboard" : activeTab === "teacher" ? "/teacher/dashboard" : "/student/dashboard"}
                  style={{ fontSize: 14, fontWeight: 600, color: "#E8A020", textDecoration: "none" }}
                >
                  Open workspace →
                </Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ws.items.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid #F3F4F6",
                      fontSize: 13,
                      color: "#374151",
                    }}
                  >
                    <span style={{ color: "#E8A020", fontWeight: 700 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      <section id="courses" style={{ background: "#F8F9FB", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Course catalog</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#1A1A2E" }}>Explore Our Latest Courses</h2>
            </div>
            <Link href="/catalog" style={{ fontSize: 14, fontWeight: 600, color: "#E8A020", textDecoration: "none" }}>See All Courses ?</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {COURSES.map((course) => (
              <div
                key={course.title}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid #E5E7EB",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Course image placeholder */}
                <div
                  style={{
                    height: 140,
                    background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D50 100%)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 36, opacity: 0.3 }}>📚</span>
                  <Badge color="#E8A020" textColor="#fff">{course.badge}</Badge>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>{course.category}</p>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.4, marginBottom: 12 }}>{course.title}</h4>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                    <span>📦 {course.modules} Modules</span>
                    <span>⏱ {course.hours} Hours</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: "#fff", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Hear What They Say</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#1A1A2E", marginBottom: 48 }}>Trusted by Learners & Educators</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                style={{
                  background: "#F9FAFB",
                  borderRadius: 16,
                  padding: "24px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <StarRating count={t.rating} />
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "12px 0 20px" }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#1A1A2E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#E8A020",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: "#F8F9FB", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Pricing</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Simple, Transparent Pricing</h2>
          <p style={{ textAlign: "center", fontSize: 15, color: "#6B7280", marginBottom: 48 }}>Start free, scale as you grow. Cancel anytime.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "stretch" }}>
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "#1A1A2E" : "#fff",
                  borderRadius: 20,
                  padding: "32px 28px",
                  border: plan.highlight ? "2px solid #E8A020" : "1px solid #E5E7EB",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -13,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#E8A020",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 16px",
                      borderRadius: 20,
                      letterSpacing: 0.5,
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <p style={{ fontSize: 16, fontWeight: 700, color: plan.highlight ? "#E8A020" : "#1A1A2E", marginBottom: 8 }}>{plan.name}</p>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: plan.highlight ? "#fff" : "#1A1A2E" }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? "#9CA3AF" : "#9CA3AF" }}>/mo</span>
                </div>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>{plan.students}</p>

                <div style={{ flex: 1, marginBottom: 28 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 13, color: plan.highlight ? "#D1D5DB" : "#374151" }}>
                      <span style={{ color: "#E8A020", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <Link href="/pricing"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: plan.highlight ? "#E8A020" : "transparent",
                    color: plan.highlight ? "#fff" : "#1A1A2E",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "13px 20px",
                    borderRadius: 10,
                    textDecoration: "none",
                    border: plan.highlight ? "none" : "2px solid #E5E7EB",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.target as HTMLElement;
                    if (!plan.highlight) el.style.borderColor = "#1A1A2E";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.target as HTMLElement;
                    if (!plan.highlight) el.style.borderColor = "#E5E7EB";
                  }}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D50 100%)", padding: "60px 5%" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
              Contact Us to Start Your Learning Journey!
            </h2>
            <p style={{ fontSize: 15, color: "#9CA3AF" }}>Schedule a demo and see Smart LMS live in 30 minutes.</p>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <Link
              href="/contact"
              style={{
                background: "#E8A020",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                padding: "13px 28px",
                borderRadius: 10,
                textDecoration: "none",
              }}
            >
              Contact us
            </Link>
            <Link
              href="/signup"
              style={{
                background: "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 10,
                textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              +1 800 555 0162
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0F0F1E", padding: "60px 5% 32px", color: "#9CA3AF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "linear-gradient(135deg, #E8A020, #CF8F1A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  SL
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Smart LMS</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>
                Multi-Tenant SaaS LMS frontend aligned to the SRS: course delivery, AI assessment, live classes, compliance reporting, certificates, and subscription billing.
              </p>
            </div>

            {/* Column links */}
            {[
              { title: "Platform", links: ["Admin Dashboard", "White-label Branding", "Billing", "Audit Logs"] },
              { title: "Learning", links: ["Course Builder", "Live Classroom", "Student Courses", "Student Live Classes"] },
              { title: "AI & Compliance", links: ["AI Studio", "Review Queue", "Compliance Reports", "Certificates"] },
              { title: "Access", links: ["Pricing", "Catalog", "Login", "Signup"] },
            ].map((col) => (
              <div key={col.title}>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>{col.title}</p>
                {col.links.map((link) => (
                  <a
                    key={link}
                    href={footerRoutes[link] ?? "/"}
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#9CA3AF",
                      textDecoration: "none",
                      marginBottom: 8,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#E8A020")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13 }}>Copyright © 2025 Smart LMS. All rights reserved.</p>
            <div style={{ display: "flex", gap: 24 }}>
              {["Privacy", "Terms", "Cookie Policy"].map((item) => (
                <a key={item} href="#" style={{ fontSize: 13, color: "#9CA3AF", textDecoration: "none" }}>{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
