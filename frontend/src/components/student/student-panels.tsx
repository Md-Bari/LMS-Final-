"use client";

import type { CourseModule, LiveClass } from "@/lib/mock-lms";
import { Award, BookOpen, CalendarClock, CheckCircle2, CheckCircle, XCircle, FileText, Sparkles, Video, ClipboardCheck, PenSquare, Play, RefreshCw, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { useMockLms } from "@/providers/mock-lms-provider";
import { YouTubePlayer } from "@/components/shared/youtube-player";
import { fetchStudentLiveClassesFromBackend, fetchMySubmissionsFromBackend, getStoredToken } from "@/lib/api/lms-backend";

import {
  Badge,
  buildCertificateHtml,
  downloadHtmlFile,
  PrimaryButton,
  SecondaryButton,
  SeeMoreButton,
  Section,
  SelectInput,
  TextArea,
  TextInput,
  percentageForStudent
} from "@/components/shared/lms-core";

const learnerMetricCardStyles = [
  "border-[#0f766e]/18 bg-[linear-gradient(180deg,rgba(15,118,110,0.06),rgba(255,255,255,0.92))] dark:bg-white/[0.03]",
  "border-[#1d4ed8]/18 bg-[linear-gradient(180deg,rgba(29,78,216,0.06),rgba(255,255,255,0.92))] dark:bg-white/[0.03]",
  "border-[#f59e0b]/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.07),rgba(255,255,255,0.92))] dark:bg-white/[0.03]",
  "border-[#dc2626]/18 bg-[linear-gradient(180deg,rgba(220,38,38,0.05),rgba(255,255,255,0.92))] dark:bg-white/[0.03]"
] as const;

const learnerCourseCardStyles = [
  "border-[#0f766e]/16 bg-[linear-gradient(135deg,rgba(15,118,110,0.04),rgba(255,255,255,0.94)_34%)] dark:bg-white/[0.02]",
  "border-[#1d4ed8]/16 bg-[linear-gradient(135deg,rgba(29,78,216,0.04),rgba(255,255,255,0.94)_34%)] dark:bg-white/[0.02]",
  "border-[#f59e0b]/16 bg-[linear-gradient(135deg,rgba(245,158,11,0.05),rgba(255,255,255,0.94)_34%)] dark:bg-white/[0.02]",
  "border-[#dc2626]/14 bg-[linear-gradient(135deg,rgba(220,38,38,0.04),rgba(255,255,255,0.94)_34%)] dark:bg-white/[0.02]"
] as const;

const learnerModuleCardStyles = [
  "border-[#0f766e]/14 bg-[linear-gradient(180deg,rgba(15,118,110,0.04),rgba(255,255,255,0.94))] dark:bg-white/[0.02]",
  "border-[#1d4ed8]/14 bg-[linear-gradient(180deg,rgba(29,78,216,0.04),rgba(255,255,255,0.94))] dark:bg-white/[0.02]",
  "border-[#f59e0b]/14 bg-[linear-gradient(180deg,rgba(245,158,11,0.05),rgba(255,255,255,0.94))] dark:bg-white/[0.02]",
  "border-[#dc2626]/12 bg-[linear-gradient(180deg,rgba(220,38,38,0.04),rgba(255,255,255,0.94))] dark:bg-white/[0.02]"
] as const;

const learnerAccentBars = [
  "from-[#0f766e] via-[#2dd4bf] to-[#99f6e4]",
  "from-[#1d4ed8] via-[#60a5fa] to-[#dbeafe]",
  "from-[#f59e0b] via-[#fbbf24] to-[#fde68a]",
  "from-[#dc2626] via-[#fb7185] to-[#fecdd3]"
] as const;

export function StudentAssessmentPanel() {
  const { state, currentUser, submitAssessment } = useMockLms();
  const [assessmentId, setAssessmentId] = useState(state.assessments[0]?.id ?? "");
  const [answerText, setAnswerText] = useState("This answer references compliance, audit, and policy design to satisfy the rubric.");
  const studentName = currentUser?.name ?? "Student";
  const mySubmissions = state.submissions.filter((submission) => submission.studentName === studentName);
  const availableTypes = Array.from(
    new Set(
      mySubmissions
        .map((submission) => state.assessments.find((assessment) => assessment.id === submission.assessmentId)?.type)
        .filter((value): value is NonNullable<typeof value> => value !== undefined)
    )
  );
  const submissionTabs = [
    { id: "all", label: "All", count: mySubmissions.length },
    { id: "passed", label: "Passed", count: mySubmissions.filter((submission) => submission.passed).length },
    { id: "needs-work", label: "Needs work", count: mySubmissions.filter((submission) => !submission.passed).length },
    ...availableTypes.map((type) => ({
      id: `type-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label: type,
      count: mySubmissions.filter((submission) => state.assessments.find((assessment) => assessment.id === submission.assessmentId)?.type === type).length
    }))
  ].filter((tab, index, allTabs) => allTabs.findIndex((item) => item.id === tab.id) === index && (tab.count > 0 || tab.id === "all"));
  const [activeSubmissionTab, setActiveSubmissionTab] = useState(submissionTabs[0]?.id ?? "all");
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const filteredSubmissions = mySubmissions.filter((submission) => {
    if (activeSubmissionTab === "all") return true;
    if (activeSubmissionTab === "passed") return submission.passed;
    if (activeSubmissionTab === "needs-work") return !submission.passed;

    if (activeSubmissionTab.startsWith("type-")) {
      const type = activeSubmissionTab.replace(/^type-/, "").replace(/-/g, " ");
      return state.assessments.find((assessment) => assessment.id === submission.assessmentId)?.type.toLowerCase() === type;
    }

    return true;
  });
  const visibleSubmissions = showAllSubmissions ? filteredSubmissions : filteredSubmissions.slice(0, 5);
  const latestSubmission = mySubmissions[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Section title="Take assessment" subtitle="Students can submit quiz or essay responses and receive immediate scoring and feedback in the demo.">
        <div className="grid gap-3">
          <SelectInput value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)}>
            {state.assessments.filter((assessment) => assessment.status === "published").map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title}
              </option>
            ))}
          </SelectInput>
          <TextArea value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="Write your answer here" />
          <PrimaryButton onClick={() => submitAssessment(assessmentId, studentName, answerText)}>Submit assessment</PrimaryButton>
        </div>
      </Section>

      <Section title="Submission history" subtitle="Scores, pass/fail outcomes, and written feedback are preserved in the mock student record.">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.3rem] border border-[#0f766e]/15 bg-[linear-gradient(180deg,rgba(15,118,110,0.06),rgba(255,255,255,0.96))] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total submitted</p>
              <p className="mt-2 font-serif text-3xl">{mySubmissions.length}</p>
            </div>
            <div className="rounded-[1.3rem] border border-[#1d4ed8]/15 bg-[linear-gradient(180deg,rgba(29,78,216,0.06),rgba(255,255,255,0.96))] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Passed</p>
              <p className="mt-2 font-serif text-3xl">{mySubmissions.filter((submission) => submission.passed).length}</p>
            </div>
            <div className="rounded-[1.3rem] border border-[#f59e0b]/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.06),rgba(255,255,255,0.96))] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Latest score</p>
              <p className="mt-2 font-serif text-3xl">{latestSubmission ? `${latestSubmission.score}%` : "--"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {submissionTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubmissionTab(tab.id);
                  setShowAllSubmissions(false);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeSubmissionTab === tab.id
                    ? "border-[#1A1A2E]/20 bg-[linear-gradient(135deg,#1A1A2E,#2D2D50_60%,#E8A020)] text-white shadow-glow"
                    : "border-foreground/10 bg-white/80 text-foreground shadow-soft"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {visibleSubmissions.length ? (
            <div className="grid gap-4">
              {visibleSubmissions.map((submission, index) => {
                const assessment = state.assessments.find((item) => item.id === submission.assessmentId);
                return (
                  <div key={submission.id} className={`workspace-reveal ${index < 3 ? `workspace-delay-${index + 1}` : ""} rounded-[1.4rem] border p-4 shadow-soft ${submission.passed ? "border-[#0f766e]/16 bg-[linear-gradient(135deg,rgba(15,118,110,0.06),rgba(255,255,255,0.98))]" : "border-[#f59e0b]/18 bg-[linear-gradient(135deg,rgba(245,158,11,0.07),rgba(255,255,255,0.98))]"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{assessment?.title ?? "Assessment"}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {assessment?.type ?? "Assessment"} · {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={submission.passed ? "border-[#0f766e]/20 bg-[#0f766e]/10 text-[#0f766e]" : "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#b45309]"}>
                          {submission.passed ? "passed" : "needs work"}
                        </Badge>
                        <Badge className="bg-white/85">{submission.score}%</Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{submission.feedback}</p>
                    <div className="mt-3 rounded-[1rem] bg-white/70 px-3 py-2 text-xs text-muted-foreground">
                      {submission.answerText}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-foreground/15 bg-[linear-gradient(135deg,rgba(255,248,234,0.75),rgba(255,255,255,0.96))] p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">No submissions in this tab yet.</p>
              <p className="mt-2">Submit the selected assessment to see score, pass/fail outcome, and written feedback here automatically.</p>
            </div>
          )}
        </div>
        {filteredSubmissions.length > 5 ? <SeeMoreButton expanded={showAllSubmissions} remaining={filteredSubmissions.length - 5} onClick={() => setShowAllSubmissions((current) => !current)} /> : null}
      </Section>
    </div>
  );
}

export function StudentCoursesPanel({ selectedCourseId }: { selectedCourseId?: string }) {
  const { state, currentUser, markLessonComplete } = useMockLms();
  const studentName = currentUser?.name ?? "Student";
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const publishedCourses = state.courses.filter((course) => course.status === "published");
  const [activeCourseId, setActiveCourseId] = useState<string | undefined>(selectedCourseId);
  const selectedCourse = state.courses.find((course) => course.id === (activeCourseId || selectedCourseId)) ?? publishedCourses[0] ?? state.courses[0];
  const selectedCourseCertificate = state.certificates.find(
    (certificate) => certificate.courseId === selectedCourse?.id && certificate.studentName === studentName && !certificate.revoked
  );
  const visibleCourses = showAllCourses ? publishedCourses : publishedCourses.slice(0, 5);
  const visibleModules = showAllModules ? (selectedCourse?.modules ?? []) : (selectedCourse?.modules ?? []).slice(0, 5);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Section title="My courses" subtitle="Progress, drip content, and next-step clarity are all visible from the learner side.">
        <div className="grid gap-4">
          {visibleCourses.map((course, index) => {
            const isSelected = selectedCourse?.id === course.id;
            return (
            <button
              key={course.id}
              onClick={() => setActiveCourseId(course.id)}
              type="button"
              className={`text-left w-full workspace-reveal ${index < 3 ? `workspace-delay-${index + 1}` : ""} relative overflow-hidden rounded-[1.7rem] border p-5 shadow-soft transition duration-300 hover:-translate-y-[3px] hover:shadow-glow dark:border-white/8 dark:bg-[#13212a] ${isSelected ? "ring-2 ring-foreground/60 shadow-md" : ""} ${learnerCourseCardStyles[index % learnerCourseCardStyles.length]}`}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${learnerAccentBars[index % learnerAccentBars.length]}`} />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">{course.title}</p>
                  <p className="text-sm text-muted-foreground">{course.category}</p>
                </div>
                <Badge className="bg-white/80">{percentageForStudent(course, studentName)}%</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{course.description}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Progress</span>
                  <span>{percentageForStudent(course, studentName)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${learnerAccentBars[index % learnerAccentBars.length]} transition-all duration-700`}
                    style={{ width: `${Math.max(6, percentageForStudent(course, studentName))}%` }}
                  />
                </div>
              </div>
            </button>
          )})}
        </div>
        {publishedCourses.length > 5 ? <SeeMoreButton expanded={showAllCourses} remaining={publishedCourses.length - 5} onClick={() => setShowAllCourses((current) => !current)} /> : null}
      </Section>

      {selectedCourse ? (
        <Section title={selectedCourse.title} subtitle="Mark lessons complete and issue a certificate when the course is done.">
          <div className="grid gap-4">
            {visibleModules.map((module: CourseModule, index) => (
              <div key={module.id} className={`workspace-reveal ${index < 3 ? `workspace-delay-${index + 1}` : ""} relative overflow-hidden rounded-[1.55rem] border p-4 shadow-soft dark:border-white/8 dark:bg-[#13212a] ${learnerModuleCardStyles[index % learnerModuleCardStyles.length]}`}>
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${learnerAccentBars[index % learnerAccentBars.length]}`} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{module.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {module.lessons.filter((lesson) => lesson.completedBy.includes(studentName)).length}/{module.lessons.length} lessons completed
                    </p>
                  </div>
                  <Badge className="bg-white/75">Drip +{module.dripDays}d</Badge>
                </div>
                <div className="mt-4 grid gap-3">
                  {module.lessons.map((lesson) => {
                    const completed = lesson.completedBy.includes(studentName);
                    const hasVideo = !!lesson.contentUrl && /youtube\.com|youtu\.be/.test(lesson.contentUrl);
                    const videoId = hasVideo ? (lesson.contentUrl!.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] ?? lesson.contentUrl!.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1]) : null;
                    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                    return (
                      <div key={lesson.id} className={`group flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-foreground/10 p-3 transition duration-300 hover:-translate-y-0.5 dark:border-white/8 ${completed ? "bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(255,255,255,0.78))]" : "bg-background/70 dark:bg-white/5"}`}>
                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                          {hasVideo && thumbnail ? (
                            <button
                              type="button"
                              onClick={() => setActiveVideo({ url: lesson.contentUrl!, title: lesson.title })}
                              className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0 border border-border/50 group/video"
                            >
                              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/video:bg-black/40 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                                  <Play className="w-2.5 h-2.5 text-white fill-white ml-px" />
                                </div>
                              </div>
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.type} · {lesson.durationMinutes} min</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap shrink-0">
                          {(lesson.contentUrl || lesson.type === "quiz" || lesson.type === "assignment") && (
                            <SecondaryButton
                              onClick={() => {
                                if (hasVideo) {
                                  setActiveVideo({ url: lesson.contentUrl!, title: lesson.title });
                                } else if (lesson.type === "quiz" || lesson.type === "assignment") {
                                  document.querySelector<HTMLButtonElement>('button[data-id="assessments"]')?.click();
                                  setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, 100);
                                } else {
                                  window.open(lesson.contentUrl!, "_blank", "noopener,noreferrer");
                                }
                              }}
                            >
                              {hasVideo ? "Watch Video" : (lesson.type === "quiz" || lesson.type === "assignment") ? "Take Assessment" : "View PDF/Content"}
                            </SecondaryButton>
                          )}
                          <Badge className={completed ? "border-[#0f766e]/20 bg-[#0f766e]/10 text-[#0f766e]" : "bg-white/70"}>{completed ? "completed" : "pending"}</Badge>
                          {!completed ? (
                            <SecondaryButton onClick={() => markLessonComplete(selectedCourse.id, lesson.id, studentName)}>
                              Mark complete
                            </SecondaryButton>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[#0f766e] shadow-soft">
                              <CheckCircle2 className="h-4 w-4" />
                              Synced
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedCourse.modules.length > 5 ? <SeeMoreButton expanded={showAllModules} remaining={selectedCourse.modules.length - 5} onClick={() => setShowAllModules((current) => !current)} /> : null}
            {selectedCourseCertificate ? (
              <PrimaryButton
                className="soft-shimmer"
                onClick={() =>
                  downloadHtmlFile(
                    `${studentName.replace(/\s+/g, "-").toLowerCase()}-${selectedCourse.id}-certificate.html`,
                    buildCertificateHtml({
                      certificate: selectedCourseCertificate,
                      branding: state.branding
                    })
                  )
                }
              >
                Download earned certificate
              </PrimaryButton>
            ) : (
              <div className="workspace-reveal rounded-[1.35rem] border border-dashed border-foreground/15 bg-[linear-gradient(135deg,rgba(255,248,234,0.7),rgba(255,255,255,0.92))] p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#fff4db] p-2 text-[#f59e0b]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p>Finish every lesson in this course and your certificate will be issued automatically.</p>
                </div>
              </div>
            )}
          </div>
        </Section>
      ) : null}
      
      {activeVideo && (
        <YouTubePlayer
          videoUrl={activeVideo.url}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}

export function StudentSettingsPanel() {
  const { currentUser } = useMockLms();

  return (
    <Section title="Student profile and settings" subtitle="Manage learner identity, preferences, and convenience settings from the frontend.">
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput defaultValue={currentUser?.name ?? "Student"} />
        <TextInput defaultValue={currentUser?.email ?? "student@example.com"} />
        <TextInput defaultValue={currentUser?.department ?? "Learner"} />
        <SelectInput defaultValue="Daily">
          <option>Daily</option>
          <option>Only important reminders</option>
          <option>Weekly summary</option>
        </SelectInput>
      </div>
    </Section>
  );
}

export function StudentLiveClassesPanel() {
  const { state } = useMockLms();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLiveClasses = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLiveClasses(state.liveClasses);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchStudentLiveClassesFromBackend();
      setLiveClasses(data);
      setLastUpdated(new Date());
    } catch {
      setLiveClasses(state.liveClasses);
    } finally {
      setLoading(false);
    }
  }, [state.liveClasses]);

  useEffect(() => {
    void fetchLiveClasses();
    // Auto-refresh every 30 seconds so going-live is reflected quickly
    const interval = setInterval(() => { void fetchLiveClasses(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchLiveClasses]);

  // Group live classes by course
  const courseGroups: Array<{ courseId: string; courseTitle: string; classes: LiveClass[] }> = [];
  for (const liveClass of liveClasses) {
    const course = state.courses.find((c) => c.id === liveClass.courseId);
    const courseId = liveClass.courseId ?? "uncategorized";
    const courseTitle = course?.title ?? liveClass.batchName ?? "General";
    const existing = courseGroups.find((g) => g.courseId === courseId);
    if (existing) { existing.classes.push(liveClass); }
    else { courseGroups.push({ courseId, courseTitle, classes: [liveClass] }); }
  }

  function canJoinNow(liveClass: LiveClass) {
    if (liveClass.status === "cancelled" || liveClass.status === "recorded") return false;
    if (liveClass.canJoin !== undefined) return liveClass.canJoin;
    const startAt = new Date(liveClass.startAt).getTime();
    const endAt = liveClass.endAt ? new Date(liveClass.endAt).getTime() : startAt + liveClass.durationMinutes * 60 * 1000;
    const now = Date.now();
    return now >= startAt - 15 * 60 * 1000 && now <= endAt + 15 * 60 * 1000;
  }

  const meetingLink = (liveClass: LiveClass) => liveClass.meetingUrl ?? liveClass.meetingLink;

  const statusColors: Record<string, string> = {
    live: "border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-950/30 dark:text-green-400",
    scheduled: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-400",
    recorded: "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900/30 dark:bg-purple-950/30 dark:text-purple-400",
    cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400",
  };

  return (
    <Section
      title="Live Classes"
      subtitle="Course-wise live sessions — auto-refreshes every 30s so you see when your teacher goes live instantly."
    >
      {/* Header: last updated + refresh */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading..."}
        </p>
        <button
          type="button"
          onClick={() => { setLoading(true); void fetchLiveClasses(); }}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50 dark:bg-white/10"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && liveClasses.length === 0 ? (
        <div className="grid h-32 place-content-center text-sm text-muted-foreground">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin opacity-40" />
          Fetching live classes...
        </div>
      ) : courseGroups.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-foreground/15 bg-background/60 p-8 text-center text-sm text-muted-foreground dark:border-white/10">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="font-semibold text-foreground">No live classes scheduled yet.</p>
          <p className="mt-1">Your teacher will add live sessions to your enrolled courses.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {courseGroups.map((group, groupIndex) => (
            <div key={group.courseId}>
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${learnerAccentBars[groupIndex % learnerAccentBars.length]}`} />
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">{group.courseTitle}</p>
                <span className="rounded-full border border-foreground/10 bg-background/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {group.classes.length} {group.classes.length === 1 ? "session" : "sessions"}
                </span>
              </div>

              <div className="grid gap-3">
                {group.classes.map((liveClass) => {
                  const link = meetingLink(liveClass);
                  const joinable = canJoinNow(liveClass);
                  const isLive = liveClass.status === "live";
                  const statusClass = statusColors[liveClass.status] ?? statusColors.scheduled;

                  return (
                    <div
                      key={liveClass.id}
                      className={`relative overflow-hidden rounded-[1.4rem] border p-5 shadow-soft dark:bg-[#13212a] ${
                        isLive
                          ? "border-green-200 bg-[linear-gradient(135deg,rgba(22,163,74,0.06),rgba(255,255,255,0.99))] dark:border-green-900/30"
                          : "border-foreground/10 bg-white"
                      }`}
                    >
                      {isLive && <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />}

                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-serif text-xl font-semibold text-foreground">{liveClass.title}</p>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusClass}`}>
                              {isLive && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
                              {liveClass.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(liveClass.startAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                            {liveClass.endAt ? ` – ${new Date(liveClass.endAt).toLocaleTimeString("en-US", { timeStyle: "short" })}` : ""}
                            {" · "}<span className="font-medium">{liveClass.provider ?? "Jitsi"}</span>
                            {liveClass.durationMinutes ? ` · ${liveClass.durationMinutes} min` : ""}
                          </p>
                          {liveClass.description ? <p className="mt-2 text-sm text-muted-foreground">{liveClass.description}</p> : null}
                        </div>
                      </div>

                      {/* Always-visible meeting link */}
                      {link ? (
                        <div className="mt-4 rounded-[1rem] border border-foreground/10 bg-background/70 p-3 dark:border-white/8 dark:bg-white/5">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Meeting Link</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80">
                              {link}
                            </a>
                            <button type="button" onClick={() => navigator.clipboard.writeText(link)} className="shrink-0 rounded-full border border-foreground/10 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted dark:bg-white/10">
                              Copy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[1rem] border border-dashed border-foreground/10 bg-background/40 p-3 text-xs text-muted-foreground dark:border-white/8">
                          Meeting link will be shared by the teacher before the session.
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {link && (
                          <PrimaryButton onClick={() => window.open(link, "_blank", "noopener,noreferrer")} disabled={liveClass.status === "cancelled"}>
                            {isLive || joinable ? "Join Now" : liveClass.status === "cancelled" ? "Cancelled" : "Open Link"}
                          </PrimaryButton>
                        )}
                        {liveClass.recordingUrl ? (
                          <SecondaryButton onClick={() => window.open(liveClass.recordingUrl ?? undefined, "_blank", "noopener,noreferrer")}>
                            Watch Recording
                          </SecondaryButton>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function StudentFeedbackPanel() {
  type Submission = {
    id: string;
    assessmentId: string;
    assessmentTitle: string | null;
    assessmentType: string | null;
    courseId: string | null;
    courseTitle: string | null;
    answerText: string;
    status: string | null;
    score: number;
    passingMark: number;
    feedback: string | null;
    aiFeedback: string | null;
    teacherFeedback: string | null;
    passed: boolean;
    submittedAt: string | null;
  };

  const { state } = useMockLms();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>("all");

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMySubmissionsFromBackend();
      setSubmissions(data as Submission[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feedback.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const courses = Array.from(
    new Map(submissions.filter((s) => s.courseId).map((s) => [s.courseId, s.courseTitle])).entries()
  );

  const filtered = filterCourse === "all" ? submissions : submissions.filter((s) => s.courseId === filterCourse);

  return (
    <Section
      title="My Feedback & Marks"
      subtitle="Teacher marks, AI feedback, and grading results for your submitted assessments — pulled live from the database."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Course filter */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCourse("all")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filterCourse === "all" ? "border-foreground/20 bg-foreground text-background" : "border-foreground/10 bg-white/80 text-foreground hover:bg-muted dark:bg-white/10"
            }`}
          >
            All courses
          </button>
          {courses.map(([id, title]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilterCourse(id!)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filterCourse === id ? "border-foreground/20 bg-foreground text-background" : "border-foreground/10 bg-white/80 text-foreground hover:bg-muted dark:bg-white/10"
              }`}
            >
              {title ?? "Course"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { setLoading(true); void load(); }} disabled={loading} className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50 dark:bg-white/10">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">{error}</div>
      ) : loading ? (
        <div className="grid h-32 place-content-center text-sm text-muted-foreground">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin opacity-40" />Loading feedback...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-foreground/15 bg-background/60 p-8 text-center text-sm text-muted-foreground dark:border-white/10">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="font-semibold text-foreground">No submissions yet.</p>
          <p className="mt-1">Submit an assessment to see your feedback and marks here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((sub, index) => {
            const scoreColor = sub.passed
              ? "border-green-200 bg-[linear-gradient(135deg,rgba(22,163,74,0.06),rgba(255,255,255,0.99))] dark:border-green-900/30"
              : "border-amber-200 bg-[linear-gradient(135deg,rgba(245,158,11,0.07),rgba(255,255,255,0.99))] dark:border-amber-900/30";

            return (
              <div key={sub.id} className={`workspace-reveal ${index < 3 ? `workspace-delay-${index + 1}` : ""} rounded-[1.4rem] border p-5 shadow-soft dark:bg-[#13212a] ${scoreColor}`}>
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg font-semibold text-foreground">{sub.assessmentTitle ?? "Assessment"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {sub.courseTitle ?? "Course"} · {sub.assessmentType} ·{" "}
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${
                      sub.passed
                        ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-950/30 dark:text-green-400"
                        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-400"
                    }`}>
                      {sub.passed ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {sub.score}%
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                      sub.passed
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}>
                      {sub.passed ? "Passed" : "Needs work"}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>Score</span>
                    <span>{sub.score}% / {sub.passingMark}% to pass</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        sub.passed ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-amber-400 to-orange-400"
                      }`}
                      style={{ width: `${Math.max(4, sub.score)}%` }}
                    />
                  </div>
                </div>

                {/* Status badge */}
                {sub.status && (
                  <div className="mt-3">
                    <span className="rounded-full border border-foreground/10 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {sub.status.replace(/_/g, " ")}
                    </span>
                  </div>
                )}

                {/* Teacher feedback — highlighted */}
                {sub.teacherFeedback && (
                  <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Teacher Feedback</p>
                    <p className="text-sm leading-6 text-foreground">{sub.teacherFeedback}</p>
                  </div>
                )}

                {/* AI / auto feedback */}
                {(sub.aiFeedback || sub.feedback) && (
                  <div className="mt-3 rounded-[1rem] border border-foreground/10 bg-background/70 p-3 dark:border-white/8 dark:bg-white/5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Auto Feedback</p>
                    <p className="text-sm leading-6 text-muted-foreground">{sub.aiFeedback ?? sub.feedback}</p>
                  </div>
                )}

                {/* Answer excerpt (collapsed) */}
                {sub.answerText && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">View submitted answer</summary>
                    <div className="mt-2 rounded-[0.9rem] bg-background/60 px-3 py-2 text-xs leading-6 text-muted-foreground dark:bg-white/5">{sub.answerText}</div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

export function StudentCertificatesPanel() {
  const { state, currentUser } = useMockLms();
  const studentName = currentUser?.name ?? "Student";
  const myCertificates = state.certificates.filter((certificate) => certificate.studentName === studentName);
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const visibleCertificates = showAllCertificates ? myCertificates : myCertificates.slice(0, 5);

  return (
    <Section title="My certificates" subtitle="Completed courses that reached 100% can show a ready-to-download certificate here for the signed-in learner.">
      <div className="grid gap-4">
        {visibleCertificates.map((certificate) => (
          <div key={certificate.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{certificate.courseTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">Issued {new Date(certificate.issuedAt).toLocaleDateString()}</p>
              </div>
              <Badge>{certificate.revoked ? "revoked" : "active"}</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="rounded-[1.2rem] border border-foreground/10 bg-background/70 p-4 text-sm text-muted-foreground dark:border-white/8 dark:bg-white/5">
                <div>
                  Certificate no:{" "}
                  <span className="font-semibold text-foreground">{certificate.certificateNumber ?? "Pending sync"}</span>
                </div>
                <div className="mt-2">
                  Verification code: <span className="font-semibold text-foreground">{certificate.verificationCode}</span>
                </div>
              </div>
              <PrimaryButton
                onClick={() =>
                  downloadHtmlFile(
                    `${studentName.replace(/\s+/g, "-").toLowerCase()}-${certificate.courseId}-certificate.html`,
                    buildCertificateHtml({
                      certificate,
                      branding: state.branding
                    })
                  )
                }
                className="w-full min-w-[220px] md:w-auto"
              >
                Download premium certificate
              </PrimaryButton>
            </div>
          </div>
        ))}
        {!myCertificates.length ? (
          <div className="rounded-[1.4rem] border border-dashed border-foreground/15 bg-background/60 p-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5">
            No certificates have been issued to this learner yet.
          </div>
        ) : null}
      </div>
      {myCertificates.length > 5 ? <SeeMoreButton expanded={showAllCertificates} remaining={myCertificates.length - 5} onClick={() => setShowAllCertificates((current) => !current)} /> : null}
    </Section>
  );
}

export function StudentDashboardPanel() {
  const { state, currentUser } = useMockLms();
  const studentName = currentUser?.name ?? "Student";

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[
          { 
            label: "My courses", 
            value: String(state.enrollments.filter(e => 
              e.status === "active" && 
              (e.studentId === currentUser?.id || e.studentName === studentName)
            ).length), 
            icon: <BookOpen className="h-5 w-5" /> 
          },
          { label: "Assessments taken", value: String(state.submissions.filter((submission) => submission.studentName === studentName).length), icon: <FileText className="h-5 w-5" /> },
          { label: "Upcoming live classes", value: String(state.liveClasses.filter((item) => item.status === "scheduled").length), icon: <CalendarClock className="h-5 w-5" /> },
          { label: "Certificates", value: String(state.certificates.filter((certificate) => certificate.studentName === studentName).length), icon: <Award className="h-5 w-5" /> }
        ].map((item, index) => (
          <div key={item.label} className={`workspace-reveal ${index < 3 ? `workspace-delay-${index + 1}` : ""} rounded-[24px] border p-5 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-glow ${learnerMetricCardStyles[index % learnerMetricCardStyles.length]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
              <div className="rounded-[18px] bg-white/70 p-2.5 text-[#1A1A2E] shadow-sm">
                {item.icon}
              </div>
            </div>
            <p className="mt-3 font-serif text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-[1.05]">{item.value}</p>
          </div>
        ))}
      </div>
      <StudentCoursesPanel />
    </div>
  );
}
