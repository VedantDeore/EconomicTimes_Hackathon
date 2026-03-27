"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((sessionId: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/ws/chat/${sessionId}`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: event.data, timestamp: new Date() },
      ]);
    };

    wsRef.current = ws;
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") || "" : "";

      setMessages((prev) => [
        ...prev,
        { role: "user", content: message, timestamp: new Date() },
      ]);
      setIsThinking(true);

      wsRef.current.send(
        JSON.stringify({ message, user_id: userId })
      );
    },
    []
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { messages, isConnected, isThinking, connect, sendMessage, disconnect };
}
