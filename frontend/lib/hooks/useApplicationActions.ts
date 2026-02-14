




"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";
import { useStartAnalysis } from "@/lib/hooks/queries/use-start-analysis";
import { useInitiateMonoLink } from "@/lib/hooks/queries/use-initiate-mono-link";
import { AxiosError } from "axios";
import { Message, Step } from "./useApplicationFlow";

const getActionableError = (error: unknown, action: string): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  const message = axiosError?.response?.data?.message || axiosError?.message || "";
  switch (action) {
    case "generate-link":
      if (message.includes("monoApiKey")) return "Mono API key is missing in settings.";
      return `Failed to generate link: ${message}`;
    case "create-application":
      return `Failed to create application: ${message}`;
    case "start-analysis":
      return `Failed to start analysis: ${message}`;
    default:
      return message || "An unexpected error occurred.";
  }
};

interface ActionsCallbacks {
  addMessages: (messages: Message[]) => void;
  updateMessageState: (content: string, updates: Partial<Message>) => void;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
}

export function useApplicationActions(
  applicantId: string,
  applicantName: string,
  getClientId: () => string | null
) {
  const { mutate: createApplication } = useCreateApplication();
  const { mutate: startAnalysis } = useStartAnalysis();
  const { mutate: initiateMonoLink, isPending: isGeneratingLink } = useInitiateMonoLink();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const callbacksRef = useRef<ActionsCallbacks | null>(null);

  const setCallbacks = useCallback((callbacks: ActionsCallbacks) => {
    callbacksRef.current = callbacks;
  }, []);

  const handleGenerateLink = useCallback(() => {
    const callbacks = callbacksRef.current;
    if (!callbacks) return;

    callbacks.addMessages([{ role: "system", content: "Generating bank linking URL" }]);

    initiateMonoLink(applicantId, {
      onSuccess: (data) => {
        callbacks.updateMessageState("Generating bank linking URL", { 
          isProcessing: false, 
          isComplete: true 
        });
        callbacks.addMessages([
          { role: "system", content: " Link generated successfully!" },
          {
            role: "assistant",
            content: `Here's the bank linking URL for ${applicantName}:`,
            link: data.widgetUrl,
          },
          {
            role: "assistant",
            content: "I'll notify you when they complete the linking. Would you like to generate another link? (Yes/No)",
          },
        ]);
        toast.success("Link generated!");
        callbacks.setStep("ask-more-accounts");
      },
      onError: (error) => {
        const errorMsg = getActionableError(error, "generate-link");
        callbacks.addMessages([
          { role: "system", content: ` ${errorMsg}` },
          { role: "assistant", content: "Would you like to retry? (Yes/No)" }
        ]);
        toast.error(errorMsg);
        callbacks.setStep("link-failed");
      },
    });
  }, [applicantId, applicantName, initiateMonoLink]);

  const handleStartAnalysis = useCallback((appId?: string) => {
    const callbacks = callbacksRef.current;
    if (!callbacks) return;

    const clientId = getClientId();
    const targetAppId = appId || applicationId;

    if (!clientId || !targetAppId) {
      toast.error("Required ID missing for analysis.");
      return;
    }

    callbacks.addMessages([{ role: "system", content: "Starting analysis" }]);
    startAnalysis(
      { applicationId: targetAppId, clientId },
      {
        onError: (error) => {
          const errorMsg = getActionableError(error, "start-analysis");
          callbacks.addMessages([
            { role: "system", content: ` ${errorMsg}` },
            { role: "assistant", content: "Would you like to retry? (Yes/No)" }
          ]);
          toast.error(errorMsg);
          callbacks.setStep("analysis-failed");
        },
      }
    );
  }, [applicationId, getClientId, startAnalysis]);

  const handleCreateApplication = useCallback((
    data: { amount: number; tenor: number; interestRate: number; purpose?: string }
  ) => {
    const callbacks = callbacksRef.current;
    if (!callbacks) return;

    callbacks.addMessages([{ role: "system", content: "Creating application " }]);

    createApplication(
      { applicantId, ...data },
      {
        onSuccess: (response) => {
          setApplicationId(response.applicationId);
          callbacks.addMessages([
            { role: "system", content: " Application created!" },
            { role: "assistant", content: "Starting automatic analysis..." }
          ]);
          toast.success("Application created!");
          setTimeout(() => handleStartAnalysis(response.applicationId), 1000);
          callbacks.setStep("analyzing");
        },
        onError: (error) => {
          const errorMsg = getActionableError(error, "create-application");
          callbacks.addMessages([
            { role: "system", content: ` ${errorMsg}` },
            { role: "assistant", content: "Would you like to retry? (Yes/No)" }
          ]);
          toast.error(errorMsg);
          callbacks.setStep("create-failed");
        },
      }
    );
  }, [applicantId, createApplication, handleStartAnalysis]);

  return {
    handleGenerateLink,
    handleCreateApplication,
    handleStartAnalysis,
    isGeneratingLink,
    applicationId,
    setCallbacks,
  };
}