"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

const SUGGESTIONS = [
  "How many vessels do we have in each stage?",
  "What is our contamination rate this month?",
  "Show me all cultivars and their vessel counts",
  "Which clone lines have been tested recently?",
  "Do we have any sales orders pending?",
  "What does our tech performance look like this week?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(text?: string) {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMessage: Message = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.response, toolsUsed: data.toolsUsed },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setMessages(newMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="Lab Assistant"
        description="Ask questions about your lab data in plain English"
      />

      <Card className="flex-1 flex flex-col mx-4 mb-4 overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">VitrOS Lab Assistant</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Ask me anything about your lab operations. I can query your vessels, cultivars,
                contamination data, tech performance, clone lines, and production forecasts in real time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubmit(s)}
                    className="text-left text-sm px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="shrink-0 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  {m.toolsUsed && m.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.toolsUsed.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t.replace("query_", "")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="shrink-0 rounded-full bg-foreground/10 h-8 w-8 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Querying your lab data...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your lab..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              disabled={loading}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
