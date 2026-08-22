import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { CONTACT_EMAIL } from "@/lib/site";
import {
  CHAT_LIMIT_MESSAGE,
  askSiteAssistant,
  countUserMessages,
  MAX_CHAT_USER_MESSAGES,
  type ChatRequestMessage,
} from "@/lib/chatClient";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ChatMessage extends ChatRequestMessage {
  id: string;
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const ChatOrb = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const disabled = location.pathname === "/photos" || location.pathname === "/photos/map";

  const userMessageCount = countUserMessages(messages);
  const limitReached = messages.some(
    (message) => message.role === "assistant" && message.content === CHAT_LIMIT_MESSAGE,
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = query.trim();
    if (!prompt || isLoading || limitReached) return;

    const next = [...messages, { id: createMessageId(), role: "user" as const, content: prompt }];
    setMessages(next);
    setQuery("");

    if (userMessageCount >= MAX_CHAT_USER_MESSAGES) {
      setMessages([...next, { id: createMessageId(), role: "assistant", content: CHAT_LIMIT_MESSAGE }]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await askSiteAssistant(next.map(({ role, content }) => ({ role, content })));
      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: "assistant", content: data.message || "" },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: error instanceof Error ? error.message : "The AI assistant is temporarily unavailable.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (disabled) return null;

  return (
    <div className="ai-dock">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            className="ai-dock-panel"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.42, ease: EASE }}
            role="dialog"
            aria-label="Ask AI"
          >
            <button
              type="button"
              className="ai-dock-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X aria-hidden="true" />
            </button>

            <div ref={listRef} className="ai-dock-messages">
              {messages.length === 0 && !isLoading ? (
                <p className="ai-dock-empty">Ask about my work, writing, or research.</p>
              ) : null}


              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={message.role === "user" ? "ai-dock-bubble ai-dock-bubble--user" : "ai-dock-bubble"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {message.content}
                </motion.div>
              ))}

              {isLoading ? (
                <div className="ai-dock-typing" aria-label="Loading answer">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.14 }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <form className="ai-dock-form" onSubmit={ask}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={limitReached ? "Message limit reached" : "Ask about my work"}
                aria-label="Ask about my work"
                disabled={limitReached}
              />
              <button
                type="submit"
                className="ai-dock-send"
                disabled={!query.trim() || isLoading || limitReached}
                aria-label="Send"
              >
                <ArrowUp aria-hidden="true" />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ai-dock-trigger"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: open ? 14 : 1, y: 0 }}
        style={{ opacity: open ? 0 : 1, pointerEvents: open ? "none" : "auto" }}
        transition={{ duration: 0.36, ease: EASE }}
        aria-expanded={open}
        aria-label="Ask AI"
      >
        <span>Ask AI</span>
      </motion.button>

    </div>
  );
};

export default ChatOrb;
