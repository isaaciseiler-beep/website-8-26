import { afterEach, describe, expect, it, vi } from "vitest";
import chatFeedbackHandler from "../../api/chat-feedback";
import type { ApiRequest, ApiResponse } from "../../api/http";

const callHandler = async (body: Record<string, unknown>) => {
  let responseBody = "";
  const response = {
    statusCode: 0,
    setHeader: vi.fn(),
    end: (value: string) => { responseBody = value; },
  } as unknown as ApiResponse;
  await chatFeedbackHandler({ method: "POST", body } as ApiRequest, response);
  return { status: response.statusCode, payload: JSON.parse(responseBody) };
};

describe("assistant feedback API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("accepts privacy-preserving feedback without requiring a database", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("ASSISTANT_STORE_CONTENT", "false");
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const result = await callHandler({
      requestId: "answer-123",
      rating: "down",
      reason: "too-vague",
      route: "/work",
      question: "A private test question",
      answer: "A private test answer",
      sourceIds: ["bio"],
    });

    expect(result).toEqual({ status: 200, payload: { accepted: true, storage: "logs" } });
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain("question_hash");
    expect(logged).not.toContain("A private test question");
    expect(logged).not.toContain("A private test answer");
  });

  it("rejects malformed ratings and reason categories", async () => {
    const result = await callHandler({ requestId: "answer-123", rating: "maybe", reason: "unknown" });
    expect(result.status).toBe(400);
    expect(result.payload.error).toBe("Valid feedback is required.");
  });
});
