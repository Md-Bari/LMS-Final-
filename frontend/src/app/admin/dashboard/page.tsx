"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Award,
  GraduationCap,
  Video,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout, PageHeader, StatsCard, StatusBadge, EmptyState } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";

function QuickActionCard({ href, icon, label, description, color }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Link href={href} className="card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-start gap-4 group cursor-pointer">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: color + "22" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 ml-auto group-hover:text-foreground transition-colors" />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { state, currentUser } = useMockLms();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const totalStudents = state.users.filter((u) => u.role === "student").length;
  const totalTeachers = state.users.filter((u) => u.role === "teacher").length;
  const publishedCourses = state.courses.filter((c) => c.status === "published").length;
  const totalCertificates = state.certificates.filter((c) => !c.revoked).length;
  const scheduledClasses = state.liveClasses.filter((lc) => lc.status === "scheduled").length;
  const activeEnrollments = state.enrollments.filter((e) => e.status === "active").length;

  const recentAudit = state.auditEvents;
  const recentCerts = state.certificates;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={`${greeting}, ${currentUser?.name?.split(" ")[0] ?? "Admin"} 👋`}
        subtitle="Here's a live overview of your Smart LMS platform."
      />

      {/* Stats */}
      <div className="stats-grid mb-8">
        <StatsCard
          label="Total Students"
          value={loading ? "—" : totalStudents}
          note={`${activeEnrollments} active enrollments`}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          trend={{ value: "+12 this month", up: true }}
        />
        <StatsCard
          label="Teachers"
          value={loading ? "—" : totalTeachers}
          note={`${publishedCourses} published courses`}
          icon={<GraduationCap className="w-5 h-5" />}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
        />
        <StatsCard
          label="Certificates Issued"
          value={loading ? "—" : totalCertificates}
          note="Active, non-revoked"
          icon={<Award className="w-5 h-5" />}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-500"
          trend={{ value: "+8 this week", up: true }}
        />
        <StatsCard
          label="Live Classes"
          value={loading ? "—" : scheduledClasses}
          note="Upcoming sessions"
          icon={<Video className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left column */}
        <div className="grid gap-6">
          {/* Courses Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl text-foreground">Courses Overview</h2>
              <Link href="/admin/courses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {state.courses.length === 0 ? (
              <EmptyState icon={<BookOpen className="w-7 h-7" />} title="No courses yet" description="Create your first course to get started." action={<Link href="/admin/courses" className="btn-primary btn">Create Course</Link>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Students</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.courses.map((course) => (
                      <tr key={course.id}>
                        <td className="font-medium text-foreground">{course.title}</td>
                        <td className="text-muted-foreground">{course.category}</td>
                        <td className="text-muted-foreground">{course.enrollmentCount}</td>
                        <td><StatusBadge status={course.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Billing Summary */}
          <div className="card" style={{ background: "linear-gradient(135deg, #1A1A2E, #2d2d50)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/50 font-semibold">Billing Plan</p>
                <p className="font-serif text-3xl text-white mt-1">{state.billing.plan}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#E8A020]/15 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#E8A020]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: "Active Students", value: state.billing.activeStudents },
                { label: "Seat Limit", value: state.billing.seatLimit },
                { label: "Monthly", value: `৳${state.billing.monthlyPrice ?? 0}` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
                  <p className="text-xl font-semibold text-white mt-1">{value}</p>
                </div>
              ))}
            </div>
            {state.billing.seatLimit && state.billing.activeStudents > state.billing.seatLimit * 0.8 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-yellow-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Seat utilization above 80% — consider upgrading your plan.</span>
              </div>
            )}
            <Link href="/admin/billing" className="inline-flex items-center gap-1.5 mt-5 text-xs font-semibold text-[#E8A020] hover:underline">
              Manage billing <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="grid gap-6 content-start">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="font-serif text-xl text-foreground mb-4">Quick Actions</h2>
            <div className="grid gap-2">
              <QuickActionCard href="/admin/users" icon={<Users className="w-5 h-5" />} label="Manage Users" description="Add or edit students and teachers" color="#3b82f6" />
              <QuickActionCard href="/admin/courses" icon={<BookOpen className="w-5 h-5" />} label="Manage Courses" description="Publish, edit, or archive courses" color="#0f766e" />
              <QuickActionCard href="/admin/enrollments" icon={<GraduationCap className="w-5 h-5" />} label="Manage Enrollments" description="Track enrollment status and progress" color="#0ea5e9" />
              <QuickActionCard href="/admin/assessments" icon={<BarChart2 className="w-5 h-5" />} label="Assessment Control" description="Publish, monitor, and score assessments" color="#8b5cf6" />
              <QuickActionCard href="/admin/certificates" icon={<Award className="w-5 h-5" />} label="Issue Certificates" description="Issue and verify certificates" color="#E8A020" />
              <QuickActionCard href="/admin/reports/compliance" icon={<BarChart2 className="w-5 h-5" />} label="Compliance Reports" description="Export audit-ready reports" color="#7c3aed" />
              <QuickActionCard href="/admin/live-classes" icon={<Video className="w-5 h-5" />} label="Live Classes" description="Schedule and manage sessions" color="#e11d48" />
              <QuickActionCard href="/admin/billing" icon={<CreditCard className="w-5 h-5" />} label="Billing Studio" description="Plan, seat, and payment controls" color="#f97316" />
              <QuickActionCard href="/admin/audit-logs" icon={<AlertTriangle className="w-5 h-5" />} label="Audit Logs" description="Review system actions and events" color="#ef4444" />
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-foreground">Recent Activity</h2>
              <Link href="/admin/audit-logs" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                All logs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
            ) : (
              <div className="grid gap-2.5">
                {recentAudit.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug truncate">{event.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">by {event.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Certificates */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-foreground">Recent Certificates</h2>
              <Link href="/admin/certificates" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentCerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No certificates yet.</p>
            ) : (
              <div className="grid gap-2.5">
                {recentCerts.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3">
                    <div className="avatar w-8 h-8 text-xs shrink-0">
                      {cert.studentName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{cert.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{cert.courseTitle}</p>
                    </div>
                    <StatusBadge status={cert.revoked ? "revoked" : "active"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
