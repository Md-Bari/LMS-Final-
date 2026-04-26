"use client";

import type { ChangeEvent } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  BookOpen,
  Bot,
  CalendarClock,
  HardDriveUpload,
  Layers3,
  Upload,
  Users
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  backendReadyEndpoints,
  fallbackQuestionBank,
  type Course,
  type FallbackQuestionBankItem,
  type AssessmentType
} from "@/lib/mock-lms";
import { useMockLms } from "@/providers/mock-lms-provider";
import {
  fetchTeacherAssessmentBootstrap,
  generateTeacherAssessmentDraft,
  publishTeacherAssessment,
  uploadTeacherNote
} from "@/lib/api/lms-backend";

import {
  Badge,
  MetricGrid,
  PrimaryButton,
  SecondaryButton,
  SeeMoreButton,
  Section,
  SelectInput,
  StatCard,
  TextArea,
  TextInput,
  courseLessonCount,
  percentageForStudent,
  readNoteFile
} from "@/components/shared/lms-core";

export function CourseWorkbench({ defaultCourseId }: { defaultCourseId?: string }) {
  const { state, createCourse, publishCourse, addModule, addLesson, uploadLessonContent } = useMockLms();
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "Operations",
    description: "",
    price: 199
  });
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video" | "document" | "quiz" | "assignment" | "live">("video");
  const [lessonDuration, setLessonDuration] = useState(15);
  const [uploadStatus, setUploadStatus] = useState("");

  const selectedCourse = state.courses.find((course) => course.id === defaultCourseId) ?? state.courses[0];
  const selectedModule = selectedCourse?.modules[0];
  const [showAllLessonUploads, setShowAllLessonUploads] = useState(false);
  const [showAllPortfolioCourses, setShowAllPortfolioCourses] = useState(false);
  const visibleLessonUploads = showAllLessonUploads ? (selectedModule?.lessons ?? []) : (selectedModule?.lessons ?? []).slice(0, 5);
  const visiblePortfolioCourses = showAllPortfolioCourses ? state.courses : state.courses.slice(0, 3);

  return (
    <div className="grid gap-7 xl:grid-cols-[0.95fr_1.05fr]">
      <Section title="Course studio" subtitle="Create structured Course > Module > Lesson hierarchies with drip-ready content and publishing controls.">
        <div className="grid gap-2">
          <TextInput value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} placeholder="Course title" />
          <TextInput value={courseForm.category} onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })} placeholder="Category" />
          <TextArea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} placeholder="Describe the course outcome" className="min-h-[88px]" />
          <TextInput type="number" value={courseForm.price} onChange={(event) => setCourseForm({ ...courseForm, price: Number(event.target.value) })} />
          <PrimaryButton
            className="min-h-[42px] text-base"
            onClick={() => {
              if (!courseForm.title.trim()) return;
              createCourse(courseForm);
              setCourseForm({ title: "", category: "Operations", description: "", price: 199 });
            }}
          >
            Create new course
          </PrimaryButton>
        </div>

        {selectedCourse ? (
          <div className="mt-6 space-y-3.5 rounded-[24px] border border-foreground/10 bg-background/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{selectedCourse.title}</p>
                <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
              </div>
              <Badge>{selectedCourse.status}</Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <TextInput value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="New module title" className="max-w-xs" />
              <SecondaryButton
                className="min-h-[42px] px-5"
                onClick={() => {
                  if (!moduleTitle.trim()) return;
                  addModule(selectedCourse.id, moduleTitle);
                  setModuleTitle("");
                }}
              >
                Add module
              </SecondaryButton>
              <PrimaryButton className="min-h-[42px] px-5" onClick={() => publishCourse(selectedCourse.id)}>
                Publish course
              </PrimaryButton>
            </div>

            {selectedModule ? (
              <div className="grid gap-3 rounded-[20px] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-white/5">
                <p className="text-sm font-semibold text-foreground">Add lesson to {selectedModule.title}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Lesson title" />
                  <SelectInput value={lessonType} onChange={(event) => setLessonType(event.target.value as typeof lessonType)}>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="live">Live</option>
                  </SelectInput>
                  <TextInput type="number" value={lessonDuration} onChange={(event) => setLessonDuration(Number(event.target.value))} />
                </div>
                <SecondaryButton
                  className="min-h-[42px]"
                  onClick={() => {
                    if (!lessonTitle.trim()) return;
                    addLesson(selectedCourse.id, selectedModule.id, {
                      title: lessonTitle,
                      type: lessonType,
                      durationMinutes: lessonDuration
                    });
                    setLessonTitle("");
                    setLessonDuration(15);
                  }}
                >
                  Add lesson
                </SecondaryButton>
                {selectedModule.lessons.length ? (
                  <div className="grid gap-3 rounded-[16px] border border-foreground/10 bg-background/70 p-4 dark:border-white/8 dark:bg-white/5">
                    <p className="text-sm font-semibold text-foreground">Lesson content uploads</p>
                    <div className="grid gap-3">
                      {visibleLessonUploads.map((lesson) => (
                        <label key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-foreground/10 bg-white px-4 py-3 text-sm dark:border-white/8 dark:bg-[#13212a]">
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.contentOriginalName ? `Attached: ${lesson.contentOriginalName}` : "No lesson file uploaded yet"}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="max-w-[15rem] text-xs"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }

                              try {
                                await uploadLessonContent(selectedCourse.id, selectedModule.id, lesson.id, file);
                                setUploadStatus(`${file.name} uploaded to ${lesson.title}.`);
                              } finally {
                                event.target.value = "";
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    {selectedModule.lessons.length > 5 ? (
                      <SeeMoreButton expanded={showAllLessonUploads} remaining={selectedModule.lessons.length - 5} onClick={() => setShowAllLessonUploads((current) => !current)} />
                    ) : null}
                    {uploadStatus ? <p className="text-sm text-muted-foreground">{uploadStatus}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section title="Published portfolio" subtitle="Course status, content depth, pricing, and enrollment are all visible in one operational view.">
        <div className="grid gap-[14px]">
          {visiblePortfolioCourses.map((course) => (
            <div key={course.id} className="rounded-[24px] border border-foreground/10 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-[2px] hover:shadow-glow dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">{course.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{course.category}</Badge>
                  <Badge>{course.status}</Badge>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatCard label="Modules" value={String(course.modules.length)} icon={<Layers3 className="h-5 w-5" />} className="min-h-[7.2rem] p-4" />
                <StatCard label="Lessons" value={String(courseLessonCount(course))} icon={<BookOpen className="h-5 w-5" />} className="min-h-[7.2rem] p-4" />
                <StatCard label="Enrollments" value={String(course.enrollmentCount)} icon={<Users className="h-5 w-5" />} className="min-h-[7.2rem] p-4" />
              </div>
            </div>
          ))}
        </div>
        {state.courses.length > 3 ? (
          <SeeMoreButton expanded={showAllPortfolioCourses} remaining={state.courses.length - 3} onClick={() => setShowAllPortfolioCourses((current) => !current)} />
        ) : null}
      </Section>
    </div>
  );
}

export function ContentUploadsPanel() {
  const { state } = useMockLms();
  const [showAllLessons, setShowAllLessons] = useState(false);
  const lessons = state.courses.flatMap((course) =>
    course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        courseTitle: course.title,
        moduleTitle: module.title,
        lesson
      }))
    )
  );
  const visibleLessons = showAllLessons ? lessons : lessons.slice(0, 5);

  return (
    <Section title="Content uploads" subtitle="Teacher lesson materials, media files, and assignment assets stay organized at the lesson level.">
      <div className="grid gap-4">
        {visibleLessons.map(({ courseTitle, moduleTitle, lesson }) => (
          <div key={lesson.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{lesson.title}</p>
                <p className="text-sm text-muted-foreground">{courseTitle} · {moduleTitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{lesson.type}</Badge>
                <Badge>{lesson.contentOriginalName ? "uploaded" : "pending upload"}</Badge>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {lesson.contentOriginalName
                ? `Stored file: ${lesson.contentOriginalName}`
                : "Use the Modules & Lessons workspace to attach PDF, DOCX, image, or media content to this lesson."}
            </p>
          </div>
        ))}
      </div>
      {lessons.length > 5 ? <SeeMoreButton expanded={showAllLessons} remaining={lessons.length - 5} onClick={() => setShowAllLessons((current) => !current)} /> : null}
    </Section>
  );
}

export function AssessmentLab({ reviewMode = false }: { reviewMode?: boolean }) {
  const { state, createAssessmentDraft, publishAssessment } = useMockLms();
  const [activeTab, setActiveTab] = useState<"generate" | "review">(reviewMode ? "review" : "generate");
  const [backendCourses, setBackendCourses] = useState<Course[]>([]);
  const [backendAssessments, setBackendAssessments] = useState(state.assessments);
  const [backendFallbackBanks, setBackendFallbackBanks] = useState<FallbackQuestionBankItem[]>(fallbackQuestionBank);
  const [backendStatus, setBackendStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [backendMessage, setBackendMessage] = useState("");
  const [busyAction, setBusyAction] = useState<"" | "generate" | `publish-${string}`>(""); 
  const [form, setForm] = useState({
    courseId: state.courses[0]?.id ?? "",
    title: "Generated Assessment",
    type: "MCQ" as AssessmentType,
    count: 8,
    sourceText: ""
  });
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadMethod, setUploadMethod] = useState("");
  const [uploadStatus, setUploadStatus] = useState("No note uploaded yet. You can paste content or upload a file.");
  const [selectedFallbackId, setSelectedFallbackId] = useState(fallbackQuestionBank[0]?.id ?? "");
  const [generationStatus, setGenerationStatus] = useState("");

  const availableCourses = backendCourses.length ? backendCourses : state.courses;
  const availableAssessments =
    backendStatus === "ready"
      ? [...backendAssessments, ...state.assessments.filter((assessment) => !backendAssessments.some((item) => item.id === assessment.id))]
      : state.assessments;
  const availableFallbackBanks = backendFallbackBanks.length ? backendFallbackBanks : fallbackQuestionBank;
  const drafts = availableAssessments.filter((assessment) => assessment.status === "draft");
  const published = availableAssessments.filter((assessment) => assessment.status === "published");
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [showAllPublished, setShowAllPublished] = useState(false);
  const selectedFallback = availableFallbackBanks.find((item) => item.id === selectedFallbackId) ?? availableFallbackBanks[0];
  const latestDraft = drafts[0];
  const previousDraftCount = useRef(drafts.length);
  const visibleDrafts = showAllDrafts ? drafts : drafts.slice(0, 5);
  const visiblePublished = showAllPublished ? published : published.slice(0, 5);

  useEffect(() => {
    setActiveTab(reviewMode ? "review" : "generate");
  }, [reviewMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssessmentWorkspace() {
      setBackendStatus("loading");

      try {
        const bootstrap = await fetchTeacherAssessmentBootstrap();

        if (cancelled) {
          return;
        }

        setBackendCourses(bootstrap.courses);
        setBackendAssessments(bootstrap.assessments);
        setBackendFallbackBanks(bootstrap.fallbackQuestionBank.length ? bootstrap.fallbackQuestionBank : fallbackQuestionBank);
        setBackendStatus("ready");
        setBackendMessage("Connected to Laravel assessment data.");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBackendStatus("error");
        setBackendMessage(error instanceof Error ? error.message : "Backend assessment sync failed.");
      }
    }

    void loadAssessmentWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!availableCourses.length) {
      return;
    }

    if (!availableCourses.some((course) => course.id === form.courseId)) {
      setForm((current) => ({
        ...current,
        courseId: availableCourses[0]?.id ?? current.courseId
      }));
    }
  }, [availableCourses, form.courseId]);

  useEffect(() => {
    if (!availableFallbackBanks.length) {
      return;
    }

    if (!availableFallbackBanks.some((bank) => bank.id === selectedFallbackId)) {
      setSelectedFallbackId(availableFallbackBanks[0]?.id ?? "");
    }
  }, [availableFallbackBanks, selectedFallbackId]);

  useEffect(() => {
    if (drafts.length > previousDraftCount.current) {
      setActiveTab("review");
      setGenerationStatus((current) => current || "A new draft was generated and moved to the review queue.");
    }

    previousDraftCount.current = drafts.length;
  }, [drafts.length]);

  async function handleNoteUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setBusyAction("generate");
      const uploadedNote = await uploadTeacherNote(file);
      const extractedText = uploadedNote.extractedText?.trim()
        ? uploadedNote.extractedText
        : await readNoteFile(file);

      setUploadedFileName(uploadedNote.fileName || file.name);
      setUploadMethod(uploadedNote.extractionMethod || "");
      setUploadStatus(
        `Uploaded ${uploadedNote.fileName || file.name} (${Math.max(1, Math.round((uploadedNote.size || file.size) / 1024))} KB). ${uploadedNote.status}`
      );
      setForm((current) => ({
        ...current,
        title:
          current.title === "Generated Assessment" || current.title.trim() === ""
            ? `${file.name.replace(/\.[^.]+$/, "")} Assessment`
            : current.title,
        sourceText: extractedText
      }));
      setGenerationStatus(`Note linked successfully. Parsed document text is now ready for question generation from ${file.name}.`);
      setBackendMessage(
        uploadedNote.extractionMethod
          ? `Teacher note uploaded and parsed with ${uploadedNote.extractionMethod}.`
          : "Teacher note uploaded to Laravel successfully."
      );
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Note upload failed.");
      setBackendMessage(error instanceof Error ? error.message : "Backend note upload failed.");
    } finally {
      setBusyAction("");
      event.target.value = "";
    }
  }

  async function handleDraftGeneration(forceFallback = false, overrides?: Partial<typeof form>) {
    const effectiveForm = { ...form, ...overrides };
    const normalizedSource = effectiveForm.sourceText.trim();
    const hasManualOrUploadedNotes = !forceFallback && normalizedSource.length > 0;
    const fallbackSource = selectedFallback?.sourceText ?? "";
    const sourceText = hasManualOrUploadedNotes ? normalizedSource : fallbackSource;
    const generatedFromLabel = hasManualOrUploadedNotes
      ? uploadedFileName
        ? `Uploaded note - ${uploadedFileName}`
        : "Manual note input"
      : `Fallback question bank - ${selectedFallback?.title ?? "Default bank"}`;
    try {
      setBusyAction("generate");
      const createdDraft = await generateTeacherAssessmentDraft({
        courseId: effectiveForm.courseId,
        title: effectiveForm.title,
        type: effectiveForm.type,
        count: effectiveForm.count,
        sourceText: hasManualOrUploadedNotes ? sourceText : "",
        fallbackBankId: hasManualOrUploadedNotes ? undefined : selectedFallback?.id
      });
      setBackendAssessments((current) => [createdDraft, ...current.filter((assessment) => assessment.id !== createdDraft.id)]);
      setBackendStatus("ready");
      setBackendMessage("Assessment data synced with Laravel.");
    } catch (error) {
      createAssessmentDraft({
        ...effectiveForm,
        sourceText,
        fallbackBankId: !hasManualOrUploadedNotes ? selectedFallback?.id : undefined,
        generatedFromLabel,
        usedFallbackBank: !hasManualOrUploadedNotes
      });
      setBackendStatus("error");
      setBackendMessage(error instanceof Error ? `${error.message} Draft was kept locally as a fallback.` : "Backend assessment generation failed. Draft was kept locally as a fallback.");
    } finally {
      setBusyAction("");
    }
    setGenerationStatus(
      hasManualOrUploadedNotes
        ? `${effectiveForm.count} ${effectiveForm.type} questions were drafted from ${uploadedFileName || "your note input"} and moved to the review queue.`
        : `${effectiveForm.count} ${effectiveForm.type} questions were drafted from ${selectedFallback?.title ?? "the fallback bank"} and moved to the review queue.`
    );
    setActiveTab("review");
  }

  async function handlePublishAssessment(assessmentId: string) {
    try {
      setBusyAction(`publish-${assessmentId}`);
      const publishedAssessment = await publishTeacherAssessment(assessmentId);
      setBackendAssessments((current) =>
        current.map((assessment) => (assessment.id === assessmentId ? publishedAssessment : assessment))
      );
      setBackendStatus("ready");
      setBackendMessage("Assessment published to Laravel successfully.");
    } catch (error) {
      publishAssessment(assessmentId);
      setBackendStatus("error");
      setBackendMessage(error instanceof Error ? error.message : "Backend publish failed. Frontend state was updated.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as "generate" | "review")} className="grid gap-6">
      <Tabs.List className="flex flex-wrap gap-2 rounded-full border border-foreground/10 bg-white/70 p-2 shadow-soft dark:border-white/10 dark:bg-white/8">
        <Tabs.Trigger value="generate" className="min-w-[7.25rem] rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white dark:text-white/80">
          AI Generation
        </Tabs.Trigger>
        <Tabs.Trigger value="review" className="min-w-[7.25rem] rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white dark:text-white/80">
          Review Queue
        </Tabs.Trigger>
      </Tabs.List>

      {backendMessage ? (
        <div className={`rounded-[18px] border px-4 py-3 text-sm shadow-soft ${backendStatus === "error" ? "border-orange-300/50 bg-orange-50 text-orange-900 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-100" : "border-[#E8A020]/20 bg-[#E8A020]/10 text-[#1A1A2E] dark:border-[#E8A020]/25 dark:bg-[#E8A020]/10 dark:text-[#F5C766]"}`}>
          {backendMessage}
        </div>
      ) : null}

      <Tabs.Content value="generate">
        <Section title="AI assessment engine" subtitle="Simulate the SRS flow: upload text, choose question type, generate up to 50 questions, then review before publishing.">
          <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
            <SelectInput value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </SelectInput>
            <TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Assessment title" />
            <SelectInput value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AssessmentType })}>
              <option value="MCQ">MCQ</option>
              <option value="True/False">True / False</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Essay">Essay</option>
            </SelectInput>
            <TextInput type="number" min={1} max={50} value={form.count} onChange={(event) => setForm({ ...form, count: Number(event.target.value) })} />
          </div>
          <div className="mt-6 grid items-stretch gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="flex h-full flex-col rounded-[1.6rem] border border-foreground/10 bg-white p-6 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">Upload note section</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload PDF, DOCX, or text notes and let the backend extract readable content before question generation.
                  </p>
                </div>
                <label htmlFor="note-upload-input" className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1A1A2E] px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#E8A020]">
                  <HardDriveUpload className="h-5 w-5" />
                  Upload notes
                </label>
              </div>

              <input id="note-upload-input" type="file" accept=".txt,.md,.json,.csv,.pdf,.doc,.docx" className="hidden" onChange={handleNoteUpload} />

              <div className="mt-5 rounded-[1.4rem] border border-dashed border-[#E8A020]/25 bg-background/80 p-4 dark:border-[#E8A020]/25 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Backend upload endpoint</Badge>
                  <code className="text-sm text-[#1A1A2E] dark:text-[#F5C766]">{backendReadyEndpoints.noteUpload}</code>
                  {uploadMethod ? <Badge>{uploadMethod}</Badge> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{uploadStatus}</p>
                {uploadedFileName ? <p className="mt-3 text-sm font-semibold text-foreground">Current note: {uploadedFileName}</p> : null}
              </div>

              <div className="mt-5 flex-1">
                <TextArea
                  value={form.sourceText}
                  onChange={(event) => setForm({ ...form, sourceText: event.target.value })}
                  placeholder="Paste PDF text or lecture notes, or upload a note file above."
                  className="min-h-[180px]"
                />
              </div>
              {form.sourceText.trim() ? (
                <div className="mt-4 rounded-[1.2rem] border border-foreground/10 bg-white/80 p-4 dark:border-white/8 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Parsed note preview</p>
                  <p className="mt-2 line-clamp-5 text-sm leading-6 text-muted-foreground">{form.sourceText.trim()}</p>
                </div>
              ) : null}
            </div>

            <div className="flex h-full flex-col rounded-[1.6rem] border border-foreground/10 bg-white p-6 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">Fallback question bank</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    If uploaded notes are missing or AI is unavailable, generate from a local fallback bank right away.
                  </p>
                </div>
                <Badge>Works offline in frontend demo</Badge>
              </div>

              <div className="mt-4 grid gap-3">
                <SelectInput value={selectedFallbackId} onChange={(event) => setSelectedFallbackId(event.target.value)}>
                  {availableFallbackBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.title}
                    </option>
                  ))}
                </SelectInput>
                {selectedFallback ? (
                  <div className="flex flex-1 flex-col rounded-[1.3rem] border border-foreground/10 bg-background/80 p-4 dark:border-white/8 dark:bg-white/5">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{selectedFallback.category}</Badge>
                      {selectedFallback.recommendedTypes.map((type) => (
                        <Badge key={type} className="px-2.5 py-0.5 text-[10px]">{type}</Badge>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedFallback.sourceText}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <SecondaryButton
                        className="w-full"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            type: selectedFallback.recommendedTypes[0] ?? current.type,
                            title: `${selectedFallback.title} Draft`,
                            sourceText: selectedFallback.sourceText
                          }))
                        }
                      >
                        Use bank content
                      </SecondaryButton>
                      <SecondaryButton
                        className="w-full"
                        disabled={busyAction === "generate"}
                        onClick={async () => {
                          const nextType = selectedFallback.recommendedTypes[0] ?? form.type;
                          const nextTitle = `${selectedFallback.title} Draft`;

                          setForm((current) => ({
                            ...current,
                            type: nextType,
                            title: nextTitle,
                            sourceText: ""
                          }));

                          await handleDraftGeneration(true, {
                            type: nextType,
                            title: nextTitle,
                            sourceText: ""
                          });
                        }}
                      >
                        {busyAction === "generate" ? "Generating..." : "Generate from fallback bank"}
                      </SecondaryButton>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton disabled={busyAction === "generate"} onClick={() => void handleDraftGeneration()}>
              {busyAction === "generate" ? "Generating..." : "Generate draft questions"}
            </PrimaryButton>
            <Badge>{uploadedFileName ? `Uploaded note linked - ${uploadedFileName}` : "Fallback bank available"}</Badge>
            <Badge>{backendReadyEndpoints.aiAssessmentGenerate}</Badge>
          </div>
          {generationStatus ? (
            <div className="mt-5 rounded-[20px] border border-[#E8A020]/20 bg-[#1A1A2E] px-5 py-4 text-white shadow-soft dark:border-[#E8A020]/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C766]">Draft status</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">{generationStatus}</p>
                </div>
                <PrimaryButton className="min-h-[42px]" onClick={() => setActiveTab("review")}>
                  Open review queue
                </PrimaryButton>
              </div>
            </div>
          ) : null}
          {latestDraft ? (
            <div className="mt-5 rounded-[20px] border border-foreground/10 bg-background/80 p-5 shadow-soft dark:border-white/8 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">Latest generated draft</p>
                  <p className="mt-2 text-sm text-muted-foreground">{latestDraft.title}</p>
                </div>
                <Badge>{latestDraft.type}</Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <StatCard label="Questions" value={String(latestDraft.questionCount)} icon={<Bot className="h-5 w-5" />} className="min-h-[7rem] p-4" />
                <StatCard label="Status" value={latestDraft.status} className="min-h-[7rem] p-4" />
                <StatCard label="Source" value={latestDraft.generatedFrom.includes("Fallback") ? "Fallback" : "Notes"} className="min-h-[7rem] p-4" />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <SecondaryButton className="min-h-[42px]" onClick={() => setActiveTab("review")}>
                  Review this draft
                </SecondaryButton>
              </div>
            </div>
          ) : null}
        </Section>
      </Tabs.Content>

      <Tabs.Content value="review">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Section title="Draft review queue" subtitle="Teachers can review, edit, or reject AI-generated assessments before publishing.">
            <div className="grid gap-4">
              {drafts.length ? (
                visibleDrafts.map((assessment) => (
                  <div key={assessment.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-serif text-2xl">{assessment.title}</p>
                        <p className="text-sm text-muted-foreground">{assessment.type} - {assessment.questionCount} questions</p>
                      </div>
                      <SecondaryButton disabled={busyAction === `publish-${assessment.id}`} onClick={() => void handlePublishAssessment(assessment.id)}>
                        {busyAction === `publish-${assessment.id}` ? "Publishing..." : "Publish"}
                      </SecondaryButton>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {assessment.questions.slice(0, 3).map((question, index) => (
                        <div key={question.id} className="rounded-[1.2rem] border border-foreground/10 bg-background/70 p-4 dark:border-white/8 dark:bg-white/5">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Question {index + 1}</p>
                          <p className="mt-2 text-sm leading-6">{question.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No drafts yet. Generate one from the AI tab.</p>
              )}
            </div>
            {drafts.length > 5 ? <SeeMoreButton expanded={showAllDrafts} remaining={drafts.length - 5} onClick={() => setShowAllDrafts((current) => !current)} /> : null}
          </Section>

          <Section title="Published assessments" subtitle="Published items are ready for students and feed directly into grading, compliance, and certification flows.">
            <div className="grid gap-4">
              {visiblePublished.map((assessment) => (
                <div key={assessment.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-serif text-2xl">{assessment.title}</p>
                      <p className="text-sm text-muted-foreground">{assessment.generatedFrom}</p>
                    </div>
                    <Badge>{assessment.type}</Badge>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Rubric keywords: {assessment.rubricKeywords.join(", ")}</p>
                </div>
              ))}
            </div>
            {published.length > 5 ? <SeeMoreButton expanded={showAllPublished} remaining={published.length - 5} onClick={() => setShowAllPublished((current) => !current)} /> : null}
          </Section>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  );
}

export function LiveClassesPanel() {
  const { state, scheduleLiveClass, setLiveClassStatus } = useMockLms();
  const [showAllLiveClasses, setShowAllLiveClasses] = useState(false);
  const [form, setForm] = useState({
    title: "New live session",
    courseId: state.courses[0]?.id ?? "",
    startTime: new Date().toISOString().slice(0, 16),
    durationMinutes: 60
  });
  const visibleLiveClasses = showAllLiveClasses ? state.liveClasses : state.liveClasses.slice(0, 5);

  async function handleGoLive(classId: string, meetingUrl?: string | null) {
    await setLiveClassStatus(classId, "live");

    if (meetingUrl) {
      window.open(meetingUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Section title="Schedule live classroom" subtitle="Jitsi-backed sessions with 24-hour and 1-hour reminders are ready to be created in the frontend workflow.">
        <div className="grid gap-3">
          <TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <SelectInput value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
            {state.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </SelectInput>
          <TextInput type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
          <TextInput type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} />
          <PrimaryButton onClick={() => scheduleLiveClass({ ...form, startTime: new Date(form.startTime).toISOString() })}>
            Schedule live class
          </PrimaryButton>
        </div>
      </Section>

      <Section title="Session timeline" subtitle="Host, go live, and mark recordings as available from a single operational timeline.">
        <div className="grid gap-4">
          {visibleLiveClasses.map((liveClass) => (
            <div key={liveClass.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">{liveClass.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(liveClass.startAt).toLocaleString()} · {liveClass.durationMinutes} min · {liveClass.provider}
                  </p>
                </div>
                <Badge>{liveClass.status}</Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <StatCard label="Participants" value={String(liveClass.participantLimit)} icon={<Users className="h-5 w-5" />} className="min-h-[6.6rem] p-4" />
                <StatCard label="24h reminder" value={liveClass.reminder24h ? "On" : "Off"} className="min-h-[6.6rem] p-4" />
                <StatCard label="1h reminder" value={liveClass.reminder1h ? "On" : "Off"} className="min-h-[6.6rem] p-4" />
              </div>
              {liveClass.meetingUrl ? (
                <div className="mt-4 rounded-[1.2rem] border border-foreground/10 bg-background/70 p-4 text-sm text-muted-foreground dark:border-white/8 dark:bg-white/5">
                  Meeting room: <span className="font-semibold text-foreground">{liveClass.meetingUrl}</span>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton onClick={() => handleGoLive(liveClass.id, liveClass.meetingUrl)}>
                  Go live
                </PrimaryButton>
                {liveClass.meetingUrl ? (
                  <SecondaryButton onClick={() => window.open(liveClass.meetingUrl, "_blank", "noopener,noreferrer")}>
                    Open room
                  </SecondaryButton>
                ) : null}
                <SecondaryButton onClick={() => setLiveClassStatus(liveClass.id, "recorded")}>Mark recorded</SecondaryButton>
                {liveClass.recordingUrl ? (
                  <SecondaryButton onClick={() => window.open(liveClass.recordingUrl ?? undefined, "_blank", "noopener,noreferrer")}>
                    Open recording
                  </SecondaryButton>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {state.liveClasses.length > 5 ? <SeeMoreButton expanded={showAllLiveClasses} remaining={state.liveClasses.length - 5} onClick={() => setShowAllLiveClasses((current) => !current)} /> : null}
      </Section>
    </div>
  );
}

export function TeacherSubmissionsPanel() {
  const { state } = useMockLms();
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const visibleSubmissions = showAllSubmissions ? state.submissions : state.submissions.slice(0, 5);

  return (
    <Section title="Submission queue" subtitle="Essay scoring, review feedback, and pass/fail outcomes are visible to the teacher.">
      <div className="grid gap-4">
        {visibleSubmissions.map((submission) => {
          const assessment = state.assessments.find((item) => item.id === submission.assessmentId);
          return (
            <div key={submission.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{submission.studentName}</p>
                  <p className="text-sm text-muted-foreground">{assessment?.title}</p>
                </div>
                <Badge>{submission.score}%</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{submission.feedback}</p>
            </div>
          );
        })}
      </div>
      {state.submissions.length > 5 ? <SeeMoreButton expanded={showAllSubmissions} remaining={state.submissions.length - 5} onClick={() => setShowAllSubmissions((current) => !current)} /> : null}
    </Section>
  );
}

export function TeacherAssessmentsPanel() {
  const { state } = useMockLms();
  const [showAllAssessments, setShowAllAssessments] = useState(false);
  const visibleAssessments = showAllAssessments ? state.assessments : state.assessments.slice(0, 5);

  return (
    <Section title="Assessments and assignments" subtitle="Teacher can manage quiz and assignment inventory, scoring criteria, and publication readiness.">
      <div className="grid gap-4">
        {visibleAssessments.map((assessment) => (
          <div key={assessment.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{assessment.title}</p>
                <p className="text-sm text-muted-foreground">{assessment.generatedFrom}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{assessment.type}</Badge>
                <Badge>{assessment.status}</Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <StatCard label="Questions" value={String(assessment.questionCount)} className="min-h-[6.4rem] p-4" />
              <StatCard label="Passing mark" value={assessment.type === "Essay" ? "60%" : "50%"} className="min-h-[6.4rem] p-4" />
              <StatCard label="Retake" value="Controlled" className="min-h-[6.4rem] p-4" />
              <StatCard label="Rubric" value={assessment.rubricKeywords.length ? "Defined" : "Basic"} className="min-h-[6.4rem] p-4" />
            </div>
          </div>
        ))}
      </div>
      {state.assessments.length > 5 ? <SeeMoreButton expanded={showAllAssessments} remaining={state.assessments.length - 5} onClick={() => setShowAllAssessments((current) => !current)} /> : null}
    </Section>
  );
}

export function EssayEvaluationPanel() {
  const { state } = useMockLms();
  const essaySubmissions = state.submissions.filter((submission) => {
    const assessment = state.assessments.find((item) => item.id === submission.assessmentId);
    return assessment?.type === "Essay" || assessment?.type === "Short Answer";
  });
  const [showAllEssaySubmissions, setShowAllEssaySubmissions] = useState(false);
  const visibleEssaySubmissions = showAllEssaySubmissions ? essaySubmissions : essaySubmissions.slice(0, 5);

  return (
    <Section title="Essay evaluation monitor" subtitle="Teacher can review AI feedback, compare rubric alignment, and decide final grade publication.">
      <div className="grid gap-4">
        {visibleEssaySubmissions.map((submission) => {
          const assessment = state.assessments.find((item) => item.id === submission.assessmentId);
          return (
            <div key={submission.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{submission.studentName}</p>
                  <p className="text-sm text-muted-foreground">{assessment?.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{submission.score}%</Badge>
                  <Badge>{submission.passed ? "pass" : "review"}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{submission.feedback}</p>
              <div className="mt-3 rounded-[12px] border border-foreground/10 bg-background/70 p-3 text-sm text-muted-foreground dark:border-white/8 dark:bg-white/5">
                Manual override, final grade publish, and rubric moderation can be tracked from this queue.
              </div>
            </div>
          );
        })}
        {!essaySubmissions.length ? <p className="text-sm text-muted-foreground">No essay submissions are waiting right now.</p> : null}
      </div>
      {essaySubmissions.length > 5 ? <SeeMoreButton expanded={showAllEssaySubmissions} remaining={essaySubmissions.length - 5} onClick={() => setShowAllEssaySubmissions((current) => !current)} /> : null}
    </Section>
  );
}

export function TeacherStudentPerformancePanel() {
  const { state } = useMockLms();
  const primaryCourse = state.courses[0];
  const students = state.users.filter((user) => user.role === "student");
  const [showAllStudents, setShowAllStudents] = useState(false);
  const visibleStudents = showAllStudents ? students : students.slice(0, 5);

  return (
    <Section title="Student performance view" subtitle="See learner progress and support signals across courses.">
      <div className="grid gap-4">
        {visibleStudents.map((student) => (
            <div key={student.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.department}</p>
                </div>
                <Badge>
                  {percentageForStudent(primaryCourse, student.name)}% in {primaryCourse.title}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <StatCard
                  label="Course progress"
                  value={`${percentageForStudent(primaryCourse, student.name)}%`}
                  icon={<BookOpen className="h-5 w-5" />}
                  className="min-h-[6.6rem] p-4"
                />
                <StatCard
                  label="Submissions"
                  value={String(state.submissions.filter((submission) => submission.studentName === student.name).length)}
                  icon={<Upload className="h-5 w-5" />}
                  className="min-h-[6.6rem] p-4"
                />
                <StatCard
                  label="Certificates"
                  value={String(state.certificates.filter((certificate) => certificate.studentName === student.name && !certificate.revoked).length)}
                  icon={<Users className="h-5 w-5" />}
                  className="min-h-[6.6rem] p-4"
                />
              </div>
              <div className="mt-4 rounded-[1.25rem] border border-foreground/10 bg-background/75 px-4 py-3 dark:border-white/8 dark:bg-white/5">
                <p className="text-sm text-muted-foreground">
                  Latest support signal:{" "}
                  <span className="font-semibold text-foreground">
                    {state.submissions.find((submission) => submission.studentName === student.name)?.feedback ?? "No submission feedback yet."}
                  </span>
                </p>
              </div>
            </div>
          ))}
        {students.length > 5 ? <SeeMoreButton expanded={showAllStudents} remaining={students.length - 5} onClick={() => setShowAllStudents((current) => !current)} /> : null}
      </div>
    </Section>
  );
}

export function TeacherSettingsPanel() {
  return (
    <Section title="Teacher settings" subtitle="Working preference controls for notifications, templates, and review cadence.">
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput defaultValue="Nafis Hasan" />
        <TextInput defaultValue="nafis@betopiaacademy.com" />
        <SelectInput defaultValue="Immediate">
          <option>Immediate</option>
          <option>Daily digest</option>
          <option>Weekly digest</option>
        </SelectInput>
        <SelectInput defaultValue="Strict">
          <option>Strict rubric</option>
          <option>Balanced rubric</option>
          <option>Loose rubric</option>
        </SelectInput>
      </div>
    </Section>
  );
}

export function TeacherAnnouncementsPanel() {
  const { state } = useMockLms();
  const teacherNotices = state.notifications.filter((notification) => notification.audience === "Teacher" || notification.audience === "All");
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const visibleTeacherNotices = showAllAnnouncements ? teacherNotices : teacherNotices.slice(0, 5);

  return (
    <Section title="Announcements" subtitle="Course announcements, assignment reminders, and session notices can be coordinated from one teacher-facing stream.">
      <div className="grid gap-4">
        {visibleTeacherNotices.map((notice) => (
          <div key={notice.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Badge>{notice.type}</Badge>
                <Badge>{notice.audience}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(notice.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{notice.message}</p>
          </div>
        ))}
      </div>
      {teacherNotices.length > 5 ? <SeeMoreButton expanded={showAllAnnouncements} remaining={teacherNotices.length - 5} onClick={() => setShowAllAnnouncements((current) => !current)} /> : null}
    </Section>
  );
}

export function TeacherMessagesPanel() {
  const { state } = useMockLms();
  const studentSignals = state.submissions;
  const [showAllMessages, setShowAllMessages] = useState(false);
  const visibleStudentSignals = showAllMessages ? studentSignals : studentSignals.slice(0, 5);

  return (
    <Section title="Messages and feedback" subtitle="Teacher can keep student communication, support signals, and feedback delivery visible from one communication lane.">
      <div className="grid gap-4">
        {visibleStudentSignals.map((submission) => (
          <div key={submission.id} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 dark:border-white/8 dark:bg-[#13212a]">
            <p className="font-semibold">{submission.studentName}</p>
            <p className="mt-2 text-sm text-muted-foreground">{submission.feedback}</p>
          </div>
        ))}
      </div>
      {studentSignals.length > 5 ? <SeeMoreButton expanded={showAllMessages} remaining={studentSignals.length - 5} onClick={() => setShowAllMessages((current) => !current)} /> : null}
    </Section>
  );
}

export function TeacherDashboardPanel() {
  const { state } = useMockLms();

  return (
    <div className="grid gap-6">
      <MetricGrid
        items={[
          { label: "Courses active", value: String(state.courses.length), icon: <BookOpen className="h-5 w-5" /> },
          { label: "Assessments", value: String(state.assessments.length), icon: <Bot className="h-5 w-5" /> },
          { label: "Submissions", value: String(state.submissions.length), icon: <Upload className="h-5 w-5" /> },
          { label: "Live sessions", value: String(state.liveClasses.length), icon: <CalendarClock className="h-5 w-5" /> }
        ]}
      />
      <AssessmentLab />
    </div>
  );
}
