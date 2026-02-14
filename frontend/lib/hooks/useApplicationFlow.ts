// import { useState, useEffect } from "react";

// type Step =
//   | "welcome"
//   | "link-account"
//   | "linking"
//   | "ask-more-accounts"
//   | "link-failed"
//   | "amount"
//   | "tenor"
//   | "rate"
//   | "purpose"
//   | "create-failed"
//   | "analysis-failed"
//   | "creating"
//   | "analyzing"
//   | "complete"
//   | "restart";

// type Message = {
//   role: "system" | "user" | "assistant";
//   content: string;
//   link?: string;
//   isProcessing?: boolean;
//   isComplete?: boolean;
// };

// export function useApplicationFlow(
//   applicantName: string,
//   userName: string,
//   linkedAccountsCount: number,
//   handleGenerateLink: (onSuccess: () => void, onError: () => void) => void,
//   handleCreateApplication: (
//     data: {
//       amount: number;
//       tenor: number;
//       interestRate: number;
//       purpose?: string;
//     },
//     onSuccess: () => void,
//     onError: () => void,
//   ) => void,
//   handleStartAnalysis: () => void,
//   messages: Message[],
//   setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
//   updateMessageState: (content: string, updates: Partial<Message>) => void,
// ) {
//   const [step, setStep] = useState<Step>("welcome");

//   useEffect(() => {
//     if (messages.length === 0) {
//       setMessages([
//         {
//           role: "assistant",
//           content: `Welcome ${userName}! To create a loan application for ${applicantName}, let's start by linking their bank accounts...`,
//         },
//         {
//           role: "assistant",
//           content: "Would you like to generate a bank linking URL? (Yes/No)",
//         },
//       ]);
//     }
//   }, [messages.length, setMessages, userName, applicantName]);

//   const [formData, setFormData] = useState({
//     amount: "",
//     tenor: "",
//     rate: "",
//     purpose: "",
//   });

//   const addMessages = (newMessages: Message[]) => {
//     setMessages((prev) => [...prev, ...newMessages]);
//   };

//   const addUserMessage = (content: string) => {
//     setMessages((prev) => [...prev, { role: "user", content }]);
//   };

//   const proceedToLoanDetails = () => {
//     addMessages([
//       {
//         role: "assistant",
//         content: `Perfect! ${applicantName} has ${linkedAccountsCount} bank account${linkedAccountsCount > 1 ? "s" : ""} linked. Now let's create the loan application.`,
//       },
//       {
//         role: "assistant",
//         content: "What's the loan amount in Naira (₦)?",
//       },
//     ]);
//     setStep("amount");
//   };

//   const handleSubmit = (input: string) => {
//     if (!input.trim()) return;

//     addUserMessage(input);

//     if (step === "welcome" || step === "link-account") {
//       const response = input.toLowerCase();

//       if (response === "yes" || response === "y") {
//         handleGenerateLink(
//           () => setStep("ask-more-accounts"),
//           () => onGenerateLinkError(),
//         );
//       } else if (response === "skip" || response === "no" || response === "n") {
//         if (linkedAccountsCount > 0) {
//           proceedToLoanDetails();
//         } else {
//           addMessages([
//             {
//               role: "assistant",
//               content:
//                 " At least one bank account must be linked to proceed. Would you like to generate a linking URL? (Yes/No)",
//             },
//           ]);
//         }
//       }
//     } else if (step === "ask-more-accounts") {
//       const response = input.toLowerCase();

//       if (response === "yes" || response === "y") {
//         handleGenerateLink(
//           () => setStep("ask-more-accounts"),
//           () => onGenerateLinkError(),
//         );
//       } else {
//         proceedToLoanDetails();
//       }
//     } else if (step === "amount") {
//       setFormData((prev) => ({ ...prev, amount: input }));
//       addMessages([
//         {
//           role: "assistant",
//           content: `Great! ₦${Number(input).toLocaleString()}. What's the loan tenor in months?`,
//         },
//       ]);
//       setStep("tenor");
//     } else if (step === "tenor") {
//       setFormData((prev) => ({ ...prev, tenor: input }));
//       addMessages([
//         {
//           role: "assistant",
//           content: `Perfect! ${input} months. What's the interest rate (%)?`,
//         },
//       ]);
//       setStep("rate");
//     } else if (step === "rate") {
//       setFormData((prev) => ({ ...prev, rate: input }));
//       addMessages([
//         {
//           role: "assistant",
//           content:
//             "What's the purpose of this loan? (optional - press Enter to skip)",
//         },
//       ]);
//       setStep("purpose");
//     } else if (step === "purpose") {
//       const updatedFormData = { ...formData, purpose: input };
//       setFormData(updatedFormData);
//       setStep("creating");

//       handleCreateApplication(
//         {
//           amount: Number(updatedFormData.amount),
//           tenor: Number(updatedFormData.tenor),
//           interestRate: Number(updatedFormData.rate),
//           purpose: updatedFormData.purpose || undefined,
//         },
//         () => setStep("analyzing"),
//         () => onCreateApplicationError(),
//       );
//     } else if (step === "link-failed") {
//       const response = input.toLowerCase();
//       if (response === "yes" || response === "y" || response === "retry") {
//         handleGenerateLink(
//           () => setStep("ask-more-accounts"),
//           onGenerateLinkError,
//         );
//       } else {
//         addMessages([
//           {
//             role: "assistant",
//             content:
//               "Okay. Would you like to go back to linking accounts or proceed? (link/proceed)",
//           },
//         ]);
//         setStep("link-account");
//       }
//     } else if (step === "create-failed") {
//       const response = input.toLowerCase();
//       if (response === "yes" || response === "y" || response === "retry") {
//         setStep("creating");
//         handleCreateApplication(
//           {
//             amount: Number(formData.amount),
//             tenor: Number(formData.tenor),
//             interestRate: Number(formData.rate),
//             purpose: formData.purpose || undefined,
//           },
//           () => setStep("analyzing"),
//           onCreateApplicationError,
//         );
//       } else {
//         addMessages([
//           {
//             role: "assistant",
//             content:
//               "Okay. Would you like to start a new application? (Yes/No)",
//           },
//         ]);
//         setStep("welcome");
//       }
//     } else if (step === "analysis-failed") {
//       const response = input.toLowerCase();
//       if (response === "yes" || response === "y" || response === "retry") {
//         setStep("analyzing");
//         handleStartAnalysis();
//       } else {
//         addMessages([
//           {
//             role: "assistant",
//             content:
//               "Okay. Would you like to start a new application? (Yes/No)",
//           },
//         ]);
//         setStep("welcome");
//       }
//     } else if (step === "restart") {
//       const response = input.toLowerCase();
//       if (response === "yes" || response === "y") {
//         setFormData({ amount: "", tenor: "", rate: "", purpose: "" });
//         addMessages([
//           {
//             role: "assistant",
//             content: `Sure! ${applicantName} currently has ${linkedAccountsCount} bank account${linkedAccountsCount > 1 ? "s" : ""} linked. Would you like to link another bank account before proceeding? (Yes/No)`,
//           },
//         ]);
//         setStep("ask-more-accounts");
//       } else {
//         addMessages([
//           {
//             role: "assistant",
//             content: "Okay, we're done here. Feel free to come back anytime!",
//           },
//         ]);
//         setStep("complete");
//       }
//     }
//   };

//   const getPlaceholder = () => {
//     switch (step) {
//       case "welcome":
//       case "link-account":
//       case "ask-more-accounts":
//         return "Type 'Yes' or 'No'";
//       case "amount":
//         return "Enter amount (e.g., 100000)";
//       case "tenor":
//         return "Enter tenor in months (e.g., 6)";
//       case "rate":
//         return "Enter interest rate (e.g., 5.0)";
//       case "purpose":
//         return "Enter purpose or press Enter to skip";
//       case "link-failed":
//       case "create-failed":
//       case "analysis-failed":
//         return "Type 'Yes' to retry or 'No' to go back";
//       case "restart":
//         return "Type 'Yes' to create another or 'No' to finish";
//       default:
//         return "";
//     }
//   };

//   const getInputType = () => {
//     return step === "amount" || step === "tenor" || step === "rate"
//       ? "number"
//       : "text";
//   };

//   const isInputDisabled =
//     step === "creating" || step === "linking" || step === "analyzing";

//   const onAccountLinked = (data: {
//     institution: string;
//     accountNumber: string;
//     accountsTotal: number;
//   }) => {
//     addMessages([
//       {
//         role: "system",
//         content: `${data.institution} account (${data.accountNumber}) linked successfully! (${data.accountsTotal} account${data.accountsTotal > 1 ? "s" : ""} total)`,
//       },
//       {
//         role: "assistant",
//         content:
//           "Great! Would you like to generate a new URL for another bank? (Yes/No)",
//       },
//     ]);
//     setStep("ask-more-accounts");
//   };

//   const onApplicationComplete = () => {
//     setMessages((prev) =>
//       prev.map((msg) =>
//         msg.isProcessing
//           ? { ...msg, isProcessing: false, isComplete: true }
//           : msg,
//       ),
//     );
//     addMessages([
//       { role: "system", content: "Analysis complete!" },
//       { role: "assistant", content: "Processing results..." },
//     ]);
//     setStep("complete");
//   };

//   const onApplicationError = (message: string) => {
//     addMessages([
//       { role: "system", content: ` Error: ${message}` },
//       {
//         role: "assistant",
//         content: "Would you like to retry the analysis? (Yes/No)",
//       },
//     ]);
//     setStep("analysis-failed");
//   };

//   const onGenerateLinkError = () => {
//     setStep("link-failed");
//   };

//   const onCreateApplicationError = () => {
//     setStep("create-failed");
//   };

//   const onApplicationProgress = (message: string) => {
//     if (message.includes("Fetching applicant data")) {
//       updateMessageState("Starting analysis", {
//         isProcessing: false,
//         isComplete: true,
//       });
//     }
//     addMessages([{ role: "system", content: message, isProcessing: true }]);
//   };

//   return {
//     step,
//     setStep,
//     messages,
//     setMessages,
//     handleSubmit,
//     getPlaceholder,
//     getInputType,
//     isInputDisabled,
//     addMessages,
//     updateMessageState,
//     onAccountLinked,
//     onApplicationComplete,
//     onApplicationError,
//     onApplicationProgress,
//   };
// }


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