import Link from "next/link";
import { CodeBlock } from "./components/CodeBlock";
import { RiBookOpenLine, RiTimerFlashLine, RiNotification3Line, RiKey2Line } from "react-icons/ri";

export default function DocsOverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#0055ba]/20 bg-[#0055ba]/5 px-3 py-1.5 text-xs font-medium text-[#0055ba] mb-4">
          <RiBookOpenLine className="h-3.5 w-3.5" /> Mono Parser API Documentation
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Introduction
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Our suite of APIs enable Loan Officers make data-driven lending decisions and underwrite
          loans at scale. Connect your applicants&apos; bank accounts via Mono, and receive a
          detailed loan decision backed by reliable finance metrics — all through a simple
          webhook-driven flow.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {[
          {
            icon: <RiTimerFlashLine className="h-5 w-5 text-[#0055ba]" />,
            title: "Four API calls",
            desc: "Initiate → Link Account → Finalize → Analyze. Everything else is automated.",
          },
          {
            icon: <RiNotification3Line className="h-5 w-5 text-[#0055ba]" />,
            title: "Webhook-driven",
            desc: "Results are pushed to your registered webhook URL asynchronously.",
          },
          {
            icon: <RiKey2Line className="h-5 w-5 text-[#0055ba]" />,
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
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{card.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Base URL</h3>
        <CodeBlock code="https://api.mono-parser.shop/api" lang="http" />
        <p className="text-xs text-gray-500 mt-2">
          All endpoints are prefixed with{" "}
          <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">/api</code>. Use HTTPS at all
          times.
        </p>
      </div>

      <div className="mt-10 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick navigation</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { href: "/docs/authentication", label: "Authentication", desc: "API keys and security" },
            { href: "/docs/integration-flow", label: "Integration Flow", desc: "End-to-end lifecycle" },
            { href: "/docs/api-reference", label: "API Reference", desc: "All 4 endpoints" },
            { href: "/docs/webhooks", label: "Webhooks", desc: "Events we send you" },
            { href: "/docs/decision-object", label: "Decision Object", desc: "Full response schema" },
            { href: "/docs/score-bands", label: "Score Bands", desc: "How scores map to decisions" },
            { href: "/docs/errors", label: "Error Handling", desc: "Status codes and shapes" },
            { href: "/docs/notes-for-fintechs", label: "Notes for Fintechs", desc: "Critical integration tips" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#0055ba]/30 hover:bg-[#0055ba]/5 transition group"
            >
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-[#0055ba] transition">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
