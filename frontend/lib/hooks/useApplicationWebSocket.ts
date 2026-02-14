
  import { useEffect, useRef } from "react";
  import { useWebSocket } from "@/lib/hooks/use-websocket";
  import { toast } from "sonner";



  export function useApplicationWebSocket(
    applicantId: string,
    onAccountLinked: (data: {
      applicantId: string;
      accountId: string;
      institution: string;
      accountNumber: string;
    }) => void,
    onApplicationProgress: (message: string) => void,
    onApplicationComplete: () => void,
    onApplicationError: (message: string) => void
  ) {
    const { isConnected, on, off, getClientId } = useWebSocket(); 
  // const user = useAuthStore((state) => state.user);

    const callbacksRef = useRef({
      onAccountLinked,
      onApplicationProgress,
      onApplicationComplete,
      onApplicationError,
    });

    useEffect(() => {
      callbacksRef.current = {
        onAccountLinked,
        onApplicationProgress,
        onApplicationComplete,
        onApplicationError,
      };
    }, [onAccountLinked, onApplicationProgress, onApplicationComplete, onApplicationError]);



    useEffect(() => {
    const handleProgress = (data: unknown) => {
      const typedData = data as { message: string };
      callbacksRef.current.onApplicationProgress(typedData.message);
    };

    const handleComplete = () => {
      callbacksRef.current.onApplicationComplete();
    };

    const handleError = (data: unknown) => {
      const typedData = data as { message: string };
      callbacksRef.current.onApplicationError(typedData.message);
      toast.error("Analysis failed");
    };

    const handleAccountLinked = (data: unknown) => {
      const typedData = data as {
        applicantId: string;
        accountId: string;
        institution: string;
        accountNumber: string;
      };
      if (typedData.applicantId === applicantId) {
        callbacksRef.current.onAccountLinked(typedData);
        toast.success("Bank account linked!");
      }
    };

    on("application_progress", handleProgress);
    on("application_complete", handleComplete);
    on("application_error", handleError);
    on("account_linked", handleAccountLinked);

    return () => {
      off("application_progress");
      off("application_complete");
      off("application_error");
      off("account_linked");
    };
  }, [on, off, applicantId]);

    useEffect(() => {
      console.log("WebSocket connected:", isConnected);
      console.log("Client ID:", getClientId());
    }, [isConnected, getClientId]);

    return { isConnected, getClientId };
  }