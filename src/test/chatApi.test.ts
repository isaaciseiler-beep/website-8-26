import { afterEach, describe, expect, it, vi } from "vitest";
import chatHandler from "../../api/chat";
import type { ApiRequest, ApiResponse } from "../../api/http";

describe("chat API fallback", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns one focused public result when an OpenAI key is unavailable", async () => {
    vi.stubEnv("OPENAI_API", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    let responseBody = "";
    const headers = new Map<string, string>();
    const response = {
      statusCode: 0,
      setHeader: (name: string, value: string) => headers.set(name, value),
      end: (body: string) => {
        responseBody = body;
      },
    } as unknown as ApiResponse;
    const request = {
      method: "POST",
      body: { messages: [{ role: "user", content: "What is Isaac working on now?" }] },
    } as ApiRequest;

    await chatHandler(request, response);

    const payload = JSON.parse(responseBody) as { message: string; sources: unknown[] };
    expect(response.statusCode).toBe(200);
    expect(headers.get("Cache-Control")).toBe("no-store");
    expect(payload.sources).toHaveLength(1);
    expect(payload.message).toContain("Summation");
    expect(payload.message).not.toContain("ChatGPT Lab");
  });
});
