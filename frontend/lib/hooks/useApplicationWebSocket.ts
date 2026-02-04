import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { useAuthStore } from "@/lib/store/auth";
import { toast } from "sonner";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  link?: string;
};

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
  const { isConnected, on, off, getClientId, socket } = useWebSocket();
  const user = useAuthStore((state) => state.user);

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
    if (socket && user?.id) {
      socket.emit("join_user_room", { userId: user.id });
      console.log("Joined user room:", user.id);
    }
  }, [socket, user?.id]);


  useEffect(() => {
    const handleProgress = (data: { message: string }) => {
      callbacksRef.current.onApplicationProgress(data.message);
    };

    const handleComplete = (data: any) => {
      callbacksRef.current.onApplicationComplete();
    };

    const handleError = (data: { message: string }) => {
      callbacksRef.current.onApplicationError(data.message);
      toast.error("Analysis failed");
    };

    const handleAccountLinked = (data: {
      applicantId: string;
      accountId: string;
      institution: string;
      accountNumber: string;
    }) => {
      if (data.applicantId === applicantId) {
        callbacksRef.current.onAccountLinked(data);
        toast.success("Bank account linked!");
      }
    };

    on("application_progress", handleProgress);
    on("application_complete", handleComplete);
    on("application_error", handleError);
    on("account_linked", handleAccountLinked);

    return () => {
      off("application_progress" );
      off("application_complete" );
      off("application_error" );
      off("account_linked"   );
    };
  }, [on, off, applicantId]); 


  useEffect(() => {
    console.log("WebSocket connected:", isConnected);
    console.log("Client ID:", getClientId());
  }, [isConnected, getClientId]);

  return { isConnected, getClientId };
}