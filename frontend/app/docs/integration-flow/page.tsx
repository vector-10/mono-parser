import { Callout } from "../components/Callout";

const steps = [
  {
    step: "1",
    title: "POST /applications/initiate",
    desc: "Create the applicant and application. Receive a Mono Connect widget URL.",
    tag: "Your call",
  },
  {
    step: "2",
    title: "Open the widget URL",
    desc: "Redirect or embed the widgetUrl so your applicant can link their bank account through Mono Connect.",
    tag: "User action",
  },
  {
    step: "3",
    title: "account.linked webhook",
    desc: "We notify your webhook URL that the bank account is linked. Enrichment begins automatically.",
    tag: "We send",
  },
  {
    step: "4",
    title: "account.enrichment_ready webhook",
    desc: "Both income analysis and statement insights are ready. The applicationId is included — trigger analysis now.",
    tag: "We send",
  },
  {
    step: "5",
    title: "POST /applications/:id/analyze",
    desc: "Trigger loan analysis. Use the applicationId from the enrichment_ready event.",
    tag: "Your call",
  },
  {
    step: "6",
    title: "application.decision webhook",
    desc: "The full scored decision object is delivered to your webhook URL.",
    tag: "We send",
  },
];

export default function IntegrationFlowPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Integration Flow</h1>
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        The complete lifecycle of a loan application — from initiating to receiving a decision —
        involves three API calls on your end and three webhook events from our side.
      </p>

      <div className="space-y-3 mb-8">
        {steps.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 items-start bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition"
          >
            <div className="w-8 h-8 bg-[#0055ba] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {item.step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <code className="text-xs font-mono font-semibold text-gray-900">{item.title}</code>
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
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout type="success">
        <strong>Wait for enrichment_ready before calling analyze.</strong> Calling{" "}
        <code>/analyze</code> endpoint before enrichment is complete will result in a lower-quality
        decision. The <code>account.enrichment_ready</code> webhook is your reliable signal to
        proceed.
      </Callout>
    </div>
  );
}
