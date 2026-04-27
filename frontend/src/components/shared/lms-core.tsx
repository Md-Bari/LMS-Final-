"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

import type { Certificate, Course, TenantBranding } from "@/lib/mock-lms";

export const pageFrame = "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8";

export function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadHtmlFile(filename: string, content: string) {
  downloadTextFile(filename, content, "text/html;charset=utf-8");
}

export function SeeMoreButton({
  expanded,
  remaining,
  onClick
}: {
  expanded: boolean;
  remaining: number;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-foreground/15 bg-white/90 px-5 py-2 text-sm font-semibold text-foreground shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white dark:border-white/10 dark:bg-[#13212a]"
      >
        {expanded ? "Show less" : `See more (${remaining} more)`}
      </button>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildCertificateHtml({
  certificate,
  branding
}: {
  certificate: Certificate;
  branding: TenantBranding;
}) {
  const studentName = escapeHtml(certificate.studentName);
  const courseTitle = escapeHtml(certificate.courseTitle);
  const certificateNumber = escapeHtml(certificate.certificateNumber || `BETO-${certificate.courseId}`);
  const verificationCode = escapeHtml(certificate.verificationCode);
  const issuedAt = new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const institutionName = escapeHtml(branding.tenantName || "Smart LMS");
  const logoText = escapeHtml((branding.logoText || "BT").slice(0, 3).toUpperCase());
  const customDomain = escapeHtml(branding.customDomain || "betopiaacademy.com");
  const primary = branding.primaryColor || "#1f4f73";
  const accent = branding.accentColor || "#c8942d";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${studentName} Certificate</title>
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --ink: #1f425b;
      --paper: #fbfcfe;
      --border: #c8942d;
      --soft: #f5efe3;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(135deg, rgba(18, 74, 115, 0.96) 0 18%, transparent 18% 82%, rgba(18, 74, 115, 0.96) 82% 100%),
        linear-gradient(45deg, transparent 0 7%, rgba(200, 148, 45, 0.96) 7% 9%, transparent 9% 91%, rgba(200, 148, 45, 0.96) 91% 93%, transparent 93% 100%),
        linear-gradient(135deg, #f4f7fb, #eef3f8);
      display: grid;
      place-items: center;
      padding: 26px;
      color: var(--ink);
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .sheet {
      position: relative;
      width: min(1180px, 100%);
      min-height: 790px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,252,255,0.96));
      box-shadow: 0 40px 100px rgba(12, 30, 46, 0.18);
      overflow: hidden;
    }
    .sheet::before {
      content: "";
      position: absolute;
      inset: 28px;
      border: 4px solid var(--border);
      pointer-events: none;
    }
    .sheet::after {
      content: "";
      position: absolute;
      inset: 44px;
      border: 2px solid var(--border);
      pointer-events: none;
    }
    .corner {
      position: absolute;
      width: 128px;
      height: 128px;
      border: 5px solid var(--border);
    }
    .corner::after {
      content: "";
      position: absolute;
      inset: 14px;
      border: 3px solid var(--border);
    }
    .corner-tl {
      top: 58px;
      left: 56px;
      border-right: 0;
      border-bottom: 0;
    }
    .corner-tr {
      top: 58px;
      right: 56px;
      border-left: 0;
      border-bottom: 0;
    }
    .corner-bl {
      bottom: 58px;
      left: 56px;
      border-right: 0;
      border-top: 0;
    }
    .corner-br {
      bottom: 58px;
      right: 56px;
      border-left: 0;
      border-top: 0;
    }
    .inner {
      position: relative;
      z-index: 1;
      padding: 78px 94px 70px;
      text-align: center;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }
    .brand-mark {
      width: 66px;
      height: 66px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, var(--primary), #143a58);
      color: #fff;
      border: 4px solid rgba(200, 148, 45, 0.42);
      font-size: 24px;
      font-weight: 700;
      box-shadow: 0 18px 30px rgba(20, 58, 88, 0.18);
    }
    .brand-copy h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.04em;
      text-align: left;
    }
    .brand-copy p {
      margin: 4px 0 0;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(31, 66, 91, 0.6);
      text-align: left;
    }
    .title {
      margin: 14px 0 14px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 104px;
      line-height: 0.92;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--primary);
      font-weight: 500;
    }
    .subtitle {
      width: min(760px, 100%);
      margin: 0 auto;
      padding: 18px 18px 14px;
      border-top: 5px solid var(--border);
      border-bottom: 5px solid var(--border);
      font-size: 34px;
      letter-spacing: 0.08em;
      color: var(--primary);
    }
    .presented {
      margin: 54px 0 0;
      font-size: 18px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(31, 66, 91, 0.76);
    }
    .name {
      margin: 20px 0 14px;
      font-size: 118px;
      line-height: 0.95;
      font-weight: 400;
      color: var(--primary);
      font-family: "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive;
    }
    .body-copy {
      width: min(980px, 100%);
      margin: 0 auto;
      padding-top: 18px;
      border-top: 5px solid var(--border);
      font-size: 18px;
      line-height: 1.55;
      letter-spacing: 0.08em;
      color: rgba(31, 66, 91, 0.9);
    }
    .course-line {
      margin: 38px auto 0;
      max-width: 880px;
    }
    .course {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 36px;
      font-weight: 500;
      color: var(--primary);
    }
    .details {
      margin-top: 12px;
      font-size: 15px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(31, 66, 91, 0.72);
    }
    .seal {
      width: 108px;
      height: 108px;
      margin: 44px auto 28px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, var(--primary), #27597d);
      position: relative;
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      text-align: center;
      font-size: 12px;
      line-height: 1.2;
      box-shadow: 0 18px 40px rgba(31, 66, 91, 0.2);
      border: 6px solid rgba(200, 148, 45, 0.78);
    }
    .seal::after {
      content: "";
      position: absolute;
      inset: 12px;
      border: 2px solid rgba(255,255,255,0.55);
      border-radius: 50%;
    }
    .footer {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 30px;
      margin-top: 8px;
    }
    .sign {
      text-align: center;
    }
    .line {
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(200,148,45,0.95), transparent);
      margin-bottom: 16px;
    }
    .sign strong {
      display: block;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 24px;
      color: var(--primary);
    }
    .sign span {
      display: block;
      margin-top: 6px;
      font-size: 16px;
      color: var(--primary);
    }
    .meta {
      text-align: center;
      font-size: 12px;
      line-height: 1.9;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(31, 66, 91, 0.68);
    }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; width: 100%; min-height: 100vh; }
    }
  </style>
</head>
<body>
  <article class="sheet">
    <span class="corner corner-tl"></span>
    <span class="corner corner-tr"></span>
    <span class="corner corner-bl"></span>
    <span class="corner corner-br"></span>

    <section class="inner">
      <div class="brand">
        <div class="brand-mark">${logoText}</div>
        <div class="brand-copy">
          <h1>${institutionName}</h1>
          <p>Learning Excellence Award</p>
        </div>
      </div>
      <h2 class="title">Certificate</h2>
      <p class="subtitle">${courseTitle}</p>
      <p class="presented">This certificate is proudly presented to</p>
      <h3 class="name">${studentName}</h3>
      <p class="body-copy">
        For successfully completing the required lessons, assessments, and course milestones with distinction on the
        ${institutionName} learning platform.
      </p>
      <div class="course-line">
        <div class="course">${institutionName}</div>
        <div class="details">Issued on ${escapeHtml(issuedAt)}  |  Certificate no ${certificateNumber}</div>
      </div>
      <div class="seal">Verified<br />Seal</div>

      <footer class="footer">
      <div class="sign">
        <div class="line"></div>
        <strong>Academic Director</strong>
        <span>${institutionName}</span>
      </div>
      <div class="meta">
        <div>Verification code ${verificationCode}</div>
        <div>${customDomain}</div>
        <div>Smart LMS Certified</div>
      </div>
      <div class="sign">
        <div class="line"></div>
        <strong>Program Manager</strong>
        <span>Smart LMS</span>
      </div>
      </footer>
    </section>
  </article>
</body>
</html>`;
}

export function emailForName(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")}@betopiaacademy.com`;
}

export function openMailDraft({
  to = "",
  bcc = [],
  subject,
  body
}: {
  to?: string;
  bcc?: string[];
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);

  if (bcc.length) {
    params.set("bcc", bcc.join(","));
  }

  window.location.href = `mailto:${to}?${params.toString()}`;
}

export function readNoteFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (["txt", "md", "json", "csv"].includes(extension)) {
    return file.text();
  }

  return Promise.resolve(
    [
      `Uploaded file: ${file.name}`,
      `Detected type: ${file.type || extension || "unknown"}`,
      "Frontend preview mode is active.",
      "When backend is implemented, this file should be sent to the upload endpoint for OCR/document parsing before AI question generation."
    ].join(" ")
  );
}

export function percentageForStudent(course: Course, studentName: string) {
  const lessons = course.modules.flatMap((module) => module.lessons);
  if (!lessons.length) {
    return 0;
  }

  const completed = lessons.filter((lesson) => lesson.completedBy.includes(studentName)).length;
  return Math.round((completed / lessons.length) * 100);
}

export function courseLessonCount(course: Course) {
  return course.modules.reduce((total, module) => total + module.lessons.length, 0);
}

export function Section({
  title,
  subtitle,
  children,
  accent = false
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[24px] border p-6 shadow-soft transition-all duration-300 ${
        accent
          ? "border-[#E8A020]/25 bg-[linear-gradient(150deg,#17304d_0%,#1f3d5e_58%,#c88b2c_100%)] text-white shadow-glow dark:border-[#E8A020]/20 dark:bg-[linear-gradient(150deg,#0a1a2f_0%,#11243d_60%,#8b5e1a_100%)]"
          : "border-border/70 bg-card/80 backdrop-blur-[12px] dark:border-white/10 dark:bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl">{title}</h2>
        {subtitle ? (
          <p className={`text-sm leading-6 ${accent ? "text-white/75" : "text-muted-foreground"}`}>{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon,
  className = ""
}: {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group min-w-0 overflow-hidden rounded-[24px] border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_45px_-28px_rgba(39,120,140,0.45)] dark:border-white/8 dark:bg-white/5 ${className}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-xs uppercase tracking-[0.22em] text-muted-foreground text-pretty-wrap">{label}</p>
        {icon ? (
          <div className="shrink-0 rounded-[18px] bg-primary/10 p-2.5 text-primary dark:bg-white/10 dark:text-[#E8A020]">
            {icon}
          </div>
        ) : null}
      </div>
      <p className="mt-3 max-w-full overflow-hidden text-pretty-wrap break-words font-serif text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-[1.05]">
        {value}
      </p>
      {note ? <p className="mt-2 text-sm text-muted-foreground text-pretty-wrap">{note}</p> : null}
    </div>
  );
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur dark:border-white/8 dark:bg-white/5 ${className}`}
    >
      {children}
    </span>
  );
}

export function MetricGrid({
  items
}: {
  items: Array<{ label: string; value: string; note?: string; icon?: ReactNode }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} className="min-h-[8.2rem]" />
      ))}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-[3.35rem] w-full rounded-[14px] border border-border/80 bg-card px-4 py-3 text-sm shadow-soft outline-none transition placeholder:text-muted-foreground/70 focus:border-[#E8A020]/70 focus:ring-2 focus:ring-[#E8A020]/15 dark:border-white/8 dark:bg-white/5 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[160px] w-full rounded-[14px] border border-border/80 bg-card px-4 py-3 text-sm shadow-soft outline-none transition placeholder:text-muted-foreground/70 focus:border-[#E8A020]/70 focus:ring-2 focus:ring-[#E8A020]/15 dark:border-white/8 dark:bg-white/5 ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-[3.35rem] w-full rounded-[14px] border border-border/80 bg-card px-4 py-3 text-sm shadow-soft outline-none transition focus:border-[#E8A020]/70 focus:ring-2 focus:ring-[#E8A020]/15 dark:border-white/8 dark:bg-white/5 ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#216a83_0%,#2b7e95_56%,#d79a3d_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(43,126,149,0.55)] ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_-20px_rgba(43,126,149,0.6)] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full border border-foreground/15 bg-card/85 px-5 py-3 text-sm font-semibold text-foreground shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card dark:border-white/10 dark:bg-white/5 ${props.className ?? ""}`}
    />
  );
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`${pageFrame} pb-7 pt-10 md:pb-8`}>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="workspace-reveal relative overflow-hidden rounded-[30px] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,248,234,0.72)_42%,rgba(242,248,247,0.86))] px-7 py-8 shadow-[0_28px_60px_-40px_rgba(24,40,72,0.42)] backdrop-blur-[16px] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
          <div className="pointer-events-none absolute inset-y-0 right-[6%] w-36 rounded-full bg-[radial-gradient(circle,rgba(232,160,32,0.12),transparent_68%)] blur-2xl" />
          <div className="pointer-events-none absolute -left-8 top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(29,78,216,0.08),transparent_70%)] blur-2xl" />
          <p className="inline-flex rounded-full border border-foreground/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground shadow-soft dark:border-white/10 dark:bg-white/5">
            {eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.96] text-balance md:text-6xl dark:text-white/95">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground dark:text-white/60">{description}</p>
        </div>
        <div className="workspace-reveal workspace-delay-1 ambient-float soft-shimmer rounded-[28px] border border-foreground/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(255,248,240,0.72))] p-5 shadow-[0_30px_60px_-42px_rgba(31,41,55,0.45)] lg:mt-8 lg:max-w-[25rem] lg:justify-self-end dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground dark:text-white/50">Working frontend flows</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Multi-tenant branding</Badge>
            <Badge>AI assessments</Badge>
            <Badge>Live classes</Badge>
            <Badge>Compliance exports</Badge>
            <Badge>Certificates</Badge>
            <Badge>Billing logic</Badge>
          </div>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
