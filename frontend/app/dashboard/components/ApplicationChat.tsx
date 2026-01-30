"use client";
import { useState, useEffect } from "react";
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
  const [shouldExplain, setShouldExplain] = useState(false);

  const { data: applicant } = useApplicant(applicantId);

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
    (message) => flow.onApplicationError(message)
  );

  const actions = useApplicationActions(
    applicantId,
    applicantName,
    (messages: Message[]) => flow.addMessages(messages),
    getClientId
  );

  const flow = useApplicationFlow(
    applicantName,
    user?.name || "User",
    linkedAccountsCount,
    actions.handleGenerateLink,
    actions.handleCreateApplication
  );

  useEffect(() => {
    if (!applicant) return;

    const bankAccountCount = applicant.bankAccounts?.length || 0;
    const applicationCount = applicant.applications?.length || 0;

    setLinkedAccountsCount(bankAccountCount);

    if (bankAccountCount > 0 && applicationCount > 0) {
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
    shouldExplain
  );

  useEffect(() => {
    if (explanation?.explanation) {
      flow.addMessages([
        { role: "assistant", content: explanation.explanation },
      ]);
      toast.success("Results ready!");
    }
  }, [explanation]);

  const handleSubmit = () => {
    flow.handleSubmit(currentInput);
    setCurrentInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          ⚠️ Connecting to server...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {flow.messages.map((msg, i) => (
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
        placeholder={flow.getPlaceholder()}
        type={flow.getInputType()}
        disabled={flow.isInputDisabled || actions.isGeneratingLink}
      />
    </div>
  );
}