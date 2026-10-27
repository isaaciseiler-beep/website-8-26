import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "../server/http.js";

const TABLE = "assistant_feedback";
const RATINGS = new Set(["up", "down"]);
const REASONS = new Set(["incorrect", "too-vague", "missed-question", "bad-link", "too-long", "other"]);
let supabaseClient: SupabaseClient | null = null;

const env = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "undefined" ? trimmed : undefined;
};

const text = (value: unknown, limit: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : "";

const getSupabase = () => {
  const url = env(process.env.SUPABASE_URL) ?? env(process.env.VITE_SUPABASE_URL);
  const serviceKey = env(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceKey) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return supabaseClient;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const requestId = text(body.requestId, 80);
    const rating = text(body.rating, 12);
    const reason = text(body.reason, 40);
    if (!requestId || !RATINGS.has(rating) || (reason && !REASONS.has(reason))) {
      sendJson(response, 400, { error: "Valid feedback is required." });
      return;
    }

    const question = text(body.question, 1800);
    const answer = text(body.answer, 2200);
    const sourceIds = Array.isArray(body.sourceIds)
      ? body.sourceIds.filter((id): id is string => typeof id === "string").map((id) => id.slice(0, 160)).slice(0, 8)
      : [];
    const record = {
      request_id: requestId,
      session_hash: createHash("sha256").update(text(body.sessionId, 80) || "anonymous").digest("hex").slice(0, 32),
      rating,
      reason: reason || null,
      route: text(body.route, 300) || null,
      intent: text(body.intent, 80) || null,
      model: text(body.model, 100) || null,
      latency_ms: Number.isFinite(Number(body.latencyMs)) ? Math.max(0, Math.min(Number(body.latencyMs), 300000)) : null,
      source_ids: sourceIds,
      question_hash: createHash("sha256").update(question).digest("hex").slice(0, 32),
      question: process.env.ASSISTANT_STORE_CONTENT === "true" ? question : null,
      answer: process.env.ASSISTANT_STORE_CONTENT === "true" ? answer : null,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from(TABLE).insert(record);
      if (error) throw new Error(error.message);
    }
    console.info(JSON.stringify({ event: "assistant.feedback", storage: supabase ? "supabase" : "logs", ...record, question: undefined, answer: undefined }));
    sendJson(response, 200, { accepted: true, storage: supabase ? "supabase" : "logs" });
  } catch (error) {
    console.error(JSON.stringify({ event: "assistant.feedback_error", message: error instanceof Error ? error.message : String(error) }));
    sendJson(response, 500, { error: "Feedback could not be recorded." });
  }
}
