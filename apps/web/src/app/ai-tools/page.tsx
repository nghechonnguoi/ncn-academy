"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/useAI";

const SUGGESTED = [
  "Tôi phù hợp với ngành Data Science không?",
  "Lộ trình để trở thành Product Manager?",
  "Mức lương Data Analyst ở Việt Nam là bao nhiêu?",
  "Tôi nên học gì để chuyển sang UX Design?",
];

const INITIAL_CONTENT = `Xin chào! Tôi là AI Advisor của NCN Academy 🧭

Dựa trên kết quả phân tích RIASEC của bạn, tôi có thể tư vấn chuyên sâu về:

• Lộ trình phát triển nghề nghiệp
• Kỹ năng cần học theo từng giai đoạn
• Mức lương thị trường thực tế
• Chiến lược xây dựng thương hiệu cá nhân

Bạn muốn khám phá điều gì trước?`;

export default function AiToolsPage() {
  const { messages, isLoading, remainingMessages, error, sendMessage, clearMessages, setMessages } = useAI();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message (local only, not from API)
  const [initialized, setInitialized] = useState(false);
  const displayMessages = initialized || messages.length > 0
    ? messages
    : [{ id: "0", role: "assistant" as const, content: INITIAL_CONTENT, timestamp: new Date() }];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!initialized) setInitialized(true);
    setInput("");
    await sendMessage(text);
  };

  const handleReset = () => {
    clearMessages();
    setInitialized(false);
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635bff]/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#635bff]" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">AI Career Advisor</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-400">GPT-4o · Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {remainingMessages !== null && (
              <Badge variant="outline" className="text-xs">
                {remainingMessages} tin còn lại
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayMessages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm",
                msg.role === "assistant" ? "bg-[#635bff] text-white" : "bg-gray-200 text-gray-600"
              )}>
                {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-white border border-gray-100 text-gray-700 shadow-sm"
                  : "bg-[#635bff] text-white"
              )}>
                <p className="whitespace-pre-line">{msg.content}</p>
                <p className={cn("text-xs mt-2", msg.role === "assistant" ? "text-gray-400" : "text-purple-200")}>
                  {msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#635bff] flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#635bff]/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {!initialized && (
          <div className="px-6 pb-2 flex gap-2 flex-wrap">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#635bff] hover:text-[#635bff] hover:bg-[#635bff]/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-100 p-4">
          <form
            className="flex gap-3 items-end"
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          >
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về nghề nghiệp, kỹ năng, lộ trình..."
                className="pr-10 rounded-xl border-gray-200"
                disabled={isLoading}
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-[#635bff] hover:bg-[#5248e8] rounded-xl px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-2">
            AI có thể mắc lỗi. Kiểm tra thông tin quan trọng từ nguồn chính thức.
          </p>
        </div>
      </div>
    </div>
  );
}
