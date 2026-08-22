import { type ComponentType, type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right.js";
import Bot from "lucide-react/dist/esm/icons/bot.js";
import FileText from "lucide-react/dist/esm/icons/file-text.js";
import Newspaper from "lucide-react/dist/esm/icons/newspaper.js";
import Scale from "lucide-react/dist/esm/icons/scale.js";
import Users from "lucide-react/dist/esm/icons/users.js";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";

const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HERO_IMAGE = "https://pub-fa8ebd83ba8d4bf99e2e7f12e394fc2f.r2.dev/newspaperdisp.jpg";
const FULL_TEXT_LINK = "https://drive.google.com/file/d/1Z6-RR1Zw7z2RieJwVHdk0yOtycRIN1ia/view?usp=sharing";
const EDITORIAL_GRID = "grid gap-8 md:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] md:items-start";
const CARD_REVEAL = {
  hidden: { opacity: 0, y: 34, scale: 0.985, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
};

type ReportIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type MethodNote = {
  title: string;
  text: string;
};

type ThemeNote = {
  title: string;
  line: string;
  summary: string;
  reading: string;
  signals: string[];
  icon: ReportIcon;
  color: string;
};

type TableFinding = {
  category: string;
  summary: string;
};

const researchQuestions = [
  "First, what dynamics contribute to the decline of local media outlets in Australia?",
  "Second, how are local journalists' experiences impacted by broader market and technological dynamics?",
  "Finally, what policy solutions in Australia exist to mitigate local news decline? Might they be useful in the U.S. context?",
];

const methodNotes: MethodNote[] = [
  {
    title: "Interviews",
    text: "This study draws on 16 in-depth interviews with current and former journalists, and one expert on journalism, equaling 17 total.",
  },
  {
    title: "Sampling",
    text: "I selected respondents based on their qualifications, location, and current role, with the goal of achieving the most geographically, vocationally, and ideologically diverse sample possible.",
  },
  {
    title: "Transcription and coding",
    text: "I transcribed the interview data with the assistance of the secure AI transcription service, Trint, and manually verified all transcripts before coding them, drawing on the flexible coding method.",
  },
  {
    title: "Aliases",
    text: "Each interview respondent was given an alias, and identifying details were removed where needed so people could speak about employers, platforms, governments, and the industry with candor.",
  },
];

const themes: ThemeNote[] = [
  {
    title: "The Job and Profession",
    line: "It's the social glue stuff.",
    summary:
      "Across the industry and for decades, being a journalist has been defined by insecure employment. Despite this, there is a talent shortage that all newsrooms face, particularly those in regional contexts.",
    reading:
      "Participants told me that failing business models, career turbulence for veteran journalists, and difficulties recruiting new talent all pose significant stressors to the industry. The social cost is the hard part: journalists carry the burden of social cohesion, a difficult job without compensation.",
    signals: ["Insecure employment", "Talent shortage", "Regional newsrooms", "Social cohesion"],
    icon: Users,
    color: "hsl(16 52% 43%)",
  },
  {
    title: "The Business Model",
    line: "The rivers of gold are over.",
    summary:
      "All respondents signaled issues with the traditional newsroom business model. Different journalists and newsrooms debate whether or not print or digital models are the best way forward.",
    reading:
      "The old advertising monopoly, the 'rivers of gold' that fell in the door during the 20th century, may never come back again. Print still serves older regional readers; newsletters reach people directly; subscriptions raise issues of scale and accessibility. It is not clear that there is a consistent, profitable solution.",
    signals: ["Print or digital", "Rivers of gold", "Subscription limits", "Scale and access"],
    icon: Newspaper,
    color: "hsl(46 72% 36%)",
  },
  {
    title: "Digital Platforms and AI",
    line: "AGI is not part of the picture.",
    summary:
      "Journalists see social media as a good tool with limited payoff, especially in regional areas. Most respondents relay negative opinions on Google and Meta.",
    reading:
      "Journalists have been forced to utilize these platforms to make ends meet with minimal return: readers are online because 'that's where everyone is,' while William's July royalties from Meta were $0.01. On AI, the biggest reported concerns regard editorial failures, while there is very limited awareness of AGI, agentic AI, or resulting industry upheaval.",
    signals: ["Google and Meta", "Minimal return", "Facebook groups", "Low AGI awareness"],
    icon: Bot,
    color: "hsl(146 32% 32%)",
  },
  {
    title: "Programmatic and Policy Responses",
    line: "It does set the floor in regional Australia.",
    summary:
      "Respondents credit public broadcasting as the lifeline of the Australian news ecosystem, but see advertising subsidies and the News Media Bargaining Code as different degrees of ineffective or not sustainable.",
    reading:
      "The ABC and SBS play a major role in Australian life and the Australian news ecosystem. The ABC provides a base level of local news in regional Australia, but the News Media Bargaining Code is described as a sugar hit rather than the path to sustainability, and advertising subsidies leave questions about independence, eligibility, and durability.",
    signals: ["ABC and SBS", "News Media Bargaining Code", "Advertising subsidies", "Program limits"],
    icon: FileText,
    color: "hsl(201 46% 35%)",
  },
  {
    title: "Attitudes on Regulation",
    line: "No consensus on a policy solution.",
    summary:
      "Generally, respondents dislike Google and Meta but are skeptical if regulation is plausible or practical. Respondents also generally want government subsidy, but many are not hopeful that large-scale subsidy is possible.",
    reading:
      "Among the journalists I interviewed, there was no consensus on an existing or proposed policy solution that works to mitigate local and regional news decline. Direct cash infusions, advertising subsidies, and platform regulation are controversial and potentially unethical in different ways, muddling the path forward.",
    signals: ["Platform skepticism", "Subsidy desire", "Political caution", "No consensus"],
    icon: Scale,
    color: "hsl(344 34% 37%)",
  },
];

const tableFindings: TableFinding[] = [
  {
    category: "The Job and Profession",
    summary:
      "Across the industry and for decades, being a journalist has been defined by insecure employment. Despite this, there is a talent shortage that all newsrooms face, particularly those in regional contexts. Rural newsrooms also hesitate to hire urban college graduates because of political differences. Finally, I found that journalists carry the burden of social cohesion, a difficult job without compensation.",
  },
  {
    category: "The Business Model",
    summary:
      "All respondents signaled issues with the traditional newsroom business model. Different journalists and newsrooms debate whether or not print or digital models are the best way forward, and it is not clear that there is a consistent, profitable solution. Most respondents did not favor subscription-based models for print or digital, citing issues of scale and accessibility.",
  },
  {
    category: "Implications of Digital Platforms and AI",
    summary:
      "Journalists see social media as a good tool with limited payoff, especially those in regional areas. Most respondents relay negative opinions on Google and Meta. Most of all, journalists are generally unaware of capabilities of AI technologies and tools. Biggest reported concerns regard editorial failures, while there is very limited awareness of AGI, agentic AI, or resulting potential industry upheaval.",
  },
  {
    category: "Programmatic and Policy Responses",
    summary:
      "Respondents credit public broadcasting as the lifeline of the Australian news ecosystem, but see recent interventions like advertising subsides and the NMBC as different degrees of ineffective or not sustainable. Private programmatic solutions present no full-scale solutions to the problems at hand.",
  },
  {
    category: "Attitudes on Regulation",
    summary:
      "Generally, respondents dislike Google and Meta but are skeptical if regulation is plausible or practical. Respondents also generally want government subsidy, but many are not hopeful that large-scale subsidy is possible or are generally wary of long-term subsidy.",
  },
];

const TextReveal = ({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 18, filter: "blur(7px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, amount: 0.38 }}
    transition={{ duration: 0.7, ease: EASE_TEXT, delay }}
  >
    {children}
  </motion.div>
);

const RevealSection = ({
  children,
  className,
  scrollContainerRef,
}: {
  children: ReactNode;
  className?: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: scrollContainerRef,
    offset: ["start end", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const ruleX = useTransform(scrollYProgress, [0, 0.7], ["0%", "100%"]);

  return (
    <motion.section
      ref={sectionRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.72, ease: EASE_TEXT }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px origin-left bg-foreground/12 sm:inset-x-8"
        style={{ scaleX: ruleX }}
      />
      <motion.div className="relative z-10" style={{ y: contentY }}>
        {children}
      </motion.div>
    </motion.section>
  );
};

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
      type="button"
      onClick={onClick}
      className="pill-back "
    >
      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span>Back to work</span>
    </button>
);

const SeniorThesisLocalJournalismPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pageScrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: pageScrollProgress } = useScroll({ container: pageScrollRef });
  const progressScaleX = useSpring(pageScrollProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  return (
    <div
      data-thesis-page
      ref={pageScrollRef}
      className="relative h-[100svh] overflow-y-auto overflow-x-hidden bg-background text-foreground"
    >
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[80] h-[2px] w-full origin-left bg-foreground/70"
        style={{ scaleX: progressScaleX }}
      />

      <motion.div
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 240 : 0,
          marginRight: searchOpen && !isMobile ? 240 : 0,
          width:
            sidebarOpen && !isMobile
              ? "calc(100% - 240px)"
              : searchOpen && !isMobile
                ? "calc(100% - 240px)"
                : "100%",
        }}
        transition={{ duration: 0.56, ease: EASE_TEXT }}
      >
        <motion.main
          className="pb-24"
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.62, ease: EASE_TEXT, delay: 0.08 }}
        >
          <section className="relative bg-background">
            <div className="sticky top-0 z-0 h-[82svh] min-h-[620px] overflow-hidden bg-[#10120f] text-white">
              <motion.img
                src={HERO_IMAGE}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-center"
                initial={{ scale: 1.04, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: EASE_TEXT }}
              />
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,10,8,0)_0%,rgba(8,10,8,0.22)_50%,rgba(8,10,8,0.84)_100%)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease: EASE_TEXT, delay: 0.1 }}
              />

              <div className="absolute inset-x-0 top-0 z-10 px-5 pt-28 sm:px-8">
                <div className="mx-auto max-w-7xl">
                  <BackButton onClick={() => navigate("/?section=projects")} />
                </div>
              </div>

              <motion.div
                className="absolute inset-x-0 bottom-0 z-10 px-5 pb-10 sm:px-8 sm:pb-14"
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.78, ease: EASE_TEXT, delay: 0.18 }}
              >
                <div className="mx-auto max-w-7xl">
                  <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-normal sm:text-7xl lg:text-8xl">
                    Holding the Line
                  </h1>
                  <p className="mt-6 max-w-5xl text-2xl font-semibold leading-tight tracking-normal text-white/90 sm:text-3xl lg:text-4xl">
                    Local journalists' experiences amidst economic crisis and digital transformation in Australia's news
                    ecosystem.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="relative z-20 bg-background px-5 py-12 sm:px-8 lg:py-16">
              <div className="mx-auto max-w-7xl">
                <TextReveal>
                  <div className="max-w-6xl space-y-6">
                    <motion.p
                      className="text-xl leading-relaxed text-foreground/78 sm:text-2xl"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.75 }}
                      transition={{ duration: 0.62, ease: EASE_TEXT }}
                    >
                      This study investigates the recent decline of local journalism in Australia, incorporating
                      insights from the Australian media market to inform policy decisions in the United States.
                    </motion.p>
                    <motion.p
                      className="text-base leading-relaxed text-foreground/64"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.75 }}
                      transition={{ duration: 0.62, ease: EASE_TEXT, delay: 0.08 }}
                    >
                      Drawing on qualitative interviews with 17 Australian journalists, former journalists, and industry
                      experts, I examine how economic and social pressures, digital transformation, workforce
                      challenges, artificial intelligence, and regulatory policies reshape local and regional news
                      providers and individual journalists within the broader social world.
                    </motion.p>
                    <motion.p
                      className="text-base leading-relaxed text-foreground/64"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.75 }}
                      transition={{ duration: 0.62, ease: EASE_TEXT, delay: 0.16 }}
                    >
                      This study focuses on Australia because it is an international leader in legislative fixes to
                      journalism decline, and because, like the United States, it has wide swaths of rural, marginalized
                      populations who are disproportionately affected by the decline of local news infrastructure.
                    </motion.p>
                  </div>
                </TextReveal>
              </div>
            </div>
          </section>

          <RevealSection className="bg-background px-5 py-16 sm:px-8" scrollContainerRef={pageScrollRef}>
            <div className={`mx-auto max-w-7xl ${EDITORIAL_GRID}`}>
              <motion.div
                initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.62, ease: EASE_TEXT }}
              >
                <h2 className="text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
                  Key Questions
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-foreground/62">
                  This research is motivated by three primary research questions: what dynamics contribute to the
                  decline of local media outlets in Australia, how local journalists' experiences are impacted by market
                  and technological dynamics, and whether Australian policy solutions might be useful in the U.S.
                  context.
                </p>
              </motion.div>

              <div className="grid gap-3">
                {researchQuestions.map((question, index) => (
                  <motion.div
                    key={question}
                    className="site-corner grid gap-5 bg-card p-5 sm:grid-cols-[64px_minmax(0,1fr)]"
                    initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    whileHover={{ x: 6 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.58, ease: EASE_TEXT, delay: index * 0.06 }}
                  >
                    <div className="text-4xl font-semibold text-foreground/22">{index + 1}</div>
                    <p className="text-xl leading-snug text-foreground/78">{question}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-5 py-16 sm:px-8" scrollContainerRef={pageScrollRef}>
            <div className={`mx-auto max-w-7xl ${EDITORIAL_GRID}`}>
              <motion.div
                initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.62, ease: EASE_TEXT }}
              >
                <h2 className="text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
                  Methods
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-foreground/62">
                  This study draws on 16 in-depth interviews with current and former journalists, and one expert on
                  journalism, equaling 17 total. I selected respondents based on their qualifications, location, and
                  current role; transcripts were manually verified, anonymized with aliases, and coded using the
                  flexible coding method.
                </p>
              </motion.div>

              <div className="grid gap-3 md:grid-cols-2">
                {methodNotes.map((step, index) => (
                  <motion.article
                    key={step.title}
                    className="site-corner bg-card p-5"
                    variants={CARD_REVEAL}
                    initial="hidden"
                    whileInView="show"
                    whileHover={{ y: -4, scale: 1.01 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.54, ease: EASE_TEXT, delay: index * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-lg font-semibold text-foreground/32">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold leading-tight tracking-normal">{step.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-foreground/62">{step.text}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-5 py-16 sm:px-8" scrollContainerRef={pageScrollRef}>
            <div className="mx-auto max-w-7xl">
              <div className={EDITORIAL_GRID}>
                <motion.div
                  initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.62, ease: EASE_TEXT }}
                >
                  <h2 className="text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
                    Interview Results
                  </h2>
                  <p className="mt-5 text-sm leading-relaxed text-foreground/62">
                    Four main topics arose as central in my interviews: the journalism profession, the business model,
                    the impacts of digital technology, and regulatory and programmatic responses. Entering the
                    interviews, I had three general conjectures, all of which were at least partially disproven; the
                    story is much more complicated, and solutions are sparse.
                  </p>
                </motion.div>

                <div className="grid gap-4">
                  {themes.map((theme, index) => (
                    <motion.article
                      key={theme.title}
                      className="site-corner overflow-hidden bg-card"
                      variants={CARD_REVEAL}
                      initial="hidden"
                      whileInView="show"
                      whileHover={{ y: -3 }}
                      viewport={{ once: true, amount: 0.24 }}
                      transition={{ duration: 0.62, ease: EASE_TEXT, delay: index * 0.04 }}
                    >
                      <div className="grid">
                        <div
                          className="relative flex min-h-[190px] flex-col justify-between p-6 text-white sm:min-h-[220px]"
                          style={{ backgroundColor: theme.color }}
                        >
                          <div className="flex items-start justify-between gap-5">
                            <motion.span
                              className="text-5xl font-semibold leading-none text-white/30"
                              initial={{ opacity: 0, y: -12 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.65 }}
                              transition={{ duration: 0.54, ease: EASE_TEXT, delay: 0.08 }}
                            >
                              {index + 1}
                            </motion.span>
                            <motion.div
                              initial={{ opacity: 0, rotate: -8, scale: 0.9 }}
                              whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                              viewport={{ once: true, amount: 0.65 }}
                              transition={{ duration: 0.54, ease: EASE_TEXT, delay: 0.12 }}
                            >
                              <theme.icon className="h-6 w-6 text-white/72" strokeWidth={1.5} />
                            </motion.div>
                          </div>
                          <motion.p
                            className="max-w-4xl text-3xl font-semibold leading-tight tracking-normal sm:text-4xl"
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.65 }}
                            transition={{ duration: 0.68, ease: EASE_TEXT, delay: 0.16 }}
                          >
                            "{theme.line}"
                          </motion.p>
                        </div>

                        <div className="p-5 sm:p-6">
                          <motion.h3
                            className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.65 }}
                            transition={{ duration: 0.56, ease: EASE_TEXT, delay: 0.06 }}
                          >
                            {theme.title}
                          </motion.h3>
                          <motion.p
                            className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/68"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.65 }}
                            transition={{ duration: 0.56, ease: EASE_TEXT, delay: 0.12 }}
                          >
                            {theme.summary}
                          </motion.p>
                          <motion.p
                            className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground/62"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.65 }}
                            transition={{ duration: 0.56, ease: EASE_TEXT, delay: 0.18 }}
                          >
                            {theme.reading}
                          </motion.p>

                          <div className="mt-6 flex flex-wrap gap-2">
                            {theme.signals.map((signal, signalIndex) => (
                              <motion.span
                                key={signal}
                                className="site-corner border border-foreground/10 bg-background px-3 py-2 text-xs font-medium text-foreground/58"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.65 }}
                                transition={{ duration: 0.44, ease: EASE_TEXT, delay: 0.18 + signalIndex * 0.04 }}
                              >
                                {signal}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-5 py-16 text-foreground sm:px-8 lg:py-20" scrollContainerRef={pageScrollRef}>
            <div className="mx-auto max-w-7xl">
              <div className={EDITORIAL_GRID}>
                <motion.div
                  initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.62, ease: EASE_TEXT }}
                >
                  <h2 className="text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
                    Takeaways
                  </h2>
                  <p className="mt-5 text-sm leading-relaxed text-foreground/62">
                    The summarized findings show insecure work and talent shortages, unresolved print and digital
                    revenue models, limited payoff from platforms, very limited awareness of AGI and agentic AI, public
                    broadcasting as the lifeline of the Australian news ecosystem, and no clear consensus on regulation
                    or subsidy.
                  </p>
                </motion.div>

                <div className="grid gap-3">
                  {tableFindings.map((finding, index) => (
                    <motion.article
                      key={finding.category}
                      className="grid gap-5 border-t border-foreground/12 py-5 md:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)]"
                      initial={{ opacity: 0, y: 18, filter: "blur(7px)" }}
                      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      whileHover={{ x: 4 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.54, ease: EASE_TEXT, delay: index * 0.04 }}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-semibold leading-none text-foreground/22">{index + 1}</span>
                        <h3 className="text-lg font-semibold leading-tight tracking-normal text-foreground/86">
                          {finding.category}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/66">{finding.summary}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-5 py-16 sm:px-8" scrollContainerRef={pageScrollRef}>
            <div className="mx-auto max-w-7xl">
              <motion.div
                className="site-corner bg-card p-5 sm:p-6 lg:p-7"
                variants={CARD_REVEAL}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.28 }}
                transition={{ duration: 0.62, ease: EASE_TEXT }}
              >
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
                  <div>
                    <h2 className="text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">Full text.</h2>
                    <div className="mt-5 w-full space-y-4 text-sm leading-relaxed text-foreground/66">
                      <p>
                        Holding the Line: Local Journalists' Experiences Amidst Economic Crisis and Digital
                        Transformation in Australia's News Ecosystem.
                      </p>
                      <p>
                        Sociology Honors Thesis, Washington University in St. Louis. Advisors: Dr. Caitlyn Collins and
                        Dr. Dino Christenson. March 21, 2025.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-foreground/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <p className="text-sm font-medium text-foreground/55">Source file</p>
                    <div className="mt-4 space-y-2">
                      <a
                        href={FULL_TEXT_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-4 border-b border-foreground/10 py-3 text-sm text-foreground/70 transition-colors hover:text-foreground"
                      >
                        <span>Read the full thesis</span>
                        <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </RevealSection>
        </motion.main>

        <Footer />
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

export default SeniorThesisLocalJournalismPage;
