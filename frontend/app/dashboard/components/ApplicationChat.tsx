"use client";
import { useState } from "react";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";
import { useMonoConnect } from "@/lib/hooks/use-mono-connect";
import { useMonoPublicKey } from "@/lib/hooks/queries/use-mono-public-key";
import { useExchangeMonoToken } from "@/lib/hooks/queries/use-exchange-mono-token";

type Step = "amount" | "tenor" | "rate" | "purpose" | "creating" | "link" | "linking" | "ask-more" | "analyzing" | "complete";

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
  const [linkedAccountsCount, setLinkedAccountsCount] = useState(0);

  const { mutate: createApplication } = useCreateApplication();
  const { openMonoConnect, isReady: isMonoReady } = useMonoConnect();
  const { data: monoKeyData } = useMonoPublicKey();
  const { mutate: exchangeToken } = useExchangeMonoToken();

  const handleMonoSuccess = (code: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "system", content: "⏳ Verifying bank account..." },
    ]);

    exchangeToken({ code, applicantId }, {
      onSuccess: (data) => {
        setLinkedAccountsCount((prev) => prev + 1);
        setMessages((prev) => [
          ...prev,
          { role: "system", content: `✅ ${data.bankAccount.institution} account linked! (${linkedAccountsCount + 1} account${linkedAccountsCount + 1 > 1 ? 's' : ''} linked)` },
          { role: "assistant", content: "Would you like to link another bank account? (Yes/No)" },
        ]);
        setStep("ask-more");
        toast.success("Bank account linked!");
      },
      onError: (error: any) => {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: `❌ Failed to link account: ${error.message}` },
        ]);
        setStep("link");
        toast.error("Failed to link bank account");
      },
    });
  };

  const openMonoWidget = () => {
    if (!monoKeyData?.publicKey) {
      toast.error("Mono public key not configured");
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "❌ Mono public key not found. Please add your API keys first." },
      ]);
      setStep("link");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "system", content: "🔗 Opening Mono Connect..." },
    ]);
    setStep("linking");

    openMonoConnect({
      key: monoKeyData.publicKey,
      onSuccess: handleMonoSuccess,
      onClose: () => {
        if (step === "linking") {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Mono Connect closed. Type 'Yes' to try again or 'No' to skip." },
          ]);
          setStep("link");
        }
      },
    });
  };

  const handleSubmit = () => {
    if (!currentInput.trim()) return;

    const userMessage: Message = { role: "user", content: currentInput };
    setMessages((prev) => [...prev, userMessage]);

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
          toast.success("Application created!");
        },
        onError: (error: any) => {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: `❌ Failed: ${error.message}` },
          ]);
          setStep("purpose");
          toast.error("Failed to create application");
        },
      });
    } else if (step === "link") {
      const response = currentInput.toLowerCase();
      
      if (response === "yes" || response === "y") {
        openMonoWidget();
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "✅ Application ready! Link accounts later to start analysis." },
        ]);
        setStep("complete");
      }
    } else if (step === "ask-more") {
      const response = currentInput.toLowerCase();
      
      if (response === "yes" || response === "y") {
        openMonoWidget();
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "🧠 Starting analysis..." },
        ]);
        setStep("analyzing");
        // TODO: Call start-analysis endpoint with WebSocket clientId
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
      case "ask-more":
        return "Type 'Yes' or 'No'";
      default:
        return "";
    }
  };

  const getInputType = () => {
    return step === "amount" || step === "tenor" || step === "rate" ? "number" : "text";
  };

  const isInputDisabled = step === "creating" || step === "linking" || step === "analyzing" || step === "complete";

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

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