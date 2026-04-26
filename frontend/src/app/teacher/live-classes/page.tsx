"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { TeacherLiveClassesPanel } from "@/components/teacher/teacher-live-classes-panel";

export default function TeacherLiveClassesPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Live Classes"
        subtitle="Schedule sessions, open meeting rooms, and manage class status."
      />
      <TeacherLiveClassesPanel />
    </DashboardLayout>
  );
}
