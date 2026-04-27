"use client";

import Link from "next/link";
import { ArrowRight, UploadCloud } from "lucide-react";
import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { CourseWorkbench } from "@/components/teacher/teacher-panels";
import { Badge, Section } from "@/components/shared/lms-core";
import { useMockLms } from "@/providers/mock-lms-provider";

export default function TeacherCoursesPage() {
  const { state } = useMockLms();

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="My Courses"
        subtitle="Build modules, add lessons, upload content, and publish courses."
      />
      <CourseWorkbench />
      <Section
        title="Manage course content"
        subtitle="Open a course to upload lessons, support PDF/MP4 files, and connect assessments for students."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {state.courses.map((course) => (
            <div
              key={course.id}
              className="rounded-[24px] border border-foreground/10 bg-white p-5 shadow-soft transition hover:border-primary/40 dark:border-white/8 dark:bg-[#13212a]"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-lg text-foreground">{course.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                </div>
                <Badge>{course.status}</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p>{course.modules.length} modules</p>
                <p>{course.modules.flatMap((module) => module.lessons).length} lessons</p>
                <p>{course.assessmentCount ?? state.assessments.filter((item) => item.courseId === course.id).length} assessments</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/teacher/courses/${course.id}`} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
                  <UploadCloud className="h-4 w-4" />
                  Add resources
                </Link>
                <Link href={`/teacher/assessments?courseId=${course.id}`} className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm">
                  Set assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DashboardLayout>
  );
}
