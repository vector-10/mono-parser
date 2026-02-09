import { useState } from "react";
import { toast } from "sonner";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";
import { useStartAnalysis } from "@/lib/hooks/queries/use-start-analysis";
import { AxiosError } from "axios";
import { useInitiateMonoLink } from "@/lib/hooks/queries/use-initiate-mono-link";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
};

const getActionableError = (error: unknown, action: string): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  const message =
    axiosError?.response?.data?.message || axiosError?.message || "";
  switch (action) {
    case "generate-link":
      if (message.includes("monoApiKey") || message.includes("API key"))
        return "Mono API key is missing. Please add your Mono API key in settings before retrying.";
      if (message.includes("401") || message.includes("unauthorized"))
        return "Invalid Mono API key. Please update your API key in settings.";
      if (message.includes("network") || message.includes("timeout"))
        return "Network error. Check your connection and try again.";
      return `Failed to generate link: ${message}`;

    case "create-application":
      if (message.includes("bank account"))
        return "No bank account linked. Link a bank account first before creating an application.";
      if (message.includes("not found"))
        return "Applicant not found. Please refresh and try again.";
      if (message.includes("amount"))
        return "Invalid loan amount. Please enter a valid number.";
      return `Failed to create application: ${message}`;

    case "start-analysis":
      if (message.includes("bank account"))
        return "No bank account available for analysis. Link a bank account first.";
      if (message.includes("WebSocket") || message.includes("socket"))
        return "Connection lost. Please refresh the page and try again.";
      if (message.includes("brain") || message.includes("analysis service"))
        return "Analysis service is temporarily unavailable. Please try again in a moment.";
      return `Failed to start analysis: ${message}`;

    default:
      return message || "An unexpected error occurred.";
  }
};

export function useApplicationActions(
  applicantId: string,
  applicantName: string,
  addMessages: (messages: Message[]) => void,
  getClientId: () => string | null,
  updateMessageState: (content: string, updates: Partial<Message>) => void,
) {
  const { mutate: createApplication } = useCreateApplication();
  const { mutate: startAnalysis } = useStartAnalysis();
  const { mutate: initiateMonoLink, isPending: isGeneratingLink } =
    useInitiateMonoLink();
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleGenerateLink = (onSuccess: () => void, onError: () => void) => {
    addMessages([{ role: "system", content: "Generating bank linking URL" }]);

    initiateMonoLink(applicantId, {
      onSuccess: (data) => {
        updateMessageState("Generating bank linking URL", {
          isProcessing: false,
          isComplete: true,
        });
        addMessages([
          { role: "system", content: " Link generated successfully!" },
          {
            role: "assistant",
            content: `Here's the bank linking URL for ${applicantName}. Copy and send it to them:`,
            link: data.widgetUrl,
          },
          {
            role: "assistant",
            content:
              "I'll notify you when they complete the linking process. Would you like to generate another link? (Yes/No)",
          },
        ]);
        toast.success("Link generated!");
        onSuccess();
      },
      onError: (error) => {
        const errorMsg = getActionableError(error, "generate-link");
        addMessages([
          { role: "system", content: ` ${errorMsg}` },
          { role: "assistant", content: "Would you like to retry? (Yes/No)" },
        ]);
        toast.error(errorMsg);
        onError();
      },
    });
  };

  const handleCreateApplication = (
    data: {
      amount: number;
      tenor: number;
      interestRate: number;
      purpose?: string;
    },
    onSuccess: () => void,
    onError: () => void,
  ) => {
    addMessages([{ role: "system", content: "Creating application " }]);

    createApplication(
      {
        applicantId,
        ...data,
      },
      {
        onSuccess: (response) => {
          setApplicationId(response.applicationId);
          addMessages([
            { role: "system", content: " Application created!" },
            { role: "assistant", content: "Starting automatic analysis..." },
          ]);
          toast.success("Application created!");
          setTimeout(() => handleStartAnalysis(response.applicationId), 1000);
          onSuccess();
        },
        onError: (error) => {
          const errorMsg = getActionableError(error, "create-application");
          addMessages([
            { role: "system", content: ` ${errorMsg}` },
            { role: "assistant", content: "Would you like to retry? (Yes/No)" },
          ]);
          toast.error(errorMsg);
          onError();
        },
      },
    );
  };

  const handleStartAnalysis = (appId?: string) => {
    const clientId = getClientId();
    console.log("=== START ANALYSIS DEBUG ===");
    console.log("Client ID:", clientId);
    console.log("Application ID:", applicationId);
    console.log("===========================");

    const targetAppId = appId || applicationId;

    if (!clientId) {
      toast.error(
        "WebSocket not connected. Please refresh the page and try again.",
      );
      addMessages([
        {
          role: "system",
          content: "WebSocket not connected. Please refresh the page.",
        },
        { role: "assistant", content: "Would you like to retry? (Yes/No)" },
      ]);
      return;
    }

    if (!targetAppId) {
      toast.error("No application found. Please create an application first.");
      addMessages([
        {
          role: "system",
          content: " No application found. Please create one first.",
        },
      ]);
      return;
    }

    addMessages([{ role: "system", content: "Starting analysis" }]);

    startAnalysis(
      { applicationId: targetAppId, clientId },
      {
        onError: (error) => {
          const errorMsg = getActionableError(error, "start-analysis");
          addMessages([
            { role: "system", content: ` ${errorMsg}` },
            { role: "assistant", content: "Would you like to retry? (Yes/No)" },
          ]);
          toast.error(errorMsg);
        },
      },
    );
  };

  return {
    handleGenerateLink,
    handleCreateApplication,
    handleStartAnalysis,
    isGeneratingLink,
    applicationId,
  };
}
