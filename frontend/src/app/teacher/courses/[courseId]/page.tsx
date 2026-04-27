"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  FileText,
  Layers3,
  LockKeyhole,
  PlayCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  UploadCloud
} from "lucide-react";
import { DashboardLayout, PageHeader, StatusBadge } from "@/components/dashboard/DashboardLayout";
import { Badge, PrimaryButton, SecondaryButton, SelectInput, TextInput } from "@/components/shared/lms-core";
import { useMockLms } from "@/providers/mock-lms-provider";
import { percentageForStudent } from "@/lib/utils/lms-helpers";
import type { Assessment, CourseModule, Lesson } from "@/lib/mock-lms";

export default function TeacherCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const searchParams = useSearchParams();
  const { state, addModule, addLesson, uploadLessonContent, publishCourse, setCourseAssessmentGate } = useMockLms();
  const course = useMemo(() => state.courses.find((item) => item.id === courseId), [state.courses, courseId]);
  const [moduleTitle, setModuleTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video" | "document" | "quiz" | "assignment" | "live">("video");
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonReleaseAt, setLessonReleaseAt] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [bulkUploadingModuleId, setBulkUploadingModuleId] = useState("");

  useEffect(() => {
    if (!course) return;
    const requestedModuleId = searchParams.get("moduleId");
    setSelectedModuleId((current) =>
      course.modules.some((moduleItem) => moduleItem.id === requestedModuleId)
        ? requestedModuleId || ""
        : course.modules.some((moduleItem) => moduleItem.id === current)
          ? current
          : course.modules[0]?.id || ""
    );
  }, [course, searchParams]);

  useEffect(() => {
    if (searchParams.get("fromAssessment") === "1") {
      setUploadStatus("Assessment created and added to this module flow.");
    }
  }, [searchParams]);

  if (!course) {
    return (
      <DashboardLayout role="teacher">
        <PageHeader title="Course not found" subtitle="The requested course could not be found." />
        <div className="card">
          <p className="mb-4 text-sm text-muted-foreground">Return to your course list to manage a valid course.</p>
          <Link href="/teacher/courses" className="btn-secondary">Back to courses</Link>
        </div>
      </DashboardLayout>
    );
  }

  const activeCourse = course;
  const courseAssessments = state.assessments.filter((assessment) => assessment.courseId === activeCourse.id);
  const lessons = activeCourse.modules.flatMap((module) => module.lessons);
  const uploadedLessons = lessons.filter((lesson) => Boolean(lesson.contentUrl || lesson.contentOriginalName));
  const hasUploadedResource = uploadedLessons.length > 0;
  const hasAssessmentConfigured = courseAssessments.length > 0;
  const hasPublishedAssessment = courseAssessments.some((assessment) => assessment.status === "published");
  const assessmentGateEnabled = course.assessmentGateEnabled ?? true;
  const selectedModule = activeCourse.modules.find((module) => module.id === selectedModuleId) ?? activeCourse.modules[0];
  const selectedModuleAssessments = selectedModule
    ? assessmentsForModule(courseAssessments, selectedModule.title)
    : [];
  const courseProgress = percentageForStudent(activeCourse, state.users.find((user) => user.role === "student")?.name ?? "Student");
  const setupScore = [activeCourse.modules.length > 0, hasUploadedResource, courseAssessments.length > 0, activeCourse.status === "published"].filter(Boolean).length;
  const uploadPercent = lessons.length ? Math.round((uploadedLessons.length / lessons.length) * 100) : 0;

  async function handleAddModule() {
    const title = moduleTitle.trim();
    if (!title) return;
    await addModule(activeCourse.id, title);
    setModuleTitle("");
  }

  async function handleAddLesson() {
    const title = lessonTitle.trim();
    if (!title || !selectedModuleId) return;

    await addLesson(activeCourse.id, selectedModuleId, {
      title,
      type: lessonType,
      durationMinutes: lessonDuration,
      releaseAt: lessonReleaseAt || undefined
    });
    setLessonTitle("");
    setLessonDuration(15);
    setLessonReleaseAt("");
  }

  async function handleModuleContentUpload(moduleId: string, files: FileList | null) {
    const fileList = Array.from(files ?? []);
    if (!fileList.length) return;

    setBulkUploadingModuleId(moduleId);
    setUploadStatus(`Uploading ${fileList.length} file${fileList.length === 1 ? "" : "s"} to this module...`);

    try {
      for (const file of fileList) {
        const createdLesson = await addLesson(activeCourse.id, moduleId, {
          title: titleFromFile(file.name),
          type: lessonTypeFromFile(file),
          durationMinutes: durationFromFile(file),
          releaseAt: lessonReleaseAt || undefined
        });

        if (createdLesson) {
          await uploadLessonContent(activeCourse.id, moduleId, createdLesson.id, file);
        }
      }

      setUploadStatus(`Added ${fileList.length} content item${fileList.length === 1 ? "" : "s"} to the module.`);
    } catch {
      setUploadStatus("Module upload failed. Please try again with smaller files or upload one item at a time.");
    } finally {
      setBulkUploadingModuleId("");
    }
  }

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title={course.title}
        subtitle="Build the course experience, attach resources, and control when students can move forward."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/courses" className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              type="button"
              onClick={() => publishCourse(course.id)}
              disabled={assessmentGateEnabled && !hasAssessmentConfigured}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Publish
            </button>
          </div>
        }
      />

      <div className="mb-6 overflow-hidden rounded-[28px] border border-foreground/10 bg-[#111827] text-white shadow-soft">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-7">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/12 text-white">{course.category}</Badge>
                <Badge className="bg-[#ffa10a]/20 text-[#ffd18a]">{course.status}</Badge>
                <Badge className="bg-white/12 text-white">{assessmentGateEnabled ? "Assessment gate on" : "Gate off"}</Badge>
              </div>
              <h2 className="mt-5 max-w-3xl font-serif text-3xl leading-tight md:text-4xl">{course.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{course.description}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <span>Course setup</span>
                <span>{setupScore}/4 ready</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/12">
                <div className="h-full rounded-full bg-[#ffa10a]" style={{ width: `${setupScore * 25}%` }} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ResourceMetric icon={<Layers3 className="h-5 w-5" />} label="Modules" value={String(course.modules.length)} />
            <ResourceMetric icon={<FileText className="h-5 w-5" />} label="Lessons" value={String(lessons.length)} />
            <ResourceMetric icon={<UploadCloud className="h-5 w-5" />} label="Uploaded" value={`${uploadedLessons.length}/${lessons.length}`} />
            <ResourceMetric icon={<ClipboardCheck className="h-5 w-5" />} label="Assessments" value={String(courseAssessments.length)} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <div className="grid gap-3 rounded-[24px] border border-foreground/10 bg-white p-4 shadow-soft dark:border-white/8 dark:bg-[#13212a] lg:grid-cols-[0.95fr_1.55fr]">
            <div className="rounded-[18px] bg-background/80 p-4 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <p className="font-semibold text-foreground">Add module</p>
              </div>
              <div className="mt-4 grid gap-3">
                <TextInput value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="Module title" />
                <SecondaryButton className="min-h-[42px]" onClick={() => void handleAddModule()}>
                  Add module
                </SecondaryButton>
              </div>
            </div>

            <div className="rounded-[18px] bg-background/80 p-4 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">Add lesson resource</p>
                </div>
                {selectedModule ? <Badge>{selectedModule.title}</Badge> : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SelectInput value={selectedModuleId} onChange={(event) => setSelectedModuleId(event.target.value)}>
                  {course.modules.map((module) => (
                    <option key={module.id} value={module.id}>{module.title}</option>
                  ))}
                </SelectInput>
                <TextInput value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Lesson title" />
                <SelectInput value={lessonType} onChange={(event) => setLessonType(event.target.value as typeof lessonType)}>
                  <option value="video">Video</option>
                  <option value="document">PDF / Document</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="live">Live</option>
                </SelectInput>
                <TextInput type="number" value={lessonDuration} onChange={(event) => setLessonDuration(Number(event.target.value))} placeholder="Minutes" />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <TextInput type="datetime-local" value={lessonReleaseAt} onChange={(event) => setLessonReleaseAt(event.target.value)} />
                <PrimaryButton className="min-h-[42px] px-6" disabled={!selectedModuleId} onClick={() => void handleAddLesson()}>
                  Add lesson
                </PrimaryButton>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl text-foreground">Modules and resources</p>
                <p className="mt-1 text-sm text-muted-foreground">Select a module, upload files, and preview attached content.</p>
              </div>
              <Badge>{uploadPercent}% uploaded</Badge>
            </div>

            {course.modules.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-foreground/15 bg-background/70 p-6 text-sm text-muted-foreground">
                Create your first module to unlock lesson and upload controls.
              </div>
            ) : (
              <>
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {course.modules.map((module, index) => (
                    <ModuleTab
                      key={module.id}
                      module={module}
                      index={index}
                      active={module.id === selectedModule?.id}
                      onClick={() => setSelectedModuleId(module.id)}
                    />
                  ))}
                </div>

                <div className="mt-5 grid gap-3">
                  {selectedModule ? (
                    <ModuleBulkUpload
                      courseId={course.id}
                      module={selectedModule}
                      busy={bulkUploadingModuleId === selectedModule.id}
                      onUpload={(files) => void handleModuleContentUpload(selectedModule.id, files)}
                    />
                  ) : null}

                  {selectedModule ? (
                    <div className="rounded-[20px] border border-foreground/10 bg-background/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">Module assessments</p>
                          <p className="mt-1 text-xs text-muted-foreground">Assessments created for this module appear here.</p>
                        </div>
                        <Link
                          href={`/teacher/assessments?courseId=${course.id}&moduleId=${selectedModule.id}&moduleTitle=${encodeURIComponent(selectedModule.title)}`}
                          className="btn-secondary min-h-[38px] px-4 text-xs"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Create module assessment
                        </Link>
                      </div>

                      {selectedModuleAssessments.length ? (
                        <div className="mt-3 grid gap-2">
                          {selectedModuleAssessments.map((assessment) => (
                            <div key={assessment.id} className="rounded-xl border border-foreground/10 bg-white p-3 dark:border-white/8 dark:bg-white/5">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{assessment.title}</p>
                                  <p className="text-xs text-muted-foreground">{assessment.type} · {assessment.questionCount} questions</p>
                                </div>
                                <StatusBadge status={assessment.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">No assessment linked to this module yet.</p>
                      )}
                    </div>
                  ) : null}

                  {selectedModule?.lessons.length ? (
                    selectedModule.lessons.map((lesson, index) => (
                      <LessonResourceCard
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        courseId={course.id}
                        moduleId={selectedModule.id}
                        uploadLessonContent={uploadLessonContent}
                        setUploadStatus={setUploadStatus}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-foreground/15 bg-background/70 p-6 text-sm text-muted-foreground">
                      This module has no lessons yet. Add one above, then attach a PDF, MP4, DOCX, or image.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-5 xl:sticky xl:top-24">
          <div className="rounded-[24px] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-2xl text-foreground">Release control</p>
                <p className="mt-1 text-sm text-muted-foreground">Keep students on track with assessment-gated progression.</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-background/80 p-4 dark:border-white/8 dark:bg-white/5">
              <span>
                <span className="block text-sm font-semibold text-foreground">Gate next step by assessment</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {assessmentGateEnabled ? "Later modules stay locked until an assessment is published." : "Students can move freely through modules."}
                </span>
              </span>
              <input
                type="checkbox"
                checked={assessmentGateEnabled}
                onChange={(event) => void setCourseAssessmentGate(course.id, event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>

            <div className="mt-5 grid gap-3">
              <SetupStep title="Module" done={course.modules.length > 0} detail={`${course.modules.length} ready`} />
              <SetupStep title="Video / PDF" done={hasUploadedResource} disabled={course.modules.length === 0} detail={hasUploadedResource ? `${uploadedLessons.length} uploaded` : "upload needed"} />
              <SetupStep title="Assessment" done={courseAssessments.length > 0} disabled={assessmentGateEnabled && !hasUploadedResource} detail={hasPublishedAssessment ? "published" : courseAssessments.length ? "draft ready" : "not set"} />
              <SetupStep title="Publish" done={course.status === "published"} disabled={assessmentGateEnabled && !hasAssessmentConfigured} detail={course.status} />
            </div>

            {assessmentGateEnabled && !hasAssessmentConfigured ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
                Create at least one assessment before publishing this course, or switch the gate off.
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-serif text-2xl text-foreground">Assessments</p>
              <Badge>{courseAssessments.length}</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {courseAssessments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-foreground/10 bg-background/80 p-4 text-sm text-muted-foreground">
                  No assessment is attached yet.
                </div>
              ) : (
                courseAssessments.map((assessment) => (
                  <div key={assessment.id} className="rounded-2xl border border-foreground/10 bg-background/70 p-4 dark:border-white/8 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{assessment.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{assessment.type} · {assessment.questionCount} questions</p>
                      </div>
                      <StatusBadge status={assessment.status} />
                    </div>
                  </div>
                ))
              )}
              <Link href={`/teacher/assessments?courseId=${course.id}`} className="btn-accent w-full justify-center py-3">
                <Sparkles className="h-4 w-4" /> Set assessment
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <p className="font-serif text-2xl text-foreground">Course health</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ResourceHealth label="Progress" value={`${courseProgress}%`} />
              <ResourceHealth label="Uploads" value={`${uploadPercent}%`} />
            </div>
            {uploadStatus ? (
              <div className="mt-4 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success">
                {uploadStatus}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function ResourceMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
      <div className="flex items-center justify-between gap-3 text-white/60">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
        {icon}
      </div>
      <p className="mt-4 font-serif text-3xl text-white">{value}</p>
    </div>
  );
}

function ResourceHealth({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background/70 p-4 dark:border-white/8 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl text-foreground">{value}</p>
    </div>
  );
}

function ModuleTab({
  module,
  index,
  active,
  onClick
}: {
  module: CourseModule;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const uploaded = module.lessons.filter((lesson) => Boolean(lesson.contentUrl || lesson.contentOriginalName)).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[220px] rounded-2xl border p-4 text-left transition ${active ? "border-primary/40 bg-primary/5 shadow-sm" : "border-foreground/10 bg-background/70 hover:border-primary/30"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Badge>Module {index + 1}</Badge>
        <span className="text-xs text-muted-foreground">{uploaded}/{module.lessons.length} uploaded</span>
      </div>
      <p className="mt-3 font-semibold text-foreground">{module.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">Drip delay: {module.dripDays} day(s)</p>
    </button>
  );
}

function ModuleBulkUpload({
  courseId,
  module,
  busy,
  onUpload
}: {
  courseId: string;
  module: CourseModule;
  busy: boolean;
  onUpload: (files: FileList | null) => void;
}) {
  return (
    <div className="rounded-[20px] border border-primary/15 bg-primary/5 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Upload content to {module.title}</p>
            <Badge>{module.lessons.length} content items</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Select multiple PDFs, videos, documents, or images. Each file becomes its own content item inside this module.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className={`btn-primary min-h-[42px] cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <Upload className="h-4 w-4" />
            {busy ? "Uploading..." : "Upload module content"}
            <input
              type="file"
              multiple
              accept=".pdf,.mp4,.docx,.jpg,.jpeg,.png,.webp,.txt,.md"
              className="hidden"
              onChange={(event) => {
                onUpload(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <Link href={`/teacher/assessments?courseId=${courseId}&moduleId=${module.id}&moduleTitle=${encodeURIComponent(module.title)}`} className="btn-secondary min-h-[42px]">
            <ClipboardCheck className="h-4 w-4" />
            Add module assessment
          </Link>
        </div>
      </div>
    </div>
  );
}

function LessonResourceCard({
  lesson,
  index,
  courseId,
  moduleId,
  uploadLessonContent,
  setUploadStatus
}: {
  lesson: Lesson;
  index: number;
  courseId: string;
  moduleId: string;
  uploadLessonContent: (courseId: string, moduleId: string, lessonId: string, file: File) => Promise<void>;
  setUploadStatus: (status: string) => void;
}) {
  const hasVideo = !!lesson.contentUrl && /youtube\.com|youtu\.be/.test(lesson.contentUrl);
  const hasFile = !!lesson.contentUrl && !hasVideo;
  const isUploaded = Boolean(lesson.contentUrl || lesson.contentOriginalName);

  return (
    <div className="rounded-[20px] border border-foreground/10 bg-background/70 p-4 transition hover:border-primary/30 hover:bg-white dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/10">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`grid h-8 w-8 place-items-center rounded-xl ${isUploaded ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
              {isUploaded ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{index + 1}. {lesson.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lesson.type} · {lesson.durationMinutes} min · {lesson.releaseAt ? new Date(lesson.releaseAt).toLocaleString() : "release immediately"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className={isUploaded ? "bg-success/15 text-success" : "bg-amber-100 text-amber-800"}>
              {lesson.contentOriginalName || (isUploaded ? "Content attached" : "Needs upload")}
            </Badge>
            {hasFile ? (
              <a href={lesson.contentUrl ?? undefined} target="_blank" rel="noreferrer" className="btn-outline px-3 py-1.5 text-xs">
                Open content
              </a>
            ) : null}
            {hasVideo ? (
              <a href={lesson.contentUrl ?? undefined} target="_blank" rel="noreferrer" className="btn-outline px-3 py-1.5 text-xs">
                Watch video
              </a>
            ) : null}
          </div>
        </div>

        <label className="group flex min-h-[64px] cursor-pointer items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 dark:border-white/8 dark:bg-[#13212a] dark:hover:bg-white/10">
          <span>
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Choose file
            </span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">PDF, DOCX, MP4, image</span>
          </span>
          <input
            type="file"
            accept=".pdf,.mp4,.docx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              try {
                await uploadLessonContent(courseId, moduleId, lesson.id, file);
                setUploadStatus(`Uploaded ${file.name} for ${lesson.title}.`);
              } catch {
                setUploadStatus(`Failed to upload ${file.name}.`);
              } finally {
                event.target.value = "";
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

function titleFromFile(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Module content";
}

function lessonTypeFromFile(file: File): Lesson["type"] {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/.test(name)) {
    return "video";
  }

  if (/\.(pdf|doc|docx|txt|md|jpg|jpeg|png|webp)$/.test(name)) {
    return "document";
  }

  return "document";
}

function durationFromFile(file: File) {
  return file.type.startsWith("video/") ? 20 : 10;
}

function assessmentsForModule(
  courseAssessments: Assessment[],
  moduleTitle: string
) {
  const key = moduleTitle.toLowerCase().trim();
  if (!key) {
    return [];
  }

  return courseAssessments.filter((assessment) => {
    const corpus = `${assessment.title} ${assessment.generatedFrom}`.toLowerCase();
    return corpus.includes(key);
  });
}

function SetupStep({
  title,
  detail,
  done,
  disabled = false
}: {
  title: string;
  detail: string;
  done: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${disabled ? "border-foreground/10 bg-background/60 opacity-70" : done ? "border-success/30 bg-success/5" : "border-foreground/10 bg-background/80"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        {disabled ? <LockKeyhole className="h-4 w-4 text-muted-foreground" /> : done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock3 className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{detail}</p>
    </div>
  );
}
