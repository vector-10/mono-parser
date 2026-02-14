"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useAuthStore } from "@/lib/store/auth";
import { useApplicationWebSocket } from "@/lib/hooks/useApplicationWebSocket";
import { useApplicationActions } from "@/lib/hooks/useApplicationActions";
import { useApplicationFlow, Message } from "@/lib/hooks/useApplicationFlow";
import { useExplainResults } from "@/lib/hooks/queries/use-explain-results";
import { useApplicant } from "@/lib/hooks/queries/use-applicant";

type ApplicantWithRelations = {
  id: string;
  firstName: string;
  lastName: string;
  bankAccounts: Array<{ id: string; institution?: string }>;
  applications: Array<{ id: string; createdAt: string }>;
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
  const [currentInput, setCurrentInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const clientIdRef = useRef<string>("");
  const hasInitialized = useRef(false);
  const [shouldExplain, setShouldExplain] = useState(false);

  const { data: applicantData } = useApplicant(applicantId);
  const applicant = applicantData as unknown as ApplicantWithRelations;
  const linkedAccountsCount = applicant?.bankAccounts?.length || 0;

  const flow = useApplicationFlow(
    applicantName,
    user?.name || "User",
    linkedAccountsCount,
  );

  const actions = useApplicationActions(
    applicantId,
    applicantName,
    () => clientIdRef.current,
  );

  useEffect(() => {
    actions.setCallbacks({
      addMessages: flow.addMessages,
      updateMessageState: flow.updateMessageState,
      setStep: flow.setStep,
    });
  }, [actions, flow.addMessages, flow.updateMessageState, flow.setStep]);

  const { isConnected, getClientId } = useApplicationWebSocket(
    applicantId,
    (data) => {

      flow.onAccountLinked({
        institution: data.institution,
        accountNumber: data.accountNumber,
      });
    },
    flow.onApplicationProgress,
    () => {
      flow.onApplicationComplete();
      setShouldExplain(true);
    },
    flow.onApplicationError,
  );

  useEffect(() => {
    clientIdRef.current = getClientId() || "";
  }, [getClientId]);

  useEffect(() => {
    if (!applicant || hasInitialized.current) return;
    const bankCount = applicant.bankAccounts?.length || 0;
    const appCount = applicant.applications?.length || 0;

    if (bankCount > 0 && appCount > 0) {
      flow.setMessages([
        {
          role: "assistant",
          content: `Welcome back! ${applicantName} has ${bankCount} accounts and ${appCount} previous applications.`,
        },
        {
          role: "assistant",
          content: "Would you like to create a new loan application? (Yes/No)",
        },
      ]);
      flow.setStep("welcome");
    } else if (bankCount > 0) {
      flow.setMessages([
        {
          role: "assistant",
          content: `Welcome! ${applicantName} has ${bankCount} accounts linked.`,
        },
        { role: "assistant", content: "What's the loan amount in Naira (₦)?" },
      ]);
      flow.setStep("amount");
    } else {
      flow.setMessages([
        {
          role: "assistant",
          content: `Welcome ${user?.name || "User"}! To create a loan application for ${applicantName}, let's start by linking their bank accounts.`,
        },
        {
          role: "assistant",
          content: "Would you like to generate a bank linking URL? (Yes/No)",
        },
      ]);
      flow.setStep("welcome");
    }
    hasInitialized.current = true;
  }, [applicant, applicantName, flow]);

  const { data: explanation } = useExplainResults(
    actions.applicationId || "",
    shouldExplain,
  );

  const hasExplainedRef = useRef(false);

  useEffect(() => {
    if (explanation?.explanation && !hasExplainedRef.current) {
      hasExplainedRef.current = true;
      flow.addMessages([
        { role: "assistant", content: explanation.explanation },
        { role: "assistant", content: "Create another? (Yes/No)" },
      ]);
      flow.setStep("restart");
      toast.success("Results ready!");
      setShouldExplain(false);
    }
  }, [explanation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [flow.messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {!isConnected && (
        <div className="bg-yellow-50 px-4 py-2 text-xs text-yellow-800 border-b">
          Connecting...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 max-w-4xl mx-auto w-full custom-scrollbar">
        {flow.messages.map((msg, i) => {
          const isProcess = msg.isProcessing || msg.isComplete;
          const next = flow.messages[i + 1];
          return (
            <ChatMessage
              key={i}
              {...msg}
              isLastInSequence={
                isProcess && !(next?.isProcessing || next?.isComplete)
              }
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <ChatInput
        value={currentInput}
        onChange={setCurrentInput}
        onSubmit={() => {
          flow.handleSubmit(
            currentInput,
            actions.handleGenerateLink,
            actions.handleCreateApplication,
          );
          setCurrentInput("");
        }}
        placeholder={flow.getPlaceholder()}
        type={flow.getInputType()}
        disabled={flow.isInputDisabled || actions.isGeneratingLink}
      />
    </div>
  );
}
