import { Callout } from "../components/Callout";

const steps = [
  {
    step: "1",
    title: "POST /applications/initiate",
    desc: "Create the applicant and application in one call. Receive a Mono Connect widget URL and an applicationId.",
    tag: "Your call",
  },
  {
    step: "2",
    title: "Open the widget URL",
    desc: "Redirect or embed the widgetUrl so your applicant can link their bank account through Mono Connect. The widget closes automatically on completion.",
    tag: "User action",
  },
  {
    step: "3",
    title: "account.linked webhook",
    desc: "We notify your webhook URL that a bank account has been linked. Enrichment (income analysis + statement insights) begins automatically. No action needed yet.",
    tag: "We send",
  },
  {
    step: "4",
    title: "account.enrichment_ready webhook",
    desc: "Enrichment for that account is complete. If you need to link an additional account, call /link-account again and repeat steps 2–4. Otherwise, proceed to finalize.",
    tag: "We send",
  },
  {
    step: "5",
    title: "POST /applications/:id/finalize-linking",
    desc: "Signal that the applicant has finished linking all their accounts. This locks the application and makes it eligible for analysis.",
    tag: "Your call",
  },
  {
    step: "6",
    title: "application.ready_for_analysis webhook",
    desc: "All linked accounts are enriched and the application is ready. The applicationId is included — use it in the next call.",
    tag: "We send",
  },
  {
    step: "7",
    title: "POST /applications/:id/analyze",
    desc: "Trigger loan analysis. The scoring engine reads all enriched account data and runs the full credit pipeline.",
    tag: "Your call",
  },
  {
    step: "8",
    title: "application.decision webhook",
    desc: "The full scored decision object — including score, band, approval details or counter-offer, and explainability — is delivered to your webhook URL.",
    tag: "We send",
  },
];

export default function IntegrationFlowPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Integration Flow</h1>
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        The complete lifecycle of a loan application involves four API calls on your end and four
        webhook events from ours. The flow is async and webhook-driven — you never need to poll.
      </p>

      <div className="space-y-3 mb-8">
        {steps.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 items-start bg-white border border-gray-200 p-4 hover:shadow-sm transition"
          >
            <div className="w-8 h-8 bg-[#0055ba] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {item.step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <code className="text-xs font-mono font-semibold text-gray-900">{item.title}</code>
                <span
                  className={`text-xs px-2 py-0.5 font-medium ${
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
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout type="success">
        <strong>Use application.ready_for_analysis as your trigger for /analyze.</strong> This event
        fires only after finalize-linking and confirms all accounts are enriched. Calling{" "}
        <code>/analyze</code> before this will return a 400 error.
      </Callout>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Handling failures</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Three webhook events can interrupt the happy path. They are not rare — handle all of
          them or applicants will reach a silent dead end with no way forward.
        </p>
        <div className="space-y-3">
          {[
            {
              event: "account.enrichment_failed",
              tag: "We send",
              desc: "Enrichment stayed PENDING for more than 20 minutes. The account could not be processed within the expected window.",
              action: "Call POST /applications/:id/link-account to generate a fresh widget URL. The applicant must re-link that account.",
            },
            {
              event: "application.failed",
              tag: "We send",
              desc: "A terminal error occurred during analysis — no enriched accounts were available, or the scoring engine returned an unrecoverable error.",
              action: "Cannot be retried. Call /initiate to create a new application for the same applicant.",
            },
            {
              event: "application.abandoned",
              tag: "We send",
              desc: "The cleanup system marked the application inactive. Either no account was linked within 24 hours (no_link), or /analyze was never called within 7 days of linking (no_analyze).",
              action: "Cannot be resumed. Call /initiate with a new idempotency key. The applicant will need to re-link.",
            },
          ].map((item) => (
            <div
              key={item.event}
              className="flex gap-4 items-start bg-white border border-gray-200 p-4 hover:shadow-sm transition"
            >
              <div className="w-8 h-8 bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <code className="text-xs font-mono font-semibold text-gray-900">{item.event}</code>
                  <span className="text-xs px-2 py-0.5 font-medium bg-gray-100 text-gray-600">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-1.5">{item.desc}</p>
                <p className="text-xs text-gray-700 font-medium">
                  <span className="text-gray-400 mr-1">→</span>{item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
