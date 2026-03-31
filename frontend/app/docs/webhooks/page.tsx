import Link from "next/link";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";

export default function WebhooksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Webhooks</h1>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        Mono-Parser pushes events to your registered webhook URL. All webhook
        payloads share the same envelope shape:
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
        Register your webhook URL in the dashboard under Settings → Webhook URL.
        Your endpoint must respond with HTTP <code>2xx</code> within 10 seconds.
        Failed deliveries are retried with exponential backoff.
      </Callout>

      {/* ── account.linked ── */}
      <section id="wh-account-linked" className="scroll-mt-28 mt-10 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            account.linked
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">account.linked</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Fired when a bank account is successfully linked via Mono Connect.
          Enrichment starts automatically after this event — you do not need to
          do anything yet. Wait for <code>account.enrichment_ready</code> before
          calling analyze.
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
      </section>

      {/* ── account.enrichment_ready ── */}
      <section id="wh-enrichment-ready" className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            account.enrichment_ready
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          account.enrichment_ready
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Fired per account when income analysis and statement insights have both completed for that
          account. If your applicant is linking multiple accounts, you will receive this event once
          per account. When you are done linking all accounts, call{" "}
          <code>/finalize-linking</code> — we will then fire{" "}
          <code>application.ready_for_analysis</code> as your trigger for <code>/analyze</code>.
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
          If your applicant has only one account, call <code>/finalize-linking</code> immediately
          after this event. For multi-account flows, wait until all accounts fire this event before
          finalizing.
        </Callout>
      </section>

      {/* ── application.ready_for_analysis ── */}
      <section id="wh-ready-for-analysis" className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            application.ready_for_analysis
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          application.ready_for_analysis
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Fired after you have called <code>/finalize-linking</code> and all linked accounts on the
          application are confirmed enriched. This is your definitive signal to call{" "}
          <code>/analyze</code>. Unlike <code>account.enrichment_ready</code> which fires per
          account, this fires once per application.
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

      {/* ── account.enrichment_failed ── */}
      <section id="wh-enrichment-failed" className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            account.enrichment_failed
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">account.enrichment_failed</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Fired when an account stays in <code>PENDING</code> enrichment status for more than
          20 minutes. This is a cleanup safety net — it means our system could not complete income
          analysis or statement insights for that account within the expected window.
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "event": "account.enrichment_failed",
  "data": {
    "accountId":     "dbcc78d5-0719-4344-ac0e-e02a1f865bf0",
    "monoAccountId": "6998da59bdaef66d5e5f3d0d",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "reason":        "enrichment_timeout",
    "message":       "Account enrichment did not complete within the expected window. Ask the applicant to re-link their bank account to restart the process."
  },
  "timestamp": "2026-02-20T22:40:00.000Z"
}`}
        />
        <Callout type="warning">
          Ask the applicant to re-link their bank account using{" "}
          <code>POST /api/applications/:id/link-account</code>. This generates a
          fresh Mono Connect widget URL and restarts the enrichment process for
          that account.
        </Callout>
      </section>

      {/* ── application.failed ── */}
      <section id="wh-application-failed" className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            application.failed
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">application.failed</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Fired when the scoring engine encounters a terminal error it cannot recover from —
          for example, the applicant has no enriched bank accounts at analysis time, or the
          analysis service returned an unrecoverable error. The application status is set to{" "}
          <code>FAILED</code>.
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "event": "application.failed",
  "data": {
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "status":        "FAILED",
    "reason":        "No accounts with completed enrichment available for analysis"
  },
  "timestamp": "2026-02-20T22:15:00.000Z"
}`}
        />
        <Callout type="warning">
          A failed application cannot be re-analyzed. You will need to call{" "}
          <code>/initiate</code> to create a new application for the same applicant.
        </Callout>
      </section>

      {/* ── application.abandoned ── */}
      <section id="wh-application-abandoned" className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            application.abandoned
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">application.abandoned</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Fired by the cleanup system when an application is inactive too long. There are two
          abandonment reasons — check the <code>reason</code> field to distinguish them.
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">
          reason: <code>no_link</code>
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          The applicant did not link any bank account within <strong>24 hours</strong> of the
          application being created. The widget URL has expired.
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "event": "application.abandoned",
  "data": {
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "reason":        "no_link",
    "message":       "Application abandoned — applicant did not link a bank account within 24 hours."
  },
  "timestamp": "2026-02-21T22:05:00.000Z"
}`}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-6">
          reason: <code>no_analyze</code>
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          The applicant linked their account but{" "}
          <code>/analyze</code> was never called within <strong>7 days</strong>. Bank data
          has been scrubbed from our systems for compliance.
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "event": "application.abandoned",
  "data": {
    "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
    "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
    "reason":        "no_analyze",
    "message":       "Application abandoned — analysis was not submitted within 7 days of account linking. Bank data has been scrubbed."
  },
  "timestamp": "2026-02-28T22:10:00.000Z"
}`}
        />
        <Callout type="warning">
          For both abandonment reasons, you must call <code>/initiate</code> to start a
          fresh application. The applicant will need to re-link their bank account.
        </Callout>
      </section>

      {/* ── application.decision ── */}
      <section id="wh-decision" className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-2.5 py-1 bg-[#59a927]/10 text-[#59a927] text-xs font-bold rounded-full">
            EVENT
          </span>
          <code className="font-mono font-semibold text-gray-900 text-sm">
            application.decision
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          application.decision
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          The final scored decision. Delivered after analysis completes. See the{" "}
          <Link
            href="/docs/decision-object"
            className="text-[#0055ba] hover:underline"
          >
            Decision Object
          </Link>{" "}
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
      </section>
    </div>
  );
}
