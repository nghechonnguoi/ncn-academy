"use client";

import { useState, useCallback } from "react";
import { aiApi } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // Build history for API (exclude timestamps)
    const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    try {
      const data = await aiApi.chat(history);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.remainingMessages !== undefined) {
        setRemainingMessages(data.remainingMessages);
      }
      return aiMsg;
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 402
          ? "Bạn đã hết lượt AI tháng này. Vui lòng nâng cấp lên gói Pro."
          : err?.response?.data?.message ?? "Lỗi kết nối AI. Vui lòng thử lại.";
      setError(msg);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ ${msg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, remainingMessages, error, sendMessage, clearMessages, setMessages };
}
