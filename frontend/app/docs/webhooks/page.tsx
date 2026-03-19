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
          Fired when all enrichment data (income analysis + statement insights)
          has been collected and stored. This is your signal to call{" "}
          <code>/analyze</code>. The <code>applicationId</code> is included for
          convenience — pass it directly to the analyze endpoint.
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
          <code>POST /api/applications/{"{applicationId}"}/analyze</code> using
          the <code>applicationId</code> from the payload.
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
