"use client";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { use } from "react";
import { useApplication } from "@/lib/hooks/queries/use-application";

export default function ApplicationChatPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const { data: application, isLoading, error } = useApplication(applicationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0055ba]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load application</h3>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  // Build messages based on application status
  const messages = [
    {
      role: "system",
      content: `Analyzing application for ${application.applicant?.name}...`,
    },
  ];

  if (application.status === "PROCESSING") {
    messages.push({
      role: "assistant",
      content: "🔄 **Analysis in progress...**\n\nPlease wait while we analyze the applicant's financial data.",
    });
  } else if (application.status === "APPROVED" || application.status === "REJECTED") {
    const decision = application.decision || {};
    messages.push({
      role: "assistant",
      content: `**Credit Score:** ${application.score || "N/A"}

**Decision:** ${application.status === "APPROVED" ? "APPROVED ✅" : "REJECTED ❌"}

${decision.recommended_amount ? `**Recommended Amount:** ₦${decision.recommended_amount.toLocaleString()}` : ""}
${decision.tenor ? `**Tenor:** ${decision.tenor} months` : ""}
${decision.interest_rate ? `**Interest Rate:** ${decision.interest_rate}%` : ""}

**Analysis:**
${decision.narrative || "Analysis details not available"}`,
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">{application.applicant?.name}</h2>
        <p className="text-sm text-gray-500">
          Application ID: {applicationId} • Status: <span className={`font-medium ${
            application.status === 'APPROVED' ? 'text-[#59a927]' :
            application.status === 'REJECTED' ? 'text-red-500' :
            application.status === 'PROCESSING' ? 'text-yellow-600' :
            'text-gray-600'
          }`}>{application.status}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className="flex justify-center">
            <div
              className={`rounded-lg px-4 py-3 max-w-5xl w-full ${
                msg.role === "system"
                  ? "bg-blue-50 text-blue-700 text-sm"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="prose prose-sm max-w-none">
                {msg.content.split("\n").map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input (disabled) */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-5xl mx-auto flex gap-3">
          <input
            type="text"
            disabled
            placeholder={
              application.status === "PROCESSING"
                ? "Analysis in progress..."
                : "Analysis complete - no input needed"
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button disabled className="p-2 bg-gray-300 rounded-lg">
            <Send className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}