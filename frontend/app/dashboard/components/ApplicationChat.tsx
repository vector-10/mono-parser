"use client";
import { useState } from "react";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";

type Step = "amount" | "tenor" | "rate" | "purpose" | "creating" | "link" | "analyzing" | "complete";

type Message = { 
  role: "system" | "user" | "assistant"; 
  content: string; 
};

interface ApplicationChatProps {
  applicantId: string;
  applicantName: string;
}

export default function ApplicationChat({ applicantId, applicantName }: ApplicationChatProps) {
  const [step, setStep] = useState<Step>("amount");
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: `Let's create a loan application for ${applicantName}` },
    { role: "assistant", content: "What's the loan amount in Naira (₦)?" },
  ]);
  
  const [formData, setFormData] = useState({
    amount: "",
    tenor: "",
    rate: "",
    purpose: "",
  });
  
  const [currentInput, setCurrentInput] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const { mutate: createApplication, isPending: isCreating } = useCreateApplication();

  const handleSubmit = () => {
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: currentInput };
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
      const updatedFormData = { ...formData, purpose: currentInput };
      setFormData(updatedFormData);
      
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "⏳ Creating application..." },
      ]);
      setStep("creating");

      // Create application
      createApplication({
        applicantId,
        amount: Number(updatedFormData.amount),
        tenor: Number(updatedFormData.tenor),
        interestRate: Number(updatedFormData.rate),
        purpose: updatedFormData.purpose || undefined,
      }, {
        onSuccess: (data) => {
          setApplicationId(data.applicationId);
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "✅ Application created!" },
            { role: "assistant", content: "Would you like to link a bank account? (Yes/No)" },
          ]);
          setStep("link");
          toast.success("Application created successfully!");
        },
        onError: (error: any) => {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: `❌ Failed to create application: ${error.message}` },
          ]);
          setStep("purpose");
          toast.error("Failed to create application");
        },
      });
    } else if (step === "link") {
      const response = currentInput.toLowerCase();
      
      if (response === "yes" || response === "y") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Great! Opening Mono Connect to link bank account..." },
        ]);
        // TODO: Open Mono Connect widget
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Understood. You can link bank accounts later from the applicant profile." },
          { role: "system", content: "✅ Application ready! Link a bank account to start analysis." },
        ]);
        setStep("complete");
      }
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
      case "link":
        return "Type 'Yes' or 'No'";
      default:
        return "";
    }
  };

  const getInputType = () => {
    return step === "amount" || step === "tenor" || step === "rate" ? "number" : "text";
  };

  const isInputDisabled = step === "creating" || step === "analyzing" || step === "complete";

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
        disabled={isInputDisabled}
      />
    </div>
  );
}