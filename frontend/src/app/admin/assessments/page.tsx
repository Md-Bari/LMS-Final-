"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { AdminAssessmentsPanel } from "@/components/admin/admin-panels";

export default function AdminAssessmentsPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Assessments"
        subtitle="Monitor assessment coverage, publication status, and teacher review readiness."
      />
      <AdminAssessmentsPanel />
    </DashboardLayout>
  );
}
