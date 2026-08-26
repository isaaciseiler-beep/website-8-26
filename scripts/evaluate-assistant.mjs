import fs from "node:fs";

const endpoint = process.env.ASSISTANT_EVAL_URL?.trim();
if (!endpoint) {
  console.error("Set ASSISTANT_EVAL_URL to the full /api/chat endpoint before running the live evaluation.");
  process.exit(1);
}

const allCases = JSON.parse(fs.readFileSync(new URL("../evals/assistant-cases.json", import.meta.url), "utf8"));
const limit = Math.max(1, Number(process.env.ASSISTANT_EVAL_LIMIT || allCases.length));
const cases = allCases.slice(0, limit);
const results = [];

for (const evalCase of cases) {
  const startedAt = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: evalCase.question }],
        pageContext: evalCase.pageContext,
        sessionId: `eval-${evalCase.id}`,
      }),
    });
    const payload = await response.json();
    const sourceIds = Array.isArray(payload.sources) ? payload.sources.map((source) => source.id) : [];
    results.push({
      id: evalCase.id,
      ok: response.ok,
      intentHit: payload.intent === evalCase.intent,
      evidenceHit: evalCase.expectedEvidenceIds.some((id) => sourceIds.includes(id)),
      confidence: payload.confidence,
      mode: payload.mode,
      verified: payload.verified,
      latencyMs: Date.now() - startedAt,
      error: payload.error,
    });
  } catch (error) {
    results.push({
      id: evalCase.id,
      ok: false,
      intentHit: false,
      evidenceHit: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const rate = (key) => results.filter((result) => result[key]).length / results.length;
const summary = {
  endpoint,
  cases: results.length,
  successRate: rate("ok"),
  intentRate: rate("intentHit"),
  evidenceRate: rate("evidenceHit"),
  verifiedRate: rate("verified"),
  averageLatencyMs: Math.round(results.reduce((total, result) => total + result.latencyMs, 0) / results.length),
  failures: results.filter((result) => !result.ok || !result.intentHit || !result.evidenceHit),
};

console.log(JSON.stringify(summary, null, 2));
if (summary.successRate < 1 || summary.intentRate < 0.95 || summary.evidenceRate < 0.95) process.exit(1);
