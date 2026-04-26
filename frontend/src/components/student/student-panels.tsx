"use client";

import type { CourseModule } from "@/lib/mock-lms";
import { Award, BookOpen, CalendarClock, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { useState } from "react";

import { useMockLms } from "@/providers/mock-lms-provider";

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
  "border-[#0f766e]/18 bg-[linear-gradient(180deg,rgba(15,118,110,0.08),rgba(255,255,255,0.96))]",
  "border-[#1d4ed8]/18 bg-[linear-gradient(180deg,rgba(29,78,216,0.08),rgba(255,255,255,0.96))]",
  "border-[#f59e0b]/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.09),rgba(255,255,255,0.96))]",
  "border-[#dc2626]/18 bg-[linear-gradient(180deg,rgba(220,38,38,0.07),rgba(255,255,255,0.96))]"
] as const;

const learnerCourseCardStyles = [
  "border-[#0f766e]/16 bg-[linear-gradient(135deg,rgba(15,118,110,0.06),rgba(255,255,255,0.98)_34%)]",
  "border-[#1d4ed8]/16 bg-[linear-gradient(135deg,rgba(29,78,216,0.06),rgba(255,255,255,0.98)_34%)]",
  "border-[#f59e0b]/16 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0.98)_34%)]",
  "border-[#dc2626]/14 bg-[linear-gradient(135deg,rgba(220,38,38,0.05),rgba(255,255,255,0.98)_34%)]"
] as const;

const learnerModuleCardStyles = [
  "border-[#0f766e]/14 bg-[linear-gradient(180deg,rgba(15,118,110,0.05),rgba(255,255,255,0.98))]",
  "border-[#1d4ed8]/14 bg-[linear-gradient(180deg,rgba(29,78,216,0.05),rgba(255,255,255,0.98))]",
  "border-[#f59e0b]/14 bg-[linear-gradient(180deg,rgba(245,158,11,0.06),rgba(255,255,255,0.98))]",
  "border-[#dc2626]/12 bg-[linear-gradient(180deg,rgba(220,38,38,0.04),rgba(255,255,255,0.98))]"
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
  const selectedCourse = state.courses.find((course) => course.id === selectedCourseId) ?? state.courses[0];
  const selectedCourseCertificate = state.certificates.find(
    (certificate) => certificate.courseId === selectedCourse?.id && certificate.studentName === studentName && !certificate.revoked
  );
  const publishedCourses = state.courses.filter((course) => course.status === "published");
  const visibleCourses = showAllCourses ? publishedCourses : publishedCourses.slice(0, 5);
  const visibleModules = showAllModules ? (selectedCourse?.modules ?? []) : (selectedCourse?.modules ?? []).slice(0, 5);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Section title="My courses" subtitle="Progress, drip content, and next-step clarity are all visible from the learner side.">
        <div className="grid gap-4">
          {visibleCourses.map((course, index) => (
            <div key={course.id} className={`workspace-reveal ${index < 3 ? `workspace-delay-${index + 1}` : ""} relative overflow-hidden rounded-[1.7rem] border p-5 shadow-soft transition duration-300 hover:-translate-y-[3px] hover:shadow-glow dark:border-white/8 dark:bg-[#13212a] ${learnerCourseCardStyles[index % learnerCourseCardStyles.length]}`}>
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
            </div>
          ))}
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
                    return (
                      <div key={lesson.id} className={`group flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-foreground/10 p-3 transition duration-300 hover:-translate-y-0.5 dark:border-white/8 ${completed ? "bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(255,255,255,0.78))]" : "bg-background/70 dark:bg-white/5"}`}>
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">{lesson.type} · {lesson.durationMinutes} min</p>
                        </div>
                        <div className="flex gap-2">
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
  const [showAllLiveClasses, setShowAllLiveClasses] = useState(false);
  const visibleLiveClasses = showAllLiveClasses ? state.liveClasses : state.liveClasses.slice(0, 5);

  return (
    <Section title="My live classes" subtitle="View upcoming sessions, schedule details, and session status without teacher scheduling controls.">
      <div className="grid gap-4">
        {visibleLiveClasses.map((liveClass) => (
          <div key={liveClass.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{liveClass.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(liveClass.startAt).toLocaleString()} · {liveClass.durationMinutes} min · {liveClass.provider}
                </p>
              </div>
              <Badge>{liveClass.status}</Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-foreground/10 bg-background/70 p-3 dark:border-white/8 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Participant limit</p>
                <p className="mt-2 font-semibold">{liveClass.participantLimit}</p>
              </div>
              <div className="rounded-[1.2rem] border border-foreground/10 bg-background/70 p-3 dark:border-white/8 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">24h reminder</p>
                <p className="mt-2 font-semibold">{liveClass.reminder24h ? "Enabled" : "Off"}</p>
              </div>
              <div className="rounded-[1.2rem] border border-foreground/10 bg-background/70 p-3 dark:border-white/8 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">1h reminder</p>
                <p className="mt-2 font-semibold">{liveClass.reminder1h ? "Enabled" : "Off"}</p>
              </div>
            </div>
            {liveClass.meetingUrl ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton onClick={() => window.open(liveClass.meetingUrl, "_blank", "noopener,noreferrer")}>
                  Join class
                </PrimaryButton>
                {liveClass.recordingUrl ? (
                  <SecondaryButton onClick={() => window.open(liveClass.recordingUrl ?? undefined, "_blank", "noopener,noreferrer")}>
                    Watch recording
                  </SecondaryButton>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Meeting link not available.</p>
            )}
          </div>
        ))}
      </div>
      {state.liveClasses.length > 5 ? <SeeMoreButton expanded={showAllLiveClasses} remaining={state.liveClasses.length - 5} onClick={() => setShowAllLiveClasses((current) => !current)} /> : null}
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
          { label: "Active courses", value: String(state.courses.filter((course) => course.status === "published").length), icon: <BookOpen className="h-5 w-5" /> },
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
