"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { useMockLms } from "@/providers/mock-lms-provider";
import {
  createLiveClassOnBackend,
  fetchLiveClassesFromBackend,
  updateLiveClassStatusOnBackend
} from "@/lib/api/lms-backend";
import {
  Badge,
  PrimaryButton,
  SecondaryButton,
  SeeMoreButton,
  Section,
  SelectInput,
  StatCard,
  TextArea,
  TextInput
} from "@/components/shared/lms-core";

function defaultStartTimeValue() {
  return new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16);
}

export function TeacherLiveClassesPanel() {
  const { state, currentUser, scheduleLiveClass, setLiveClassStatus } = useMockLms();
  const [showAllLiveClasses, setShowAllLiveClasses] = useState(false);
  const [liveClasses, setLiveClasses] = useState(state.liveClasses);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    title: "",
    courseId: state.courses[0]?.id ?? "",
    startTime: "",
    durationMinutes: 60,
    platform: "jitsi",
    meetingLink: "",
    description: ""
  });

  const visibleLiveClasses = showAllLiveClasses ? liveClasses : liveClasses.slice(0, 5);

  useEffect(() => {
    if (!currentUser) {
      setLiveClasses(state.liveClasses);
      return;
    }

    let cancelled = false;

    async function loadLiveClasses() {
      setLoading(true);
      setFeedback("");

      try {
        const classes = await fetchLiveClassesFromBackend();
        if (!cancelled) {
          setLiveClasses(classes);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback(error instanceof Error ? error.message : "Failed to load live classes.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLiveClasses();

    return () => {
      cancelled = true;
    };
  }, [currentUser, state.liveClasses]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      courseId: current.courseId || state.courses[0]?.id || "",
      startTime: current.startTime || defaultStartTimeValue()
    }));
  }, [state.courses]);

  async function refreshLiveClasses() {
    if (!currentUser) {
      setLiveClasses(state.liveClasses);
      return;
    }

    const classes = await fetchLiveClassesFromBackend();
    setLiveClasses(classes);
  }

  async function handleScheduleClass() {
    if (!form.title.trim() || !form.courseId) {
      setFeedback("Please provide title and course.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      if (currentUser) {
        await createLiveClassOnBackend({
          title: form.title.trim(),
          courseId: form.courseId,
          startTime: form.startTime,
          durationMinutes: form.durationMinutes,
          platform: form.platform,
          meetingLink: form.meetingLink.trim() || undefined,
          description: form.description.trim() || undefined
        });
        await refreshLiveClasses();
      } else {
        await scheduleLiveClass({
          title: form.title.trim(),
          courseId: form.courseId,
          startTime: new Date(form.startTime).toISOString(),
          durationMinutes: form.durationMinutes,
          platform: form.platform,
          meetingLink: form.meetingLink.trim() || undefined,
          description: form.description.trim() || undefined
        });
        setLiveClasses(state.liveClasses);
      }

      setFeedback("Live class scheduled successfully.");
      setIsModalOpen(false);
      setForm((current) => ({
        ...current,
        title: "",
        meetingLink: "",
        description: "",
        startTime: defaultStartTimeValue()
      }));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to schedule live class.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(classId: string, status: "live" | "recorded") {
    setFeedback("");
    try {
      if (currentUser) {
        await updateLiveClassStatusOnBackend(classId, status);
        await refreshLiveClasses();
      } else {
        await setLiveClassStatus(classId, status);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to update class status.");
    }
  }

  function handleJoinClass(meetingUrl?: string | null) {
    if (!meetingUrl) {
      setFeedback("Meeting link not available.");
      return;
    }

    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-6">
      <Section title="Live classes" subtitle="Schedule class sessions with your own meeting link or leave it empty for auto-generated Jitsi.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <PrimaryButton onClick={() => setIsModalOpen(true)}>Schedule class</PrimaryButton>
          {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading live classes...</p> : null}

        <div className="grid gap-4">
          {visibleLiveClasses.map((liveClass) => {
            const meetingUrl = liveClass.meetingUrl ?? null;

            return (
              <div key={liveClass.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-2xl">{liveClass.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(liveClass.startAt).toLocaleString()} Â· {liveClass.durationMinutes} min Â· {liveClass.provider}
                    </p>
                  </div>
                  <Badge>{liveClass.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StatCard label="Participants" value={String(liveClass.participantLimit)} icon={<Users className="h-5 w-5" />} className="min-h-[6.6rem] p-4" />
                  <StatCard label="24h reminder" value={liveClass.reminder24h ? "On" : "Off"} className="min-h-[6.6rem] p-4" />
                  <StatCard label="1h reminder" value={liveClass.reminder1h ? "On" : "Off"} className="min-h-[6.6rem] p-4" />
                </div>
                <div className="mt-4 rounded-[1.2rem] border border-foreground/10 bg-background/70 p-4 text-sm text-muted-foreground dark:border-white/8 dark:bg-white/5">
                  {meetingUrl ? (
                    <>Meeting room: <span className="font-semibold text-foreground">{meetingUrl}</span></>
                  ) : (
                    "Meeting link not available."
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PrimaryButton onClick={() => handleJoinClass(meetingUrl)}>Join class</PrimaryButton>
                  <SecondaryButton onClick={() => handleStatusChange(liveClass.id, "live")}>Mark live</SecondaryButton>
                  <SecondaryButton onClick={() => handleStatusChange(liveClass.id, "recorded")}>Mark recorded</SecondaryButton>
                  {liveClass.recordingUrl ? (
                    <SecondaryButton onClick={() => window.open(liveClass.recordingUrl ?? undefined, "_blank", "noopener,noreferrer")}>
                      Open recording
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {!visibleLiveClasses.length && !loading ? (
          <p className="text-sm text-muted-foreground">No live classes found yet.</p>
        ) : null}

        {liveClasses.length > 5 ? <SeeMoreButton expanded={showAllLiveClasses} remaining={liveClasses.length - 5} onClick={() => setShowAllLiveClasses((current) => !current)} /> : null}
      </Section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-[18px] border border-foreground/10 bg-background p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-serif text-2xl">Schedule class</p>
              <SecondaryButton onClick={() => setIsModalOpen(false)}>Close</SecondaryButton>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Class title" />
              <SelectInput value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
                {state.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </SelectInput>
              <TextInput type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
              <TextInput type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} placeholder="Duration (minutes)" />
              <SelectInput value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>
                <option value="jitsi">Jitsi</option>
                <option value="google-meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Teams</option>
                <option value="custom">Custom</option>
              </SelectInput>
              <TextInput value={form.meetingLink} onChange={(event) => setForm({ ...form, meetingLink: event.target.value })} placeholder="https://... (optional)" />
            </div>
            <TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description (optional)" className="mt-3 min-h-[88px]" />
            <div className="mt-4 flex justify-end gap-2">
              <SecondaryButton onClick={() => setIsModalOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleScheduleClass} disabled={submitting}>
                {submitting ? "Scheduling..." : "Schedule class"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
