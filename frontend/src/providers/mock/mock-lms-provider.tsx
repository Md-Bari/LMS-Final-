"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  evaluateEssay,
  generateAiQuestions,
  getCourseById,
  planMatrix,
  seedState,
  type AssessmentType,
  type Lesson,
  type MockLmsState,
  type PlanTier,
  type Role,
  type TenantBranding,
  type UserProfile,
  uid
} from "@/lib/mock/lms-data";
import {
  addToWishlistOnBackend,
  addCourseLessonOnBackend,
  addCourseModuleOnBackend,
  completeLessonOnBackend,
  createEnrollmentOnBackend,
  createCourseOnBackend,
  createLiveClassOnBackend,
  fetchAuthenticatedBootstrap,
  fetchAuthenticatedProfile,
  generateTeacherAssessmentDraft,
  issueCertificateOnBackend,
  publishTeacherAssessment,
  publishCourseOnBackend,
  revokeCertificateOnBackend,
  removeFromWishlistOnBackend,
  registerToBackend,
  sendComplianceRemindersOnBackend,
  signInToBackend,
  signOutFromBackend,
  submitAssessmentOnBackend,
  updateBillingOnBackend,
  updateLiveClassStatusOnBackend,
  uploadLessonContentOnBackend,
  updateTenantBrandingOnBackend,
  uploadTeacherNote,
  setCourseAssessmentGateOnBackend,
  sendEmailOnBackend
} from "@/lib/api/lms-backend";
import { readNoteFile } from "@/lib/utils/lms-helpers";

type CreateCoursePayload = {
  title: string;
  category: string;
  description: string;
  price: number;
};

type CreateAssessmentPayload = {
  courseId: string;
  title: string;
  type: AssessmentType;
  sourceText: string;
  count: number;
  fallbackBankId?: string;
  generatedFromLabel?: string;
  usedFallbackBank?: boolean;
};

type ScheduleLiveClassPayload = {
  title: string;
  courseId: string;
  batchName?: string;
  description?: string;
  startAt?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  meetingType?: "jitsi" | "external";
  meetingLink?: string;
  durationMinutes: number;
  status?: "scheduled" | "live" | "completed" | "cancelled";
};

type AssessmentSubmissionResult = {
  score: number;
  passed: boolean;
  feedback: string;
  status?: string;
};

type MockLmsContextType = {
  state: MockLmsState;
  currentUser: UserProfile | null;
  authReady: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (name: string, email: string, password: string, role: Role) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  resetDemo: () => Promise<void>;
  updateBranding: (branding: TenantBranding) => Promise<void>;
  createCourse: (payload: CreateCoursePayload) => Promise<void>;
  publishCourse: (courseId: string) => Promise<void>;
  setCourseAssessmentGate: (courseId: string, enabled: boolean) => Promise<void>;
  addModule: (courseId: string, title: string) => Promise<void>;
  addLesson: (
    courseId: string,
    moduleId: string,
    lesson: { title: string; type: "video" | "document" | "quiz" | "assignment" | "live"; durationMinutes: number; releaseAt?: string }
  ) => Promise<Lesson | null>;
  uploadLessonContent: (courseId: string, moduleId: string, lessonId: string, file: File) => Promise<void>;
  markLessonComplete: (courseId: string, lessonId: string, studentName?: string) => Promise<void>;
  enrollInCourse: (courseId: string, studentName?: string) => Promise<void>;
  addToWishlist: (courseId: string) => Promise<void>;
  removeFromWishlist: (courseId: string) => Promise<void>;
  createAssessmentDraft: (payload: CreateAssessmentPayload) => Promise<void>;
  publishAssessment: (assessmentId: string) => Promise<void>;
  submitAssessment: (assessmentId: string, studentName: string, answerText: string) => Promise<AssessmentSubmissionResult | null>;
  scheduleLiveClass: (payload: ScheduleLiveClassPayload) => Promise<void>;
  setLiveClassStatus: (classId: string, status: "scheduled" | "live" | "recorded") => Promise<void>;
  issueCertificate: (studentName: string, courseId: string) => Promise<void>;
  revokeCertificate: (certificateId: string) => Promise<void>;
  updatePlan: (plan: PlanTier) => Promise<void>;
  updateActiveStudents: (activeStudents: number) => Promise<void>;
  sendComplianceReminders: (courseId: string) => Promise<void>;
  sendCustomEmail: (to: string, subject: string, body: string) => Promise<void>;
  extractNoteText: (file: File) => Promise<string>;
};

const MockLmsContext = createContext<MockLmsContextType | null>(null);

function createAuditEvent(actor: string, action: string, target: string, tenantId?: string, vendorId?: string) {
  return {
    id: uid("audit"),
    tenantId,
    vendorId,
    actor,
    action,
    target,
    ipAddress: "127.0.0.1",
    timestamp: new Date().toISOString()
  };
}

function roleForApp(role: string): Role {
  if (role === "teacher" || role === "student") {
    return role;
  }

  return "admin";
}

function defaultStudentName(state: MockLmsState, currentUser: UserProfile | null) {
  return currentUser?.name ?? state.users.find((user) => user.role === "student")?.name ?? "Student";
}

function buildLocalCertificateNumber(courseId: string, studentName: string) {
  return `BETO-${courseId.replace(/^course-/, "").slice(0, 4).toUpperCase()}-${studentName
    .replace(/\s+/g, "")
    .slice(0, 4)
    .toUpperCase()}`;
}

function buildLocalMeetingUrl(title: string) {
  const roomName = title
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `https://meet.jit.si/SmartLMS-${roomName || "Live-Class"}`;
}

function normalizeSchedulePayload(payload: ScheduleLiveClassPayload) {
  const date = payload.date ?? payload.startAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const startTime = payload.startTime ?? payload.startAt?.slice(11, 16) ?? new Date().toISOString().slice(11, 16);
  const startAt = payload.startAt ?? `${date}T${startTime}`;
  const startAtMs = Date.parse(startAt);
  const endTime = payload.endTime ?? (Number.isNaN(startAtMs) ? startTime : new Date(startAtMs + payload.durationMinutes * 60 * 1000).toISOString().slice(11, 16));

  return {
    ...payload,
    startAt,
    date,
    startTime,
    endTime,
    meetingType: "jitsi" as const
  };
}

function resolveAutoLiveStatus(liveClass: MockLmsState["liveClasses"][number], nowMs: number) {
  if (liveClass.status === "recorded" || liveClass.status === "completed" || liveClass.status === "cancelled") {
    return liveClass.status;
  }

  const startMs = Date.parse(liveClass.startAt);

  if (Number.isNaN(startMs)) {
    return liveClass.status;
  }

  const endMs = startMs + liveClass.durationMinutes * 60 * 1000;

  if (nowMs >= startMs && nowMs <= endMs) {
    return "live" as const;
  }

  return liveClass.status;
}

function withAutoLiveClasses(currentState: MockLmsState, nowMs: number): MockLmsState {
  return {
    ...currentState,
    liveClasses: currentState.liveClasses.map((liveClass) => ({
      ...liveClass,
      status: resolveAutoLiveStatus(liveClass, nowMs)
    }))
  };
}

function normalizeState(partial?: Partial<MockLmsState>): MockLmsState {
  return {
    ...seedState,
    ...partial,
    branding: partial?.branding ?? seedState.branding,
    users: partial?.users ?? seedState.users,
    courses: partial?.courses ?? seedState.courses,
    enrollments: partial?.enrollments ?? seedState.enrollments,
    wishlists: partial?.wishlists ?? seedState.wishlists,
    assessments: partial?.assessments ?? seedState.assessments,
    submissions: partial?.submissions ?? seedState.submissions,
    liveClasses: partial?.liveClasses ?? seedState.liveClasses,
    certificates: partial?.certificates ?? seedState.certificates,
    notifications: partial?.notifications ?? seedState.notifications,
    auditEvents: partial?.auditEvents ?? seedState.auditEvents,
    complianceRecords: partial?.complianceRecords ?? seedState.complianceRecords,
    invoices: partial?.invoices ?? seedState.invoices,
    billing: partial?.billing ?? seedState.billing
  };
}

export function dashboardPathForRole(role: string | Role | null | undefined) {
  const normalizedRole = roleForApp(String(role ?? ""));

  if (normalizedRole === "teacher") {
    return "/teacher/dashboard";
  }

  if (normalizedRole === "student") {
    return "/student/dashboard";
  }

  return "/admin/dashboard";
}

export function MockLmsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MockLmsState>(seedState);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [liveClock, setLiveClock] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function initializeSession() {
      try {
        const [profile, bootstrap] = await Promise.all([
          fetchAuthenticatedProfile(),
          fetchAuthenticatedBootstrap()
        ]);

        if (cancelled) {
          return;
        }

        setCurrentUser(profile.user);
        setState(normalizeState(bootstrap));
      } catch {
        if (cancelled) {
          return;
        }

        setCurrentUser(null);
        setState(seedState);
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    }

    void initializeSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveClock(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  async function refreshBackendState() {
    const bootstrap = await fetchAuthenticatedBootstrap();
    setState(normalizeState(bootstrap));
  }

  const derivedState = useMemo(() => withAutoLiveClasses(state, liveClock), [liveClock, state]);

  const value: MockLmsContextType = useMemo(() => ({
    state: derivedState,
    currentUser,
    authReady,
    isAuthenticated: currentUser !== null,
    async signIn(email, password) {
      const session = await signInToBackend(email, password);
      const nextUser = {
        ...session.user,
        role: roleForApp(session.user.role)
      };

      setCurrentUser(nextUser);
      setState(normalizeState({
        ...session.bootstrap,
        branding: session.bootstrap.branding ?? session.branding ?? seedState.branding,
        users: session.bootstrap.users ?? [nextUser]
      }));

      return nextUser;
    },
    async signUp(name, email, password, role) {
      const session = await registerToBackend(name, email, password, role);
      const bootstrap = await fetchAuthenticatedBootstrap();
      const nextUser = {
        ...session.user,
        role: roleForApp(session.user.role)
      };

      setCurrentUser(nextUser);
      setState(normalizeState({
        ...bootstrap,
        branding: bootstrap.branding ?? session.branding ?? seedState.branding,
        users: bootstrap.users ?? [nextUser]
      }));

      return nextUser;
    },
    async signOut() {
      await signOutFromBackend();
      setCurrentUser(null);
      setState(seedState);
    },
    async resetDemo() {
      if (currentUser) {
        try {
          await refreshBackendState();
        } catch {
          setState(seedState);
        }
        return;
      }

      setState(seedState);
      setCurrentUser(null);
    },
    async updateBranding(branding) {
      if (currentUser) {
        await updateTenantBrandingOnBackend(branding);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        branding,
        auditEvents: [
          createAuditEvent("Admin", "Updated tenant branding", branding.tenantName, branding.tenantId, branding.vendorId),
          ...current.auditEvents
        ]
      }));
    },
    async createCourse(payload) {
      if (currentUser) {
        await createCourseOnBackend(payload);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        courses: [
          {
            id: uid("course"),
            tenantId: current.branding.tenantId,
            vendorId: current.branding.vendorId,
            teacherId: undefined,
            title: payload.title,
            category: payload.category,
            description: payload.description,
            status: "draft",
            price: payload.price,
            enrollmentCount: 0,
            assessmentGateEnabled: true,
            modules: [
              {
                id: uid("module"),
                title: "Getting Started",
                dripDays: 0,
                lessons: []
              }
            ]
          },
          ...current.courses
        ],
        auditEvents: [
          createAuditEvent("Admin", "Created course draft", payload.title, current.branding.tenantId, current.branding.vendorId),
          ...current.auditEvents
        ]
      }));
    },
    async publishCourse(courseId) {
      if (currentUser) {
        await publishCourseOnBackend(courseId);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        courses: current.courses.map((course) =>
          course.id === courseId ? { ...course, status: "published" } : course
        ),
        auditEvents: [
          createAuditEvent("Admin", "Published course", courseId, current.branding.tenantId, current.branding.vendorId),
          ...current.auditEvents
        ]
      }));
    },
    async setCourseAssessmentGate(courseId, enabled) {
      if (currentUser) {
        await setCourseAssessmentGateOnBackend(courseId, enabled);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        courses: current.courses.map((course) =>
          course.id === courseId ? { ...course, assessmentGateEnabled: enabled } : course
        ),
        auditEvents: [
          createAuditEvent(
            "Teacher",
            enabled ? "Enabled assessment gate" : "Disabled assessment gate",
            courseId,
            current.branding.tenantId,
            current.branding.vendorId
          ),
          ...current.auditEvents
        ]
      }));
    },
    async addModule(courseId, title) {
      if (currentUser) {
        await addCourseModuleOnBackend(courseId, title);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        courses: current.courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                modules: [
                  ...course.modules,
                  { id: uid("module"), title, dripDays: course.modules.length * 3, lessons: [] }
                ]
              }
            : course
        )
      }));
    },
    async addLesson(courseId, moduleId, lesson) {
      if (currentUser) {
        const createdLesson = await addCourseLessonOnBackend(courseId, moduleId, lesson);
        await refreshBackendState();
        return createdLesson;
      }

      const createdLesson = {
        id: uid("lesson"),
        title: lesson.title,
        type: lesson.type,
        durationMinutes: lesson.durationMinutes,
        releaseAt: lesson.releaseAt || new Date().toISOString(),
        completedBy: []
      };

      setState((current) => ({
        ...current,
        courses: current.courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                modules: course.modules.map((module) =>
                  module.id === moduleId
                    ? {
                        ...module,
                        lessons: [
                          ...module.lessons,
                          createdLesson
                        ]
                      }
                    : module
                )
              }
            : course
        )
      }));

      return createdLesson;
    },
    async uploadLessonContent(courseId, moduleId, lessonId, file) {
      if (currentUser) {
        await uploadLessonContentOnBackend(courseId, moduleId, lessonId, file);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        courses: current.courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                modules: course.modules.map((module) =>
                  module.id === moduleId
                    ? {
                        ...module,
                        lessons: module.lessons.map((lesson) =>
                          lesson.id === lessonId
                            ? {
                                ...lesson,
                                contentUrl: URL.createObjectURL(file),
                                contentMime: file.type,
                                contentOriginalName: file.name
                              }
                            : lesson
                        )
                      }
                    : module
                )
              }
            : course
        )
      }));
    },
    async markLessonComplete(courseId, lessonId, studentName) {
      if (currentUser) {
        await completeLessonOnBackend(courseId, lessonId);
        await refreshBackendState();
        return;
      }

      const actorName = studentName ?? defaultStudentName(state, currentUser);

      setState((current) => {
        const updatedCourses = current.courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                modules: course.modules.map((module) => ({
                  ...module,
                  lessons: module.lessons.map((lesson) =>
                    lesson.id === lessonId && !lesson.completedBy.includes(actorName)
                      ? { ...lesson, completedBy: [...lesson.completedBy, actorName] }
                      : lesson
                  )
                }))
              }
            : course
        );
        const completedCourse = updatedCourses.find((course) => course.id === courseId);
        const allLessons = completedCourse?.modules.flatMap((module) => module.lessons) ?? [];
        const fullyCompleted =
          allLessons.length > 0 && allLessons.every((lesson) => lesson.completedBy.includes(actorName));
        const hasCertificate = current.certificates.some(
          (certificate) => certificate.courseId === courseId && certificate.studentName === actorName && !certificate.revoked
        );

        return {
          ...current,
          courses: updatedCourses,
          certificates:
            fullyCompleted && completedCourse && !hasCertificate
              ? [
                  {
                    id: uid("certificate"),
                    tenantId: current.branding.tenantId,
                    vendorId: current.branding.vendorId,
                    studentName: actorName,
                    courseId,
                    courseTitle: completedCourse.title,
                    certificateNumber: buildLocalCertificateNumber(courseId, actorName),
                    issuedAt: new Date().toISOString(),
                    verificationCode: `BETO-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
                    status: "active",
                    revoked: false
                  },
                  ...current.certificates
                ]
              : current.certificates
        };
      });
    },
    async enrollInCourse(courseId, studentName) {
      if (currentUser) {
        await createEnrollmentOnBackend({
          courseId,
          studentId: currentUser.role === "student" ? currentUser.id : undefined
        });
        await refreshBackendState();
        return;
      }

      setState((current) => {
        const course = getCourseById(current.courses, courseId);
        if (!course) {
          return current;
        }

        const actorName = studentName ?? defaultStudentName(current, currentUser);
        const actorId = current.users.find((user) => user.role === "student" && user.name === actorName)?.id ?? uid("student");
        const alreadyEnrolled = current.enrollments.some((enrollment) =>
          enrollment.courseId === courseId &&
          enrollment.status !== "cancelled" &&
          (enrollment.studentId === actorId || enrollment.studentName === actorName)
        );

        if (alreadyEnrolled) {
          return current;
        }

        return {
          ...current,
          enrollments: [
            {
              id: uid("enroll"),
              tenantId: current.branding.tenantId,
              vendorId: current.branding.vendorId,
              courseId,
              courseTitle: course.title,
              studentId: actorId,
              studentName: actorName,
              status: "active",
              progressPercentage: 0,
              enrolledAt: new Date().toISOString(),
              completedAt: null
            },
            ...current.enrollments
          ],
          wishlists: current.wishlists.filter((wishlist) =>
            wishlist.courseId !== courseId ||
            (wishlist.studentId !== actorId && wishlist.studentName !== actorName)
          ),
          courses: current.courses.map((item) =>
            item.id === courseId
              ? { ...item, enrollmentCount: item.enrollmentCount + 1 }
              : item
          ),
          notifications: [
            {
              id: uid("notice"),
              tenantId: current.branding.tenantId,
              vendorId: current.branding.vendorId,
              audience: "Student",
              type: "system",
              message: `${actorName} enrolled in "${course.title}".`,
              createdAt: new Date().toISOString()
            },
            ...current.notifications
          ],
          auditEvents: [
            createAuditEvent("Student", "Enrolled in course", course.title, current.branding.tenantId, current.branding.vendorId),
            ...current.auditEvents
          ]
        };
      });
    },
    async addToWishlist(courseId) {
      if (currentUser) {
        await addToWishlistOnBackend(courseId);
        await refreshBackendState();
        return;
      }

      setState((current) => {
        const course = getCourseById(current.courses, courseId);
        if (!course) {
          return current;
        }

        const actorName = defaultStudentName(current, currentUser);
        const actorId = current.users.find((user) => user.role === "student" && user.name === actorName)?.id ?? uid("student");
        const alreadyWishlisted = current.wishlists.some(
          (wishlist) => wishlist.courseId === courseId && wishlist.studentId === actorId
        );

        if (alreadyWishlisted) {
          return current;
        }

        return {
          ...current,
          wishlists: [
            {
              id: uid("wishlist"),
              tenantId: current.branding.tenantId,
              vendorId: current.branding.vendorId,
              courseId,
              courseTitle: course.title,
              studentId: actorId,
              studentName: actorName,
              addedAt: new Date().toISOString()
            },
            ...current.wishlists
          ]
        };
      });
    },
    async removeFromWishlist(courseId) {
      if (currentUser) {
        await removeFromWishlistOnBackend(courseId);
        await refreshBackendState();
        return;
      }

      setState((current) => {
        const actorName = defaultStudentName(current, currentUser);
        const actorId = current.users.find((user) => user.role === "student" && user.name === actorName)?.id;

        return {
          ...current,
          wishlists: current.wishlists.filter((wishlist) =>
            wishlist.courseId !== courseId ||
            (actorId ? wishlist.studentId !== actorId : wishlist.studentName !== actorName)
          )
        };
      });
    },
    async createAssessmentDraft(payload) {
      if (currentUser) {
        await generateTeacherAssessmentDraft({
          courseId: payload.courseId,
          title: payload.title,
          type: payload.type,
          count: payload.count,
          sourceText: payload.sourceText,
          fallbackBankId: payload.usedFallbackBank ? payload.fallbackBankId : undefined
        });
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        assessments: [
          {
            id: uid("assessment"),
            tenantId: current.branding.tenantId,
            vendorId: current.branding.vendorId,
            courseId: payload.courseId,
            title: payload.title,
            type: payload.type,
            status: "draft",
            generatedFrom: payload.generatedFromLabel ?? payload.sourceText.slice(0, 120),
            questionCount: payload.count,
            questions: generateAiQuestions(payload.sourceText, payload.type, payload.count),
            rubricKeywords: payload.sourceText
              .split(/\s+/)
              .filter((word) => word.length > 4)
              .slice(0, 3),
            teacherReviewed: false
          },
          ...current.assessments
        ],
        notifications: [
          {
            id: uid("notice"),
            tenantId: current.branding.tenantId,
            vendorId: current.branding.vendorId,
            audience: "Teacher",
            type: "assessment",
            message: payload.usedFallbackBank
              ? `${payload.count} fallback-bank ${payload.type} questions are ready for review.`
              : `${payload.count} AI-generated ${payload.type} questions are ready for review.`,
            createdAt: new Date().toISOString()
          },
          ...current.notifications
        ]
      }));
    },
    async publishAssessment(assessmentId) {
      if (currentUser) {
        await publishTeacherAssessment(assessmentId);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        assessments: current.assessments.map((assessment) =>
          assessment.id === assessmentId
            ? { ...assessment, status: "published", teacherReviewed: true }
            : assessment
        ),
        auditEvents: [
          createAuditEvent("Teacher", "Published assessment", assessmentId, current.branding.tenantId, current.branding.vendorId),
          ...current.auditEvents
        ]
      }));
    },
    async submitAssessment(assessmentId, studentName, answerText) {
      if (currentUser) {
        const response = await submitAssessmentOnBackend(assessmentId, answerText);
        await refreshBackendState();
        return response.submission
          ? {
              score: response.submission.score,
              passed: response.submission.passed,
              feedback: response.submission.feedback,
              status: response.submission.status
            }
          : null;
      }

      let localResult: AssessmentSubmissionResult | null = null;

      setState((current) => {
        const assessment = current.assessments.find((item) => item.id === assessmentId);
        if (!assessment) {
          return current;
        }

        const evaluation =
          assessment.type === "Essay" || assessment.type === "Short Answer"
            ? evaluateEssay(answerText, assessment.rubricKeywords)
            : {
                score: Math.max(55, Math.min(100, 60 + answerText.trim().length % 35)),
                passed: answerText.trim().length > 8,
                feedback:
                  "Auto-graded demo submission recorded. Review the answer detail against the expected response."
              };

        localResult = {
          score: evaluation.score,
          passed: evaluation.passed,
          feedback: evaluation.feedback,
          status: assessment.type === "Essay" || assessment.type === "Short Answer" ? "pending_review" : "graded"
        };

        return {
          ...current,
          submissions: [
            {
              id: uid("submission"),
              assessmentId,
              studentName,
              answerText,
              score: evaluation.score,
              feedback: evaluation.feedback,
              passed: evaluation.passed,
              submittedAt: new Date().toISOString()
            },
            ...current.submissions
          ],
          notifications: [
            {
              id: uid("notice"),
              tenantId: current.branding.tenantId,
              vendorId: current.branding.vendorId,
              audience: "Student",
              type: "assessment",
              message: `${studentName} submitted ${assessment.title} and received ${evaluation.score}%.`,
              createdAt: new Date().toISOString()
            },
            ...current.notifications
          ]
        };
      });

      return localResult;
    },
    async scheduleLiveClass(payload) {
      const normalizedPayload = normalizeSchedulePayload(payload);

      if (currentUser) {
        await createLiveClassOnBackend(normalizedPayload);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        liveClasses: [
          {
            id: uid("live"),
            tenantId: current.branding.tenantId,
            vendorId: current.branding.vendorId,
            title: normalizedPayload.title,
            courseId: normalizedPayload.courseId,
            startAt: normalizedPayload.startAt,
            date: normalizedPayload.date,
            startTime: normalizedPayload.startTime,
            endTime: normalizedPayload.endTime,
            durationMinutes: normalizedPayload.durationMinutes,
            participantLimit: planMatrix[current.billing.plan].liveLimit || 100,
            provider: "Jitsi",
            meetingUrl: buildLocalMeetingUrl(normalizedPayload.title),
            recordingUrl: null,
            reminder24h: true,
            reminder1h: true,
            status: "scheduled"
          },
          ...current.liveClasses
        ],
        notifications: [
          {
            id: uid("notice"),
            tenantId: current.branding.tenantId,
            vendorId: current.branding.vendorId,
            audience: "All",
            type: "live-class",
            message: `${normalizedPayload.title} was scheduled with automated 24h and 1h reminders.`,
            createdAt: new Date().toISOString()
          },
          ...current.notifications
        ]
      }));
    },
    async extractNoteText(file) {
      if (currentUser) {
        const result = await uploadTeacherNote(file);
        return result.extractedText ?? "";
      }
      return readNoteFile(file);
    },
    async setLiveClassStatus(classId, status) {
      if (currentUser) {
        await updateLiveClassStatusOnBackend(classId, status);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        liveClasses: current.liveClasses.map((item) =>
          item.id === classId
            ? {
                ...item,
                status,
                recordingUrl:
                  status === "recorded"
                    ? item.recordingUrl ?? item.meetingUrl ?? buildLocalMeetingUrl(item.title)
                    : item.recordingUrl ?? null
              }
            : item
        )
      }));
    },
    async issueCertificate(studentName, courseId) {
      if (currentUser) {
        const matchedUser = state.users.find((user) => user.name === studentName);

        if (!matchedUser) {
          throw new Error("Selected learner could not be matched to a backend user.");
        }

        await issueCertificateOnBackend(matchedUser.id, courseId);
        await refreshBackendState();
        return;
      }

      setState((current) => {
        const course = getCourseById(current.courses, courseId);
        if (!course) {
          return current;
        }

        return {
          ...current,
          certificates: [
            {
              id: uid("certificate"),
              tenantId: current.branding.tenantId,
              vendorId: current.branding.vendorId,
              studentName,
              courseId,
              courseTitle: course.title,
              certificateNumber: buildLocalCertificateNumber(courseId, studentName),
              issuedAt: new Date().toISOString(),
              verificationCode: `CERT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
              status: "active",
              revoked: false
            },
            ...current.certificates
          ],
          auditEvents: [
            createAuditEvent("Admin", "Issued certificate", `${studentName} - ${course.title}`, current.branding.tenantId, current.branding.vendorId),
            ...current.auditEvents
          ]
        };
      });
    },
    async revokeCertificate(certificateId) {
      if (currentUser) {
        await revokeCertificateOnBackend(certificateId);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        certificates: current.certificates.map((certificate) =>
          certificate.id === certificateId ? { ...certificate, revoked: true } : certificate
        )
      }));
    },
    async updatePlan(plan) {
      if (currentUser) {
        await updateBillingOnBackend(plan, state.billing.activeStudents);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        billing: {
          ...current.billing,
          plan,
          monthlyPrice: planMatrix[plan].price,
          seatLimit: planMatrix[plan].seatLimit,
          overagePerSeat: planMatrix[plan].overagePerSeat
        },
        notifications: [
          {
            id: uid("notice"),
            tenantId: current.branding.tenantId,
            vendorId: current.branding.vendorId,
            audience: "Admin",
            type: "billing",
            message: `Subscription moved to ${plan}.`,
            createdAt: new Date().toISOString()
          },
          ...current.notifications
        ]
      }));
    },
    async updateActiveStudents(activeStudents) {
      if (currentUser) {
        await updateBillingOnBackend(state.billing.plan, activeStudents);
        await refreshBackendState();
        return;
      }

      setState((current) => ({
        ...current,
        billing: { ...current.billing, activeStudents },
        notifications: activeStudents >= current.billing.seatLimit
          ? [
              {
                id: uid("notice"),
                tenantId: current.branding.tenantId,
                vendorId: current.branding.vendorId,
                audience: "Admin",
                type: "billing",
                message: `Seat utilization reached ${activeStudents}/${current.billing.seatLimit}. Overage charges now apply.`,
                createdAt: new Date().toISOString()
              },
              ...current.notifications
            ]
          : current.notifications
      }));
    },
    async sendComplianceReminders(courseId) {
      if (currentUser) {
        const recordIds = state.complianceRecords
          .filter((record) => record.courseId === courseId || courseId === "")
          .map((record) => record.id);

        await sendComplianceRemindersOnBackend(recordIds);
        await refreshBackendState();
        return;
      }

      setState((current) => {
        const course = getCourseById(current.courses, courseId);
        return {
          ...current,
          notifications: [
            {
              id: uid("notice"),
              tenantId: current.branding.tenantId,
              vendorId: current.branding.vendorId,
              audience: "Student",
              type: "compliance",
              message: `Reminder emails queued for incomplete learners in ${course?.title ?? "the selected course"}.`,
              createdAt: new Date().toISOString()
            },
            ...current.notifications
          ],
          auditEvents: [
            createAuditEvent("Admin", "Sent compliance reminders", course?.title ?? courseId, current.branding.tenantId, current.branding.vendorId),
            ...current.auditEvents
          ]
        };
      });
    },
    async sendCustomEmail(to: string, subject: string, body: string) {
      if (currentUser) {
        try {
          const result = await sendEmailOnBackend(to, subject, body);
          if (result.success) {
            alert("Email sent successfully via SMTP backend.");
          } else {
            alert(result.message || "Failed to send email.");
          }
        } catch (error) {
          console.error("Email error:", error);
          alert("Error sending email via SMTP.");
        }
        return;
      }

      // Fallback for mock mode
      console.log("Mock Email Sent:", { to, subject, body });
      alert(`Demo Mode: Email to ${to} simulation successful.`);
    }
  }), [authReady, currentUser, derivedState, state]);

  return <MockLmsContext.Provider value={value}>{children}</MockLmsContext.Provider>;
}

export function useMockLms() {
  const context = useContext(MockLmsContext);
  if (!context) {
    throw new Error("useMockLms must be used inside MockLmsProvider");
  }

  return context;
}
