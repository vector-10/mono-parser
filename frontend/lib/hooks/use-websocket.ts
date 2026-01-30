"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current.on("connect", () => {
      console.log("WebSocket connected:", socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const getClientId = () => {
    return socketRef.current?.id || null;
  };

  return { 
    isConnected, 
    on, 
    off, 
    emit, 
    getClientId,
    socket: socketRef.current 
  };
}