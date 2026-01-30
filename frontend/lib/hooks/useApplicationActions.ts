import { useState } from "react";
import { toast } from "sonner";
import { useCreateApplication } from "@/lib/hooks/queries/use-create-application";
import { useStartAnalysis } from "@/lib/hooks/queries/use-start-analysis";
import { useInitiateMonoLink } from "@/lib/hooks/queries/use-initiate-mono-link";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string;
};

export function useApplicationActions(
  applicantId: string,
  applicantName: string,
  addMessages: (messages: Message[]) => void,
  getClientId: () => string | null
) {
  const { mutate: createApplication } = useCreateApplication();
  const { mutate: startAnalysis } = useStartAnalysis();
  const { mutate: initiateMonoLink, isPending: isGeneratingLink } = useInitiateMonoLink();
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleGenerateLink = (onSuccess: () => void, onError: () => void) => {
    addMessages([
      { role: "system", content: "🔗 Generating bank linking URL..." },
    ]);

    initiateMonoLink(applicantId, {
      onSuccess: (data) => {
        addMessages([
          { role: "system", content: "✅ Link generated successfully!" },
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
        toast.success("Link generated!");
        onSuccess();
      },
      onError: (error: any) => {
        addMessages([
          { role: "system", content: `❌ Failed to generate link: ${error.message}` },
          { role: "assistant", content: "Would you like to try again? (Yes/No)" },
        ]);
        toast.error("Failed to generate link");
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
    onError: () => void
  ) => {
    addMessages([
      { role: "system", content: "⏳ Creating application..." },
    ]);

    createApplication(
      {
        applicantId,
        ...data,
      },
      {
        onSuccess: (response) => {
          setApplicationId(response.applicationId);
          addMessages([
            { role: "system", content: "✅ Application created!" },
            { role: "assistant", content: "Starting automatic analysis..." },
          ]);
          toast.success("Application created!");
          
          // Auto-start analysis
          setTimeout(() => handleStartAnalysis(response.applicationId), 1000);
          onSuccess();
        },
        onError: (error: any) => {
          addMessages([
            { role: "system", content: `❌ Failed: ${error.message}` },
          ]);
          toast.error("Failed to create application");
          onError();
        },
      }
    );
  };

  const handleStartAnalysis = (appId?: string) => {
    const clientId = getClientId();
    const targetAppId = appId || applicationId;

    if (!clientId) {
      toast.error("WebSocket not connected");
      return;
    }

    if (!targetAppId) {
      toast.error("No application to analyze");
      return;
    }

    addMessages([
      { role: "system", content: "🧠 Starting analysis..." },
    ]);

    startAnalysis(
      { applicationId: targetAppId, clientId },
      {
        onError: (error: any) => {
          addMessages([
            { role: "system", content: `❌ Failed to start analysis: ${error.message}` },
          ]);
          toast.error("Failed to start analysis");
        },
      }
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