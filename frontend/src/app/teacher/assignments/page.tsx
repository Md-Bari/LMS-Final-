"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { TeacherAssessmentsPanel } from "@/components/teacher/teacher-panels";

export default function TeacherAssignmentsPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Assignments"
        subtitle="Track assignment-style assessments and publication status."
      />
      <TeacherAssessmentsPanel />
    </DashboardLayout>
  );
}
