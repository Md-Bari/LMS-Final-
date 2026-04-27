"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { StudentFeedbackPanel } from "@/components/student/student-panels";

export default function StudentFeedbackPage() {
  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Feedback & Marks"
        subtitle="View teacher marks, AI scoring, and feedback for every assessment you have submitted."
      />
      <StudentFeedbackPanel />
    </DashboardLayout>
  );
}
