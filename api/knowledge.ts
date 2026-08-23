import fs from "node:fs";
import path from "node:path";

export interface KnowledgeChunk {
  id: string;
  title: string;
  source: string;
  content: string;
  url?: string;
}

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

const SITE_CHUNKS: KnowledgeChunk[] = [
  {
    id: "bio",
    title: "Isaac Seiler Bio",
    source: "Website bio",
    content:
      "Isaac Seiler leads marketing and communications at Summation, helping tell the story of how AI is changing the way people work. He is based in Seattle, Washington.",
    url: "/about",
  },
  {
    id: "summation-ai",
    title: "Summation Marketing and Communications",
    source: "Current work",
    content:
      "Isaac leads marketing and communications at Summation, a decision-grade AI company in the Seattle area. Summation connects to live business data and helps enterprise teams understand what changed, why it happened, and what to do next. The role brings together Isaac's experience in AI, strategy, writing, communications, and translating complex technology.",
    url: "/about",
  },
  {
    id: "state-ai-index",
    title: "Artificial Intelligence in State Government Index",
    source: "Project",
    content:
      "A 2025 research project published with the Council of State Governments. Isaac built a public-information benchmark scoring all states and territories on generative AI adoption signals including employee guidance, training, sandboxes, pilots, governance structures, and transparency. The work included a 15-criteria GenAI Preparedness Score, composite scoring, state-by-state analysis, rankings, synopses, and a policy roadmap. Most states scored below 50/100 and only a small handful cleared 80.",
    url: "/projects/artificial-intelligence-in-state-government-index",
  },
  {
    id: "congressional-office-report",
    title: "Congressional Office Setup and 100-Day Report",
    source: "Project",
    content:
      "A 2025 work project capturing the systems, staffing, and benchmarks used to stand up a brand-new congressional office from zero. Isaac helped design internal systems, set priorities, define success, collect and verify office-wide metrics, summarize qualitative and quantitative wins, design the final report, and coordinate its release to media and stakeholders.",
    url: "/projects/congressional-office-setup-100-day-report",
  },
  {
    id: "journalism-thesis",
    title: "AI, Digital Platforms, and Journalism Research",
    source: "Project",
    content:
      "A 2025 qualitative honors thesis on the structural decline of local journalism in Australia and its implications for democratic accountability, labor, and media policy. Isaac conducted 17 in-depth interviews with journalists, editors, newsroom owners, and industry experts, then handled literature review, recruitment, transcription verification, qualitative coding, and thematic analysis.",
    url: "/projects/senior-thesis-local-journalism",
  },
  {
    id: "stl-philanthropy",
    title: "Raised $20k for Local St. Louis Organizations",
    source: "Project",
    content:
      "A 2025 student-led philanthropy project through WashU's Philanthropy Lab. Isaac's team focused on immigrant and refugee support, evaluated St. Louis nonprofits, and contributed to a broader grantmaking process that moved real dollars to local organizations including Casa de Salud.",
    url: "/projects/stl-immigrant-refugee-support-grant-process",
  },
  {
    id: "ev-analysis",
    title: "Electric Vehicle Charging Access Analysis",
    source: "Project",
    content:
      "A 2024 GIS and quantitative analysis project examining EV infrastructure access and charger gaps. Isaac worked with spatial datasets covering population, infrastructure, and policy variables, focusing on data cleaning, spatial joins, statistical interpretation, maps, charts, and written analysis. Findings included weak relationships between charger proximity and income or race in the studied geographies, with regional and urban-rural charger gaps.",
    url: "/projects/electric-vehicle-access-analysis",
  },
  {
    id: "fulbright-chatgpt-lab",
    title: "The ChatGPT Lab I Built in Taiwan",
    source: "Project",
    content:
      "A 2025 six-session educator lab with OpenAI education support. Isaac founded and led the Fulbright Taiwan ChatGPT Lab for 20 educators working across 19 institutions, six counties, and all 12 grade levels. He designed and facilitated the curriculum, helped participants test practical and responsible classroom workflows, wrote an OpenAI-published field guide, and turned the work into a workshop for an international education conference with more than 250 attendees.",
    url: "/projects/fulbright-focus-group-sponsored-by-openai",
  },
  {
    id: "boehringer-rebrand",
    title: "Boehringer Cares Foundation Rebrand and Strategy Shift",
    source: "Project",
    content:
      "A 2025 full rebrand and strategic redirect for Boehringer Cares. Isaac helped lead visual design and strategy, clarified the foundation's direction and narrative, contributed to a new website and identity, shipped more than 25 assets, built a newsletter system with an 80% open rate, and helped increase employee volunteering by 25% in 2025.",
    url: "/projects/boehringer-cares-foundation-rebrand-strategy-shift",
  },
  {
    id: "news-openai-educator-lab",
    title: "Conducted OpenAI-supported Education Focus Group",
    source: "News",
    content:
      "A ChatGPT for Education news item about Isaac's OpenAI-supported Fulbright Taiwan educator lab, focused on practical ChatGPT use cases for educators.",
    url: "/#news",
  },
  {
    id: "openai-product-testing",
    title: "Helping Shape ChatGPT Before Launch",
    source: "Project",
    content:
      "As a member of the first ChatGPT Lab cohort, Isaac tested products before launch and translated real student behavior into product and go-to-market feedback. His work includes the 100 Chats book, Study Mode testing and a ChatGPT Instagram feature, a distinct Back-to-School campaign, a testimonial in the ChatGPT Pulse launch, early ChatGPT Atlas browser feedback, and testing the collaboration model that became Group Chats. He also worked with Hillary Bush and other OpenAI leaders through the Lab.",
    url: "/projects/openai-product-testing-and-feedback",
  }
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "with",
  "you",
]);

const KNOWLEDGE_DIR = "knowledge";
const ASSISTANT_GUIDANCE_FILE = "isaac-ai-agent-training.md";
const ASSISTANT_GUIDANCE_HEADINGS = new Set([
  "Role in the AI System",
  "Canonical Public Identity",
  "Source and Freshness Rules",
  "Voice Model",
  "Search-Companion Behavior",
  "Privacy and Safety Policy",
  "Identity Throughlines",
  "Sample Website Agent Answers",
]);

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

const chunkMarkdown = (filePath: string, text: string): KnowledgeChunk[] => {
  const relativePath = path.relative(process.cwd(), filePath);
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const fallbackTitle = path.basename(filePath).replace(/\.mdx?$/i, "");
  const title = titleMatch?.[1]?.trim() || fallbackTitle;
  const sections = text
    .split(/\n(?=#{1,3}\s+)/g)
    .map((section) => section.trim())
    .filter(Boolean);

  return (sections.length ? sections : [text]).map((section, index) => ({
    id: `${relativePath}:${index}`,
    title,
    source: relativePath,
    content: section.replace(/\s+/g, " ").trim(),
  }));
};

const getKnowledgeDir = () => path.join(process.cwd(), KNOWLEDGE_DIR);

const readMarkdownKnowledge = () => {
  const knowledgeDir = getKnowledgeDir();
  if (!fs.existsSync(knowledgeDir)) return [];

  const files = fs
    .readdirSync(knowledgeDir)
    .filter((file) => /\.mdx?$/i.test(file) && file.toLowerCase() !== "readme.md")
    .sort()
    .map((file) => path.join(knowledgeDir, file));

  return files.flatMap((filePath) => chunkMarkdown(filePath, fs.readFileSync(filePath, "utf8")));
};

const extractAssistantGuidance = (text: string) =>
  text
    .split(/\n(?=##\s+)/g)
    .map((section) => section.trim())
    .filter((section) => {
      const heading = section.match(/^##\s+(.+)$/m)?.[1]?.trim();
      return heading ? ASSISTANT_GUIDANCE_HEADINGS.has(heading) : false;
    })
    .join("\n\n");

export const getKnowledgeChunks = (): KnowledgeChunk[] => [
  ...SITE_CHUNKS,
  ...readMarkdownKnowledge(),
];

export const getAssistantGuidance = () => {
  const filePath = path.join(getKnowledgeDir(), ASSISTANT_GUIDANCE_FILE);
  if (!fs.existsSync(filePath)) return "";

  return extractAssistantGuidance(fs.readFileSync(filePath, "utf8"));
};

export const retrieveKnowledge = (query: string, limit = 5): RetrievedChunk[] => {
  const queryTerms = tokenize(query);
  if (!queryTerms.length) return [];

  return getKnowledgeChunks()
    .map((chunk) => {
      const haystack = tokenize(`${chunk.title} ${chunk.source} ${chunk.content}`);
      const haystackSet = new Set(haystack);
      const score = queryTerms.reduce((total, term) => total + (haystackSet.has(term) ? 2 : 0), 0);
      const titleBoost = queryTerms.some((term) => chunk.title.toLowerCase().includes(term)) ? 3 : 0;
      return { ...chunk, score: score + titleBoost };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
