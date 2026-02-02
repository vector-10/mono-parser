import { CheckCircle, XCircle, Info, Link } from "lucide-react";

interface ChatMessageProps {
  role: "system" | "user" | "assistant";
  content: string;
  isProcessing?: boolean;
  isComplete?: boolean;
  isLastSystemMessage?: boolean;
}

export default function ChatMessage({
  role,
  content,
  isProcessing = false,
  isComplete = false,
  isLastSystemMessage = false,
}: ChatMessageProps) {
  
  // For system messages that are process steps (processing or complete)
  if (role === "system" && (isProcessing || isComplete)) {
    const squareColor = isComplete ? "bg-green-500" : "bg-blue-500";
    const spinnerColor = isComplete ? "border-green-500" : "border-blue-500";
    const lineColor = isComplete ? "bg-green-500" : "bg-blue-500";

    return (
      <div className="flex justify-start pl-50">
        <div className="flex flex-col items-start">
          {/* Square with spinner */}
          <div className="relative">
            {/* Circular spinner border */}
            {isProcessing && !isComplete && (
              <div className="absolute inset-0 -m-2">
                <div
                  className={`w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full border-2 border-t-transparent ${spinnerColor} animate-spin`}
                />
              </div>
            )}

            {/* Completed ring (no animation) */}
            {isComplete && (
              <div className="absolute inset-0 -m-2">
                <div
                  className={`w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full border-2 ${spinnerColor}`}
                />
              </div>
            )}

            {/* The square */}
            <div
              className={`relative z-10 px-3 py-2 ${squareColor} rounded-lg flex items-center justify-center text-white text-sm font-medium`}
            >
              {content}
            </div>
          </div>

          {/* Vertical connector line */}
          {!isLastSystemMessage && (
            <div className={`w-0.5 h-4 ${lineColor} ml-[50%] my-1`} />
          )}
        </div>
      </div>
    );
  }

  // For non-process system messages (success/error/info)
  const isSuccess =
    content.includes("verified") ||
    content.includes("linked successfully") ||
    content.includes("generated successfully") ||
    content.includes("complete");
  const isError = content.includes("Error") || content.includes("Failed");
  const isLink = content.includes("bank linking");

  const getSystemStyle = () => {
    if (isSuccess) return "bg-green-50 text-green-700 border border-green-200";
    if (isError) return "bg-red-50 text-red-700 border border-red-200";
    if (isLink) return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-blue-50 text-blue-700 border border-blue-200";
  };

  const getIcon = () => {
    if (isSuccess) return <CheckCircle className="h-4 w-4 shrink-0" />;
    if (isError) return <XCircle className="h-4 w-4 shrink-0" />;
    if (isLink) return <Link className="h-4 w-4 shrink-0" />;
    return <Info className="h-4 w-4 shrink-0" />;
  };

  const cleanContent = content
    .replace(/^✅\s*/, "")
    .replace(/^❌\s*/, "")
    .replace(/^⏳\s*/, "")
    .replace(/^🔗\s*/, "")
    .replace(/^🧠\s*/, "")
    .replace(/^📊\s*/, "")
    .replace(/^💳\s*/, "")
    .replace(/^✓\s*/, "");

  return (
    <div className={`flex ${role === "user" ? "justify-end pr-50" : "justify-start pl-50"}`}>
      <div
        className={`rounded-lg ${
          role === "system"
            ? `px-3 py-2 text-sm font-medium inline-flex items-center gap-2 ${getSystemStyle()}`
            : role === "user"
            ? "px-4 py-2.5 bg-[#0055ba] text-white max-w-[50%]"
            : "px-4 py-2.5 bg-white border border-gray-200 text-gray-900 max-w-[50%]"
        }`}
      >
        {role === "system" && getIcon()}
        {role === "system" ? cleanContent : content}
      </div>
    </div>
  );
}