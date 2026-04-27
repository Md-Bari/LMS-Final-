"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Heart,
  Lock,
  MoonStar,
  Sparkles,
  Star,
  SunMedium,
  UploadCloud,
  Users,
  Video,
  Play,
  FileText,
  ClipboardCheck,
  PenSquare
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  planMatrix,
  type Role
} from "@/lib/mock-lms";
import { fetchPublicCoursesFromBackend } from "@/lib/api/lms-backend";
import { dashboardPathForRole, useMockLms } from "@/providers/mock-lms-provider";
import { useThemeMode } from "@/providers/theme-provider";

import {
  Badge,
  PrimaryButton,
  SecondaryButton,
  Section,
  StatCard,
  SelectInput,
  TextInput,
  pageFrame
} from "@/components/shared/lms-core";
import { YouTubePlayer } from "@/components/shared/youtube-player";

const catalogSlugMap: Record<string, string> = {
  "future-of-product-teams": "course-product",
  "ai-instructor-studio": "course-ai",
  "compliance-bootcamp": "course-compliance"
};

const aiStudioFeatures = [
  {
    title: "Upload lecture note input",
    body: "Upload TXT, MD, CSV, PDF, DOC, or DOCX notes now in frontend preview mode, then connect the same flow later to the backend upload endpoint.",
    href: "/teacher/assessments/ai-generate"
  },
  {
    title: "AI question generation queue",
    body: "Generate up to 50 questions from uploaded notes, then move them into the teacher review queue before publishing.",
    href: "/teacher/assessments/review"
  },
  {
    title: "Essay evaluation",
    body: "Students can submit long answers and receive rubric-aligned score plus written feedback in the demo workflow.",
    href: "/student/assessments"
  },
  {
    title: "Fallback question bank",
    body: "If notes are missing or AI is unavailable, generate from the local fallback bank so teachers can continue assessment creation.",
    href: "/teacher/assessments/ai-generate"
  }
];

const roleCards = [
  {
    title: "Admin workspace",
    body: "Branding, billing, compliance, certificates, notifications, and audit logs.",
    href: "/admin/dashboard"
  },
  {
    title: "Teacher workspace",
    body: "Courses, note upload, AI quiz generation, review queue, submissions, and live classes.",
    href: "/teacher/dashboard"
  },
  {
    title: "Student workspace",
    body: "Courses, progress tracking, assessment submission, live classes, and certificates.",
    href: "/student/dashboard"
  }
];

function AuthExperience({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp } = useMockLms();
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<Role>("admin");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nextPath = searchParams.get("next");

  return (
    <div className={`${pageFrame} grid gap-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr]`}>
      <Section
        title={
          slug === "signup"
            ? "Create your workspace access"
            : slug === "forgot-password"
              ? "Recover account access"
              : slug === "reset-password"
                ? "Set a new password"
                : "Sign in to Smart LMS"
        }
        subtitle="These authentication screens are wired as workable frontend flows so reviewers can move through the product quickly. Use the seeded demo password `password123`."
      >
        <div className="grid gap-3">
          {slug === "signup" ? (
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          ) : null}
          <TextInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
          {slug !== "forgot-password" ? (
            <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          ) : null}
          <SelectInput value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </SelectInput>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <PrimaryButton
            onClick={async () => {
              if (slug === "signup") {
                try {
                  setBusy(true);
                  setError("");
                  const user = await signUp(name, email, password, role);
                  router.push(nextPath || dashboardPathForRole(user.role));
                } catch (authError) {
                  setError(authError instanceof Error ? authError.message : "Sign up failed.");
                } finally {
                  setBusy(false);
                }
                return;
              }

              if (slug !== "login") {
                router.push("/login");
                return;
              }

              try {
                setBusy(true);
                setError("");
                const user = await signIn(email, password);
                router.push(nextPath || dashboardPathForRole(user.role));
              } catch (authError) {
                setError(authError instanceof Error ? authError.message : "Sign in failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {slug === "signup"
              ? busy
                ? "Creating account..."
                : "Create account"
              : slug === "forgot-password"
                ? "Send recovery email"
                : slug === "reset-password"
                  ? "Save password"
                  : busy
                    ? "Signing in..."
                    : "Continue"}
          </PrimaryButton>
        </div>
      </Section>

      <Section title="Secure access lanes" subtitle="Each user now signs in separately, and dashboards are protected so one role cannot open another role's workspace.">
        <div className="grid gap-3">
          {[
            ["Admin login", "admin@example.com"],
            ["Teacher login", "teacher@example.com"],
            ["Student login", "student@example.com"]
          ].map(([label, value]) => (
            value.startsWith("/") ? (
              <Link key={value} href={value} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 text-sm font-semibold text-foreground shadow-soft transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-[#13212a]">
                {label}
              </Link>
            ) : (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setEmail(value);
                  setPassword("password123");
                }}
                className="rounded-[1.4rem] border border-foreground/10 bg-white p-4 text-left text-sm font-semibold text-foreground shadow-soft transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-[#13212a]"
              >
                <span className="block">{label}</span>
                <span className="mt-1 block text-xs font-medium text-muted-foreground">{value}</span>
              </button>
            )
          ))}
        </div>
      </Section>
    </div>
  );
}

function PricingExperience() {
  const { state, updatePlan } = useMockLms();

  return (
    <div className={`${pageFrame} pb-20 pt-10`}>
      <Section title="Pricing tier matrix" subtitle="The SRS pricing tiers are implemented directly in the frontend so plan messaging and seat economics can be reviewed in context.">
        <div className="grid gap-4 xl:grid-cols-3">
          {(Object.keys(planMatrix) as Array<keyof typeof planMatrix>).map((plan) => (
            <div key={plan} className={`overflow-hidden rounded-[1.8rem] border p-6 ${state.billing.plan === plan ? "border-[#E8A020]/25 bg-[#1A1A2E] text-white shadow-glow" : "border-foreground/10 bg-white shadow-soft dark:border-white/8 dark:bg-[#13212a]"}`}>
              <p className="text-pretty-wrap font-serif text-[clamp(2.2rem,2.2vw,3rem)] leading-none">{plan}</p>
              <p className={`text-pretty-wrap mt-3 text-sm leading-6 ${state.billing.plan === plan ? "text-white/80" : "text-muted-foreground"}`}>
                ${planMatrix[plan].price}/month · {planMatrix[plan].seatLimit} active students
              </p>
              <div className="mt-6 space-y-2 text-sm">
                <p>Overage fee: ${planMatrix[plan].overagePerSeat}/seat</p>
                <p>Live class capacity: {planMatrix[plan].liveLimit || "No live classrooms"}</p>
                <p>White-label branding: {planMatrix[plan].whiteLabel ? "Included" : "Not included"}</p>
              </div>
              <PrimaryButton className="mt-6 w-full text-center" onClick={() => updatePlan(plan)}>
                {state.billing.plan === plan ? "Current plan" : "Select plan"}
              </PrimaryButton>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CatalogExperience() {
  const { state } = useMockLms();
  const [search, setSearch] = useState("");
  const [catalogCourses, setCatalogCourses] = useState(state.courses.filter((course) => course.status === "published"));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogCourses() {
      setLoading(true);
      setLoadError("");
      try {
        const courses = await fetchPublicCoursesFromBackend(search);
        const localPublished = state.courses.filter((course) => {
          if (course.status !== "published") return false;
          if (!search.trim()) return true;
          const query = search.toLowerCase();
          return `${course.title} ${course.category} ${course.description}`.toLowerCase().includes(query);
        });
        if (cancelled) return;
        setCatalogCourses(mergePublishedCourses(courses, localPublished));
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Could not load published courses.");
        const fallback = state.courses.filter((course) => {
          if (course.status !== "published") return false;
          if (!search.trim()) return true;
          const query = search.toLowerCase();
          return `${course.title} ${course.category} ${course.description}`.toLowerCase().includes(query);
        });
        setCatalogCourses(fallback);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalogCourses();

    return () => {
      cancelled = true;
    };
  }, [search, state.courses]);

  return (
    <div className={`${pageFrame} pb-20 pt-10`}>
      <Section title="Course catalog" subtitle="SRS-aligned public discovery for institutes, corporate training, and tutors.">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search published courses by title or category..."
          />
          <div className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-foreground/10 bg-background px-4 text-sm font-semibold text-muted-foreground">
            {loading ? "Searching..." : `${catalogCourses.length} result${catalogCourses.length === 1 ? "" : "s"}`}
          </div>
        </div>
        {loadError ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Public catalog sync failed. Showing local published courses.
          </div>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-3">
          {catalogCourses.map((course) => {
            const slug = Object.entries(catalogSlugMap).find(([, value]) => value === course.id)?.[0] ?? course.id;

            return (
              <Link key={course.id} href={`/catalog/${slug}`} className="rounded-[1.8rem] border border-foreground/10 bg-white p-6 shadow-soft transition hover:-translate-y-1 dark:border-white/8 dark:bg-[#13212a]">
                <div className="flex items-center justify-between gap-3">
                  <Badge>{course.category}</Badge>
                  <Badge>{course.status}</Badge>
                </div>
                <p className="mt-4 font-serif text-3xl">{course.title}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{course.description}</p>
                <p className="mt-5 text-sm font-semibold text-foreground">${course.price}</p>
              </Link>
            );
          })}
        </div>
        {!loading && !catalogCourses.length ? (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-background/70 p-5 text-sm text-muted-foreground">
            No published courses matched your search.
          </div>
        ) : null}
      </Section>
    </div>
  );
}

function GenericMarketing({ slug }: { slug: string }) {
  const content: Record<string, { title: string; body: string; cards: Array<{ title: string; body: string }> }> = {
    features: {
      title: "Feature architecture for the Smart LMS",
      body: "The product combines multi-tenant management, course delivery, AI assessments, live classrooms, compliance tracking, certificates, and subscription billing in one frontend.",
      cards: [
        { title: "Multi-tenant provisioning", body: "Branding, subdomain mapping, and role defaults." },
        { title: "AI assessment engine", body: "Generate question banks and evaluate essays with teacher review." },
        { title: "Compliance reporting", body: "Track completion, export evidence, and manage certificates." }
      ]
    },
    solutions: {
      title: "Purpose-built for institutes, corporates, and tutors",
      body: "The SRS clearly targets multiple segments, so the frontend is organized around flexible roles and branded tenant operations.",
      cards: [
        { title: "Educational institutes", body: "Course delivery and AI-assisted assessment at scale." },
        { title: "Corporate training", body: "Compliance reporting, certification, and auditable operations." },
        { title: "Independent tutors", body: "White-label launch, pricing, and learner onboarding." }
      ]
    },
    about: {
      title: "This frontend is now driven by the SRS",
      body: "Instead of placeholder pages, the product surface now reflects the real requirements from your document.",
      cards: [
        { title: "Route coverage", body: "Admin, teacher, student, auth, marketing, and catalog paths." },
        { title: "Interactive state", body: "Mock workflows let reviewers test product behavior immediately." },
        { title: "Backend-ready structure", body: "The UI can later connect to Laravel APIs with minimal route churn." }
      ]
    },
    demo: {
      title: "Interactive product demo",
      body: "Use the admin, teacher, and student routes to simulate the main SRS use cases directly in the browser.",
      cards: [
        { title: "Quiz generation", body: "Teacher uploads notes and generates questions." },
        { title: "Compliance reporting", body: "Admin exports audit-friendly reports." },
        { title: "Certificates", body: "Generate and revoke branded completion records." }
      ]
    },
    contact: {
      title: "Contact and rollout support",
      body: "This route frames implementation support, pricing questions, and enterprise deployment needs.",
      cards: [
        { title: "Implementation support", body: "Tenant setup, migration, and onboarding help." },
        { title: "Pricing advisory", body: "Plan fit and seat forecasting." },
        { title: "Enterprise asks", body: "Compliance, data residency, and white-label governance." }
      ]
    },
    faq: {
      title: "Frequently asked questions",
      body: "The main concerns in the SRS are answered through the working frontend: tenant isolation, AI fallback, live classes, compliance, and billing.",
      cards: [
        { title: "Does it support AI assessments?", body: "Yes. The frontend includes draft generation, review, and grading simulation." },
        { title: "Can admins export compliance data?", body: "Yes. CSV export is functional in the demo." },
        { title: "Can certificates be revoked?", body: "Yes. The certificate register supports revocation." }
      ]
    }
  };

  const page = content[slug];
  if (!page) {
    return <CatalogExperience />;
  }

  return (
    <div className={`${pageFrame} pb-20 pt-10`}>
      <Section title={page.title} subtitle={page.body}>
        <div className="grid gap-4 xl:grid-cols-3">
          {page.cards.map((card) => (
            <div key={card.title} className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
              <p className="font-serif text-3xl">{card.title}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function HomeExperience() {
  const { state, currentUser, isAuthenticated, resetDemo } = useMockLms();
  const { mounted, theme, toggleTheme } = useThemeMode();
  const [homeCourses, setHomeCourses] = useState(state.courses);
  const [publicLoadFailed, setPublicLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPublicCourses() {
      try {
        const courses = await fetchPublicCoursesFromBackend();
        if (cancelled) return;
        const localPublished = state.courses.filter((course) => course.status === "published");
        setHomeCourses(mergePublishedCourses(courses, localPublished));
      } catch {
        if (cancelled) return;
        setPublicLoadFailed(true);
        setHomeCourses(state.courses);
      }
    }

    void loadPublicCourses();

    return () => {
      cancelled = true;
    };
  }, [state.courses]);

  const coursesForHome = homeCourses.length ? homeCourses : state.courses;
  const activeLearners = state.billing.activeStudents;
  const publishedCourses = coursesForHome.filter((course) => course.status === "published").length;
  const totalLessons = coursesForHome.reduce((total, course) => total + course.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0);
  const featuredCourses = [...coursesForHome]
    .sort((left, right) => {
      if (left.status === right.status) {
        return right.enrollmentCount - left.enrollmentCount;
      }

      return left.status === "published" ? -1 : 1;
    });
  const liveClasses = [...state.liveClasses].sort(
    (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
  );
  const dashboardHref = isAuthenticated ? dashboardPathForRole(currentUser?.role) : "/login";
  const primaryWorkspaceHref = isAuthenticated ? dashboardHref : "/signup";
  const liveWorkspaceHref = isAuthenticated
    ? currentUser?.role === "student"
      ? "/student/live-classes"
      : "/teacher/live-classes"
    : "/login?next=%2Fteacher%2Flive-classes";
  const pricingAction =
    currentUser?.role === "admin"
      ? { href: "/admin/billing", label: "Open billing" }
      : isAuthenticated
        ? { href: dashboardHref, label: "Open dashboard" }
        : { href: "/signup", label: "Start now" };
  const partnerLabels = [
    state.branding.tenantName,
    "Corporate Training",
    "Professional Certification",
    "Live Classroom",
    "AI Assessment"
  ];
  const courseImages = [
    "/online-class-desktop.jpg",
    "/online-class-laptop.jpg",
    "/hero-learning-meeting.jpg"
  ];
  const pricingPlans = Object.entries(planMatrix) as Array<
    [keyof typeof planMatrix, (typeof planMatrix)[keyof typeof planMatrix]]
  >;
  const highlightCourses = featuredCourses.slice(0, 3);
  const liveHighlights = liveClasses.slice(0, 2);
  const faqItems = [
    {
      question: "Can learners join live classes from the same LMS platform?",
      answer: "Yes. The student and teacher live-class routes are already wired into the existing platform flow with scheduling, reminders, and session status."
    },
    {
      question: "Does the platform support AI-generated assessments?",
      answer: "Yes. Teachers can generate draft assessments, review them, and publish them from the AI assessment workflow already present in the project."
    },
    {
      question: "Will pricing and seat logic match the backend billing rules?",
      answer: "Yes. The plan cards are rendered from the same plan matrix and billing state used across the frontend and Laravel-backed data flow."
    }
  ];
  const categoryChips = [...new Set(featuredCourses.map((course) => course.category))];
  const uploadedCourses = [...coursesForHome]
    .map((course) => {
      const uploadedLessons = course.modules.flatMap((module) => module.lessons).filter((lesson) => Boolean(lesson.contentUrl || lesson.contentOriginalName)).length;
      return {
        ...course,
        uploadedLessons,
        totalLessons: course.modules.flatMap((module) => module.lessons).length,
        assessmentCount: state.assessments.filter((assessment) => assessment.courseId === course.id).length
      };
    })
    .filter((course) => course.uploadedLessons > 0)
    .sort((left, right) => right.uploadedLessons - left.uploadedLessons)
    .slice(0, 6);
  const stats = [
    { label: "Active learners", value: `${activeLearners}+` },
    { label: "Published courses", value: `${publishedCourses}+` },
    { label: "Course lessons", value: `${totalLessons}+` }
  ];

  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-foreground/5 bg-card">
        <div className={`${pageFrame} flex flex-wrap items-center justify-between gap-5 py-5`}>
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b9852b] text-white shadow-soft">
                <span className="font-serif text-lg font-semibold">{state.branding.logoText || "SL"}</span>
              </div>
              <div>
                <p className="font-sans text-[2rem] font-black leading-none tracking-[-0.05em] text-foreground">
                  {state.branding.tenantName}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Smart LMS
                </p>
              </div>
            </Link>
          <div className="hidden items-center gap-5 lg:flex">
            <a href="#courses" className="text-sm font-medium text-foreground transition hover:text-foreground/75">Explore</a>
            <a href="#pricing" className="text-sm font-medium text-foreground transition hover:text-foreground/75">Degrees</a>
          </div>
        </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-foreground transition hover:text-foreground/75">
              Log In
            </Link>
            <Link href={primaryWorkspaceHref} className="rounded-lg border border-foreground/30 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-foreground hover:text-background">
              {isAuthenticated ? "Open Dashboard" : "Join for Free"}
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-[#E8A020]/60 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A020]/45 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
            >
              {mounted && theme === "dark" ? <SunMedium className="h-4 w-4 text-[#ffd166]" /> : <MoonStar className="h-4 w-4" />}
              <span className="hidden sm:inline">{mounted && theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#1e2034_0%,#1a1c30_52%,#171929_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_4%,rgba(201,146,45,0.22),transparent_18%),radial-gradient(circle_at_92%_90%,rgba(20,115,135,0.16),transparent_20%),radial-gradient(circle_at_70%_38%,rgba(255,255,255,0.08),transparent_20%)]" />
        <div className={`${pageFrame} relative grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center`}>
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-4 w-4 text-[#ffd166]" />
              Smart LMS Plus
            </div>
            <div className="space-y-4">
              <h1 className="font-sans text-[clamp(2.7rem,5vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.06em]">
                Career-ready learning,
                <span className="block">live classes, and premium LMS flow.</span>
              </h1>
              <p className="max-w-xl text-base leading-8 text-white/82">
                Unlimited access to your platform’s most important learning experiences: courses, AI assessments, certificates, compliance tools, and live classrooms.
              </p>
              <p className="text-sm font-semibold text-white/90">
                {state.billing.plan} plan now running {activeLearners} active learners with live classroom support and backend-connected seat logic.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#1a1c30] transition hover:-translate-y-0.5">
                Explore catalog
              </Link>
              <Link href={liveWorkspaceHref} className="rounded-lg border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Open live classes
              </Link>
              {isAuthenticated ? (
                <Link href={dashboardHref} className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10">
                  Open dashboard
                </Link>
              ) : (
                <button type="button" onClick={resetDemo} className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10">
                  Reset demo
                </button>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[1.8rem] bg-white text-slate-900 shadow-[0_28px_80px_rgba(0,0,0,0.22)] dark:border dark:border-white/10 dark:bg-[#13212a] dark:text-white sm:col-span-2">
                <div className="grid gap-4 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-5">
                  <div className="overflow-hidden rounded-[1.3rem]">
                    <Image src={courseImages[0]} alt="Hero learning card" width={820} height={520} className="h-full w-full object-cover" priority />
                  </div>
                  <div className="flex flex-col justify-between rounded-[1.3rem] bg-[#f5f7fb] p-5 dark:bg-white/5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9852b]">Top course</p>
                      <h2 className="mt-3 font-sans text-2xl font-bold leading-tight">{highlightCourses[0]?.title ?? "Course title"}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/70">
                        {highlightCourses[0]?.description ?? "Premium course card connected to your live project data."}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-white/60">
                      <span>{highlightCourses[0]?.modules.length ?? 0} modules</span>
                      <span>{highlightCourses[0]?.enrollmentCount ?? 0} enrolled</span>
                    </div>
                  </div>
                </div>
              </div>

              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.6rem] bg-white/12 p-5 backdrop-blur">
                  <p className="font-sans text-3xl font-extrabold tracking-[-0.04em] text-[#ffd166]">{stat.value}</p>
                  <p className="mt-2 text-sm text-white/76">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="absolute -bottom-7 right-5 hidden w-[220px] rounded-[1.4rem] bg-white p-4 text-slate-900 shadow-[0_22px_70px_rgba(0,0,0,0.25)] dark:border dark:border-white/10 dark:bg-[#13212a] dark:text-white lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9852b]">Live next</p>
              <p className="mt-2 font-sans text-lg font-bold leading-tight">{liveHighlights[0]?.title ?? "Weekly live session"}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-white/70">Automatic reminders, attendance, and recorded session workflow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card py-12">
        <div className={pageFrame}>
          {publicLoadFailed ? (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Public course sync failed. Showing local demo course data.
            </div>
          ) : null}
          <h2 className="text-[clamp(1.8rem,3vw,2.7rem)] font-bold tracking-[-0.05em] text-foreground">
            Learn from top learning workflows and platform tools
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {partnerLabels.map((label) => (
              <div key={label} className="flex min-h-[92px] items-center justify-center rounded-2xl border border-foreground/8 bg-background px-4 text-center text-sm font-semibold text-muted-foreground shadow-soft">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#1d1f33] py-12 text-white dark:bg-[#1d1f33]">
        <div className={`${pageFrame} grid gap-5 md:grid-cols-3`}>
          {[
            ["Explore new skills", "Access course, module, lesson, and catalog workflows from the same learning system.", <BookOpen key="book" className="h-5 w-5" />],
            ["Earn valuable credentials", "Certificates and compliance records stay aligned with assessment and course completion data.", <Award key="award" className="h-5 w-5" />],
            ["Learn from the best", "AI assessments, live classes, and teacher tools are already routed inside your project.", <Bot key="bot" className="h-5 w-5" />]
          ].map(([title, body, icon]) => (
            <div key={String(title)} className="rounded-[1.8rem] border border-white/8 bg-white/5 p-6 shadow-soft backdrop-blur">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b9852b]/15 text-[#ddb364]">{icon}</span>
              <h3 className="mt-6 text-xl font-bold tracking-[-0.03em]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/68">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card py-16">
        <div className={`${pageFrame} grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center`}>
          <div>
            <h2 className="max-w-3xl text-[clamp(2.2rem,4vw,3.8rem)] font-bold leading-[1.08] tracking-[-0.05em]">
              Join the learners and teams building better outcomes with one polished LMS experience.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              The homepage now feels more like a real premium learning platform: stronger hierarchy, cleaner rhythm, richer cards, and less cheap-looking filler.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="rounded-lg border border-[#b9852b] px-5 py-3 text-sm font-bold text-[#c8922d] transition hover:bg-[#b9852b] hover:text-white">
                Browse courses
              </Link>
            </div>
          </div>
          <div className="relative mx-auto max-w-[500px]">
            <div className="absolute inset-4 rounded-[2rem] border-2 border-[#b9852b]/20" />
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1a1c30] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
              <Image src={courseImages[2]} alt="Learning success visual" width={1000} height={740} className="h-[420px] w-full rounded-[1.5rem] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="bg-card py-16">
        <div className={pageFrame}>
          <div className="rounded-[2rem] bg-[#eef3fb] p-6 dark:bg-white/[0.04]">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
              <div>
                <h2 className="text-[clamp(2rem,3vw,2.7rem)] font-bold leading-tight tracking-[-0.05em]">Career skills that work</h2>
                <Link href="/catalog" className="mt-6 inline-flex rounded-lg border border-[#b9852b] px-4 py-2 text-sm font-bold text-[#c8922d]">
                  Explore all
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {highlightCourses.map((course, index) => {
                  const slug = Object.entries(catalogSlugMap).find(([, value]) => value === course.id)?.[0] ?? course.id;

                  return (
                    <Link key={course.id} href={`/catalog/${slug}`} className="overflow-hidden rounded-[1.5rem] border border-foreground/8 bg-card shadow-soft transition hover:-translate-y-1">
                      <div className="h-40 overflow-hidden">
                        <Image src={courseImages[index % courseImages.length]} alt={course.title} width={760} height={460} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 text-[#b9852b]" />
                          <span>{state.branding.tenantName}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold leading-tight tracking-[-0.03em]">{course.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {course.status === "published" ? "Published learning program" : "Draft learning program"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                          <span className="rounded-full bg-muted px-3 py-1">{course.category}</span>
                          <span className="rounded-full bg-muted px-3 py-1">{course.modules.length} modules</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Popular</span>
              {categoryChips.map((chip) => (
                <span key={chip} className="rounded-full border border-[#b9852b]/25 bg-[#201f2f] px-3 py-1 text-xs font-medium text-[#ddb364] dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className={pageFrame}>
          <div className="rounded-[2rem] border border-foreground/10 bg-white p-6 shadow-soft dark:border-white/8 dark:bg-[#13212a]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9852b]">Uploaded course library</p>
                <h2 className="mt-2 text-[clamp(1.8rem,3vw,2.6rem)] font-bold tracking-[-0.05em] text-foreground">
                  Recently uploaded courses
                </h2>
              </div>
              <Link href="/teacher/courses" className="inline-flex items-center gap-2 rounded-lg border border-foreground/20 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted">
                Manage uploads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {uploadedCourses.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {uploadedCourses.map((course, index) => (
                  <Link
                    key={course.id}
                    href={`/teacher/courses/${course.id}`}
                    className="overflow-hidden rounded-[1.3rem] border border-foreground/10 bg-card shadow-soft transition hover:-translate-y-1 hover:border-[#b9852b]/40 dark:border-white/8"
                  >
                    <div className="h-36 overflow-hidden">
                      <Image src={courseImages[index % courseImages.length]} alt={course.title} width={760} height={420} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#b9852b]/15 px-2.5 py-1 text-[11px] font-semibold text-[#b9852b]">
                          <UploadCloud className="h-3.5 w-3.5" />
                          {course.uploadedLessons}/{course.totalLessons} uploaded
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          {course.assessmentCount} assessments
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-xl font-bold leading-tight tracking-[-0.03em] text-foreground">{course.title}</h3>
                      <p className="text-xs text-muted-foreground">{course.category} · {course.modules.length} modules</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-foreground/15 bg-background/70 p-6 text-sm text-muted-foreground">
                No uploaded course content yet. Upload resources from teacher course studio to show them here.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className={pageFrame}>
          <div className="text-center">
            <h2 className="text-[clamp(2rem,3vw,2.7rem)] font-bold tracking-[-0.05em]">What subscribers are achieving through learning</h2>
          </div>
          <div className="mt-10 grid gap-5 xl:grid-cols-3">
            {[
              {
                name: "Abigail P.",
                text: "The platform makes it easy to balance work and learning. I can move between lessons, live classes, and assessments without friction."
              },
              {
                name: "Shi Jie F.",
                text: "The LMS feels more valuable because course discovery, AI workflows, and certificates are all inside the same polished experience."
              },
              {
                name: "Ines K.",
                text: "I appreciate how the live class flow and certificate progress stay connected. It feels closer to a premium learning platform now."
              }
            ].map((item) => (
              <div key={item.name} className="rounded-[1.8rem] border border-foreground/10 bg-background p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0056d2]/10 text-sm font-bold text-[#0056d2]">
                    {item.name.slice(0, 1)}
                  </div>
                  <p className="font-semibold">{item.name}</p>
                </div>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#1b1d30] py-16 text-white dark:bg-[#1b1d30]">
        <div className={pageFrame}>
          <div className="text-center">
            <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-bold tracking-[-0.05em]">Plans for you or your team</h2>
          </div>
          <div className="mx-auto mt-6 flex w-full max-w-[300px] items-center rounded-full bg-white p-2 shadow-soft dark:bg-white/10">
            <div className="flex-1 rounded-full bg-[#b9852b] px-4 py-2 text-center text-sm font-bold text-white">Individual</div>
            <div className="flex-1 px-4 py-2 text-center text-sm font-medium text-slate-500 dark:text-white/70">Teams</div>
          </div>

          <div className="mt-10 grid gap-5 xl:grid-cols-3">
            {pricingPlans.map(([planName, plan], index) => (
              <div
                key={planName}
                className={`overflow-hidden rounded-[1.9rem] bg-[#23253a] shadow-soft ${
                  index === 1 ? "border-2 border-[#b9852b]" : "border border-white/10"
                }`}
              >
                {index === 1 ? (
                  <div className="bg-[#b9852b] py-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-white">
                    Most popular
                  </div>
                ) : null}
                <div className="p-7">
                  <h3 className="text-[1.9rem] font-bold tracking-[-0.04em]">{planName}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/68">
                    {index === 0
                      ? "Start with essential learning workflows."
                      : index === 1
                        ? "Complete multiple course and assessment workflows faster."
                        : "Maximum flexibility for large and advanced LMS operations."}
                  </p>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-5xl font-extrabold tracking-[-0.05em]">${plan.price}</span>
                    <span className="pb-1 text-sm text-muted-foreground">/month</span>
                  </div>
                  <div className="mt-8 space-y-4 border-t border-foreground/8 pt-6">
                    {[
                      `${plan.seatLimit} learner seats`,
                      plan.liveLimit > 0 ? `${plan.liveLimit} live class participants` : "Live class upgrade needed",
                      `${plan.overagePerSeat} USD per overage seat`,
                      plan.whiteLabel ? "White-label branding included" : "Shared branded workspace"
                    ].map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-7 text-white/72">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#ddb364]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={pricingAction.href}
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition ${
                      index === 1 ? "bg-[#b9852b] text-white" : "border border-[#b9852b] text-[#ddb364]"
                    }`}
                  >
                    {pricingAction.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="live" className="bg-card py-16">
        <div className={`${pageFrame} grid gap-6 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div className="rounded-[2rem] bg-[#1a1c30] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ddb364]">Live classroom functionality</p>
            <h2 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-bold leading-tight tracking-[-0.05em]">Schedule and run premium live learning experiences.</h2>
            <p className="mt-4 text-sm leading-7 text-white/82">
              Jitsi-based sessions, reminders, participant limits, and recorded sessions are all surfaced from the same platform state.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/teacher/live-classes" className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#1a1c30]">
                Teacher live panel
              </Link>
              <Link href="/student/live-classes" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white">
                Student live panel
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {liveHighlights?.map((liveClass) => {
              if (!liveClass) return null;
              const course = state.courses?.find((item) => item.id === liveClass.courseId);
              const startDate = liveClass.startAt ? new Date(liveClass.startAt) : null;
              const isValidDate = startDate && !isNaN(startDate.getTime());

              return (
                <div key={liveClass.id ?? Math.random()} className="rounded-[1.8rem] border border-foreground/10 bg-background p-6 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b9852b]">{liveClass.status ?? "Status"}</p>
                      <h3 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.03em]">{liveClass.title ?? "Live Class"}</h3>
                    </div>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b9852b]/12 text-[#b9852b]">
                      <Video className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      {BookOpen && <BookOpen className="h-4 w-4" />}
                      {course?.title ?? "Course"}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      {CalendarDays && <CalendarDays className="h-4 w-4" />}
                      {isValidDate ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      {Clock3 && <Clock3 className="h-4 w-4" />}
                      {isValidDate ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "TBA"} for {liveClass.durationMinutes ?? 0} minutes
                    </p>
                    <p className="inline-flex items-center gap-2">
                      {Users && <Users className="h-4 w-4" />}
                      Limit {liveClass.participantLimit ?? 0} learners
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className={`${pageFrame} grid gap-10 lg:grid-cols-[0.95fr_1.05fr]`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b9852b]">Workspace access</p>
            <h2 className="mt-3 text-[clamp(2rem,3vw,2.8rem)] font-bold tracking-[-0.05em]">Jump into the right dashboard fast</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {roleCards.map((card) => (
              <Link key={card.title} href={card.href} className="rounded-[1.8rem] border border-foreground/10 bg-background p-6 shadow-soft transition hover:-translate-y-1">
                <h3 className="text-2xl font-bold leading-tight tracking-[-0.03em]">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#b9852b]">
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1b1d30] py-16 text-white dark:bg-[#1b1d30]">
        <div className={pageFrame}>
          <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-bold tracking-[-0.05em]">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 shadow-soft">
                <summary className="cursor-pointer list-none text-sm font-bold leading-7">{item.question}</summary>
                <p className="mt-3 text-sm leading-7 text-white/68">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_top_left,#23263d_0%,#191b2f_100%)] py-16 text-white">
        <div className={`${pageFrame} text-center`}>
          <p className="text-[2.4rem] font-extrabold tracking-[-0.05em]">Smart LMS Plus</p>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/84">
            Unlimited access to expert-led programs, live learning, assessments, certificates, and learning operations connected to your existing Next.js + Laravel + PostgreSQL stack.
          </p>
          <Link href="/catalog" className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#1a1c30]">
            Explore learning
          </Link>
        </div>
      </section>
    </div>
  );
}

export function MarketingPageExperience({ slug }: { slug: string }) {
  if (slug === "login" || slug === "signup" || slug === "forgot-password" || slug === "reset-password") {
    return <AuthExperience slug={slug} />;
  }

  if (slug === "pricing") {
    return <PricingExperience />;
  }

  if (slug === "catalog") {
    return <CatalogExperience />;
  }

  return <GenericMarketing slug={slug} />;
}

export function CatalogCourseExperience({ slug }: { slug: string }) {
  const router = useRouter();
  const { state, currentUser, isAuthenticated, enrollInCourse, addToWishlist, removeFromWishlist } = useMockLms();
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const [catalogCourse, setCatalogCourse] = useState<(typeof state.courses)[number] | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const resolvedSlug = catalogSlugMap[slug] ?? slug;

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogCourse() {
      setLoadingCourse(true);
      setCourseLoadError("");

      try {
        const publicCourses = await fetchPublicCoursesFromBackend();
        if (cancelled) return;
        const found = findCourseBySlug(publicCourses, resolvedSlug, slug) ?? findCourseBySlug(state.courses, resolvedSlug, slug);
        setCatalogCourse(found ?? null);
      } catch (error) {
        if (cancelled) return;
        setCourseLoadError(error instanceof Error ? error.message : "Could not load catalog course.");
        setCatalogCourse(findCourseBySlug(state.courses, resolvedSlug, slug) ?? null);
      } finally {
        if (!cancelled) {
          setLoadingCourse(false);
        }
      }
    }

    void loadCatalogCourse();

    return () => {
      cancelled = true;
    };
  }, [resolvedSlug, slug, state.courses]);

  const course = catalogCourse;
  const myEnrollment = course
    ? state.enrollments.find((enrollment) =>
      enrollment.courseId === course.id &&
      enrollment.status !== "cancelled" &&
      (enrollment.studentId === currentUser?.id || enrollment.studentName === currentUser?.name)
    )
    : null;
  const isEnrolled = Boolean(myEnrollment);
  const enrollmentProgress = myEnrollment?.progressPercentage ?? 0;
  const isWishlisted = course
    ? state.wishlists.some((wishlist) =>
      wishlist.courseId === course.id &&
      (wishlist.studentId === currentUser?.id || wishlist.studentName === currentUser?.name)
    )
    : false;
  const flattenedLessons = course
    ? course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        moduleId: module.id,
        moduleDripDays: module.dripDays,
        lesson
      }))
    )
    : [];
  const unlockedLessonKeys = new Set(
    flattenedLessons
      .filter((item) => {
        if (!isEnrolled) {
          return false;
        }
        const releaseAt = Date.parse(item.lesson.releaseAt);
        const releaseLocked = Number.isFinite(releaseAt) ? releaseAt > Date.now() : item.moduleDripDays > 0;
        return !releaseLocked;
      })
      .map((item) => `${item.moduleId}:${item.lesson.id}`)
  );
  const currentLesson = flattenedLessons.find((item) => {
    const key = `${item.moduleId}:${item.lesson.id}`;
    if (!unlockedLessonKeys.has(key)) {
      return false;
    }
    const completed =
      item.lesson.isCompleted ||
      item.lesson.completedBy.includes(currentUser?.name ?? "");
    return !completed;
  });
  const currentLessonKey = currentLesson ? `${currentLesson.moduleId}:${currentLesson.lesson.id}` : null;

  const instructorName = course?.instructor?.name ?? "Course Instructor";
  const instructorInitials = instructorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const ratingValue = course?.instructor?.ratingAverage ?? 0;
  const ratingCount = course?.instructor?.ratingCount ?? 0;
  const studentsCount = course?.instructor?.studentsCount ?? course?.enrollmentCount ?? 0;
  const learnItems = (course?.whatYouWillLearn?.length ? course.whatYouWillLearn : [
    "Understand the module sequence and practical workflow for this course.",
    "Apply lessons in guided assignments and quizzes.",
    "Track measurable progress with assessment-backed milestones."
  ]);
  const requirementItems = (course?.requirements?.length ? course.requirements : [
    "Basic internet browsing and file handling familiarity.",
    "Commitment to follow module sequence and complete assessments."
  ]);
  const audienceItems = (course?.targetAudience?.length ? course.targetAudience : [
    "Students who want structured, module-wise learning.",
    "Professionals looking to upskill with applied lessons."
  ]);

  if (loadingCourse) {
    return (
      <div className={`${pageFrame} pb-20 pt-10`}>
        <Section title="Loading catalog item" subtitle="Fetching published course details...">
          <div className="text-sm text-muted-foreground">Please wait a moment.</div>
        </Section>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`${pageFrame} pb-20 pt-10`}>
        <Section title="Catalog item not found" subtitle="The requested course slug is not present in the seeded demo catalog.">
          {courseLoadError ? (
            <p className="mb-3 text-sm text-muted-foreground">Public catalog sync failed. {courseLoadError}</p>
          ) : null}
          <Link href="/catalog" className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">
            Back to catalog
          </Link>
        </Section>
      </div>
    );
  }

  if (course.id === "course-ai") {
    return (
      <div className={`${pageFrame} pb-20 pt-10`}>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Section title="AI Instructor Studio" subtitle="Focused on exactly the SRS AI workflow: note upload, automatic quiz generation, essay scoring, teacher review, and fallback question bank support.">
            <div className="grid gap-4">
              {aiStudioFeatures.map((feature) => (
                <div key={feature.title} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                  <p className="font-serif text-2xl">{feature.title}</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/teacher/assessments/ai-generate" className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">
                Launch AI Studio
              </Link>
              <Link href="/teacher/assessments/review" className="rounded-full border border-foreground/15 px-5 py-3 text-sm font-semibold">
                Open review queue
              </Link>
            </div>
          </Section>

          <Section title="AI Studio capabilities" subtitle="Only SRS-based features are highlighted here.">
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#F5C766]">Question generation</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Generate up to 50 MCQ, True/False, Short Answer, or Essay questions from uploaded notes or pasted content.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#F5C766]">Teacher review</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Review, edit, reject, and publish generated questions before students can see them.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#F5C766]">Fallback continuity</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Keep assessment creation running even during AI disruption by generating from the fallback question bank.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#F5C766]">Essay evaluation</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Evaluate long-form student answers against rubric keywords and return score plus feedback.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className={`${pageFrame} pb-20 pt-10`}>
      <Section title={course.title} subtitle={course.description}>
        <div className="grid gap-4 xl:grid-cols-3">
          <StatCard label="Category" value={course.category} />
          <StatCard label="Modules" value={String(course.modules.length)} />
          <StatCard label="Price" value={`$${course.price}`} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.2rem] border border-foreground/10 bg-white/90 p-4 dark:border-white/8 dark:bg-[#13212a]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Instructor</p>
            <div className="mt-3 flex items-start gap-3">
              {course.instructor?.profileImageUrl ? (
                <img src={course.instructor.profileImageUrl} alt={instructorName} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8A020]/15 text-sm font-bold text-[#b9852b]">
                  {instructorInitials || "IN"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground">{instructorName}</p>
                <p className="text-sm text-muted-foreground">
                  {course.instructor?.bio || "Experienced instructor leading this course curriculum."}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-[#E8A020]" />
                    {ratingValue > 0 ? ratingValue.toFixed(1) : "New"} ({ratingCount})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {studentsCount} students
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-foreground/10 bg-white/90 p-4 dark:border-white/8 dark:bg-[#13212a]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Decision Details</p>
            <div className="mt-3 grid gap-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">What you will learn</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {learnItems.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground">Requirements</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {requirementItems.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground">Who this course is for</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {audienceItems.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-[1.2rem] border border-foreground/10 bg-white/80 p-4 dark:border-white/8 dark:bg-[#13212a]">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {isEnrolled ? "You are enrolled in this course." : "Complete buy/enroll to unlock this course in your student workspace."}
              </p>
              {isEnrolled ? (
                <div className="mt-2 max-w-sm">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Course progress</span>
                    <span>{enrollmentProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div className="h-full rounded-full bg-[#E8A020] transition-all" style={{ width: `${Math.max(0, Math.min(100, enrollmentProgress))}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={wishlistBusy}
                onClick={async () => {
                  if (!isAuthenticated) {
                    router.push(`/login?next=${encodeURIComponent(`/catalog/${slug}`)}`);
                    return;
                  }

                  try {
                    setWishlistBusy(true);
                    setEnrollMessage(null);
                    if (isWishlisted) {
                      await removeFromWishlist(course.id);
                      setEnrollMessage({ type: "success", text: "Removed from wishlist." });
                    } else {
                      await addToWishlist(course.id);
                      setEnrollMessage({ type: "success", text: "Added to wishlist." });
                    }
                  } catch (error) {
                    setEnrollMessage({ type: "error", text: error instanceof Error ? error.message : "Wishlist update failed." });
                  } finally {
                    setWishlistBusy(false);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isWishlisted ? "border-[#E8A020]/60 bg-[#E8A020]/12 text-[#b9852b]" : "border-foreground/15 hover:border-foreground/35"}`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                {isWishlisted ? "Wishlisted" : "Add to wishlist"}
              </button>
              <PrimaryButton
                disabled={enrolling || isEnrolled}
                onClick={async () => {
                  if (!isAuthenticated) {
                    router.push(`/login?next=${encodeURIComponent(`/catalog/${slug}`)}`);
                    return;
                  }

                  try {
                    setEnrolling(true);
                    setEnrollMessage(null);
                    await enrollInCourse(course.id, currentUser?.name);
                    setEnrollMessage({ type: "success", text: "Enrollment successful. You can continue from Student Courses." });
                  } catch (error) {
                    setEnrollMessage({ type: "error", text: error instanceof Error ? error.message : "Could not enroll right now." });
                  } finally {
                    setEnrolling(false);
                  }
                }}
              >
                {isEnrolled
                  ? "Already enrolled"
                  : enrolling
                    ? "Processing..."
                    : course.price > 0
                      ? `Buy & Enroll ($${course.price})`
                      : "Enroll now"}
              </PrimaryButton>
              {isEnrolled ? (
                <SecondaryButton onClick={() => router.push("/student/courses")}>
                  Open My Courses
                </SecondaryButton>
              ) : null}
            </div>
          </div>
          {!isEnrolled ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Checkout is handled through tenant subscription billing and enrollment policy in this workspace.
            </p>
          ) : null}
          {enrollMessage ? (
            <p className={`mt-2 text-sm ${enrollMessage.type === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
              {enrollMessage.text}
            </p>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4">
          {course.modules.map((module) => (
            <div key={module.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
              <p className="font-serif text-2xl">{module.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">Drip release: +{module.dripDays} days</p>
              <div className="mt-4 grid gap-2">
                {module.lessons.map((lesson) => {
                  const hasVideo = !!lesson.contentUrl && /youtube\.com|youtu\.be/.test(lesson.contentUrl);
                  const videoId = hasVideo ? (lesson.contentUrl!.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] ?? lesson.contentUrl!.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1]) : null;
                  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
                  const lessonKey = `${module.id}:${lesson.id}`;
                  const releaseAt = Date.parse(lesson.releaseAt);
                  const releaseLocked = Number.isFinite(releaseAt) ? releaseAt > Date.now() : module.dripDays > 0;
                  const locked = !isEnrolled || releaseLocked;
                  const completed = lesson.isCompleted || lesson.completedBy.includes(currentUser?.name ?? "");
                  const current = currentLessonKey === lessonKey;
                  const typeIcon = lesson.type === "video"
                    ? <Video className="h-3.5 w-3.5 text-blue-500" />
                    : lesson.type === "quiz"
                      ? <ClipboardCheck className="h-3.5 w-3.5 text-violet-500" />
                      : lesson.type === "assignment"
                        ? <PenSquare className="h-3.5 w-3.5 text-amber-500" />
                        : <FileText className="h-3.5 w-3.5 text-emerald-500" />;
                  const typeLabel = lesson.type === "document"
                    ? "PDF"
                    : lesson.type === "video"
                      ? "Video"
                      : lesson.type === "quiz"
                        ? "Quiz"
                        : lesson.type === "assignment"
                          ? "Assignment"
                          : "Resource";

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        if (locked) return;
                        if (hasVideo) setActiveVideo({ url: lesson.contentUrl!, title: lesson.title });
                      }}
                      className={`flex items-center gap-3 rounded-[1.2rem] border p-3 text-sm text-left transition-all ${locked ? "cursor-not-allowed border-foreground/10 bg-background/60 opacity-80" : hasVideo ? "cursor-pointer border-foreground/10 bg-background/70 hover:border-red-300 hover:shadow-sm" : "cursor-default border-foreground/10 bg-background/70"} ${current ? "ring-1 ring-[#E8A020]/40" : ""}`}
                    >
                      {hasVideo && thumbnail ? (
                        <div className="group relative w-20 h-12 rounded-lg overflow-hidden shrink-0 border border-border/50">
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                              <Play className="w-2.5 h-2.5 text-white fill-white ml-px" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${hasVideo ? "group-hover:text-red-600" : ""}`}>{lesson.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {typeIcon}
                          <span>{typeLabel} · {lesson.durationMinutes} min</span>
                          {hasVideo && <span className="ml-1.5 text-red-500 font-medium">▶ Video</span>}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {locked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        ) : completed ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : current ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#E8A020]/35 bg-[#E8A020]/10 px-2 py-1 text-[11px] font-semibold text-[#b9852b]">
                            ▶ Current
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {activeVideo && (
        <YouTubePlayer
          videoUrl={activeVideo.url}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}

function findCourseBySlug<T extends { id: string; title: string }>(
  courses: T[],
  resolvedSlug: string,
  originalSlug: string
): T | undefined {
  const normalizedResolved = resolvedSlug.toLowerCase().trim();
  const normalizedOriginal = originalSlug.toLowerCase().trim();

  return courses.find((course) => {
    const id = String(course.id).toLowerCase().trim();
    const titleSlug = course.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return id === normalizedResolved || id === normalizedOriginal || titleSlug === normalizedResolved || titleSlug === normalizedOriginal;
  });
}

function mergePublishedCourses<T extends { id: string; title: string; status: string }>(primary: T[], secondary: T[]) {
  const merged = [...primary];
  const existingIds = new Set(primary.map((course) => String(course.id)));
  const existingTitles = new Set(primary.map((course) => course.title.toLowerCase().trim()));

  for (const course of secondary) {
    if (course.status !== "published") continue;
    const normalizedId = String(course.id);
    const normalizedTitle = course.title.toLowerCase().trim();

    if (existingIds.has(normalizedId) || existingTitles.has(normalizedTitle)) {
      continue;
    }

    merged.push(course);
    existingIds.add(normalizedId);
    existingTitles.add(normalizedTitle);
  }

  return merged;
}
