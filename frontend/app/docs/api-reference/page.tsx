import { CodeBlock } from "../components/CodeBlock";
import { MethodBadge } from "../components/MethodBadge";
import { Callout } from "../components/Callout";
import { FieldTable } from "../components/FieldTable";

export default function ApiReferencePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">API Reference</h1>
      <p className="text-gray-600 text-sm mb-8">
        All endpoints require the{" "}
        <code className="bg-gray-100 px-1 py-0.5 text-xs">x-api-key</code> header.
      </p>

      {/* ── INITIATE ── */}
      <section id="initiate" className="scroll-mt-28 mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/initiate
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Initiate Application</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Creates an applicant record and a loan application in one call. Returns a Mono Connect{" "}
          <code className="bg-gray-100 px-1 py-0.5 text-xs">widgetUrl</code> you should
          present to your user so they can link their bank account.
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">Request Body</h3>
        <FieldTable
          fields={[
            { name: "firstName", type: "string", desc: "Applicant's first name (2–100 chars). Must match their bank account name." },
            { name: "lastName", type: "string", desc: "Applicant's last name (2–100 chars). Must match their bank account name." },
            { name: "email", type: "string", desc: "Valid email address for the applicant." },
            { name: "phone", type: "string", required: false, desc: "Phone number (10–15 chars). Optional." },
            { name: "bvn", type: "string", required: false, desc: "11-digit BVN. Enables credit bureau lookup during analysis." },
            { name: "amount", type: "number", desc: "Loan amount in Naira (smallest unit — kobo not required)." },
            { name: "tenor", type: "number", desc: "Loan tenor in months (e.g. 6, 12, 24)." },
            { name: "interestRate", type: "number", desc: "Monthly interest rate as a percentage (e.g. 5.0 for 5%)." },
            { name: "purpose", type: "string", required: false, desc: "Loan purpose description. Optional." },
            { name: "idempotencyKey", type: "string", desc: "A unique key you generate per application (e.g. UUID). Prevents duplicate applications on retries. Re-sending the same key for a PENDING_LINKING or ABANDONED application resumes it and returns a fresh widget URL." },
          ]}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-6">Sample Request</h3>
        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/initiate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: mp_live_your_secret_key" \\
  -d '{
    "firstName":      "Olusegun",
    "lastName":       "Adeyemi",
    "email":          "olusegun.adeyemi@example.com",
    "phone":          "08012345678",
    "bvn":            "22345678901",
    "amount":         500000,
    "tenor":          12,
    "interestRate":   5.0,
    "purpose":        "Business expansion",
    "idempotencyKey": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'`}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-4">Response</h3>
        <CodeBlock
          lang="json"
          code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "applicantId":   "54cbd45f-bf8e-4add-8d0c-adb5efe705c1",
  "widgetUrl":     "https://connect.withmono.com/?key=...&reference=...",
  "status":        "PENDING_LINKING",
  "resumed":       false
}`}
        />

        <Callout type="info">
          Store both IDs. Present the <code>widgetUrl</code> to the applicant — it is for their
          browser, not your server. If <code>resumed: true</code> is returned, the idempotency key
          matched an existing application that was previously abandoned — the applicant can
          continue from where they left off.
        </Callout>
      </section>

      {/* ── LINK ACCOUNT ── */}
      <section id="link-account" className="scroll-mt-28 mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/:id/link-account
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Account</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Re-generates a fresh Mono Connect widget URL for an existing application. Use this when an
          applicant needs to re-link their account (e.g. the session expired, they closed the widget
          without completing, or you want to link an additional account).
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">Path Parameter</h3>
        <FieldTable
          fields={[
            { name: ":id", type: "string (UUID)", desc: "The applicationId returned from the initiate endpoint." },
          ]}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-6">Sample Request</h3>
        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/link-account \\
  -H "x-api-key: mp_live_your_secret_key"`}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-4">Response</h3>
        <CodeBlock
          lang="json"
          code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "widgetUrl": "https://connect.withmono.com/?key=...&reference=...",
  "status": "PENDING_LINKING"
}`}
        />

        <Callout type="warning">
          This endpoint will return an error if the application is already in a terminal state (
          <code>COMPLETED</code> or <code>FAILED</code>). You cannot re-link accounts after a final
          decision has been issued. Start the process again by calling the initiate endpoint to
          create a new application.
        </Callout>
      </section>

      {/* ── FINALIZE LINKING ── */}
      <section id="finalize-linking" className="scroll-mt-28 mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/:id/finalize-linking
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Finalize Linking</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Signals that the applicant has finished linking all their bank accounts. This locks the
          application from further account linking and makes it eligible for analysis. Once called,
          we fire the <code className="bg-gray-100 px-1 py-0.5 text-xs">application.ready_for_analysis</code> webhook
          when all enrichment is confirmed complete.
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">Path Parameter</h3>
        <FieldTable
          fields={[
            { name: ":id", type: "string (UUID)", desc: "The applicationId returned from the initiate endpoint." },
          ]}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-6">Sample Request</h3>
        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/finalize-linking \\
  -H "x-api-key: mp_live_your_secret_key"`}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-4">Response</h3>
        <CodeBlock
          lang="json"
          code={`{
  "applicationId": "357ab3ce-55ce-4f73-82c9-dab3136c7885",
  "status": "LINKED",
  "message": "Linking finalized. Analysis will be available once all accounts are enriched."
}`}
        />

        <Callout type="info">
          Call after all accounts have fired <code>account.enrichment_ready</code>.
        </Callout>
      </section>

      {/* ── ANALYZE ── */}
      <section id="analyze" className="scroll-mt-28 mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <MethodBadge method="POST" />
          <code className="text-sm font-mono font-semibold text-gray-900">
            /api/applications/:id/analyze
          </code>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analyze Application</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Queues the loan analysis job. The scoring engine reads all enriched bank data from our
          database and sends the decision to your webhook URL.
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">Path Parameter</h3>
        <FieldTable
          fields={[
            { name: ":id", type: "string (UUID)", desc: "The applicationId. Use the value from the account.enrichment_ready webhook for the best result." },
          ]}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-6">Sample Request</h3>
        <CodeBlock
          lang="curl"
          code={`curl -X POST https://api.mono-parser.shop/api/applications/357ab3ce-55ce-4f73-82c9-dab3136c7885/analyze \\
  -H "x-api-key: mp_live_your_secret_key"`}
        />

        <h3 className="font-semibold text-gray-800 text-sm mb-2 mt-4">Response</h3>
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
            Call this only after receiving <code>application.ready_for_analysis</code>.
          </strong>{" "}
          This event fires after you have called <code>/finalize-linking</code> and all linked
          accounts are enriched. Calling <code>/analyze</code> before this will return a 400 error.
        </Callout>
      </section>
    </div>
  );
}
