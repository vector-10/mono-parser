"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";
import { useStartAnalysis } from "@/lib/hooks/queries/use-start-analysis";
import { useExplainResults } from "@/lib/hooks/queries/use-explain-results";
import { useApplication } from "@/lib/hooks/queries/use-application";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { useAuthStore } from "@/lib/store/auth";
import { useInitiateMonoLink } from "@/lib/hooks/queries/use-initiate-mono-link";

type Step =
  | "welcome"
  | "link-account"
  | "linking"
  | "ask-more-accounts"
  | "amount"
  | "tenor"
  | "rate"
  | "purpose"
  | "creating"
  | "analyzing"
  | "complete";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string; // For displaying Mono link
};

interface ApplicationChatProps {
  applicantId: string;
  applicantName: string;
}

export default function ApplicationChat({
  applicantId,
  applicantName,
}: ApplicationChatProps) {
  const [step, setStep] = useState<Step>("welcome");
  const user = useAuthStore((state) => state.user);
  const [shouldExplain, setShouldExplain] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome ${user?.name}! 👋 To create a loan application for ${applicantName}, let's start by linking their bank accounts. This helps us analyze the applicant's financial profile.`,
    },
    {
      role: "assistant",
      content: "Would you like to generate a bank linking URL? (Yes/No)",
    },
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
  const { mutate: startAnalysis } = useStartAnalysis();
  const { mutate: initiateMonoLink, isPending: isGeneratingLink } = useInitiateMonoLink();
  const { isConnected, on, off, getClientId, socket } = useWebSocket();
  const { data: applicationData } = useApplication(applicationId);
  const { data: explanation, isLoading: isExplaining } = useExplainResults(
    applicationId,
    shouldExplain,
  );

  // Join user room on connection
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('join_user_room', { userId: user.id });
    }
  }, [socket, user?.id]);

  // Listen for WebSocket events
  useEffect(() => {
    on("application_progress", (data: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: data.message },
      ]);
    });

    on("application_complete", (data: any) => {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "✅ Analysis complete!" },
        { role: "assistant", content: `Processing results...` },
      ]);
      setStep("complete");
      setShouldExplain(true);
    });

    on("application_error", (data: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `❌ Error: ${data.message}` },
      ]);
      setStep("complete");
      toast.error("Analysis failed");
    });

    // ✅ Listen for account linked event from webhook
    on("account_linked", (data: { 
      applicantId: string;
      accountId: string;
      institution: string;
      accountNumber: string;
    }) => {
      if (data.applicantId === applicantId) {
        setLinkedAccountsCount((prev) => prev + 1);
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `✅ ${data.institution} account (${data.accountNumber}) linked successfully! (${linkedAccountsCount + 1} account${linkedAccountsCount + 1 > 1 ? "s" : ""} total)`,
          },
          {
            role: "assistant",
            content: "Great! Would you like to generate another linking URL? (Yes/No)",
          },
        ]);
        setStep("ask-more-accounts");
        toast.success("Bank account linked!");
      }
    });

    return () => {
      off("application_progress");
      off("application_complete");
      off("application_error");
      off("account_linked");
    };
  }, [on, off, applicantId, linkedAccountsCount]);

  useEffect(() => {
    if (explanation?.explanation) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: explanation.explanation },
      ]);
      setStep("complete");
      toast.success("Results ready!");
    }
  }, [explanation]);

  const handleGenerateLink = () => {
    setMessages((prev) => [
      ...prev,
      { role: "system", content: "🔗 Generating bank linking URL..." },
    ]);
    setStep("linking");

    initiateMonoLink(applicantId, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "✅ Link generated successfully!",
          },
          {
            role: "assistant",
            content: `Here's the bank linking URL for ${applicantName}. Copy and send it to them:`,
            link: data.widgetUrl,
          },
          {
            role: "assistant",
            content: "I'll notify you when they complete the linking process. Would you like to generate another link? (Yes/No)",
          },
        ]);
        setStep("ask-more-accounts");
        toast.success("Link generated!");
      },
      onError: (error: any) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `❌ Failed to generate link: ${error.message}`,
          },
          {
            role: "assistant",
            content: "Would you like to try again? (Yes/No)",
          },
        ]);
        setStep("link-account");
        toast.error("Failed to generate link");
      },
    });
  };

  const handleStartAnalysis = () => {
    const clientId = getClientId();

    if (!clientId) {
      toast.error("WebSocket not connected");
      return;
    }

    if (!applicationId) {
      toast.error("No application to analyze");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "system", content: "🧠 Starting analysis..." },
    ]);
    setStep("analyzing");

    startAnalysis(
      { applicationId, clientId },
      {
        onError: (error: any) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `❌ Failed to start analysis: ${error.message}`,
            },
          ]);
          setStep("complete");
          toast.error("Failed to start analysis");
        },
      },
    );
  };

  const proceedToLoanDetails = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Perfect! ${applicantName} has ${linkedAccountsCount} bank account${linkedAccountsCount > 1 ? "s" : ""} linked. Now let's create the loan application.`,
      },
      {
        role: "assistant",
        content: "What's the loan amount in Naira (₦)?",
      },
    ]);
    setStep("amount");
  };

  const handleSubmit = () => {
    if (!currentInput.trim()) return;

    const userMessage: Message = { role: "user", content: currentInput };
    setMessages((prev) => [...prev, userMessage]);

    if (step === "welcome" || step === "link-account") {
      const response = currentInput.toLowerCase();

      if (response === "yes" || response === "y") {
        handleGenerateLink();
      } else if (response === "skip" || response === "no" || response === "n") {
        if (linkedAccountsCount > 0) {
          proceedToLoanDetails();
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "⚠️ At least one bank account must be linked to proceed. Would you like to generate a linking URL? (Yes/No)",
            },
          ]);
        }
      }
    } else if (step === "ask-more-accounts") {
      const response = currentInput.toLowerCase();

      if (response === "yes" || response === "y") {
        handleGenerateLink();
      } else {
        proceedToLoanDetails();
      }
    } else if (step === "amount") {
      setFormData({ ...formData, amount: currentInput });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Great! ₦${Number(currentInput).toLocaleString()}. What's the loan tenor in months?`,
        },
      ]);
      setStep("tenor");
    } else if (step === "tenor") {
      setFormData({ ...formData, tenor: currentInput });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Perfect! ${currentInput} months. What's the interest rate (%)?`,
        },
      ]);
      setStep("rate");
    } else if (step === "rate") {
      setFormData({ ...formData, rate: currentInput });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "What's the purpose of this loan? (optional - press Enter to skip)",
        },
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

      createApplication(
        {
          applicantId,
          amount: Number(updatedFormData.amount),
          tenor: Number(updatedFormData.tenor),
          interestRate: Number(updatedFormData.rate),
          purpose: updatedFormData.purpose || undefined,
        },
        {
          onSuccess: (data) => {
            setApplicationId(data.applicationId);
            setMessages((prev) => [
              ...prev,
              { role: "system", content: "✅ Application created!" },
              {
                role: "assistant",
                content: "Starting automatic analysis...",
              },
            ]);
            toast.success("Application created!");
            
            // Auto-start analysis
            setTimeout(() => handleStartAnalysis(), 1000);
          },
          onError: (error: any) => {
            setMessages((prev) => [
              ...prev,
              { role: "system", content: `❌ Failed: ${error.message}` },
            ]);
            setStep("purpose");
            toast.error("Failed to create application");
          },
        },
      );
    }

    setCurrentInput("");
  };

  const getPlaceholder = () => {
    switch (step) {
      case "welcome":
      case "link-account":
      case "ask-more-accounts":
        return "Type 'Yes' or 'No'";
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
    return step === "amount" || step === "tenor" || step === "rate"
      ? "number"
      : "text";
  };

  const isInputDisabled =
    step === "creating" ||
    step === "linking" ||
    step === "analyzing" ||
    step === "complete" ||
    isGeneratingLink;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          ⚠️ Connecting to server...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatMessage role={msg.role} content={msg.content} />
            {msg.link && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Linking URL:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={msg.link}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.link!);
                      toast.success("Link copied!");
                    }}
                    className="px-4 py-2 bg-[#0055ba] text-white rounded hover:bg-[#004494] text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
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