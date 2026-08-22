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
      "Isaac Seiler is a recent WashU graduate, Fulbright and Truman Scholar, and member of OpenAI's ChatGPT Lab. He has managed communications for a Member of Congress, published work with OpenAI, built a congressional office, founded a consultancy, and conducted international research on the social and material impacts of AI and the Internet. He is currently in the market for tech roles starting Summer 2026.",
    url: "/#about",
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
    title: "Congressional Office Setup and 100 Day Report",
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
    id: "campaign-consultancy",
    title: "Communications Consultancy and Supporting Local Candidates",
    source: "Project",
    content:
      "A 2024 independent consultancy supporting local and federal candidates through campaign websites, digital strategy, and rapid-response communications. Isaac led digital and communications strategy for Allyson Damikolas for Tustin Unified School Board, including website strategy, social media messaging, content design, crisis communications, and campaign narrative positioning.",
    url: "/projects/communications-consultancy-supporting-local-candidates",
  },
  {
    id: "fulbright-chatgpt-lab",
    title: "Fulbright Taiwan Educator Lab with OpenAI Support",
    source: "Project",
    content:
      "A 2025 six-session educator lab with OpenAI/ChatGPT for Education support. Isaac founded and led the Fulbright Taiwan ChatGPT Lab, bringing Fulbright educators together to explore practical, responsible uses of ChatGPT in education. He facilitated six sessions, designed curriculum, and produced nine lightweight educator use cases summarized in a published ChatGPT for Education post.",
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
    id: "inn-index",
    title: "The 2022 Institute for Nonprofit News Index Survey",
    source: "Project",
    content:
      "A large-scale nonprofit news research project involving data collection, survey synthesis, and stakeholder outreach. Isaac contributed to qualitative and quantitative components, collected and cleaned data, synthesized survey responses, and contacted respondents.",
    url: "/projects/2022-institute-for-nonprofit-news-index-survey",
  },
  {
    id: "meijer-reporting",
    title: "Exclusive Interview with High-Visibility Congressperson",
    source: "Project",
    content:
      "Early political reporting for The Calvin Chimes on then-Congressman Peter Meijer after his vote to impeach President Trump. Isaac conducted direct interviews and covered intra-party backlash, policy positions, and the risks facing a first-term member of Congress.",
    url: "/projects/exclusive-interview-with-high-visibility-congressperson",
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
    id: "news-truman-forbes",
    title: "Featured 2024 Truman Scholars",
    source: "News",
    content:
      "A Forbes news item featuring the 2024 Truman Scholars, including Isaac. Useful for recruiter questions about national recognition, public service, and scholarship credentials.",
    url: "/#news",
  },
  {
    id: "news-openai-product-feedback",
    title: "Shared Early Product Feedback with OpenAI",
    source: "News",
    content:
      "A site news item about Isaac sharing early product feedback with OpenAI through the ChatGPT Lab context. Use careful public phrasing and avoid claiming private details.",
    url: "/#news",
  },
  {
    id: "news-rhodes-finalist",
    title: "Named 2024 Rhodes Scholarship Finalist",
    source: "News",
    content:
      "A Washington University news item about Isaac being named a 2024 Rhodes Scholarship finalist, relevant to academic distinction and public-interest work.",
    url: "/#news",
  },
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
    .filter((file) => /\.mdx?$/i.test(file))
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
  if (!queryTerms.length) return [  {
    id: "openai-product-testing",
    title: "OpenAI Product Testing and Feedback",
    source: "Project",
    content:
      "Early product testing and feedback across ChatGPT products as a member of OpenAI's ChatGPT Lab, including the 100 Chats Project, a testimonial featured in the ChatGPT Pulse launch, a Study Mode spotlight on ChatGPT's Instagram, and early browser product feedback. Keep wording careful and public.",
    url: "/projects/openai-product-testing-and-feedback",
  },
  {
    id: "blog-fulbright-award",
    title: "Won Fulbright Award to Taiwan",
    source: "Blog",
    content:
      "A blog post about Isaac earning a Fulbright award to Taiwan, relevant to education, cross-cultural work, and AI literacy programming. The post is not yet written.",
    url: "/projects/fulbright-award-to-taiwan",
  },
];

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
