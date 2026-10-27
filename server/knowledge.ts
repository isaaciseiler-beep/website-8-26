import fs from "node:fs";
import { PROFILE_SUMMARY, SITE_URL } from "../src/lib/site.js";
import path from "node:path";
import { hiddenProjectIds, projectItems, type ProjectItem } from "../src/lib/siteContent.js";
import type { NormalizedPageContext } from "./assistant.js";
import { pageContextToText } from "./assistant.js";

export interface EvidenceMetadata {
  kind: "profile" | "current-role" | "contact" | "project" | "page" | "document";
  year?: string;
  role?: string;
  skills?: string[];
  outcomes?: string[];
  metrics?: string[];
  tags?: string[];
  limitations?: string[];
}

export interface KnowledgeChunk {
  id: string;
  title: string;
  source: string;
  content: string;
  url?: string;
  metadata?: EvidenceMetadata;
}

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
  scoreBreakdown?: {
    lexical: number;
    semantic: number;
    page: number;
  };
}

interface HybridRetrievalOptions {
  apiKey?: string;
  limit?: number;
  pageContext?: NormalizedPageContext | null;
  fetchImpl?: typeof fetch;
}

const PROFILE_CHUNKS: KnowledgeChunk[] = [
  {
    id: "bio",
    title: "Isaac Seiler — Current Public Profile",
    source: "Canonical public profile",
    content:
      PROFILE_SUMMARY,
    url: "/about",
    metadata: {
      kind: "profile",
      role: "Tech generalist",
      skills: ["strategy", "communications", "research", "writing", "AI fluency", "visual communication"],
      tags: ["biography", "about", "current", "Seattle"],
      limitations: ["Do not infer job-search status or private biographical details."],
    },
  },
  {
    id: "current-role",
    title: "Current Role at Summation",
    source: "Current public role",
    content:
      "Isaac leads marketing and communications at Summation, a decision-grade AI company in the Seattle area. Summation connects to live business data and helps enterprise teams understand what changed, why it happened, and what to do next. The role combines AI, strategy, writing, communications, and translating complex technology.",
    url: "/about",
    metadata: {
      kind: "current-role",
      role: "Marketing and communications lead",
      skills: ["product marketing", "communications", "positioning", "AI", "enterprise technology", "translation"],
      tags: ["Summation", "current work", "marketing", "communications", "AI"],
    },
  },
  {
    id: "contact",
    title: "Public Contact Channels",
    source: "Approved public contact information",
    content:
      `Public contact routes: email isaaciseiler@gmail.com, LinkedIn https://www.linkedin.com/in/isaacseiler/, GitHub https://github.com/isaaciseiler-beep, Substack https://substack.com/@isaacseiler, and website ${SITE_URL}.`,
    url: "mailto:isaaciseiler@gmail.com",
    metadata: {
      kind: "contact",
      tags: ["contact", "email", "LinkedIn", "GitHub", "Substack"],
      limitations: ["Only provide these public channels; do not infer private contact details."],
    },
  },
];

const PROJECT_PROFILES: Record<
  string,
  Pick<EvidenceMetadata, "role" | "skills" | "outcomes" | "metrics" | "tags" | "limitations">
> = {
  "artificial-intelligence-in-state-government-index": {
    role: "Researcher and benchmark designer",
    skills: ["AI policy", "research design", "scoring methodology", "data analysis", "public-sector strategy", "writing"],
    outcomes: ["Built a 15-criteria preparedness benchmark", "Produced state-by-state rankings and a policy roadmap"],
    metrics: ["All U.S. states and territories", "15 scoring criteria", "Most jurisdictions scored below 50/100"],
    tags: ["AI", "government", "policy", "benchmark", "index", "states", "CSG", "research"],
    limitations: ["Published with the Council of State Governments; do not imply government adoption outcomes caused by the study."],
  },
  "congressional-office-setup-100-day-report": {
    role: "Communications director and office-launch contributor",
    skills: ["communications strategy", "press relations", "operations", "team building", "crisis communications", "reporting"],
    outcomes: ["Helped launch a new congressional office", "Built a local-to-national press network", "Led the 100 Day Report"],
    metrics: ["$4M+ returned by the full office", "550 constituent cases", "9,569 constituent responses", "300+ meetings and visits"],
    tags: ["Congress", "communications", "media", "press", "operations", "public service", "campaign"],
    limitations: ["Office-wide service metrics belong to the team; attribute Isaac's role to collecting, verifying, explaining, designing, and releasing them."],
  },
  "senior-thesis-local-journalism": {
    role: "Principal qualitative researcher",
    skills: ["qualitative research", "interviewing", "coding", "media policy", "analysis", "academic writing"],
    outcomes: ["Created and analyzed an original qualitative dataset on Australian local journalism"],
    metrics: ["17 in-depth interviews"],
    tags: ["journalism", "Australia", "AI", "platforms", "democracy", "thesis", "research"],
    limitations: ["Do not expose unpublished participant identities or interview material beyond the public thesis."],
  },
  "fulbright-focus-group-sponsored-by-openai": {
    role: "Program proposer, curriculum designer, and facilitator",
    skills: ["AI literacy", "education", "facilitation", "curriculum design", "cross-cultural communication", "product adoption"],
    outcomes: ["Built a six-session educator lab", "Published a field guide with OpenAI's education team", "Adapted the work into a conference workshop"],
    metrics: ["20 educators", "19 institutions", "6 counties", "12 grade levels", "250+ conference attendees"],
    tags: ["Fulbright", "Taiwan", "OpenAI", "ChatGPT", "education", "teachers", "AI literacy", "workshop"],
    limitations: ["Credit OpenAI for the broader ChatGPT Lab framework. Isaac pitched and led the local Taiwan program with OpenAI and ChatGPT for Education support; do not imply that he invented the Local Labs model."],
  },
  "boehringer-cares-foundation-rebrand-strategy-shift": {
    role: "Rebrand implementation and communications contributor",
    skills: ["brand implementation", "communications", "content strategy", "UX collaboration", "internal communications", "newsletter strategy"],
    outcomes: ["Carried an approved rebrand across web and internal communications", "Built an ongoing newsletter and volunteering communications system"],
    metrics: ["25+ assets", "80% newsletter open rate", "25% increase in annual employee volunteering"],
    tags: ["Boehringer", "rebrand", "brand", "website", "newsletter", "volunteering", "communications"],
    limitations: ["Isaac implemented the broader team's approved rebrand direction; do not claim he originated the vision."],
  },
  "openai-product-testing-and-feedback": {
    role: "ChatGPT Lab product tester and go-to-market feedback contributor",
    skills: ["product feedback", "user research", "go-to-market", "AI product judgment", "education", "campaign feedback"],
    outcomes: ["Contributed user feedback and public stories across multiple pre-launch ChatGPT products and campaigns"],
    metrics: ["First ChatGPT Lab cohort", "100 real student workflows collected across the Lab"],
    tags: ["OpenAI", "ChatGPT Lab", "product", "Study Mode", "Pulse", "Atlas", "Group Chats", "100 Chats"],
    limitations: ["Describe Isaac's role as a ChatGPT Lab participant and product-feedback contributor."],
  },
};

const DEFAULT_PROJECT_PROFILE: Pick<
  EvidenceMetadata,
  "role" | "skills" | "outcomes" | "metrics" | "tags" | "limitations"
> = {
  role: "Portfolio project contributor",
  skills: [],
  outcomes: [],
  metrics: [],
  tags: [],
  limitations: [],
};

const projectToChunk = (project: ProjectItem): KnowledgeChunk => {
  const profile = PROJECT_PROFILES[project.id] ?? DEFAULT_PROJECT_PROFILE;
  const sectionText = project.sections
    .map((section) =>
      [
        section.heading,
        ...(section.paragraphs ?? []),
        ...(section.bullets ?? []),
        ...(section.stats ?? []).map((stat) => `${stat.value} ${stat.label}`),
        section.pullQuote ?? "",
        ...(section.links ?? []).map((link) => `${link.label}: ${link.href}`),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return {
    id: project.id,
    title: project.title,
    source: `${project.source} case study (${project.year})`,
    content: [project.summary, project.lead ?? "", sectionText].filter(Boolean).join("\n\n"),
    url: `/projects/${project.id}`,
    metadata: {
      kind: "project",
      year: project.year,
      ...profile,
      tags: [...new Set([project.source, project.year, ...(profile.tags ?? [])])],
    },
  };
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "did", "do", "does", "for", "from", "has",
  "have", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was",
  "what", "when", "where", "which", "who", "why", "with", "would", "you",
]);

const CONCEPT_GROUPS = [
  ["current", "now", "today", "present"],
  ["hire", "hiring", "recruiter", "candidate", "role", "position", "fit", "strength"],
  ["marketing", "communications", "positioning", "messaging", "brand", "storytelling", "press", "media"],
  ["product", "feedback", "testing", "user", "customer", "ux", "launch", "go-to-market"],
  ["strategy", "judgment", "ambiguity", "decision", "planning", "advising"],
  ["ai", "artificial", "chatgpt", "openai", "genai", "technology", "llm"],
  ["government", "public", "policy", "congress", "state", "civic"],
  ["research", "analysis", "data", "methodology", "interview", "qualitative", "benchmark"],
  ["leadership", "led", "founded", "managed", "built", "facilitated", "directed"],
  ["execution", "shipped", "implemented", "delivered", "produced", "operations"],
  ["education", "educator", "teacher", "classroom", "curriculum", "learning", "workshop"],
  ["impact", "outcome", "result", "metric", "scale", "evidence", "proof", "demonstrate"],
  ["summary", "summarize", "overview", "recap", "takeaway", "page", "article", "project"],
  ["project", "projects", "work", "portfolio", "case", "cases", "study", "studies"],
];

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

const expandTerms = (terms: string[]) => {
  const expanded = new Set(terms);
  for (const group of CONCEPT_GROUPS) {
    if (group.some((term) => expanded.has(term))) group.forEach((term) => expanded.add(term));
  }
  return [...expanded];
};

const metadataText = (chunk: KnowledgeChunk) => {
  const metadata = chunk.metadata;
  if (!metadata) return "";
  return [
    metadata.role,
    ...(metadata.skills ?? []),
    ...(metadata.outcomes ?? []),
    ...(metadata.metrics ?? []),
    ...(metadata.tags ?? []),
    ...(metadata.limitations ?? []),
  ]
    .filter(Boolean)
    .join(" ");
};

const lexicalScores = (query: string, corpus: KnowledgeChunk[]) => {
  const queryTerms = expandTerms(tokenize(query));
  if (!queryTerms.length) return corpus.map(() => 0);

  const documents = corpus.map((chunk) => {
    const metadata = metadataText(chunk);
    const fields = [
      { tokens: tokenize(chunk.title), weight: 4 },
      { tokens: tokenize(metadata), weight: 2.4 },
      { tokens: tokenize(chunk.content), weight: 1 },
    ];
    return {
      fields,
      phraseText: `${chunk.title} ${metadata}`.toLowerCase(),
      terms: new Set(fields.flatMap((field) => field.tokens)),
    };
  });
  const documentFrequency = new Map(
    queryTerms.map((term) => [
      term,
      documents.reduce((count, document) => count + Number(document.terms.has(term)), 0),
    ]),
  );
  const phrase = query.toLowerCase().trim();

  return documents.map((document) => {
    const score = queryTerms.reduce((total, term) => {
      const frequency = documentFrequency.get(term) ?? 0;
      const inverseDocumentFrequency = Math.log(1 + (corpus.length + 1) / (frequency + 1));
      const fieldScore = document.fields.reduce((fieldTotal, field) => {
        const termFrequency = field.tokens.reduce((count, token) => count + Number(token === term), 0);
        return fieldTotal + (termFrequency ? (1 + Math.log(termFrequency)) * field.weight : 0);
      }, 0);
      return total + fieldScore * inverseDocumentFrequency;
    }, 0);
    const phraseBoost = phrase.length > 5 && document.phraseText.includes(phrase) ? 8 : 0;
    return score + phraseBoost;
  });
};

const KNOWLEDGE_DIR = "knowledge";
const ASSISTANT_GUIDANCE_FILE = "isaac-ai-agent-training.md";
const ASSISTANT_GUIDANCE_HEADINGS = new Set([
  "Canonical Public Identity", "Source and Freshness Rules", "Privacy and Safety Policy",
]);

const chunkMarkdown = (filePath: string, text: string): KnowledgeChunk[] => {
  const relativePath = path.relative(process.cwd(), filePath);
  const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(filePath).replace(/\.mdx?$/i, "");
  const sections = text.split(/\n(?=#{1,3}\s+)/g).map((section) => section.trim()).filter(Boolean);
  return (sections.length ? sections : [text]).map((section, index) => ({
    id: `${relativePath}:${index}`,
    title,
    source: relativePath,
    content: section.replace(/\s+/g, " ").trim(),
    metadata: { kind: "document", tags: [title, relativePath] },
  }));
};

const getKnowledgeDir = () => path.join(process.cwd(), KNOWLEDGE_DIR);

const readMarkdownKnowledge = () => {
  const knowledgeDir = getKnowledgeDir();
  if (!fs.existsSync(knowledgeDir)) return [];
  return fs.readdirSync(knowledgeDir)
    .filter((file) => /\.mdx?$/i.test(file) && !["readme.md", ASSISTANT_GUIDANCE_FILE].includes(file.toLowerCase()))
    .sort()
    .flatMap((file) => {
      const filePath = path.join(knowledgeDir, file);
      return chunkMarkdown(filePath, fs.readFileSync(filePath, "utf8"));
    });
};

const extractAssistantGuidance = (text: string) =>
  text.split(/\n(?=##\s+)/g).map((section) => section.trim()).filter((section) => {
    const heading = section.match(/^##\s+(.+)$/m)?.[1]?.trim();
    return heading ? ASSISTANT_GUIDANCE_HEADINGS.has(heading) : false;
  }).join("\n\n");

let cachedKnowledgeChunks: KnowledgeChunk[] | undefined;

export const getKnowledgeChunks = (): KnowledgeChunk[] => {
  cachedKnowledgeChunks ??= [
    ...PROFILE_CHUNKS,
    ...projectItems.filter((project) => !hiddenProjectIds.has(project.id)).map(projectToChunk),
    ...readMarkdownKnowledge(),
  ];
  return cachedKnowledgeChunks;
};

export const getAssistantGuidance = () => {
  const filePath = path.join(getKnowledgeDir(), ASSISTANT_GUIDANCE_FILE);
  return fs.existsSync(filePath) ? extractAssistantGuidance(fs.readFileSync(filePath, "utf8")) : "";
};

export const createPageKnowledgeChunk = (page: NormalizedPageContext): KnowledgeChunk => ({
  id: "current-page",
  title: page.title || "Current page",
  source: `Current ${page.pageType || "page"}`,
  content: pageContextToText(page),
  url: page.route || undefined,
  metadata: {
    kind: "page",
    tags: [page.pageType, ...page.headings, "current page"].filter(Boolean),
  },
});

export const retrieveKnowledge = (query: string, limit = 5): RetrievedChunk[] => {
  const chunks = getKnowledgeChunks();
  const scores = lexicalScores(query, chunks);
  return chunks
    .map((chunk, index) => ({ ...chunk, score: scores[index] }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

type EmbeddingResponse = {
  data?: Array<{ index: number; embedding: number[] }>;
  error?: { message?: string };
};

const cosineSimilarity = (left: number[], right: number[]) => {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  return leftMagnitude && rightMagnitude ? dot / Math.sqrt(leftMagnitude * rightMagnitude) : 0;
};

const getEmbeddingText = (chunk: KnowledgeChunk) =>
  [chunk.title, chunk.source, metadataText(chunk), chunk.content.slice(0, 5000)].filter(Boolean).join("\n");

const getEmbeddings = async (
  inputs: string[],
  apiKey: string,
  fetchImpl: typeof fetch,
) => {
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large";
  const dimensions = Number(process.env.OPENAI_EMBEDDING_DIMENSIONS || 1024);
  const response = await fetchImpl("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: inputs, dimensions }),
  });
  const payload = (await response.json()) as EmbeddingResponse;
  if (!response.ok || !payload.data?.length) throw new Error(payload.error?.message || "Embedding request failed");
  return payload.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
};

export const retrieveKnowledgeHybrid = async (
  query: string,
  options: HybridRetrievalOptions = {},
): Promise<RetrievedChunk[]> => {
  const limit = options.limit ?? 6;
  const pageChunk = options.pageContext ? createPageKnowledgeChunk(options.pageContext) : null;
  const chunks = [...getKnowledgeChunks(), ...(pageChunk ? [pageChunk] : [])];
  const lexical = lexicalScores(query, chunks);
  const lexicalMax = Math.max(...lexical, 1);
  let semantic = chunks.map(() => 0);

  if (options.apiKey) {
    try {
      const embeddings = await getEmbeddings(
        [query, ...chunks.map(getEmbeddingText)],
        options.apiKey,
        options.fetchImpl ?? fetch,
      );
      const queryEmbedding = embeddings[0];
      semantic = embeddings.slice(1).map((embedding) => Math.max(0, cosineSimilarity(queryEmbedding, embedding)));
    } catch (error) {
      console.warn(JSON.stringify({ event: "assistant.embedding_fallback", message: error instanceof Error ? error.message : String(error) }));
    }
  }

  return chunks
    .map((chunk, index) => {
      const lexicalNormalized = lexical[index] / lexicalMax;
      const pageScore = chunk.id === "current-page" ? 1 : 0;
      const hasSemantic = semantic.some((score) => score > 0);
      const score = hasSemantic
        ? semantic[index] * 0.56 + lexicalNormalized * 0.34 + pageScore * 0.1
        : lexicalNormalized * 0.82 + pageScore * 0.18;
      return {
        ...chunk,
        score,
        scoreBreakdown: { lexical: lexicalNormalized, semantic: semantic[index], page: pageScore },
      };
    })
    .filter((chunk) => chunk.score > 0.02 || chunk.id === "current-page")
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
};
