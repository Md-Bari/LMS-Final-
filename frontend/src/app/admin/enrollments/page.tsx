"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { EnrollmentManagementPanel } from "@/components/admin/admin-panels";

export default function AdminEnrollmentsPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Enrollments"
        subtitle="Review learner enrollment status, course assignments, and progress signals."
      />
      <EnrollmentManagementPanel />
    </DashboardLayout>
  );
}
