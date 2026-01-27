interface ChatMessageProps {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className="flex justify-center">
      <div
        className={`rounded-lg px-6 py-4 max-w-3xl w-full ${
          role === "system"
            ? "bg-blue-50 text-blue-700 text-sm"
            : role === "user"
            ? "bg-gray-100 text-gray-900"
            : "bg-white border border-gray-200 text-gray-900"
        }`}
      >
        {content}
      </div>
    </div>
  );
}