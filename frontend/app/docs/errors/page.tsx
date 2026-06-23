import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";

const statusCodes = [
  {
    code: "400",
    meaning: "Bad Request",
    cause: "Missing or invalid field, or the application is in the wrong state for that operation.",
    retry: false,
  },
  {
    code: "401",
    meaning: "Unauthorized",
    cause: "Missing or invalid x-api-key header.",
    retry: false,
  },
  {
    code: "403",
    meaning: "Forbidden",
    cause: "The idempotency key exists but belongs to a different account.",
    retry: false,
  },
  {
    code: "404",
    meaning: "Not Found",
    cause: "The applicationId or applicantId does not exist or does not belong to your account.",
    retry: false,
  },
  {
    code: "409",
    meaning: "Conflict",
    cause: "An application already exists for this idempotency key and is in a non-resumable state (LINKED, PROCESSING, COMPLETED, or FAILED). Use a new idempotency key.",
    retry: false,
  },
  {
    code: "429",
    meaning: "Too Many Requests",
    cause: "/initiate is limited to 20 req/min. /analyze is limited to 30 req/min. All other endpoints share a global limit of 60 req/min per IP.",
    retry: true,
  },
  {
    code: "500",
    meaning: "Internal Server Error",
    cause: "Unexpected server error — commonly caused by a missing Mono API key or a downstream service failure. Safe to retry with backoff.",
    retry: true,
  },
];

const endpointErrors = [
  {
    endpoint: "POST /applications/initiate",
    errors: [
      { status: "400", scenario: "Missing required field (firstName, lastName, email, amount, tenor, interestRate, or idempotencyKey)" },
      { status: "400", scenario: "Invalid field value (e.g. email is not a valid address, tenor is not a positive integer)" },
      { status: "403", scenario: "idempotencyKey already used by a different account" },
      { status: "409", scenario: "idempotencyKey matches an existing application in LINKED, PROCESSING, COMPLETED, or FAILED state" },
      { status: "500", scenario: "Mono API key not configured on your account — add it in Settings before calling this endpoint" },
    ],
  },
  {
    endpoint: "POST /applications/:id/link-account",
    errors: [
      { status: "400", scenario: "Application is in a terminal state: COMPLETED, FAILED, or ABANDONED — cannot re-link" },
      { status: "404", scenario: "applicationId not found or does not belong to your account" },
      { status: "500", scenario: "Mono API key not configured" },
    ],
  },
  {
    endpoint: "POST /applications/:id/finalize-linking",
    errors: [
      { status: "400", scenario: "Application is not in LINKED status — must have at least one account linked first" },
      { status: "400", scenario: "No accounts have been linked to this application yet" },
      { status: "404", scenario: "applicationId not found or does not belong to your account" },
    ],
  },
  {
    endpoint: "POST /applications/:id/analyze",
    errors: [
      { status: "400", scenario: "Application has no linked bank accounts — linking must complete before analysis" },
      { status: "404", scenario: "applicationId not found or does not belong to your account" },
    ],
  },
];

export default function ErrorsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Handling</h1>
      <p className="text-gray-600 text-sm mb-6">
        All errors return a consistent JSON shape with an HTTP status code and a plain-language message.
        The <code className="bg-gray-100 px-1 py-0.5 text-xs">message</code> field is the primary signal
        — there is no machine-readable error code field beyond the HTTP status.
      </p>

      <CodeBlock
        lang="json"
        code={`{
  "statusCode": 400,
  "message":    "Cannot finalize linking for application with status: PENDING_LINKING",
  "error":      "Bad Request"
}`}
      />

      {/* ── Status codes ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-8 mb-3">Status Codes</h2>
      <div className="overflow-x-auto border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Status", "Meaning", "Common Cause", "Retryable"].map((h) => (
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
            {statusCodes.map((row) => (
              <tr key={row.code} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-xs font-bold text-red-600">{row.code}</td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{row.meaning}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{row.cause}</td>
                <td className="px-4 py-3 text-xs">
                  {row.retry ? (
                    <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 font-semibold">Yes</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 font-semibold">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Per-endpoint errors ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-10 mb-3">Per-Endpoint Error Scenarios</h2>
      <p className="text-gray-600 text-sm mb-5">
        400 errors mean different things depending on the endpoint. The <code className="bg-gray-100 px-1 py-0.5 text-xs">message</code> string
        will always describe the exact cause.
      </p>

      <div className="space-y-6">
        {endpointErrors.map((section) => (
          <div key={section.endpoint} className="border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <code className="text-xs font-mono font-semibold text-gray-900">{section.endpoint}</code>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {section.errors.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-red-600 w-14 shrink-0">{e.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{e.scenario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── Retry guidance ── */}
      <h2 className="font-semibold text-gray-900 text-base mt-10 mb-3">Retry Guidance</h2>

      <div className="space-y-3">
        <div className="border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-800 mb-1">400, 401, 403, 404 — Do not retry</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            These indicate a problem with your request. Fix the payload, check your API key, or verify the
            applicationId before trying again. Retrying without a change will return the same error.
          </p>
        </div>

        <div className="border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-800 mb-1">409 — Do not retry with the same idempotency key</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            If the conflicting application is in PENDING_LINKING or ABANDONED state it will be automatically
            resumed — the 409 will not fire. A 409 means the application is past a point where resumption
            makes sense. Generate a new idempotency key to start fresh.
          </p>
        </div>

        <div className="border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-800 mb-1">429 — Retry with exponential backoff</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Wait at least one full minute before retrying. Build exponential backoff into your integration.
            The rate window resets every 60 seconds.
          </p>
        </div>

        <div className="border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-800 mb-1">500 — Safe to retry with backoff</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Most 500s are transient. Retry up to 3 times with exponential backoff (e.g. 1s, 2s, 4s).
            If the error persists, the most common cause is a missing Mono API key — verify it in Settings.
          </p>
        </div>
      </div>

      <Callout type="info">
        All API calls from your server to Mono-Parser should be idempotent where possible. Use the{" "}
        <code>idempotencyKey</code> on <code>/initiate</code> to safely retry on network timeouts
        without creating duplicate applications.
      </Callout>
    </div>
  );
}
