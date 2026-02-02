import { Loader2, CheckCircle, XCircle, Info, Link } from "lucide-react";
import ProcessStep from "./ProcessStep";


interface ChatMessageProps {
  role: "system" | "user" | "assistant";
  content: string;
  isProcessing?: boolean;
  isComplete?: boolean;
  isLastSystemMessage?: boolean;  
}


export default function ChatMessage({ role, 
  content, 
  isProcessing = false,
  isComplete = false,
  isLastSystemMessage = false }: ChatMessageProps) {

    if (role === "system" && (isProcessing || isComplete)) {
    return (
      <div className="flex justify-center my-2">
        <ProcessStep
          content={content}
          isProcessing={isProcessing}
          isComplete={isComplete}
          showConnector={!isLastSystemMessage}
        />
      </div>
    );
  }

  const isSuccess = content.startsWith("✅") || (!content.endsWith("...") && !content.startsWith("❌") && (
    content.includes("verified") ||
    content.includes("linked successfully") ||
    content.includes("generated successfully") ||
    content.includes("complete")
  ));
  const isError = content.startsWith("❌");
  const isLink = content.includes("bank linking");

  const getSystemStyle = () => {
    if (isSuccess) return "bg-green-50 text-green-700 border border-green-200";
    if (isError) return "bg-red-50 text-red-700 border border-red-200";
    if (isProcessing || isLink) return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-blue-50 text-blue-700 border border-blue-200";
  };

  const getIcon = () => {
    if (isSuccess) return <CheckCircle className="h-4 w-4 shrink-0" />;
    if (isError) return <XCircle className="h-4 w-4 shrink-0" />;
    if (isLink) return <Link className="h-4 w-4 shrink-0" />;
    if (isProcessing) return <Loader2 className="h-4 w-4 shrink-0 animate-spin" />;
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

      <div className={`flex ${role === "user" ? "justify-end pr-50 " : "justify-start pl-50"}`}>
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