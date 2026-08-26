import { afterEach, describe, expect, it, vi } from "vitest";
import chatHandler from "../../api/chat";
import type { ApiRequest, ApiResponse } from "../../api/http";

describe("chat API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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

  it("passes current-page content to OpenAI for summaries and page-aware answers", async () => {
    vi.stubEnv("OPENAI_API", "sk-test-key");
    vi.stubEnv("OPENAI_ASSISTANT_VERIFY", "false");
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/embeddings")) {
        const input = JSON.parse(String(init?.body)).input as string[];
        return new Response(JSON.stringify({
          data: input.map((_, index) => ({ index, embedding: [1, index === 0 ? 1 : 0.5] })),
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        output_text: JSON.stringify({
          answer: "A concise page summary.",
          confidence: "high",
          evidence_ids: ["current-page"],
          suggested_questions: ["What did Isaac contribute?"],
        }),
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    let responseBody = "";
    const response = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: (body: string) => {
        responseBody = body;
      },
    } as unknown as ApiResponse;
    const request = {
      method: "POST",
      body: {
        messages: [{ role: "user", content: "Summarize this page" }],
        pageContext: "Page title: A custom story\nVisible page content: Community research findings.",
      },
    } as ApiRequest;

    await chatHandler(request, response);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(responseBody).message).toBe("A concise page summary.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const responseCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/responses"));
    const openAiRequest = responseCall?.[1] as RequestInit;
    const openAiBody = JSON.parse(String(openAiRequest.body));
    expect(openAiBody.instructions).toContain("Use only facts supported by the evidence below");
    expect(openAiBody.instructions).toContain("Sound like a thoughtful person");
    expect(openAiBody.instructions).toContain("Do not volunteer defensive caveats");
    expect(openAiBody.instructions).toContain("Community research findings");
    expect(openAiBody.input).toEqual([{ role: "user", content: "Summarize this page" }]);
  });

  it("uses the grounding verifier and returns its evidence-checked answer", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    vi.stubEnv("OPENAI_ASSISTANT_VERIFY", "true");
    let responseCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/embeddings")) {
        const input = JSON.parse(String(init?.body)).input as string[];
        return new Response(JSON.stringify({
          data: input.map((_, index) => ({ index, embedding: [1, index === 0 ? 1 : 0.6] })),
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      responseCalls += 1;
      const output = responseCalls === 1
        ? {
            answer: "Isaac leads marketing and communications at Summation.",
            confidence: "high",
            evidence_ids: ["bio"],
            suggested_questions: ["What work best demonstrates that?"],
          }
        : {
            approved: true,
            answer: "Isaac leads marketing and communications at Summation, with a portfolio focused on making complex technology clear.",
            confidence: "high",
            evidence_ids: ["bio"],
            suggested_questions: ["Which projects show that most clearly?"],
            issues: [],
          };
      return new Response(JSON.stringify({ output_text: JSON.stringify(output) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));

    let responseBody = "";
    const response = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: (body: string) => { responseBody = body; },
    } as unknown as ApiResponse;
    await chatHandler({
      method: "POST",
      body: { messages: [{ role: "user", content: "Who is Isaac?" }], sessionId: "test-session" },
    } as ApiRequest, response);

    const payload = JSON.parse(responseBody);
    expect(response.statusCode).toBe(200);
    expect(payload.verified).toBe(true);
    expect(payload.mode).toBe("reasoning");
    expect(payload.model).toBe("gpt-5.6-sol");
    expect(payload.message).toContain("making complex technology clear");
    expect(responseCalls).toBe(2);
  });

  it("returns a grounded site answer when the reasoning model is unavailable", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/embeddings")) {
        const input = JSON.parse(String(init?.body)).input as string[];
        return new Response(JSON.stringify({
          data: input.map((_, index) => ({ index, embedding: [1, index === 0 ? 1 : 0.5] })),
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: { message: "Model temporarily unavailable" } }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }));

    let responseBody = "";
    const response = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: (body: string) => { responseBody = body; },
    } as unknown as ApiResponse;
    await chatHandler({
      method: "POST",
      body: { messages: [{ role: "user", content: "What is Isaac working on now?" }] },
    } as ApiRequest, response);

    const payload = JSON.parse(responseBody);
    expect(response.statusCode).toBe(200);
    expect(payload.mode).toBe("fallback");
    expect(payload.model).toBe("retrieval-only");
    expect(payload.message).toContain("Summation");
  });

  it("keeps evidence-rich fallback answers specific and in third person", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    let responseBody = "";
    const response = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: (body: string) => { responseBody = body; },
    } as unknown as ApiResponse;
    await chatHandler({
      method: "POST",
      body: { messages: [{ role: "user", content: "What evidence shows Isaac can run AI education programs?" }] },
    } as ApiRequest, response);

    const payload = JSON.parse(responseBody);
    expect(response.statusCode).toBe(200);
    expect(payload.message).toContain("Leading AI Literacy Efforts in Taiwan");
    expect(payload.message).toContain("20 educators");
    expect(payload.message).not.toMatch(/\bI\b|\bmy\b/i);
    expect(payload.sources[0].id).toBe("fulbright-focus-group-sponsored-by-openai");
  });
});
