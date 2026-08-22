import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLocation } from "react-router-dom";
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const disabled = location.pathname === "/photos" || location.pathname === "/photos/map";

  const [hasScrolled, setHasScrolled] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);

  const userMessageCount = countUserMessages(messages);
  const limitReached = messages.some(
    (message) => message.role === "assistant" && message.content === CHAT_LIMIT_MESSAGE,
  );
  const expanded = open && (messages.length > 0 || isLoading);

  useEffect(() => {
    setOpen(false);
    setHasScrolled(window.scrollY > 80);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 80);
    if (window.scrollY > 80) setHasScrolled(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPhoto = (event: Event) => {
      setPhotoVisible(Boolean((event as CustomEvent).detail?.visible));
    };
    window.addEventListener("photo-section-visibility", onPhoto);
    return () => window.removeEventListener("photo-section-visibility", onPhoto);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 260);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > window.innerHeight / 4) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

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

  if (disabled || photoVisible || !hasScrolled) return null;

  return (
    <div className="ai-dock" ref={rootRef}>
      <motion.div
        className="ai-dock-shell"
        initial={false}
        animate={{ width: open ? "min(92vw, 620px)" : 148 }}
        transition={{ duration: 0.52, ease: EASE }}
      >
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="thread"
              className="ai-dock-thread"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "min(48vh, 380px)", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.46, ease: EASE }}
            >
              <div ref={listRef} className="ai-dock-messages">
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
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="ai-dock-row">
          <AnimatePresence initial={false} mode="wait">
            {open ? (
              <motion.form
                key="form"
                className="ai-dock-form"
                onSubmit={ask}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={limitReached ? "Chat limit reached" : "Ask about my work"}
                  disabled={limitReached}
                  aria-label="Ask AI"
                />
                <button
                  type="submit"
                  className="ai-dock-send"
                  disabled={!query.trim() || isLoading || limitReached}
                  aria-label="Send"
                >
                  <ArrowUp aria-hidden="true" />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="label"
                type="button"
                className="ai-dock-label"
                onClick={() => setOpen(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                aria-expanded={false}
              >
                Ask AI
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatOrb;
