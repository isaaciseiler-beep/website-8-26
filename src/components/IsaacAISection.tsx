import { motionReduced } from "@/hooks/useMotionPreference";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUp } from "lucide-react";
import AnimatedText from "@/components/AnimatedText";
import { CONTACT_EMAIL } from "@/lib/site";
import {
  CHAT_LIMIT_MESSAGE,
  askSiteAssistant,
  countUserMessages,
  MAX_CHAT_USER_MESSAGES,
  type ChatRequestMessage,
  type ChatSource,
} from "@/lib/chatClient";

interface ChatMessage extends ChatRequestMessage {
  id: string;
  sources?: ChatSource[];
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const TYPE_INTERVAL_MS = 14;

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

const isSafeHref = (href: string) =>
  href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:") || isExternalHref(href);

const renderInlineText = (text: string) => {
  const nodes: (string | JSX.Element)[] = [];
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkPattern.exec(text))) {
    const [fullMatch, label, href] = match;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    if (isSafeHref(href)) {
      nodes.push(
        <a
          key={`${href}-${match.index}`}
          href={href}
          {...(isExternalHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:decoration-foreground/60"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(label);
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

const FormattedMessage = ({ text, cursor = false }: { text: string; cursor?: boolean }) => {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 text-[14px] leading-relaxed md:text-[15px]">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const bulletText = trimmed.replace(/^([-*•]|\d+[.)])\s+/, "");
        const isBullet = bulletText !== trimmed;
        const showCursor = cursor && index === lines.length - 1;

        if (!trimmed) return <div key={index} className="h-1" aria-hidden />;

        if (isBullet) {
          return (
            <div key={index} className="flex gap-2.5">
              <span className="shrink-0 text-foreground/58" aria-hidden>
                -
              </span>
              <span>
                {renderInlineText(bulletText)}
                {showCursor ? <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground/50" /> : null}
              </span>
            </div>
          );
        }

        return (
          <p key={index}>
            {renderInlineText(trimmed)}
            {showCursor ? <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground/50" /> : null}
          </p>
        );
      })}
    </div>
  );
};

const AssistantMessage = ({ message, active }: { message: ChatMessage; active: boolean }) => {
  const [visibleText, setVisibleText] = useState(active ? "" : message.content);
  const isComplete = visibleText.length >= message.content.length;
  const linkedSources = (message.sources || []).filter((source) => source.url).slice(0, 3);

  useEffect(() => {
    if (!active) {
      setVisibleText(message.content);
      return;
    }

    let index = 0;
    const step = message.content.length > 420 ? 4 : message.content.length > 220 ? 2 : 1;

    setVisibleText("");
    const interval = window.setInterval(() => {
      index = Math.min(index + step, message.content.length);
      setVisibleText(message.content.slice(0, index));
      if (index >= message.content.length) window.clearInterval(interval);
    }, TYPE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [active, message.content]);

  return (
    <div className="mr-auto max-w-[92%] text-foreground/82 md:max-w-[84%]">
      <FormattedMessage text={visibleText} cursor={active && !isComplete} />
      {isComplete && linkedSources.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/34">
          <span>Related</span>
          {linkedSources.map((source) => (
            <a
              key={`${source.id}-${source.url}`}
              href={source.url}
              {...(source.url && isExternalHref(source.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="normal-case tracking-normal text-foreground/54 underline decoration-foreground/12 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/45"
            >
              {source.title}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const TypingSignal = () => (
  <motion.div
    className="relative h-9 w-[104px] overflow-hidden px-3"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, ease: EASE }}
    aria-label="Loading AI answer"
  >
    <motion.span
      className="absolute left-3 top-1/2 h-px w-11 origin-left bg-foreground/16"
      animate={{ scaleX: [0.35, 1, 0.35], opacity: [0.25, 0.7, 0.25] }}
      transition={{ duration: 1.55, repeat: Infinity, ease: "easeInOut" }}
    />
    <div className="relative z-10 flex h-full items-center gap-2">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="block h-2 w-2 rounded-[2px] bg-foreground/54 shadow-[0_0_18px_hsl(var(--highlight)/0.2)]"
          animate={{
            opacity: [0.28, 1, 0.28],
            rotate: [0, 12, 0],
            scale: [0.82, 1.08, 0.82],
            y: [0, -4, 0],
          }}
          transition={{ duration: 1.15, repeat: Infinity, delay: dot * 0.14, ease: EASE }}
        />
      ))}
    </div>
    <motion.span
      className="absolute bottom-1.5 left-3 h-px w-16 bg-[linear-gradient(90deg,transparent,hsl(var(--highlight)/0.75),transparent)]"
      animate={{ x: [-38, 72], opacity: [0, 1, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.div>
);

const IsaacAISection = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardSpacer, setKeyboardSpacer] = useState(0);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputPillRef = useRef<HTMLDivElement | null>(null);
  const pageScrollBeforeFocusRef = useRef(0);
  const focusRestoreTimersRef = useRef<number[]>([]);
  const headingInView = useInView(headingRef, { amount: 0.72, margin: "-80px" });
  const paneInView = useInView(paneRef, { amount: 0.42, margin: "-120px" });

  const hasConversation = messages.length > 0 || isLoading;
  const userMessageCount = countUserMessages(messages);
  const hasLimitNotice = messages.some(
    (message) => message.role === "assistant" && message.content === CHAT_LIMIT_MESSAGE,
  );
  const limitReached = hasLimitNotice || userMessageCount > MAX_CHAT_USER_MESSAGES;
  const inputLabel = limitReached ? "AI assistant message limit reached" : "Ask about my work";

  const isMobileInputViewport = useCallback(
    () => window.matchMedia("(max-width: 767px), (pointer: coarse)").matches,
    [],
  );

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: motionReduced() ? "instant" : "smooth" });
  }, [messages, isLoading]);

  const clearFocusRestoreTimers = useCallback(() => {
    focusRestoreTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    focusRestoreTimersRef.current = [];
  }, []);

  const restorePageScrollAfterFocus = () => {
    clearFocusRestoreTimers();
    const restore = () => window.scrollTo(0, pageScrollBeforeFocusRef.current);
    window.requestAnimationFrame(restore);
    focusRestoreTimersRef.current = [40, 120, 240, 420, 700].map((delay) => window.setTimeout(restore, delay));
  };

  const moveInputAboveKeyboard = useCallback(() => {
    const inputPill = inputPillRef.current;
    if (!inputPill) return;

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const rect = inputPill.getBoundingClientRect();
    const buffer = 14;
    const safeBottom = viewportHeight - buffer;
    const safeTop = buffer;

    if (rect.bottom > safeBottom) {
      window.scrollBy({ top: rect.bottom - safeBottom, behavior: motionReduced() ? "instant" : "smooth" });
    } else if (rect.top < safeTop) {
      window.scrollBy({ top: rect.top - safeTop, behavior: motionReduced() ? "instant" : "smooth" });
    }
  }, []);

  const scheduleInputVisibilityCheck = useCallback(() => {
    clearFocusRestoreTimers();
    focusRestoreTimersRef.current = [120, 320, 620].map((delay) =>
      window.setTimeout(moveInputAboveKeyboard, delay),
    );
  }, [clearFocusRestoreTimers, moveInputAboveKeyboard]);

  useEffect(() => {
    if (!inputFocused || !isMobileInputViewport()) {
      setKeyboardSpacer(0);
      return;
    }

    const updateInputPosition = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const keyboardHeight = Math.max(0, window.innerHeight - viewportHeight);
      setKeyboardSpacer(Math.min(keyboardHeight, 420));
      scheduleInputVisibilityCheck();
    };

    updateInputPosition();
    window.visualViewport?.addEventListener("resize", updateInputPosition);
    window.visualViewport?.addEventListener("scroll", updateInputPosition);
    window.addEventListener("resize", updateInputPosition);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateInputPosition);
      window.visualViewport?.removeEventListener("scroll", updateInputPosition);
      window.removeEventListener("resize", updateInputPosition);
    };
  }, [inputFocused, isMobileInputViewport, scheduleInputVisibilityCheck]);

  const askAssistant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = query.trim();
    if (!prompt || isLoading || limitReached) return;

    const userMessage: ChatMessage = { id: createMessageId(), role: "user", content: prompt };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuery("");
    setTypingMessageId(null);

    if (userMessageCount >= MAX_CHAT_USER_MESSAGES) {
      const assistantMessageId = createMessageId();
      setMessages([
        ...nextMessages,
        {
          id: assistantMessageId,
          role: "assistant",
          content: CHAT_LIMIT_MESSAGE,
        },
      ]);
      setTypingMessageId(assistantMessageId);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);

    try {
      const data = await askSiteAssistant(nextMessages.map(({ role, content }) => ({ role, content })));
      if (requestIdRef.current !== requestId) return;
      const assistantMessageId = createMessageId();

      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: data.message || "The AI assistant is temporarily unavailable. Please try again shortly.",
          sources: data.sources || [],
        },
      ]);
      setTypingMessageId(assistantMessageId);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      const assistantMessageId = createMessageId();
      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: error instanceof Error ? error.message : "The AI assistant is temporarily unavailable. Please try again shortly.",
        },
      ]);
      setTypingMessageId(assistantMessageId);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  };

  return (
    <section className="relative z-20 flex items-start px-6 pb-0 pt-0 md:pb-20">
      <motion.div
        className="mx-auto flex w-full max-w-3xl flex-col items-center text-center"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.56, ease: EASE }}
      >
        <div ref={headingRef} className="relative mb-5">
          <motion.div
            className="pointer-events-none absolute -inset-x-10 -inset-y-6 bg-[radial-gradient(ellipse_at_center,hsl(var(--highlight)/0.28),hsl(var(--foreground)/0.08)_38%,transparent_70%)] blur-2xl"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: headingInView ? 1 : 0, scale: headingInView ? 1 : 0.72 }}
            transition={{ duration: 0.76, ease: EASE }}
          />
          <AnimatedText
            text="Ask away"
            as="p"
            className="relative text-center text-3xl font-semibold leading-none tracking-tight text-foreground md:text-5xl"
            delay={0.08}
          />
        </div>

        <motion.div ref={paneRef} className="relative w-full max-w-2xl">
          <motion.div
            className="site-corner pointer-events-none absolute -inset-5 bg-[radial-gradient(ellipse_at_center,hsl(var(--foreground)/0.2),hsl(var(--highlight)/0.12)_38%,transparent_72%)] blur-2xl"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: paneInView ? 1 : 0, scale: paneInView ? 1 : 0.82 }}
            transition={{ duration: 0.82, ease: EASE }}
          />
          <motion.div
            className="site-corner group/ai relative isolate flex h-[340px] w-full flex-col overflow-hidden border border-foreground/[0.08] bg-foreground/[0.035] text-left transition-all duration-500 ease-out hover:border-foreground/[0.12] focus-within:border-foreground/[0.16] focus-within:bg-foreground/[0.045] md:h-[400px]"
            animate={{
              boxShadow: paneInView
                ? "0 22px 72px rgba(0,0,0,0.22)"
                : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.82, ease: EASE }}
          >
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--highlight)/0.82),transparent)]"
              animate={{ x: ["-55%", "55%"], opacity: [0.15, 0.9, 0.15] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--highlight)/0.08),transparent_38%,hsl(var(--foreground)/0.05))] opacity-0 transition-opacity duration-500 group-hover/ai:opacity-100 group-focus-within/ai:opacity-100" />
            <div
              ref={messageListRef}
              className={`relative z-10 flex min-h-0 flex-1 flex-col gap-4 px-3 pb-2 pt-4 scrollbar-hide md:px-4 md:pt-5 ${
                hasConversation ? "overflow-y-auto overscroll-contain" : "overflow-y-visible overscroll-auto"
              }`}
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "site-corner ml-auto max-w-[92%] border border-foreground/10 bg-foreground px-3.5 py-3 text-background shadow-[0_10px_28px_rgba(0,0,0,0.08)] md:max-w-[78%]"
                      : "mr-auto max-w-[92%] py-1 md:max-w-[84%]"
                  }
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, ease: EASE }}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-line text-[14px] leading-relaxed md:text-[15px]">{message.content}</p>
                  ) : (
                    <AssistantMessage message={message} active={typingMessageId === message.id} />
                  )}
                </motion.div>
              ))}

              {isLoading ? (
                <div className="mr-auto max-w-[84%]">
                  <TypingSignal />
                </div>
              ) : null}
            </div>

            <form
              onSubmit={askAssistant}
              className="relative z-10 shrink-0 px-3 pb-3 pt-2 md:px-4 md:pb-4"
            >
              <div
                ref={inputPillRef}
                className="site-corner relative flex min-h-11 w-full items-center bg-foreground/[0.045] transition-colors focus-within:bg-foreground/[0.07]"
              >
                <textarea
                  ref={textareaRef}
                  value={query}
                  onPointerDown={(event) => {
                    pageScrollBeforeFocusRef.current = window.scrollY;
                    if (!isMobileInputViewport() && document.activeElement !== textareaRef.current) {
                      event.preventDefault();
                      textareaRef.current?.focus({ preventScroll: true });
                      restorePageScrollAfterFocus();
                    }
                  }}
                  onFocus={() => {
                    setInputFocused(true);
                    if (isMobileInputViewport()) {
                      scheduleInputVisibilityCheck();
                    } else {
                      restorePageScrollAfterFocus();
                    }
                  }}
                  onBlur={() => {
                    setInputFocused(false);
                    setKeyboardSpacer(0);
                    clearFocusRestoreTimers();
                  }}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (isMobileInputViewport()) {
                      scheduleInputVisibilityCheck();
                    } else {
                      restorePageScrollAfterFocus();
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Ask about my work"
                  rows={1}
                  disabled={limitReached}
                  aria-label={inputLabel}
                  className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-3 pl-3.5 pr-14 text-base leading-relaxed text-foreground outline-none placeholder:text-foreground/36 md:pr-20"
                />
                <motion.button
                  type="submit"
                  disabled={!query.trim() || isLoading || limitReached}
                  className="absolute bottom-1.5 right-1.5 top-1.5 flex aspect-square shrink-0 items-center justify-center rounded-[calc(var(--site-corner-radius)-2px)] bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(18,24,14,0.22)] transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:bg-foreground/12 disabled:text-foreground/32 disabled:shadow-none"
                  transition={{ duration: 0.18, ease: EASE }}
                  aria-label="Ask Isaac AI"
                >
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.7} />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>

        <p className="mt-2.5 max-w-xl text-center text-[9px] italic leading-relaxed text-foreground/30 md:text-[10px]">
          This AI is trained on a body of my work and does not speak for me. It is a prototype. Report output issues{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Isaac%20AI%20output%20issue`}
            className="text-foreground/45 underline decoration-foreground/15 underline-offset-4 transition-colors hover:text-foreground"
          >
            here
          </a>
          .
        </p>
        <div
          aria-hidden="true"
          className="md:hidden"
          style={{ height: inputFocused ? keyboardSpacer : 0 }}
        />
      </motion.div>
    </section>
  );
};

export default IsaacAISection;
