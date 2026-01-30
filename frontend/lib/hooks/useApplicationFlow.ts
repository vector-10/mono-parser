import { useState } from "react";

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
  link?: string;
};

export function useApplicationFlow(
  applicantName: string,
  userName: string,
  linkedAccountsCount: number,
  handleGenerateLink: (onSuccess: () => void, onError: () => void) => void,
  handleCreateApplication: (
    data: { amount: number; tenor: number; interestRate: number; purpose?: string },
    onSuccess: () => void,
    onError: () => void
  ) => void
) {
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome ${userName}! 👋 To create a loan application for ${applicantName}, let's start by linking their bank accounts. This helps us analyze the applicant's financial profile.`,
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

  const addMessages = (newMessages: Message[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  };

  const proceedToLoanDetails = () => {
    addMessages([
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

  const handleSubmit = (input: string) => {
    if (!input.trim()) return;

    addUserMessage(input);

    if (step === "welcome" || step === "link-account") {
      const response = input.toLowerCase();

      if (response === "yes" || response === "y") {
        handleGenerateLink(
          () => setStep("ask-more-accounts"),
          () => setStep("link-account")
        );
      } else if (response === "skip" || response === "no" || response === "n") {
        if (linkedAccountsCount > 0) {
          proceedToLoanDetails();
        } else {
          addMessages([
            {
              role: "assistant",
              content: "⚠️ At least one bank account must be linked to proceed. Would you like to generate a linking URL? (Yes/No)",
            },
          ]);
        }
      }
    } else if (step === "ask-more-accounts") {
      const response = input.toLowerCase();

      if (response === "yes" || response === "y") {
        handleGenerateLink(
          () => setStep("ask-more-accounts"),
          () => setStep("link-account")
        );
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
      const updatedFormData = { ...formData, purpose: input };
      setFormData(updatedFormData);
      setStep("creating");

      handleCreateApplication(
        {
          amount: Number(updatedFormData.amount),
          tenor: Number(updatedFormData.tenor),
          interestRate: Number(updatedFormData.rate),
          purpose: updatedFormData.purpose || undefined,
        },
        () => setStep("analyzing"),
        () => setStep("purpose")
      );
    }
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
    return step === "amount" || step === "tenor" || step === "rate" ? "number" : "text";
  };

  const isInputDisabled = step === "creating" || step === "linking" || step === "analyzing" || step === "complete";

  // Update step and messages based on events
  const onAccountLinked = (data: {
    institution: string;
    accountNumber: string;
    accountsTotal: number;
  }) => {
    addMessages([
      {
        role: "system",
        content: `✅ ${data.institution} account (${data.accountNumber}) linked successfully! (${data.accountsTotal} account${data.accountsTotal > 1 ? "s" : ""} total)`,
      },
      {
        role: "assistant",
        content: "Great! Would you like to generate another linking URL? (Yes/No)",
      },
    ]);
    setStep("ask-more-accounts");
  };

  const onApplicationComplete = () => {
    addMessages([
      { role: "system", content: "✅ Analysis complete!" },
      { role: "assistant", content: "Processing results..." },
    ]);
    setStep("complete");
  };

  const onApplicationError = (message: string) => {
    addMessages([
      { role: "system", content: `❌ Error: ${message}` },
    ]);
    setStep("complete");
  };

  const onApplicationProgress = (message: string) => {
    addMessages([
      { role: "system", content: message },
    ]);
  };

  return {
    step,
    messages,
    handleSubmit,
    getPlaceholder,
    getInputType,
    isInputDisabled,
    addMessages,
    onAccountLinked,
    onApplicationComplete,
    onApplicationError,
    onApplicationProgress,
  };
}