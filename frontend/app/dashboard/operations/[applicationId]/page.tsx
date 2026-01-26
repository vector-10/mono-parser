"use client";
import { Send } from "lucide-react";
import { use } from "react";

export default function ApplicationChatPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);

  // Mock data - will come from API
  const messages = [
    {
      role: "system",
      content: "Analyzing application for Samuel Okon...",
    },
    {
      role: "assistant",
      content: `**Credit Score:** 668

**Decision:** APPROVED ✅

**Recommended Amount:** ₦80,000
**Tenor:** 6 months
**Interest Rate:** 4.5%

**Analysis:**
Samuel demonstrates strong financial stability with consistent monthly income of ₦350,000. His spending pattern is predictable at ₦280k/month, maintaining a healthy 20% savings rate.`,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Samuel Okon</h2>
        <p className="text-sm text-gray-500">Application ID: {applicationId}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
           <div key={i} className="flex justify-center">
            <div
              className={`rounded-lg px-4 py-3 max-w-3xl ${
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

      {/* Input (disabled for now) */}
      <div className="border-t border-gray-200 p-4 bg-white  ">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            disabled
            placeholder="Analysis complete - no input needed"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button className="p-2 bg-gray-300 rounded-lg">
            <Send className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
