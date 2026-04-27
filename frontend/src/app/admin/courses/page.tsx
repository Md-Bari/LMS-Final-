"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { BookOpen, Plus, Filter, Clock, Signal, Tag, Layers, Sparkles } from "lucide-react";
import {
  DashboardLayout, PageHeader, StatusBadge, SearchBar, EmptyState
} from "@/components/dashboard/DashboardLayout";
import { fetchCoursesFromBackend } from "@/lib/api/lms-backend";
import { useMockLms } from "@/providers/mock-lms-provider";
import type { Course } from "@/lib/mock-lms";

/* ── helpers ─────────────────────────────────────────────────── */

function courseLessonCount(course: Course) {
  return course.modules.reduce((total, m) => total + m.lessons.length, 0);
}

function courseDuration(course: Course) {
  const minutes = course.modules.reduce(
    (total, m) => total + m.lessons.reduce((t, l) => t + (l.durationMinutes ?? 0), 0),
    0
  );
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function courseLevel(course: Course): string {
  const count = courseLessonCount(course);
  if (count <= 5) return "Beginner";
  if (count <= 12) return "Intermediate";
  return "Advanced";
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40",
  Intermediate: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40",
  Advanced: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40",
};

const CATEGORY_ICONS: Record<string, string> = {
  Technology: "💻",
  Business: "📊",
  Language: "🌍",
  Science: "🔬",
  Arts: "🎨",
  Compliance: "📋",
  Leadership: "🏆",
  Teaching: "📚",
};

const categories = ["Technology", "Business", "Language", "Science", "Arts", "Compliance", "Leadership", "Teaching"];

/* ── Loading skeleton ────────────────────────────────────────── */

function CourseTableSkeleton() {
  return (
    <div className="card overflow-hidden p-0 animate-pulse">
      {/* header */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-2 px-5 py-3.5 border-b border-border/60">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-3 rounded w-3/4" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="hidden lg:grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-2 items-center px-5 py-4 border-b border-border/40"
        >
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton-shimmer h-3.5 rounded w-2/3" />
              <div className="skeleton-shimmer h-2.5 rounded w-1/2" />
            </div>
          </div>
          <div className="skeleton-shimmer h-3 rounded w-3/4" />
          <div className="skeleton-shimmer h-6 rounded-full w-20" />
          <div className="skeleton-shimmer h-3 rounded w-1/2" />
          <div className="skeleton-shimmer h-3 rounded w-1/2" />
          <div className="skeleton-shimmer h-6 rounded-full w-16" />
          <div className="skeleton-shimmer h-3 rounded w-1/3" />
          <div className="skeleton-shimmer h-8 rounded-xl w-20" />
        </div>
      ))}
      {/* mobile skeleton */}
      <div className="lg:hidden grid gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton-shimmer h-11 w-11 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton-shimmer h-4 rounded w-3/4" />
                <div className="skeleton-shimmer h-3 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="skeleton-shimmer h-10 rounded-lg" />
              <div className="skeleton-shimmer h-10 rounded-lg" />
              <div className="skeleton-shimmer h-10 rounded-lg" />
            </div>
            <div className="skeleton-shimmer h-9 rounded-xl w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Course row (desktop) ────────────────────────────────────── */

function CourseRow({
  course,
  onPublish,
  publishing,
}: {
  course: Course;
  onPublish: (id: string, title: string) => void;
  publishing: string | null;
}) {
  const lessons = courseLessonCount(course);
  const duration = courseDuration(course);
  const level = courseLevel(course);
  const icon = CATEGORY_ICONS[course.category] ?? "📘";

  return (
    <div
      className="hidden lg:grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-2 items-center px-5 py-3.5 border-b border-border/40 transition-all duration-200 hover:bg-primary/[0.03] group cursor-default"
    >
      {/* Title + desc */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 text-lg transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors duration-200">
            {course.title}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {course.description?.slice(0, 50)}{course.description && course.description.length > 50 ? "…" : ""}
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Tag className="w-3.5 h-3.5 shrink-0 opacity-50" />
        <span className="truncate">{course.category}</span>
      </div>

      {/* Level */}
      <div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[level] ?? "text-muted-foreground bg-muted"}`}>
          <Signal className="w-3 h-3" />
          {level}
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5 shrink-0 opacity-50" />
        <span>{duration || "—"}</span>
      </div>

      {/* Price */}
      <div className="text-sm font-semibold text-foreground">
        {course.price > 0 ? `৳${course.price.toLocaleString()}` : <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free</span>}
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={course.status} />
      </div>

      {/* Lessons */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Layers className="w-3.5 h-3.5 shrink-0 opacity-50" />
        <span>{lessons}</span>
      </div>

      {/* Action */}
      <div>
        {course.status === "draft" ? (
          <button
            type="button"
            onClick={() => onPublish(course.id, course.title)}
            disabled={publishing === course.id}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            {publishing === course.id ? "Publishing…" : "Publish"}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        )}
      </div>
    </div>
  );
}

/* ── Course card (mobile) ────────────────────────────────────── */

function CourseCard({
  course,
  onPublish,
  publishing,
}: {
  course: Course;
  onPublish: (id: string, title: string) => void;
  publishing: string | null;
}) {
  const lessons = courseLessonCount(course);
  const duration = courseDuration(course);
  const level = courseLevel(course);
  const icon = CATEGORY_ICONS[course.category] ?? "📘";

  return (
    <div className="lg:hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 text-xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm leading-snug">{course.title}</p>
            <StatusBadge status={course.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.description}</p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="rounded-lg bg-muted/40 px-2.5 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Category</p>
          <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{course.category}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Level</p>
          <p className={`text-xs font-semibold mt-0.5 ${level === "Beginner" ? "text-emerald-600 dark:text-emerald-400" : level === "Intermediate" ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"}`}>{level}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Price</p>
          <p className="text-xs font-semibold text-foreground mt-0.5">
            {course.price > 0 ? `৳${course.price.toLocaleString()}` : "Free"}
          </p>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {duration || "—"}</span>
          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {lessons} lessons</span>
        </div>
        {course.status === "draft" && (
          <button
            type="button"
            onClick={() => onPublish(course.id, course.title)}
            disabled={publishing === course.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            {publishing === course.id ? "…" : "Publish"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */

export default function AdminCoursesPage() {
  const { state, currentUser, createCourse, publishCourse } = useMockLms();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [backendCourses, setBackendCourses] = useState(state.courses);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({ title: "", category: "", description: "", price: "" });

  // Fetch courses
  useEffect(() => {
    if (!currentUser) {
      setBackendCourses(state.courses);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const courses = await fetchCoursesFromBackend(search);
        if (!cancelled) setBackendCourses(courses);
      } catch {
        if (!cancelled) {
          setBackendCourses(state.courses);
          setAlert({ type: "error", msg: "Could not load courses from backend. Showing local data." });
        }
      } finally {
        if (!cancelled) setLoading(false);
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

  const stats = useMemo(() => {
    return {
      total: courseSource.length,
      published: courseSource.filter((c) => c.status === "published").length,
      draft: courseSource.filter((c) => c.status === "draft").length,
      totalLessons: courseSource.reduce((t, c) => t + courseLessonCount(c), 0),
    };
  }, [courseSource]);

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

  const handlePublish = useCallback(async (courseId: string, title: string) => {
    setPublishing(courseId);
    try {
      await publishCourse(courseId);
      setAlert({ type: "success", msg: `"${title}" published successfully.` });
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to publish." });
    } finally {
      setPublishing(null);
    }
  }, [publishCourse]);

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Courses"
        subtitle={`${stats.total} courses · ${stats.published} published · ${stats.totalLessons} total lessons`}
        actions={
          <button type="button" onClick={() => setShowCreate(true)} className="btn-accent">
            <Plus className="w-4 h-4" /> New Course
          </button>
        }
      />

      {/* Alert */}
      {alert && (
        <div className={`mb-6 rounded-xl p-4 text-sm flex items-center justify-between ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{alert.msg}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Courses</p>
          <p className="text-2xl font-serif font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Published</p>
          <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Drafts</p>
          <p className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.draft}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Lessons</p>
          <p className="text-2xl font-serif font-bold text-foreground mt-1">{stats.totalLessons}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search courses by title or category…" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {f} {f !== "all" && <span className="ml-1 opacity-60">({f === "published" ? stats.published : stats.draft})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Course Table / Cards */}
      {loading ? (
        <CourseTableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card overflow-hidden p-0">
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No courses found"
            description={search ? `No courses match "${search}".` : "Create your first course to get started."}
            action={<button type="button" onClick={() => setShowCreate(true)} className="btn-accent">Create Course</button>}
          />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Desktop table header */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-2 px-5 py-3 border-b border-border/60 bg-muted/30">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Course</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Category</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Level</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Duration</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Price</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Status</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Lessons</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Action</p>
          </div>

          {/* Desktop rows */}
          {filtered.map((course) => (
            <CourseRow key={course.id} course={course} onPublish={handlePublish} publishing={publishing} />
          ))}

          {/* Mobile cards */}
          <div className="lg:hidden grid gap-3 p-4">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} onPublish={handlePublish} publishing={publishing} />
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {courseSource.length} courses</span>
            <span>{stats.totalLessons} total lessons across all courses</span>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-foreground">New Course</h2>
                <p className="text-sm text-muted-foreground">Fill in the details to create a new course draft.</p>
              </div>
            </div>
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
