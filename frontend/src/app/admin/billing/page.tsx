"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { DashboardLayout, PageHeader } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";
import type { PlanTier } from "@/lib/mock-lms";

const PLANS: Array<{ id: PlanTier; label: string; price: number; seats: number; desc: string }> = [
  { id: "Starter", label: "Starter", price: 49, seats: 100, desc: "For small institutes getting started." },
  { id: "Growth", label: "Growth", price: 149, seats: 500, desc: "For growing institutes with more learners." },
  { id: "Professional", label: "Professional", price: 349, seats: 2000, desc: "For large institutes at scale." },
];

export default function AdminBillingPage() {
  const { state, updatePlan } = useMockLms();
  const { billing, invoices } = state;
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const utilization = billing.seatLimit ? Math.round((billing.activeStudents / billing.seatLimit) * 100) : 0;
  const isOverLimit = billing.seatLimit && billing.activeStudents > billing.seatLimit;

  async function handlePlanChange(planId: PlanTier) {
    setSaving(true);
    try {
      await updatePlan(planId);
      setAlert({ type: "success", msg: `Plan upgraded to ${planId} successfully.` });
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to update plan." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan, seats, and invoices."
      />

      {alert && (
        <div className={`mb-6 rounded-xl p-4 text-sm flex items-center justify-between ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{alert.msg}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left */}
        <div className="grid gap-6 content-start">
          {/* Current Plan Card */}
          <div className="card relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1A1A2E, #2d2d50)" }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#E8A020]/15 blur-2xl" />
            <p className="text-xs uppercase tracking-[0.22em] text-white/50 font-semibold">Current Plan</p>
            <p className="font-serif text-4xl text-white mt-1">{billing.plan}</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Active Students</p>
                <p className="text-2xl font-semibold text-white mt-1">{billing.activeStudents}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Seat Limit</p>
                <p className="text-2xl font-semibold text-white mt-1">{billing.seatLimit ?? "∞"}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Monthly Price</p>
                <p className="text-2xl font-semibold text-white mt-1">৳{billing.monthlyPrice ?? 0}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Overage/seat</p>
                <p className="text-2xl font-semibold text-white mt-1">৳{billing.overagePerSeat ?? 0}</p>
              </div>
            </div>

            {/* Seat utilization */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Seat utilization</span>
                <span>{utilization}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(utilization, 100)}%`,
                    background: utilization > 90 ? "#ef4444" : utilization > 70 ? "#E8A020" : "#22c55e"
                  }}
                />
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Seat limit exceeded — overage fees apply.</span>
                </div>
              )}
              {!isOverLimit && utilization > 80 && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-yellow-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Approaching seat limit. Consider upgrading.</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="card">
            <h2 className="font-serif text-xl text-foreground mb-4">Invoices</h2>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 8).map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-mono text-xs text-muted-foreground">{inv.id.slice(0, 12)}…</td>
                        <td className="font-semibold text-foreground text-sm">৳{inv.amountBdt}</td>
                        <td className="text-sm text-muted-foreground">
                          {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("en-BD") : "Not issued"}
                        </td>
                        <td>
                          <span className={`badge ${inv.paymentStatus === "paid" ? "badge-success" : inv.paymentStatus === "overdue" ? "badge-destructive" : "badge-warning"}`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right — Plan selector */}
        <div className="card content-start">
          <h2 className="font-serif text-xl text-foreground mb-1">Upgrade Plan</h2>
          <p className="text-sm text-muted-foreground mb-5">Select a plan that fits your institution.</p>
          <div className="grid gap-3">
            {PLANS.map((plan) => {
              const isCurrent = billing.plan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-all ${isCurrent ? "border-[#E8A020]/50 bg-[#E8A020]/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{plan.label}</p>
                        {isCurrent && <span className="badge badge-warning text-[10px]">Current</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                      <p className="text-sm font-semibold text-foreground mt-2">৳{plan.price.toLocaleString()}/mo · {plan.seats.toLocaleString()} seats</p>
                    </div>
                    {isCurrent ? (
                      <CheckCircle className="w-5 h-5 text-[#E8A020] shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={saving}
                        className="btn-primary text-xs px-3 py-2 shrink-0"
                      >
                        {saving ? "…" : "Select"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
