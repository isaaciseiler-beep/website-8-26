import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import { useLocation } from "react-router-dom";
import { projectItems } from "@/lib/siteContent";
import {
  CHAT_LIMIT_MESSAGE,
  askSiteAssistant,
  countUserMessages,
  MAX_CHAT_USER_MESSAGES,
  sendAssistantFeedback,
  type ChatApiResponse,
  type ChatPageContext,
  type ChatRequestMessage,
  type ChatSource,
} from "@/lib/chatClient";
import { isSiteOverlayOpen } from "@/lib/siteOverlay";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const FEEDBACK_REASONS = [
  ["incorrect", "Incorrect"],
  ["too-vague", "Too vague"],
  ["missed-question", "Missed the question"],
  ["bad-link", "Bad source"],
  ["too-long", "Too long"],
] as const;

interface ChatMessage extends ChatRequestMessage {
  id: string;
  question?: string;
  sources?: ChatSource[];
  confidence?: ChatApiResponse["confidence"];
  intent?: string;
  suggestedQuestions?: string[];
  requestId?: string;
  model?: string;
  mode?: ChatApiResponse["mode"];
  verified?: boolean;
  latencyMs?: number;
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const isExternal = (url: string) => /^https?:\/\//i.test(url);
const sourceLabel = (title: string) => title
  .replace(/^Isaac Seiler\s*[—-]\s*/i, "")
  .replace(/^Current Public Profile$/i, "About")
  .replace(/^Current Role at Summation$/i, "Summation")
  .replace(/^Public Contact Channels$/i, "Contact");

const AnswerText = ({ content }: { content: string }) => {
  const blocks = content.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <div className="ai-dock-answer">
      {blocks.map((line, index) => line.startsWith("- ")
        ? <div key={`${line}-${index}`} className="ai-dock-answer-line"><span aria-hidden>—</span><p>{line.slice(2)}</p></div>
        : <p key={`${line}-${index}`}>{line}</p>)}
    </div>
  );
};

const SourceLinks = ({ sources }: { sources: ChatSource[] }) => {
  const linked = sources
    .filter((source) => source.url)
    .filter((source, index, all) => all.findIndex((candidate) => candidate.url === source.url) === index)
    .slice(0, 2);
  if (!linked.length) return null;
  return (
    <div className="ai-dock-sources" aria-label="Sources used">
      {linked.map((source) => (
        <a
          key={source.id}
          href={source.url}
          {...(isExternal(source.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {sourceLabel(source.title)}
          {isExternal(source.url) ? <ExternalLink aria-hidden="true" /> : null}
        </a>
      ))}
    </div>
  );
};

const AssistantAnswer = ({
  message,
  route,
  showExtras,
  onSuggestedQuestion,
}: {
  message: ChatMessage;
  route: string;
  showExtras: boolean;
  onSuggestedQuestion: (question: string) => void;
}) => {
  const [feedbackState, setFeedbackState] = useState<"idle" | "choosing" | "sending" | "sent" | "error">("idle");

  const submitFeedback = async (rating: "up" | "down", reason?: string) => {
    if (!message.requestId) return;
    setFeedbackState("sending");
    try {
      await sendAssistantFeedback({
        requestId: message.requestId,
        rating,
        reason,
        route,
        intent: message.intent,
        model: message.model,
        latencyMs: message.latencyMs,
        sourceIds: (message.sources ?? []).map((source) => source.id),
        question: message.question ?? "",
        answer: message.content,
      });
      setFeedbackState("sent");
    } catch {
      setFeedbackState("error");
    }
  };

  return (
    <div>
      <AnswerText content={message.content} />
      {showExtras ? <SourceLinks sources={message.sources ?? []} /> : null}
      {showExtras && message.requestId ? (
        <div className="ai-dock-answer-footer">
          <div className="ai-dock-feedback" aria-label="Rate this answer">
            {feedbackState === "sent" ? (
              <span className="ai-dock-feedback-thanks"><Check aria-hidden="true" /> Thanks</span>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="This answer was helpful"
                  onClick={() => void submitFeedback("up")}
                  disabled={feedbackState === "sending"}
                >
                  <ThumbsUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="This answer needs improvement"
                  onClick={() => setFeedbackState("choosing")}
                  disabled={feedbackState === "sending"}
                >
                  <ThumbsDown aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
      {showExtras && feedbackState === "choosing" ? (
        <div className="ai-dock-feedback-reasons">
          {FEEDBACK_REASONS.map(([value, label]) => (
            <button key={value} type="button" onClick={() => void submitFeedback("down", value)}>{label}</button>
          ))}
        </div>
      ) : null}
      {showExtras && feedbackState === "error" ? <p className="ai-dock-feedback-error">Feedback could not be saved.</p> : null}
      {showExtras && message.suggestedQuestions?.length ? (
        <div className="ai-dock-followups" aria-label="Suggested follow-up questions">
          {message.suggestedQuestions.map((question) => (
            <button key={question} type="button" onClick={() => onSuggestedQuestion(question)}>{question}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const ChatOrb = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [siteOverlayOpen, setSiteOverlayOpen] = useState(isSiteOverlayOpen);
  const listRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();

  const catalogProject = (() => {
    const match = location.pathname.match(/^\/projects\/(.+)$/);
    return match ? projectItems.find((item) => item.id === match[1]) ?? null : null;
  })();

  const getCurrentPageContext = (): ChatPageContext => {
    const main = document.querySelector("main");
    const elementText = (element: Element | null) =>
      ((element as HTMLElement | null)?.innerText || element?.textContent || "").replace(/\s+/g, " ").trim();
    const visibleText = elementText(main).slice(0, 9000);
    const headings = main
      ? Array.from(main.querySelectorAll("h1, h2, h3")).map((heading) => elementText(heading)).filter(Boolean).slice(0, 24)
      : [];
    const links = main
      ? Array.from(main.querySelectorAll("a[href]")).map((anchor) => ({
          label: elementText(anchor).slice(0, 160),
          href: anchor.getAttribute("href") || "",
        })).filter((link) => link.label && link.href).slice(0, 20)
      : [];
    const facts = catalogProject?.sections.flatMap((section) => [
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
      ...(section.stats ?? []).map((stat) => `${stat.value} ${stat.label}`),
    ]).slice(0, 30) ?? [];

    return {
      route: `${location.pathname}${location.search}`,
      pageType: catalogProject ? (catalogProject.source === "BLOG" ? "article" : "project") : location.pathname === "/" ? "home" : "page",
      title: catalogProject?.title || headings[0] || document.title,
      summary: catalogProject?.summary || "",
      headings,
      facts,
      visibleText,
      links,
    };
  };

  const disabled = location.pathname === "/photos" || location.pathname === "/photos/map";
  const userMessageCount = countUserMessages(messages);
  const limitReached = messages.some((message) => message.role === "assistant" && message.content === CHAT_LIMIT_MESSAGE);
  const expanded = open && (messages.length > 0 || isLoading);
  const latestAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id;

  useEffect(() => {
    setOpen(false);
    setQuery("");
    setMessages([]);
    setHasScrolled(window.scrollY > 10);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 10);
    if (window.scrollY > 10) setHasScrolled(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncOverlayState = () => {
      const nextOpen = isSiteOverlayOpen();
      setSiteOverlayOpen(nextOpen);
      if (nextOpen) setOpen(false);
    };

    syncOverlayState();
    window.addEventListener("site-overlay-state", syncOverlayState);
    return () => window.removeEventListener("site-overlay-state", syncOverlayState);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (!open || window.matchMedia("(max-width: 767px), (pointer: coarse)").matches) return;
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    let frame = 0;
    const updateForVisualViewport = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const viewportHeight = viewport?.height ?? window.innerHeight;
        const obscuredBottom = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
        root.style.setProperty("--ai-dock-keyboard-offset", `${obscuredBottom}px`);
        root.style.setProperty("--ai-dock-viewport-height", `${viewportHeight}px`);
      });
    };
    updateForVisualViewport();
    window.visualViewport?.addEventListener("resize", updateForVisualViewport);
    window.visualViewport?.addEventListener("scroll", updateForVisualViewport);
    window.addEventListener("resize", updateForVisualViewport);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener("resize", updateForVisualViewport);
      window.visualViewport?.removeEventListener("scroll", updateForVisualViewport);
      window.removeEventListener("resize", updateForVisualViewport);
      root.style.removeProperty("--ai-dock-keyboard-offset");
      root.style.removeProperty("--ai-dock-viewport-height");
    };
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
      if (document.activeElement === inputRef.current) return;
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
      const data = await askSiteAssistant(next.map(({ role, content }) => ({ role, content })), getCurrentPageContext());
      setMessages((current) => [...current, {
        id: createMessageId(),
        role: "assistant",
        content: data.message || "",
        question: prompt,
        sources: data.sources,
        confidence: data.confidence,
        intent: data.intent,
        suggestedQuestions: data.suggestedQuestions,
        requestId: data.requestId,
        model: data.model,
        mode: data.mode,
        verified: data.verified,
        latencyMs: data.latencyMs,
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: createMessageId(),
        role: "assistant",
        content: error instanceof Error ? error.message : "The AI assistant is temporarily unavailable.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const useSuggestedQuestion = (question: string) => {
    setQuery(question);
    inputRef.current?.focus({ preventScroll: true });
  };

  if (disabled) return null;
  const visible = hasScrolled && !siteOverlayOpen;

  return (
    <motion.div
      className="ai-dock"
      ref={rootRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 8,
        pointerEvents: visible ? "auto" : "none",
      }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <motion.div
        className="ai-dock-shell"
        initial={false}
        animate={{ width: open ? "min(94vw, 660px)" : 148 }}
        transition={{ duration: 0.52, ease: EASE }}
      >
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="thread"
              className="ai-dock-thread"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "min(calc(var(--ai-dock-viewport-height, 100dvh) * 0.6), 460px)",
                opacity: 1,
              }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.46, ease: EASE }}
            >
              <div ref={listRef} className="ai-dock-messages" aria-live="polite">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={message.role === "user" ? "ai-dock-bubble ai-dock-bubble--user" : "ai-dock-bubble ai-dock-bubble--assistant"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    {message.role === "assistant"
                      ? (
                          <AssistantAnswer
                            message={message}
                            route={location.pathname}
                            showExtras={!isLoading && message.id === latestAssistantId && messages[messages.length - 1]?.id === message.id}
                            onSuggestedQuestion={useSuggestedQuestion}
                          />
                        )
                      : message.content}
                  </motion.div>
                ))}
                {isLoading ? (
                  <div className="ai-dock-thinking" aria-label="Reading the page and checking evidence">
                    <div className="ai-dock-typing" aria-hidden="true">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.14 }}
                        />
                      ))}
                    </div>
                    <span>Reading this page and checking the evidence…</span>
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
                  placeholder={limitReached ? "Chat limit reached" : catalogProject ? "Ask about this work" : "Ask about my work"}
                  disabled={limitReached}
                  aria-label="Ask AI"
                />
                <button type="submit" className="ai-dock-send" disabled={!query.trim() || isLoading || limitReached} aria-label="Send">
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
    </motion.div>
  );
};

export default ChatOrb;
