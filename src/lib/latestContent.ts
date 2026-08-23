export interface LatestLink {
  label: string;
  href: string;
}

export interface LatestSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  links?: LatestLink[];
}

export interface LatestItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published: string;
  updated: string;
  displayDate: string;
  readingTime: string;
  image: string;
  imageAlt: string;
  keywords: string[];
  about: string[];
  sections: LatestSection[];
}

export const latestItems: LatestItem[] = [
  {
    slug: "joining-summation-ai-marketing-communications",
    title: "Joining Summation to Lead Marketing and Communications",
    excerpt:
      "A new chapter in Seattle at Summation, bringing together AI, strategy, writing, and the work of making complex technology useful to real people.",
    category: "Update",
    published: "2026-08-22",
    updated: "2026-08-22",
    displayDate: "August 22, 2026",
    readingTime: "3 min read",
    image: "/webpreview-linkedin.png",
    imageAlt: "Isaac Seiler portfolio portrait and profile preview",
    keywords: [
      "Isaac Seiler",
      "Summation",
      "Summation AI",
      "AI marketing",
      "AI communications",
      "Seattle AI",
      "enterprise AI",
      "technology strategy",
    ],
    about: ["Summation", "artificial intelligence", "marketing", "communications", "Seattle"],
    sections: [
      {
        heading: "The new role",
        paragraphs: [
          "I’m joining Summation in Seattle to lead marketing and communications. Summation is a decision-grade AI company that connects to live business data and helps enterprise teams understand what changed, why it happened, and what to do next.",
          "The role brings together the parts of my work I care about most: understanding new technology, finding the clearest language for it, and building the systems that help useful ideas reach the people who can act on them.",
        ],
      },
      {
        heading: "Why this work fits",
        paragraphs: [
          "My path into AI has not been a traditional technical one. I have approached the field through education, public institutions, product feedback, journalism research, and communications. Across those settings, the same challenge keeps appearing: powerful tools do not create value by themselves. People need context, trust, and a practical reason to use them.",
          "That translation layer matters even more in enterprise AI. Leaders need answers that can be traced to real data and communicated clearly enough to support consequential decisions. Marketing that work well requires accuracy, judgment, and a close understanding of both the product and the people it serves.",
        ],
      },
      {
        heading: "What I bring forward",
        paragraphs: [
          "Before Summation, I managed communications for a Member of Congress, helped build a new congressional office, conducted international research on AI and the Internet, and published education work with OpenAI. I also built a public index of generative AI adoption across U.S. states and territories.",
          "I’m bringing those experiences into a company focused on making AI analysis more trustworthy and more useful. It is a new chapter, but it follows the same throughline: connecting complex systems to human decisions through clear communication.",
        ],
        links: [{ label: "Learn about Summation", href: "https://www.summation.com/" }],
      },
    ],
  },
  {
    slug: "openai-student-collective-student-led-ai-learning",
    title: "What the OpenAI Student Collective Signals for Student-Led AI Learning",
    excerpt:
      "OpenAI’s new Student Collective points toward a practical model for campus AI learning: peer-led workshops, studio time, projects, and visible outcomes.",
    category: "AI Education",
    published: "2026-08-22",
    updated: "2026-08-22",
    displayDate: "August 22, 2026",
    readingTime: "5 min read",
    image: "/project-images/chatlab.jpg",
    imageAlt: "Educators participating in the Fulbright Taiwan ChatGPT Lab",
    keywords: [
      "OpenAI Student Collective",
      "OpenAI Campus Lead",
      "ChatGPT Lab",
      "student-led AI",
      "AI education",
      "ChatGPT for students",
      "Codex for students",
      "campus AI community",
    ],
    about: ["OpenAI Student Collective", "ChatGPT Lab", "AI education", "student communities"],
    sections: [
      {
        heading: "A peer-led model for learning AI",
        paragraphs: [
          "OpenAI’s Student Collective is a campus program built around a simple idea: students often learn new tools best by building alongside other students. Campus Leads organize workshops, weekly studio hours, project showcases, and an ongoing community for people from different fields.",
          "That structure is notable because it treats AI literacy as a social practice rather than a one-time product demonstration. A workshop can create confidence, but repeated studio time gives people space to test ideas, ask better questions, and turn an initial experiment into something they can show.",
        ],
      },
      {
        heading: "How this connects to my ChatGPT Lab experience",
        paragraphs: [
          "My connection to this work comes from an earlier OpenAI student initiative: I joined the first cohort of OpenAI’s ChatGPT Lab, tested new ChatGPT products, contributed practical use cases, and shared structured feedback with product and go-to-market teams.",
          "I also created an OpenAI-supported educator lab during my Fulbright year in Taiwan. Across six applied sessions, the most useful conversations were rarely about AI in the abstract. They focused on real work: lesson planning, feedback, language support, research, verification, and the judgment required to know when a tool should not be used.",
        ],
      },
      {
        heading: "What strong campus AI communities need",
        paragraphs: [
          "The Student Collective’s workshop, studio, showcase, and community model reflects several conditions that make practical AI learning more durable.",
        ],
        bullets: [
          "A welcoming entry point for students who are curious but not technical.",
          "Time to build and revise, not only watch a demonstration.",
          "Examples grounded in different majors, goals, and levels of experience.",
          "Visible projects that help peers learn from one another.",
          "Honest discussion of verification, limitations, and responsible use.",
        ],
      },
      {
        heading: "The larger opportunity",
        paragraphs: [
          "Students will help decide whether AI becomes another layer of passive software or a tool for more ambitious learning and creation. Programs such as the OpenAI Student Collective can make that choice more concrete by giving students a place to learn together and build in public.",
          "The strongest version of this work will not be measured only by attendance. It will be visible in the confidence students gain, the projects they finish, the questions they learn to ask, and the communities that remain after a single event ends.",
        ],
        links: [
          { label: "OpenAI Student Collective", href: "https://openai.com/student-collective/" },
          { label: "My Fulbright Taiwan ChatGPT Lab", href: "/projects/fulbright-focus-group-sponsored-by-openai" },
        ],
      },
    ],
  },
  {
    slug: "chatgpt-lab-ai-education-use-cases",
    title: "From ChatGPT Lab to the Classroom: Practical AI Education Use Cases",
    excerpt:
      "The most useful AI education begins with real tasks, clear limits, and enough context for teachers and students to exercise judgment.",
    category: "OpenAI",
    published: "2026-08-22",
    updated: "2026-08-22",
    displayDate: "August 22, 2026",
    readingTime: "5 min read",
    image: "/project-images/ai-classroom.jpg",
    imageAlt: "Isaac Seiler presenting an AI literacy workshop for educators",
    keywords: [
      "ChatGPT Lab",
      "OpenAI",
      "OpenAI for Education",
      "ChatGPT for Education",
      "AI education",
      "AI literacy",
      "teacher AI training",
      "student AI use cases",
    ],
    about: ["OpenAI", "ChatGPT Lab", "AI education", "teacher training", "AI literacy"],
    sections: [
      {
        heading: "Start with the work people already do",
        paragraphs: [
          "Many conversations about AI in education begin with a model’s capabilities. My experience in OpenAI’s ChatGPT Lab and with educators in Taiwan pushed me toward a different starting point: identify the work teachers and students already need to do, then test where ChatGPT can genuinely help.",
          "That approach produced more useful examples because it kept the technology connected to human goals. Teachers did not need another abstract lecture about artificial intelligence. They needed time back, clearer starting points, and workflows they could evaluate against their own classroom judgment.",
        ],
      },
      {
        heading: "Nine categories of practical use",
        paragraphs: [
          "The educator use cases I published with OpenAI included tasks such as adapting lesson material, generating practice questions, supporting language learning, brainstorming activities, clarifying difficult concepts, and creating structured feedback. The value was not in treating the first output as final. It came from using the model as a flexible collaborator inside a process the educator still owned.",
          "The same principle applies to students. ChatGPT can help someone plan, compare approaches, find gaps in an argument, rehearse an explanation, or organize a large task. Those uses are strongest when the student remains responsible for the goal, checks the output, and can explain the final work independently.",
        ],
      },
      {
        heading: "Literacy requires verification",
        paragraphs: [
          "AI literacy is not simply prompt writing. It includes knowing what context to provide, what evidence to request, what information should remain private, how to verify a claim, and when the tool is a poor fit for the task.",
          "That is why practical workshops matter. People need opportunities to see both success and failure, revise their approach, and compare results with peers. Responsible use becomes concrete when it is attached to a real decision rather than a list of generic rules.",
        ],
        links: [
          { label: "OpenAI education publication", href: "https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan" },
          { label: "AI literacy workshop project", href: "/projects/ai-literacy-workshop-for-educators" },
        ],
      },
    ],
  },
  {
    slug: "ai-adoption-state-government-index",
    title: "What a 56-Government Index Revealed About Public-Sector AI Adoption",
    excerpt:
      "A 900-input benchmark turned scattered public information into a clearer picture of AI guidance, training, pilots, governance, and transparency.",
    category: "Research",
    published: "2026-08-22",
    updated: "2026-08-22",
    displayDate: "August 22, 2026",
    readingTime: "4 min read",
    image: "/project-images/aiindex.jpg",
    imageAlt: "Artificial Intelligence in State Government Index preview",
    keywords: [
      "AI",
      "artificial intelligence",
      "AI state government index",
      "public sector AI",
      "generative AI government",
      "AI governance",
      "Council of State Governments",
      "state AI policy",
    ],
    about: ["artificial intelligence", "state government", "AI governance", "public policy"],
    sections: [
      {
        heading: "Turning a fragmented landscape into evidence",
        paragraphs: [
          "State governments were responding to generative AI through guidance, training, pilots, sandboxes, task forces, and new governance structures, but the public evidence was scattered across dozens of websites and documents. I built an index with the Council of State Governments to make that landscape easier to compare.",
          "The project assembled roughly 900 inputs across 56 states and territories. A normalized rubric scored 15 publicly verifiable adoption signals, pairing a preparedness score with state-by-state analysis and a roadmap for policymakers.",
        ],
      },
      {
        heading: "The headline finding",
        paragraphs: [
          "Most states scored below 50 out of 100, and only a small group cleared 80. That did not mean governments were ignoring AI. It showed that adoption was early, uneven, and often difficult for the public to see.",
          "Some states had strong employee guidance but little public evidence of training. Others had pilots without clear governance or transparency. The index made those differences legible and created a baseline that future work can revisit.",
        ],
      },
      {
        heading: "Why public benchmarks matter",
        paragraphs: [
          "AI policy discussions often move faster than implementation. A benchmark cannot resolve every question, but it can separate announced ambition from visible institutional capacity. It can also show leaders which practical steps—training, guidance, pilots, public reporting, and accountable governance—are missing.",
          "For citizens, transparency makes it possible to understand how public institutions are using consequential technology. For state leaders, comparison creates a practical roadmap grounded in evidence rather than hype.",
        ],
        links: [
          { label: "Explore the AI State Government Index project", href: "/projects/artificial-intelligence-in-state-government-index" },
        ],
      },
    ],
  },
  {
    slug: "truman-scholar-washu-rhodes-finalist-public-service-ai",
    title: "From WashU and the Truman Scholarship to Public-Interest AI Work",
    excerpt:
      "How public service, journalism, the Truman Scholarship, a Rhodes finalist selection, and WashU shaped a practical approach to AI.",
    category: "Profile",
    published: "2026-08-22",
    updated: "2026-08-22",
    displayDate: "August 22, 2026",
    readingTime: "4 min read",
    image: "/experience/washu2.jpg",
    imageAlt: "Isaac Seiler at Washington University in St. Louis",
    keywords: [
      "Isaac Seiler",
      "Truman Scholar",
      "Truman Scholarship",
      "WashU",
      "Washington University in St. Louis",
      "Rhodes Scholarship",
      "Rhodes Scholarship finalist",
      "Fulbright Scholar",
      "public service AI",
    ],
    about: ["Truman Scholarship", "Washington University in St. Louis", "Rhodes Scholarship", "public service"],
    sections: [
      {
        heading: "A public-service foundation",
        paragraphs: [
          "I came to AI through public service, communications, and journalism rather than computer science. Before graduating from Washington University in St. Louis, I had worked on a congressional campaign, helped build a new U.S. House office, reported on campus politics, and researched how digital platforms were changing local journalism.",
          "Those experiences made technology feel less like a separate industry and more like infrastructure that shapes institutions, public trust, work, and daily life. They also made me interested in the gap between what a system can do and whether people can use it responsibly.",
        ],
      },
      {
        heading: "Truman, Rhodes, and WashU",
        paragraphs: [
          "In 2024, I was selected as a Truman Scholar, a national award supporting students committed to public service. Later that year, WashU named me a Rhodes Scholarship finalist. I graduated summa cum laude after studying sociology and political science and completing honors research on AI, platforms, and local journalism.",
          "The recognitions mattered because they connected work that could otherwise look unrelated: communications, policy, journalism, research, and institution building. The common thread was a commitment to public impact and the practical systems that make it possible.",
        ],
      },
      {
        heading: "Carrying that perspective into AI",
        paragraphs: [
          "Since WashU, I have built a public benchmark of AI adoption across state governments, joined OpenAI’s ChatGPT Lab, led an OpenAI-supported educator lab during a Fulbright year in Taiwan, and moved into marketing and communications at Summation.",
          "The questions I bring to AI are still public-service questions: Who can use this? What evidence can they trust? What institutions need to change? How do we communicate the technology without overstating it? Those questions shape both my research and the work I want to keep doing.",
        ],
        links: [
          { label: "WashU profile", href: "https://artsci.washu.edu/ampersand/isaac-seiler-setting-his-sights-high" },
          { label: "Truman Scholarship announcement", href: "https://source.washu.edu/2024/04/junior-seiler-awarded-truman-scholarship/" },
          { label: "Rhodes finalist announcement", href: "https://source.washu.edu/2024/11/seniors-darden-seiler-were-rhodes-scholars-finalists/" },
        ],
      },
    ],
  },
];

export const latestItemBySlug = (slug: string | undefined) =>
  latestItems.find((item) => item.slug === slug);
