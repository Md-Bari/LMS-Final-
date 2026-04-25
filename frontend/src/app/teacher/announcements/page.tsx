"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { TeacherAnnouncementsPanel } from "@/components/teacher/teacher-panels";

export default function TeacherAnnouncementsPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Announcements"
        subtitle="Review learner-facing messages and class communication."
      />
      <TeacherAnnouncementsPanel />
    </DashboardLayout>
  );
}
