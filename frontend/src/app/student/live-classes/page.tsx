"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { StudentLiveClassesPanel } from "@/components/student/student-panels";

export default function StudentLiveClassesPage() {
  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Live Classes"
        subtitle="Join upcoming sessions and review recorded class access."
      />
      <StudentLiveClassesPanel />
    </DashboardLayout>
  );
}
