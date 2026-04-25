"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { ContentUploadsPanel } from "@/components/teacher/teacher-panels";

export default function TeacherContentUploadsPage() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Content Uploads"
        subtitle="Attach lesson files and prepare content for assessment generation."
      />
      <ContentUploadsPanel />
    </DashboardLayout>
  );
}
