import { RiAlertLine, RiShieldLine } from "react-icons/ri";

const notes = [
  {
    title: "Names must match exactly",
    type: "warning" as const,
    body: "The applicant's first and last name submitted in the initiate call are compared against the identity data returned by Mono from the linked bank account. A mismatch is a HIGH-severity risk factor and will trigger immediate rejection. Always collect the applicant's name as it appears on their bank account — not a nickname or alias.",
  },
  {
    title: "Call finalize-linking before analyze",
    type: "warning" as const,
    body: "You must call POST /applications/:id/finalize-linking before triggering analysis. This signals that all intended accounts are linked and locks the application. After this, we fire application.ready_for_analysis — that is your trigger for /analyze. Calling /analyze before finalize-linking will return a 400 error.",
  },
  {
    title: "Do not call analyze before ready_for_analysis",
    type: "warning" as const,
    body: "Enrichment is an asynchronous pipeline — income analysis and statement insights take between 30 seconds and 3 minutes to complete. The application.ready_for_analysis webhook confirms that all linked accounts are fully enriched and that finalize-linking has been called. Only call /analyze after this event.",
  },
  {
    title: "Each widgetUrl is single-use",
    type: "info" as const,
    body: "The Mono Connect widget URL returned by /initiate and /link-account is a one-time-use link tied to a specific session. If the user closes the widget without completing, call /link-account to generate a fresh URL. Do not cache or reuse old widget URLs.",
  },
  {
    title: "Multiple accounts are all analysed",
    type: "info" as const,
    body: "If an applicant links more than one bank account, the scoring engine aggregates data across all of them. All accounts are sent to the scoring engine simultaneously — having multiple accounts does not reduce the quality of the decision. Call /link-account as many times as needed before calling /finalize-linking.",
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
                <RiAlertLine className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <RiShieldLine className="h-4 w-4 text-[#0055ba] shrink-0" />
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
