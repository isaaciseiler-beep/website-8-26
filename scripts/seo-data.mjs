import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from "../src/lib/siteIdentity.mjs";
export { SITE_URL, SITE_NAME, SITE_DESCRIPTION };
export const CONTACT_EMAIL = "isaaciseiler@gmail.com";
export const PREVIEW_IMAGE = {
  url: "/webpreview-linkedin.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Isaac Seiler portfolio preview image",
};

const PROJECT_IMG_BASE = "/project-images";
const projectCardImages = {
  aiClassroom: `${PROJECT_IMG_BASE}/ai-classroom.jpg`,
  aiIndex: `${PROJECT_IMG_BASE}/aiindex.jpg`,
  aiNews: `${PROJECT_IMG_BASE}/ainews.jpg`,
  biCares: `${PROJECT_IMG_BASE}/bicares.jpg`,
  boehStrategy: `${PROJECT_IMG_BASE}/boehstrategy.jpg`,
  chatLab: `${PROJECT_IMG_BASE}/chatlab.jpg`,
  capHill: `${PROJECT_IMG_BASE}/caphill.jpg`,
  congressInterview: `${PROJECT_IMG_BASE}/congressinterview.jpg`,
  nonprofitNews: `${PROJECT_IMG_BASE}/nonprofitnews.jpg`,
  politicalConsult: `${PROJECT_IMG_BASE}/politicalconsult.jpg`,
  reporting: `${PROJECT_IMG_BASE}/reporting.jpg`,
};

export const SAME_AS = [
  "https://www.linkedin.com/in/isaacseiler/",
  "https://substack.com/@isaacseiler",
  "https://github.com/isaaciseiler-beep",
];

export const topLevelPages = [
  { path: "/writing", navTitle: "Writing", title: "Writing | Isaac Seiler", description: "Essays by Isaac Seiler. Coming soon.", priority: "0.6", changefreq: "monthly", image: PREVIEW_IMAGE, keywords: ["Isaac Seiler writing", "essays"] },
  {
    path: "/",
    navTitle: "Home",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    sitelinkDescription: "A tech generalist's work across AI, policy, education, research, and communications.",
    priority: "1.0",
    changefreq: "weekly",
    image: PREVIEW_IMAGE,
    keywords: ["Isaac Seiler", "tech generalist", "AI", "public policy", "education", "research", "communications"],
  },
  {
    path: "/about",
    navTitle: "About",
    title: "About Isaac Seiler | Tech Generalist",
    description: SITE_DESCRIPTION,
    sitelinkDescription: "Isaac Seiler's experience across technology, government, enterprise, and education.",
    priority: "0.95",
    changefreq: "monthly",
    image: PREVIEW_IMAGE,
    keywords: ["Isaac Seiler", "tech generalist", "Summation", "Seattle", "AI", "public policy"],
  },
  {
    path: "/work",
    navTitle: "Work",
    title: "Work | Isaac Seiler",
    description:
      "Selected work by Isaac Seiler across communications, strategy, research, artificial intelligence, journalism, and visual identity.",
    sitelinkDescription: "Selected work and case studies by Isaac Seiler.",
    priority: "0.94",
    changefreq: "weekly",
    image: { url: projectCardImages.biCares },
    keywords: ["Isaac Seiler work", "Isaac Seiler projects", "communications", "research", "strategy"],
  },
  {
    path: "/photos/map",
    navTitle: "Photo Map",
    title: "Photo Map | Isaac Seiler",
    description:
      "Travel photography by Isaac Seiler, with albums from Taiwan, Japan, Hong Kong, Iceland, Australia, New Zealand, Portugal, Thailand, Vietnam, Korea, and more.",
    sitelinkDescription:
      "Travel photography albums from Taiwan, Japan, Hong Kong, Iceland, Australia, New Zealand, Portugal, and more.",
    priority: "0.82",
    changefreq: "weekly",
    image: {
      url: "https://pub-9c24f6ce599b4e09bac5241fc8f8beb0.r2.dev/Taiwan/14BC8F70-A1CE-4D79-8FBE-665B57EB131F_1_105_c.jpeg",
      alt: "Taiwan travel photography by Isaac Seiler",
    },
    keywords: [
      "Isaac Seiler photos",
      "travel photography",
      "Taiwan photography",
      "Asia travel photos",
      "photo portfolio",
    ],
  },
];

export const projectSeo = {
  "fulbright-focus-group-sponsored-by-openai": {
    title: "Leading AI Literacy Efforts in Taiwan | Isaac Seiler",
    description:
      "Isaac Seiler pitched and led one of the first Local ChatGPT Labs, then turned what educators learned into a published resource and conference workshop.",
    searchIntent:
      "OpenAI-sponsored Fulbright Taiwan AI literacy program, teacher training, classroom uses, LLM fundamentals, and published educator recap.",
    proofPoints: [
      "Pitched and led one of the first Local ChatGPT Labs with support from OpenAI and ChatGPT for Education.",
      "Designed and led six applied sessions for 20 educators across 19 institutions and six counties in Taiwan.",
      "Covered LLM fundamentals, prompt design, classroom workflows, verification, and responsible use.",
      "Published a nine-example program recap with OpenAI and expanded the work into a 250+ person conference workshop.",
    ],
    image: {
      url: projectCardImages.chatLab,
      alt: "Educators participating in a Local ChatGPT Lab in Taiwan",
    },
    keywords: [
      "OpenAI for Education",
      "ChatGPT for Education",
      "Fulbright Taiwan",
      "Fulbright AI education",
      "AI in education",
      "teacher AI training",
      "AI literacy",
      "LLM fundamentals",
    ],
    about: ["ChatGPT", "OpenAI", "Fulbright Taiwan", "AI education", "teacher training", "AI literacy"],
    sameAs: ["https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan"],
  },
  "artificial-intelligence-in-state-government-index": {
    title: "Mapping the Rise of AI Across State Government | Isaac Seiler",
    description:
      "Isaac Seiler's August 2025 benchmark of generative AI adoption, training, governance, and preparedness across U.S. states and territories.",
    searchIntent:
      "AI state government index, public-sector generative AI adoption, state AI governance, training, pilots, sandboxes, and transparency.",
    proofPoints: [
      "Built a 15-criteria GenAI Preparedness Score from publicly verifiable evidence.",
      "Benchmarked all U.S. states and territories on AI governance and adoption signals.",
      "Published state-by-state analysis with recommendations for lawmakers.",
    ],
    image: {
      url: projectCardImages.aiIndex,
      alt: "Mapping the Rise of AI Across State Government work preview",
    },
    keywords: [
      "AI state government index",
      "generative AI government",
      "state AI governance",
      "Council of State Governments",
      "GenAI preparedness",
      "public sector AI",
      "AI policy benchmark",
    ],
    about: ["generative AI", "state government", "AI governance", "public policy"],
  },
  "congressional-office-setup-100-day-report": {
    title: "Building a Congressional Operation from Scratch | Isaac Seiler",
    description:
      "Isaac Seiler helped launch a congressional office and built a press network spanning West Michigan, statewide, and national media.",
    searchIntent:
      "Congressional communications, press strategy, earned media, office setup, child-labor coverage, and first-100-day reporting.",
    proofPoints: [
      "Built press relationships across local, statewide, national, trade, and Spanish-language media.",
      "Secured national coverage of child-labor enforcement and other office priorities.",
      "Led the writing, design, verification, and release of the first 100 Day Report.",
    ],
    image: {
      url: projectCardImages.capHill,
      alt: "Building a Congressional Operation from Scratch work preview",
    },
    keywords: [
      "congressional communications",
      "press strategy",
      "earned media",
      "Capitol Hill communications",
      "100 day report",
      "child labor coverage",
    ],
    about: ["Congress", "communications", "media relations", "public service"],
  },
  "senior-thesis-local-journalism": {
    title: "Investigating AI’s Impact on Journalism in Australia | Isaac Seiler",
    description:
      "Isaac Seiler's honors thesis analyzed AI, digital platforms, local journalism, democratic accountability, media policy, and newsroom labor through qualitative interviews.",
    searchIntent:
      "AI platforms journalism research, local journalism thesis, digital platforms, media policy, democratic accountability, and qualitative interviews.",
    proofPoints: [
      "Conducted 17 semi-structured interviews with journalists, editors, owners, and media experts.",
      "Analyzed AI, digital platforms, labor, democratic accountability, and local news economics.",
      "Produced an honors thesis grounded in qualitative coding and media-policy research.",
    ],
    image: {
      url: projectCardImages.aiNews,
      alt: "AI platforms and local journalism honors thesis project preview",
    },
    keywords: [
      "AI journalism research",
      "AI platforms journalism",
      "local journalism thesis",
      "digital platforms",
      "media policy",
      "Australia journalism",
      "qualitative interviews",
    ],
    about: ["AI", "journalism", "digital platforms", "local news", "media policy"],
  },
  "boehringer-cares-foundation-rebrand-strategy-shift": {
    title: "Bringing the Boehringer Cares Rebrand to Life | Isaac Seiler",
    description:
      "Implementing the Boehringer Cares rebrand across its website, employee communications, newsletter, and volunteering programs.",
    searchIntent:
      "Boehringer Cares rebrand implementation, website rollout, internal communications, and employee volunteering.",
    proofPoints: [
      "Worked with UX and brand teams to implement an established rebrand vision across the foundation's website and communications.",
      "Created more than 25 assets using the new brand direction.",
      "Built a newsletter with an 80% open rate as annual employee volunteering increased by 25% during the 2025 rollout.",
    ],
    image: {
      url: projectCardImages.biCares,
      alt: "Boehringer Cares rebrand implementation case study preview",
    },
    keywords: [
      "Boehringer Cares Foundation",
      "rebrand implementation",
      "website rollout",
      "internal communications",
      "employee volunteering",
      "employee engagement",
      "cross-functional coordination",
    ],
    about: ["rebrand implementation", "website rollout", "internal communications", "employee engagement"],
  },
  "communications-consultancy-supporting-local-candidates": {
    image: {
      url: projectCardImages.politicalConsult,
      alt: "Campaign communications consultancy project preview",
    },
    keywords: [
      "campaign communications",
      "local candidate website",
      "digital strategy",
      "rapid response communications",
      "Tustin school board campaign",
    ],
    about: ["campaigns", "communications", "local elections", "digital strategy"],
  },
  "2022-institute-for-nonprofit-news-index-survey": {
    image: {
      url: projectCardImages.nonprofitNews,
      alt: "Institute for Nonprofit News Index Survey project preview",
    },
    keywords: [
      "Institute for Nonprofit News",
      "INN Index",
      "nonprofit news research",
      "survey synthesis",
      "journalism data",
    ],
    about: ["nonprofit journalism", "survey research", "newsrooms", "media economics"],
  },
  "exclusive-interview-with-high-visibility-congressperson": {
    image: {
      url: projectCardImages.congressInterview,
      alt: "Exclusive political interview reporting project preview",
    },
    keywords: [
      "Peter Meijer interview",
      "political reporting",
      "Congress interview",
      "impeachment vote",
      "Calvin Chimes",
    ],
    about: ["political reporting", "Congress", "interview journalism"],
  },
  "stl-immigrant-refugee-support-grant-process": {
    title: "St. Louis Immigrant and Refugee Support Grant Process | Isaac Seiler",
    description:
      "A student-led philanthropy process by Isaac Seiler's WashU team evaluating and supporting St. Louis immigrant and refugee-serving nonprofits.",
    keywords: [
      "St. Louis immigrant refugee support",
      "Philanthropy Lab",
      "Casa de Salud",
      "WashU philanthropy",
      "student grantmaking",
    ],
    about: ["philanthropy", "St. Louis", "immigrant support", "nonprofits"],
  },
};

export const priorityImages = [
  {
    id: "isaac-seiler-home-preview",
    url: "/webpreview-linkedin.png",
    page: "/",
    title: "Isaac Seiler",
    alt: "Isaac Seiler portfolio preview image",
    caption: "Primary image for Isaac Seiler's portfolio.",
  },
  {
    id: "ai-state-government-index",
    url: projectCardImages.aiIndex,
    page: "/projects/artificial-intelligence-in-state-government-index",
    title: "Mapping the Rise of AI Across State Government",
    alt: "Mapping the Rise of AI Across State Government work preview",
    caption:
      "A public benchmark measuring generative AI adoption across U.S. states and territories.",
  },
  {
    id: "congressional-office-100-day-report",
    url: projectCardImages.capHill,
    page: "/projects/congressional-office-setup-100-day-report",
    title: "Building a Congressional Operation from Scratch",
    alt: "Building a Congressional Operation from Scratch work preview",
    caption:
      "Launching a congressional office and building its local, statewide, and national press network.",
  },
  {
    id: "ai-platforms-journalism-research",
    url: projectCardImages.aiNews,
    page: "/projects/senior-thesis-local-journalism",
    title: "Investigating AI’s Impact on Journalism in Australia",
    alt: "AI platforms and local journalism honors thesis project preview",
    caption:
      "Honors research on AI, digital platforms, local journalism, democracy, and media policy.",
  },
];

export const projectPriorityOrder = [
  "fulbright-focus-group-sponsored-by-openai",
  "artificial-intelligence-in-state-government-index",
  "senior-thesis-local-journalism",
  "congressional-office-setup-100-day-report",
  "boehringer-cares-foundation-rebrand-strategy-shift",
  "stl-immigrant-refugee-support-grant-process",
  "openai-product-testing-and-feedback",
];

export const rssProjectIds = [
  "fulbright-focus-group-sponsored-by-openai",
  "artificial-intelligence-in-state-government-index",
  "congressional-office-setup-100-day-report",
  "stl-immigrant-refugee-support-grant-process",
  "senior-thesis-local-journalism",
  "boehringer-cares-foundation-rebrand-strategy-shift",
];

export const redirectTargets = [
  {
    source: "/blog",
    destination: "/work",
  },
  {
    source: "/latest",
    destination: "/work",
  },
  {
    source: "/experience",
    destination: "/about",
  },
  {
    source: "/credentials",
    destination: "/about",
  },
  {
    source: "/resume",
    destination: "/about",
  },
  {
    source: "/projects",
    destination: "/work",
  },
  {
    source: "/projects/electric-vehicle-access-analysis",
    destination: "/work",
  },
];

export const aiCrawlerAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "GoogleOther",
  "GoogleOther-Image",
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
];
