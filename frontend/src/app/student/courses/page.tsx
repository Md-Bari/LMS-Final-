"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Circle,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  PenSquare,
  Play,
  SendHorizontal,
  Video
} from "lucide-react";
import { DashboardLayout, EmptyState, PageHeader, ProgressBar } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";
import { percentageForStudent } from "@/lib/utils/lms-helpers";
import { YouTubePlayer, extractYouTubeId } from "@/components/shared/youtube-player";
import Link from "next/link";
import type { Assessment } from "@/lib/mock-lms";

type AssessmentResult = {
  score: number;
  passed: boolean;
  feedback: string;
  status?: string;
};

export default function StudentCoursesPage() {
  const { state, currentUser, markLessonComplete, submitAssessment } = useMockLms();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [submittingAssessmentId, setSubmittingAssessmentId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const [openAssessmentByModule, setOpenAssessmentByModule] = useState<Record<string, string>>({});
  const [mcqAnswersByAssessment, setMcqAnswersByAssessment] = useState<Record<string, Record<string, string>>>({});
  const [writtenAnswerByAssessment, setWrittenAnswerByAssessment] = useState<Record<string, string>>({});
  const [resultByAssessment, setResultByAssessment] = useState<Record<string, AssessmentResult>>({});

  const studentName = currentUser?.name ?? state.users.find((u) => u.role === "student")?.name ?? "Student";

  const myEnrollments = state.enrollments.filter((enrollment) =>
    enrollment.studentId === currentUser?.id || enrollment.studentName === studentName
  );
  const enrolledCourses = state.courses.filter((course) => myEnrollments.some((enrollment) => enrollment.courseId === course.id));
  const activeCourse = enrolledCourses.find((course) => course.id === selectedCourse) ?? enrolledCourses[0];

  const coursePublishedAssessments = useMemo(() => {
    if (!activeCourse) return [];
    return state.assessments.filter((assessment) => assessment.courseId === activeCourse.id && assessment.status === "published");
  }, [activeCourse, state.assessments]);

  const moduleAssessmentsMap = useMemo(() => {
    if (!activeCourse) return {} as Record<string, Assessment[]>;

    const map: Record<string, Assessment[]> = {};

    for (let moduleIndex = 0; moduleIndex < activeCourse.modules.length; moduleIndex += 1) {
      const courseModule = activeCourse.modules[moduleIndex];
      const moduleTexts = [courseModule.title, ...courseModule.lessons.map((lesson) => lesson.title)]
        .map((text) => text.toLowerCase().trim())
        .filter((text) => text.length > 2);

      const matched = coursePublishedAssessments.filter((assessment) => {
        const corpus = `${assessment.title} ${assessment.generatedFrom}`.toLowerCase();
        return moduleTexts.some((text) => corpus.includes(text));
      });

      map[courseModule.id] = matched.length > 0 ? matched : moduleIndex === 0 ? coursePublishedAssessments : [];
    }

    return map;
  }, [activeCourse, coursePublishedAssessments]);

  const latestResultByAssessment = useMemo(() => {
    const map: Record<string, AssessmentResult> = { ...resultByAssessment };

    for (const submission of state.submissions) {
      if (submission.studentName !== studentName) continue;
      if (!map[submission.assessmentId]) {
        map[submission.assessmentId] = {
          score: submission.score,
          passed: submission.passed,
          feedback: submission.feedback
        };
      }
    }

    return map;
  }, [resultByAssessment, state.submissions, studentName]);

  useEffect(() => {
    if (!activeCourse) return;

    setOpenAssessmentByModule((current) => {
      const next = { ...current };

      for (const courseModule of activeCourse.modules) {
        const moduleAssessments = moduleAssessmentsMap[courseModule.id] ?? [];
        if (!moduleAssessments.length) continue;
        if (!next[courseModule.id] || !moduleAssessments.some((assessment) => assessment.id === next[courseModule.id])) {
          next[courseModule.id] = moduleAssessments[0].id;
        }
      }

      return next;
    });
  }, [activeCourse, moduleAssessmentsMap]);

  async function handleComplete(courseId: string, lessonId: string) {
    setCompleting(lessonId);
    try {
      await markLessonComplete(courseId, lessonId, studentName);
      setAlert({ type: "success", msg: "Lesson marked as complete!" });
    } catch (error) {
      setAlert({ type: "error", msg: error instanceof Error ? error.message : "Failed to mark complete." });
    } finally {
      setCompleting(null);
    }
  }

  async function handleSubmitAssessment(moduleId: string, assessment: Assessment) {
    const isObjective = assessment.type === "MCQ" || assessment.type === "True/False";
    let answerText = "";

    if (isObjective) {
      const selectedOptions = mcqAnswersByAssessment[assessment.id] ?? {};
      answerText = assessment.questions
        .map((question, index) => `Q${index + 1}: ${selectedOptions[question.id] ?? "No answer"}`)
        .join("\n");

      if (!Object.keys(selectedOptions).length) {
        setAlert({ type: "error", msg: "Please answer at least one MCQ question before submit." });
        return;
      }
    } else {
      answerText = writtenAnswerByAssessment[assessment.id]?.trim() ?? "";
      if (!answerText) {
        setAlert({ type: "error", msg: "Please write your answer before submitting the assessment." });
        return;
      }
    }

    setSubmittingAssessmentId(assessment.id);
    try {
      const result = await submitAssessment(assessment.id, studentName, answerText);
      if (result) {
        setResultByAssessment((current) => ({ ...current, [assessment.id]: result }));
      }

      setAlert({
        type: "success",
        msg: `Assessment submitted from ${activeCourse?.title ?? "this course"}. Result is now saved for instructor review.`
      });

      if (!isObjective) {
        setWrittenAnswerByAssessment((current) => ({ ...current, [assessment.id]: "" }));
      }

      setOpenAssessmentByModule((current) => ({ ...current, [moduleId]: assessment.id }));
    } catch (error) {
      setAlert({ type: "error", msg: error instanceof Error ? error.message : "Failed to submit assessment." });
    } finally {
      setSubmittingAssessmentId(null);
    }
  }

  function getLessonIcon(type: string, hasVideo: boolean) {
    if (hasVideo) return <Video className="h-3.5 w-3.5" />;
    if (type === "video") return <Play className="h-3.5 w-3.5" />;
    if (type === "quiz") return <CheckCircle className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  }

  function getVideoThumbnail(url: string): string | null {
    const id = extractYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }

  function latestResultForAssessment(assessment: Assessment): AssessmentResult | null {
    if (resultByAssessment[assessment.id]) {
      return resultByAssessment[assessment.id];
    }

    const latestSubmission = state.submissions.find(
      (submission) => submission.assessmentId === assessment.id && submission.studentName === studentName
    );

    if (!latestSubmission) {
      return null;
    }

      return {
        score: latestSubmission.score,
        passed: latestSubmission.passed,
        feedback: latestSubmission.feedback
      };
  }

  return (
    <DashboardLayout role="student">
      <PageHeader title="My Courses" subtitle="Continue learning where you left off." />

      {alert ? (
        <div className={`mb-6 flex items-center justify-between rounded-xl p-4 text-sm ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{alert.msg}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-4 opacity-60 hover:opacity-100">x</button>
        </div>
      ) : null}

      {enrolledCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No enrolled courses"
          description="Browse the catalog and enroll in a course to get started."
          action={<Link href="/catalog" className="btn-accent">Browse Catalog</Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="grid content-start gap-3">
            {enrolledCourses.map((course) => {
              const percentage = percentageForStudent(course, studentName);
              const isActive = course.id === activeCourse?.id;

              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isActive ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border bg-card hover:shadow-sm"}`}
                >
                  <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{course.category}</p>
                  <div className="mt-3">
                    <ProgressBar value={percentage} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{percentage}% complete</p>
                </button>
              );
            })}
          </div>

          {activeCourse ? (
            <div className="card">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{activeCourse.category}</p>
                  <h2 className="mt-1 font-serif text-2xl text-foreground">{activeCourse.title}</h2>
                  {activeCourse.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activeCourse.description}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-serif text-3xl font-semibold text-primary">{percentageForStudent(activeCourse, studentName)}%</p>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </div>

              <div className="mb-6">
                <ProgressBar value={percentageForStudent(activeCourse, studentName)} label="Overall Progress" />
              </div>

              <div className="grid gap-5">
                {activeCourse.modules.map((module, moduleIndex) => {
                  const assessmentGateEnabled = activeCourse.assessmentGateEnabled ?? true;
                  const previousModule = moduleIndex > 0 ? activeCourse.modules[moduleIndex - 1] : null;
                  const previousAssessments = previousModule ? (moduleAssessmentsMap[previousModule.id] ?? []) : [];
                  const previousModulePassed =
                    !previousAssessments.length ||
                    previousAssessments.some((assessment) => latestResultByAssessment[assessment.id]?.passed);
                  const gateLocksModule = assessmentGateEnabled && moduleIndex > 0 && !previousModulePassed;
                  const moduleAssessments = moduleAssessmentsMap[module.id] ?? [];
                  const activeAssessmentId = openAssessmentByModule[module.id] ?? moduleAssessments[0]?.id ?? "";
                  const activeAssessment = moduleAssessments.find((assessment) => assessment.id === activeAssessmentId) ?? moduleAssessments[0];
                  const moduleResult = activeAssessment ? latestResultForAssessment(activeAssessment) : null;

                  return (
                    <div key={module.id} className={`rounded-2xl border p-4 ${gateLocksModule ? "border-amber-200 bg-amber-50/40" : "border-border bg-card/40"}`}>
                      <div className="mb-3 flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{module.title}</p>
                        <span className="text-xs text-muted-foreground">({module.lessons.length} lessons)</span>
                        {gateLocksModule ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <LockKeyhole className="h-3 w-3" />
                            Assessment required
                          </span>
                        ) : null}
                      </div>

                      {gateLocksModule ? (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                          Complete and pass the previous module assessment to unlock this module.
                        </div>
                      ) : null}

                      <div className="grid gap-2">
                        {module.lessons.map((lesson) => {
                          const completed = lesson.completedBy.includes(studentName);
                          const hasVideo = !!lesson.contentUrl && extractYouTubeId(lesson.contentUrl) !== null;
                          const hasFile = !!lesson.contentUrl && !hasVideo;
                          const thumbnail = lesson.contentUrl ? getVideoThumbnail(lesson.contentUrl) : null;

                          return (
                            <div key={lesson.id} className={`rounded-xl border transition-all ${completed ? "border-success/30 bg-success/5" : "border-border bg-card/50 hover:border-primary/30"}`}>
                              <div className="flex items-center gap-3 p-3">
                                {hasVideo && thumbnail ? (
                                  <button
                                    type="button"
                                    disabled={gateLocksModule}
                                    onClick={() => setActiveVideo({ url: lesson.contentUrl!, title: lesson.title })}
                                    className="group relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-border/50 disabled:cursor-not-allowed"
                                  >
                                    <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600">
                                        <Play className="ml-px h-3 w-3 fill-white text-white" />
                                      </div>
                                    </div>
                                  </button>
                                ) : (
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${completed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                                    {completed ? <CheckCircle className="h-4 w-4" /> : getLessonIcon(lesson.type, hasVideo)}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!gateLocksModule && hasVideo) setActiveVideo({ url: lesson.contentUrl!, title: lesson.title });
                                    }}
                                    className={`block w-full truncate text-left text-sm font-medium ${hasVideo && !gateLocksModule ? "cursor-pointer hover:text-primary" : ""} ${completed ? "text-success" : "text-foreground"}`}
                                  >
                                    {lesson.title}
                                  </button>
                                  <p className="text-xs capitalize text-muted-foreground">
                                    {lesson.type} · {lesson.durationMinutes} min
                                    {hasVideo ? <span className="ml-1.5 font-medium text-red-500">Video</span> : null}
                                    {hasFile && lesson.contentOriginalName ? <span className="ml-1.5 text-blue-600">· {lesson.contentOriginalName}</span> : null}
                                  </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {hasVideo ? (
                                    <button
                                      type="button"
                                      disabled={gateLocksModule}
                                      onClick={() => setActiveVideo({ url: lesson.contentUrl!, title: lesson.title })}
                                      className="btn-outline flex items-center gap-1.5 border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                                    >
                                      <Play className="h-3 w-3" />
                                      Watch
                                    </button>
                                  ) : null}
                                  {hasFile ? (
                                    <a
                                      href={gateLocksModule ? undefined : lesson.contentUrl ?? undefined}
                                      target="_blank"
                                      rel="noreferrer"
                                      aria-disabled={gateLocksModule}
                                      className={`btn-outline px-3 py-1.5 text-xs ${gateLocksModule ? "pointer-events-none opacity-60" : ""}`}
                                    >
                                      <FileText className="h-3 w-3" />
                                      Open content
                                    </a>
                                  ) : null}
                                  {!completed ? (
                                    <button
                                      type="button"
                                      disabled={completing === lesson.id || gateLocksModule}
                                      onClick={() => handleComplete(activeCourse.id, lesson.id)}
                                      className="btn-primary shrink-0 px-3 py-1.5 text-xs"
                                    >
                                      {completing === lesson.id ? "Saving..." : "Mark Done"}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {!module.lessons.length ? <p className="p-2 text-xs italic text-muted-foreground">No lessons in this module yet.</p> : null}
                      </div>

                      {!gateLocksModule ? (
                        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-primary" />
                              <p className="text-sm font-semibold text-foreground">Online Assessment</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{moduleAssessments.length} published</span>
                          </div>

                          {!moduleAssessments.length ? (
                            <p className="text-xs text-muted-foreground">No published assessment linked to this module yet.</p>
                          ) : (
                            <>
                              <div className="mb-3 flex flex-wrap gap-2">
                                {moduleAssessments.map((assessment) => (
                                  <button
                                    key={assessment.id}
                                    type="button"
                                    onClick={() => setOpenAssessmentByModule((current) => ({ ...current, [module.id]: assessment.id }))}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${activeAssessment?.id === assessment.id ? "border-primary/40 bg-white text-primary dark:bg-primary/15 dark:text-[#F5C766]" : "border-foreground/15 bg-background/70 text-muted-foreground hover:border-primary/30 dark:bg-white/5"}`}
                                  >
                                    {assessment.title}
                                  </button>
                                ))}
                              </div>

                              {activeAssessment ? (
                                <div className="rounded-xl border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-foreground">{activeAssessment.title}</p>
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                                      {activeAssessment.type}
                                    </span>
                                  </div>

                                  {activeAssessment.type === "MCQ" || activeAssessment.type === "True/False" ? (
                                    <div className="grid gap-3">
                                      {activeAssessment.questions.map((question, index) => (
                                        <div key={question.id} className="rounded-lg border border-foreground/10 bg-background/60 p-3">
                                          <p className="text-sm font-medium text-foreground">Q{index + 1}. {question.prompt}</p>
                                          <div className="mt-2 grid gap-2">
                                            {question.options.map((option) => {
                                              const selected = (mcqAnswersByAssessment[activeAssessment.id] ?? {})[question.id] === option;
                                              return (
                                                <button
                                                  key={option}
                                                  type="button"
                                                  onClick={() =>
                                                    setMcqAnswersByAssessment((current) => ({
                                                      ...current,
                                                      [activeAssessment.id]: {
                                                        ...(current[activeAssessment.id] ?? {}),
                                                        [question.id]: option
                                                      }
                                                    }))
                                                  }
                                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${selected ? "border-primary/40 bg-primary/10 text-foreground" : "border-foreground/10 bg-white hover:border-primary/30 dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/10"}`}
                                                >
                                                  {selected ? <CheckCircle className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                                  <span>{option}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Write your answer
                                      </label>
                                      <div className="relative">
                                        <PenSquare className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <textarea
                                          value={writtenAnswerByAssessment[activeAssessment.id] ?? ""}
                                          onChange={(event) =>
                                            setWrittenAnswerByAssessment((current) => ({
                                              ...current,
                                              [activeAssessment.id]: event.target.value
                                            }))
                                          }
                                          placeholder="Write your full answer here..."
                                          className="form-input min-h-[130px] pl-9"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => void handleSubmitAssessment(module.id, activeAssessment)}
                                      disabled={submittingAssessmentId === activeAssessment.id}
                                      className="btn-primary"
                                    >
                                      <SendHorizontal className="h-4 w-4" />
                                      {submittingAssessmentId === activeAssessment.id ? "Submitting..." : "Submit Assessment"}
                                    </button>
                                    <span className="text-xs text-muted-foreground">
                                      Submitted data is saved and visible to instructors in their submissions panel.
                                    </span>
                                  </div>

                                  {moduleResult ? (
                                    <div className={`mt-4 rounded-xl border p-3 text-sm ${moduleResult.passed ? "border-success/30 bg-success/10 text-success" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
                                      <p className="font-semibold">Result: {moduleResult.score}% · {moduleResult.passed ? "Passed" : "Needs Work"}</p>
                                      <p className="mt-1 leading-6">{moduleResult.feedback}</p>
                                      {moduleResult.status ? <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-80">Status: {moduleResult.status}</p> : null}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeVideo ? (
        <YouTubePlayer videoUrl={activeVideo.url} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
      ) : null}
    </DashboardLayout>
  );
}
