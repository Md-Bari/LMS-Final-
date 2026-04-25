"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { CourseWorkbench } from "@/components/teacher/teacher-panels";

export default function TeacherCoursesPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="My Courses"
        subtitle="Build modules, add lessons, upload content, and publish courses."
      />
      <CourseWorkbench />
    </DashboardLayout>
  );
}
