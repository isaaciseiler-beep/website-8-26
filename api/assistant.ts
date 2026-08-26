export const ASSISTANT_INTENTS = [
  "page_summary",
  "recruiter_fit",
  "evidence",
  "comparison",
  "project_detail",
  "biography",
  "contact",
  "availability",
  "navigation",
  "general",
] as const;

export type AssistantIntent = (typeof ASSISTANT_INTENTS)[number];
export type AssistantConfidence = "high" | "medium" | "low";

export interface NormalizedPageContext {
  route: string;
  pageType: string;
  title: string;
  summary: string;
  headings: string[];
  facts: string[];
  visibleText: string;
  links: Array<{ label: string; href: string }>;
}

export interface AssistantDraft {
  answer: string;
  confidence: AssistantConfidence;
  evidence_ids: string[];
  suggested_questions: string[];
}

export interface VerifiedAssistantDraft extends AssistantDraft {
  approved: boolean;
  issues: string[];
}

const cleanText = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";

const cleanList = (value: unknown, limit: number, itemLength: number) =>
  Array.isArray(value)
    ? value.map((item) => cleanText(item, itemLength)).filter(Boolean).slice(0, limit)
    : [];

const isSafePageHref = (href: string) =>
  href.startsWith("/") || href.startsWith("#") || href.startsWith("https://") || href.startsWith("mailto:");

export const normalizePageContext = (value: unknown): NormalizedPageContext | null => {
  if (typeof value === "string") {
    const visibleText = cleanText(value, 9000);
    return visibleText
      ? {
          route: "",
          pageType: "page",
          title: "Current page",
          summary: "",
          headings: [],
          facts: [],
          visibleText,
          links: [],
        }
      : null;
  }

  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<NormalizedPageContext>;
  const route = cleanText(candidate.route, 240);
  const title = cleanText(candidate.title, 240);
  const visibleText = cleanText(candidate.visibleText, 9000);
  const links = Array.isArray(candidate.links)
    ? candidate.links
        .map((link) => ({
          label: cleanText(link?.label, 160),
          href: cleanText(link?.href, 500),
        }))
        .filter((link) => link.label && isSafePageHref(link.href))
        .slice(0, 20)
    : [];

  if (!route && !title && !visibleText) return null;
  return {
    route,
    pageType: cleanText(candidate.pageType, 80) || "page",
    title: title || "Current page",
    summary: cleanText(candidate.summary, 1200),
    headings: cleanList(candidate.headings, 24, 180),
    facts: cleanList(candidate.facts, 30, 500),
    visibleText,
    links,
  };
};

export const pageContextToText = (page: NormalizedPageContext | null) => {
  if (!page) return "";
  return [
    page.route ? `Route: ${page.route}` : "",
    `Page type: ${page.pageType}`,
    `Title: ${page.title}`,
    page.summary ? `Summary: ${page.summary}` : "",
    page.headings.length ? `Headings: ${page.headings.join(" | ")}` : "",
    page.facts.length ? `Structured facts:\n- ${page.facts.join("\n- ")}` : "",
    page.visibleText ? `Rendered page text:\n${page.visibleText}` : "",
    page.links.length
      ? `Page links:\n${page.links.map((link) => `- ${link.label}: ${link.href}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 12000);
};

export const classifyAssistantIntent = (
  question: string,
  page: NormalizedPageContext | null = null,
): AssistantIntent => {
  const normalized = question.toLowerCase();
  const refersToPage = /\b(this|it|here|current)\b/.test(normalized) || Boolean(page?.route);

  if (
    /\b(contact|email|linkedin|github|substack|message)\b/.test(normalized)
    || /\breach(?: out)?(?: to)?\s+(?:isaac|him)\b/.test(normalized)
  ) return "contact";
  if (/\b(available|availability|open to|looking for|hire now|start date)\b/.test(normalized)) return "availability";
  if (
    /\b(link|navigate|work page|portfolio)\b/.test(normalized)
    || /\bwhere\s+(?:can|could|do|should)\b/.test(normalized)
    || /\b(?:find|see|show)\s+(?:me\s+)?(?:isaac(?:'s)?|his|the)\s+(?:work|projects?|case studies)\b/.test(normalized)
    || /\bshow me\b.*\b(?:work|projects?|case studies)\b/.test(normalized)
  ) return "navigation";
  if (/\b(compare|contrast|difference|versus|vs\.?|in common)\b/.test(normalized)) return "comparison";
  if (/\b(summarize|summary|tl;?dr|overview|recap|in a nutshell|key takeaways)\b/.test(normalized) && refersToPage) {
    return "page_summary";
  }
  if (/\b(hire|hiring|recruiter|role|position|fit|candidate|job|team|suited|strengths?)\b/.test(normalized)) {
    return "recruiter_fit";
  }
  if (/\b(proof|prove|evidence|examples?|metrics?|results?|impact|outcomes?|outputs?|demonstrate)\b/.test(normalized)) {
    return "evidence";
  }
  if (/\b(who is|about isaac|background|bio|biography|what does isaac do|current work)\b/.test(normalized)) {
    return "biography";
  }
  if (/\b(project|article|research|report|campaign|lab|thesis|index|rebrand|congress|congressional|openai|chatgpt|fulbright|taiwan|boehringer|journalism|summation|product feedback|go-to-market)\b/.test(normalized) || refersToPage) {
    return "project_detail";
  }
  return "general";
};

export const getIntentGuidance = (intent: AssistantIntent) => {
  const guidance: Record<AssistantIntent, string> = {
    page_summary:
      "Summarize the current page faithfully. Lead with its central point, then identify Isaac's role, the work performed, and the most important result or takeaway.",
    recruiter_fit:
      "Make a measured hiring assessment. Name the strongest role-relevant signals, support each with concrete project evidence, and avoid generic praise or unsupported fit claims.",
    evidence:
      "Prioritize verifiable examples, metrics, artifacts, and clearly attributed outcomes. Distinguish Isaac's contribution from team or organizational results.",
    comparison:
      "Compare the requested work on the same dimensions: objective, Isaac's role, methods, scale, outcome, and transferable signal. Be explicit about meaningful differences.",
    project_detail:
      "Answer from the matching project and current-page evidence. Explain what Isaac personally did, why it mattered, and what was produced or learned.",
    biography:
      "Use the canonical current identity first, then add only background that directly answers the question. Do not turn the answer into a credential list.",
    contact:
      "Give only approved public contact routes. Keep the answer practical and brief.",
    availability:
      "State only what the evidence explicitly supports about availability. If it is not documented, say so and offer the public contact route.",
    navigation:
      "Point to the smallest number of current, relevant site routes or source links and briefly say what each contains.",
    general:
      "Answer directly using the strongest available evidence. If the request is materially ambiguous, ask one concise clarifying question.",
  };
  return guidance[intent];
};

export const ASSISTANT_ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string", minLength: 1, maxLength: 1800 },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    evidence_ids: {
      type: "array",
      items: { type: "string" },
      maxItems: 6,
    },
    suggested_questions: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 120 },
      maxItems: 2,
    },
  },
  required: ["answer", "confidence", "evidence_ids", "suggested_questions"],
} as const;

export const ASSISTANT_VERIFIER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    approved: { type: "boolean" },
    answer: { type: "string", minLength: 1, maxLength: 1800 },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    evidence_ids: {
      type: "array",
      items: { type: "string" },
      maxItems: 6,
    },
    suggested_questions: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 120 },
      maxItems: 2,
    },
    issues: {
      type: "array",
      items: { type: "string", maxLength: 160 },
      maxItems: 5,
    },
  },
  required: ["approved", "answer", "confidence", "evidence_ids", "suggested_questions", "issues"],
} as const;

const isConfidence = (value: unknown): value is AssistantConfidence =>
  value === "high" || value === "medium" || value === "low";

export const normalizeAssistantDraft = (
  value: unknown,
  validEvidenceIds: Set<string>,
): AssistantDraft | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AssistantDraft>;
  const answer = cleanText(candidate.answer, 1800);
  if (!answer) return null;
  const evidenceIds = Array.isArray(candidate.evidence_ids)
    ? [...new Set(candidate.evidence_ids.filter((id): id is string => typeof id === "string" && validEvidenceIds.has(id)))].slice(0, 6)
    : [];
  const confidence = isConfidence(candidate.confidence) ? candidate.confidence : evidenceIds.length ? "medium" : "low";

  return {
    answer,
    confidence: confidence === "high" && !evidenceIds.length ? "low" : confidence,
    evidence_ids: evidenceIds,
    suggested_questions: cleanList(candidate.suggested_questions, 2, 120),
  };
};

export const normalizeVerifiedDraft = (
  value: unknown,
  validEvidenceIds: Set<string>,
): VerifiedAssistantDraft | null => {
  const draft = normalizeAssistantDraft(value, validEvidenceIds);
  if (!draft || !value || typeof value !== "object") return null;
  const candidate = value as Partial<VerifiedAssistantDraft>;
  return {
    ...draft,
    approved: candidate.approved === true,
    issues: cleanList(candidate.issues, 5, 160),
  };
};
