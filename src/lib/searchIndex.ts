import { inspirationItems } from "@/lib/inspirationItems";
import { albums, coverFor } from "@/lib/photoAlbums";
import { hiddenProjectIds, newsItems, projectItems } from "@/lib/siteContent";

export type SearchCategory = "projects" | "news" | "photos" | "inspiration";

export interface SearchDocument {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  external?: boolean;
  image?: string;
  date?: string;
  topics: string[];
  tags: string[];
  keywords: string[];
}

export interface SearchResult extends SearchDocument {
  score: number;
  reason: string;
}

export interface SearchGroup {
  category: SearchCategory;
  label: string;
  results: SearchResult[];
}

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  projects: "Work",
  news: "News",
  photos: "Photos",
  inspiration: "Inspiration",
};

export const SEARCH_CATEGORY_ORDER: SearchCategory[] = ["projects", "news", "photos", "inspiration"];

const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "done",
  "for",
  "from",
  "has",
  "have",
  "how",
  "i",
  "in",
  "into",
  "is",
  "isaac",
  "it",
  "like",
  "look",
  "looking",
  "me",
  "my",
  "near",
  "of",
  "on",
  "or",
  "please",
  "seiler",
  "show",
  "tell",
  "the",
  "this",
  "to",
  "you",
  "your",
  "was",
  "what",
  "where",
  "which",
  "who",
  "with",
  "work",
  "worked",
  "works",
  "would",
]);

const SEMANTIC_EXPANSIONS: Record<string, string[]> = {
  ai: ["artificial intelligence", "genai", "generative", "chatgpt", "openai", "automation", "model"],
  artificial: ["ai", "genai", "chatgpt", "openai"],
  atlas: ["browser", "chatgpt", "openai", "early testing"],
  award: ["scholarship", "truman", "rhodes", "fulbright", "honor", "recognition"],
  browser: ["atlas", "openai", "chatgpt"],
  campaign: ["candidate", "election", "politics", "communications", "digital strategy"],
  car: ["volvo", "wagon", "automotive"],
  classroom: ["education", "teaching", "learning", "study", "students"],
  climate: ["sustainability", "environment", "ev", "electric vehicle"],
  college: ["university", "campus", "student", "washu"],
  communication: ["communications", "media", "strategy", "campaign", "brand", "public affairs"],
  communications: ["communication", "media", "strategy", "campaign", "brand", "public affairs"],
  congress: ["capitol hill", "office", "government", "politics", "representative"],
  design: ["brand", "rebrand", "website", "visual", "ux"],
  education: ["teaching", "students", "classroom", "study", "learning", "fulbright", "chatgpt lab"],
  electric: ["ev", "charging", "charger", "vehicle", "infrastructure"],
  ev: ["electric vehicle", "charging", "charger", "infrastructure", "transportation"],
  fulbright: ["taiwan", "education", "teaching", "scholarship", "award", "chatgpt lab"],
  government: ["state", "public sector", "policy", "congress", "capitol hill", "lawmakers"],
  govt: ["government", "state", "public sector", "policy", "lawmakers"],
  health: ["access", "sustainable development", "boehringer", "pharmaceutical"],
  image: ["photo", "photos", "photography", "album", "picture"],
  images: ["photo", "photos", "photography", "album", "picture"],
  interview: ["journalism", "reporting", "news", "congress", "politics"],
  journalism: ["news", "media", "local news", "reporting", "newsroom", "newspaper"],
  lab: ["openai", "chatgpt", "education", "focus group"],
  learning: ["education", "study", "classroom", "students", "teaching"],
  local: ["community", "regional", "journalism", "campaign", "candidate"],
  map: ["photos", "travel", "album", "location", "gis"],
  media: ["journalism", "news", "reporting", "newspaper", "communications"],
  nonprofit: ["inn", "news", "journalism", "survey", "research"],
  photo: ["photos", "album", "photography", "camera", "travel"],
  photos: ["photo", "album", "photography", "camera", "travel"],
  pics: ["photo", "photos", "photography", "album", "travel"],
  picture: ["photo", "photos", "photography", "album"],
  pictures: ["photo", "photos", "photography", "album"],
  politics: ["campaign", "congress", "public service", "government", "policy"],
  pulse: ["openai", "chatgpt", "proactive", "personalized updates"],
  reporting: ["journalism", "news", "media", "newspaper", "interview"],
  research: ["study", "analysis", "survey", "index", "thesis", "qualitative"],
  scholar: ["scholarship", "truman", "rhodes", "fulbright", "award"],
  scholarship: ["truman", "rhodes", "fulbright", "award", "public service"],
  study: ["education", "learning", "students", "classroom", "chatgpt"],
  thesis: ["research", "journalism", "qualitative", "analysis", "washu"],
  travel: ["photos", "album", "asia", "europe", "oceania", "place"],
  truman: ["scholarship", "public service", "washu", "award"],
  website: ["portfolio", "design", "brand", "web"],
};

const CATEGORY_INTENTS: Record<SearchCategory, string[]> = {
  projects: ["project", "projects", "case study", "case studies", "built", "building", "made", "portfolio work"],
  news: ["news", "article", "articles", "press", "featured", "coverage", "headline", "announcement"],
  photos: ["photo", "photos", "picture", "pictures", "pics", "image", "images", "album", "albums", "map", "travel"],
  inspiration: ["inspiration", "inspo", "influences", "references", "things", "moodboard", "taste"],
};

const projectMetadata: Record<string, { date: string; topics: string[]; tags: string[] }> = {
  "artificial-intelligence-in-state-government-index": {
    date: "2025",
    topics: ["artificial intelligence", "state government", "public policy", "benchmarking", "transparency"],
    tags: ["genai", "ai governance", "lawmakers", "training", "sandboxes", "pilots", "Council of State Governments"],
  },
  "congressional-office-setup-100-day-report": {
    date: "2023",
    topics: ["congress", "press strategy", "media relations", "public service", "office launch"],
    tags: ["capitol hill", "press network", "earned media", "child labor", "100-day report", "State of the Union"],
  },
  "senior-thesis-local-journalism": {
    date: "2025",
    topics: ["artificial intelligence", "journalism", "local news", "digital platforms", "democracy", "media policy"],
    tags: ["AI platforms", "Australia", "newsrooms", "platform dominance", "qualitative interviews", "labor precarity", "thesis"],
  },
  "stl-immigrant-refugee-support-grant-process": {
    date: "2025",
    topics: ["philanthropy", "St. Louis", "public service", "grantmaking", "nonprofits"],
    tags: ["Philanthropy Lab", "WashU", "Casa de Salud", "IHELP", "Monarch Immigrant Services", "immigrant support"],
  },
  "communications-consultancy-supporting-local-candidates": {
    date: "2024",
    topics: ["campaign communications", "local elections", "digital strategy", "candidate websites"],
    tags: ["Allyson Damikolas", "Tustin", "school board", "social media", "rapid response", "crisis communications"],
  },
  "fulbright-focus-group-sponsored-by-openai": {
    date: "2025",
    topics: ["AI education", "OpenAI", "Fulbright", "Taiwan", "teacher training", "AI literacy"],
    tags: ["Local ChatGPT Lab", "one of the first Local Labs", "OpenAI for Education", "ChatGPT for Education", "20 educators", "19 institutions", "six counties", "classroom use cases", "published recap", "LLM fundamentals", "conference workshop"],
  },
  "openai-product-testing-and-feedback": {
    date: "2025-present",
    topics: ["OpenAI", "ChatGPT Lab", "product testing", "go-to-market", "student experience"],
    tags: ["100 Chats", "Study Mode", "Back to School", "ChatGPT Pulse", "ChatGPT Atlas", "Group Chats", "Hillary Bush", "early product feedback", "launch campaigns", "Instagram"],
  },
  "boehringer-cares-foundation-rebrand-strategy-shift": {
    date: "2025",
    topics: ["rebrand implementation", "website rollout", "internal communications", "employee engagement"],
    tags: ["Boehringer Cares", "rebrand", "visual identity", "cross-functional coordination", "newsletter", "volunteering", "open rate"],
  },
  "2022-institute-for-nonprofit-news-index-survey": {
    date: "2022",
    topics: ["nonprofit journalism", "survey research", "media economics", "data collection"],
    tags: ["INN Index", "Institute for Nonprofit News", "stakeholder outreach", "survey synthesis", "database"],
  },
  "exclusive-interview-with-high-visibility-congressperson": {
    date: "2021",
    topics: ["political reporting", "congress", "interview", "post-impeachment politics"],
    tags: ["Peter Meijer", "Calvin Chimes", "filibuster", "immigration", "primary challenge", "impeachment"],
  },
};

const newsMetadata: Record<number, { date?: string; topics: string[]; tags: string[] }> = {
  1: { topics: ["AI education", "Fulbright", "Taiwan"], tags: ["teacher training", "AI literacy", "classroom use cases"] },
  2: { topics: ["Truman Scholarship", "public service", "Forbes"], tags: ["scholarship", "recognition", "public leadership"] },
  6: { topics: ["Rhodes Scholarship", "WashU", "recognition"], tags: ["finalist", "scholarship", "Washington University"] },
};

const albumMetadata: Record<string, string[]> = {
  Australia: ["australia", "oceania", "travel", "coast", "southern hemisphere", "landscape"],
  GranCanaria: ["canary islands", "gran canaria", "spain", "europe", "island", "volcanic", "atlantic"],
  HongKong: ["hong kong", "asia", "kowloon", "city", "urban", "maps", "harbor", "transit"],
  Iceland: ["iceland", "europe", "nordic", "glacier", "waterfall", "landscape", "road trip"],
  Indonesia: ["indonesia", "asia", "island", "southeast asia", "travel", "tropical"],
  Japan: ["japan", "asia", "tokyo", "city", "rail", "street photography", "travel"],
  Korea: ["korea", "asia", "seoul", "city", "street photography", "travel"],
  NewZealand: ["new zealand", "nz", "oceania", "mountains", "landscape", "road trip", "south island"],
  Portugal: ["portugal", "europe", "lisbon", "coast", "architecture", "atlantic"],
  Taiwan: ["taiwan", "asia", "taipei", "new taipei", "fulbright", "street photography", "travel"],
  TaiwanStrait: ["matsu", "taiwan strait", "taiwan", "islands", "coast", "military history"],
  Thailand: ["thailand", "asia", "bangkok", "southeast asia", "travel", "street"],
  Vietnam: ["vietnam", "asia", "southeast asia", "travel", "street photography"],
};

const inspirationMetadata: Record<number, string[]> = {
  1: ["portfolio", "personal website", "web design", "minimal", "creative direction"],
  2: ["music", "spotify", "artist", "soul", "r&b"],
  3: ["hong kong", "map", "place", "city", "history", "travel"],
  4: ["podcast", "internet", "culture", "search", "questions"],
  5: ["photography", "kowloon walled city", "greg girard", "video", "hong kong"],
  6: ["book", "beijing", "china", "gig economy", "labor", "memoir"],
  7: ["book", "fiction", "ottessa moshfegh", "novel", "literature"],
  9: ["openai", "merch", "store", "website", "brand", "supply co"],
  10: ["music", "album", "lyrics", "r&b", "isaia huron"],
  11: ["video", "travel", "film", "jack fitz", "vimeo"],
  12: ["volvo", "car", "wagon", "1989", "design", "automotive"],
  14: ["ricoh", "camera", "photography", "GRIIIx", "gear", "compact camera"],
  15: ["m22", "microadventures", "michigan", "outdoors", "travel"],
  16: ["michigan", "mi", "photo", "place", "midwest", "travel"],
  17: ["new zealand", "nz", "photo", "place", "travel", "oceania"],
};

const flattenProjectText = (project: (typeof projectItems)[number]) =>
  project.sections
    .flatMap((section) => [section.heading, ...(section.paragraphs ?? []), ...(section.bullets ?? []), ...(section.links?.map((link) => link.label) ?? [])])
    .join(" ");

export const searchDocuments: SearchDocument[] = [
  ...projectItems.filter((project) => !hiddenProjectIds.has(project.id)).map((project) => {
    const meta = projectMetadata[project.id];
    return {
      id: project.id,
      category: "projects" as const,
      title: project.title,
      subtitle: `${project.source} / ${project.year}`,
      description: project.summary,
      href: `/projects/${project.id}`,
      image: project.image,
      date: meta?.date ?? project.year,
      topics: meta?.topics ?? [project.source.toLowerCase()],
      tags: meta?.tags ?? [],
      keywords: [project.source, project.year, flattenProjectText(project)],
    };
  }),
  ...newsItems.map((item) => {
    const meta = newsMetadata[item.id];
    return {
      id: `news-${item.id}`,
      category: "news" as const,
      title: item.title,
      subtitle: item.source,
      description: `${item.source}${meta?.date ? ` / ${formatDate(meta.date)}` : ""}`,
      href: item.href,
      external: item.href.startsWith("http"),
      image: item.imageUrl,
      date: meta?.date,
      topics: meta?.topics ?? [item.source],
      tags: meta?.tags ?? [],
      keywords: [item.source, item.logoAlt],
    };
  }),
  ...albums.map((album) => ({
    id: `album-${album.folder}`,
    category: "photos" as const,
    title: album.location,
    subtitle: `${album.continent} / ${album.photos.length} photos`,
    description: `Photo album from ${album.location}.`,
    href: `/photos?album=${encodeURIComponent(album.folder)}`,
    image: coverFor(album),
    topics: ["photography", "travel", "photo album", album.continent],
    tags: albumMetadata[album.folder] ?? [album.location, album.continent],
    keywords: [album.folder, album.location, album.photos.join(" ")],
  })),
  ...inspirationItems.map((item) => ({
    id: `inspiration-${item.id}`,
    category: "inspiration" as const,
    title: item.title,
    subtitle: item.type,
    description: item.content || `${item.type[0].toUpperCase()}${item.type.slice(1)} inspiration item.`,
    href: item.url ?? "/#inspiration",
    external: Boolean(item.url),
    image: item.imageUrl,
    topics: ["inspiration", item.type],
    tags: inspirationMetadata[item.id] ?? [],
    keywords: [item.content, item.url ?? ""],
  })),
];

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stem = (word: string) => {
  if (word.length <= 4) return word;
  return word
    .replace(/(ization|ational|fulness|iveness|ements)$/g, "")
    .replace(/(ing|ers|ies|ied|ed|ly|es|s)$/g, "");
};

const tokenize = (value: string) =>
  normalize(value)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
    .map(stem);

const uniq = <T,>(values: T[]) => [...new Set(values)];

const expandTerm = (term: string) => {
  const direct = SEMANTIC_EXPANSIONS[term] ?? [];
  return uniq([term, ...direct.flatMap(tokenize)]);
};

const queryPhrases = (query: string) => {
  const words = normalize(query)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));

  const phrases: string[] = [];
  for (let size = 2; size <= 3; size += 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      phrases.push(words.slice(index, index + size).join(" "));
    }
  }

  return uniq(phrases);
};

const categoryIntentScore = (query: string, category: SearchCategory) => {
  const normalizedQuery = normalize(query);
  return CATEGORY_INTENTS[category].some((intent) => normalizedQuery.includes(intent)) ? 3 : 0;
};

const levenshtein = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], previous, row[j]) + 1;
      previous = temp;
    }
    row[0] = i;
  }
  return row[b.length];
};

const fieldTokens = (doc: SearchDocument) => ({
  title: tokenize(doc.title),
  subtitle: tokenize(doc.subtitle),
  description: tokenize(doc.description),
  date: tokenize(doc.date ?? ""),
  topics: tokenize(doc.topics.join(" ")),
  tags: tokenize(doc.tags.join(" ")),
  keywords: tokenize(doc.keywords.join(" ")),
});

const fieldText = (doc: SearchDocument) =>
  normalize([doc.title, doc.subtitle, doc.description, doc.date, ...doc.topics, ...doc.tags, ...doc.keywords].filter(Boolean).join(" "));

const scoreField = (terms: string[], tokens: string[], weight: number) => {
  const tokenSet = new Set(tokens);
  let score = 0;
  let matched = false;

  terms.forEach((term, index) => {
    const semanticPenalty = index === 0 ? 1 : 0.64;
    if (tokenSet.has(term)) {
      score += weight * semanticPenalty;
      matched = true;
      return;
    }

    const prefixHit = term.length >= 3 && tokens.some((token) => token.startsWith(term) || term.startsWith(token));
    if (prefixHit) {
      score += weight * 0.48 * semanticPenalty;
      matched = true;
      return;
    }

    const fuzzyHit = term.length >= 5 && tokens.some((token) => token.length >= 5 && levenshtein(term, token) <= 1);
    if (fuzzyHit) {
      score += weight * 0.28 * semanticPenalty;
      matched = true;
    }
  });

  return { score, matched };
};

const explainMatch = (doc: SearchDocument, queryTerms: string[]) => {
  const searchable = new Set(tokenize([doc.title, doc.subtitle, doc.description, ...doc.topics, ...doc.tags].join(" ")));
  const direct = queryTerms.find((term) => searchable.has(term));
  if (direct) return `Matched ${direct}`;
  return doc.topics[0] ? `Related to ${doc.topics[0]}` : CATEGORY_LABELS[doc.category];
};

export const searchSite = (query: string, limitPerCategory = 5): SearchGroup[] => {
  const queryTerms = uniq(tokenize(query));
  if (!queryTerms.length) {
    return SEARCH_CATEGORY_ORDER.map((category) => ({ category, label: CATEGORY_LABELS[category], results: [] }));
  }

  const normalizedQuery = normalize(query);
  const phrases = queryPhrases(query);
  const weightedFields: Array<[keyof ReturnType<typeof fieldTokens>, number]> = [
    ["title", 9],
    ["topics", 7],
    ["tags", 6],
    ["subtitle", 4],
    ["date", 4],
    ["description", 3],
    ["keywords", 1.2],
  ];

  const scored = searchDocuments
    .map((doc) => {
      const fields = fieldTokens(doc);
      let score = 0;
      let matchedOriginalTerms = 0;

      queryTerms.forEach((queryTerm) => {
        const expandedTerms = expandTerm(queryTerm);
        let matchedThisTerm = false;

        weightedFields.forEach(([field, weight]) => {
          const match = scoreField(expandedTerms, fields[field], weight);
          score += match.score;
          matchedThisTerm = matchedThisTerm || match.matched;
        });

        if (matchedThisTerm) matchedOriginalTerms += 1;
      });

      const text = fieldText(doc);
      if (normalizedQuery.length > 2 && text.includes(normalizedQuery)) score += 8;
      if (doc.title && normalize(doc.title).includes(normalizedQuery) && normalizedQuery.length > 2) score += 10;
      phrases.forEach((phrase) => {
        if (phrase.length > 4 && text.includes(phrase)) score += 5;
        if (phrase.length > 4 && normalize(doc.title).includes(phrase)) score += 4;
      });
      if (score > 0) score += categoryIntentScore(query, doc.category);
      if (matchedOriginalTerms > 0) {
        score *= 1 + Math.min(matchedOriginalTerms / queryTerms.length, 1) * 0.14;
      }
      if (queryTerms.length > 1 && matchedOriginalTerms > 1) score *= 1.1;
      if (matchedOriginalTerms === 0) score = 0;

      return { ...doc, score, reason: explainMatch(doc, queryTerms) };
    })
    .filter((doc) => doc.score >= 4.5)
    .sort((a, b) => b.score - a.score);

  return SEARCH_CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    results: scored.filter((result) => result.category === category).slice(0, limitPerCategory),
  }));
};

export const hasSearchResults = (groups: SearchGroup[]) => groups.some((group) => group.results.length > 0);

export function formatDate(date: string) {
  if (/^\d{4}$/.test(date)) return date;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}
