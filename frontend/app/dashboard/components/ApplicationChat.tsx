"use client";
import { useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

type Step = "amount" | "tenor" | "rate" | "purpose" | "confirm" | "link" | "analyzing" | "complete";

interface ApplicationChatProps {
  applicantId: string;
  applicantName: string;
}

export default function ApplicationChat({ applicantId, applicantName }: ApplicationChatProps) {
  const [step, setStep] = useState<Step>("amount");
  const [messages, setMessages] = useState([
    { role: "system" as const, content: `Let's create a loan application for ${applicantName}` },
    { role: "assistant" as const, content: "What's the loan amount in Naira (₦)?" },
  ]);
  
  const [formData, setFormData] = useState({
    amount: "",
    tenor: "",
    rate: "",
    purpose: "",
  });
  
  const [currentInput, setCurrentInput] = useState("");

  const handleSubmit = () => {
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage = { role: "user" as const, content: currentInput };
    setMessages((prev) => [...prev, userMessage]);

    // Process based on current step
    if (step === "amount") {
      setFormData({ ...formData, amount: currentInput });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Great! ₦${Number(currentInput).toLocaleString()}. What's the loan tenor in months?` },
      ]);
      setStep("tenor");
    } else if (step === "tenor") {
      setFormData({ ...formData, tenor: currentInput });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Perfect! ${currentInput} months. What's the interest rate (%)?` },
      ]);
      setStep("rate");
    } else if (step === "rate") {
      setFormData({ ...formData, rate: currentInput });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "What's the purpose of this loan? (optional - press Enter to skip)" },
      ]);
      setStep("purpose");
    } else if (step === "purpose") {
      setFormData({ ...formData, purpose: currentInput });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "All set! Creating application..." },
      ]);
      setStep("link");
      // TODO: Call API to create application
    }

    setCurrentInput("");
  };

  const getPlaceholder = () => {
    switch (step) {
      case "amount":
        return "Enter amount (e.g., 100000)";
      case "tenor":
        return "Enter tenor in months (e.g., 6)";
      case "rate":
        return "Enter interest rate (e.g., 5.0)";
      case "purpose":
        return "Enter purpose or press Enter to skip";
      default:
        return "";
    }
  };

  const getInputType = () => {
    return step === "amount" || step === "tenor" || step === "rate" ? "number" : "text";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

      {/* Input */}
      <ChatInput
        value={currentInput}
        onChange={setCurrentInput}
        onSubmit={handleSubmit}
        placeholder={getPlaceholder()}
        type={getInputType()}
        disabled={step === "analyzing" || step === "complete"}
      />
    </div>
  );
}