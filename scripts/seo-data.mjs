export const SITE_URL = "https://www.isaacseiler.xyz";
export const SITE_NAME = "Isaac Seiler";
export const SITE_DESCRIPTION =
  "Isaac Seiler leads marketing and communications at Summation, helping tell the story of how AI is changing the way people work. Based in Seattle, Washington.";
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
  aiIndex: `${PROJECT_IMG_BASE}/aiindex.jpg`,
  aiNews: `${PROJECT_IMG_BASE}/ainews.jpg`,
  biCares: `${PROJECT_IMG_BASE}/bicares.jpg`,
  boehStrategy: `${PROJECT_IMG_BASE}/boehstrategy.jpg`,
  charging: `${PROJECT_IMG_BASE}/charging.jpg`,
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
  {
    path: "/",
    navTitle: "Home",
    title: "Isaac Seiler | Work and Photos",
    description: SITE_DESCRIPTION,
    sitelinkDescription: "Isaac Seiler's portfolio, selected work, and photography.",
    priority: "1.0",
    changefreq: "weekly",
    image: PREVIEW_IMAGE,
    keywords: ["Isaac Seiler", "Summation", "marketing", "communications", "portfolio", "projects", "photography"],
  },
  {
    path: "/about",
    navTitle: "About",
    title: "About | Isaac Seiler",
    description: SITE_DESCRIPTION,
    sitelinkDescription: "About Isaac Seiler and his current work at Summation.",
    priority: "0.95",
    changefreq: "monthly",
    image: PREVIEW_IMAGE,
    keywords: ["Isaac Seiler", "Summation", "Seattle", "marketing", "communications"],
  },
  {
    path: "/work",
    navTitle: "Work",
    title: "Work | Isaac Seiler",
    description: "Selected projects by Isaac Seiler.",
    sitelinkDescription: "Selected projects and case studies by Isaac Seiler.",
    priority: "0.94",
    changefreq: "weekly",
    image: { url: projectCardImages.biCares },
    keywords: ["Isaac Seiler work", "Isaac Seiler projects", "communications", "research", "strategy"],
  },
  {
    path: "/photos",
    navTitle: "Photos",
    title: "Photos | Isaac Seiler",
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
    title: "Fulbright Taiwan ChatGPT Lab with OpenAI Support | Isaac Seiler",
    description:
      "Isaac Seiler founded and led the Fulbright Taiwan ChatGPT Lab, an OpenAI-supported educator lab focused on practical, responsible ChatGPT use cases in education.",
    searchIntent:
      "OpenAI-supported Fulbright Taiwan educator lab, ChatGPT for Education, teacher AI training, and practical classroom AI use cases.",
    proofPoints: [
      "Founded and led a six-session Fulbright Taiwan ChatGPT Lab for educators.",
      "Designed curriculum around practical, responsible ChatGPT use in classrooms.",
      "Connected the work to OpenAI for Education and published educator use cases.",
    ],
    image: {
      url: projectCardImages.chatLab,
      alt: "Fulbright Taiwan ChatGPT Lab and OpenAI education project preview",
    },
    keywords: [
      "ChatGPT Lab",
      "OpenAI for Education",
      "ChatGPT for Education",
      "Fulbright Taiwan",
      "Fulbright ChatGPT Lab",
      "OpenAI education newsletter",
      "AI in education",
      "teacher AI training",
      "100 Chats Project",
    ],
    about: ["OpenAI", "ChatGPT", "Fulbright Taiwan", "AI education", "teacher training"],
    sameAs: ["https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan"],
  },
  "artificial-intelligence-in-state-government-index": {
    title: "Artificial Intelligence in State Government Index | Isaac Seiler",
    description:
      "A public benchmark by Isaac Seiler measuring generative AI adoption, training, governance, pilots, transparency, and preparedness across U.S. states and territories.",
    searchIntent:
      "AI state government index, public-sector generative AI adoption, state AI governance, training, pilots, sandboxes, and transparency.",
    proofPoints: [
      "Built a 15-criteria GenAI Preparedness Score from publicly verifiable evidence.",
      "Benchmarked all U.S. states and territories on AI governance and adoption signals.",
      "Published state-by-state analysis with recommendations for lawmakers.",
    ],
    image: {
      url: projectCardImages.aiIndex,
      alt: "Artificial Intelligence in State Government Index project preview",
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
    title: "Congressional Office Setup and 100 Day Report | Isaac Seiler",
    description:
      "Isaac Seiler helped stand up a new congressional office and produced early systems, staffing, metrics, communications, and first-100-day reporting.",
    searchIntent:
      "Congressional office setup, first 100 day report, Capitol Hill communications, office operations, and public-service reporting.",
    proofPoints: [
      "Helped build operational systems for a new congressional office.",
      "Collected and verified office-wide first-100-day performance metrics.",
      "Designed and coordinated the release of the final public report.",
    ],
    image: {
      url: projectCardImages.capHill,
      alt: "Congressional Office Setup and 100 Day Report project preview",
    },
    keywords: [
      "congressional office setup",
      "100 day report",
      "Capitol Hill communications",
      "House office operations",
      "public service communications",
    ],
    about: ["Congress", "communications", "public service", "operations"],
  },
  "senior-thesis-local-journalism": {
    title: "AI Platforms and Journalism Research | Isaac Seiler",
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
  "electric-vehicle-access-analysis": {
    title: "Electric Vehicle Charging Access Analysis | Isaac Seiler",
    description:
      "A GIS and quantitative analysis project by Isaac Seiler examining EV charging infrastructure access, charger density, income, race, and transportation equity.",
    searchIntent:
      "EV charging access analysis, electric vehicle infrastructure, GIS, charger density, income, race, and transportation equity.",
    proofPoints: [
      "Combined spatial datasets to analyze EV charger access and infrastructure gaps.",
      "Compared charger proximity with income, race, and regional variables.",
      "Produced maps, charts, and written interpretation for transportation-equity analysis.",
    ],
    image: {
      url: projectCardImages.charging,
      alt: "Electric Vehicle Charging Access Analysis project preview",
    },
    keywords: [
      "EV charging access",
      "electric vehicle infrastructure",
      "GIS EV charging",
      "transportation equity",
      "charger density",
      "spatial analysis",
    ],
    about: ["electric vehicles", "GIS", "transportation infrastructure", "equity analysis"],
  },
  "boehringer-cares-foundation-rebrand-strategy-shift": {
    image: {
      url: projectCardImages.biCares,
      alt: "Boehringer Cares Foundation rebrand and strategy project preview",
    },
    keywords: [
      "Boehringer Cares Foundation",
      "foundation rebrand",
      "CSR communications",
      "employee volunteering",
      "communications strategy",
    ],
    about: ["brand strategy", "foundation communications", "CSR", "UX"],
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
    title: "Artificial Intelligence in State Government Index",
    alt: "Artificial Intelligence in State Government Index project preview",
    caption:
      "A public benchmark measuring generative AI adoption across U.S. states and territories.",
  },
  {
    id: "congressional-office-100-day-report",
    url: projectCardImages.capHill,
    page: "/projects/congressional-office-setup-100-day-report",
    title: "Congressional Office Setup and 100 Day Report",
    alt: "Congressional Office Setup and 100 Day Report project preview",
    caption:
      "Systems, staffing, communications, and metrics used to launch a new congressional office.",
  },
  {
    id: "ai-platforms-journalism-research",
    url: projectCardImages.aiNews,
    page: "/projects/senior-thesis-local-journalism",
    title: "AI Platforms and Journalism Research",
    alt: "AI platforms and local journalism honors thesis project preview",
    caption:
      "Honors research on AI, digital platforms, local journalism, democracy, and media policy.",
  },
  {
    id: "electric-vehicle-charging-access",
    url: projectCardImages.charging,
    page: "/projects/electric-vehicle-access-analysis",
    title: "Electric Vehicle Charging Access Analysis",
    alt: "Electric Vehicle Charging Access Analysis project preview",
    caption:
      "GIS analysis of electric vehicle charging access, infrastructure, and transportation equity.",
  },
];

export const projectPriorityOrder = [
  "fulbright-focus-group-sponsored-by-openai",
  "artificial-intelligence-in-state-government-index",
  "senior-thesis-local-journalism",
  "congressional-office-setup-100-day-report",
  "electric-vehicle-access-analysis",
  "boehringer-cares-foundation-rebrand-strategy-shift",
  "communications-consultancy-supporting-local-candidates",
  "2022-institute-for-nonprofit-news-index-survey",
  "stl-immigrant-refugee-support-grant-process",
  "exclusive-interview-with-high-visibility-congressperson",
];

export const rssProjectIds = [
  "artificial-intelligence-in-state-government-index",
  "congressional-office-setup-100-day-report",
  "stl-immigrant-refugee-support-grant-process",
  "senior-thesis-local-journalism",
  "electric-vehicle-access-analysis",
  "boehringer-cares-foundation-rebrand-strategy-shift",
];

export const redirectTargets = [
  {
    source: "/blog",
    destination: "/work",
  },
  {
    source: "/writing",
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
