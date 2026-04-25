"use client";

import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { CompliancePanel } from "@/components/admin/admin-panels";

export default function AdminComplianceReportsPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Compliance Reports"
        subtitle="Export audit-ready completion evidence and send learner reminders."
      />
      <CompliancePanel />
    </DashboardLayout>
  );
}
