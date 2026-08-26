export const MAX_CHAT_USER_MESSAGES = 5;
export const CHAT_LIMIT_MESSAGE = "Interactions with this AI assistant are limited to 5 messages.";

export type ChatRole = "user" | "assistant";

export interface ChatRequestMessage {
  role: ChatRole;
  content: string;
}

export interface ChatSource {
  id: string;
  title: string;
  source: string;
  url?: string;
  role?: string;
  metrics?: string[];
  score?: number;
}

export interface ChatPageContext {
  route: string;
  pageType: string;
  title: string;
  summary: string;
  headings: string[];
  facts: string[];
  visibleText: string;
  links: Array<{ label: string; href: string }>;
}

export interface ChatApiResponse {
  message?: string;
  error?: string;
  sources?: ChatSource[];
  confidence?: "high" | "medium" | "low";
  intent?: string;
  suggestedQuestions?: string[];
  requestId?: string;
  model?: string;
  mode?: "reasoning" | "fallback";
  verified?: boolean;
  latencyMs?: number;
  pageAware?: boolean;
}

const GENERIC_CHAT_ERROR = "The AI assistant is temporarily unavailable. Please try again shortly.";

export const countUserMessages = (messages: ChatRequestMessage[]) =>
  messages.filter((message) => message.role === "user").length;

export const isChatLimitReached = (messages: ChatRequestMessage[]) =>
  countUserMessages(messages) >= MAX_CHAT_USER_MESSAGES;

const getAssistantSessionId = () => {
  const key = "isaac-assistant-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, created);
  return created;
};

export const askSiteAssistant = async (messages: ChatRequestMessage[], pageContext?: ChatPageContext) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, pageContext, sessionId: getAssistantSessionId() }),
  });


  const text = await response.text();
  let data: ChatApiResponse = {};

  try {
    data = text ? (JSON.parse(text) as ChatApiResponse) : {};
  } catch {
    throw new Error(GENERIC_CHAT_ERROR);
  }

  if (!response.ok) {
    throw new Error(data.error || GENERIC_CHAT_ERROR);
  }

  if (!data.message) {
    throw new Error(data.error || GENERIC_CHAT_ERROR);
  }

  return data;
};

export type AssistantFeedbackRating = "up" | "down";

export const sendAssistantFeedback = async (feedback: {
  requestId: string;
  rating: AssistantFeedbackRating;
  reason?: string;
  route: string;
  intent?: string;
  model?: string;
  latencyMs?: number;
  sourceIds: string[];
  question: string;
  answer: string;
}) => {
  const response = await fetch("/api/chat-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...feedback, sessionId: getAssistantSessionId() }),
  });
  if (!response.ok) throw new Error("Feedback could not be recorded.");
};
