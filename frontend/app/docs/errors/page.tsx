import { CodeBlock } from "../components/CodeBlock";

const errors = [
  { code: "400", meaning: "Bad Request", cause: "Missing required field, invalid value, or the application is in a terminal state." },
  { code: "401", meaning: "Unauthorized", cause: "Missing or invalid x-api-key header." },
  { code: "404", meaning: "Not Found", cause: "The applicationId or applicantId does not belong to your account." },
  { code: "429", meaning: "Too Many Requests", cause: "Rate limit exceeded. /initiate and /analyze are limited to 20 requests per minute." },
  { code: "500", meaning: "Internal Server Error", cause: "Unexpected server error. Mono API key not configured, or a downstream service failure." },
];

export default function ErrorsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Handling</h1>
      <p className="text-gray-600 text-sm mb-6">
        All errors follow a consistent shape with an HTTP status code and a message field.
      </p>

      <CodeBlock
        lang="json"
        code={`{
  "statusCode": 400,
  "message":    "Cannot link accounts to an application with status: COMPLETED",
  "error":      "Bad Request"
}`}
      />

      <div className="overflow-x-auto border border-gray-200 mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Status", "Meaning", "Common Cause"].map((h) => (
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
            {errors.map((row) => (
              <tr key={row.code} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-xs font-bold text-red-600">{row.code}</td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-700">{row.meaning}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{row.cause}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
