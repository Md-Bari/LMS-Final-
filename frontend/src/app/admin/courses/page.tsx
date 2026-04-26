"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Filter } from "lucide-react";
import {
  DashboardLayout, PageHeader, StatusBadge, SearchBar, EmptyState
} from "@/components/dashboard/DashboardLayout";
import { fetchCoursesFromBackend } from "@/lib/api/lms-backend";
import { useMockLms } from "@/providers/mock-lms-provider";

export default function AdminCoursesPage() {
  const { state, currentUser, createCourse, publishCourse } = useMockLms();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [backendCourses, setBackendCourses] = useState(state.courses);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({ title: "", category: "", description: "", price: "" });

  useEffect(() => {
    if (!currentUser) {
      setBackendCourses(state.courses);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const courses = await fetchCoursesFromBackend(search);

        if (!cancelled) {
          setBackendCourses(courses);
        }
      } catch {
        if (!cancelled) {
          setBackendCourses(state.courses);
          setAlert({ type: "error", msg: "Could not load courses from backend. Showing local data." });
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentUser, search, state.courses]);

  const courseSource = currentUser ? backendCourses : state.courses;

  const filtered = useMemo(() => {
    return courseSource.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || c.status === filter;
      return matchSearch && matchFilter;
    });
  }, [courseSource, search, filter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.category) return;
    setCreating(true);
    try {
      await createCourse({
        title: form.title,
        category: form.category,
        description: form.description,
        price: Number(form.price) || 0,
      });
      setAlert({ type: "success", msg: `"${form.title}" created as draft.` });
      setForm({ title: "", category: "", description: "", price: "" });
      setShowCreate(false);
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to create course." });
    } finally {
      setCreating(false);
    }
  }

  async function handlePublish(courseId: string, title: string) {
    try {
      await publishCourse(courseId);
      setAlert({ type: "success", msg: `"${title}" published successfully.` });
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to publish." });
    }
  }

  const categories = ["Technology", "Business", "Language", "Science", "Arts", "Compliance", "Leadership", "Teaching"];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Courses"
        subtitle={`${courseSource.length} total courses on your platform.`}
        actions={
          <button type="button" onClick={() => setShowCreate(true)} className="btn-accent">
            <Plus className="w-4 h-4" /> New Course
          </button>
        }
      />

      {alert && (
        <div className={`mb-6 rounded-xl p-4 text-sm flex items-center justify-between ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{alert.msg}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search courses…" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {searchLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Searching courses...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No courses found"
            description={search ? `No courses match "${search}".` : "Create your first course to get started."}
            action={<button type="button" onClick={() => setShowCreate(true)} className="btn-accent">Create Course</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Modules</th>
                  <th>Students</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm truncate max-w-[160px]">{course.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{course.description?.slice(0, 40)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground text-sm">{course.category}</td>
                    <td className="text-muted-foreground text-sm">{course.modules.length}</td>
                    <td className="text-muted-foreground text-sm">{course.enrollmentCount}</td>
                    <td className="text-foreground text-sm font-medium">৳{course.price}</td>
                    <td><StatusBadge status={course.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        {course.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => handlePublish(course.id, course.title)}
                            className="btn-secondary py-1.5 px-3 text-xs"
                          >
                            Publish
                          </button>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {course.modules.reduce((t, m) => t + m.lessons.length, 0)} lessons
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl text-foreground mb-1">New Course</h2>
            <p className="text-sm text-muted-foreground mb-5">Fill in the details to create a new course draft.</p>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Advanced Python for Data Science"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input min-h-[90px] resize-none"
                  placeholder="Brief description of the course…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Price (BDT)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min={0}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="btn-accent flex-1">
                  {creating ? "Creating…" : "Create Course"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
