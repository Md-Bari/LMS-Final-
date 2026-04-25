"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { StudentAssessmentPanel } from "@/components/student/student-panels";

export default function StudentAssignmentsPage() {
  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Assignments"
        subtitle="Submit assessments, review feedback, and keep your coursework moving."
      />
      <StudentAssessmentPanel />
    </DashboardLayout>
  );
}
