"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types/board";

interface BoardChatProps {
  boardId: string;
  meId: string;
  meUsername: string;
  wsSend: (payload: object) => void;
  messages: ChatMessage[];
}

export function BoardChat({
  boardId,
  meId,
  meUsername,
  wsSend,
  messages,
}: BoardChatProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendChat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;

    wsSend({
      type: "SEND_MESSAGE",
      data: { boardId, userId: meId, username: meUsername, message },
    });
    setText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-2xl transition-all duration-300 ${
          open
            ? "bg-[#2a2a2a] text-white hover:bg-[#333]"
            : "bg-[#7b39fc] text-white shadow-[0_6px_24px_rgba(123,57,252,0.4)] hover:bg-[#8d53ff] hover:scale-105"
        }`}
      >
        <MessageSquare size={16} />
        {open ? "Close Chat" : "Live Chat"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-40 flex h-[420px] w-80 flex-col rounded-2xl border border-white/10 bg-[#161616] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-[#7b39fc]" />
                <span className="font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
                  Board Chat
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {messages.map((m, i) => {
                const isMe = m.userId === meId;
                return (
                  <div key={i} className={isMe ? "text-right" : "text-left"}>
                    <span className="text-[10px] text-white/40">
                      {isMe ? "You" : m.username || "Someone"}
                      {m.timestamp &&
                        ` · ${new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </span>
                    <div>
                      <p
                        className={`inline-block mt-1 max-w-[85%] rounded-2xl px-3.5 py-2 text-xs break-words ${
                          isMe
                            ? "bg-[#7b39fc] text-white"
                            : "border border-white/[0.06] bg-[#222] text-white/90"
                        }`}
                      >
                        {m.message}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center text-white/30 text-xs">
                  <MessageSquare size={24} className="mb-2 text-white/10" />
                  No messages yet. Say hello to your team!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendChat} className="flex items-center gap-2 border-t border-white/[0.06] p-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message team..."
                className="flex-1 rounded-xl border-none bg-black h-9 px-3 text-xs text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b39fc] text-white transition-colors hover:bg-[#8d53ff] shrink-0"
                title="Send"
              >
                <Send size={13} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}