import { Loader2, CheckCircle, XCircle, Info, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
  isLastInSequence?: boolean;
}

export default function ChatMessage({ 
  role, 
  content, 
  link,
  isProcessing = false, 
  isComplete = false,
  isLastInSequence = false
}: ChatMessageProps) {
  

  if (role === "system" && (isProcessing || isComplete)) {
    return (
      <div className="flex justify-start">
        <div className="flex flex-col items-start">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              {isProcessing && (
                <div className="absolute -inset-1">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              )}
              <div className={`w-4 h-4 rounded ${isComplete ? 'bg-green-500' : 'bg-blue-500'} relative z-10 flex items-center justify-center`}>
                {isComplete && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-700 pt-0.5">{content}</span>
          </div>
          {!isLastInSequence && <div className="w-0.5 h-4 bg-gray-300 ml-2 my-1" />}
        </div>
      </div>
    );
  }

  // System Style Helpers
  const isSuccess = content.includes("verified") || content.includes("linked successfully") || content.includes("generated successfully");
  const isError = content.includes("Error") || content.includes("Failed");
  const isLinkMsg = content.includes("bank linking");

  const getSystemStyle = () => {
    if (isSuccess) return "bg-green-50 text-green-700 border border-green-200";
    if (isError) return "bg-red-50 text-red-700 border border-red-200";
    if (isLinkMsg) return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-blue-50 text-blue-700 border border-blue-200";
  };

  const getIcon = () => {
    if (isSuccess) return <CheckCircle className="h-4 w-4 shrink-0" />;
    if (isError) return <XCircle className="h-4 w-4 shrink-0" />;
    if (isLinkMsg) return <LinkIcon className="h-4 w-4 shrink-0" />;
    return <Info className="h-4 w-4 shrink-0" />;
  };

  const cleanContent = content.replace(/^[✅❌⏳🔗🧠📊💳✓]\s*/, "");

  return (
    <div className={`flex flex-col ${role === "user" ? "items-end" : "items-start"}`}>
      <div
        className={`rounded-lg ${
          role === "system"
            ? `px-3 py-2 text-sm font-medium inline-flex items-center gap-2 ${getSystemStyle()}`
            : role === "user"
            ? "px-4 py-2.5 bg-[#0055ba] text-white max-w-[80%]"
            : "px-4 py-2.5 bg-white border border-gray-200 text-gray-900 max-w-[80%] whitespace-pre-line shadow-sm"
        }`}
      >
        {role === "system" && getIcon()}
        {role === "system" ? cleanContent : content}
      </div>

      {/* Link Action UI - Nested inside the message flow */}
      {link && (
        <div className="mt-2 w-full max-w-[320px] p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] text-blue-600 mb-2 font-bold uppercase tracking-wider">
            Bank Linking URL
          </p>
          <div className="flex gap-2">
            <p className="flex-1 text-xs text-blue-700 truncate bg-white border border-blue-100 rounded px-2 py-2 font-mono">
              {link}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast.success("Link copied!");
              }}
              className="px-3 py-1.5 bg-[#0055ba] text-white rounded hover:bg-[#004494] text-[10px] font-bold whitespace-nowrap"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}