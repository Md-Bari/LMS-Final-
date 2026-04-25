"use client";

import { useState, useMemo } from "react";
import { Users, Filter } from "lucide-react";
import {
  DashboardLayout, PageHeader, StatusBadge, SearchBar, EmptyState
} from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";

export default function AdminUsersPage() {
  const { state } = useMockLms();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher" | "student">("all");

  const filtered = useMemo(() => {
    return state.users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [state.users, search, roleFilter]);

  const roleCounts = useMemo(() => ({
    admin: state.users.filter((u) => u.role === "admin").length,
    teacher: state.users.filter((u) => u.role === "teacher").length,
    student: state.users.filter((u) => u.role === "student").length,
  }), [state.users]);

  function getAvatarColor(role: string) {
    if (role === "teacher") return "linear-gradient(135deg, #0f766e, #14b8a6)";
    if (role === "student") return "linear-gradient(135deg, #7c3aed, #a855f7)";
    return "linear-gradient(135deg, #1A1A2E, #E8A020)";
  }

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="User Management"
        subtitle={`${state.users.length} total users — ${roleCounts.student} students, ${roleCounts.teacher} teachers, ${roleCounts.admin} admins.`}
      />

      {/* Role summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { role: "student", label: "Students", count: roleCounts.student, color: "#7c3aed" },
          { role: "teacher", label: "Teachers", count: roleCounts.teacher, color: "#0f766e" },
          { role: "admin", label: "Admins", count: roleCounts.admin, color: "#E8A020" },
        ] as const).map(({ role, label, count, color }) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
            className={`card text-left transition-all hover:-translate-y-0.5 cursor-pointer ${roleFilter === role ? "ring-2" : ""}`}
            style={roleFilter === role ? { boxShadow: `0 0 0 2px ${color}` } : undefined}
          >
            <p className="text-2xl font-serif font-semibold" style={{ color }}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-[0.18em] font-semibold">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "student", "teacher", "admin"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${roleFilter === f ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No users found" description={search ? `No users match "${search}".` : "No users in this category."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-9 h-9 text-xs shrink-0" style={{ background: getAvatarColor(user.role) }}>
                          {user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                        </div>
                        <p className="font-semibold text-sm text-foreground">{user.name}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge capitalize ${user.role === "admin" ? "bg-[#E8A020]/15 text-[#c47d0a]" : user.role === "teacher" ? "badge-success" : "badge-primary"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-sm">{user.department ?? "—"}</td>
                    <td className="text-muted-foreground text-sm">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
