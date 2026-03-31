import Link from "next/link";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { MethodBadge } from "../components/MethodBadge";

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-7 h-7 bg-[#0055ba] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {number}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

export default function TutorialPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Integration Tutorial
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          A complete integration walkthrough from first API call to receiving a scored
          decision — covering every step your software needs to handle.
        </p>
      </div>

      <Callout type="info">
        <strong>Prerequisites:</strong> You need an active API key and webhook secret. Find both in your dashboard under{" "}
        <strong>Settings</strong>. All requests require the api key for authentication. Remember to save your webhook URL too in the dashboard.
      </Callout>

      {/* ── Flow overview ── */}
      <div className="my-8 border border-gray-200 bg-gray-50 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Full Flow — 4 API calls, 4 webhooks
        </p>
        <ol className="space-y-2">
          {[
            ["POST", "/initiate", "Create applicant + application, get widget URL"],
            ["Widget", "—", "Applicant links their bank account in-browser"],
            ["POST", "/link-account", "Link another account, this endpoint is optional but used to link more accounts per application if needed."],
            ["Webhook", "account.linked", "Account linked; enrichment starts automatically"],
            ["Webhook", "account.enrichment_ready", "Bank data is processed fires a webhook for each account linked"],
            ["POST", "/finalize-linking", "Signal you are done linking accounts"],
            ["Webhook", "application.ready_for_analysis", "All accounts enriched; ready to analyze"],
            ["POST", "/analyze", "Process the creit loan applications"],
            ["Webhook", "application.decision", "Scored decision delivered to your webhook URL"],
          ].map(([badge, path, desc], i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 bg-[#0055ba]/10 text-[#0055ba] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className={`shrink-0 inline-block px-1.5 py-0.5 text-xs font-bold font-mono ${
                badge === "POST"
                  ? "bg-[#0055ba]/10 text-[#0055ba]"
                  : badge === "Webhook"
                  ? "bg-[#59a927]/10 text-[#59a927]"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {badge}
              </span>
              <span className="font-mono text-xs text-gray-700 shrink-0">{path}</span>
              <span className="text-gray-500 text-xs">{desc}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── STEP 1 ── */}
      <section id="step-initiate" className="scroll-mt-28 mt-10 mb-10">
        <StepHeader number={1} title="Initiate the Application" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          This single call creates the applicant record, creates the loan
          application, and returns a Mono Connect <code>widgetUrl</code> you
          give to your user. Store the <code>applicationId</code> — every
          subsequent call uses it.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/initiate
          </code>
        </div>

        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/initiate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: mp_live_your_secret_key" \\
  -d '{
    "firstName":    "Olusegun",
    "lastName":     "Adeyemi",
    "email":        "olusegun.adeyemi@example.com",
    "phone":        "08012345678",
    "bvn":          "22345678901",
    "amount":       500000,
    "tenor":        12,
    "interestRate": 2.0,
    "purpose":      "Business expansion"
  }'`}
        />

        <CodeBlock
          lang="json"
          code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
  "widgetUrl":     "https://connect.withmono.com/?key=...&reference=...",
  "status":        "PENDING_LINKING"
}`}
        />

        <Callout type="info">
          Store <code>applicationId</code> and <code>applicantId</code> against
          your user record. The widget URL is single-use and expires — redirect
          or present it immediately. Do not call it yourself; it is for the
          applicant&apos;s browser.
        </Callout>
      </section>

      {/* ── STEP 2 ── */}
      <section id="step-widget" className="scroll-mt-28 mb-10">
        <StepHeader number={2} title="Open the Mono Connect Widget" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Redirect the applicant to the <code>widgetUrl</code>, or open it
          inside a modal. Mono handles the full bank-linking flow. When the
          applicant completes linking, Mono closes the widget and you will
          receive the <code>account.linked</code> webhook on your registered
          URL.
        </p>
        <Callout type="warning">
          Do not poll or wait in your API layer. The rest of the flow is
          entirely event-driven via webhooks. Return a &quot;pending&quot;
          state to your user and update them when you receive the decision.
        </Callout>
      </section>

      {/* ── STEP 3 ── */}
      <section id="step-account-linked" className="scroll-mt-28 mb-10">
        <StepHeader number={3} title="Receive account.linked" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          After the applicant completes the Mono widget, we fire{" "}
          <code>account.linked</code> to your webhook URL. Enrichment (income
          analysis, transaction categorisation) begins automatically — you do
          not need to do anything to trigger it.
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">Payload</h3>
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

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-6">
          What to store
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Store <code>accountId</code> and <code>institution</code> against the
          application. You will need <code>applicationId</code> to call
          finalize-linking once all accounts are ready.
        </p>
      </section>

      {/* ── STEP 4 ── */}
      <section id="step-enrichment-ready" className="scroll-mt-28 mb-10">
        <StepHeader number={4} title="Wait for account.enrichment_ready" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          This event fires once per account when income analysis and transaction
          insights have completed. For a single-account applicant you will
          receive this once. For a multi-account applicant, you will receive it
          once per account — track them and only call finalize-linking after all
          accounts have fired this event.
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

        <Callout type="info">
          Do not call <code>/analyze</code> here. You must call{" "}
          <code>/finalize-linking</code> first. That call locks the application
          and triggers the definitive <code>application.ready_for_analysis</code>{" "}
          event which is your signal to analyze.
        </Callout>
      </section>

      {/* ── STEP 5 ── */}
      <section id="step-finalize" className="scroll-mt-28 mb-10">
        <StepHeader number={5} title="Call finalize-linking" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Once all accounts the applicant is linking have fired{" "}
          <code>account.enrichment_ready</code>, call this endpoint. It locks
          the application from further account additions and tells us to fire{" "}
          <code>application.ready_for_analysis</code> once all enrichment is
          confirmed complete on our side.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/:id/finalize-linking
          </code>
        </div>

        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/finalize-linking \\
  -H "x-api-key: mp_live_your_secret_key"`}
        />

        <CodeBlock
          lang="json"
          code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "status":        "LINKED",
  "message":       "Linking finalized. Analysis will be available once all accounts are enriched."
}`}
        />
      </section>

      {/* ── STEP 6 ── */}
      <section id="step-ready-for-analysis" className="scroll-mt-28 mb-10">
        <StepHeader number={6} title="Receive application.ready_for_analysis" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Unlike <code>account.enrichment_ready</code> which fires per account,
          this fires once per application. It is the definitive signal that all
          linked accounts are enriched and you are safe to call{" "}
          <code>/analyze</code>.
        </p>

        <CodeBlock
          lang="json"
          code={`{
  "event": "application.ready_for_analysis",
  "data": {
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "accountCount":  1,
    "message":       "All accounts are enriched. You may now submit for analysis."
  },
  "timestamp": "2026-02-20T22:08:10.441Z"
}`}
        />

      </section>

      {/* ── STEP 7 ── */}
      <section id="step-analyze" className="scroll-mt-28 mb-10">
        <StepHeader number={7} title="Call analyze" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Queue the scoring job. The engine reads all enriched data we hold for
          this application and delivers the decision to your webhook URL.
          This call returns immediately — the scoring is asynchronous.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/:id/analyze
          </code>
        </div>

        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/analyze \\
  -H "x-api-key: mp_live_your_secret_key"`}
        />

        <CodeBlock
          lang="json"
          code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "status":        "PROCESSING",
  "message":       "Analysis queued."
}`}
        />

        <Callout type="warning">
          Only call this after receiving{" "}
          <code>application.ready_for_analysis</code>. Calling it earlier will
          return a <code>400</code> error.
        </Callout>
      </section>

      {/* ── STEP 8 ── */}
      <section id="step-decision" className="scroll-mt-28 mb-10">
        <StepHeader number={8} title="Receive application.decision" />
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          The final scored decision is delivered to your webhook URL. The{" "}
          <code>decision</code> field can be <code>APPROVED</code>,{" "}
          <code>COUNTER_OFFER</code>, <code>REJECTED</code>, or{" "}
          <code>MANUAL_REVIEW</code>.
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
      "score":      720,
      "decision":   "APPROVED",
      "score_band": "LOW_RISK",
      "timestamp":  "2026-02-20T22:14:35.576Z",
      "approval_details": {
        "approved_amount":   500000,
        "approved_tenor":    12,
        "approved_interest": 24.0,
        "monthly_payment":   46667
      },
      "counter_offer": null,
      "score_breakdown": {
        "total":                 720,
        "cash_flow_health":      180,
        "income_stability":      160,
        "debt_service_capacity": 140,
        "account_behavior":      140,
        "credit_history":        100
      },
      "explainability": {
        "primary_reason":  "Strong income consistency and healthy cash flow",
        "key_strengths":   ["Consistent monthly credits", "Low debt-to-income ratio"],
        "key_weaknesses":  []
      },
      "risk_factors":          [],
      "manual_review_reasons": [],
      "eligible_tenors":       [6, 12, 18, 24],
      "regulatory_compliance": {
        "thin_file":              false,
        "identity_verified":      true,
        "credit_bureau_checked":  true,
        "affordability_assessed": true
      }
    }
  },
  "timestamp": "2026-02-20T22:14:35.703Z"
}`}
        />

        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-800 mb-1">
              APPROVED / COUNTER_OFFER
            </p>
            <p className="text-xs leading-relaxed">
              Present the <code>approval_details</code> to the user. For a
              counter-offer, show the <code>counter_offer</code> block instead —
              it contains the revised amount, tenor, monthly payment, and a
              plain-language reason.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-800 mb-1">REJECTED</p>
            <p className="text-xs leading-relaxed">
              The <code>explainability.primary_reason</code> and{" "}
              <code>risk_factors</code> give you a plain-language explanation
              safe to relay to the applicant.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-800 mb-1">MANUAL_REVIEW</p>
            <p className="text-xs leading-relaxed">
              The application lands in your loan officer queue.{" "}
              <code>manual_review_reasons</code> explains why automatic scoring
              could not issue a final decision. Your team reviews it from the
              dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* ── Edge cases ── */}
      <section id="edge-cases" className="scroll-mt-28 mt-12 mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Edge cases</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Three additional webhook events can interrupt the happy path. Handle
          all of them or your users will end up in silent dead ends.
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-bold font-mono bg-red-100 text-red-600">
                account.enrichment_failed
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Enrichment stayed in <code>PENDING</code> for more than 20 minutes.
              Our cleanup job marks the account <code>FAILED</code> and fires this
              event. The applicant needs to re-link.
            </p>
            <CodeBlock
              lang="json"
              code={`{
  "event": "account.enrichment_failed",
  "data": {
    "accountId":   "dbcc78d5-...",
    "applicantId": "54cbd45f-...",
    "reason":      "enrichment_timeout",
    "message":     "Ask the applicant to re-link their bank account."
  }
}`}
            />
            <p className="text-xs text-gray-600 mt-2">
              <strong>Action:</strong> Call{" "}
              <code>POST /api/applications/:id/link-account</code> to generate a
              fresh widget URL and restart enrichment for that account.
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-bold font-mono bg-red-100 text-red-600">
                application.failed
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              A terminal error occurred during analysis — no enriched accounts
              were available, or the scoring service returned an unrecoverable
              error. The application status is <code>FAILED</code>.
            </p>
            <CodeBlock
              lang="json"
              code={`{
  "event": "application.failed",
  "data": {
    "applicationId": "357ab3ce-...",
    "applicantId":   "54cbd45f-...",
    "status":        "FAILED",
    "reason":        "No accounts with completed enrichment available for analysis"
  }
}`}
            />
            <p className="text-xs text-gray-600 mt-2">
              <strong>Action:</strong> Call <code>/initiate</code> to start a new
              application. A failed application cannot be retried.
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-bold font-mono bg-amber-100 text-amber-700">
                application.abandoned
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Fired by the cleanup system when an application goes cold. Two
              possible reasons:
            </p>
            <div className="space-y-2 mb-3 text-xs text-gray-700">
              <div className="flex gap-2">
                <code className="shrink-0 bg-amber-100 text-amber-700 px-1.5 py-0.5 font-bold">no_link</code>
                <span>
                  Applicant did not open or complete the Mono widget within{" "}
                  <strong>24 hours</strong> of initiation.
                </span>
              </div>
              <div className="flex gap-2">
                <code className="shrink-0 bg-amber-100 text-amber-700 px-1.5 py-0.5 font-bold">no_analyze</code>
                <span>
                  Account was linked but <code>/analyze</code> was never called within{" "}
                  <strong>7 days</strong>. Bank data has been scrubbed from our systems.
                </span>
              </div>
            </div>
            <CodeBlock
              lang="json"
              code={`{
  "event": "application.abandoned",
  "data": {
    "applicationId": "357ab3ce-...",
    "applicantId":   "54cbd45f-...",
    "reason":        "no_link",
    "message":       "Applicant did not link a bank account within 24 hours."
  }
}`}
            />
            <p className="text-xs text-gray-600 mt-2">
              <strong>Action:</strong> For both reasons, call <code>/initiate</code>{" "}
              to create a fresh application. The applicant will need to re-link.
            </p>
          </div>
        </div>
      </section>

      {/* ── What's next ── */}
      <section id="whats-next" className="scroll-mt-28 mt-12 mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          What&apos;s next
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/docs/decision-object"
            className="block border border-gray-200 p-4 hover:border-[#0055ba]/40 hover:bg-[#0055ba]/5 transition group"
          >
            <p className="font-semibold text-gray-900 text-sm group-hover:text-[#0055ba] transition mb-1">
              Decision Object
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Full schema reference for every field in the decision payload.
            </p>
          </Link>
          <Link
            href="/docs/score-bands"
            className="block border border-gray-200 p-4 hover:border-[#0055ba]/40 hover:bg-[#0055ba]/5 transition group"
          >
            <p className="font-semibold text-gray-900 text-sm group-hover:text-[#0055ba] transition mb-1">
              Score Bands
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              What each score range means and how to present it to applicants.
            </p>
          </Link>
          <Link
            href="/docs/errors"
            className="block border border-gray-200 p-4 hover:border-[#0055ba]/40 hover:bg-[#0055ba]/5 transition group"
          >
            <p className="font-semibold text-gray-900 text-sm group-hover:text-[#0055ba] transition mb-1">
              Error Handling
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              HTTP error codes, retry guidance, and idempotency tips.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
