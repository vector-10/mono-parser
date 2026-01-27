"use client";
import { useEffect, useState } from "react";

interface MonoConnectOptions {
  key: string;
  onSuccess: (code: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Connect: any;
  }
}

export function useMonoConnect() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if Mono Connect script is loaded
    if (typeof window !== "undefined" && window.Connect) {
      setIsReady(true);
    }
  }, []);

  const openMonoConnect = (options: MonoConnectOptions) => {
    if (!isReady || !window.Connect) {
      console.error("Mono Connect not loaded");
      return;
    }

    const monoInstance = new window.Connect({
      key: options.key,
      onSuccess: (response: any) => {
        console.log("Mono Connect Success:", response);
        options.onSuccess(response.code);
      },
      onClose: () => {
        console.log("Mono Connect closed");
        options.onClose();
      },
    });

    monoInstance.setup();
    monoInstance.open();
  };

  return { openMonoConnect, isReady };
}