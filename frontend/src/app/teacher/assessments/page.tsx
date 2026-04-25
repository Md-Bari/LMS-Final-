"use client";

import { useState } from "react";
import { Sparkles, Upload, BookOpen, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardLayout, PageHeader, StatusBadge, EmptyState } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";
import { readNoteFile } from "@/lib/utils/lms-helpers";
import { fetchTeacherAssessmentBootstrap, uploadTeacherNote } from "@/lib/api/lms-backend";
import type { Assessment } from "@/lib/mock-lms";

type AssessmentType = "MCQ" | "Essay" | "Short Answer";

export default function TeacherAssessmentsPage() {
  const { state, createAssessmentDraft, publishAssessment } = useMockLms();
  const [tab, setTab] = useState<"list" | "generate">("list");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Generate form
  const [genForm, setGenForm] = useState({
    courseId: "",
    title: "",
    type: "MCQ" as AssessmentType,
    count: 5,
    sourceText: "",
  });
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleNoteUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNoteFile(file);
    setUploading(true);
    try {
      const text = await readNoteFile(file);
      setGenForm((f) => ({ ...f, sourceText: text }));
    } catch {
      // fallback
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!genForm.courseId || !genForm.title || !genForm.sourceText) return;
    setGenerating(true);
    try {
      await createAssessmentDraft({
        courseId: genForm.courseId,
        title: genForm.title,
        type: genForm.type,
        count: genForm.count,
        sourceText: genForm.sourceText,
      });
      setAlert({ type: "success", msg: `Assessment "${genForm.title}" generated as draft.` });
      setTab("list");
      setGenForm({ courseId: "", title: "", type: "MCQ", count: 5, sourceText: "" });
      setNoteFile(null);
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Generation failed." });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish(id: string, title: string) {
    try {
      await publishAssessment(id);
      setAlert({ type: "success", msg: `"${title}" published.` });
    } catch (err) {
      setAlert({ type: "error", msg: err instanceof Error ? err.message : "Failed to publish." });
    }
  }

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Assessments"
        subtitle="Create AI-powered assessments and manage submissions."
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => setTab("list")} className={tab === "list" ? "btn-primary" : "btn-secondary"}>
              <BookOpen className="w-4 h-4" /> All Assessments
            </button>
            <button type="button" onClick={() => setTab("generate")} className={tab === "generate" ? "btn-accent" : "btn-secondary"}>
              <Sparkles className="w-4 h-4" /> AI Generate
            </button>
          </div>
        }
      />

      {alert && (
        <div className={`mb-6 rounded-xl p-4 text-sm flex items-center justify-between ${alert.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{alert.msg}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {tab === "list" ? (
        <div className="card overflow-hidden p-0">
          {state.assessments.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title="No assessments yet"
              description="Use the AI generator to create assessments from your notes."
              action={<button type="button" onClick={() => setTab("generate")} className="btn-accent">Generate Assessment</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Questions</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.assessments.map((a) => {
                    const course = state.courses.find((c) => c.id === a.courseId);
                    return (
                      <>
                        <tr key={a.id}>
                          <td>
                            <button type="button" className="font-semibold text-sm text-foreground flex items-center gap-1.5 hover:text-primary transition-colors" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                              {a.title}
                              {expanded === a.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td><span className="badge badge-primary">{a.type}</span></td>
                          <td className="text-muted-foreground text-sm">{a.questionCount}</td>
                          <td className="text-muted-foreground text-sm truncate max-w-[140px]">{course?.title ?? "—"}</td>
                          <td><StatusBadge status={a.status} /></td>
                          <td>
                            {a.status === "draft" && (
                              <button type="button" onClick={() => handlePublish(a.id, a.title)} className="btn-secondary py-1.5 px-3 text-xs">
                                Publish
                              </button>
                            )}
                          </td>
                        </tr>
                        {expanded === a.id && a.questions.length > 0 && (
                          <tr key={`${a.id}-expanded`}>
                            <td colSpan={6} className="p-0">
                              <div className="bg-muted/30 p-4 border-t border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Questions Preview</p>
                                <div className="grid gap-3">
                                  {a.questions.slice(0, 3).map((q, qi) => (
                                    <div key={q.id} className="card-sm">
                                      <p className="text-sm font-medium text-foreground">Q{qi + 1}. {q.prompt}</p>
                                      {q.options.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          {q.options.map((opt, oi) => (
                                            <p key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${opt === q.answer ? "bg-success/15 text-success font-semibold" : "bg-muted/50 text-muted-foreground"}`}>
                                              {opt}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {a.questions.length > 3 && (
                                    <p className="text-xs text-muted-foreground">+ {a.questions.length - 3} more questions</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* AI Generator */
        <div className="max-w-2xl">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-foreground">AI Assessment Generator</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Upload notes or paste text to generate questions automatically.</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="grid gap-4">
              <div>
                <label className="form-label">Course *</label>
                <select className="form-input" value={genForm.courseId} onChange={(e) => setGenForm({ ...genForm, courseId: e.target.value })} required>
                  <option value="">Select a course</option>
                  {state.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Assessment Title *</label>
                <input type="text" className="form-input" value={genForm.title} onChange={(e) => setGenForm({ ...genForm, title: e.target.value })} placeholder="e.g. Week 3 Quiz" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={genForm.type} onChange={(e) => setGenForm({ ...genForm, type: e.target.value as AssessmentType })}>
                    <option value="MCQ">MCQ</option>
                    <option value="Essay">Essay</option>
                    <option value="Short Answer">Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">No. of Questions</label>
                  <input type="number" className="form-input" value={genForm.count} onChange={(e) => setGenForm({ ...genForm, count: Number(e.target.value) })} min={1} max={20} />
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="form-label">Upload Notes (optional)</label>
                <label className="flex items-center gap-3 w-full rounded-xl border border-dashed border-border/80 px-4 py-4 cursor-pointer hover:border-primary/40 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {noteFile ? noteFile.name : uploading ? "Processing…" : "Click to upload .txt, .pdf, .docx"}
                  </span>
                  <input type="file" className="hidden" accept=".txt,.md,.pdf,.doc,.docx,.csv" onChange={handleNoteUpload} />
                </label>
              </div>

              <div>
                <label className="form-label">Source Text *</label>
                <textarea
                  className="form-input min-h-[140px] resize-none"
                  value={genForm.sourceText}
                  onChange={(e) => setGenForm({ ...genForm, sourceText: e.target.value })}
                  placeholder="Paste your lecture notes, chapter content, or topic keywords here…"
                  required
                />
              </div>

              <button type="submit" disabled={generating} className="btn-accent w-full justify-center py-3">
                {generating ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate Assessment</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
