import { readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "../server/http.js";
import { retrieveKnowledge } from "../server/knowledge.js";

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = (await readJsonBody(request)) as { query?: unknown };
    const query = String(body.query || "").trim();
    if (!query) {
      sendJson(response, 400, { error: "A search query is required." });
      return;
    }

    const results = retrieveKnowledge(query, 4);
    const message = results.length
      ? results.map((result) => `${result.title}: ${result.content}`).join("\n\n")
      : "No matching knowledge found yet.";

    sendJson(response, 200, {
      message,
      results: results.map(({ id, title, source, url }) => ({ id, title, source, url })),
    });
  } catch (error) {
    console.error("Search request failed", error);
    sendJson(response, 500, {
      error: "Search is temporarily unavailable.",
    });
  }
}
