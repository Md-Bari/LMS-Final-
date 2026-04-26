"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleDot,
  Facebook,
  Instagram,
  Linkedin,
  MoonStar,
  PlayCircle,
  Search,
  ShieldCheck,
  Star,
  SunMedium,
  Target,
  Twitter,
  Youtube
} from "lucide-react";

import { trackMarketingEvent } from "@/lib/api/lms-backend";
import { dashboardPathForRole, useMockLms } from "@/providers/mock-lms-provider";
import { useThemeMode } from "@/providers/theme-provider";

type CourseSpotlight = {
  title: string;
  provider: string;
  level: string;
  type: string;
  image: string;
  href: string;
};

type PlanCard = {
  title: string;
  subtitle: string;
  priceLine: string;
  ctaLabel: string;
  highlighted?: boolean;
  notes: string[];
};

type Testimonial = {
  name: string;
  text: string;
  image: string;
};

const enterpriseLinks = [
  { label: "For Learners", href: "/" },
  { label: "For Teams", href: "/solutions" },
  { label: "For Institutes", href: "/about" },
  { label: "For Enterprise", href: "/features" }
];

const popularSearches = [
  "Business",
  "Computer Science",
  "Data Science",
  "Health",
  "Information Technology",
  "Arts and Humanities"
];

const logoItems = ["ILLINOIS", "Duke", "Google", "Michigan", "IBM", "Vanderbilt", "Johns Hopkins"];

const skillCards: CourseSpotlight[] = [
  {
    title: "Python for Everybody",
    provider: "University of Michigan",
    level: "Beginner",
    type: "Specialization",
    image: "/hero-learning-meeting.jpg",
    href: "/catalog/future-of-product-teams"
  },
  {
    title: "Prompt Engineering",
    provider: "Vanderbilt University",
    level: "Beginner",
    type: "Specialization",
    image: "/online-class-desktop.jpg",
    href: "/catalog/ai-instructor-studio"
  },
  {
    title: "IBM Data Science",
    provider: "IBM",
    level: "Beginner",
    type: "Professional Certificate",
    image: "/online-class-laptop.jpg",
    href: "/catalog/compliance-bootcamp"
  }
];

const testimonials: Testimonial[] = [
  {
    name: "Abigail P.",
    text: "I have a full-time job and 3 kids. I needed the flexibility offered by this platform to achieve my goals.",
    image: "/hero-learning-meeting.jpg"
  },
  {
    name: "Shi Jie F.",
    text: "Every course feels practical, and I get more value out of my subscription each month.",
    image: "/online-class-desktop.jpg"
  },
  {
    name: "Ines K.",
    text: "I can try new topics, switch paths, and keep learning momentum without extra friction.",
    image: "/online-class-laptop.jpg"
  }
];

const individualPlans: PlanCard[] = [
  {
    title: "Single learning program",
    subtitle: "Learn a single topic or skill and earn a credential",
    priceLine: "$20/month",
    ctaLabel: "Browse programs",
    notes: ["Access all courses within the selected learning program", "Earn a certificate after successful completion"]
  },
  {
    title: "LMS Plus Monthly",
    subtitle: "Complete multiple courses and earn credentials in the short term",
    priceLine: "$24/month",
    ctaLabel: "Start 7-day free trial",
    highlighted: true,
    notes: ["Access 10,000+ courses and specializations", "Earn unlimited certificates while subscribed", "Cancel anytime"]
  },
  {
    title: "LMS Plus Annual",
    subtitle: "Combine flexibility and savings with long-term learning goals",
    priceLine: "$96/year",
    ctaLabel: "Save now",
    notes: ["Everything in monthly plan", "Save more when you pay upfront", "14-day money-back guarantee"]
  }
];

const teamPlans: PlanCard[] = [
  {
    title: "Team Starter",
    subtitle: "Essential upskilling for small groups",
    priceLine: "$399/year",
    ctaLabel: "Start team trial",
    notes: ["5 seats included", "Admin usage dashboard", "Course completion tracking"]
  },
  {
    title: "Team Growth",
    subtitle: "Structured learning paths for scaling teams",
    priceLine: "$899/year",
    ctaLabel: "Talk to sales",
    highlighted: true,
    notes: ["20 seats included", "Skill gap insights", "Dedicated onboarding support"]
  },
  {
    title: "Enterprise",
    subtitle: "Advanced controls for large organizations",
    priceLine: "Custom pricing",
    ctaLabel: "Contact enterprise",
    notes: ["SSO and role governance", "Compliance-ready reporting", "Priority support SLA"]
  }
];

const faqItems = [
  "Can I try LMS Plus first, to make sure it is right for me?",
  "What is included in LMS Plus?",
  "Will I save money with LMS Plus?",
  "How long does the special offer last?",
  "Are certificates included with the subscription?",
  "Can I cancel anytime?",
  "Do I get access on mobile apps too?",
  "Is this available for team subscriptions?"
];

const toPlanTier = (title: string): "Starter" | "Growth" | "Professional" => {
  if (title.includes("Growth")) {
    return "Growth";
  }

  if (title.includes("Annual") || title.includes("Enterprise")) {
    return "Professional";
  }

  return "Starter";
};

export function LmsHomePage() {
  const { state, currentUser, isAuthenticated, resetDemo, updatePlan } = useMockLms();
  const { theme, mounted, toggleTheme } = useThemeMode();
  const [selectedAudience, setSelectedAudience] = useState<"individual" | "team">("individual");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [showAllFaq, setShowAllFaq] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Business");
  const dashboardHref = isAuthenticated ? dashboardPathForRole(currentUser?.role) : "/login";

  const trackAction = (action: string, target?: string, metadata?: Record<string, unknown>) => {
    void trackMarketingEvent({ action, target, metadata });
  };

  const visibleFaqs = showAllFaq ? faqItems : faqItems.slice(0, 3);
  const activePlans = selectedAudience === "individual" ? individualPlans : teamPlans;
  const publishedCourses = state.courses.filter((course) => course.status === "published");
  const totalLessons = publishedCourses.reduce(
    (count, course) => count + course.modules.reduce((lessonCount, module) => lessonCount + module.lessons.length, 0),
    0
  );
  const queryLower = query.trim().toLowerCase();
  const searchResults = publishedCourses.filter((course) => {
    const matchesQuery =
      queryLower.length === 0 ||
      course.title.toLowerCase().includes(queryLower) ||
      course.description.toLowerCase().includes(queryLower);
    const matchesCategory =
      activeCategory.length === 0 || course.category.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  const curatedResults = useMemo(() => {
    const mapped = searchResults.map((course, index) => {
      const image = index % 3 === 0 ? "/hero-learning-meeting.jpg" : index % 3 === 1 ? "/online-class-desktop.jpg" : "/online-class-laptop.jpg";

      return {
        title: course.title,
        provider: course.category,
        level: "Beginner",
        type: "Specialization",
        image,
        href: `/catalog/${course.id === "course-ai" ? "ai-instructor-studio" : course.id === "course-compliance" ? "compliance-bootcamp" : "future-of-product-teams"}`
      };
    });

    return mapped.slice(0, 3);
  }, [searchResults]);

  return (
    <div className="lms-home-page min-h-screen bg-[#f2f3f7] text-[#0f172a] dark:bg-[#0b1220]">
      <div className="bg-[#0b1220] text-white dark:bg-[#020617]">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-center gap-8 px-4 py-3 text-sm font-semibold">
          {enterpriseLinks.map((item) => (
            <Link key={item.label} href={item.href} className="border-b border-transparent transition hover:border-white/60" onClick={() => trackAction("nav_click", item.label)}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#d6dbe4] bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0f172a]/95">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3" onClick={() => trackAction("nav_click", "Logo")}>
              <Image src="/lms-logo.svg" alt="Smart LMS logo" width={46} height={46} className="h-11 w-11" />
              <span className="text-4xl font-bold leading-none text-[#1A1A2E] dark:text-[#f8fafc]">Smart LMS</span>
            </Link>
            <div className="hidden items-center gap-4 text-sm font-medium text-[#334155] md:flex">
              <Link href="/catalog" onClick={() => trackAction("nav_click", "Explore")}>Explore</Link>
              <Link href="/catalog" onClick={() => trackAction("nav_click", "Degrees")}>Degrees</Link>
            </div>
          </div>
          <div className="hidden max-w-[500px] flex-1 items-center gap-2 rounded-full border border-[#c5cedb] px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-[#64748b]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you want to learn?"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-[#1A1A2E] px-3 py-2 text-[#1A1A2E] transition hover:bg-[#1A1A2E]/10 dark:border-[#E8A020] dark:text-[#E8A020]"
              aria-label={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : "Toggle theme"}
            >
              {mounted && theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </button>
            <Link href="/login" className="text-[#1A1A2E] dark:text-[#f8fafc]" onClick={() => trackAction("cta_click", "Log In")}>Log In</Link>
            <Link href="/signup" className="rounded-lg border border-[#1A1A2E] px-4 py-2 text-[#1A1A2E] dark:border-[#E8A020] dark:text-[#E8A020]" onClick={() => trackAction("cta_click", "Join for Free")}>
              Join for Free
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#1A1A2E] text-white">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="flex items-center gap-3 text-lg font-bold">
              <Image src="/lms-logo.svg" alt="Smart LMS logo" width={34} height={34} className="h-8 w-8" />
              Smart LMS <span className="rounded bg-white/20 px-2 py-0.5 text-sm">PLUS</span>
            </p>
            <h1 className="mt-4 max-w-[18ch] text-[clamp(2.3rem,5.2vw,4rem)] font-bold leading-tight">
              Ends Monday! Career-ready skills. Now 40% off.
            </h1>
            <p className="mt-4 max-w-[65ch] text-base text-white/90">
              Unlimited access to expert-led programs from industry leaders with Smart LMS Plus.
            </p>
            <p className="mt-2 text-2xl font-bold">
              <span className="mr-2 text-white/60 line-through">$160</span>$96/year
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={dashboardHref} className="rounded-lg bg-[#E8A020] px-8 py-3 text-base font-bold text-white" onClick={() => trackAction("cta_click", "Get 40% off - hero")}>
                Get 40% off
              </Link>
              <button
                type="button"
                onClick={() => {
                  trackAction("cta_click", "Reset demo");
                  void resetDemo();
                }}
                className="rounded-lg border border-white/45 px-6 py-3 text-sm font-semibold text-white"
              >
                Reset demo
              </button>
            </div>
            <p className="mt-6 text-sm text-white/85">Offer ends April 27, 2026.</p>
          </div>

          <div className="relative mx-auto w-full max-w-[460px]">
            <div className="overflow-hidden rounded-[14px] border border-white/20 shadow-2xl">
              <Image src="/online-class-desktop.jpg" alt="Learning program visual" width={900} height={620} className="h-[280px] w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-4 rounded-xl bg-white px-4 py-3 text-[#1A1A2E] shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em]">Live learners</p>
              <p className="text-2xl font-bold">{state.billing.activeStudents}+</p>
            </div>
            <div className="absolute -right-4 -top-5 rounded-xl bg-white px-4 py-3 text-[#1A1A2E] shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em]">Certificates</p>
              <p className="text-2xl font-bold">{state.certificates.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-10">
          <h2 className="text-[2rem] font-bold text-[#0f172a]">Learn from 350+ top universities and companies</h2>
          <div className="mt-9 grid grid-cols-2 gap-5 text-center text-xl font-semibold text-[#334155] sm:grid-cols-4 lg:grid-cols-7">
            {logoItems.map((logo) => (
              <div key={logo} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-4">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e8edf7] dark:bg-[#0f172a]">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-12">
          <h3 className="text-4xl font-bold">Invest in your career</h3>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-[#cbd5e1] bg-white p-6">
              <Target className="h-8 w-8 text-[#1A1A2E]" />
              <p className="mt-4 text-2xl font-bold">Explore new skills</p>
              <p className="mt-2 text-sm text-[#475569]">Access thousands of courses in AI, business, technology, and more.</p>
            </div>
            <div className="rounded-lg border border-[#cbd5e1] bg-white p-6">
              <ShieldCheck className="h-8 w-8 text-[#1A1A2E]" />
              <p className="mt-4 text-2xl font-bold">Earn valuable credentials</p>
              <p className="mt-2 text-sm text-[#475569]">Get certificates after every course and boost your hiring profile.</p>
            </div>
            <div className="rounded-lg border border-[#cbd5e1] bg-white p-6">
              <PlayCircle className="h-8 w-8 text-[#1A1A2E]" />
              <p className="mt-4 text-2xl font-bold">Learn from the best</p>
              <p className="mt-2 text-sm text-[#475569]">Join expert-led courses with guided progress across every path.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f4f7] dark:bg-[#111827]">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-4 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <h3 className="max-w-[20ch] text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight">
              Join the 91% of learners who achieved a positive career outcome.
            </h3>
            <Link href={dashboardHref} className="mt-8 inline-flex rounded-lg border border-[#1A1A2E] px-6 py-3 text-base font-semibold text-[#1A1A2E] dark:border-[#E8A020] dark:text-[#E8A020]" onClick={() => trackAction("cta_click", "Get 40% off - outcome")}>
              Get 40% off
            </Link>
          </div>
          <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[16px] border border-[#cbd5e1]">
            <Image src="/online-class-laptop.jpg" alt="Happy learner" width={900} height={620} className="h-[280px] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-[#f3f4f7] dark:bg-[#111827]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16">
          <div className="rounded-[14px] bg-[#e2e8f0] p-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_2.1fr]">
              <div>
                <h3 className="text-[2.2rem] font-bold leading-tight">Career skills that work</h3>
                <Link href={dashboardHref} className="mt-7 inline-flex rounded-lg border border-[#1A1A2E] px-6 py-3 text-base font-semibold text-[#1A1A2E] dark:border-[#E8A020] dark:text-[#E8A020]" onClick={() => trackAction("cta_click", "Get 40% off - skills")}>
                  Get 40% off
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {skillCards.map((course) => (
                  <Link key={course.title} href={course.href} className="overflow-hidden rounded-[12px] border border-[#c7d1e1] bg-white" onClick={() => trackAction("course_click", course.title)}>
                    <Image src={course.image} alt={course.title} width={640} height={360} className="h-44 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-sm text-[#64748b]">{course.provider}</p>
                      <p className="mt-2 text-2xl font-bold leading-tight">{course.title}</p>
                      <p className="mt-3 text-sm text-[#64748b]">{course.level} - {course.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-16">
          <h3 className="text-center text-[clamp(2rem,3.5vw,3.4rem)] font-bold">Search 10,000+ learning programs</h3>
          <div className="mx-auto mt-8 flex max-w-[920px] items-center rounded-xl border border-[#94a3b8] px-4 py-3">
            <Search className="h-5 w-5 text-[#64748b]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full bg-transparent px-3 text-base outline-none"
            />
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-2 text-sm font-bold text-[#1e293b]">Popular</span>
            {popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveCategory(item);
                  trackAction("search_category_click", item);
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  activeCategory === item ? "bg-[#1A1A2E] text-white" : "bg-[#e2e8f0] text-[#334155]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(curatedResults.length > 0 ? curatedResults : skillCards).map((course) => (
              <Link key={course.title} href={course.href} className="overflow-hidden rounded-[12px] border border-[#d1dae8] bg-white" onClick={() => trackAction("search_result_click", course.title)}>
                <Image src={course.image} alt={course.title} width={640} height={360} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <p className="text-sm text-[#64748b]">{course.provider}</p>
                  <p className="mt-2 text-2xl font-bold leading-tight">{course.title}</p>
                  <p className="mt-3 text-sm text-[#64748b]">{course.level} - {course.type}</p>
                </div>
              </Link>
            ))}
          </div>
          {queryLower.length > 0 && (
            <p className="mt-4 text-center text-sm text-[#64748b]">
              {searchResults.length} course match found from published catalog.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#e8edf7] dark:bg-[#0f172a]">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-16">
          <h3 className="text-[clamp(2rem,3.2vw,3.1rem)] font-bold text-[#0f172a] dark:text-[#f8fafc]">What subscribers are achieving through learning</h3>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-[12px] border border-[#ccd5e3] bg-white p-5">
                <div className="flex items-center gap-3">
                  <Image src={item.image} alt={item.name} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                  <p className="text-xl font-bold">{item.name}</p>
                </div>
                <p className="mt-4 text-base leading-8 text-[#334155]">&quot;{item.text}&quot;</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e8edf7] dark:bg-[#0f172a]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16">
          <h3 className="text-center text-[clamp(2rem,3.5vw,3.2rem)] font-bold text-[#0f172a] dark:text-[#f8fafc]">Plans for you or your team</h3>
          <div className="mx-auto mt-8 flex w-full max-w-[460px] rounded-full bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setSelectedAudience("individual");
                trackAction("plan_audience_switch", "For Learners");
              }}
              className={`flex-1 rounded-full px-4 py-3 text-base font-bold ${selectedAudience === "individual" ? "bg-[#1A1A2E] text-white" : "text-[#475569]"}`}
            >
              For Learners
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAudience("team");
                trackAction("plan_audience_switch", "For Teams");
              }}
              className={`flex-1 rounded-full px-4 py-3 text-base font-bold ${selectedAudience === "team" ? "bg-[#1A1A2E] text-white" : "text-[#475569]"}`}
            >
              For Teams
            </button>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {activePlans.map((plan) => (
              <article key={plan.title} className={`rounded-[12px] border bg-white p-6 ${plan.highlighted ? "border-[#1A1A2E] shadow-lg" : "border-[#cbd5e1]"}`}>
                {plan.highlighted ? (
                  <p className="-mt-2 mb-4 rounded-md bg-[#1A1A2E] py-1 text-center text-sm font-bold text-white">Most popular</p>
                ) : null}
                <h4 className="text-4xl font-bold">{plan.title}</h4>
                <p className="mt-3 text-base text-[#475569]">{plan.subtitle}</p>
                <p className="mt-5 text-5xl font-bold">{plan.priceLine}</p>
                <button
                  type="button"
                  onClick={async () => {
                    const planTier = toPlanTier(plan.title);
                    trackAction("plan_click", plan.title, { planTier, audience: selectedAudience });

                    if (isAuthenticated && currentUser?.role === "admin") {
                      await updatePlan(planTier);
                      return;
                    }

                    window.location.href = `/signup?plan=${planTier}`;
                  }}
                  className={`mt-5 w-full rounded-lg py-3 text-base font-bold ${plan.highlighted ? "bg-[#1A1A2E] text-white" : "border border-[#1A1A2E] text-[#1A1A2E]"}`}
                >
                  {plan.ctaLabel}
                </button>
                <div className="mt-6 space-y-3">
                  {plan.notes.map((note) => (
                    <div key={note} className="flex items-start gap-2 text-base text-[#334155]">
                      <Check className="mt-1 h-4 w-4 text-[#E8A020]" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-16">
          <h3 className="text-[clamp(2rem,3vw,3rem)] font-bold">Frequently asked questions</h3>
          <div className="mt-8 rounded-[12px] border border-[#d1dae8]">
            {visibleFaqs.map((question, index) => (
              <div key={question} className="border-b border-[#e2e8f0] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-xl font-semibold"
                >
                  {question}
                  <ChevronDown className={`h-5 w-5 transition ${expandedFaq === index ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === index ? (
                  <p className="px-6 pb-5 text-base leading-8 text-[#475569]">
                    Yes. This flow is connected with Next.js + Laravel APIs and keeps role-based LMS features active.
                  </p>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowAllFaq((prev) => !prev)}
              className="flex w-full items-center justify-center gap-2 px-6 py-5 text-base font-bold text-[#0f172a]"
            >
              {showAllFaq ? "Show less questions" : "Show all 8 frequently asked questions"}
              <ChevronDown className={`h-4 w-4 transition ${showAllFaq ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#1A1A2E] text-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-14 text-center">
          <p className="flex items-center justify-center gap-3 text-6xl font-bold">
            <Image src="/lms-logo.svg" alt="Smart LMS logo" width={54} height={54} className="h-14 w-14" />
            Smart LMS <span className="rounded bg-white/20 px-2 py-1 text-3xl">PLUS</span>
          </p>
          <p className="mx-auto mt-6 max-w-4xl text-xl">
            Unlimited access to expert-led programs from industry leaders.
          </p>
          <p className="mt-3 text-4xl font-bold">
            <span className="mr-3 text-white/60 line-through">$160</span>$96
            <span className="text-xl font-semibold"> /year</span>
          </p>
          <Link href={dashboardHref} className="mt-8 inline-flex rounded-lg bg-[#E8A020] px-8 py-3 text-base font-bold text-white" onClick={() => trackAction("cta_click", "Get 40% off - footer")}>
            Get 40% off
          </Link>

          <h4 className="mt-11 text-6xl font-bold">LMS Offer Terms</h4>
          <p className="mx-auto mt-6 max-w-5xl text-lg leading-9 text-white/90">
            Claim this special limited-time offer by April 27, 2026 11:59 PM UTC. Valid for new subscribers only, limited to one per person.
            Discount is applied at checkout and renews on an annual basis unless cancelled.
          </p>
        </div>
      </section>

      <footer className="bg-[#e2e8f0]">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h5 className="text-4xl font-bold">Skills</h5>
              <ul className="mt-4 space-y-2 text-lg text-[#334155]">
                <li>Accounting</li>
                <li>Artificial Intelligence</li>
                <li>Cybersecurity</li>
                <li>Data Analytics</li>
                <li>Project Management</li>
              </ul>
            </div>
            <div>
              <h5 className="text-4xl font-bold">Professional Certificates</h5>
              <ul className="mt-4 space-y-2 text-lg text-[#334155]">
                <li>Google AI Certificate</li>
                <li>Google Cybersecurity Certificate</li>
                <li>IBM AI Engineering Certificate</li>
                <li>IBM Data Science Certificate</li>
              </ul>
            </div>
            <div>
              <h5 className="text-4xl font-bold">Courses & Specializations</h5>
              <ul className="mt-4 space-y-2 text-lg text-[#334155]">
                <li>AI Essentials Specialization</li>
                <li>Deep Learning Specialization</li>
                <li>Financial Markets Course</li>
                <li>Python for Everybody Specialization</li>
              </ul>
            </div>
            <div>
              <h5 className="text-4xl font-bold">Career Resources</h5>
              <ul className="mt-4 space-y-2 text-lg text-[#334155]">
                <li>Career Aptitude Test</li>
                <li>CompTIA Requirements</li>
                <li>High-Income Skills to Learn</li>
                <li>PMP Certification Requirements</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 grid gap-10 border-t border-[#bfccdf] pt-10 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <div>
              <h6 className="text-4xl font-bold">Smart LMS</h6>
              <div className="mt-4 space-y-2 text-lg text-[#334155]">
                <Link href="/about" onClick={() => trackAction("footer_link_click", "About")}>About</Link>
                <Link href="/about" onClick={() => trackAction("footer_link_click", "Leadership")}>Leadership</Link>
                <Link href="/contact" onClick={() => trackAction("footer_link_click", "Careers")}>Careers</Link>
                <Link href="/catalog" onClick={() => trackAction("footer_link_click", "Catalog")}>Catalog</Link>
              </div>
            </div>
            <div>
              <h6 className="text-4xl font-bold">Community</h6>
              <div className="mt-4 space-y-2 text-lg text-[#334155]">
                <Link href="/student/dashboard" onClick={() => trackAction("footer_link_click", "Learners")}>Learners</Link>
                <Link href="/about" onClick={() => trackAction("footer_link_click", "Partners")}>Partners</Link>
                <Link href="/teacher/dashboard" onClick={() => trackAction("footer_link_click", "Beta Testers")}>Beta Testers</Link>
                <Link href="/features" onClick={() => trackAction("footer_link_click", "Blog")}>Blog</Link>
              </div>
            </div>
            <div>
              <h6 className="text-4xl font-bold">More</h6>
              <div className="mt-4 space-y-2 text-lg text-[#334155]">
                <Link href="/about" onClick={() => trackAction("footer_link_click", "Press")}>Press</Link>
                <Link href="/about" onClick={() => trackAction("footer_link_click", "Investors")}>Investors</Link>
                <Link href="/terms" onClick={() => trackAction("footer_link_click", "Terms")}>Terms</Link>
                <Link href="/privacy" onClick={() => trackAction("footer_link_click", "Privacy")}>Privacy</Link>
                <Link href="/features" onClick={() => trackAction("footer_link_click", "Accessibility")}>Accessibility</Link>
              </div>
            </div>
            <div className="space-y-3">
              <a
                href="https://www.apple.com/app-store/"
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-lg bg-black px-5 py-3 text-sm font-bold text-white"
                onClick={() => trackAction("external_click", "App Store")}
              >
                Download on the App Store
              </a>
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-lg bg-black px-5 py-3 text-sm font-bold text-white"
                onClick={() => trackAction("external_click", "Google Play")}
              >
                Get it on Google Play
              </a>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#94a3b8] px-4 py-2 text-sm font-bold text-[#334155]">
                <CircleDot className="h-4 w-4" /> Certified Corporation
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#bfccdf] pt-6">
            <p className="text-base text-[#475569]">© 2026 Smart LMS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer noopener" onClick={() => trackAction("social_click", "Facebook")}><Facebook className="h-5 w-5 text-[#111827]" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer noopener" onClick={() => trackAction("social_click", "LinkedIn")}><Linkedin className="h-5 w-5 text-[#111827]" /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer noopener" onClick={() => trackAction("social_click", "Twitter")}><Twitter className="h-5 w-5 text-[#111827]" /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer noopener" onClick={() => trackAction("social_click", "YouTube")}><Youtube className="h-5 w-5 text-[#111827]" /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer noopener" onClick={() => trackAction("social_click", "Instagram")}><Instagram className="h-5 w-5 text-[#111827]" /></a>
              <Link href="/features" onClick={() => trackAction("social_click", "Featured")}><Star className="h-5 w-5 text-[#111827]" /></Link>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#64748b]">
            Published courses: {publishedCourses.length} · Total lessons: {totalLessons} · Assessments: {state.assessments.length}
          </p>
        </div>
      </footer>
    </div>
  );
}
