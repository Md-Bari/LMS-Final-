"use client";

import type {
  Assessment,
  Course,
  FallbackQuestionBankItem,
  Lesson,
  LiveClass,
  MockLmsState,
  TenantBranding,
  UserProfile,
  VendorSummary,
  Wishlist
} from "@/lib/mock-lms";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_LMS_API_URL ??
  "http://127.0.0.1:8000/api";
const TOKEN_STORAGE_KEY = "betopia-auth-token";

type JsonValue = Record<string, unknown>;

type TeacherAssessmentBootstrap = {
  courses: Course[];
  assessments: Assessment[];
  fallbackQuestionBank: FallbackQuestionBankItem[];
};

type CoursesResponse = {
  data?: Course[];
};

type VendorBootstrap = {
  vendor: VendorSummary;
  branding: TenantBranding;
};

type UploadNoteResult = {
  fileName: string;
  size: number;
  mimeType: string;
  status: string;
  preview: string;
  extractedText?: string;
  extractionMethod?: string;
};

type BackendSubmission = {
  id: string;
  assessmentId: string;
  studentName: string;
  answerText: string;
  status?: string;
  score: number;
  feedback: string;
  passed: boolean;
  submittedAt?: string;
};

type BackendAuthResponse = {
  token?: string;
  access_token?: string;
  token_type?: string;
  role?: string;
  tenant_id?: string | number | null;
  user: UserProfile;
  branding: TenantBranding | null;
  vendor?: VendorSummary | null;
  bootstrap?: Partial<MockLmsState> | null;
};

function apiUrl(path: string) {
  const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBaseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBaseUrl}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function normalizeRole(role: unknown): UserProfile["role"] {
  const value = String(role ?? "");

  if (value === "teacher" || value === "student") {
    return value;
  }

  return "admin";
}

function normalizeUser(user: Record<string, unknown>): UserProfile {
  return {
    id: String(user.id ?? ""),
    tenantId: user.tenantId ? String(user.tenantId) : undefined,
    vendorId: user.vendorId ? String(user.vendorId) : undefined,
    name: String(user.name ?? ""),
    role: normalizeRole(user.role),
    email: String(user.email ?? ""),
    department: user.department ? String(user.department) : undefined,
    profileImageUrl: user.profileImageUrl ? String(user.profileImageUrl) : null,
    bio: user.bio ? String(user.bio) : null,
    ratingAverage: user.ratingAverage !== undefined && user.ratingAverage !== null ? Number(user.ratingAverage) : null,
    ratingCount: Number(user.ratingCount ?? 0)
  };
}

function normalizeCourse(course: Record<string, unknown>): Course {
  return {
    id: String(course.id),
    tenantId: course.tenantId ? String(course.tenantId) : undefined,
    vendorId: course.vendorId ? String(course.vendorId) : undefined,
    teacherId: course.teacherId ? String(course.teacherId) : undefined,
    title: String(course.title ?? ""),
    category: String(course.category ?? ""),
    description: String(course.description ?? ""),
    status: (course.status as Course["status"]) ?? "draft",
    price: Number(course.price ?? 0),
    enrollmentCount: Number(course.enrollmentCount ?? 0),
    whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? (course.whatYouWillLearn as string[]) : [],
    requirements: Array.isArray(course.requirements) ? (course.requirements as string[]) : [],
    targetAudience: Array.isArray(course.targetAudience) ? (course.targetAudience as string[]) : [],
    instructor: course.instructor && typeof course.instructor === "object"
      ? {
          id: String((course.instructor as Record<string, unknown>).id ?? ""),
          name: String((course.instructor as Record<string, unknown>).name ?? ""),
          profileImageUrl: (course.instructor as Record<string, unknown>).profileImageUrl
            ? String((course.instructor as Record<string, unknown>).profileImageUrl)
            : null,
          bio: (course.instructor as Record<string, unknown>).bio
            ? String((course.instructor as Record<string, unknown>).bio)
            : null,
          ratingAverage:
            (course.instructor as Record<string, unknown>).ratingAverage !== undefined &&
            (course.instructor as Record<string, unknown>).ratingAverage !== null
              ? Number((course.instructor as Record<string, unknown>).ratingAverage)
              : null,
          ratingCount: Number((course.instructor as Record<string, unknown>).ratingCount ?? 0),
          studentsCount: Number((course.instructor as Record<string, unknown>).studentsCount ?? 0)
        }
      : null,
    modules: Array.isArray(course.modules)
      ? course.modules.map((module) => ({
          id: String((module as Record<string, unknown>).id),
          title: String((module as Record<string, unknown>).title ?? ""),
          dripDays: Number((module as Record<string, unknown>).dripDays ?? 0),
          lessons: Array.isArray((module as Record<string, unknown>).lessons)
            ? ((module as Record<string, unknown>).lessons as Array<Record<string, unknown>>).map((lesson) => ({
                id: String(lesson.id),
                title: String(lesson.title ?? ""),
                type: (lesson.type as Course["modules"][number]["lessons"][number]["type"]) ?? "video",
                contentUrl: lesson.contentUrl ? String(lesson.contentUrl) : null,
                contentMime: lesson.contentMime ? String(lesson.contentMime) : null,
                contentOriginalName: lesson.contentOriginalName ? String(lesson.contentOriginalName) : null,
                durationMinutes: Number(lesson.durationMinutes ?? 0),
                releaseAt: String(lesson.releaseAt ?? ""),
                completedBy: Array.isArray(lesson.completedBy) ? (lesson.completedBy as string[]) : [],
                isCompleted: Boolean(lesson.isCompleted)
              }))
            : []
        }))
      : []
  };
}

function normalizeLesson(lesson: Record<string, unknown>): Lesson {
  return {
    id: String(lesson.id),
    title: String(lesson.title ?? ""),
    type: (lesson.type as Lesson["type"]) ?? "video",
    contentUrl: lesson.contentUrl ? String(lesson.contentUrl) : null,
    contentMime: lesson.contentMime ? String(lesson.contentMime) : null,
    contentOriginalName: lesson.contentOriginalName ? String(lesson.contentOriginalName) : null,
    durationMinutes: Number(lesson.durationMinutes ?? 0),
    releaseAt: String(lesson.releaseAt ?? ""),
    completedBy: Array.isArray(lesson.completedBy) ? (lesson.completedBy as string[]) : [],
    isCompleted: Boolean(lesson.isCompleted)
  };
}

function normalizeAssessment(assessment: Record<string, unknown>): Assessment {
  return {
    id: String(assessment.id),
    tenantId: assessment.tenantId ? String(assessment.tenantId) : undefined,
    vendorId: assessment.vendorId ? String(assessment.vendorId) : undefined,
    courseId: String(assessment.courseId),
    title: String(assessment.title ?? ""),
    type: (assessment.type as Assessment["type"]) ?? "MCQ",
    status: (assessment.status as Assessment["status"]) ?? "draft",
    generatedFrom: String(assessment.generatedFrom ?? ""),
    questionCount: Number(assessment.questionCount ?? 0),
    questions: Array.isArray(assessment.questions)
      ? (assessment.questions as Array<Record<string, unknown>>).map((question) => ({
          id: String(question.id),
          prompt: String(question.prompt ?? ""),
          options: Array.isArray(question.options) ? (question.options as string[]) : [],
          answer: String(question.answer ?? "")
        }))
      : [],
    rubricKeywords: Array.isArray(assessment.rubricKeywords) ? (assessment.rubricKeywords as string[]) : [],
    teacherReviewed: Boolean(assessment.teacherReviewed)
  };
}

function normalizeSubmission(submission: Record<string, unknown>): BackendSubmission {
  return {
    id: String(submission.id ?? ""),
    assessmentId: String(submission.assessmentId ?? ""),
    studentName: String(submission.studentName ?? ""),
    answerText: String(submission.answerText ?? ""),
    status: submission.status ? String(submission.status) : undefined,
    score: Number(submission.score ?? 0),
    feedback: String(submission.feedback ?? ""),
    passed: Boolean(submission.passed),
    submittedAt: submission.submittedAt ? String(submission.submittedAt) : undefined
  };
}

function normalizeLiveClass(liveClass: Record<string, unknown>): LiveClass {
  const startAt = String(liveClass.startAt ?? liveClass.scheduledAt ?? "");
  const normalizedStatus =
    String(liveClass.status ?? "scheduled") === "live"
      ? "live"
      : String(liveClass.status ?? "scheduled") === "recorded"
        ? "recorded"
        : "scheduled";
  const meetingType = String(liveClass.meetingType ?? "jitsi") === "external" ? "external" : "jitsi";
  const meetingUrl = liveClass.meetingUrl ? String(liveClass.meetingUrl) : liveClass.meetingLink ? String(liveClass.meetingLink) : undefined;

  return {
    id: String(liveClass.id),
    tenantId: liveClass.tenantId ? String(liveClass.tenantId) : undefined,
    vendorId: liveClass.vendorId ? String(liveClass.vendorId) : undefined,
    batchName: liveClass.batchName ? String(liveClass.batchName) : undefined,
    title: String(liveClass.title ?? ""),
    description: liveClass.description ? String(liveClass.description) : undefined,
    courseId: String(liveClass.courseId ?? ""),
    teacherId: liveClass.teacherId ? String(liveClass.teacherId) : undefined,
    roomSlug: liveClass.roomSlug ? String(liveClass.roomSlug) : undefined,
    date: liveClass.date ? String(liveClass.date) : undefined,
    startTime: liveClass.startTime ? String(liveClass.startTime) : undefined,
    endTime: liveClass.endTime ? String(liveClass.endTime) : undefined,
    startAt,
    endAt: liveClass.endAt ? String(liveClass.endAt) : undefined,
    durationMinutes: Number(liveClass.durationMinutes ?? 0),
    participantLimit: Number(liveClass.participantLimit ?? 0),
    provider: meetingType === "external" ? "External" : "Jitsi",
    meetingType,
    meetingUrl,
    meetingLink: liveClass.meetingLink ? String(liveClass.meetingLink) : meetingUrl,
    recordingUrl: liveClass.recordingUrl ? String(liveClass.recordingUrl) : null,
    reminder24h: Boolean(liveClass.reminder24h),
    reminder1h: Boolean(liveClass.reminder1h),
    reminder24hSent: Boolean(liveClass.reminder24hSent),
    reminder1hSent: Boolean(liveClass.reminder1hSent),
    canJoin: Boolean(liveClass.canJoin),
    joinWindowStartsAt: liveClass.joinWindowStartsAt ? String(liveClass.joinWindowStartsAt) : undefined,
    joinWindowEndsAt: liveClass.joinWindowEndsAt ? String(liveClass.joinWindowEndsAt) : undefined,
    status: normalizedStatus
  };
}

function normalizeFallbackBank(bank: Record<string, unknown>): FallbackQuestionBankItem {
  return {
    id: String(bank.id),
    title: String(bank.title ?? ""),
    category: String(bank.category ?? ""),
    sourceText: String(bank.sourceText ?? bank.source_text ?? ""),
    recommendedTypes: (bank.recommendedTypes ?? bank.recommended_types ?? []) as FallbackQuestionBankItem["recommendedTypes"]
  };
}

function normalizeBranding(branding: Record<string, unknown>): TenantBranding {
  return {
    tenantId: branding.tenantId ? String(branding.tenantId) : undefined,
    vendorId: branding.vendorId ? String(branding.vendorId) : undefined,
    tenantName: String(branding.tenantName ?? branding.vendorName ?? ""),
    vendorName: String(branding.vendorName ?? branding.tenantName ?? ""),
    subdomain: String(branding.subdomain ?? branding.vendorSubdomain ?? ""),
    vendorSubdomain: String(branding.vendorSubdomain ?? branding.subdomain ?? ""),
    city: branding.city ? String(branding.city) : undefined,
    logoText: String(branding.logoText ?? ""),
    primaryColor: String(branding.primaryColor ?? ""),
    accentColor: String(branding.accentColor ?? ""),
    supportEmail: String(branding.supportEmail ?? ""),
    customDomain: String(branding.customDomain ?? ""),
    planType: branding.planType as TenantBranding["planType"],
    status: branding.status ? String(branding.status) : undefined,
    vendorStatus: branding.vendorStatus ? String(branding.vendorStatus) : undefined
  };
}

function normalizeVendor(vendor: Record<string, unknown>): VendorSummary {
  return {
    id: String(vendor.id ?? vendor.vendorId ?? ""),
    tenantId: String(vendor.tenantId ?? vendor.id ?? ""),
    vendorId: String(vendor.vendorId ?? vendor.tenantId ?? vendor.id ?? ""),
    tenantName: String(vendor.tenantName ?? vendor.vendorName ?? ""),
    vendorName: String(vendor.vendorName ?? vendor.tenantName ?? ""),
    subdomain: String(vendor.subdomain ?? vendor.vendorSubdomain ?? ""),
    city: String(vendor.city ?? ""),
    planType: (vendor.planType as VendorSummary["planType"]) ?? "Starter",
    status: String(vendor.status ?? vendor.vendorStatus ?? "active"),
    supportEmail: String(vendor.supportEmail ?? ""),
    customDomain: String(vendor.customDomain ?? ""),
    activeUsers: Number(vendor.activeUsers ?? 0),
    publishedCourses: Number(vendor.publishedCourses ?? 0),
    activeStudents: Number(vendor.activeStudents ?? 0)
  };
}

function normalizeState(state: Partial<MockLmsState> | null | undefined): Partial<MockLmsState> {
  if (!state) {
    return {};
  }

  return {
    branding: state.branding ? normalizeBranding(state.branding as unknown as Record<string, unknown>) : undefined,
    users: Array.isArray(state.users) ? state.users.map((user) => normalizeUser(user as unknown as Record<string, unknown>)) : [],
    courses: Array.isArray(state.courses) ? state.courses.map((course) => normalizeCourse(course as unknown as Record<string, unknown>)) : [],
    enrollments: Array.isArray(state.enrollments) ? (state.enrollments as MockLmsState["enrollments"]) : [],
    wishlists: Array.isArray(state.wishlists) ? (state.wishlists as MockLmsState["wishlists"]) : [],
    assessments: Array.isArray(state.assessments)
      ? state.assessments.map((assessment) => normalizeAssessment(assessment as unknown as Record<string, unknown>))
      : [],
    submissions: Array.isArray(state.submissions) ? (state.submissions as MockLmsState["submissions"]) : [],
    liveClasses: Array.isArray(state.liveClasses)
      ? state.liveClasses.map((liveClass) => normalizeLiveClass(liveClass as unknown as Record<string, unknown>))
      : [],
    certificates: Array.isArray(state.certificates) ? (state.certificates as MockLmsState["certificates"]) : [],
    notifications: Array.isArray(state.notifications) ? (state.notifications as MockLmsState["notifications"]) : [],
    auditEvents: Array.isArray(state.auditEvents) ? (state.auditEvents as MockLmsState["auditEvents"]) : [],
    complianceRecords: Array.isArray(state.complianceRecords) ? (state.complianceRecords as MockLmsState["complianceRecords"]) : [],
    invoices: Array.isArray(state.invoices) ? (state.invoices as MockLmsState["invoices"]) : [],
    billing: state.billing as MockLmsState["billing"] | undefined
  };
}

async function parseJsonSafe(response: Response) {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return {};
  }
}

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getStoredToken() {
  if (!storageAvailable()) {
    return null;
  }

  return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string) {
  if (!storageAvailable()) {
    return;
  }

  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  if (!storageAvailable()) {
    return;
  }

  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function apiFetch(path: string, init: RequestInit = {}, retry = true) {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`
      }
    });
  } catch {
    throw new Error(`Could not reach the LMS backend at ${API_BASE_URL}. Check that Laravel is running and CORS allows this frontend origin.`);
  }

  if (response.status === 401 && retry) {
    clearStoredToken();
    throw new Error("Your session expired. Please sign in again.");
  }

  return response;
}

async function unwrapResponse<T>(response: Response): Promise<T> {
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : "Backend request failed.");
  }

  return payload as T;
}

export async function signInToBackend(email: string, password: string) {
  let response: Response;

  try {
    response = await fetch(apiUrl("/api/v1/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });
  } catch {
    throw new Error(`Could not reach the LMS backend at ${API_BASE_URL}. Check that Laravel is running and CORS allows this frontend origin.`);
  }

  const payload = await unwrapResponse<BackendAuthResponse>(response);
  const accessToken = payload.access_token ?? payload.token;

  if (!accessToken) {
    throw new Error("Backend login response is missing access token.");
  }

  storeToken(accessToken);

  return {
    token: accessToken,
    user: normalizeUser(payload.user as unknown as Record<string, unknown>),
    branding: payload.branding ? normalizeBranding(payload.branding as unknown as Record<string, unknown>) : null,
    vendor: payload.vendor ? normalizeVendor(payload.vendor as unknown as Record<string, unknown>) : null,
    bootstrap: normalizeState(payload.bootstrap ?? null)
  };
}

export async function registerToBackend(
  name: string,
  email: string,
  password: string,
  role: string = "student"
) {
  let response: Response;

  try {
    response = await fetch(apiUrl("/api/v1/auth/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ name, email, password, role })
    });
  } catch {
    throw new Error(`Could not reach the LMS backend at ${API_BASE_URL}. Check that Laravel is running and CORS allows this frontend origin.`);
  }

  const payload = await unwrapResponse<BackendAuthResponse>(response);
  const accessToken = payload.access_token ?? payload.token;

  if (!accessToken) {
    throw new Error("Backend registration response is missing access token.");
  }

  storeToken(accessToken);

  return {
    token: accessToken,
    user: normalizeUser(payload.user as unknown as Record<string, unknown>),
    branding: payload.branding ? normalizeBranding(payload.branding as unknown as Record<string, unknown>) : null,
    vendor: payload.vendor ? normalizeVendor(payload.vendor as unknown as Record<string, unknown>) : null,
    bootstrap: normalizeState(payload.bootstrap ?? null)
  };
}

export async function fetchAuthenticatedProfile() {
  const response = await apiFetch("/api/v1/auth/me");
  const payload = await unwrapResponse<{ data: { user: UserProfile; branding?: TenantBranding; vendor?: VendorSummary } }>(response);

  return {
    user: normalizeUser(payload.data.user as unknown as Record<string, unknown>),
    branding: payload.data.branding ? normalizeBranding(payload.data.branding as unknown as Record<string, unknown>) : null,
    vendor: payload.data.vendor ? normalizeVendor(payload.data.vendor as unknown as Record<string, unknown>) : null
  };
}

export async function fetchAuthenticatedBootstrap() {
  const response = await apiFetch("/api/v1/bootstrap");
  const payload = await unwrapResponse<{ data: Partial<MockLmsState> }>(response);
  return normalizeState(payload.data);
}

export async function signOutFromBackend() {
  try {
    await apiFetch("/api/v1/auth/logout", {
      method: "POST"
    }, false);
  } catch {
    // Ignore logout network issues and clear the local token anyway.
  } finally {
    clearStoredToken();
  }
}

export async function fetchTeacherAssessmentBootstrap(): Promise<TeacherAssessmentBootstrap> {
  const [coursesResponse, assessmentsResponse] = await Promise.all([
    apiFetch("/api/v1/courses"),
    apiFetch("/api/v1/assessments")
  ]);

  const coursesPayload = await unwrapResponse<{ data: Course[] }>(coursesResponse);
  const assessmentsPayload = await unwrapResponse<{
    data: Assessment[];
    fallbackQuestionBank?: FallbackQuestionBankItem[];
  }>(assessmentsResponse);

  return {
    courses: (coursesPayload.data ?? []).map((course) => normalizeCourse(course as unknown as Record<string, unknown>)),
    assessments: (assessmentsPayload.data ?? []).map((assessment) => normalizeAssessment(assessment as unknown as Record<string, unknown>)),
    fallbackQuestionBank: (assessmentsPayload.fallbackQuestionBank ?? []).map((bank) => normalizeFallbackBank(bank as unknown as Record<string, unknown>))
  };
}

export async function fetchVendorDirectory() {
  const response = await apiFetch("/api/v1/vendors");
  const payload = await unwrapResponse<{ data: VendorSummary[] }>(response);

  return (payload.data ?? []).map((vendor) => normalizeVendor(vendor as unknown as Record<string, unknown>));
}

export async function fetchCurrentVendor(): Promise<VendorBootstrap> {
  const response = await apiFetch("/api/v1/vendors/current");
  const payload = await unwrapResponse<{ data: VendorSummary; branding: TenantBranding }>(response);

  return {
    vendor: normalizeVendor(payload.data as unknown as Record<string, unknown>),
    branding: normalizeBranding(payload.branding as unknown as Record<string, unknown>)
  };
}

export async function uploadTeacherNote(file: File): Promise<UploadNoteResult> {
  const formData = new FormData();
  formData.append("note", file);

  const response = await apiFetch("/api/v1/teacher/notes/upload", {
    method: "POST",
    body: formData
  });

  const payload = await unwrapResponse<{ data: UploadNoteResult }>(response);
  return payload.data;
}

export async function generateTeacherAssessmentDraft(payload: {
  courseId: string;
  title: string;
  type: string;
  count: number;
  sourceText?: string;
  fallbackBankId?: string;
}) {
  const response = await apiFetch("/api/v1/teacher/assessments/generate", {
    method: "POST",
    body: JSON.stringify({
      course_id: Number(payload.courseId),
      title: payload.title,
      type: payload.type,
      question_count: payload.count,
      source_text: payload.sourceText ?? "",
      fallback_bank_id: payload.fallbackBankId ?? null
    })
  });

  const data = await unwrapResponse<{ data: Assessment }>(response);
  return normalizeAssessment(data.data as unknown as Record<string, unknown>);
}

export async function publishTeacherAssessment(assessmentId: string) {
  const response = await apiFetch(`/api/v1/assessments/${assessmentId}/publish`, {
    method: "POST"
  });

  const data = await unwrapResponse<{ data: Assessment }>(response);
  return normalizeAssessment(data.data as unknown as Record<string, unknown>);
}

export async function updateTenantBrandingOnBackend(branding: TenantBranding) {
  const response = await apiFetch("/api/v1/tenant/branding", {
    method: "PUT",
    body: JSON.stringify(branding)
  });

  const payload = await unwrapResponse<{ data: TenantBranding }>(response);
  return normalizeBranding(payload.data as unknown as Record<string, unknown>);
}

export async function createCourseOnBackend(payload: {
  title: string;
  category: string;
  description: string;
  price: number;
}) {
  const response = await apiFetch("/api/v1/courses", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      category: payload.category,
      description: payload.description,
      price: payload.price
    })
  });

  const data = await unwrapResponse<{ data: Course }>(response);
  return normalizeCourse(data.data as unknown as Record<string, unknown>);
}

export async function fetchCoursesFromBackend(search?: string) {
  const params = new URLSearchParams();
  const normalizedSearch = search?.trim() ?? "";

  if (normalizedSearch.length > 0) {
    params.set("search", normalizedSearch);
  }

  params.set("per_page", "100");

  const query = params.toString();
  const response = await apiFetch(`/api/v1/courses${query ? `?${query}` : ""}`);
  const payload = await unwrapResponse<CoursesResponse>(response);

  return (payload.data ?? []).map((course) => normalizeCourse(course as unknown as Record<string, unknown>));
}

export async function fetchMyCoursesFromBackend(): Promise<{ courses: ReturnType<typeof normalizeCourse>[]; assessments: ReturnType<typeof normalizeAssessment>[] }> {
  const response = await apiFetch("/api/v1/student/my-courses");
  const payload = await unwrapResponse<{ data: unknown[]; assessments: unknown[] }>(response);
  return {
    courses: (payload.data ?? []).map((c) => normalizeCourse(c as Record<string, unknown>)),
    assessments: (payload.assessments ?? []).map((a) => normalizeAssessment(a as Record<string, unknown>)),
  };
}

export async function fetchStudentLiveClassesFromBackend(): Promise<LiveClass[]> {
  const response = await apiFetch("/api/v1/student/live-classes");
  const payload = await unwrapResponse<{ data: unknown[] }>(response);
  return (payload.data ?? []).map((lc) => normalizeLiveClass(lc as Record<string, unknown>));
}

type StudentSubmission = {
  id: string;
  assessmentId: string;
  assessmentTitle: string | null;
  assessmentType: string | null;
  courseId: string | null;
  courseTitle: string | null;
  answerText: string;
  status: string | null;
  score: number;
  passingMark: number;
  feedback: string | null;
  aiFeedback: string | null;
  teacherFeedback: string | null;
  passed: boolean;
  submittedAt: string | null;
};

export async function fetchMySubmissionsFromBackend(): Promise<StudentSubmission[]> {
  const response = await apiFetch("/api/v1/student/my-submissions");
  const payload = await unwrapResponse<{ data: StudentSubmission[] }>(response);
  return payload.data ?? [];
}


export async function fetchPublicCoursesFromBackend(search?: string) {
  const params = new URLSearchParams();
  const normalizedSearch = search?.trim() ?? "";

  if (normalizedSearch.length > 0) {
    params.set("search", normalizedSearch);
  }

  params.set("per_page", "100");

  const query = params.toString();
  let response: Response;

  try {
    response = await fetch(apiUrl(`/api/v1/public/courses${query ? `?${query}` : ""}`), {
      headers: {
        Accept: "application/json"
      }
    });
  } catch {
    throw new Error(`Could not reach the LMS backend at ${API_BASE_URL}. Check that Laravel is running and CORS allows this frontend origin.`);
  }

  const payload = await unwrapResponse<CoursesResponse>(response);
  return (payload.data ?? []).map((course) => normalizeCourse(course as unknown as Record<string, unknown>));
}

export async function publishCourseOnBackend(courseId: string) {
  const response = await apiFetch(`/api/v1/courses/${courseId}/publish`, {
    method: "POST"
  });

  const data = await unwrapResponse<{ data: Course }>(response);
  return normalizeCourse(data.data as unknown as Record<string, unknown>);
}

export async function addCourseModuleOnBackend(courseId: string, title: string, dripDays = 0) {
  const response = await apiFetch(`/api/v1/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify({
      title,
      drip_days: dripDays
    })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function addCourseLessonOnBackend(
  courseId: string,
  moduleId: string,
  payload: {
    title: string;
    type: "video" | "document" | "quiz" | "assignment" | "live";
    durationMinutes: number;
    releaseAt?: string;
  }
) {
  const response = await apiFetch(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      type: payload.type,
      duration_minutes: payload.durationMinutes,
      release_at: payload.releaseAt
    })
  });

  const data = await unwrapResponse<{ data: unknown }>(response);
  return normalizeLesson(data.data as Record<string, unknown>);
}

export async function uploadLessonContentOnBackend(
  courseId: string,
  moduleId: string,
  lessonId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("content", file);

  const response = await apiFetch(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content`, {
    method: "POST",
    body: formData
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function completeLessonOnBackend(courseId: string, lessonId: string) {
  const response = await apiFetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: "POST"
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function createEnrollmentOnBackend(payload: { courseId: string; studentId?: string }) {
  const response = await apiFetch("/api/v1/enrollments", {
    method: "POST",
    body: JSON.stringify({
      course_id: Number(payload.courseId),
      student_id: payload.studentId ? Number(payload.studentId) : undefined
    })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function addToWishlistOnBackend(courseId: string): Promise<Wishlist> {
  const response = await apiFetch("/api/v1/wishlists", {
    method: "POST",
    body: JSON.stringify({
      course_id: Number(courseId)
    })
  });

  const payload = await unwrapResponse<{ data: Wishlist }>(response);
  return payload.data;
}

export async function removeFromWishlistOnBackend(courseId: string) {
  const response = await apiFetch(`/api/v1/wishlists/${courseId}`, {
    method: "DELETE"
  });

  return unwrapResponse<{ message: string }>(response);
}

export async function createLiveClassOnBackend(payload: {
  title: string;
  courseId: string;
  batchName?: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType?: "jitsi" | "external";
  meetingLink?: string;
  durationMinutes: number;
  status?: "scheduled" | "live" | "completed" | "cancelled";
}) {
  const response = await apiFetch("/api/v1/live-classes", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      course_id: Number(payload.courseId),
      batch_name: payload.batchName ?? null,
      description: payload.description ?? null,
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      meeting_type: payload.meetingType ?? "jitsi",
      meeting_link: payload.meetingLink ?? null,
      duration_minutes: payload.durationMinutes
      ,status: payload.status ?? "scheduled"
    })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function updateLiveClassStatusOnBackend(
  liveClassId: string,
  status: "scheduled" | "live" | "recorded"
) {
  const response = await apiFetch(`/api/v1/live-classes/${liveClassId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function submitAssessmentOnBackend(assessmentId: string, answerText: string) {
  const response = await apiFetch(`/api/v1/assessments/${assessmentId}/submit`, {
    method: "POST",
    body: JSON.stringify({
      answer_text: answerText
    })
  });

  const payload = await unwrapResponse<{ data: { submission: unknown } }>(response);
  const normalized = normalizeSubmission(payload.data.submission as Record<string, unknown>);

  return {
    submission: normalized
  };
}

export async function issueCertificateOnBackend(userId: string, courseId: string) {
  const response = await apiFetch("/api/v1/certificates", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      course_id: Number(courseId)
    })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function revokeCertificateOnBackend(certificateId: string) {
  const response = await apiFetch(`/api/v1/certificates/${certificateId}/revoke`, {
    method: "POST"
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function updateBillingOnBackend(plan: string, activeStudents?: number) {
  const response = await apiFetch("/api/v1/billing", {
    method: "PATCH",
    body: JSON.stringify({
      plan,
      active_students: activeStudents
    })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function sendComplianceRemindersOnBackend(recordIds?: string[]) {
  const response = await apiFetch("/api/v1/reports/compliance/reminders", {
    method: "POST",
    body: JSON.stringify({
      record_ids: recordIds?.map((id) => Number(id))
    })
  });

  return unwrapResponse<{ data: unknown }>(response);
}

export async function downloadAuthenticatedFile(path: string, fallbackFilename: string) {
  const response = await apiFetch(path, {
    method: "GET"
  });

  if (!response.ok) {
    const payload = await parseJsonSafe(response);
    throw new Error(typeof payload.message === "string" ? payload.message : "File download failed.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const matchedFilename = disposition.match(/filename="?([^"]+)"?/i)?.[1];
  const filename = matchedFilename || fallbackFilename;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
