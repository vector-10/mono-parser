# Brain — Credit Scoring & Decision Engine

A FastAPI service that receives a loan application and returns a credit decision, score, and full explainability payload. It is the analytical core of Mono-Parser.

---

## How it works

The engine runs every application through a five-stage pipeline:

```
1. Knockout  →  2. Feature Extraction  →  3. Scoring  →  4. Decision  →  5. Manual Review
```

**Stage 1 — Knockout**
Hard-stop rules evaluated before any scoring. A single failure rejects the application immediately with a reason code. Rules cover: identity mismatch between submitted data and bank account identity, fraud signals detected by Mono (round-tripping, salary-timing withdrawals), active loan defaults or written-off debts from the credit bureau, unhealthy account behaviour (excessive overdrafts, bounced payments, account too new), and income disqualifiers (no income detected, stale income, below minimum threshold).

**Stage 2 — Feature Extraction**
Transforms raw Mono bank data into ~30 normalised signals grouped into: income, cash flow, credit history, debt, and account behaviour. Income is sourced from Mono's income webhook when available; if not, the engine falls back to scanning transaction narrations for salary keywords, flagging this explicitly since it is less accurate. Safe income is conservatively set to the minimum of the webhook figure and the transaction-computed monthly average to prevent over-approval.

**Stage 3 — Scoring**
Produces a FICO-compatible score in the range 350–850 across five weighted components:

| Component | Normal weight | Thin-file weight |
|---|---|---|
| Credit History | 30% | 0% (redistributed) |
| Income Stability | 25% | 35% |
| Cash Flow Health | 20% | 30% |
| Debt Service Capacity | 15% | 20% |
| Account Behaviour | 10% | 15% |

An applicant is considered thin-file when they have fewer than two loans in the credit bureau. In that case the credit history component is dropped and its weight is redistributed to the remaining four components, shifting the decision toward observable cash behaviour.

Score bands:

| Range | Band |
|---|---|
| 800–850 | VERY_LOW_RISK |
| 700–799 | LOW_RISK |
| 600–699 | MEDIUM_RISK |
| 500–599 | HIGH_RISK |
| 350–499 | VERY_HIGH_RISK |

**Stage 4 — Decision**
Applies the policy-defined score gates, affordability cap, and thin-file caps.

```
score < score_reject_floor (500)   →  REJECTED
score < score_manual_floor (600)   →  MANUAL_REVIEW
score < score_approve_floor (700)  →  COUNTER_OFFER eligible
score ≥ score_approve_floor        →  APPROVED eligible
```

Maximum monthly payment is capped at `affordability_cap × safe_income` (default 35%). If the requested amount exceeds what the applicant can service, the engine computes the largest affordable counter-offer. If even that counter-offer falls below `min_viable_offer_ratio × requested_amount` (default 30%), the application is rejected outright. Thin-file applicants face an additional hard cap: amount ≤ `thin_file_income_multiple × monthly_income` and tenor ≤ `thin_file_max_tenor`.

**Stage 5 — Manual Review Triggers**
Approved applications are escalated to MANUAL_REVIEW when any of the following is true: score is within `manual_review_buffer` points of a threshold boundary, loan amount exceeds `high_value_threshold`, or the applicant has fewer than 20 transactions on record.

---

## Configurable Risk Policy

All scoring thresholds and limits are driven by a `RiskPolicy` object passed with each request. If none is provided, the brain uses its own built-in defaults. This means a fintech operator can tighten or loosen any parameter from their dashboard without touching the engine.

Default values:

| Parameter | Default | Description |
|---|---|---|
| `score_reject_floor` | 500 | Score below which application is rejected |
| `score_manual_floor` | 600 | Score below which application goes to manual review |
| `score_approve_floor` | 700 | Score at or above which application is approved |
| `manual_review_buffer` | 20 pts | Borderline buffer around each threshold |
| `high_value_threshold` | ₦500,000 | Loan amount that triggers manual review |
| `affordability_cap` | 0.35 | Max payment as share of safe income |
| `min_viable_offer_ratio` | 0.30 | Minimum counter-offer as share of requested amount |
| `thin_file_income_multiple` | 2× | Max loan as multiple of monthly income (thin-file) |
| `thin_file_max_tenor` | 6 months | Max tenor for thin-file applicants |
| `minimum_monthly_income` | ₦30,000 | Income below this knocks out the application |
| `income_staleness_days` | 90 days | Max age of last income record before knockout |
| `min_account_age_months` | 3 months | Account must be at least this old |
| `max_overdrafts` | 10 | Overdraft transactions allowed before knockout |
| `max_bounced_payments` | 3 | Bounced payment transactions allowed before knockout |
| `max_consecutive_failures` | 3 | Consecutive missed loan payments before knockout |

---

## API

**`POST /analyze`**

Accepts an `AnalyzeRequest` with applicant details, bank account data, optional credit history, and an optional risk policy. Returns an `AnalyzeResponse` containing:

- `decision`: APPROVED, REJECTED, COUNTER_OFFER, or MANUAL_REVIEW
- `score`: 350–850
- `score_band`: named risk tier
- `score_breakdown`: points earned per component
- `approval_details` or `counter_offer`: terms with monthly payment and DTI
- `eligible_tenors`: max affordable amount at each standard tenor
- `manual_review_reasons`: list of triggers fired
- `explainability`: key strengths, key weaknesses, and primary reason
- `regulatory_compliance`: flags for identity verified, credit bureau checked, affordability assessed

**`GET /health`** — liveness check, returns timestamp.

---

## Stack

- Python 3.10+
- FastAPI (single dependency — includes uvicorn and Pydantic)
- Structured JSON-lines logging via stdlib `logging`
- No database — fully stateless, results are not persisted here
