import { Loader2, CheckCircle, XCircle, Info, Link } from "lucide-react";

interface ChatMessageProps {
  role: "system" | "user" | "assistant";
  content: string;
  isProcessing?: boolean;
  isComplete?: boolean;
  isLastInSequence?: boolean;
}

export default function ChatMessage({ 
  role, 
  content, 
  isProcessing = false, 
  isComplete = false,
  isLastInSequence = false
}: ChatMessageProps) {
  
  if (role === "system" && (isProcessing || isComplete)) {
    return (
      <div className="flex justify-start">
        <div className="flex flex-col items-start">
          <div className="flex items-start gap-3">
            {/* Small square with spinner or checkmark */}
            <div className="relative flex-shrink-0">
              {/* Spinner ring around square */}
              {isProcessing && (
                <div className="absolute -inset-1">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              )}
              
              {/* The square */}
              <div className={`w-4 h-4 rounded ${isComplete ? 'bg-green-500' : 'bg-blue-500'} relative z-10 flex items-center justify-center`}>
                {isComplete && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>

            {/* Text beside square */}
            <span className="text-sm text-gray-700 pt-0.5">{content}</span>
          </div>

          {/* Vertical connector line */}
          {!isLastInSequence && (
            <div className="w-0.5 h-4 bg-gray-300 ml-2 my-1" />
          )}
        </div>
      </div>
    );
  }


  const isSuccess = content.includes("verified") || content.includes("linked successfully") || content.includes("generated successfully");
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
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-lg ${
          role === "system"
            ? `px-3 py-2 text-sm font-medium inline-flex items-center gap-2 ${getSystemStyle()}`
            : role === "user"
            ? "px-4 py-2.5 bg-[#0055ba] text-white max-w-[75%]"
            : "px-4 py-2.5 bg-white border border-gray-200 text-gray-900 max-w-[75%] whitespace-pre-line"
        }`}
      >
        {role === "system" && getIcon()}
        {role === "system" ? cleanContent : content}
      </div>
    </div>
  );
}