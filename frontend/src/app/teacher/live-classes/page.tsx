"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { LiveClassesPanel } from "@/components/teacher/teacher-panels";

export default function TeacherLiveClassesPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Live Classes"
        subtitle="Schedule sessions, open meeting rooms, and manage class status."
      />
      <LiveClassesPanel />
    </DashboardLayout>
  );
}
