import { Callout } from "../components/Callout";

const bands = [
  {
    range: "700 – 1000",
    band: "LOW_RISK",
    decision: "APPROVED",
    note: "Full approval at requested amount and tenor.",
    colour: "text-[#59a927]",
  },
  {
    range: "550 – 699",
    band: "MODERATE_RISK",
    decision: "COUNTER_OFFER",
    note: "May be approved at a reduced amount or shorter tenor.",
    colour: "text-amber-600",
  },
  {
    range: "400 – 549",
    band: "HIGH_RISK",
    decision: "MANUAL_REVIEW",
    note: "Requires manual underwriter review before a decision.",
    colour: "text-orange-600",
  },
  {
    range: "0 – 399",
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
        Scores run from 0 to 1000. The engine maps raw scores to decision bands as follows:
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
        A score of <strong>0</strong> is not necessarily a data error. It can indicate a hard
        knockout rule fired — such as an identity name mismatch or a thin-file applicant. Always
        check <code>risk_factors</code> and <code>score_breakdown</code> for detail.
      </Callout>
    </div>
  );
}
