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
}

export interface ChatApiResponse {
  message?: string;
  error?: string;
  sources?: ChatSource[];
}

const GENERIC_CHAT_ERROR = "The AI assistant is temporarily unavailable. Please try again shortly.";

export const countUserMessages = (messages: ChatRequestMessage[]) =>
  messages.filter((message) => message.role === "user").length;

export const isChatLimitReached = (messages: ChatRequestMessage[]) =>
  countUserMessages(messages) >= MAX_CHAT_USER_MESSAGES;

export const askSiteAssistant = async (messages: ChatRequestMessage[], pageContext?: string) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, pageContext }),
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
