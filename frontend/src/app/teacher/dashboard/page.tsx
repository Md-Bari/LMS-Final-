"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Video, ClipboardList, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { DashboardLayout, PageHeader, StatsCard, StatusBadge, ProgressBar } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";
import { percentageForStudent } from "@/lib/utils/lms-helpers";

export default function TeacherDashboardPage() {
  const { state, currentUser } = useMockLms();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const myCourses = state.courses.filter((c) => !c.teacherId || c.teacherId === currentUser?.id);
  const myAssessments = state.assessments;
  const myLiveClasses = state.liveClasses.filter((lc) => lc.status !== "recorded");
  const pendingSubmissions = state.submissions.filter((s) => !s.feedback);

  const totalStudents = state.enrollments.filter((e) =>
    myCourses.some((c) => c.id === e.courseId)
  ).length;

  const publishedCount = myCourses.filter((c) => c.status === "published").length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title={`${greeting}, ${currentUser?.name?.split(" ")[0] ?? "Teacher"} 👋`}
        subtitle="Manage your courses, assessments, and live sessions."
      />

      <div className="stats-grid mb-8">
        <StatsCard
          label="My Courses"
          value={loading ? "—" : myCourses.length}
          note={`${publishedCount} published`}
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
        />
        <StatsCard
          label="My Students"
          value={loading ? "—" : totalStudents}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <StatsCard
          label="Assessments"
          value={loading ? "—" : myAssessments.length}
          note={`${pendingSubmissions.length} pending review`}
          icon={<ClipboardList className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
        />
        <StatsCard
          label="Upcoming Classes"
          value={loading ? "—" : myLiveClasses.length}
          icon={<Video className="w-5 h-5" />}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* My Courses */}
        <div className="grid gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl">My Courses</h2>
              <Link href="/teacher/courses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {myCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No courses yet. Create your first course!</p>
            ) : (
              <div className="grid gap-3">
                {myCourses.slice(0, 4).map((course) => {
                  const lessons = course.modules.flatMap((m) => m.lessons);
                  return (
                    <div key={course.id} className="card-sm flex items-center gap-4 hover:-translate-y-0.5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{course.modules.length} modules · {lessons.length} lessons · {course.enrollmentCount} students</p>
                      </div>
                      <StatusBadge status={course.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl">Recent Submissions</h2>
              <Link href="/teacher/submissions" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Review all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {state.submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No submissions yet.</p>
            ) : (
              <div className="grid gap-3">
                {state.submissions.slice(0, 4).map((sub) => {
                  const assessment = state.assessments.find((a) => a.id === sub.assessmentId);
                  return (
                    <div key={sub.id} className="flex items-center gap-3">
                      <div className="avatar w-8 h-8 text-xs shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                        {sub.studentName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{assessment?.title ?? "Assessment"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${sub.passed ? "text-success" : "text-destructive"}`}>{sub.score}%</p>
                        <p className="text-xs text-muted-foreground">{sub.passed ? "Pass" : "Fail"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="grid gap-6 content-start">
          {/* Upcoming Live Classes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">Upcoming Classes</h2>
              <Link href="/teacher/live-classes" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {myLiveClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming classes.</p>
            ) : (
              <div className="grid gap-3">
                {myLiveClasses.slice(0, 3).map((lc) => (
                  <div key={lc.id} className="card-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{lc.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(lc.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      </div>
                      <StatusBadge status={lc.status} />
                    </div>
                    {lc.meetingUrl && (
                      <a href={lc.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-accent mt-3 py-2 px-3 text-xs w-full justify-center">
                        Join Class
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">Assessments</h2>
              <Link href="/teacher/assessments" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {myAssessments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No assessments yet.</p>
            ) : (
              <div className="grid gap-2.5">
                {myAssessments.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.type} · {a.questionCount} questions</p>
                    </div>
                    <StatusBadge status={a.status} />
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
