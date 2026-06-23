import { CodeBlock } from "../components/CodeBlock";
import { FieldTable } from "../components/FieldTable";

export default function DecisionObjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Decision Object</h1>
      <p className="text-gray-600 text-sm leading-relaxed mb-6">
        The <code>decision</code> field inside the <code>application.decision</code> webhook payload
        contains the full scoring output. Every field listed here is always present in the response
        unless marked optional.
      </p>

      <FieldTable
        fields={[
          { name: "applicant_id", type: "string", desc: "The applicant UUID this decision was issued for." },
          { name: "score", type: "number", desc: "Overall credit score (350–850). Higher is better." },
          { name: "decision", type: "string", desc: "APPROVED | REJECTED | MANUAL_REVIEW | COUNTER_OFFER" },
          { name: "score_band", type: "string", desc: "VERY_LOW_RISK | LOW_RISK | MEDIUM_RISK | HIGH_RISK | VERY_HIGH_RISK" },
          { name: "score_breakdown", type: "object", desc: "Points earned per scoring component. See breakdown below." },
          { name: "approval_details", type: "object | null", required: false, desc: "Present when decision is APPROVED. Contains the approved loan terms. See schema below." },
          { name: "counter_offer", type: "object | null", required: false, desc: "Present when decision is COUNTER_OFFER. Contains revised terms the applicant can accept. See schema below." },
          { name: "eligible_tenors", type: "array", required: false, desc: "List of tenor options (in months) for which the applicant qualifies at the approved or offered amount. Empty when decision is REJECTED." },
          { name: "risk_factors", type: "array", required: false, desc: "Signals that negatively influenced the score. Each item has factor, severity, and detail. Empty on clean applications." },
          { name: "manual_review_reasons", type: "string[]", required: false, desc: "Plain-language reasons the application was flagged for human review. Present alongside MANUAL_REVIEW decisions." },
          { name: "explainability", type: "object", desc: "Human-readable summary with primary_reason, key_strengths[], and key_weaknesses[]." },
          { name: "regulatory_compliance", type: "object", desc: "Compliance flags: thin_file, identity_verified, credit_bureau_checked, affordability_assessed." },
          { name: "timestamp", type: "string", desc: "ISO 8601 timestamp of when the decision was issued." },
        ]}
      />

      {/* ── score_breakdown ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-10 mb-2">score_breakdown</h2>
      <p className="text-gray-600 text-sm mb-4">
        Individual points earned per scoring component. Components sum to <code>total</code>.
        Default weights shown — these shift for thin-file applicants (credit history weight drops
        to 0%, redistributed to income and cash flow).
      </p>
      <FieldTable
        fields={[
          { name: "total", type: "number", desc: "Final score (350–850). Sum of baseline (350) and all earned points." },
          { name: "credit_history", type: "number", desc: "Points from credit bureau data. Weight: 30% (standard) / 0% (thin-file)." },
          { name: "income_stability", type: "number", desc: "Points from income consistency and stream count. Weight: 25% (standard) / 35% (thin-file)." },
          { name: "cash_flow_health", type: "number", desc: "Points from inflow/outflow balance and savings capacity. Weight: 20% (standard) / 30% (thin-file)." },
          { name: "debt_service_capacity", type: "number", desc: "Points from debt-to-income ratio and existing obligations. Weight: 15% (standard) / 20% (thin-file)." },
          { name: "account_behavior", type: "number", desc: "Points from transaction frequency, account age, and activity patterns. Weight: 10% (standard) / 15% (thin-file)." },
        ]}
      />

      {/* ── approval_details ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-10 mb-2">approval_details</h2>
      <p className="text-gray-600 text-sm mb-4">
        Present when <code>decision</code> is <code>APPROVED</code>. Contains the exact terms to
        present to the applicant. <code>null</code> for all other decision types.
      </p>
      <FieldTable
        fields={[
          { name: "approved_amount", type: "number", desc: "Loan amount approved in Naira. Equal to the requested amount unless an affordability cap was applied." },
          { name: "approved_tenor", type: "number", desc: "Approved repayment period in months." },
          { name: "interest_rate", type: "number", desc: "Monthly interest rate as a percentage (e.g. 5.0 for 5% per month)." },
          { name: "monthly_payment", type: "number", desc: "Calculated monthly repayment amount in Naira." },
          { name: "dti_ratio", type: "number", desc: "Debt-to-income ratio at the approved terms. Expressed as a decimal (e.g. 0.28 = 28% of monthly income)." },
          { name: "conditions", type: "string[]", desc: "Any conditions attached to the approval (e.g. salary domiciliation requirements). Empty array when unconditional." },
        ]}
      />

      {/* ── counter_offer ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-10 mb-2">counter_offer</h2>
      <p className="text-gray-600 text-sm mb-4">
        Present when <code>decision</code> is <code>COUNTER_OFFER</code>. The scoring engine
        could not approve the original request but found a viable offer within affordability
        limits. Present this to the applicant as an alternative. <code>null</code> for all other
        decision types.
      </p>
      <FieldTable
        fields={[
          { name: "offered_amount", type: "number", desc: "The maximum amount the engine can approve — lower than the originally requested amount." },
          { name: "offered_tenor", type: "number", desc: "Tenor in months for the counter offer." },
          { name: "monthly_payment", type: "number", desc: "Calculated monthly repayment at the offered terms." },
          { name: "reason", type: "string", desc: "Plain-language explanation of why the original amount was reduced (e.g. affordability cap or thin-file income multiple limit)." },
        ]}
      />

      {/* ── risk_factors ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-10 mb-3">risk_factors</h2>
      <p className="text-gray-600 text-sm mb-4">
        Each item in <code>risk_factors</code> describes a specific signal that negatively
        influenced the decision. Safe to relay to loan officers — not to applicants directly.
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
          { name: "factor", type: "string", desc: "Machine-readable code for the risk type (e.g. IDENTITY_NAME_MISMATCH, LOW_AVERAGE_BALANCE, IRREGULAR_INCOME)." },
          { name: "severity", type: "string", desc: "HIGH — may have triggered immediate rejection. MEDIUM / LOW — reduced the score without a hard knockout." },
          { name: "detail", type: "string", desc: "Human-readable explanation suitable for internal logging or loan officer review." },
        ]}
      />
    </div>
  );
}
