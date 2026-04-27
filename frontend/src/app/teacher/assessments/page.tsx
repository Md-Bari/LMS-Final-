"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Upload, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { DataCard, DashboardLayout, EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/DashboardLayout";
import { useMockLms } from "@/providers/mock-lms-provider";

type AssessmentType = "MCQ" | "Essay" | "Short Answer";

export default function TeacherAssessmentsPage() {
  return (
    <Suspense fallback={<AssessmentPageFallback />}>
      <TeacherAssessmentsContent />
    </Suspense>
  );
}

function AssessmentPageFallback() {
  return (
    <DashboardLayout role="teacher">
      <PageHeader title="Assessments" subtitle="Create AI-powered assessments and manage submissions." />
      <div className="card text-sm text-muted-foreground">Loading assessment workspace...</div>
    </DashboardLayout>
  );
}

function TeacherAssessmentsContent() {
  const { state, createAssessmentDraft, publishAssessment, extractNoteText } = useMockLms();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const courseId = searchParams.get("courseId");
    const moduleTitle = searchParams.get("moduleTitle");
    if (courseId) {
      setGenForm((current) => ({
        ...current,
        courseId,
        title: moduleTitle && !current.title ? `${moduleTitle} Assessment` : current.title
      }));
      setTab("generate");
    }
  }, [searchParams]);

  async function handleNoteUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNoteFile(file);
    setUploading(true);
    try {
      const text = await extractNoteText(file);
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
    const moduleId = searchParams.get("moduleId");
    setGenerating(true);
    try {
      await createAssessmentDraft({
        courseId: genForm.courseId,
        title: genForm.title,
        type: genForm.type,
        count: genForm.count,
        sourceText: genForm.sourceText,
      });

      if (moduleId) {
        router.push(`/teacher/courses/${genForm.courseId}?moduleId=${moduleId}&fromAssessment=1`);
        return;
      }

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
        <div className="card">
          {state.assessments.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title="No assessments yet"
              description="Use the AI generator to create assessments from your notes."
              action={<button type="button" onClick={() => setTab("generate")} className="btn-accent">Generate Assessment</button>}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {state.assessments.map((a) => {
                const course = state.courses.find((c) => c.id === a.courseId);
                const passingMark = a.type === "Essay" || a.type === "Short Answer" ? "60%" : "50%";
                const hasRubric = a.rubricKeywords.length > 0;
                const expandedCard = expanded === a.id;

                return (
                  <DataCard
                    key={a.id}
                    title={a.title}
                    description={course?.title ?? "Unassigned course"}
                    meta={
                      <>
                        <span className="badge badge-primary">{a.type}</span>
                        <StatusBadge status={a.status} />
                      </>
                    }
                    actions={
                      <>
                        <button type="button" onClick={() => setExpanded(expandedCard ? null : a.id)} className="btn-secondary px-3 py-2 text-xs">
                          {expandedCard ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          View
                        </button>
                        {a.status === "draft" ? (
                          <button type="button" onClick={() => handlePublish(a.id, a.title)} className="btn-accent px-3 py-2 text-xs">
                            Publish
                          </button>
                        ) : null}
                      </>
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-muted/45 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Questions</p>
                        <p className="mt-2 text-xl font-extrabold text-foreground">{a.questionCount}</p>
                      </div>
                      <div className="rounded-xl bg-muted/45 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Passing</p>
                        <p className="mt-2 text-xl font-extrabold text-foreground">{passingMark}</p>
                      </div>
                      <div className="rounded-xl bg-muted/45 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Rubric</p>
                        <p className="mt-2 text-sm font-bold text-foreground">{hasRubric ? "Defined" : "Basic"}</p>
                      </div>
                      <div className="rounded-xl bg-muted/45 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Retake</p>
                        <p className="mt-2 text-sm font-bold text-foreground">Controlled</p>
                      </div>
                    </div>

                    {expandedCard && a.questions.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Questions Preview</p>
                        <div className="grid gap-3">
                          {a.questions.slice(0, 3).map((q, qi) => (
                            <div key={q.id} className="card-sm">
                              <p className="text-sm font-medium text-foreground">Q{qi + 1}. {q.prompt}</p>
                              {q.options.length > 0 ? (
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                  {q.options.map((opt, oi) => (
                                    <p key={oi} className={`rounded-lg px-3 py-1.5 text-xs ${opt === q.answer ? "bg-success/15 font-semibold text-success" : "bg-muted/50 text-muted-foreground"}`}>
                                      {opt}
                                    </p>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                          {a.questions.length > 3 ? (
                            <p className="text-xs text-muted-foreground">+ {a.questions.length - 3} more questions</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </DataCard>
                );
              })}
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
