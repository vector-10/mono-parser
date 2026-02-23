"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import {
  Shield,
  Copy,
  Check,
  Zap,
  Webhook,
  Key,
  AlertTriangle,
  BookOpen,
  Menu,
  X,
} from "lucide-react";


function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-800 my-4">
      <div className="flex items-center justify-between bg-[#0d1117] px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[#59a927]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-[#0d1117] text-gray-300 text-xs sm:text-sm font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}




function MethodBadge({ method }: { method: "POST" | "GET" | "DELETE" }) {
  const colours = {
    POST: "bg-[#0055ba]/10 text-[#0055ba]",
    GET: "bg-[#59a927]/10 text-[#59a927]",
    DELETE: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${colours[method]}`}
    >
      {method}
    </span>
  );
}


function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mb-16">
      {children}
    </section>
  );
}


function Callout({
  type,
  children,
}: {
  type: "info" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-[#0055ba]/5 border-[#0055ba]/20 text-[#003d85]",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-[#59a927]/5 border-[#59a927]/20 text-[#3a6e18]",
  };
  const icons = {
    info: <Shield className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
    success: <Check className="h-4 w-4 shrink-0 mt-0.5" />,
  };
  return (
    <div
      className={`flex gap-3 border rounded-lg p-4 text-sm my-4 ${styles[type]}`}
    >
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}


function FieldTable({
  fields,
}: {
  fields: { name: string; type: string; required?: boolean; desc: string }[];
}) {
  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">
              Field
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">
              Type
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide hidden sm:table-cell">
              Required
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map((f) => (
            <tr key={f.name} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-mono text-xs text-[#0055ba] font-semibold whitespace-nowrap">
                {f.name}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                {f.type}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {f.required !== false ? (
                  <span className="text-xs font-medium text-red-600">Yes</span>
                ) : (
                  <span className="text-xs text-gray-400">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed">
                {f.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


const navItems = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "integration-flow", label: "Integration Flow" },
  {
    id: "api-reference",
    label: "API Reference",
    children: [
      { id: "initiate", label: "Initiate Application" },
      { id: "link-account", label: "Link Account" },
      { id: "analyze", label: "Analyze Application" },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    children: [
      { id: "wh-account-linked", label: "account.linked" },
      { id: "wh-enrichment-ready", label: "account.enrichment_ready" },
      { id: "wh-decision", label: "application.decision" },
    ],
  },
  { id: "decision-object", label: "Decision Object" },
  { id: "score-bands", label: "Score Bands" },
  { id: "errors", label: "Error Handling" },
  { id: "fintech-notes", label: "Notes for Fintechs" },
];


export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const allIds = navItems.flatMap((n) => [
      n.id,
      ...(n.children?.map((c) => c.id) ?? []),
    ]);

    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.current!.observe(el);
    });

    return () => observer.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNavOpen(false);
  };

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => scrollTo(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition font-medium ${
              activeSection === item.id
                ? "bg-[#0055ba]/10 text-[#0055ba]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </button>
          {item.children && (
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
              {item.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => scrollTo(child.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition ${
                    activeSection === child.id
                      ? "text-[#0055ba] font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {child.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white font-[var(--font-dm-sans)]">
      {/* ── Site Header (reuses landing page header with all its effects) ── */}
      <Header />

      {/* ── Mobile TOC toggle bar (below header, docs-only) ── */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Contents
        </span>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#0055ba] hover:text-[#004494] transition"
        >
          {mobileNavOpen ? (
            <>
              <X className="h-4 w-4" /> Close
            </>
          ) : (
            <>
              <Menu className="h-4 w-4" /> Browse
            </>
          )}
        </button>
      </div>

      {/* ── Mobile TOC Overlay ── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── Mobile TOC Drawer ── */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 lg:hidden transform transition-transform duration-300 overflow-y-auto p-4 pt-20 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">
            Table of Contents
          </span>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <NavContent />
      </div>

      <div className="max-w-7xl mx-auto flex pt-16">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 p-6">
          <NavContent />
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-10 max-w-4xl">
          {/* ── OVERVIEW ── */}
          <Section id="overview">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#0055ba]/20 bg-[#0055ba]/5 px-3 py-1.5 text-xs font-medium text-[#0055ba] mb-4">
                <BookOpen className="h-3.5 w-3.5" /> Mono Parser API Documentation
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                Introduction
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Our suite of APIs enable Loan Officers make data-driven lending decisions and underwrite loans at scale.
                Connect your applicants&apos; bank accounts via Mono, and
                receive a detailed loan decision backed by reliable finance metrics —
                all through a simple webhook-driven flow.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                {
                  icon: <Zap className="h-5 w-5 text-[#0055ba]" />,
                  title: "Three API calls",
                  desc: "Initiate → Link Account → Analyze. Everything else is automated.",
                },
                {
                  icon: <Webhook className="h-5 w-5 text-[#0055ba]" />,
                  title: "Webhook-driven",
                  desc: "Results are pushed to your registered webhook URL asynchronously.",
                },
                {
                  icon: <Key className="h-5 w-5 text-[#0055ba]" />,
                  title: "API key auth",
                  desc: "All external endpoints use your secret API key — no OAuth needed.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="w-9 h-9 bg-[#0055ba]/10 rounded-lg flex items-center justify-center mb-3">
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                Base URL
              </h3>
              <CodeBlock code="https://api.mono-parser.shop/api" lang="http" />
              <p className="text-xs text-gray-500 mt-2">
                All endpoints are prefixed with{" "}
                <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">
                  /api
                </code>
                . Use HTTPS at all times.
              </p>
            </div>
          </Section>

          {/* ── AUTHENTICATION ── */}
          <Section id="authentication">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication
            </h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                TO make API calls, you would need an API key, login and copy yours from your {" "}
              <Link
                href="/dashboard"
                className="text-[#0055ba] hover:underline"
              >
                dashboard
              </Link>{" "}
              under Settings → API Keys.
            </p>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                Header
              </h3>
              <CodeBlock
                code={`x-api-key: mp_live_your_secret_key_here`}
                lang="http"
              />
            </div>

            <Callout type="warning">
              <strong>Keep your API key secret.</strong> Never expose it in
              client-side code, mobile apps, or version control. If compromised,
              rotate it immediately from your dashboard. Your key grants full
              access to all your applicants and applications.
            </Callout>

            {/* <Callout type="info">
              All API keys begin with the prefix{" "}
              <code className="bg-[#0055ba]/10 px-1 py-0.5 rounded text-xs font-mono">
                mp_live_
              </code>
              . Test keys (sandbox mode) will be prefixed with{" "}
              <code className="bg-[#0055ba]/10 px-1 py-0.5 rounded text-xs font-mono">
                mp_test_
              </code>
              .
            </Callout> */}
          </Section>

          {/* ── INTEGRATION FLOW ── */}
          <Section id="integration-flow">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Integration Flow
            </h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              The complete lifecycle of a loan application — from initiating to
              receiving a decision — involves three API calls on your end and
              three webhook events from our side.
            </p>

            <div className="space-y-3 mb-8">
              {[
                {
                  step: "1",
                  title: "POST /applications/initiate",
                  desc: "Create the applicant and application. Receive a Mono Connect widget URL.",
                  tag: "Your call",
                  colour: "bg-[#0055ba]",
                },
                {
                  step: "2",
                  title: "Open the widget URL",
                  desc: "Redirect or embed the widgetUrl so your applicant can link their bank account through Mono Connect.",
                  tag: "User action",
                  colour: "bg-[#0055ba]",
                },
                {
                  step: "3",
                  title: "account.linked webhook",
                  desc: "We notify your webhook URL that the bank account is linked. Enrichment begins automatically.",
                  tag: "We send",
                  colour: "bg-[#0055ba]",
                },
                {
                  step: "4",
                  title: "account.enrichment_ready webhook",
                  desc: "Both income analysis and statement insights are ready. The applicationId is included — trigger analysis now.",
                  tag: "We send",
                  colour: "bg-[#0055ba]",
                },
                {
                  step: "5",
                  title: "POST /applications/:id/analyze",
                  desc: "Trigger loan analysis. Use the applicationId from the enrichment_ready event.",
                  tag: "Your call",
                  colour: "bg-[#0055ba]",
                },
                {
                  step: "6",
                  title: "application.decision webhook",
                  desc: "The full scored decision object is delivered to your webhook URL.",
                  tag: "We send",
                  colour: "bg-[#0055ba]",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition"
                >
                  <div
                    className={`w-8 h-8 ${item.colour} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <code className="text-xs font-mono font-semibold text-gray-900">
                        {item.title}
                      </code>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.tag === "Your call"
                            ? "bg-[#0055ba]/10 text-[#0055ba]"
                            : item.tag === "User action"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                
                </div>
              ))}
            </div>

            <Callout type="success">
              <strong>Wait for enrichment_ready before calling analyze.</strong>{" "}
              Calling <code>/analyze</code> endpoint before enrichment is complete will
              result in a lower-quality decision. The{" "}
              <code>account.enrichment_ready</code> webhook is your reliable
              signal to proceed.
            </Callout>
          </Section>

          {/* ── API REFERENCE ── */}
          <Section id="api-reference">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              API Reference
            </h2>
            <p className="text-gray-600 text-sm mb-8">
              All endpoints require the{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                x-api-key
              </code>{" "}
              header.
            </p>

            {/* ── INITIATE ── */}
            <div id="initiate" className="scroll-mt-28 mb-12">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <MethodBadge method="POST" />
                <code className="text-sm font-mono font-semibold text-gray-900">
                  /api/applications/initiate
                </code>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Initiate Application
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Creates an applicant record and a loan application in one call.
                Returns a Mono Connect{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  widgetUrl
                </code>{" "}
                you should present to your user so they can link their bank
                account.
              </p>

              <h4 className="font-semibold text-gray-800 text-sm mb-2">
                Request Body
              </h4>
              <FieldTable
                fields={[
                  {
                    name: "firstName",
                    type: "string",
                    desc: "Applicant's first name (2–100 chars). Must match their bank account name.",
                  },
                  {
                    name: "lastName",
                    type: "string",
                    desc: "Applicant's last name (2–100 chars). Must match their bank account name.",
                  },
                  {
                    name: "email",
                    type: "string",
                    desc: "Valid email address for the applicant.",
                  },
                  {
                    name: "phone",
                    type: "string",
                    required: false,
                    desc: "Phone number (10–15 chars). Optional.",
                  },
                  {
                    name: "bvn",
                    type: "string",
                    required: false,
                    desc: "11-digit BVN. Enables credit bureau lookup during analysis.",
                  },
                  {
                    name: "amount",
                    type: "number",
                    desc: "Loan amount in Naira (smallest unit — kobo not required).",
                  },
                  {
                    name: "tenor",
                    type: "number",
                    desc: "Loan tenor in months (e.g. 6, 12, 24).",
                  },
                  {
                    name: "interestRate",
                    type: "number",
                    desc: "Monthly interest rate as a percentage (e.g. 5.0 for 5%).",
                  },
                  {
                    name: "purpose",
                    type: "string",
                    required: false,
                    desc: "Loan purpose description. Optional.",
                  },
                ]}
              />

              <h4 className="font-semibold text-gray-800 text-sm mb-2 mt-6">
                Sample Request
              </h4>
              <CodeBlock
                lang="bash"
                code={`curl -X POST https://api.mono-parser.com/api/applications/initiate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: mp_live_your_secret_key" \\
  -d '{
    "firstName": "Olusegun",
    "lastName": "Adeyemi",
    "email": "olusegun.adeyemi@example.com",
    "phone": "08012345678",
    "bvn": "22345678901",
    "amount": 500000,
    "tenor": 12,
    "interestRate": 5.0,
    "purpose": "Business expansion"
  }'`}
              />

              <h4 className="font-semibold text-gray-800 text-sm mb-2 mt-4">
                Response
              </h4>
              <CodeBlock
                lang="json"
                code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "applicantId": "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
  "widgetUrl": "https://connect.withmono.com/?key=...&reference=...",
  "status": "PENDING_LINKING"
}`}
              />

              <Callout type="info">
                <strong>Store both IDs.</strong> The <code>applicationId</code>{" "}
                is used in all subsequent calls. The <code>widgetUrl</code>{" "}
                should be opened in a browser for the applicant — either as a
                redirect or inside an iframe/modal. Mono Connect will close
                automatically after the user links their account.
              </Callout>
            </div>

            {/* ── LINK ACCOUNT ── */}
            <div id="link-account" className="scroll-mt-28 mb-12">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <MethodBadge method="POST" />
                <code className="text-sm font-mono font-semibold text-gray-900">
                  /api/applications/:id/link-account
                </code>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Link Account
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Re-generates a fresh Mono Connect widget URL for an existing
                application. Use this when an applicant needs to re-link their
                account (e.g. the session expired, they closed the widget
                without completing, or you want to link an additional account).
              </p>

              <h4 className="font-semibold text-gray-800 text-sm mb-2">
                Path Parameter
              </h4>
              <FieldTable
                fields={[
                  {
                    name: ":id",
                    type: "string (UUID)",
                    desc: "The applicationId returned from the initiate endpoint.",
                  },
                ]}
              />

              <h4 className="font-semibold text-gray-800 text-sm mb-2 mt-6">
                Sample Request
              </h4>
              <CodeBlock
                lang="bash"
                code={`curl -X POST https://api.mono-parser.com/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/link-account \\
  -H "x-api-key: mp_live_your_secret_key"`}
              />

              <h4 className="font-semibold text-gray-800 text-sm mb-2 mt-4">
                Response
              </h4>
              <CodeBlock
                lang="json"
                code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "widgetUrl": "https://connect.withmono.com/?key=...&reference=...",
  "status": "PENDING_LINKING"
}`}
              />

              <Callout type="warning">
                This endpoint will return an error if the application is already
                in a terminal state (<code>COMPLETED</code> or{" "}
                <code>FAILED</code>). You cannot re-link accounts after a final
                decision has been issued. You can just start the loan process again by calling the initiate endpoint to create a new application.
              </Callout>
            </div>

            {/* ── ANALYZE ── */}
            <div id="analyze" className="scroll-mt-28 mb-12">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <MethodBadge method="POST" />
                <code className="text-sm font-mono font-semibold text-gray-900">
                  /api/applications/:id/analyze
                </code>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analyze Application
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Queues the loan analysis job. The scoring engine reads all
                enriched bank data from our database and sends the decision to
                your webhook URL. 
              </p>

              <h4 className="font-semibold text-gray-800 text-sm mb-2">
                Path Parameter
              </h4>
              <FieldTable
                fields={[
                  {
                    name: ":id",
                    type: "string (UUID)",
                    desc: "The applicationId. Use the value from the account.enrichment_ready webhook for the best result.",
                  },
                ]}
              />

              <h4 className="font-semibold text-gray-800 text-sm mb-2 mt-6">
                Sample Request
              </h4>
              <CodeBlock
                lang="bash"
                code={`curl -X POST https://api.mono-parser.com/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/analyze \\
  -H "x-api-key: mp_live_your_secret_key"`}
              />

              <h4 className="font-semibold text-gray-800 text-sm mb-2 mt-4">
                Response
              </h4>
              <CodeBlock
                lang="json"
                code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "status": "PROCESSING",
  "message": "Analysis queued."
}`}
              />

              <Callout type="warning">
                <strong>
                  Call this only after receiving{" "}
                  <code>account.enrichment_ready</code>.
                </strong>{" "}
                If the bank account has no linked accounts yet, this endpoint
                will return a 400 error.
              </Callout>
            </div>
          </Section>

          {/* ── WEBHOOKS ── */}
          <Section id="webhooks">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Webhooks</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Mono-Parser pushes events to your registered webhook URL. All
              webhook payloads share the same envelope shape:
            </p>

            <CodeBlock
              lang="json"
              code={`{
  "event": "event.name",
  "data": { ... },
  "timestamp": "2026-02-20T22:14:35.703Z"
}`}
            />

            <Callout type="info">
              Register your webhook URL in the dashboard under Settings →
              Webhook URL. Your endpoint must respond with HTTP <code>2xx</code>{" "}
              within 10 seconds. Failed deliveries are retried with exponential
              backoff.
            </Callout>

            {/* ── account.linked ── */}
            <div id="wh-account-linked" className="scroll-mt-28 mt-10 mb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
                  EVENT
                </span>
                <code className="font-mono font-semibold text-gray-900 text-sm">
                  account.linked
                </code>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                account.linked
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Fired when a bank account is successfully linked via Mono
                Connect. Enrichment starts automatically after this event — you
                do not need to do anything yet. Wait for{" "}
                <code>account.enrichment_ready</code> before calling analyze.
              </p>
              <CodeBlock
                lang="json"
                code={`{
  "event": "account.linked",
  "data": {
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "accountId":     "dbcc78d5-0719-4344-ac0e-e02a1f865bf0",
    "institution":   "Standard Chartered",
    "accountNumber": "0131883461"
  },
  "timestamp": "2026-02-20T22:04:14.123Z"
}`}
              />
            </div>

            {/* ── account.enrichment_ready ── */}
            <div id="wh-enrichment-ready" className="scroll-mt-28 mb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
                  EVENT
                </span>
                <code className="font-mono font-semibold text-gray-900 text-sm">
                  account.enrichment_ready
                </code>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                account.enrichment_ready
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Fired when all enrichment data (income analysis + statement
                insights) has been collected and stored. This is your signal to
                call <code>/analyze</code>. The <code>applicationId</code> is
                included for convenience — pass it directly to the analyze
                endpoint.
              </p>
              <CodeBlock
                lang="json"
                code={`{
  "event": "account.enrichment_ready",
  "data": {
    "accountId":     "dbcc78d5-0719-4344-ac0e-e02a1f865bf0",
    "monoAccountId": "6998da59bdaef66d5e5f3d0d",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "message":       "Account enrichment complete. You may now submit this applicant for loan analysis."
  },
  "timestamp": "2026-02-20T22:07:55.382Z"
}`}
              />
              <Callout type="success">
                Once you receive this event, call{" "}
                <code>POST /api/applications/{"{applicationId}"}/analyze</code>{" "}
                using the <code>applicationId</code> from the payload.
              </Callout>
            </div>

            {/* ── application.decision ── */}
            <div id="wh-decision" className="scroll-mt-28 mb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
                  EVENT
                </span>
                <code className="font-mono font-semibold text-gray-900 text-sm">
                  application.decision
                </code>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                application.decision
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                The final scored decision. Delivered after analysis completes.
                See the{" "}
                <button
                  onClick={() => scrollTo("decision-object")}
                  className="text-[#0055ba] hover:underline"
                >
                  Decision Object
                </button>{" "}
                section for a full breakdown of all fields.
              </p>
              <CodeBlock
                lang="json"
                code={`{
  "event": "application.decision",
  "data": {
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "status":        "COMPLETED",
    "score":         720,
    "decision": {
      "score":       720,
      "decision":    "APPROVED",
      "score_band":  "LOW_RISK",
      "timestamp":   "2026-02-20T22:14:35.576410Z",
      "applicant_id": "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
      "approval_details": {
        "approved_amount":   500000,
        "approved_tenor":    12,
        "approved_interest": 5.0,
        "monthly_payment":   46667
      },
      "counter_offer": null,
      "risk_factors": [],
      "score_breakdown": {
        "total":               720,
        "cash_flow_health":    180,
        "income_stability":    160,
        "debt_service_capacity": 140,
        "account_behavior":    140,
        "credit_history":      100
      },
      "explainability": {
        "primary_reason":  "Strong income consistency and healthy cash flow",
        "key_strengths":   ["Consistent monthly credits", "Low debt-to-income ratio"],
        "key_weaknesses":  []
      },
      "eligible_tenors":  [6, 12, 18, 24],
      "manual_review_reasons": [],
      "regulatory_compliance": {
        "thin_file":             false,
        "identity_verified":     true,
        "credit_bureau_checked": true,
        "affordability_assessed": true
      }
    }
  },
  "timestamp": "2026-02-20T22:14:35.703Z"
}`}
              />
            </div>
          </Section>

          {/* ── DECISION OBJECT ── */}
          <Section id="decision-object">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Decision Object
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              The <code>decision</code> object inside{" "}
              <code>application.decision</code> contains all scoring output.
            </p>

            <FieldTable
              fields={[
                {
                  name: "score",
                  type: "number",
                  desc: "Overall credit score (350-850). Higher is better.",
                },
                {
                  name: "decision",
                  type: "string",
                  desc: "APPROVED | REJECTED | MANUAL_REVIEW | COUNTER_OFFER",
                },
                {
                  name: "score_band",
                  type: "string",
                  desc: "LOW_RISK | MODERATE_RISK | HIGH_RISK | VERY_HIGH_RISK",
                },
                {
                  name: "approval_details",
                  type: "object | null",
                  required: false,
                  desc: "Present when APPROVED. Contains approved_amount, approved_tenor, approved_interest, monthly_payment.",
                },
                {
                  name: "counter_offer",
                  type: "object | null",
                  required: false,
                  desc: "Present when COUNTER_OFFER. Contains suggested lower amount or shorter tenor.",
                },
                {
                  name: "risk_factors",
                  type: "array",
                  required: false,
                  desc: "List of risk factors that influenced the decision. Each item has factor, severity, and detail.",
                },
                {
                  name: "score_breakdown",
                  type: "object",
                  desc: "Individual scores for: cash_flow_health, income_stability, debt_service_capacity, account_behavior, credit_history.",
                },
                {
                  name: "explainability",
                  type: "object",
                  desc: "Human-readable explanation with primary_reason, key_strengths[], key_weaknesses[].",
                },
                {
                  name: "eligible_tenors",
                  type: "number[]",
                  required: false,
                  desc: "Tenors (in months) for which the applicant qualifies.",
                },
                {
                  name: "manual_review_reasons",
                  type: "string[]",
                  required: false,
                  desc: "Reasons triggering a manual review, if applicable.",
                },
                {
                  name: "regulatory_compliance",
                  type: "object",
                  desc: "Compliance flags: thin_file, identity_verified, credit_bureau_checked, affordability_assessed.",
                },
              ]}
            />

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              Risk Factors
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Each item in <code>risk_factors</code> has this shape:
            </p>
            <CodeBlock
              lang="json"
              code={`{
  "factor":   "IDENTITY_NAME_MISMATCH",
  "severity": "HIGH",
  "detail":   "Submitted name 'John Doe' does not match account holder 'OJO DANIEL'"
}`}
            />

            <FieldTable
              fields={[
                {
                  name: "severity",
                  type: "string",
                  desc: "HIGH — may trigger immediate rejection. MEDIUM / LOW — reduces score without hard knockout.",
                },
                {
                  name: "factor",
                  type: "string",
                  desc: "Machine-readable code for the risk type (e.g. IDENTITY_NAME_MISMATCH, LOW_AVERAGE_BALANCE, IRREGULAR_INCOME).",
                },
                {
                  name: "detail",
                  type: "string",
                  desc: "Human-readable explanation suitable for logging or internal use.",
                },
              ]}
            />
          </Section>

          {/* ── SCORE BANDS ── */}
          <Section id="score-bands">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Score Bands
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Scores run from 0 to 1000. The engine maps raw scores to decision
              bands as follows:
            </p>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Score Range", "Band", "Typical Decision", "Notes"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      range: "700 – 1000",
                      band: "LOW_RISK",
                      decision: "APPROVED",
                      note: "Full approval at requested amount and tenor.",
                      colour: "text-[#59a927]",
                    },
                    {
                      range: "550 – 699",
                      band: "MODERATE_RISK",
                      decision: "COUNTER_OFFER",
                      note: "May be approved at a reduced amount or shorter tenor.",
                      colour: "text-amber-600",
                    },
                    {
                      range: "400 – 549",
                      band: "HIGH_RISK",
                      decision: "MANUAL_REVIEW",
                      note: "Requires manual underwriter review before a decision.",
                      colour: "text-orange-600",
                    },
                    {
                      range: "0 – 399",
                      band: "VERY_HIGH_RISK",
                      decision: "REJECTED",
                      note: "Does not meet minimum credit criteria.",
                      colour: "text-red-600",
                    },
                  ].map((row) => (
                    <tr key={row.band} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                        {row.range}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono text-xs font-bold ${row.colour}`}
                      >
                        {row.band}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">
                        {row.decision}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Callout type="info">
              A score of <strong>0</strong> is not necessarily a data error. It
              can indicate a hard knockout rule fired — such as an identity name
              mismatch or a thin-file applicant. Always check{" "}
              <code>risk_factors</code> and <code>score_breakdown</code> for
              detail.
            </Callout>
          </Section>

          {/* ── ERROR HANDLING ── */}
          <Section id="errors">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Handling
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              All errors follow a consistent shape with an HTTP status code and
              a message field.
            </p>

            <CodeBlock
              lang="json"
              code={`{
  "statusCode": 400,
  "message":    "Cannot link accounts to an application with status: COMPLETED",
  "error":      "Bad Request"
}`}
            />

            <div className="overflow-x-auto rounded-lg border border-gray-200 mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Status", "Meaning", "Common Cause"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      code: "400",
                      meaning: "Bad Request",
                      cause:
                        "Missing required field, invalid value, or the application is in a terminal state.",
                    },
                    {
                      code: "401",
                      meaning: "Unauthorized",
                      cause: "Missing or invalid x-api-key header.",
                    },
                    {
                      code: "404",
                      meaning: "Not Found",
                      cause:
                        "The applicationId or applicantId does not belong to your account.",
                    },
                    {
                      code: "429",
                      meaning: "Too Many Requests",
                      cause:
                        "Rate limit exceeded. /initiate and /analyze are limited to 20 requests per minute.",
                    },
                    {
                      code: "500",
                      meaning: "Internal Server Error",
                      cause:
                        "Unexpected server error. Mono API key not configured, or a downstream service failure.",
                    },
                  ].map((row) => (
                    <tr key={row.code} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-red-600">
                        {row.code}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                        {row.meaning}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.cause}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── NOTES FOR FINTECHS ── */}
          <Section id="fintech-notes">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Notes for Fintechs
            </h2>
            <p className="text-gray-600 text-sm mb-8">
              Important considerations when integrating Mono-Parser into your
              lending product.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: "Names must match exactly",
                  type: "warning" as const,
                  body: `The applicant's first and last name submitted in the initiate call are compared against the identity data returned by Mono from the linked bank account. A mismatch is a HIGH-severity risk factor and will trigger immediate rejection with a score of 0. Always collect the applicant's name as it appears on their bank account — not a nickname or alias.`,
                },
                {
                  title: "Do not call analyze before enrichment_ready",
                  type: "warning" as const,
                  body: `Enrichment is an asynchronous pipeline: income analysis and statement insights take between 30 seconds and 3 minutes to complete. Calling /analyze before both are ready means the scoring engine will have incomplete data, producing a lower-quality (or failed) decision. Wait for the account.enrichment_ready webhook — the applicationId is included for you.`,
                },
                {
                  title: "Each widgetUrl is single-use",
                  type: "info" as const,
                  body: `The Mono Connect widget URL returned by /initiate and /link-account is a one-time-use link tied to a specific session. If the user closes the widget without completing, call /link-account to generate a fresh URL. Do not cache or reuse old widget URLs.`,
                },
                {
                  title: "BVN enables credit bureau checks",
                  type: "info" as const,
                  body: `Providing a BVN in the initiate request enables the scoring engine to run a credit bureau lookup. Without a BVN, the credit_history dimension in score_breakdown will be 0, and regulatory_compliance.credit_bureau_checked will be false. This is not a hard failure, but it reduces the overall score ceiling and may result in a counter-offer instead of a full approval.`,
                },
                {
                  title: "Webhook delivery guarantees",
                  type: "info" as const,
                  body: `Webhooks are delivered at least once. Your endpoint may receive the same event more than once in rare cases (network retry scenarios). Use the applicationId or accountId as an idempotency key on your side. Always respond with HTTP 2xx promptly — do not wait for downstream processing before responding.`,
                },
                {
                  title: "Sandbox vs. production behaviour",
                  type: "info" as const,
                  body: `In sandbox mode, Mono returns synthetic data. Statement insights jobs complete synchronously in sandbox (job_status is 'successful' immediately). Income webhooks still fire asynchronously. All scoring logic is identical — only the underlying bank data differs. Test with realistic amounts and realistic salary patterns for accurate sandbox decision validation.`,
                },
                {
                  title: "One application, one bank account",
                  type: "info" as const,
                  body: `The scoring engine analyses the most recently linked bank account for an applicant. If an applicant has multiple linked accounts, all will be considered during analysis. Re-linking a bank account (calling /link-account) will refresh the existing account data and reset enrichment — the application moves back to PENDING_LINKING status.`,
                },
                {
                  title: "Rate limits",
                  type: "warning" as const,
                  body: `The /initiate and /analyze endpoints are rate-limited to 20 requests per minute per API key. If you exceed this, you will receive a 429 Too Many Requests response. Build backoff and retry logic into your integration. Contact support if you have high-volume batch processing needs.`,
                },
              ].map((note) => (
                <div
                  key={note.title}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div
                    className={`flex items-center gap-3 px-5 py-4 border-b ${
                      note.type === "warning"
                        ? "bg-amber-50 border-amber-100"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    {note.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                      <Shield className="h-4 w-4 text-[#0055ba] shrink-0" />
                    )}
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {note.title}
                    </h3>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {note.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Footer ── */}
          <footer className="border-t border-gray-200 pt-10 mt-10 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Need help? Reach out to{" "}
              <a
                href="mailto:support@mono-parser.com"
                className="text-[#0055ba] hover:underline"
              >
                support@firstsoftware-systems.com
              </a>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#0055ba] font-semibold text-sm hover:underline"
            >
              ← Back to homepage
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
