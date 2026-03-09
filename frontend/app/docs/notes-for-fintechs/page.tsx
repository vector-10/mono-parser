import { Shield, AlertTriangle } from "lucide-react";

const notes = [
  {
    title: "Names must match exactly",
    type: "warning" as const,
    body: "The applicant's first and last name submitted in the initiate call are compared against the identity data returned by Mono from the linked bank account. A mismatch is a HIGH-severity risk factor and will trigger immediate rejection with a score of 0. Always collect the applicant's name as it appears on their bank account — not a nickname or alias.",
  },
  {
    title: "Do not call analyze before enrichment_ready",
    type: "warning" as const,
    body: "Enrichment is an asynchronous pipeline: income analysis and statement insights take between 30 seconds and 3 minutes to complete. Calling /analyze before both are ready means the scoring engine will have incomplete data, producing a lower-quality (or failed) decision. Wait for the account.enrichment_ready webhook — the applicationId is included for you.",
  },
  {
    title: "Each widgetUrl is single-use",
    type: "info" as const,
    body: "The Mono Connect widget URL returned by /initiate and /link-account is a one-time-use link tied to a specific session. If the user closes the widget without completing, call /link-account to generate a fresh URL. Do not cache or reuse old widget URLs.",
  },
  {
    title: "BVN enables credit bureau checks",
    type: "info" as const,
    body: "Providing a BVN in the initiate request enables the scoring engine to run a credit bureau lookup. Without a BVN, the credit_history dimension in score_breakdown will be 0, and regulatory_compliance.credit_bureau_checked will be false. This is not a hard failure, but it reduces the overall score ceiling and may result in a counter-offer instead of a full approval.",
  },
  {
    title: "Webhook delivery guarantees",
    type: "info" as const,
    body: "Webhooks are delivered at least once. Your endpoint may receive the same event more than once in rare cases (network retry scenarios). Use the applicationId or accountId as an idempotency key on your side. Always respond with HTTP 2xx promptly — do not wait for downstream processing before responding.",
  },
  {
    title: "Sandbox vs. production behaviour",
    type: "info" as const,
    body: "In sandbox mode, Mono returns synthetic data. Statement insights jobs complete synchronously in sandbox (job_status is 'successful' immediately). Income webhooks still fire asynchronously. All scoring logic is identical — only the underlying bank data differs. Test with realistic amounts and realistic salary patterns for accurate sandbox decision validation.",
  },
  {
    title: "One application, one bank account",
    type: "info" as const,
    body: "The scoring engine analyses the most recently linked bank account for an applicant. If an applicant has multiple linked accounts, all will be considered during analysis. Re-linking a bank account (calling /link-account) will refresh the existing account data and reset enrichment — the application moves back to PENDING_LINKING status.",
  },
  {
    title: "Rate limits",
    type: "warning" as const,
    body: "The /initiate and /analyze endpoints are rate-limited to 20 requests per minute per API key. If you exceed this, you will receive a 429 Too Many Requests response. Build backoff and retry logic into your integration. Contact support if you have high-volume batch processing needs.",
  },
];

export default function NotesForFintechsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notes for Fintechs</h1>
      <p className="text-gray-600 text-sm mb-8">
        Important considerations when integrating Mono-Parser into your lending product.
      </p>

      <div className="space-y-6">
        {notes.map((note) => (
          <div key={note.title} className="border border-gray-200 rounded-xl overflow-hidden">
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
              <h2 className="font-semibold text-gray-900 text-sm">{note.title}</h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600 leading-relaxed">{note.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
