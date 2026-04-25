"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { TeacherStudentPerformancePanel } from "@/components/teacher/teacher-panels";

export default function TeacherStudentsPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="My Students"
        subtitle="Review learner progress, completion patterns, and support opportunities."
      />
      <TeacherStudentPerformancePanel />
    </DashboardLayout>
  );
}
