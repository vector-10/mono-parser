import { CodeBlock } from "../components/CodeBlock";
import { FieldTable } from "../components/FieldTable";

export default function DecisionObjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Decision Object</h1>
      <p className="text-gray-600 text-sm leading-relaxed mb-6">
        The <code>decision</code> object inside <code>application.decision</code> contains all
        scoring output.
      </p>

      <FieldTable
        fields={[
          { name: "score", type: "number", desc: "Overall credit score (350–850). Higher is better." },
          { name: "decision", type: "string", desc: "APPROVED | REJECTED | MANUAL_REVIEW | COUNTER_OFFER" },
          { name: "score_band", type: "string", desc: "VERY_LOW_RISK | LOW_RISK | MEDIUM_RISK | HIGH_RISK | VERY_HIGH_RISK" },
          { name: "approval_details", type: "object | null", required: false, desc: "Present when APPROVED. Contains approved_amount, approved_tenor, approved_interest, monthly_payment." },
          { name: "counter_offer", type: "object | null", required: false, desc: "Present when COUNTER_OFFER. Contains suggested lower amount or shorter tenor." },
          { name: "risk_factors", type: "array", required: false, desc: "List of risk factors that influenced the decision. Each item has factor, severity, and detail." },
          { name: "score_breakdown", type: "object", desc: "Individual scores for: cash_flow_health, income_stability, debt_service_capacity, account_behavior, credit_history." },
          { name: "explainability", type: "object", desc: "Human-readable explanation with primary_reason, key_strengths[], key_weaknesses[]." },
          { name: "eligible_tenors", type: "number[]", required: false, desc: "Tenors (in months) for which the applicant qualifies." },
          { name: "manual_review_reasons", type: "string[]", required: false, desc: "Reasons triggering a manual review, if applicable." },
          { name: "regulatory_compliance", type: "object", desc: "Compliance flags: thin_file, identity_verified, credit_bureau_checked, affordability_assessed." },
        ]}
      />

      <h2 className="font-semibold text-gray-900 text-base mt-8 mb-3">Risk Factors</h2>
      <p className="text-gray-600 text-sm mb-4">
        Each item in <code>risk_factors</code> has this shape:
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "factor":   "IDENTITY_NAME_MISMATCH",
  "severity": "HIGH",
  "detail":   "Submitted name 'John Doe' does not match account holder 'OJO DANIEL'"
}`}
      />

      <FieldTable
        fields={[
          { name: "severity", type: "string", desc: "HIGH — may trigger immediate rejection. MEDIUM / LOW — reduces score without hard knockout." },
          { name: "factor", type: "string", desc: "Machine-readable code for the risk type (e.g. IDENTITY_NAME_MISMATCH, LOW_AVERAGE_BALANCE, IRREGULAR_INCOME)." },
          { name: "detail", type: "string", desc: "Human-readable explanation suitable for logging or internal use." },
        ]}
      />
    </div>
  );
}
