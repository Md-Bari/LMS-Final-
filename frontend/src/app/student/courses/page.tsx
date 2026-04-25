"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Lock, Play, FileText } from "lucide-react";
import { DashboardLayout, PageHeader, ProgressBar, StatusBadge, EmptyState } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";
import { percentageForStudent } from "@/lib/utils/lms-helpers";
import Link from "next/link";

export default function StudentCoursesPage() {
  const { state, currentUser, markLessonComplete } = useMockLms();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const studentName = currentUser?.name ?? state.users.find((u) => u.role === "student")?.name ?? "Student";

  const myEnrollments = state.enrollments.filter((e) =>
    e.studentId === currentUser?.id || e.studentName === studentName
  );
  const enrolledCourses = state.courses.filter((c) => myEnrollments.some((e) => e.courseId === c.id));
  const activeCourse = enrolledCourses.find((c) => c.id === selectedCourse) ?? enrolledCourses[0];

  async function handleComplete(courseId: string, lessonId: string) {
    setCompleting(lessonId);
    try {
      await markLessonComplete(courseId, lessonId, studentName);
      setAlert({ type: "success", msg: "Lesson marked as complete!" });
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to mark complete." });
    } finally {
      setCompleting(null);
    }
  }

  function getLessonIcon(type: string) {
    if (type === "video") return <Play className="w-3.5 h-3.5" />;
    if (type === "quiz") return <CheckCircle className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  }

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="My Courses"
        subtitle="Continue learning where you left off."
      />

      {alert && (
        <div className={`mb-6 rounded-xl p-4 text-sm flex items-center justify-between ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{alert.msg}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {enrolledCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No enrolled courses"
          description="Browse the catalog and enroll in a course to get started."
          action={<Link href="/catalog" className="btn-accent">Browse Catalog</Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar: course list */}
          <div className="grid gap-3 content-start">
            {enrolledCourses.map((course) => {
              const pct = percentageForStudent(course, studentName);
              const isActive = course.id === (activeCourse?.id);
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${isActive ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border bg-card hover:shadow-sm"}`}
                >
                  <p className="font-semibold text-sm text-foreground truncate">{course.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.category}</p>
                  <div className="mt-3">
                    <ProgressBar value={pct} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{pct}% complete</p>
                </button>
              );
            })}
          </div>

          {/* Main: active course detail */}
          {activeCourse && (
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">{activeCourse.category}</p>
                  <h2 className="font-serif text-2xl text-foreground mt-1">{activeCourse.title}</h2>
                  {activeCourse.description && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{activeCourse.description}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-serif text-3xl font-semibold text-primary">{percentageForStudent(activeCourse, studentName)}%</p>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </div>

              <div className="mb-6">
                <ProgressBar value={percentageForStudent(activeCourse, studentName)} label="Overall Progress" />
              </div>

              {/* Modules */}
              <div className="grid gap-4">
                {activeCourse.modules.map((mod) => (
                  <div key={mod.id}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <p className="text-sm font-semibold text-foreground">{mod.title}</p>
                      <span className="text-xs text-muted-foreground">({mod.lessons.length} lessons)</span>
                    </div>
                    <div className="grid gap-2">
                      {mod.lessons.map((lesson) => {
                        const completed = lesson.completedBy.includes(studentName);
                        return (
                          <div key={lesson.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${completed ? "border-success/30 bg-success/5" : "border-border bg-card/50 hover:border-primary/30"}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${completed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                              {completed ? <CheckCircle className="w-4 h-4" /> : getLessonIcon(lesson.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${completed ? "text-success" : "text-foreground"}`}>{lesson.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{lesson.type} · {lesson.durationMinutes} min</p>
                            </div>
                            {!completed && (
                              <button
                                type="button"
                                disabled={completing === lesson.id}
                                onClick={() => handleComplete(activeCourse.id, lesson.id)}
                                className="btn-primary text-xs py-1.5 px-3 shrink-0"
                              >
                                {completing === lesson.id ? "…" : "Mark Done"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {mod.lessons.length === 0 && (
                        <p className="text-xs text-muted-foreground italic p-2">No lessons in this module yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
