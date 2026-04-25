"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Award, Video, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { DashboardLayout, PageHeader, StatsCard, StatusBadge, ProgressBar } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";
import { percentageForStudent } from "@/lib/utils/lms-helpers";

export default function StudentDashboardPage() {
  const { state, currentUser } = useMockLms();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const studentName = currentUser?.name ?? state.users.find((u) => u.role === "student")?.name ?? "Student";

  const myEnrollments = state.enrollments.filter((e) =>
    e.studentId === currentUser?.id || e.studentName === studentName
  );
  const enrolledCourses = state.courses.filter((c) => myEnrollments.some((e) => e.courseId === c.id));
  const myCerts = state.certificates.filter((c) => c.studentName === studentName && !c.revoked);
  const upcomingClasses = state.liveClasses.filter((lc) => lc.status !== "recorded").slice(0, 3);

  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((sum, c) => sum + percentageForStudent(c, studentName), 0) / enrolledCourses.length)
    : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <DashboardLayout role="student">
      <PageHeader
        title={`${greeting}, ${currentUser?.name?.split(" ")[0] ?? "Student"} 👋`}
        subtitle="Track your learning journey and stay on top of your schedule."
      />

      <div className="stats-grid mb-8">
        <StatsCard
          label="Enrolled Courses"
          value={loading ? "—" : enrolledCourses.length}
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <StatsCard
          label="Avg. Progress"
          value={loading ? "—" : `${avgProgress}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
        />
        <StatsCard
          label="Certificates"
          value={loading ? "—" : myCerts.length}
          icon={<Award className="w-5 h-5" />}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-500"
        />
        <StatsCard
          label="Upcoming Classes"
          value={loading ? "—" : upcomingClasses.length}
          icon={<Video className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* My Courses */}
        <div className="grid gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl">My Courses</h2>
              <Link href="/student/courses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">You haven't enrolled in any courses yet.</p>
                <Link href="/catalog" className="btn-accent mt-4 inline-flex">Browse Courses</Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {enrolledCourses.slice(0, 4).map((course) => {
                  const pct = percentageForStudent(course, studentName);
                  return (
                    <div key={course.id} className="card-sm hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.category}</p>
                        </div>
                        <span className={`text-sm font-bold ${pct === 100 ? "text-success" : "text-foreground"}`}>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Certificates */}
          {myCerts.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl">My Certificates</h2>
                <Link href="/student/certificates" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid gap-3">
                {myCerts.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Award className="w-4.5 h-4.5 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cert.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">{new Date(cert.issuedAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}</p>
                    </div>
                    <span className="font-mono text-xs text-primary">{cert.verificationCode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="grid gap-6 content-start">
          {/* Notifications */}
          <div className="card">
            <h2 className="font-serif text-xl mb-4">Notifications</h2>
            {state.notifications.filter((n) => n.audience === "Student" || n.audience === "All").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No new notifications.</p>
            ) : (
              <div className="grid gap-3">
                {state.notifications.filter((n) => n.audience === "Student" || n.audience === "All").slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground leading-snug">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{n.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Live Classes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">Live Classes</h2>
              <Link href="/student/live-classes" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming sessions.</p>
            ) : (
              <div className="grid gap-3">
                {upcomingClasses.map((lc) => (
                  <div key={lc.id} className="card-sm">
                    <p className="text-sm font-semibold text-foreground">{lc.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(lc.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    {lc.meetingUrl && lc.status === "live" && (
                      <a href={lc.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-accent mt-2 py-1.5 px-3 text-xs w-full justify-center">
                        Join Now — Live!
                      </a>
                    )}
                    <StatusBadge status={lc.status} />
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
