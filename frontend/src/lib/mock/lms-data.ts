export type Role = "admin" | "teacher" | "student";
export type PlanTier = "Starter" | "Growth" | "Professional";
export type LessonType = "video" | "document" | "quiz" | "assignment" | "live";
export type AssessmentType = "MCQ" | "True/False" | "Short Answer" | "Essay";
export type FallbackQuestionBankItem = {
  id: string;
  title: string;
  category: string;
  sourceText: string;
  recommendedTypes: AssessmentType[];
};

export type TenantBranding = {
  tenantId?: string;
  vendorId?: string;
  tenantName: string;
  vendorName?: string;
  subdomain: string;
  vendorSubdomain?: string;
  city?: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  customDomain: string;
  planType?: PlanTier;
  status?: string;
  vendorStatus?: string;
};

export type UserProfile = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  name: string;
  role: Role;
  email: string;
  department?: string;
};

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  contentUrl?: string | null;
  contentMime?: string | null;
  contentOriginalName?: string | null;
  durationMinutes: number;
  releaseAt: string;
  completedBy: string[];
  isCompleted?: boolean;
};

export type CourseModule = {
  id: string;
  title: string;
  dripDays: number;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  teacherId?: string;
  title: string;
  category: string;
  description: string;
  status: "draft" | "published";
  price: number;
  enrollmentCount: number;
  modules: CourseModule[];
};

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type Assessment = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  courseId: string;
  title: string;
  type: AssessmentType;
  status: "draft" | "published";
  generatedFrom: string;
  questionCount: number;
  questions: AssessmentQuestion[];
  rubricKeywords: string[];
  teacherReviewed: boolean;
};

export type Submission = {
  id: string;
  assessmentId: string;
  studentName: string;
  answerText: string;
  score: number;
  feedback: string;
  passed: boolean;
  submittedAt: string;
};

export type LiveClass = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  title: string;
  courseId: string;
  startAt: string;
  durationMinutes: number;
  participantLimit: number;
  provider: "Jitsi";
  meetingUrl?: string;
  recordingUrl?: string | null;
  reminder24h: boolean;
  reminder1h: boolean;
  status: "scheduled" | "live" | "recorded";
};

export type Certificate = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  certificateNumber?: string;
  issuedAt: string;
  verificationCode: string;
  status?: string;
  revoked: boolean;
};

export type NotificationItem = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  audience: "Admin" | "Teacher" | "Student" | "All";
  type: "billing" | "live-class" | "compliance" | "assessment" | "system";
  message: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
  timestamp: string;
};

export type ComplianceRecord = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  employeeName: string;
  department: string;
  roleTitle: string;
  courseId: string;
  courseTitle: string;
  completionPercent: number;
  certified: boolean;
};

export type BillingState = {
  tenantId?: string;
  vendorId?: string;
  plan: PlanTier;
  activeStudents: number;
  monthlyPrice: number;
  seatLimit: number;
  overagePerSeat: number;
};

export type Enrollment = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  courseId: string;
  courseTitle?: string;
  studentId: string;
  studentName?: string;
  status: "active" | "completed" | "pending" | "cancelled";
  progressPercentage: number;
  enrolledAt?: string;
  completedAt?: string | null;
};

export type Invoice = {
  id: string;
  tenantId?: string;
  vendorId?: string;
  billingProfileId?: string;
  invoiceNumber: string;
  amountBdt: number;
  billingPeriod: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string | null;
  paymentStatus: string;
};

export type VendorSummary = {
  id: string;
  vendorId: string;
  tenantId: string;
  vendorName: string;
  tenantName: string;
  subdomain: string;
  city: string;
  planType: PlanTier;
  status: string;
  supportEmail: string;
  customDomain: string;
  activeUsers: number;
  publishedCourses: number;
  activeStudents: number;
};

export type MockLmsState = {
  branding: TenantBranding;
  users: UserProfile[];
  courses: Course[];
  enrollments: Enrollment[];
  assessments: Assessment[];
  submissions: Submission[];
  liveClasses: LiveClass[];
  certificates: Certificate[];
  notifications: NotificationItem[];
  auditEvents: AuditEvent[];
  complianceRecords: ComplianceRecord[];
  invoices: Invoice[];
  billing: BillingState;
};

export const backendReadyEndpoints = {
  noteUpload: "/api/teacher/notes/upload",
  aiAssessmentGenerate: "/api/teacher/assessments/generate",
  fallbackQuestionBank: "/api/teacher/question-bank/fallback"
};

export const fallbackQuestionBank: FallbackQuestionBankItem[] = [
  {
    id: "fallback-compliance",
    title: "Compliance Foundations Bank",
    category: "Compliance",
    sourceText:
      "Compliance audit evidence policy remediation reporting controls certificate verification employee completion matrix department filters export csv pdf reminder workflow.",
    recommendedTypes: ["MCQ", "True/False", "Short Answer"]
  },
  {
    id: "fallback-ai",
    title: "AI Assessment Bank",
    category: "Teaching",
    sourceText:
      "AI rubric evaluation teacher review question generation uploaded notes fallback bank essay feedback learning objectives answer quality publishing workflow.",
    recommendedTypes: ["MCQ", "Essay", "Short Answer"]
  },
  {
    id: "fallback-live",
    title: "Live Classroom Bank",
    category: "Live Learning",
    sourceText:
      "Live classroom Jitsi reminders scheduled session recording attendance participant limit host workflow student notification one hour twenty four hours.",
    recommendedTypes: ["MCQ", "True/False"]
  }
];

export const planMatrix: Record<
  PlanTier,
  { price: number; seatLimit: number; overagePerSeat: number; liveLimit: number; whiteLabel: boolean }
> = {
  Starter: { price: 49, seatLimit: 100, overagePerSeat: 5, liveLimit: 0, whiteLabel: false },
  Growth: { price: 149, seatLimit: 500, overagePerSeat: 3, liveLimit: 100, whiteLabel: false },
  Professional: { price: 349, seatLimit: 2000, overagePerSeat: 2, liveLimit: 500, whiteLabel: true }
};

const today = new Date("2026-04-24T08:00:00.000Z");

function isoDate(offsetDays = 0, hour = 9) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function seatUtilizationPercent(billing: BillingState) {
  return Math.min(100, Math.round((billing.activeStudents / billing.seatLimit) * 100));
}

export function overageAmount(billing: BillingState) {
  const extraSeats = Math.max(0, billing.activeStudents - billing.seatLimit);
  return extraSeats * billing.overagePerSeat;
}

export function generateCsv(records: ComplianceRecord[]) {
  const header = "Employee,Department,Role,Course,Completion %,Certified";
  const rows = records.map((record) =>
    [
      record.employeeName,
      record.department,
      record.roleTitle,
      record.courseTitle,
      String(record.completionPercent),
      record.certified ? "Yes" : "No"
    ]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export function getCourseById(courses: Course[], courseId: string) {
  return courses.find((course) => course.id === courseId);
}

export function generateAiQuestions(sourceText: string, type: AssessmentType, count: number) {
  const words = Array.from(
    new Set(
      sourceText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 4)
    )
  ).slice(0, 8);

  const fallbackWords = words.length ? words : ["learning", "assessment", "tenant", "certificate"];
  const safeCount = Math.max(1, Math.min(50, count));

  return Array.from({ length: safeCount }, (_, index) => {
    const keyword = fallbackWords[index % fallbackWords.length];

    if (type === "True/False") {
      return {
        id: uid("question"),
        prompt: `True or False: ${keyword} is highlighted as a key topic in the uploaded material.`,
        options: ["True", "False"],
        answer: "True"
      };
    }

    if (type === "Short Answer" || type === "Essay") {
      return {
        id: uid("question"),
        prompt: `Explain how ${keyword} contributes to the learning objective described in the source material.`,
        options: ["Reflect", "Summarize", "Compare", "Apply"],
        answer: keyword
      };
    }

    return {
      id: uid("question"),
      prompt: `Which concept best matches the idea of "${keyword}" in the uploaded notes?`,
      options: [
        `${keyword} planning`,
        `${keyword} governance`,
        `${keyword} optimization`,
        `${keyword} validation`
      ],
      answer: `${keyword} governance`
    };
  });
}

export function evaluateEssay(answerText: string, rubricKeywords: string[]) {
  const normalized = answerText.toLowerCase();
  const keywordHits = rubricKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
  const lengthScore = Math.min(40, Math.round(answerText.trim().length / 8));
  const keywordScore = Math.min(45, keywordHits * 15);
  const clarityScore = answerText.includes(".") ? 15 : 5;
  const score = Math.max(35, Math.min(100, lengthScore + keywordScore + clarityScore));
  const passed = score >= 70;

  const feedback = passed
    ? "The submission addresses the rubric clearly, uses relevant terminology, and demonstrates enough depth to pass."
    : "The response needs more detail tied to the rubric. Mention the key concepts more directly and expand your explanation.";

  return { score, passed, feedback };
}

export const seedState: MockLmsState = {
  branding: {
    tenantId: "tenant-betopia",
    vendorId: "tenant-betopia",
    tenantName: "Smart LMS Platform",
    vendorName: "Smart LMS Platform",
    subdomain: "smart-lms-platform",
    vendorSubdomain: "smart-lms-platform",
    city: "Dhaka",
    logoText: "SL",
    primaryColor: "#6d28d9",
    accentColor: "#16a34a",
    supportEmail: "support@smartlms.local",
    customDomain: "learn.smartlms.local",
    planType: "Growth",
    status: "active",
    vendorStatus: "active"
  },
  users: [
    { id: "user-admin-1", name: "Ayesha Rahman", role: "admin", email: "admin@betopiaacademy.com", department: "Operations" },
    { id: "user-teacher-1", name: "Nafis Hasan", role: "teacher", email: "nafis@betopiaacademy.com", department: "Faculty" },
    { id: "user-student-1", name: "Rafi Khan", role: "student", email: "rafi@student.betopia.com", department: "Product" },
    { id: "user-student-2", name: "Maya Sultana", role: "student", email: "maya@student.betopia.com", department: "Compliance" }
  ],
  courses: [
    {
      id: "course-compliance",
      title: "Compliance Excellence Bootcamp",
      category: "Compliance",
      description: "Audit-ready compliance training with assessments, certificates, and reporting.",
      status: "published",
      price: 299,
      enrollmentCount: 214,
      modules: [
        {
          id: "module-compliance-1",
          title: "Policy Foundations",
          dripDays: 0,
          lessons: [
            {
              id: "lesson-compliance-1",
              title: "Understanding Policy Scope",
              type: "video",
              durationMinutes: 18,
              releaseAt: isoDate(0, 8),
              completedBy: ["Rafi Khan"]
            },
            {
              id: "lesson-compliance-2",
              title: "Compliance Checklist Workbook",
              type: "document",
              durationMinutes: 12,
              releaseAt: isoDate(1, 8),
              completedBy: []
            }
          ]
        },
        {
          id: "module-compliance-2",
          title: "Assessment and Certification",
          dripDays: 3,
          lessons: [
            {
              id: "lesson-compliance-3",
              title: "Certification Assessment",
              type: "quiz",
              durationMinutes: 25,
              releaseAt: isoDate(3, 9),
              completedBy: []
            }
          ]
        }
      ]
    },
    {
      id: "course-ai",
      title: "AI Instructor Studio",
      category: "Teaching",
      description: "Create AI-assisted quizzes, essay rubrics, and faster teaching workflows.",
      status: "published",
      price: 249,
      enrollmentCount: 148,
      modules: [
        {
          id: "module-ai-1",
          title: "AI Lesson Design",
          dripDays: 0,
          lessons: [
            {
              id: "lesson-ai-1",
              title: "Generating Assessments from Notes",
              type: "document",
              durationMinutes: 16,
              releaseAt: isoDate(0, 9),
              completedBy: ["Rafi Khan", "Maya Sultana"]
            },
            {
              id: "lesson-ai-2",
              title: "Essay Rubric Calibration",
              type: "assignment",
              durationMinutes: 22,
              releaseAt: isoDate(2, 9),
              completedBy: ["Rafi Khan"]
            }
          ]
        }
      ]
    },
    {
      id: "course-product",
      title: "Future of Product Teams",
      category: "Leadership",
      description: "A cohort-driven course on modern product strategy, systems, and delivery.",
      status: "draft",
      price: 399,
      enrollmentCount: 62,
      modules: [
        {
          id: "module-product-1",
          title: "Team Systems",
          dripDays: 0,
          lessons: [
            {
              id: "lesson-product-1",
              title: "Operating Cadence",
              type: "video",
              durationMinutes: 20,
              releaseAt: isoDate(0, 10),
              completedBy: []
            }
          ]
        }
      ]
    }
  ],
  enrollments: [],
  assessments: [
    {
      id: "assessment-1",
      courseId: "course-compliance",
      title: "Compliance Readiness Quiz",
      type: "MCQ",
      status: "published",
      generatedFrom: "Policy handbook upload",
      questionCount: 6,
      questions: generateAiQuestions("compliance audit evidence reporting policy remediation controls", "MCQ", 6),
      rubricKeywords: ["compliance", "audit", "policy"],
      teacherReviewed: true
    },
    {
      id: "assessment-2",
      courseId: "course-ai",
      title: "AI Teaching Reflection",
      type: "Essay",
      status: "published",
      generatedFrom: "Teacher note upload",
      questionCount: 1,
      questions: generateAiQuestions("ai assessment rubric feedback learning objective teacher review", "Essay", 1),
      rubricKeywords: ["ai", "rubric", "feedback"],
      teacherReviewed: true
    }
  ],
  submissions: [
    {
      id: "submission-1",
      assessmentId: "assessment-2",
      studentName: "Rafi Khan",
      answerText: "AI assessment can support a teacher by generating a rubric-based feedback loop and highlighting gaps in the response.",
      score: 87,
      feedback: "Strong answer with clear alignment to rubric language.",
      passed: true,
      submittedAt: isoDate(-1, 11)
    }
  ],
  liveClasses: [
    {
      id: "live-1",
      title: "Weekly Compliance Q&A",
      courseId: "course-compliance",
      startAt: isoDate(1, 12),
      durationMinutes: 60,
      participantLimit: 100,
      provider: "Jitsi",
      meetingUrl: "https://meet.jit.si/SmartLMS-Compliance-Weekly-QA",
      recordingUrl: null,
      reminder24h: true,
      reminder1h: true,
      status: "scheduled"
    },
    {
      id: "live-2",
      title: "AI Teaching Lab",
      courseId: "course-ai",
      startAt: isoDate(2, 14),
      durationMinutes: 75,
      participantLimit: 500,
      provider: "Jitsi",
      meetingUrl: "https://meet.jit.si/SmartLMS-AI-Teaching-Lab",
      recordingUrl: "https://meet.jit.si/SmartLMS-AI-Teaching-Lab",
      reminder24h: true,
      reminder1h: true,
      status: "recorded"
    }
  ],
  certificates: [
    {
      id: "certificate-0",
      studentName: "Rafi Khan",
      courseId: "course-ai",
      courseTitle: "AI Instructor Studio",
      issuedAt: isoDate(-2, 10),
      certificateNumber: "CERT-20260423-00001-00002",
      verificationCode: "BETO-CERT-5418",
      revoked: false
    },
    {
      id: "certificate-1",
      studentName: "Maya Sultana",
      courseId: "course-compliance",
      courseTitle: "Compliance Excellence Bootcamp",
      issuedAt: isoDate(-7, 9),
      verificationCode: "BETO-CERT-9132",
      revoked: false
    }
  ],
  notifications: [
    {
      id: "notice-1",
      audience: "Admin",
      type: "billing",
      message: "Seat utilization has reached 82% of the active plan limit.",
      createdAt: isoDate(0, 7)
    },
    {
      id: "notice-2",
      audience: "Student",
      type: "live-class",
      message: "Weekly Compliance Q&A starts tomorrow at 12:00 UTC.",
      createdAt: isoDate(0, 8)
    }
  ],
  auditEvents: [
    {
      id: "audit-1",
      actor: "Ayesha Rahman",
      action: "Updated tenant branding colors",
      target: "Smart LMS Academy",
      ipAddress: "103.92.45.8",
      timestamp: isoDate(-1, 10)
    },
    {
      id: "audit-2",
      actor: "Nafis Hasan",
      action: "Published assessment draft",
      target: "Compliance Readiness Quiz",
      ipAddress: "103.92.45.14",
      timestamp: isoDate(0, 6)
    }
  ],
  complianceRecords: [
    {
      id: "comp-1",
      employeeName: "Rafi Khan",
      department: "Product",
      roleTitle: "Product Analyst",
      courseId: "course-compliance",
      courseTitle: "Compliance Excellence Bootcamp",
      completionPercent: 82,
      certified: false
    },
    {
      id: "comp-2",
      employeeName: "Maya Sultana",
      department: "Compliance",
      roleTitle: "Compliance Associate",
      courseId: "course-compliance",
      courseTitle: "Compliance Excellence Bootcamp",
      completionPercent: 100,
      certified: true
    },
    {
      id: "comp-3",
      employeeName: "Nafis Hasan",
      department: "Faculty",
      roleTitle: "Senior Instructor",
      courseId: "course-ai",
      courseTitle: "AI Instructor Studio",
      completionPercent: 94,
      certified: true
    }
  ],
  invoices: [],
  billing: {
    plan: "Growth",
    activeStudents: 412,
    monthlyPrice: 149,
    seatLimit: 500,
    overagePerSeat: 3
  }
};
