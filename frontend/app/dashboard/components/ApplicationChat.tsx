"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useAuthStore } from "@/lib/store/auth";
import { useApplicationWebSocket } from "@/lib/hooks/useApplicationWebSocket";
import { useApplicationActions } from "@/lib/hooks/useApplicationActions";
import { useApplicationFlow } from "@/lib/hooks/useApplicationFlow";
import { useExplainResults } from "@/lib/hooks/queries/use-explain-results";
import { useApplication } from "@/lib/hooks/queries/use-application";
import { useApplicant } from "@/lib/hooks/queries/use-applicant";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
};

type ApplicantWithRelations = {
  id: string;
  firstName: string;
  lastName: string;
  bankAccounts: Array<{ id: string; institution?: string }>;
  applications: Array<{
    id: string;
    amount: number;
    status: string;
    purpose?: string;
    score?: number;
    createdAt: string;
  }>;
};

interface ApplicationChatProps {
  applicantId: string;
  applicantName: string;
}

export default function ApplicationChat({
  applicantId,
  applicantName,
}: ApplicationChatProps) {
  const user = useAuthStore((state) => state.user);
  const [linkedAccountsCount, setLinkedAccountsCount] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [shouldExplain, setShouldExplain] = useState(false);

  const { data: applicant } = useApplicant(applicantId) as {
    data: ApplicantWithRelations | undefined;
  };

  const { isConnected, getClientId } = useApplicationWebSocket(
    applicantId,
    (data) => {
      setLinkedAccountsCount((prev) => prev + 1);
      flow.onAccountLinked({
        institution: data.institution,
        accountNumber: data.accountNumber,
        accountsTotal: linkedAccountsCount + 1,
      });
    },
    (message) => flow.onApplicationProgress(message),
    () => {
      flow.onApplicationComplete();
      setShouldExplain(true);
    },
    (message) => flow.onApplicationError(message),
  );

  const updateMessageState = (content: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.content === content ? { ...msg, ...updates } : msg,
      ),
    );
  };

  const actions = useApplicationActions(
    applicantId,
    applicantName,
    (newMessages: Message[]) => {
      setMessages((prev) => [...prev, ...newMessages]);
    },
    getClientId,
    updateMessageState,
  );
  const flow = useApplicationFlow(
    applicantName,
    user?.name || "User",
    linkedAccountsCount,
    actions.handleGenerateLink,
    actions.handleCreateApplication,
    actions.handleStartAnalysis,
    messages,
    setMessages,
    updateMessageState,
  );

  useEffect(() => {
    if (!applicant) return;

    const bankAccountCount = applicant.bankAccounts?.length || 0;
    const applicationCount = applicant.applications?.length || 0;

    setLinkedAccountsCount(bankAccountCount);

    if (bankAccountCount > 0 && applicationCount > 0) {
      const lastApplication = applicant.applications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      const statusText =
        lastApplication.status === "APPROVED" ? "Approved" : "Denied";
      const amountText = `₦${lastApplication.amount.toLocaleString()}`;
      const purposeText = lastApplication.purpose
        ? ` for ${lastApplication.purpose}`
        : "";
      const scoreText = lastApplication.score
        ? ` (score: ${lastApplication.score}/1000)`
        : "";

      flow.setMessages([
        {
          role: "assistant",
          content: `Welcome back! ${applicantName} has ${bankAccountCount} bank account${bankAccountCount > 1 ? "s" : ""} linked and ${applicationCount} previous application${applicationCount > 1 ? "s" : ""}.`,
        },
        {
          role: "assistant",
          content: "Would you like to create a new loan application? (Yes/No)",
        },
      ]);
      flow.setStep("welcome");
    } else if (bankAccountCount > 0) {
      flow.setMessages([
        {
          role: "assistant",
          content: `Welcome! ${applicantName} has ${bankAccountCount} bank account${bankAccountCount > 1 ? "s" : ""} already linked. Let's create a loan application!`,
        },
        {
          role: "assistant",
          content: "What's the loan amount in Naira (₦)?",
        },
      ]);
      flow.setStep("amount");
    }
  }, [applicant, applicantName]);

  const { data: applicationData } = useApplication(actions.applicationId);
  const { data: explanation } = useExplainResults(
    actions.applicationId,
    shouldExplain,
  );

  useEffect(() => {
    if (explanation?.explanation) {
      flow.addMessages([
        { role: "assistant", content: explanation.explanation },
        {
          role: "assistant",
          content: "Would you like to create another application? (Yes/No)",
        },
      ]);
      flow.setStep("restart");
      toast.success("Results ready!");
    }
  }, [explanation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [flow.messages]);

  const handleSubmit = () => {
    flow.handleSubmit(currentInput);
    setCurrentInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          Connecting to server...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50 max-w-4xl mx-auto w-full custom-scrollbar">
        {flow.messages.map((msg, i) => {
          const isProcessStep = msg.isProcessing || msg.isComplete;

          const nextMsg = flow.messages[i + 1];
          const nextIsProcessStep =
            nextMsg && (nextMsg.isProcessing || nextMsg.isComplete);
          const isLastInSequence = isProcessStep && !nextIsProcessStep;

          return (
            <div key={i}>
              <ChatMessage
                role={msg.role}
                content={msg.content}
                isProcessing={msg.isProcessing}
                isComplete={msg.isComplete}
                isLastInSequence={isLastInSequence}
              />
              {msg.link && (
                <div className="mt-2  max-w-[60%]">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                      Bank Linking URL
                    </p>
                    <div className="flex gap-2">
                      <p className="flex-1 text-sm text-blue-700 truncate bg-white border border-blue-100 rounded px-3 py-2">
                        {msg.link}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.link!);
                          toast.success("Link copied!");
                        }}
                        className="px-3 py-2 bg-[#0055ba] text-white rounded hover:bg-[#004494] text-xs font-medium whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <ChatInput
        value={currentInput}
        onChange={setCurrentInput}
        onSubmit={handleSubmit}
        placeholder={flow.getPlaceholder()}
        type={flow.getInputType()}
        disabled={flow.isInputDisabled || actions.isGeneratingLink}
      />
    </div>
  );
}
