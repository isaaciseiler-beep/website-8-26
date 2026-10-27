import { PROFILE_BIO } from "./siteIdentity.mjs";

const PROJECT_IMG_BASE = "/project-images";
const PROJECT_FILE_BASE = "https://pub-fa8ebd83ba8d4bf99e2e7f12e394fc2f.r2.dev";
const CHAT_LAB_ASSET_BASE = "https://pub-5f3b061447bb446f9d4529f2affeb05d.r2.dev/chat-lab";
const CAP_COMMS_ASSET_BASE = "https://pub-5f3b061447bb446f9d4529f2affeb05d.r2.dev/capcomms";
const projectImg = {
  aiClassroom: `${PROJECT_IMG_BASE}/ai-classroom.jpg`,
  aiIndex: `${PROJECT_IMG_BASE}/aiindex.jpg`,
  aiNews: `${PROJECT_IMG_BASE}/ainews.jpg`,
  biCares: `${PROJECT_IMG_BASE}/bicares.jpg`,
  boehStrategy: `${PROJECT_IMG_BASE}/boehstrategy.jpg`,
  capHill: `${PROJECT_IMG_BASE}/caphill.jpg`,
  chatLab: `${PROJECT_IMG_BASE}/chatlab.jpg`,
  congressInterview: `${PROJECT_IMG_BASE}/congressinterview.jpg`,
  firstWebsite: `${PROJECT_IMG_BASE}/firstwebsite.jpg`,
  firstWebsitePreview: `${PROJECT_IMG_BASE}/firstwebsitepreview.jpg`,
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
  wide?: boolean;
}

export interface ProjectSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: ProjectLink[];
  media?: ProjectMedia[];
  overlayHeading?: boolean;
  pullQuote?: string;
  stats?: {
    value: string;
    label: string;
  }[];
}

export interface ProjectMedia {
  type: "image" | "carousel" | "gallery" | "video" | "pdf" | "placeholder" | "x-post";
  src?: string;
  alt?: string;
  caption?: string;
  title?: string;
  href?: string;
  poster?: string;
  fallbackPoster?: string;
  placement?: "top" | "before-links" | "bottom";
  layout?: "full" | "half-left" | "half-right" | "two-up" | "two-up-square" | "three-up";
  placeholderAspect?: "landscape" | "wide" | "portrait" | "square";
  images?: {
    src: string;
    alt: string;
    caption?: string;
  }[];
}

export interface ProjectItem {
  id: string;
  title: string;
  source: "RESEARCH" | "WORK" | "REPORTING" | "PROJECT" | "BLOG";
  year: string;
  summary: string;
  image: string;
  hideHero?: boolean;
  hideSummary?: boolean;
  lead?: string;
  sections: ProjectSection[];
}

export const personName = "Isaac Seiler";

export const bioLines = PROFILE_BIO;

const NEWS_IMG_BASE = "https://pub-0f2ac8ec0d4e41b885a39ae5fd004706.r2.dev";

export const newsItems: NewsItem[] = [
  {
    id: 1,
    source: "Fulbright Taiwan",
    title: "Leading AI Literacy Efforts in Taiwan",
    href: "/projects/fulbright-focus-group-sponsored-by-openai",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/openai-text.png",
    logoAlt: "Fulbright Taiwan",
    imageUrl: projectImg.aiClassroom,
  },
  {
    id: 6,
    source: "Washington University in St. Louis",
    title: "Becoming a Rhodes Scholarship Finalist",
    href: "https://source.washu.edu/2024/11/seniors-darden-seiler-were-rhodes-scholars-finalists/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/WashU.png",
    logoAlt: "WashU",
    imageUrl: `${NEWS_IMG_BASE}/rhodes.png`,
  },
  {
    id: 2,
    source: "Forbes",
    title: "Featured in Forbes: Won Public Service Award",
    href: "https://www.forbes.com/sites/michaeltnietzel/2024/04/13/the-truman-scholars-for-2024-are-announced/",
    logoUrl: "https://pub-e466b845a9ef4344b05811b344fb11e1.r2.dev/Forbes.png",
    logoAlt: "Forbes",
    imageUrl: `${NEWS_IMG_BASE}/truman.png`,
  },
];

export const projectItems: ProjectItem[] = [
  {
    id: "artificial-intelligence-in-state-government-index",
    title: "Mapping the Rise of AI Across State Government",
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
    title: "Building a Congressional Operation from Scratch",
    source: "WORK",
    year: "2023",
    summary:
      "How I helped launch a congressional office and built its press network across local, statewide, and national media.",
    image: `${CAP_COMMS_ASSET_BASE}/0ch.jpeg`,
    hideSummary: true,
    lead:
      "Isaac entered the campaign as an intern. A year later, he was the youngest Communications Director in U.S. congressional history, running a new press operation across local, statewide, and national media.",
    sections: [
      {
        heading: "From the campaign to an empty office",
        overlayHeading: true,
        paragraphs: [
          "During the campaign, Isaac took over digital strategy and operations, managed its online presence, produced public-facing content, and documented the race through photography. After the election, he moved to Washington, D.C. The next task was building an office.",
          "There was no inherited staff, communications system, or established way of working. Isaac helped recruit the initial team, negotiate commercial leases, shape the office's early strategy, and set its first-100-day goals. In less than two months, the team established staffed operations in Washington and West Michigan.",
        ],
        media: [
          {
            type: "image",
            src: `${CAP_COMMS_ASSET_BASE}/1ch.jpeg`,
            alt: "Isaac at a congressional campaign event during the 2022 race.",
            placement: "top",
          },
        ],
      },
      {
        heading: "Building the press list",
        paragraphs: [
          "The new office began without a network of trusted press relationships. Isaac started building one immediately.",
          "He reached local television producers in Grand Rapids, statewide political journalists, Washington correspondents, national policy reporters, trade publications, Spanish-language media, and journalists covering subjects such as immigration, labor, infrastructure, and small business.",
          "The geographic range was intentional. Local reporters understood the district and reached the people the office represented. Statewide outlets placed its work within Michigan politics. National reporters offered a path into larger policy conversations. Isaac built all three layers at the same time.",
          "He learned what individual reporters covered, what made a useful pitch, and how quickly they needed answers. He became a dependable contact for journalists working on deadline while also bringing them stories, interviews, and events. Within a few months, the office had an active press network stretching from West Michigan to Washington.",
        ],
        pullQuote:
          "Isaac built a press network designed to move local stories through regional, statewide, and national outlets while preserving their context.",
      },
      {
        heading: "Turning a West Michigan story into national news",
        overlayHeading: true,
        paragraphs: [
          "The strength of that network became clear when reports emerged that children were working in dangerous conditions at facilities in West Michigan.",
          "Isaac saw that the story extended beyond one company or one region. It raised national questions about migrant children, corporate accountability, and the weakness of federal child-labor penalties. He developed the office's message, planned the press strategy, pitched reporters, prepared interviews, and connected what was happening in West Michigan to proposed federal action.",
          "His outreach secured coverage from The New York Times, Reuters, Bloomberg Law, Slate, MSNBC, and The Dispatch. At home, he kept the story moving through MLive, FOX 17, WWMT, and Michigan Advance.",
          "A local investigation became part of a national conversation. The coverage accompanied bipartisan legislation to increase penalties for child-labor violations and continued as the federal government activated an interagency task force.",
        ],
        pullQuote:
          "The strongest communications systems connect reporting, legislation, and public pressure while a story is still moving.",
        links: [
          { label: "Reuters: Bipartisan bill targets child-labor violations", href: "https://www.reuters.com/world/us/bipartisan-bill-aims-increase-penalties-us-child-labor-violations-2023-03-29/" },
          { label: "The New York Times: Migrant child-labor crackdown", href: "https://www.nytimes.com/2023/02/27/us/biden-child-labor.html" },
          { label: "Bloomberg Law: Congress addresses child-labor laws", href: "https://news.bloomberglaw.com/daily-labor-report/congress-answering-agencies-calls-to-address-child-labor-laws" },
          { label: "FOX 17: Federal task force activated", href: "https://www.fox17online.com/news/local-news/grand-rapids/i-will-not-stand-by-rep-scholten-helps-activate-federal-task-force-on-young-exploited-migrant-workers" },
        ],
      },
      {
        heading: "Reaching different audiences",
        paragraphs: [
          "Child labor became the office's largest national story, but the press network supported a much wider range of work.",
          "Isaac secured national coverage about immigration, the economy, gun violence, faith, and the experience of a new generation entering Congress. The office appeared in reporting from The Washington Post, NBC News, Axios, CNN, The 19th, and The Dispatch.",
          "He also developed regular relationships with Michigan Radio, MLive, FOX 17, WOOD TV, WZZM, WWMT, regional business publications, and Spanish-language media. Those relationships produced coverage of town halls, district visits, infrastructure funding, workforce development, telehealth, childcare, prescription-drug costs, and bipartisan immigration legislation.",
          "Each group of reporters reached a different audience. Isaac built a network that could carry the office's work across the full geographic spectrum, from neighborhood and regional reporting to statewide outlets and major national publications.",
        ],
        links: [
          { label: "Axios: Biden's D.C. crime decision strains House Democrats", href: "https://www.axios.com/2023/03/04/biden-dc-crime-veto-house-democrats" },
          { label: "The Washington Post: A new generation in a divided House", href: "https://www.washingtonpost.com/politics/2023/02/13/freshman-lawmakers-bipartisan-compromise/" },
          { label: "CNN: Michigan voters and the national political picture", href: "https://www.cnn.com/2023/05/05/politics/biden-enthusiasm-michigan-voters/index.html" },
          { label: "The Dispatch: The prospects for immigration reform", href: "https://thedispatch.com/article/does-a-new-immigration-reform-bill-have-a-chance/" },
          { label: "View the full Press Hit List", href: "https://app.notion.com/p/Press-Hit-List-25b96844a3ac4a8abac3d749412938cb", wide: true },
        ],
      },
      {
        heading: "The State of the Union",
        overlayHeading: true,
        paragraphs: [
          "For the 2023 State of the Union, Isaac developed and coordinated a collaboration with fellow Michigan freshman John James.",
          "The two offices represented different parties. The collaboration put them together during one of Washington's most visible nights and offered a straightforward picture of bipartisan cooperation. The resulting content received more than 100,000 views across platforms.",
        ],
        links: [
          { label: "View the State of the Union collaboration", href: "https://x.com/RepScholten/status/1623105756609355776" },
        ],
        media: [
          {
            type: "image",
            src: `${CAP_COMMS_ASSET_BASE}/3ch.jpeg`,
            alt: "Isaac documenting the press scrum at the 2023 State of the Union.",
            placement: "top",
          },
          {
            type: "x-post",
            title: "2023 State of the Union collaboration",
            href: "https://x.com/RepScholten/status/1623105756609355776",
            placement: "before-links",
          },
        ],
      },
      {
        heading: "Making the first 100 days measurable",
        overlayHeading: true,
        paragraphs: [
          "Isaac also led the creation of the office's 100 Day Report. He collected and checked information from across the office, chose which results to highlight, wrote the narrative, designed the report, and coordinated its release to reporters and stakeholders.",
          "The numbers belonged to the full team. Isaac's job was to make sure they were accurate, understandable, and available to the public. The report gave his growing press network a useful account of the office's first months and gave constituents a direct way to evaluate its work.",
        ],
        stats: [
          { value: "$4M+", label: "returned to constituents" },
          { value: "550", label: "constituent cases opened" },
          { value: "9,569", label: "constituent responses" },
          { value: "300+", label: "meetings and site visits" },
          { value: "51", label: "bills cosponsored" },
        ],
        links: [
          { label: "Read the 100 Day Report", href: "https://drive.google.com/file/d/1gdSr7RjjmidqJkLTWkyIbesVPIkECizn/view" },
        ],
      },
      {
        heading: "What the work added up to",
        overlayHeading: true,
        paragraphs: [
          "By June 2023, Isaac had helped move a congressional operation from campaign mode into public service. He helped establish the team, shape its early strategy, create its public voice, and build a press network spanning local, statewide, and national media.",
          "That network gave local stories a route into national coverage and gave national policy a way back to the district. It helped a new office become visible quickly without losing its connection to the people it represented.",
          "Isaac's contribution was later recognized in the Congressional Record, which cited his work establishing the office, producing constituent newsletters, securing media appearances, responding to difficult questions, and helping people understand what their congressional office was doing.",
        ],
        links: [
          { label: "Read the Congressional Record entry", href: "https://www.congress.gov/118/crec/2023/05/30/169/92/CREC-2023-05-30-pt1-PgE504-3.pdf" },
        ],
        media: [
          {
            type: "image",
            src: projectImg.capHill,
            alt: "Isaac speaking with a congressional colleague outside the United States Capitol.",
            placement: "top",
          },
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
    title: "Investigating AI’s Impact on Journalism in Australia",
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
    title: "Leading AI Literacy Efforts in Taiwan",
    source: "PROJECT",
    year: "2025",
    summary:
      "I pitched a local program for educators in Taiwan, then led six sessions and shared what we learned through OpenAI's education newsletter and an international conference.",
    image: projectImg.chatLab,
    lead:
      "During my Fulbright year in Taiwan, I kept noticing a gap between the general conversation about AI in education and the questions educators were actually asking.",
    sections: [
      {
        heading: "From the Idea to the Lab",
        paragraphs: [
          "Many people in my community were either skeptical of AI or unsure how to use it well.",
          "I was already participating in OpenAI's ChatGPT Lab, so I pitched the team on extending that work into a local program for educators in Taiwan. With support from OpenAI and ChatGPT for Education, it became one of the first Local Labs to run.",
        ],
      },
      {
        heading: "Building a Program Where People Learned From Each Other",
        paragraphs: [
          "My first goal was to create a space where educators could learn from one another. Then I wanted to tell the story of what we learned so others could benefit.",
          "I designed the Lab as six sessions covering AI fundamentals. We focused on work educators already had in front of them: preparing lessons, giving feedback, supporting language learning, and deciding when an AI tool would create more problems than it solved.",
          "I paid attention to where people saw immediate value, where they became skeptical, and which examples still made sense.",
          "Participant questions changed what I emphasized in later sessions. We spent less time talking about ChatGPT in the abstract and more time on when and how educators should choose to use it.",
          "By the final sessions, the program reflected more than the structure I had started with. It reflected the concerns and experience of the educators who participated in the program.",
        ],
        pullQuote: "I was not just showing people how to use a tool. I was learning how they understood it, what they wanted from it, and where they drew their own boundaries around responsible use.",
      },
      {
        heading: "Turning What We Learned Into Public Value",
        paragraphs: [
          "I reviewed the use cases I had gathered and turned them into nine practical ChatGPT use cases that could apply across different educational environments.",
          "I wrote the final piece, which OpenAI's ChatGPT for Education Substack published.",
          "What started as a conversation among a small group of English educators in Taiwan became something others could read, debate, add to, and adapt for themselves.",
        ],
        links: [
          { label: "Read the recap published with OpenAI", href: "https://edunewsletter.openai.com/p/top-chats-from-the-fulbright-taiwan" },
        ],
      },
      {
        heading: "Delivering What We Learned to a Broader Audience",
        paragraphs: [
          "After the program concluded, I used what I learned to build an LLM fundamentals and alignment workshop for an international education conference in Taiwan with more than 250 attendees.",
          "The Lab had given people six sessions to experiment, come back, and build trust with one another. At the conference, I had one workshop to give a much broader audience enough context to understand both the possibilities and the limits.",
          "I focused on the questions that had surfaced most often: how language models work and how educators can use them without handing over their own judgment. For the latter, I directly cited uses identified by Lab participants.",
        ],
        media: [
          {
            type: "image",
            placement: "top",
            src: projectImg.aiClassroom,
            alt: "Isaac Seiler presenting an AI workshop at an international education conference in Taiwan",
          },
        ],
      },
      {
        heading: "What I Learned",
        paragraphs: [
          "Ultimately, I learned two big lessons.",
          "First, the best learning happens in community, with people learning from one another. If I had designed the workshops as a lecture series, the value would have ended when the workshops did.",
          "Second, the program reinforced my belief that durable AI adoption starts from the bottom up. Lab participants represented opinions from across the spectrum, from early AI adopters to AI skeptics. By the end of the program, participants had found ways to use AI in their work to improve their impact.",
        ],
        pullQuote: "The best learning happens in community, with people learning from one another.",
      },
      {
        heading: "Program materials",
        links: [
          { label: "Explore the program workspace", href: "https://notion.so/ChatGPT-Lab-x-Fulbright-Taiwan-261aaef174d680579138e8c1c658ab41" },
          { label: "See the program introduction", href: "https://docs.google.com/presentation/d/1ZqOp_1KQte52BNBR5OBmOJThCufkNnBtVLBhNW_rkps/edit?slide=id.g38cd4d0aa4c_0_33#slide=id.g38cd4d0aa4c_0_33" },
          { label: "View the conference workshop", href: `${PROJECT_FILE_BASE}/Artificial%20Intelligence%20in%20the%20Classroom.pdf` },
        ],
      },
    ],
  },


  {
    id: "boehringer-cares-foundation-rebrand-strategy-shift",
    title: "Bringing the Boehringer Cares Rebrand to Life",
    source: "WORK",
    year: "2025",
    summary:
      "Implementing a new brand direction across the foundation's website, employee communications, and volunteering programs.",
    image: projectImg.biCares,
    lead:
      "Boehringer Cares had a new rebrand vision. My job was to help turn that vision into finished work employees and the public could actually see and use.",
    sections: [
      {
        heading: "The assignment",
        paragraphs: [
          "The broader team had established a new direction for how Boehringer Cares should present its mission and work. I was responsible for helping implement that direction across the places where employees and the public encountered the foundation.",
          "That meant coordinating details, gathering and organizing information, working with UX and brand colleagues, and making sure the new vision carried through consistently from the website to internal communications.",
        ],
      },
      {
        heading: "From vision to rollout",
        paragraphs: [
          "I collected and organized the information needed for the rollout, then worked with UX and brand strategy teams to apply the new direction to the foundation's website and communications materials.",
          "I did not create the original rebrand vision. My role was to carry it through: helping translate the approved direction into clear copy, updated pages, and a consistent set of materials for the foundation's work.",
        ],
        bullets: [
          "Coordinated with UX and brand colleagues to implement the refreshed website and visual direction.",
          "Organized content and information for the public-facing rollout.",
          "Created more than 25 communications assets using the new brand direction.",
        ],
      },
      {
        heading: "Carrying the rebrand inside the company",
        paragraphs: [
          "The website was only one part of the rollout. I also built a company-wide newsletter and updated internal messaging around volunteering so employees encountered the same voice and visual direction after the launch.",
          "This ongoing work helped keep the rebrand consistent across announcements, program updates, volunteering communications, and impact stories.",
        ],
      },
      {
        heading: "Results",
        stats: [
          { value: "25%", label: "increase in annual employee volunteering" },
          { value: "80%", label: "company-wide newsletter open rate" },
          { value: "25+", label: "cross-functional communications assets shipped" },
        ],
        paragraphs: [
          "During the 2025 rollout, annual employee volunteering increased by 25%. The company-wide newsletter reached an 80% open rate and became a reliable way to share opportunities, updates, and impact stories.",
          "The result was a rebrand that showed up consistently in the foundation's public presence and in the communications employees received throughout the year.",
        ],
      },
      {
        heading: "See the work",
        links: [
          { label: "Visit the refreshed Boehringer Cares website", href: "https://www.boehringer-ingelheim.com/us/boehringer-ingelheim-cares-foundation" },
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
    title: "Helping Shape OpenAI's Products Before Launch",
    source: "PROJECT",
    year: "2025–Present",
    summary:
      "Inside my work with OpenAI's first ChatGPT Lab: testing products before release, pressure-testing student use cases, contributing to launch campaigns, and turning 100 real workflows into a published book.",
    image: projectImg.chatLab,
    hideHero: true,
    sections: [
      {
        heading: "A seat close to the product",
        paragraphs: [
          "In spring 2025, I joined the first cohort of OpenAI's ChatGPT Lab. I came in as a student, researcher, and very heavy ChatGPT user—not as an engineer. My job was to notice what felt useful, what broke down, and what would make a new product make sense to people like me.",
          "The work moved between product diaries, feedback sessions, launch campaigns, and public stories. I also had the chance to work with Hillary Bush and other OpenAI leaders, bringing a student and early-career perspective into product and go-to-market conversations.",
          "What follows is the product-by-product version: what I tested, what I pushed on, and what eventually made it into the world.",
        ],
      },
      {
        heading: "100 Chats: turning behavior into a book",
        paragraphs: [
          "The first big project asked a deceptively simple question: what are college students actually using ChatGPT for? Together, the Lab built a collection of 100 real workflows—less a prompt library than a snapshot of how students were learning, creating, researching, and getting unstuck.",
          "My contributions came from the places I was already using ChatGPT: research, writing, policy, and the small technical problems that can derail a day. I helped turn those examples into a public book and story that other students could recognize themselves in.",
        ],
        bullets: [
          "Explaining a complex news-media bargaining policy from ten different angles.",
          "Generating stronger academic titles and a clean first-pass abstract.",
          "Making sense of a statistical correlation in my electric-vehicle research.",
          "Turning an opaque error message into a practical next step.",
        ],
        links: [
          { label: "Explore the 100 Chats Project", href: "https://chatgpt.com/100chats-project" },
          { label: "Read 100 ways college students use ChatGPT", href: "https://edunewsletter.openai.com/p/100-ways-college-students-are-using" },
        ],
        media: [
          {
            type: "image",
            layout: "full",
            placement: "top",
            src: `${CHAT_LAB_ASSET_BASE}/chatgpt-100-chats-cover.png`,
            alt: "Cover artwork for the ChatGPT 100 Chats project",
          },
          {
            type: "image",
            layout: "full",
            placement: "before-links",
            src: `${CHAT_LAB_ASSET_BASE}/chatgpt-100-chats-chat-4.png`,
            alt: "One of Isaac's contributed chats in the 100 Chats project",
          },
        ],
      },
      {
        heading: "Study Mode: making ChatGPT teach, not answer",
        paragraphs: [
          "Study Mode was the clearest test of a tension I had felt as both a student and teaching assistant: an answer can be correct and still short-circuit the learning.",
          "I used the early experience to think through graduate school and a five-year career plan. I liked that it made me supply the substance instead of pretending the model knew what I wanted. My biggest push was about the ending: good Socratic questions still need to help a user land the plane.",
          "When Study Mode launched, OpenAI highlighted my use case in its student storytelling. It was satisfying to see a product move toward the kind of critical engagement I had wanted from it in testing.",
        ],
        links: [
          { label: "Explore Study Mode at OpenAI", href: "https://openai.com/index/chatgpt-study-mode/" },
          { label: "Watch the ChatGPT Instagram feature", href: "https://www.instagram.com/chatgpt/reel/DNyG5VvXEZM/" },
          { label: "Read my launch reflection", href: "https://www.linkedin.com/posts/isaacseiler_this-is-a-game-changer-for-studentsand-learners-activity-7356073209227603973-IpU6" },
        ],
        media: [
          {
            type: "image",
            src: `${CHAT_LAB_ASSET_BASE}/OpenAI_StudyMode_Flow_7-29-2508576550.png`,
            alt: "OpenAI Study Mode product flow",
            layout: "full",
            placement: "top",
          },
        ],
      },
      {
        heading: "Back to School: translating a product into campus life",
        paragraphs: [
          "The Back-to-School work was separate from Study Mode. This was not about changing how the product reasoned; it was about making the broader campaign feel like it understood what students were actually trying to do.",
          "I reviewed campaign concepts and prompt cards, pushed for more career and professional-development examples, and contributed a real prompt about finding a policy internship in Washington, D.C. I also gave feedback on how physical campus activations could feel participatory instead of promotional.",
          "That distinction mattered to me. A strong education product and a strong student campaign solve different problems, even when they launch in the same season.",
        ],
        links: [
          { label: "Explore OpenAI for Education", href: "https://openai.com/education/" },
        ],
        media: [
          {
            type: "image",
            src: `${CHAT_LAB_ASSET_BASE}/backtoschool.avif`,
            alt: "ChatGPT Back-to-School campaign creative",
            layout: "full",
            placement: "top",
          },
        ],
      },
      {
        heading: "Pulse: when ChatGPT starts the conversation",
        paragraphs: [
          "Pulse flipped the usual interaction: instead of opening ChatGPT with a question, I woke up to personalized research waiting for me. Over several days, I tested how that felt in ordinary life—news, career planning, creative work, travel, and the logistics of moving to Taiwan.",
          "The moments of real personalization felt like magic. My feedback focused on making those moments easier to find and trust: a more visible home for Pulse, compact cards, clearer sources, better preference controls, and fewer canned acknowledgements.",
          "OpenAI's launch story featured my experience using calendar context to catch an unused day of PTO and turn it into a plan. That small example captured the promise for me: proactive AI should help me act, not just give me more to scroll.",
        ],
        links: [
          { label: "Meet ChatGPT Pulse", href: "https://openai.com/index/introducing-chatgpt-pulse/" },
        ],
        media: [
          {
            type: "gallery",
            layout: "two-up-square",
            placement: "top",
            images: [
              { src: `${CHAT_LAB_ASSET_BASE}/pulse1.webp`, alt: "ChatGPT Pulse personalized update" },
              { src: `${CHAT_LAB_ASSET_BASE}/pulse3.webp`, alt: "ChatGPT Pulse mobile experience" },
            ],
          },
        ],
      },
      {
        heading: "Atlas: rethinking the browser",
        paragraphs: [
          "For OpenAI's browser work, I tested a basic premise: what changes when the assistant understands the page you are already on? I used early builds for travel research, translating Mandarin-language pages, comparing options, and turning scattered findings into an itinerary or map.",
          "I kept coming back to the seam between browsing and chatting. I wanted fewer moments where the two felt like separate products, more control over the model doing the work, and recommendations that looked useful rather than ad-like.",
          "The most convincing experiences were not grand. They were the minutes saved moving between a page, a question, and a decision.",
        ],
        links: [
          { label: "Meet ChatGPT Atlas", href: "https://openai.com/index/introducing-chatgpt-atlas/" },
        ],
        media: [
          {
            type: "video",
            placement: "top",
            title: "Introducing ChatGPT Atlas",
            href: "https://openai.com/index/introducing-chatgpt-atlas/?video=1129227761",
            poster: `${CHAT_LAB_ASSET_BASE}/atlas.webp`,
            fallbackPoster: "https://i.ytimg.com/vi/8UWKxJbjriY/maxresdefault.jpg",
          },
          {
            type: "image",
            src: `${CHAT_LAB_ASSET_BASE}/atlas.webp`,
            alt: "ChatGPT Atlas browser experience",
            layout: "half-right",
          },
        ],
      },
      {
        heading: "Group Chats: learning when AI should speak",
        paragraphs: [
          "The early messaging concept started with a question I could not immediately answer: why would I direct-message someone inside ChatGPT? The more interesting version emerged when several people and the assistant shared one room.",
          "I tested the experience as a group facilitator and pushed on the assistant's social judgment. It often participated too little or sounded too canned. I wanted people to be able to tune how active it was—to make ChatGPT a useful collaborator without letting it take over the conversation.",
          "That work reinforced something I saw across every product: intelligence is only part of the design problem. Timing, restraint, and a clear role matter just as much.",
        ],
        links: [
          { label: "Explore group chats in ChatGPT", href: "https://openai.com/index/group-chats-in-chatgpt/" },
        ],
        media: [
          {
            type: "video",
            placement: "top",
            title: "Introducing group chats in ChatGPT",
            href: "https://openai.com/index/group-chats-in-chatgpt/?video=1138973380",
            poster: `${CHAT_LAB_ASSET_BASE}/Group_Chat__Blog__1920x1080__2_.webp`,
          },
        ],
      },
      {
        heading: "What I learned from the Lab",
        paragraphs: [
          "Before the Lab, I thought product feedback mostly meant finding bugs or asking for features. I learned that the more valuable work is often translation: connecting what a team built to the messy way a person is actually trying to learn, plan, or make a decision.",
          "The products were different, but my questions stayed consistent. Does this make the user more capable? Is the source of the answer visible? Does the interface help someone understand what to do next? And does the launch story match the real experience?",
          "That is the work I want to keep doing—somewhere between the people building the technology and the people deciding whether it belongs in their lives.",
        ],
        links: [
          { label: "Read my one-year ChatGPT Lab reflection", href: "https://www.linkedin.com/posts/isaacseiler_its-been-a-year-since-i-interviewed-for-activity-7432119878079340544-qPPf" },
        ],
      },
    ],
  },
];

export const hiddenProjectIds = new Set([
  "stl-immigrant-refugee-support-grant-process",
  "communications-consultancy-supporting-local-candidates",
  "2022-institute-for-nonprofit-news-index-survey",
  "exclusive-interview-with-high-visibility-congressperson",
]);

const workProjectPriority = [
  "artificial-intelligence-in-state-government-index",
  "congressional-office-setup-100-day-report",
  "fulbright-focus-group-sponsored-by-openai",
];

export const orderProjectItemsForWork = (items: ProjectItem[]) => {
  const originalOrder = new Map(items.map((project, index) => [project.id, index]));
  const rank = (project: ProjectItem) => {
    const priorityIndex = workProjectPriority.indexOf(project.id);
    return priorityIndex === -1
      ? workProjectPriority.length + (originalOrder.get(project.id) ?? items.length)
      : priorityIndex;
  };

  return [...items].sort((left, right) => rank(left) - rank(right));
};


export const featuredProjectIds = [
  "artificial-intelligence-in-state-government-index",
  "congressional-office-setup-100-day-report",
  "senior-thesis-local-journalism",
  "boehringer-cares-foundation-rebrand-strategy-shift",
];
