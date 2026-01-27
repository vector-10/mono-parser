import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  type?: "text" | "number";
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  type = "text",
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="max-w-3xl mx-auto flex gap-3">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0055ba] focus:border-transparent disabled:bg-gray-50"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="px-4 py-3 bg-[#0055ba] text-white rounded-lg hover:bg-[#004494] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}