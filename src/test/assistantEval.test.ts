import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classifyAssistantIntent, normalizePageContext, type AssistantIntent } from "../../server/assistant";
import { retrieveKnowledgeHybrid } from "../../server/knowledge";

interface EvalCase {
  id: string;
  question: string;
  intent: AssistantIntent;
  expectedEvidenceIds: string[];
  pageContext?: unknown;
}

const cases = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "evals/assistant-cases.json"), "utf8"),
) as EvalCase[];

describe("assistant offline quality gates", () => {
  it("keeps intent routing and evidence retrieval above the release threshold", async () => {
    const failures: string[] = [];
    let intentHits = 0;
    let evidenceHits = 0;

    for (const evalCase of cases) {
      const pageContext = normalizePageContext(evalCase.pageContext);
      const actualIntent = classifyAssistantIntent(evalCase.question, pageContext);
      if (actualIntent === evalCase.intent) intentHits += 1;
      else failures.push(`${evalCase.id}: intent ${actualIntent}, expected ${evalCase.intent}`);

      const query = [evalCase.question, pageContext?.title ?? "", actualIntent].filter(Boolean).join("\n");
      const retrieved = await retrieveKnowledgeHybrid(query, { limit: 7, pageContext });
      const retrievedIds = retrieved.map((chunk) => chunk.id);
      if (evalCase.expectedEvidenceIds.some((id) => retrievedIds.includes(id))) evidenceHits += 1;
      else failures.push(`${evalCase.id}: retrieved ${retrievedIds.join(", ")}`);
    }

    const intentRate = intentHits / cases.length;
    const evidenceRate = evidenceHits / cases.length;
    expect(cases.length).toBeGreaterThanOrEqual(60);
    expect(intentRate, failures.join("\n")).toBeGreaterThanOrEqual(0.95);
    expect(evidenceRate, failures.join("\n")).toBeGreaterThanOrEqual(0.98);
  });
});
