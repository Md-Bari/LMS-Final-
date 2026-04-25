"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { TeacherSubmissionsPanel } from "@/components/teacher/teacher-panels";

export default function TeacherSubmissionsPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Submissions"
        subtitle="Review student submissions, scores, and feedback outcomes."
      />
      <TeacherSubmissionsPanel />
    </DashboardLayout>
  );
}
