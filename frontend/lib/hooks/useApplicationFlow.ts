"use client";
import { useState, useCallback, useMemo } from "react";

export type Step =
  | "welcome"
  | "link-account"
  | "linking"
  | "ask-more-accounts"
  | "link-failed"
  | "amount"
  | "tenor"
  | "rate"
  | "purpose"
  | "create-failed"
  | "analysis-failed"
  | "creating"
  | "analyzing"
  | "complete"
  | "restart";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
};

export function useApplicationFlow(
  applicantName: string,
  userName: string,
  linkedAccountsCount: number
) {
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    tenor: "",
    rate: "",
    purpose: "",
  });

  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  }, []);

  const updateMessageState = useCallback((content: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.content === content ? { ...msg, ...updates } : msg))
    );
  }, []);

  const proceedToLoanDetails = useCallback(() => {
    addMessages([
      {
        role: "assistant",
        content: `Perfect! ${applicantName} has ${linkedAccountsCount} bank account${
          linkedAccountsCount > 1 ? "s" : ""
        } linked. Now let's create the loan application.`,
      },
      {
        role: "assistant",
        content: "What's the loan amount in Naira (₦)?",
      },
    ]);
    setStep("amount");
  }, [addMessages, applicantName, linkedAccountsCount]);

  const handleSubmit = useCallback(
    (input: string, onGenerateLink: () => void, onCreateApplication: (data: any) => void) => {
      if (!input.trim()) return;

      setMessages((prev) => [...prev, { role: "user", content: input }]);
      const response = input.toLowerCase();

      if (step === "welcome" || step === "link-account") {
        if (response === "yes" || response === "y") {
          onGenerateLink();
        } else if (response === "skip" || response === "no" || response === "n") {
          if (linkedAccountsCount > 0) {
            proceedToLoanDetails();
          } else {
            addMessages([
              {
                role: "assistant",
                content: "At least one bank account must be linked to proceed. Would you like to generate a linking URL? (Yes/No)",
              },
            ]);
          }
        }
      } else if (step === "ask-more-accounts") {
        if (response === "yes" || response === "y") {
          onGenerateLink();
        } else {
          proceedToLoanDetails();
        }
      } else if (step === "amount") {
        setFormData((prev) => ({ ...prev, amount: input }));
        addMessages([
          {
            role: "assistant",
            content: `Great! ₦${Number(input).toLocaleString()}. What's the loan tenor in months?`,
          },
        ]);
        setStep("tenor");
      } else if (step === "tenor") {
        setFormData((prev) => ({ ...prev, tenor: input }));
        addMessages([
          {
            role: "assistant",
            content: `Perfect! ${input} months. What's the interest rate (%)?`,
          },
        ]);
        setStep("rate");
      } else if (step === "rate") {
        setFormData((prev) => ({ ...prev, rate: input }));
        addMessages([
          {
            role: "assistant",
            content: "What's the purpose of this loan? (optional - press Enter to skip)",
          },
        ]);
        setStep("purpose");
      } else if (step === "purpose") {
        const finalData = { ...formData, purpose: input };
        setFormData(finalData);
        setStep("creating");

        onCreateApplication({
          amount: Number(finalData.amount),
          tenor: Number(finalData.tenor),
          interestRate: Number(finalData.rate),
          purpose: finalData.purpose || undefined,
        });
      } else if (step === "link-failed" || step === "create-failed" || step === "analysis-failed") {
        if (response === "yes" || response === "y" || response === "retry") {
          setStep("welcome");
        }
      } else if (step === "restart") {
        if (response === "yes" || response === "y") {
          setFormData({ amount: "", tenor: "", rate: "", purpose: "" });
          addMessages([
            {
              role: "assistant",
              content: `Sure! ${applicantName} has ${linkedAccountsCount} accounts linked. Link another? (Yes/No)`,
            },
          ]);
          setStep("ask-more-accounts");
        } else {
          addMessages([{ role: "assistant", content: "All set! Feel free to return anytime." }]);
          setStep("complete");
        }
      }
    },
    [step, formData, linkedAccountsCount, applicantName, proceedToLoanDetails, addMessages]
  );

  const onAccountLinked = useCallback(
    (data: { institution: string; accountNumber: string }) => {
      addMessages([
        {
          role: "system",
          content: `${data.institution} account (${data.accountNumber}) linked successfully!`,
        },
        {
          role: "assistant",
          content: "Great! Would you like to generate a new URL for another bank? (Yes/No)",
        },
      ]);
      setStep("ask-more-accounts");
    },
    [addMessages]
  );

  const onApplicationProgress = useCallback(
    (message: string) => {
      if (message.includes("Fetching applicant data")) {
        updateMessageState("Starting analysis", { isProcessing: false, isComplete: true });
      }
      addMessages([{ role: "system", content: message, isProcessing: true }]);
    },
    [addMessages, updateMessageState]
  );

  const onApplicationComplete = useCallback(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.isProcessing ? { ...msg, isProcessing: false, isComplete: true } : msg))
    );
    addMessages([
      { role: "system", content: "Analysis complete!" },
      { role: "assistant", content: "Processing results..." },
    ]);
    setStep("complete");
  }, [addMessages]);

  const onApplicationError = useCallback(
    (message: string) => {
      addMessages([
        { role: "system", content: ` Error: ${message}` },
        { role: "assistant", content: "Would you like to retry the analysis? (Yes/No)" },
      ]);
      setStep("analysis-failed");
    },
    [addMessages]
  );

  const getPlaceholder = useCallback(() => {
    const placeholders: Record<string, string> = {
      welcome: "Type 'Yes' or 'No'",
      "link-account": "Type 'Yes' or 'No'",
      amount: "Enter amount (e.g., 100000)",
      tenor: "Enter tenor in months",
      rate: "Enter interest rate",
      purpose: "Enter purpose or press Enter",
      restart: "Type 'Yes' or 'No'",
    };
    return placeholders[step] || "Type a message...";
  }, [step]);

  const getInputType = useCallback(() => {
    return ["amount", "tenor", "rate"].includes(step) ? "number" : "text";
  }, [step]);

  const isInputDisabled = ["creating", "linking", "analyzing"].includes(step);

  return useMemo(
    () => ({
      step,
      setStep,
      messages,
      setMessages,
      handleSubmit,
      getPlaceholder,
      getInputType,
      isInputDisabled,
      addMessages,
      updateMessageState,
      onAccountLinked,
      onApplicationComplete,
      onApplicationError,
      onApplicationProgress,
    }),
    [
      step,
      messages,
      handleSubmit,
      getPlaceholder,
      getInputType,
      isInputDisabled,
      addMessages,
      updateMessageState,
      onAccountLinked,
      onApplicationComplete,
      onApplicationError,
      onApplicationProgress,
    ]
  );
}