const PROJECT_IMG_BASE = "/project-images";
const PROJECT_FILE_BASE = "https://pub-fa8ebd83ba8d4bf99e2e7f12e394fc2f.r2.dev";
const projectImg = {
  aiClassroom: `${PROJECT_IMG_BASE}/ai-classroom.jpg`,
  aiIndex: `${PROJECT_IMG_BASE}/aiindex.jpg`,
  aiNews: `${PROJECT_IMG_BASE}/ainews.jpg`,
  biCares: `${PROJECT_IMG_BASE}/bicares.jpg`,
  boehStrategy: `${PROJECT_IMG_BASE}/boehstrategy.jpg`,
  capHill: `${PROJECT_IMG_BASE}/caphill.jpg`,
  charging: `${PROJECT_IMG_BASE}/charging.jpg`,
  chatLab: `${PROJECT_IMG_BASE}/chatlab.jpg`,
  congressInterview: `${PROJECT_IMG_BASE}/congressinterview.jpg`,
  firstWebsite: `${PROJECT_IMG_BASE}/firstwebsite.jpg`,
  firstWebsitePreview: `${PROJECT_IMG_BASE}/firstwebsitepreview.jpg`,
  gisPoster: `${PROJECT_IMG_BASE}/gis-poster.jpg`,
  gisUsIncome: `${PROJECT_IMG_BASE}/usmap1.jpg`,
  gisUsRace: `${PROJECT_IMG_BASE}/usmap2.jpg`,
  nonprofitNews: `${PROJECT_IMG_BASE}/nonprofitnews.jpg`,
  philanthropyLab: `${PROJECT_IMG_BASE}/philanthropy-lab.jpg`,
  politicalConsult: `${PROJECT_IMG_BASE}/politicalconsult.jpg`,
  reporting: `${PROJECT_IMG_BASE}/reporting.jpg`,
};

export interface NewsItem {
  id: number;
  source: string;
  title: string;
  href: string;
  logoUrl: string;
  logoAlt: string;
  imageUrl?: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: ProjectLink[];
  media?: ProjectMedia[];
}

export interface ProjectMedia {
  type: "image" | "carousel" | "pdf";
  src?: string;
  alt?: string;
  caption?: string;
  title?: string;
  images?: {
    src: string;
    alt: string;
    caption?: string;
  }[];
}

export interface ProjectItem {
  id: string;
  title: string;
  source: "RESEARCH" | "WORK" | "REPORTING" | "PROJECT";
  year: string;
  summary: string;
  image: string;
  sections: ProjectSection[];
}

export const personName = "Isaac Seiler";

export const bioLines = [
  "I'm Isaac, a Seattle-based strategist leading marketing and communications at Summation.",
  "Previously, I managed communications for a Member of Congress, published work with OpenAI, helped build a congressional office, and conducted international research on the social and material impacts of AI and the Internet.",
  "I'm also a Fulbright and Truman Scholar and a member of OpenAI's ChatGPT Lab.",
];

const NEWS_IMG_BASE = "https://pub-0f2ac8ec0d4e41b885a39ae5fd004706.r2.dev";

export const newsItems: NewsItem[] = [
  {
    id: 1,
    source: "ChatGPT for Education",
    title: "Conducted OpenAI-supported Education Focus Group",
    href: "https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "OpenAI",
    imageUrl: `${NEWS_IMG_BASE}/chatgptlab.png`,
  },
  {
    id: 2,
    source: "Forbes",
    title: "Featured 2024 Truman Scholars",
    href: "https://www.forbes.com/sites/michaeltnietzel/2024/04/13/the-truman-scholars-for-2024-are-announced/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/Forbes.png",
    logoAlt: "Forbes",
    imageUrl: `${NEWS_IMG_BASE}/truman.png`,
  },
  {
    id: 3,
    source: "OpenAI",
    title: "Shared Early Product Feedback with OpenAI",
    href: "#",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "OpenAI",
    imageUrl: `${NEWS_IMG_BASE}/55.png`,
  },
  {
    id: 4,
    source: "Washington University in St. Louis",
    title: "Won 2024 Truman Scholarship",
    href: "https://source.washu.edu/2024/04/junior-seiler-awarded-truman-scholarship/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/WashU.png",
    logoAlt: "WashU",
    imageUrl: `${NEWS_IMG_BASE}/trumanII.png`,
  },
  {
    id: 5,
    source: "OpenAI",
    title: "Contributed to 100 Chats Project with the ChatGPT Lab",
    href: "https://chatgpt.com/100chats-project",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "OpenAI",
    imageUrl: `${NEWS_IMG_BASE}/100chats.png`,
  },
  {
    id: 6,
    source: "Washington University in St. Louis",
    title: "Named 2024 Rhodes Scholarship Finalist",
    href: "https://source.washu.edu/2024/11/seniors-darden-seiler-were-rhodes-scholars-finalists/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/WashU.png",
    logoAlt: "WashU",
    imageUrl: `${NEWS_IMG_BASE}/rhodes.png`,
  },
  {
    id: 7,
    source: "Washington University in St. Louis",
    title: "Won Fulbright Award to Taiwan",
    href: "https://source.wustl.edu/2025/06/several-alumni-earn-fulbright-awards/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/Fulbright.png",
    logoAlt: "Fulbright",
    imageUrl: `${NEWS_IMG_BASE}/taipei.png`,
  },
  {
    id: 8,
    source: "OpenAI",
    title: "Study Mode Spotlight on ChatGPT's Instagram",
    href: "https://www.instagram.com/chatgpt/reel/DNyG5VvXEZM/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "OpenAI",
    imageUrl: `${NEWS_IMG_BASE}/study.png`,
  },
  {
    id: 9,
    source: "OpenAI",
    title: "Testimonial Featured in ChatGPT Pulse Launch",
    href: "https://openai.com/index/introducing-chatgpt-pulse/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "OpenAI",
    imageUrl: `${NEWS_IMG_BASE}/pulse.png`,
  },
  {
    id: 10,
    source: "OpenAI",
    title: "Shared Early Browser Product Feedback with OpenAI",
    href: "#",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "OpenAI",
    imageUrl: `${NEWS_IMG_BASE}/atlas.png`,
  },
  {
    id: 11,
    source: "Missouri College Media Awards",
    title: "Won Award for Best College Newspaper Photography",
    href: "https://source.washu.edu/2025/05/student-life-wins-best-newspaper-honor-at-missouri-college-media-awards/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/WashU.png",
    logoAlt: "WashU",
    imageUrl: `${NEWS_IMG_BASE}/washuII.png`,
  },
  {
    id: 12,
    source: "Washington University in St. Louis",
    title: "University Profile",
    href: "https://artsci.washu.edu/ampersand/isaac-seiler-setting-his-sights-high",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/WashU.png",
    logoAlt: "WashU",
    imageUrl: `${NEWS_IMG_BASE}/washu.png`,
  },
];

export const projectItems: ProjectItem[] = [
  {
    id: "artificial-intelligence-in-state-government-index",
    title: "Artificial Intelligence in State Government Index",
    source: "RESEARCH",
    year: "2025",
    summary:
      "A public-information benchmark measuring how state and territory governments are actually responding to generative AI.",
    image: projectImg.aiIndex,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "This work, published with the Council of State Governments, translates the GenAI hype cycle into a measurable picture of how state and territory governments are actually responding.",
          "I built a public-information benchmark that scores all states and territories on concrete adoption signals including employee guidance, training, sandboxes, pilots, governance structures, and transparency, then paired the index with a policy roadmap for what leaders should do next.",
          "The headline result was stark: most states scored below 50/100, and only a small handful cleared 80, suggesting the U.S. state landscape is early, uneven, and often opaque.",
        ],
      },
      {
        heading: "What I Built",
        bullets: [
          "GenAI Preparedness Score: a 15-criteria scoring framework grounded in publicly verifiable evidence.",
          "Composite scoring: a weighted model combining preparedness with an efficiency adjustment.",
          "State-by-state analysis and rankings with concise synopses explaining each placement.",
          "A practitioner roadmap tied directly to observed policy, training, pilot, and transparency gaps.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "The GenAI Benchmark", href: "https://docs.google.com/spreadsheets/d/1BhOYYJF75hnKdcfi5IejWD8tHovsdnay/edit?usp=sharing&ouid=107923489516143255873&rtpof=true&sd=true" },
          { label: "Study Methodology and Background", href: "https://docs.google.com/document/d/1jvnT2yJo47LchswQmj4DRZGEHYOoMGZB/edit" },
          { label: "Recommendations to State Lawmakers", href: "https://docs.google.com/document/d/1z1hLEEtHXN6JlZp3XSpEGSV2wMdmoTHD/edit" },
          { label: "Executive Summary Presentation", href: "https://docs.google.com/presentation/d/1jAaItGFd-F7s-wUSZRsxjfbmZnqmAT5V/edit?slide=id.p1#slide=id.p1" },
        ],
      },
    ],
  },
  {
    id: "congressional-office-setup-100-day-report",
    title: "Congressional Office Setup and 100 Day Report",
    source: "WORK",
    year: "2025",
    summary:
      "A report capturing the systems, staffing, and benchmarks used to stand up a brand-new congressional office from zero.",
    image: projectImg.capHill,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "This report captures the work I led to stand up a brand-new congressional office from zero and benchmark its first 100 days of operation.",
          "I helped design the office's internal systems, set early priorities, and define what success would look like before we opened the doors.",
          "I led the collection and verification of office-wide metrics, identified and summarized qualitative and quantitative wins, designed the final report, and coordinated its release to media and stakeholders.",
        ],
      },
      {
        heading: "My Contributions",
        bullets: [
          "Building core office infrastructure and workflows.",
          "Hiring a core team and directing recruiting processes.",
          "Tracking early performance benchmarks.",
          "Managing schedule and logistics for a new member of Congress.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "100 Day Report Executive Summary", href: "https://drive.google.com/file/d/1gdSr7RjjmidqJkLTWkyIbesVPIkECizn/view" },
        ],
      },
    ],
  },
  {
    id: "stl-immigrant-refugee-support-grant-process",
    title: "Raised $20k for Local St. Louis Organizations",
    source: "PROJECT",
    year: "2025",
    summary:
      "A student-led philanthropy process that helped move real dollars to St. Louis nonprofits, including immigrant and refugee-serving organizations.",
    image: projectImg.philanthropyLab,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "In WashU's Philanthropy Lab course, students learned philanthropy by doing it: defining grant priorities, reviewing proposals, conducting site visits, and deciding how to allocate funding to St. Louis nonprofits.",
          "My team focused on immigrant and refugee support, evaluating organizations by community need, mission fit, leadership strength, operational efficiency, reach, and their ability to convert grant dollars into direct service.",
          "The course awarded $70,900 to 22 local nonprofits at its April 2025 closing ceremony, with additional course grants bringing the 2025 total to $133,400. Our work contributed to that broader student-led funding process while sharpening my understanding of responsible, place-based grantmaking.",
        ],
      },
      {
        heading: "Organizations Reviewed and Funded",
        bullets: [
          "Casa de Salud: medical care, mental health services, case management, and financial assistance for underinsured and uninsured immigrant and refugee families.",
          "International Institute of St. Louis: refugee resettlement, medical and legal support, employment, housing, and cultural integration services.",
          "IHELP: personalized English tutoring, citizenship preparation, life skills, and in-home or virtual support that reduces barriers like transportation and childcare.",
          "Monarch Immigrant Services: long-standing social and legal services for immigrant and refugee communities across the region.",
        ],
      },
      {
        heading: "Decision",
        paragraphs: [
          "We selected Casa de Salud because it matched our mission and served immigrant and refugee families through a model that combined medical care, mental health support, and case management.",
          "The class ultimately awarded Casa de Salud $17,100, the largest single grant of the 2025 cycle, after all student groups chose to contribute to its award.",
          "We also recommended support for IHELP and Monarch Immigrant Services because language access and legal-social services are foundational for families building stable lives in St. Louis.",
        ],
      },
      {
        heading: "References",
        links: [
          { label: "WashU Philanthropy Lab Course Grants $71K to STL Orgs", href: "https://gephardtinstitute.wustl.edu/washu-philanthropy-lab-course-grants-71k-to-stl-orgs/" },
          { label: "The Philanthropy Lab at Washington University in St. Louis", href: "https://thephilanthropylab.org/washington-university-in-st-louis/" },
        ],
      },
    ],
  },
  {
    id: "senior-thesis-local-journalism",
    title: "AI Platforms and Journalism Research",
    source: "RESEARCH",
    year: "2025",
    summary:
      "A qualitative honors thesis on the structural decline of local journalism in Australia and its implications for democracy, labor, and media policy.",
    image: projectImg.aiNews,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "My senior thesis is a qualitative honors project analyzing the structural decline of local journalism in Australia and its implications for democratic accountability, labor, and media policy.",
          "Drawing on 17 in-depth interviews with current and former journalists, editors, newsroom owners, and industry experts, the study examines how economic contraction, platform dominance, newsroom consolidation, and emerging technologies are reshaping local and regional news ecosystems.",
          "I designed and executed the research end-to-end, including literature review, interview recruitment, transcription verification, qualitative coding, and thematic analysis.",
        ],
      },
      {
        heading: "Core Outputs",
        bullets: [
          "An original qualitative dataset with 17 semi-structured interviews and verified transcripts.",
          "Flexible coding and thematic synthesis on labor precarity, newsroom contraction, and platform dependence.",
          "Comparative evaluation of print, digital, hybrid, nonprofit, and subscription-based business models.",
          "Policy and platform assessment spanning bargaining codes, broadcasting, subsidies, and digital training programs.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "Final Thesis Draft", href: "https://drive.google.com/file/d/1Z6-RR1Zw7z2RieJwVHdk0yOtycRIN1ia/view?usp=sharing" },
        ],
      },
    ],
  },
  {
    id: "ai-literacy-workshop-for-educators",
    title: "Education Conference Presentation on AI Applications",
    source: "PROJECT",
    year: "2025",
    summary:
      "A conference-style educator presentation translating AI concepts into practical classroom and planning applications.",
    image: projectImg.aiClassroom,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "I developed and delivered an education conference presentation on how teachers can understand, evaluate, and responsibly apply artificial intelligence in classroom contexts.",
          "The session started from educator skepticism rather than brushing past it. I framed AI as a set of systems that can support planning, differentiation, feedback, and student exploration when teachers understand the tradeoffs and keep professional judgment in the loop.",
          "The presentation moved from fundamentals to practice: what AI is, how large language models work, why models can be useful and unreliable at the same time, and how educators can design classroom uses around clear learning goals instead of novelty.",
        ],
      },
      {
        heading: "Core Principles",
        bullets: [
          "Build enough technical literacy to understand what AI systems can do, where they fail, and why outputs need review.",
          "Keep human judgment central: AI can support the work, but educators should own the instructional decisions.",
          "Choose tools around learning outcomes rather than model hype, matching the modality and workflow to the task.",
          "Verify anything students, colleagues, or families will rely on, especially factual claims and sensitive guidance.",
          "Prompt with precision by defining the goal, audience, constraints, and context before asking for output.",
        ],
      },
      {
        heading: "Conference Slides",
        paragraphs: [
          "The deck translates the presentation into a visual sequence educators can revisit after the session. It introduces the conceptual foundations, gives concrete classroom and planning applications, and closes with practical habits for using AI without outsourcing teacher judgment.",
        ],
        media: [
          {
            type: "pdf",
            src: `${PROJECT_FILE_BASE}/Artificial%20Intelligence%20in%20the%20Classroom.pdf`,
            title: "Artificial Intelligence in the Classroom",
          },
        ],
      },
      {
        heading: "Materials",
        paragraphs: [
          "The materials drew from my Fulbright Taiwan ChatGPT Lab work and from AI fluency training resources, especially the idea that responsible use starts with understanding systems well enough to use them deliberately.",
        ],
        links: [
          { label: "Workshop Slide Deck", href: `${PROJECT_FILE_BASE}/Artificial%20Intelligence%20in%20the%20Classroom.pdf` },
          { label: "Anthropic AI Fluency Foundations Course", href: "https://lnkd.in/gnUB8D7M" },
        ],
      },
    ],
  },
  {
    id: "electric-vehicle-access-analysis",
    title: "Electric Vehicle Charging Access Analysis",
    source: "RESEARCH",
    year: "2024",
    summary:
      "A GIS and quantitative analysis project examining EV infrastructure access and where structural charger gaps remain.",
    image: projectImg.charging,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "This GIS project investigated how race and household income affect Americans' proximity to electric vehicle charging infrastructure.",
          "Working with county-level bivariate maps and a Wayne County, Michigan case study, we tested whether communities with different income levels or racial demographics had meaningfully different access to public battery-electric vehicle chargers.",
          "My role focused on national charging station and income mapping, county-level spatial joins, bivariate symbology, and regression interpretation that translated geographic data into an accessible research poster.",
        ],
        media: [
          {
            type: "image",
            src: projectImg.gisPoster,
            alt: "Electric Vehicle Charging Accessibility in the United States research poster",
            caption: "Final GIS poster summarizing the research question, national and local maps, regression results, methods, and conclusions.",
          },
        ],
      },
      {
        heading: "Key Takeaways",
        bullets: [
          "Nationally, neither household income nor racial identity strongly correlated with proximity to EV chargers.",
          "At the local level in Wayne County, the data also did not show a consistent racial or income disparity in EV charging access.",
          "The results suggest charger access is shaped by a more complicated mix of region, density, public investment, car culture, and rural-urban geography.",
          "Future work should examine rural communities, tract-level national data, and how access changes as EV adoption moves beyond early-adopter markets.",
        ],
      },
      {
        heading: "Map Details",
        media: [
          {
            type: "image",
            src: projectImg.gisUsIncome,
            alt: "United States counties mapped by EV charging stations and median household income",
            caption: "U.S. county bivariate map comparing EV charging station density with median household income. Higher-income counties in places like Los Angeles and San Francisco showed strong charger adoption, but low-income communities still had charger access across much of the country.",
          },
          {
            type: "image",
            src: projectImg.gisUsRace,
            alt: "United States counties mapped by EV charging stations and racial minority concentration",
            caption: "U.S. county bivariate map comparing EV charging station density with racial minority concentration. Areas with high minority concentrations, including parts of the American South, showed similar access patterns to other regions.",
          },
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "Initial Report", href: "https://drive.google.com/file/d/11lfGLY0n4XqNRCgFE3Yk_ph7zb2OlH3d/view?usp=sharing" },
          { label: "Presentation Poster with Spatial Analysis", href: "https://drive.google.com/file/d/1a8RYeorbJRYYcGRrFKe6x2rKmQMft95j/view?usp=sharing" },
        ],
      },
    ],
  },
  {
    id: "first-personal-website",
    title: "First Personal Website",
    source: "PROJECT",
    year: "2023",
    summary:
      "My first personal portfolio, built by hand as a way to learn Git, frontend development, databases, and the logic of shipping software.",
    image: projectImg.firstWebsite,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "This was my first personal website, built before I used Codex or Claude Code.",
          "The goal was simplicity: a lightweight portfolio inspired by social media feeds, where the work could feel browsable instead of overproduced.",
          "Building it taught me the fundamentals that still shape how I work: Git, code organization, deployment, databases, content modeling, and the tiny decisions that turn a static page into a living project.",
        ],
        media: [
          {
            type: "image",
            src: projectImg.firstWebsitePreview,
            alt: "Preview of Isaac Seiler's first personal website",
            caption: "A preview of the original site interface, designed around simple scrolling, personal updates, and a social-media-inspired content rhythm.",
          },
        ],
      },
      {
        heading: "What I Learned",
        bullets: [
          "How to use Git as a real project history rather than just a file backup system.",
          "How frontend components, routing, styling, and content structure fit together.",
          "How databases and dynamic content change the way a portfolio can be organized.",
          "How simplicity can be a design constraint, especially when the priority is clarity and maintainability.",
        ],
      },
      {
        heading: "Project Links",
        links: [
          { label: "GitHub Repository", href: "https://github.com/isaaciseiler-beep/isaacwebsite-v2/tree/main" },
        ],
      },
    ],
  },
  {
    id: "communications-consultancy-supporting-local-candidates",
    title: "Communications Consultancy and Supporting Local Candidates",
    source: "WORK",
    year: "2024",
    summary:
      "An independent consultancy effort supporting local candidates through campaign websites, digital strategy, and rapid-response communications.",
    image: projectImg.politicalConsult,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "In 2024, I decided I wanted to build my own consultancy, supporting local and federal candidates that I believed in by delivering digital and communications assets.",
          "One of the campaigns I supported was Allyson Damikolas for Tustin Unified School Board in California. I led the campaign's digital and communications strategy, with the website functioning as the central hub for messaging, organizing, and voter-facing information.",
          "In addition to building the site, I managed social media messaging and supported rapid-response and crisis communications during high-pressure moments in the race.",
        ],
      },
      {
        heading: "Scope of Work",
        bullets: [
          "Website strategy, design, and execution.",
          "Social media messaging and content design.",
          "Rapid-response and crisis communications support.",
          "Strategic advising on campaign narrative and positioning.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "Allyson's Campaign Website", href: "https://www.allysonfortustin.com/" },
        ],
      },
    ],
  },
  {
    id: "fulbright-focus-group-sponsored-by-openai",
    title: "Fulbright Taiwan Educator Lab with OpenAI Support",
    source: "PROJECT",
    year: "2025",
    summary:
      "A six-session educator lab with OpenAI/ChatGPT for Education support, focused on practical and responsible uses of ChatGPT in education.",
    image: projectImg.chatLab,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "I founded and led the Fulbright Taiwan ChatGPT Lab, an OpenAI-supported educator lab focused on practical classroom uses of ChatGPT.",
          "The Lab brought together Fulbright educators to explore practical, responsible uses of ChatGPT in education. Over six structured sessions, I designed the curriculum, facilitated discussions, and guided participants toward concrete classroom use cases.",
          "The Lab culminated in a published Substack with specific, lightweight use cases of ChatGPT that educators of all kinds can utilize in their daily workflows.",
        ],
      },
      {
        heading: "Key Components of the Lab",
        bullets: [
          "Developed the Lab's structure with OpenAI/ChatGPT for Education support.",
          "Independently facilitated six stakeholder sessions.",
          "Produced nine specific uses of ChatGPT for educators, summarized in a Substack post authored by me.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "Substack Post", href: "https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan" },
          { label: "Fulbright Taiwan ChatGPT Lab Notion Page", href: "https://notion.so/ChatGPT-Lab-x-Fulbright-Taiwan-261aaef174d680579138e8c1c658ab41" },
          { label: "PowerPoint Introduction to the Lab", href: "https://docs.google.com/presentation/d/1ZqOp_1KQte52BNBR5OBmOJThCufkNnBtVLBhNW_rkps/edit?slide=id.g38cd4d0aa4c_0_33#slide=id.g38cd4d0aa4c_0_33" },
        ],
      },
    ],
  },
  {
    id: "political-reporting-at-washu",
    title: "Political Reporting at WashU",
    source: "REPORTING",
    year: "2024",
    summary:
      "Student political reporting at WashU focused on protest, campus governance, elections, and institutional accountability.",
    image: projectImg.reporting,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "As a student journalist, I covered politics and power on campus, reporting on issues where institutional authority, student activism, and national politics intersected.",
          "My reporting focused on moments of controversy and transition, pairing on-the-ground student perspectives with analysis of how the university responded through policy, governance, and public messaging.",
        ],
      },
      {
        heading: "Selected Stories",
        links: [
          { label: "Suspended student protesters speak out", href: "https://www.studlife.com/news/2024/09/18/disorienting-suspended-student-protesters-speak-out" },
          { label: "WashU ABS respond to racist text messages after election", href: "https://www.studlife.com/news/2024/12/04/washu-abs-respond-to-racist-text-messages-after-election-discuss-combating-hate" },
          { label: "Panel on free speech, protest, and democracy", href: "https://www.studlife.com/news/2024/09/11/disagree-without-being-disagreeable-chancellor-martin-hosts-panel-on-free-speech-protest-and-democracy" },
          { label: "Anxiety and hope among WashU students, staff, and faculty", href: "https://www.studlife.com/news/2024/04/30/its-getting-hotter-anxiety-and-hope-among-washu-students-staff-and-faculty" },
          { label: "Students reflect on candidates and civic engagement", href: "https://www.studlife.com/news/2024/10/31/before-election-day-washu-students-reflect-on-candidates-and-civic-engagement-2" },
          { label: "University forms naming review board", href: "https://www.studlife.com/news/2024/02/14/university-forms-naming-review-board" },
        ],
      },
    ],
  },
  {
    id: "boehringer-cares-foundation-rebrand-strategy-shift",
    title: "Boehringer Cares Foundation Rebrand and Strategy Shift",
    source: "WORK",
    year: "2025",
    summary:
      "A full rebrand and strategic redirect for Boehringer Cares, spanning narrative, UX, visual identity, and internal communications.",
    image: projectImg.biCares,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "At Boehringer Cares, I helped lead a full rebrand including visual design and a broader strategic redirect.",
          "I played a central role in redefining how the organization presented its mission, priorities, and impact, both internally and externally.",
          "I led data collection and synthesis to inform the rebrand, then translated those insights into a new website and visual identity in collaboration with UX and brand strategy teams.",
        ],
      },
      {
        heading: "Major Contributions",
        bullets: [
          "Led research that clarified BICF's direction and narrative.",
          "Designed and launched a new website that helped increase employee volunteering by 25% in 2025.",
          "Shipped more than 25 assets and built a company-wide newsletter system that reached an 80% open rate.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "Revamped Boehringer Cares Website", href: "https://www.boehringer-ingelheim.com/us/boehringer-ingelheim-cares-foundation" },
        ],
      },
    ],
  },
  {
    id: "2022-institute-for-nonprofit-news-index-survey",
    title: "The 2022 Institute for Nonprofit News Index Survey",
    source: "RESEARCH",
    year: "2022",
    summary:
      "A large-scale nonprofit news research project involving data collection, survey synthesis, and direct stakeholder outreach.",
    image: projectImg.nonprofitNews,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "As a research assistant on the INN Index, I contributed to both the qualitative and quantitative components of a large-scale research project measuring nonprofit news organizations.",
          "I collected and cleaned data, synthesized survey responses, and conducted individual outreach to a significant subset of respondents.",
        ],
      },
      {
        heading: "Key Contributions",
        bullets: [
          "Data collection and database management.",
          "Direct stakeholder engagement.",
        ],
      },
      {
        heading: "Final Products",
        links: [
          { label: "2022 INN Index Report", href: "https://inn.org/research/inn-index/inn-index-2022/about-the-index/" },
        ],
      },
    ],
  },
  {
    id: "exclusive-interview-with-high-visibility-congressperson",
    title: "Exclusive Interview with High-Visibility Congressperson",
    source: "REPORTING",
    year: "2021",
    summary:
      "Early access-driven political reporting on then-Congressman Peter Meijer during a volatile post-impeachment period.",
    image: projectImg.congressInterview,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "My reporting for The Calvin Chimes focused on then-Congressman Peter Meijer during a volatile period early in his tenure, following his vote to impeach President Trump.",
          "As a college freshman, I conducted direct interviews and covered intra-party backlash, policy positions, and the political risks facing a first-term member of Congress.",
        ],
      },
      {
        heading: "Selected Stories",
        links: [
          { label: "Rep. Meijer defends filibuster, merit-based immigration, vote for impeachment", href: "https://calvinchimes.org/2021/04/08/rep-meijer-defends-filibuster-merit-based-immigration-vote-for-impeachment/" },
          { label: "Rep. Meijer faces censures, primary challenge over impeachment vote", href: "https://calvinchimes.org/2021/02/24/rep-meijer-faces-censures-primary-challenge-over-impeachment-vote/" },
        ],
      },
    ],
  },
  {
    id: "openai-product-testing-and-feedback",
    title: "OpenAI Product Testing and Feedback",
    source: "PROJECT",
    year: "2025",
    summary:
      "Early product testing, feedback, and featured contributions across ChatGPT products, including the 100 Chats Project, Pulse, Study Mode, and Atlas.",
    image: projectImg.chatLab,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "As a member of OpenAI's ChatGPT Lab, I test early products and share structured feedback with the teams building them.",
          "That work spans pre-release product feedback, contributions to public projects, and testimonials featured in launch materials.",
        ],
      },
      {
        heading: "Contributions",
        bullets: [
          "Contributed to the 100 Chats Project with the ChatGPT Lab.",
          "Shared early product feedback with OpenAI ahead of public releases.",
          "Shared early feedback on OpenAI's browser product.",
          "Testimonial featured in the ChatGPT Pulse launch.",
          "Study Mode use case spotlighted on ChatGPT's Instagram.",
        ],
      },
      {
        heading: "References",
        links: [
          { label: "100 Chats Project", href: "https://chatgpt.com/100chats-project" },
          { label: "Introducing ChatGPT Pulse", href: "https://openai.com/index/introducing-chatgpt-pulse/" },
          { label: "Study Mode Spotlight", href: "https://www.instagram.com/chatgpt/reel/DNyG5VvXEZM/" },
        ],
      },
    ],
  },
  {
    id: "fulbright-award-to-taiwan",
    title: "Won Fulbright Award to Taiwan",
    source: "BLOG",
    year: "2025",
    summary: "",
    image: projectImg.chatLab,
    sections: [],
  },
];


export const featuredProjectIds = [
  "artificial-intelligence-in-state-government-index",
  "congressional-office-setup-100-day-report",
  "senior-thesis-local-journalism",
  "electric-vehicle-access-analysis",
];
