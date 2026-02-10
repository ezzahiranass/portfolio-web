"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, SendHorizontal, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/app/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const seedMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Hi there. Drop a message and I will get back to you.",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatbotWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const newMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [
      ...prev,
      newMessage,
      {
        id: createId(),
        role: "assistant",
        content: "Thanks. I will follow up soon.",
      },
    ]);
    setDraft("");
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {isOpen && (
        <div
          ref={panelRef}
          className="w-[90vw] max-w-sm overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
                <Bot className="h-4 w-4" />
                Chat Assistant
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Quick questions, project briefs, or availability checks.
              </div>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)]"
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex max-h-[260px] flex-col gap-3 overflow-y-auto px-5 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--surface)] text-[var(--foreground)]"
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] px-5 py-4">
            <div className="flex flex-col gap-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Write your message..."
                className="min-h-[80px]"
              />
              <div className="flex items-center justify-end">
                <Button
                  className="flex items-center gap-2 rounded-full"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  Send
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        className="group flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
        aria-label="Open chat"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
