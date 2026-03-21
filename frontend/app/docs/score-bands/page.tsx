import { Callout } from "../components/Callout";

const bands = [
  {
    range: "800 – 850",
    band: "VERY_LOW_RISK",
    decision: "APPROVED",
    note: "Full approval at requested amount and tenor.",
    colour: "text-[#59a927]",
  },
  {
    range: "700 – 799",
    band: "LOW_RISK",
    decision: "APPROVED",
    note: "Full approval. May trigger manual review if near the 700 boundary.",
    colour: "text-[#59a927]",
  },
  {
    range: "600 – 699",
    band: "MEDIUM_RISK",
    decision: "COUNTER_OFFER",
    note: "May be approved at a reduced amount or extended tenor based on affordability.",
    colour: "text-amber-600",
  },
  {
    range: "500 – 599",
    band: "HIGH_RISK",
    decision: "MANUAL_REVIEW",
    note: "Sent to a human underwriter before a decision is issued.",
    colour: "text-orange-600",
  },
  {
    range: "350 – 499",
    band: "VERY_HIGH_RISK",
    decision: "REJECTED",
    note: "Does not meet minimum credit criteria.",
    colour: "text-red-600",
  },
];

export default function ScoreBandsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Score Bands</h1>
      <p className="text-gray-600 text-sm mb-6">
        Scores run from 350 to 850 — a FICO-compatible scale. The engine maps scores to five risk
        bands and derives the default decision from each band. Your risk policy can adjust the
        thresholds that separate these bands.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Score Range", "Band", "Typical Decision", "Notes"].map((h) => (
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
            {bands.map((row) => (
              <tr key={row.band} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                  {row.range}
                </td>
                <td className={`px-4 py-3 font-mono text-xs font-bold ${row.colour}`}>
                  {row.band}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-gray-700">{row.decision}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        A score of <strong>350</strong> is the floor — it indicates a hard knockout rule fired
        before scoring completed, such as an identity name mismatch, active loan default, or income
        below the minimum threshold. Always check <code>risk_factors</code> for the specific reason.
      </Callout>

      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Default policy thresholds</h3>
        <div className="space-y-1.5 text-xs">
          {[
            ["score_reject_floor", "500", "Below this score → REJECTED"],
            ["score_manual_floor", "600", "Below this score → MANUAL_REVIEW"],
            ["score_approve_floor", "700", "At or above this score → APPROVED eligible"],
          ].map(([param, value, desc]) => (
            <div key={param} className="flex flex-wrap items-baseline gap-2">
              <code className="text-gray-900 font-semibold">{param}</code>
              <span className="text-[#0055ba] font-bold">{value}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          These defaults can be overridden per fintech via your Risk Policy in the dashboard.
        </p>
      </div>
    </div>
  );
}
