import { describe, expect, it } from "vitest";
import { getAssistantGuidance, getKnowledgeChunks, retrieveKnowledge } from "../../server/knowledge";

describe("assistant knowledge", () => {
  it("keeps private response guidance out of public retrieval", () => {
    expect(getAssistantGuidance()).toContain("Canonical Public Identity");
    expect(getKnowledgeChunks().some((chunk) => chunk.source.includes("isaac-ai-agent-training"))).toBe(false);
    expect(retrieveKnowledge("Summation").some((chunk) => chunk.source.includes("isaac-ai-agent-training"))).toBe(false);
  });
});
