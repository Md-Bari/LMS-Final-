"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  planMatrix,
  type Role
} from "@/lib/mock-lms";
import { dashboardPathForRole, useMockLms } from "@/providers/mock-lms-provider";

import {
  Badge,
  PrimaryButton,
  Section,
  StatCard,
  SelectInput,
  TextInput,
  pageFrame
} from "@/components/shared/lms-core";
import { LmsHomePage } from "@/components/marketing/lms-home-page";

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

  return (
    <div className={`${pageFrame} pb-20 pt-10`}>
      <Section title="Course catalog" subtitle="SRS-aligned public discovery for institutes, corporate training, and tutors.">
        <div className="grid gap-4 xl:grid-cols-3">
          {state.courses.map((course) => {
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
  return <LmsHomePage />;
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
  const { state } = useMockLms();
  const resolvedSlug = catalogSlugMap[slug] ?? slug;
  const course = state.courses.find((item) => item.id === resolvedSlug);

  if (!course) {
    return (
      <div className={`${pageFrame} pb-20 pt-10`}>
        <Section title="Catalog item not found" subtitle="The requested course slug is not present in the seeded demo catalog.">
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
        <div className="mt-6 grid gap-4">
          {course.modules.map((module) => (
            <div key={module.id} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 dark:border-white/8 dark:bg-[#13212a]">
              <p className="font-serif text-2xl">{module.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">Drip release: +{module.dripDays} days</p>
              <div className="mt-4 grid gap-2">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-[1.2rem] border border-foreground/10 bg-background/70 p-3 text-sm">
                    {lesson.title} · {lesson.type} · {lesson.durationMinutes} min
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
