// "use client";
// import { useState, useEffect, useRef } from "react";
// import { toast } from "sonner";
// import ChatMessage from "./ChatMessage";
// import ChatInput from "./ChatInput";
// import { useAuthStore } from "@/lib/store/auth";
// import { useApplicationWebSocket } from "@/lib/hooks/useApplicationWebSocket";
// import { useApplicationActions } from "@/lib/hooks/useApplicationActions";
// import { useApplicationFlow } from "@/lib/hooks/useApplicationFlow";
// import { useExplainResults } from "@/lib/hooks/queries/use-explain-results";
// import { useApplicant } from "@/lib/hooks/queries/use-applicant";

// type Message = {
//   role: "system" | "user" | "assistant";
//   content: string;
//   link?: string;
//   isProcessing?: boolean;
//   isComplete?: boolean;
// };

// type ApplicantWithRelations = {
//   id: string;
//   firstName: string;
//   lastName: string;
//   bankAccounts: Array<{ id: string; institution?: string }>;
//   applications: Array<{
//     id: string;
//     amount: number;
//     status: string;
//     purpose?: string;
//     score?: number;
//     createdAt: string;
//   }>;
// };

// interface ApplicationChatProps {
//   applicantId: string;
//   applicantName: string;
// }

// export default function ApplicationChat({
//   applicantId,
//   applicantName,
// }: ApplicationChatProps) {
//   const user = useAuthStore((state) => state.user);

//   const [currentInput, setCurrentInput] = useState("");
//   const chatEndRef = useRef<HTMLDivElement>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [shouldExplain, setShouldExplain] = useState(false);
//   const clientIdRef = useRef<string>("");

//   const { data: applicant } = useApplicant(applicantId) as {
//     data: ApplicantWithRelations | undefined;
//   };

//   const linkedAccountsCount = applicant?.bankAccounts?.length || 0;

//   const updateMessageState = (content: string, updates: Partial<Message>) => {
//     setMessages((prev) =>
//       prev.map((msg) =>
//         msg.content === content ? { ...msg, ...updates } : msg,
//       ),
//     );
//   };

//   const actions = useApplicationActions(
//     applicantId,
//     applicantName,
//     (newMessages: Message[]) => {
//       setMessages((prev) => [...prev, ...newMessages]);
//     },
//     () => clientIdRef.current,
//     updateMessageState,
//   );

//   const flow = useApplicationFlow(
//     applicantName,
//     user?.name || "User",
//     linkedAccountsCount,
//     actions.handleGenerateLink,
//     actions.handleCreateApplication,
//     actions.handleStartAnalysis,
//     messages,
//     setMessages,
//     updateMessageState,
//   );

//   const { isConnected, getClientId } = useApplicationWebSocket(
//     applicantId,
//     (data) => {
//       flow.onAccountLinked({
//         institution: data.institution,
//         accountNumber: data.accountNumber,
//         accountsTotal: linkedAccountsCount + 1,
//       });
//     },
//     (message) => flow.onApplicationProgress(message),
//     () => {
//       flow.onApplicationComplete();
//       setShouldExplain(true);
//     },
//     (message) => flow.onApplicationError(message),
//   );

//   useEffect(() => {
//   clientIdRef.current = getClientId() || "";
// }, [getClientId]);



//   useEffect(() => {
//     if (!applicant) return;

//     const bankAccountCount = applicant.bankAccounts?.length || 0;
//     const applicationCount = applicant.applications?.length || 0;



//     if (bankAccountCount > 0 && applicationCount > 0) {
//       // const lastApplication = applicant.applications.sort(
//       //   (a, b) =>
//       //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
//       // )[0];

//       flow.setMessages([
//         {
//           role: "assistant",
//           content: `Welcome back! ${applicantName} has ${bankAccountCount} bank account${bankAccountCount > 1 ? "s" : ""} linked and ${applicationCount} previous application${applicationCount > 1 ? "s" : ""}.`,
//         },
//         {
//           role: "assistant",
//           content: "Would you like to create a new loan application? (Yes/No)",
//         },
//       ]);
//       flow.setStep("welcome");
//     } else if (bankAccountCount > 0) {
//       flow.setMessages([
//         {
//           role: "assistant",
//           content: `Welcome! ${applicantName} has ${bankAccountCount} bank account${bankAccountCount > 1 ? "s" : ""} already linked. Let's create a loan application!`,
//         },
//         {
//           role: "assistant",
//           content: "What's the loan amount in Naira (₦)?",
//         },
//       ]);
//       flow.setStep("amount");
//     }
//   }, [applicant, applicantName, flow]);

//   useEffect(() => {
//     console.log("=== EXPLAIN TRIGGER DEBUG ===");
//     console.log("shouldExplain:", shouldExplain);
//     console.log("applicationId:", actions.applicationId);
//     console.log(
//       "Will trigger explain:",
//       shouldExplain && !!actions.applicationId,
//     );
//     console.log("============================");
//   }, [shouldExplain, actions.applicationId]);

//   //const { data: applicationData } = useApplication(actions.applicationId);
//   const { data: explanation, error: explainError } = useExplainResults(
//     actions.applicationId,
//     shouldExplain,
//   );

//   useEffect(() => {
//     if (explanation?.explanation) {
//       flow.addMessages([
//         { role: "assistant", content: explanation.explanation },
//         {
//           role: "assistant",
//           content: "Would you like to create another application? (Yes/No)",
//         },
//       ]);
//       flow.setStep("restart");
//       toast.success("Results ready!");
//     }
//   }, [explanation, flow]);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [flow.messages]);

//   useEffect(() => {
//     if (explainError) {
//       console.error("Explain error:", explainError);
//       toast.error("Failed to generate explanation");
//       // setShouldExplain(false);
//     }
//   }, [explainError]);

//   const handleSubmit = () => {
//     flow.handleSubmit(currentInput);
//     setCurrentInput("");
//   };

//   return (
//     <div className="flex flex-col h-[calc(100vh-6rem)]">
//       {!isConnected && (
//         <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
//           Connecting to server...
//         </div>
//       )}

//       <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50 max-w-4xl mx-auto w-full custom-scrollbar">
//         {flow.messages.map((msg, i) => {
//           const isProcessStep = msg.isProcessing || msg.isComplete;

//           const nextMsg = flow.messages[i + 1];
//           const nextIsProcessStep =
//             nextMsg && (nextMsg.isProcessing || nextMsg.isComplete);
//           const isLastInSequence = isProcessStep && !nextIsProcessStep;

//           return (
//             <div key={i}>
//               <ChatMessage
//                 role={msg.role}
//                 content={msg.content}
//                 isProcessing={msg.isProcessing}
//                 isComplete={msg.isComplete}
//                 isLastInSequence={isLastInSequence}
//               />
//               {msg.link && (
//                 <div className="mt-2  max-w-[60%]">
//                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                     <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
//                       Bank Linking URL
//                     </p>
//                     <div className="flex gap-2">
//                       <p className="flex-1 text-sm text-blue-700 truncate bg-white border border-blue-100 rounded px-3 py-2">
//                         {msg.link}
//                       </p>
//                       <button
//                         onClick={() => {
//                           navigator.clipboard.writeText(msg.link!);
//                           toast.success("Link copied!");
//                         }}
//                         className="px-3 py-2 bg-[#0055ba] text-white rounded hover:bg-[#004494] text-xs font-medium whitespace-nowrap"
//                       >
//                         Copy
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//         <div ref={chatEndRef} />
//       </div>

//       <ChatInput
//         value={currentInput}
//         onChange={setCurrentInput}
//         onSubmit={handleSubmit}
//         placeholder={flow.getPlaceholder()}
//         type={flow.getInputType()}
//         disabled={flow.isInputDisabled || actions.isGeneratingLink}
//       />
//     </div>
//   );
// }


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

export default function ApplicationChat({ applicantId, applicantName }: ApplicationChatProps) {
  const user = useAuthStore((state) => state.user);
  const [currentInput, setCurrentInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const clientIdRef = useRef<string>("");
  const hasInitialized = useRef(false);
  const [shouldExplain, setShouldExplain] = useState(false);

  const { data: applicantData } = useApplicant(applicantId);
  const applicant = applicantData as unknown as ApplicantWithRelations;
  const linkedAccountsCount = applicant?.bankAccounts?.length || 0;

  // Stable Actions
  const actions = useApplicationActions(
    applicantId,
    applicantName,
    (msgs: Message[]) => flow.addMessages(msgs), 
    () => clientIdRef.current,
    (content: string, updates: Partial<Message>) => flow.updateMessageState(content, updates)
  );

  // Master State Hook
  const flow = useApplicationFlow(applicantName, user?.name || "User", linkedAccountsCount, actions);

  // WebSocket
  const { isConnected, getClientId } = useApplicationWebSocket(
    applicantId,
    (data) => flow.onAccountLinked({
      institution: data.institution,
      accountNumber: data.accountNumber,
      accountsTotal: (applicant?.bankAccounts?.length || 0) + 1,
    }),
    flow.onApplicationProgress,
    () => {
      flow.onApplicationComplete();
      setShouldExplain(true);
    },
    flow.onApplicationError
  );

  useEffect(() => { clientIdRef.current = getClientId() || ""; }, [getClientId]);

  // One-time Init Guard
  useEffect(() => {
    if (!applicant || hasInitialized.current) return;
    const bankCount = applicant.bankAccounts?.length || 0;
    const appCount = applicant.applications?.length || 0;

    if (bankCount > 0 && appCount > 0) {
      flow.setMessages([
        { role: "assistant", content: `Welcome back! ${applicantName} has ${bankCount} accounts and ${appCount} previous applications.` },
        { role: "assistant", content: "Would you like to create a new loan application? (Yes/No)" }
      ]);
      flow.setStep("welcome");
    } else if (bankCount > 0) {
      flow.setMessages([
        { role: "assistant", content: `Welcome! ${applicantName} has ${bankCount} accounts linked.` },
        { role: "assistant", content: "What's the loan amount in Naira (₦)?" }
      ]);
      flow.setStep("amount");
    }
    hasInitialized.current = true;
  }, [applicant, applicantName, flow]);

  const { data: explanation } = useExplainResults(actions.applicationId || "", shouldExplain);

  useEffect(() => {
    if (explanation?.explanation) {
      flow.addMessages([
        { role: "assistant", content: explanation.explanation },
        { role: "assistant", content: "Create another? (Yes/No)" },
      ]);
      flow.setStep("restart");
      toast.success("Results ready!");
      setShouldExplain(false);
    }
  }, [explanation, flow]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [flow.messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {!isConnected && <div className="bg-yellow-50 px-4 py-2 text-xs text-yellow-800 border-b">Connecting...</div>}
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 max-w-4xl mx-auto w-full custom-scrollbar">
        {flow.messages.map((msg, i) => {
          const isProcess = msg.isProcessing || msg.isComplete;
          const next = flow.messages[i + 1];
          return (
            <ChatMessage 
              key={i} 
              {...msg} 
              isLastInSequence={isProcess && !(next?.isProcessing || next?.isComplete)} 
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <ChatInput
        value={currentInput}
        onChange={setCurrentInput}
        onSubmit={() => { flow.handleSubmit(currentInput); setCurrentInput(""); }}
        placeholder={flow.getPlaceholder()}
        type={flow.getInputType()}
        disabled={flow.isInputDisabled || actions.isGeneratingLink}
      />
    </div>
  );
}