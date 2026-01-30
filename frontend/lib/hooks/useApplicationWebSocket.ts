import { useEffect, useState } from "react";
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

  // Join user room
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit("join_user_room", { userId: user.id });
      console.log("Joined user room:", user.id);
    }
  }, [socket, user?.id]);

  // Setup event listeners
  useEffect(() => {
    on("application_progress", (data: { message: string }) => {
      onApplicationProgress(data.message);
    });

    on("application_complete", (data: any) => {
      onApplicationComplete();
    });

    on("application_error", (data: { message: string }) => {
      onApplicationError(data.message);
      toast.error("Analysis failed");
    });

    on("account_linked", (data: {
      applicantId: string;
      accountId: string;
      institution: string;
      accountNumber: string;
    }) => {
      if (data.applicantId === applicantId) {
        onAccountLinked(data);
        toast.success("Bank account linked!");
      }
    });

    return () => {
      off("application_progress");
      off("application_complete");
      off("application_error");
      off("account_linked");
    };
  }, [on, off, applicantId, onAccountLinked, onApplicationProgress, onApplicationComplete, onApplicationError]);

  // Debug logs
  useEffect(() => {
    console.log("WebSocket connected:", isConnected);
    console.log("Client ID:", getClientId());
  }, [isConnected, getClientId]);

  return { isConnected, getClientId };
}