import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const RESUME_HREF = "/isaac-seiler-resume.pdf";
const pageVariants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.055,
    },
  },
};
const panelVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.48, ease: EASE_TEXT },
  },
};

const metrics = [
  { value: "56", label: "states and territories in an AI adoption index" },
  { value: "900", label: "inputs cleaned, scored, and normalized" },
  { value: "250+", label: "educators reached in an LLM fundamentals workshop" },
  { value: "100+", label: "pages of honors research on AI and local news" },
  { value: "350K", label: "weekly reach supported for a new House office" },
  { value: "80%", label: "open rate for an internal newsletter system" },
];

const strengths = [
  {
    title: "Translation",
    text: "I can sit with technical material, institutional constraints, and ordinary users, then turn the whole thing into language people can act on.",
  },
  {
    title: "Writing judgment",
    text: "I write for voters, reporters, executives, educators, students, and product teams with the same bias toward clarity, accuracy, and taste.",
  },
  {
    title: "Operating rhythm",
    text: "I turn loose goals into workflows, benchmarks, partner lists, launch feedback, newsletters, and shipped work without needing much hand-holding.",
  },
  {
    title: "Fast learning",
    text: "I learn quickly, test honestly, and make new tools useful early, while staying candid about what is proven, what is guessed, and what still needs reps.",
  },
];

const evidence = [
  {
    org: "Summation",
    role: "Marketing and communications",
    proof: "Lead marketing and communications for a Seattle-area company building decision-grade AI for enterprise teams.",
  },
  {
    org: "OpenAI",
    role: "ChatGPT Lab",
    proof: "Test new ChatGPT products and give structured feedback to product and go-to-market teams; contributed to 100 Chats.",
  },
  {
    org: "Fulbright Taiwan",
    role: "AI literacy and education",
    proof: "Created an OpenAI-supported educator lab, designed six applied sessions, and led an LLM fundamentals workshop for 250+ educators.",
  },
  {
    org: "Council of State Governments",
    role: "AI adoption research",
    proof: "Built a 900-input public benchmark comparing generative AI adoption signals across 56 states and territories.",
  },
  {
    org: "Boehringer Ingelheim",
    role: "Communications and operations",
    proof: "Supported rebrand and strategy work, built an 80% open-rate newsletter system, and improved employee volunteering communications.",
  },
  {
    org: "U.S. House and campaigns",
    role: "High-pressure public comms",
    proof: "Helped stand up a new congressional office, supported 350K weekly reach, and ran campaign digital and events work.",
  },
  {
    org: "WashU and journalism",
    role: "Research and public-interest writing",
    proof: "Wrote a 100+ page honors thesis on AI, platforms, and local journalism; reported on politics, protest, and governance.",
  },
];

const fit = [
  "AI product, education, policy, or adoption work.",
  "GTM, comms, or launch work that needs judgment.",
  "Ops or strategy roles that reward writing and follow-through.",
];

const recognitions = ["Fulbright Scholar", "Truman Scholar", "Rhodes finalist", "OpenAI ChatGPT Lab"];
const mobileEvidence = [
  "Summation AI marketing and communications.",
  "OpenAI product and GTM feedback.",
  "Fulbright AI literacy in Taiwan.",
  "CSG state AI adoption benchmark.",
  "House, campaign, and internal comms systems.",
];

const Panel = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <motion.section variants={panelVariants} className={`site-corner min-h-0 overflow-hidden border border-foreground/10 bg-background ${className}`}>
    {children}
  </motion.section>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/42">{children}</p>
);

const CredentialCtas = ({ compact = false }: { compact?: boolean }) => {
  const items = [
    { label: "Resume", href: RESUME_HREF, download: true },
    { label: "Experience", href: "/experience" },
  ];

  const ctaContent = (label: string, index: number) => (
    <div
      className={`homepage-cta relative flex w-full cursor-pointer items-center justify-center bg-primary font-mono uppercase transition-colors duration-300 group-hover:bg-accent group-focus-visible:bg-accent ${
        compact ? "py-2.5 text-[10px] tracking-[0.16em]" : "py-3 text-sm tracking-[0.2em]"
      } ${index === 0 ? "rounded-r-none" : "rounded-l-none"}`}
    >
      <span className="flex min-w-0 items-center justify-center">
        <span className="truncate">{label}</span>
        <span className="inline-flex max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-[2rem] group-hover:opacity-100 group-focus-visible:max-w-[2rem] group-focus-visible:opacity-100">
          <ArrowUpRight className="ml-2 h-4 w-4 shrink-0" strokeWidth={1.5} />
        </span>
      </span>
    </div>
  );

  return (
    <div className="flex w-full gap-[3px] overflow-hidden site-corner">
      {items.map((item, index) =>
        item.download ? (
          <a key={item.href} href={item.href} download className="work-cta-link group block min-w-0">
            {ctaContent(item.label, index)}
          </a>
        ) : (
          <Link key={item.href} to={item.href} className="work-cta-link group block min-w-0">
            {ctaContent(item.label, index)}
          </Link>
        ),
      )}
    </div>
  );
};

const CredentialsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeStrength, setActiveStrength] = useState(0);
  const [activeEvidence, setActiveEvidence] = useState(0);
  const isMobile = useIsMobile();

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className="relative h-[100svh] overflow-hidden bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
      />

      <motion.div
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 200 : 0,
          marginRight: searchOpen && !isMobile ? 200 : 0,
          width:
            sidebarOpen && !isMobile
              ? "calc(100% - 200px)"
              : searchOpen && !isMobile
                ? "calc(100% - 200px)"
                : "100%",
        }}
        transition={{ duration: 0.56, ease: EASE_TEXT }}
        className="h-full min-w-0 overflow-hidden"
      >
        <main className="h-full overflow-hidden px-4 pb-4 pt-20 sm:px-5 sm:pb-5 sm:pt-24 lg:px-6 lg:pb-6 [@media(max-height:760px)]:pb-3 [@media(max-height:760px)]:pt-16 lg:[@media(max-height:760px)]:pt-20">
          <motion.div
            className="grid h-full min-h-0 grid-rows-[minmax(0,0.35fr)_minmax(0,0.18fr)_minmax(0,0.24fr)_minmax(0,0.23fr)] gap-3 [@media(max-height:760px)]:grid-rows-[minmax(0,0.31fr)_minmax(0,0.18fr)_minmax(0,0.27fr)_minmax(0,0.24fr)] [@media(max-height:760px)]:gap-2 lg:hidden"
            variants={pageVariants}
            initial="hidden"
            animate="show"
          >
            <Panel className="p-4 [@media(max-height:760px)]:p-3">
              <div>
                <h1 className="pb-2 text-[2rem] font-semibold leading-[1.15] tracking-tight text-foreground [@media(max-height:760px)]:text-[1.55rem]">
                  I help new technology make sense to real people.
                </h1>
                <p className="mt-3 text-[12px] leading-snug text-foreground/64 [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-[10px]">
                  Research, communication, and operations for AI and public-facing work.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 [@media(max-height:760px)]:hidden">
                {["Fulbright", "Truman", "Rhodes finalist", "OpenAI Lab"].map((item) => (
                  <span key={item} className="site-corner border border-foreground/10 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-foreground/58">
                    {item}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel className="p-3 [@media(max-height:760px)]:p-2">
              <div className="grid h-full grid-cols-3 gap-2">
                {metrics.slice(0, 6).map((metric) => (
                  <div key={metric.label} className="min-w-0">
                    <div className="font-sans text-[1.45rem] font-semibold leading-none tracking-tight text-foreground [@media(max-height:760px)]:text-[1.22rem]">{metric.value}</div>
                    <p className="mt-1 text-[8px] uppercase leading-tight tracking-[0.08em] text-foreground/54 [@media(max-height:760px)]:text-[6.8px]">
                      {metric.label.split(" ").slice(0, 2).join(" ")}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-4 [@media(max-height:760px)]:p-3">
              <Label>Evidence</Label>
              <div className="mt-2 divide-y divide-foreground/10 [@media(max-height:760px)]:mt-1.5">
                {mobileEvidence.map((item) => (
                  <motion.p variants={panelVariants} key={item} className="py-2 text-[11px] font-medium leading-tight text-foreground/70 first:pt-0 last:pb-0 [@media(max-height:760px)]:py-1.5 [@media(max-height:760px)]:text-[10px]">
                    {item}
                  </motion.p>
                ))}
              </div>
            </Panel>

            <Panel className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] p-3 [@media(max-height:760px)]:p-2.5">
              <div className="min-h-0">
                <Label>Searching for</Label>
                <p className="mt-2 text-[12px] font-medium leading-tight text-foreground/76 [@media(max-height:760px)]:mt-1.5 [@media(max-height:760px)]:text-[10.5px]">
                  AI adoption, product/GTM feedback, strategy, comms, and ops roles.
                </p>
              </div>
              <CredentialCtas compact />
            </Panel>
          </motion.div>

          <motion.div
            className="hidden h-full min-h-0 gap-4 lg:grid lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] [@media(max-height:760px)]:gap-3"
            variants={pageVariants}
            initial="hidden"
            animate="show"
          >
            <Panel className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 p-6 [@media(max-height:760px)]:gap-3 [@media(max-height:760px)]:p-5">
              <div>
                <h1 className="max-w-3xl pb-2 text-[clamp(2.2rem,4.5vw,5rem)] font-semibold leading-[1.15] tracking-tight text-foreground [@media(max-height:760px)]:text-[clamp(2rem,4vw,4.35rem)]">
                  I help new technology make sense to real people.
                </h1>

                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/66 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:text-[13px] [@media(max-height:760px)]:leading-snug">
                  My work sits between research, communication, and operations. I am strongest when something is vague, technical, or publicly sensitive and needs to become clear enough for people to use.
                </p>
              </div>

              <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
                <Label>Strengths</Label>
                <div className="flex min-h-0 flex-col overflow-hidden" onMouseLeave={() => setActiveStrength(0)}>
                  {strengths.map((item, index) => {
                    const isActive = activeStrength === index;

                    return (
                      <motion.article
                        variants={panelVariants}
                        key={item.title}
                        tabIndex={0}
                        onMouseEnter={() => setActiveStrength(index)}
                        onClick={() => setActiveStrength(index)}
                        onFocus={() => setActiveStrength(index)}
                        animate={{ flex: isActive ? 1.45 : 0.78 }}
                        transition={{ duration: 0.82, ease: EASE_TEXT }}
                        className="grid min-h-0 cursor-default gap-4 overflow-hidden border-t border-foreground/10 py-2.5 first:border-t-0 first:pt-0 md:grid-cols-[7.5rem_minmax(0,1fr)] [@media(max-height:760px)]:py-2"
                      >
                        <h2 className="text-sm font-semibold tracking-tight text-foreground">{item.title}</h2>
                        <motion.p
                          animate={{
                            height: isActive ? "auto" : 0,
                            opacity: isActive ? 1 : 0,
                            y: isActive ? 0 : 4,
                            filter: "blur(0px)",
                          }}
                          transition={{ duration: 0.42, ease: EASE_TEXT }}
                          className="min-h-0 overflow-hidden text-[12px] leading-snug text-foreground/64 [@media(max-height:760px)]:text-[10.5px]"
                        >
                          {item.text}
                        </motion.p>
                      </motion.article>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 [@media(max-height:760px)]:hidden">
                  {recognitions.map((item) => (
                    <span key={item} className="site-corner border border-foreground/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/60">
                      {item}
                    </span>
                  ))}
                </div>

                <CredentialCtas />
              </div>
            </Panel>

            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
              <Panel className="p-4 [@media(max-height:760px)]:p-3">
                <div className="grid grid-cols-3 gap-x-5 gap-y-3 lg:grid-cols-6">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="min-w-0">
                      <div className="font-sans text-[clamp(1.35rem,2.1vw,2.5rem)] font-semibold leading-none tracking-tight text-foreground">
                        {metric.value}
                      </div>
                      <p className="mt-1.5 text-[10px] leading-snug text-foreground/56">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="min-h-0 overflow-hidden p-0">
                <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
                  <div className="border-b border-foreground/10 p-4 [@media(max-height:760px)]:p-3">
                    <Label>Evidence</Label>
                  </div>

                  <div className="flex h-full min-h-0 flex-col overflow-hidden" onMouseLeave={() => setActiveEvidence(0)}>
                    {evidence.map((item, index) => {
                      const isActive = activeEvidence === index;

                      return (
                        <motion.article
                          variants={panelVariants}
                          key={`${item.org}-${item.role}`}
                          tabIndex={0}
                          onMouseEnter={() => setActiveEvidence(index)}
                          onClick={() => setActiveEvidence(index)}
                          onFocus={() => setActiveEvidence(index)}
                          animate={{ flex: isActive ? 1.64 : 0.82 }}
                          transition={{ duration: 0.9, ease: EASE_TEXT }}
                          className="grid min-h-0 cursor-default gap-2 overflow-hidden border-t border-foreground/10 px-4 py-2.5 first:border-t-0 md:grid-cols-[8.25rem_8.5rem_minmax(0,1fr)] md:gap-4 [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:py-2"
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/44 [@media(max-height:760px)]:text-[9px]">{item.org}</p>
                          <h2 className="text-sm font-semibold leading-tight tracking-tight text-foreground [@media(max-height:760px)]:text-[13px]">{item.role}</h2>
                          <motion.p
                            animate={{
                              height: isActive ? "auto" : 0,
                              opacity: isActive ? 1 : 0,
                              y: isActive ? 0 : 5,
                              filter: "blur(0px)",
                            }}
                            transition={{ duration: 0.42, ease: EASE_TEXT }}
                            className="min-h-0 overflow-hidden text-[12px] leading-snug text-foreground/62 md:text-[13px] [@media(max-height:760px)]:text-[10.8px]"
                          >
                            {item.proof}
                          </motion.p>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              </Panel>

              <Panel className="p-4 [@media(max-height:760px)]:p-3">
                <div className="grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)] md:items-start">
                  <Label>Searching for</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {fit.map((item) => (
                      <p key={item} className="text-[12px] font-medium leading-snug text-foreground/72">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </motion.div>
        </main>
      </motion.div>

      <SiteHeader
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        searchOpen={searchOpen}
        onSearchOpen={handleSearchOpen}
        onSearchClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default CredentialsPage;
