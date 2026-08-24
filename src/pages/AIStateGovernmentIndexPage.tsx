import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Database,
  Filter,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import ProjectSourceLinks from "@/components/ProjectSourceLinks";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  aiIndexCriteria,
  aiIndexSources,
  aiIndexStates,
  type AiIndexParty,
  type AiIndexRegion,
  type AiIndexState,
} from "@/lib/aiStateGovIndex";

const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HERO_IMAGE = "https://pub-fa8ebd83ba8d4bf99e2e7f12e394fc2f.r2.dev/utahstatecap.avif";
const LAST_UPDATED_LABEL = "Last updated August 2025";

const WORK_CARD_COLORS = ["#87718d", "#91869a", "#827a96", "#77758c", "#7a819b", "#74809a"] as const;

const regionOrder: AiIndexRegion[] = ["East", "South", "Midwest", "West"];
const partyOrder: AiIndexParty[] = ["D", "R"];
const partyLabels: Record<AiIndexParty, string> = {
  D: "Democratic",
  R: "Republican",
};

const criterionCategoryColor: Record<string, string> = {
  "GenAI Adoption": WORK_CARD_COLORS[0],
  "Government Infrastructure": WORK_CARD_COLORS[2],
  "Employee Policy": WORK_CARD_COLORS[4],
};

const scoreBands = [
  { label: "Excellent", min: 80, max: 100, color: WORK_CARD_COLORS[0] },
  { label: "Above average", min: 60, max: 79.999, color: WORK_CARD_COLORS[1] },
  { label: "Average", min: 40, max: 59.999, color: WORK_CARD_COLORS[2] },
  { label: "Below average", min: 20, max: 39.999, color: WORK_CARD_COLORS[3] },
  { label: "Poor", min: 0, max: 19.999, color: WORK_CARD_COLORS[4] },
];
const TOP_PERFORMER_GREEN = WORK_CARD_COLORS[4];

type RankedState = AiIndexState & { rank: number };
type ChartPayload<TPayload = Record<string, unknown>> = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  payload?: TPayload;
  value?: number | string;
};
type DashboardTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ChartPayload<{ state?: string }>[];
};
type ResourceDatum = {
  budget: number;
  composite: number;
  state: string;
  workforce: number;
};
type ResourceTooltipProps = {
  active?: boolean;
  payload?: ChartPayload<ResourceDatum>[];
};

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const percent = (count: number, total: number) => Math.round((count / total) * 100);
const round = (value: number, digits = 0) => Number(value.toFixed(digits));
const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
const formatMoney = (value: number) => `$${round(value, 1)}B`;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
};

const getBand = (score: number) => scoreBands.find((band) => score >= band.min && score <= band.max) ?? scoreBands[4];

const getScoreColor = (score: number) => getBand(score).color;

const categoryScore = (state: AiIndexState, category: string) => {
  const criteria = aiIndexCriteria.filter((criterion) => criterion.category === category);
  const earned = criteria.reduce((sum, criterion) => sum + state.criteria[criterion.key], 0);
  const possible = criteria.reduce((sum, criterion) => sum + criterion.max, 0);
  return (earned / possible) * 100;
};

const StatPanel = ({
  label,
  value,
  detail,
  delay = 0,
}: {
  label: string;
  value: string;
  detail: string;
  delay?: number;
}) => (
  <motion.div
    className="site-corner bg-card p-4 shadow-sm"
    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, amount: 0.35 }}
    transition={{ duration: 0.54, ease: EASE_TEXT, delay }}
  >
    <div className="mb-4">
      <span className="text-sm font-medium text-foreground/66">{label}</span>
    </div>
    <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
    <p className="mt-2 text-xs leading-relaxed text-foreground/55">{detail}</p>
  </motion.div>
);

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
    viewport={{ once: true, amount: 0.42 }}
    transition={{ duration: 0.7, ease: EASE_TEXT, delay }}
  >
    {children}
  </motion.div>
);

const EditorialImage = ({
  alt,
  credit,
  creditHref,
  creditId,
  eager = false,
  flush = false,
  overlayTitle,
  src,
}: {
  alt: string;
  credit: string;
  creditHref?: string;
  creditId: string;
  eager?: boolean;
  flush?: boolean;
  overlayTitle?: string;
  src: string;
}) => {
  const [creditOpen, setCreditOpen] = useState(false);

  return (
    <figure
      className="article-hero relative aspect-[16/9]"
      style={flush ? { marginBottom: 0 } : undefined}
    >
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      {overlayTitle ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/90 via-black/48 to-transparent px-6 pb-6 pr-20 pt-24 sm:px-8 sm:pb-8 sm:pr-24">
          <h2 className="max-w-4xl text-2xl font-semibold leading-[1.02] tracking-tight text-white sm:text-4xl">
            {overlayTitle}
          </h2>
        </div>
      ) : null}
      <div className="absolute bottom-3 right-3 z-10">
        <AnimatePresence>
          {creditOpen ? (
            <motion.div
              id={creditId}
              role="status"
              className="absolute bottom-11 right-0 w-60 origin-bottom-right rounded-xl bg-background/95 px-3 py-2 text-right text-xs leading-relaxed text-foreground shadow-lg backdrop-blur"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_TEXT }}
            >
              {creditHref ? (
                <a
                  href={creditHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-end gap-1.5 font-medium hover:underline"
                >
                  {credit}
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              ) : (
                credit
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          aria-label={`Show image credit for ${alt}`}
          aria-expanded={creditOpen}
          aria-controls={creditId}
          onClick={() => setCreditOpen((open) => !open)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/85 bg-transparent text-white drop-shadow-md transition-all duration-200 hover:scale-105 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <span aria-hidden="true" className="font-serif text-lg italic leading-none">i</span>
        </button>
      </div>
    </figure>
  );
};

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
    offset: ["start end", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const washY = useTransform(scrollYProgress, [0, 1], [64, -64]);

  return (
    <motion.section
      ref={sectionRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, ease: EASE_TEXT }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_center,hsl(var(--foreground)/0.045),transparent_68%)]"
        style={{ y: washY }}
      />
      <motion.div className="relative z-10" style={{ y: contentY }}>
        {children}
      </motion.div>
    </motion.section>
  );
};

const FilterButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`site-corner inline-flex h-9 items-center justify-center border px-3 text-sm font-medium transition-colors ${
      active
        ? "border-foreground bg-foreground text-background"
        : "border-foreground/12 bg-background text-foreground/62 hover:border-foreground/35 hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const ChartReveal = ({
  children,
  className = "",
  delay = 0,
  minHeight,
  reveal = "fade",
  scrollContainerRef,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  minHeight?: number;
  reveal?: "fade" | "left";
  scrollContainerRef?: RefObject<HTMLElement | null>;
}) => {
  const revealRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(revealRef, { amount: 0.7, once: true, root: scrollContainerRef });
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (inView) {
      setHasEntered(true);
    }
  }, [inView]);

  return (
    <motion.div
      ref={revealRef}
      className={className}
      style={{ minHeight }}
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={hasEntered ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.72, ease: EASE_TEXT, delay }}
    >
      <motion.div
        className="h-full"
        initial={reveal === "left" ? { clipPath: "inset(0 100% 0 0)" } : undefined}
        animate={hasEntered && reveal === "left" ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration: 0.95, ease: EASE_TEXT, delay: delay + 0.08 }}
      >
        {hasEntered ? children : null}
      </motion.div>
    </motion.div>
  );
};

const DashboardTooltip = ({ active, payload, label }: DashboardTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="site-corner bg-background px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-foreground/65">{label ?? payload[0]?.payload?.state}</div>
      {payload.map((item) => (
        <div key={item.name ?? item.dataKey} className="mt-1 flex items-center gap-2 text-foreground/70">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span>
            {item.name ?? item.dataKey}: {typeof item.value === "number" ? round(item.value, 1) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const TopPerformersVisual = ({ states }: { states: RankedState[] }) => {
  return (
    <div className="relative overflow-hidden rounded-[6px] bg-card p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Top AI performers across governments</h2>
        <p className="mt-1 text-sm font-medium text-foreground/55">Composite score, top five</p>
      </div>

      <div className="grid gap-3">
        {states.map((state, index) => {
          const score = round(state.compositeScore, 1);
          const scoreColor = index === 0 ? "hsl(var(--background))" : TOP_PERFORMER_GREEN;

          return (
            <motion.div
              key={state.state}
              className="relative min-h-[72px] overflow-hidden rounded-[6px] bg-background sm:min-h-[82px]"
              initial={{ opacity: 0, filter: "blur(5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.42, ease: EASE_TEXT, delay: index * 0.05 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 origin-left bg-foreground"
                style={{ width: `${score}%`, backgroundColor: TOP_PERFORMER_GREEN }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.82, ease: EASE_TEXT, delay: 0.1 + index * 0.06 }}
              />
              <motion.div
                className="relative z-10 flex h-full min-h-[72px] items-center justify-between gap-3 px-3 py-3 text-background sm:min-h-[82px] sm:gap-4 sm:px-5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.48, ease: EASE_TEXT, delay: 0.72 + index * 0.06 }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-background/62">#{state.rank}</p>
                  <h3 className="truncate text-lg font-semibold tracking-tight sm:text-2xl">{state.state}</h3>
                </div>
                <motion.p
                  className="shrink-0 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
                  style={{ color: scoreColor }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.42, ease: EASE_TEXT, delay: 0.9 + index * 0.06 }}
                >
                  {score}
                </motion.p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const ResourceTooltip = ({ active, payload }: ResourceTooltipProps) => {
  if (!active || !payload?.length) return null;

  const state = payload[0]?.payload;
  if (!state) return null;

  return (
    <div className="site-corner bg-background px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-foreground/70">{state.state}</div>
      <div className="mt-2 grid gap-1 text-foreground/62">
        <span>Composite: {round(state.composite, 1)}</span>
        <span>Budget: {formatMoney(state.budget)}</span>
        <span>Workforce: {formatNumber(state.workforce)}</span>
      </div>
    </div>
  );
};

const AIStateGovernmentIndexPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<AiIndexRegion | "All">("All");
  const [selectedParty, setSelectedParty] = useState<AiIndexParty | "All">("All");
  const [query, setQuery] = useState("");
  const pageScrollRef = useRef<HTMLDivElement | null>(null);
  const rankedStates = useMemo<RankedState[]>(
    () =>
      [...aiIndexStates]
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .map((state, index) => ({ ...state, rank: index + 1 })),
    [],
  );
  const [selectedStateName, setSelectedStateName] = useState(rankedStates[0].state);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const selectedState = rankedStates.find((state) => state.state === selectedStateName) ?? rankedStates[0];

  const filteredStates = useMemo(
    () =>
      rankedStates.filter((state) => {
        const matchesRegion = selectedRegion === "All" || state.region === selectedRegion;
        const matchesParty = selectedParty === "All" || state.party === selectedParty;
        const matchesQuery = state.state.toLowerCase().includes(query.trim().toLowerCase());
        return matchesRegion && matchesParty && matchesQuery;
      }),
    [query, rankedStates, selectedParty, selectedRegion],
  );

  const meanComposite = average(aiIndexStates.map((state) => state.compositeScore));
  const medianComposite = median(aiIndexStates.map((state) => state.compositeScore));
  const medianBudget = median(aiIndexStates.map((state) => state.budgetBillions));
  const statesAbove80 = aiIndexStates.filter((state) => state.compositeScore >= 80).length;
  const statesBelow50 = aiIndexStates.filter((state) => state.compositeScore < 50).length;
  const topStates = rankedStates.slice(0, 5);
  const leanLeader = rankedStates.find((state) => state.budgetBillions <= 15) ?? rankedStates[0];
  const largeBudgetBelow50 = aiIndexStates.filter((state) => state.budgetBillions >= 50 && state.compositeScore < 50).length;
  const guidancePercent = percent(aiIndexStates.filter((state) => state.criteria.guidance > 0).length, aiIndexStates.length);
  const trainingPercent = percent(aiIndexStates.filter((state) => state.criteria.training > 0).length, aiIndexStates.length);
  const enterprisePercent = percent(aiIndexStates.filter((state) => state.criteria.enterprisePilot > 0).length, aiIndexStates.length);
  const roadmapPercent = percent(aiIndexStates.filter((state) => state.criteria.aiPlan > 0).length, aiIndexStates.length);

  const categoryData = ["GenAI Adoption", "Government Infrastructure", "Employee Policy"].map((category) => ({
    category,
    average: round(average(aiIndexStates.map((state) => categoryScore(state, category))), 1),
    fill: criterionCategoryColor[category],
  }));

  const bandData = scoreBands.map((band) => ({
    ...band,
    count: aiIndexStates.filter((state) => state.compositeScore >= band.min && state.compositeScore <= band.max).length,
  }));

  const scatterData = aiIndexStates.map((state) => ({
    state: state.state,
    budget: state.budgetBillions,
    logBudget: Math.log10(state.budgetBillions),
    composite: round(state.compositeScore, 1),
    party: state.party,
    region: state.region,
    workforce: state.workforce,
    rank: rankedStates.find((rankedState) => rankedState.state === state.state)?.rank ?? 0,
  }));

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
      data-ai-index-page
      ref={pageScrollRef}
      className="relative min-h-[100svh] overflow-x-clip bg-background text-foreground"
    >
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
      >
        <motion.main
          className="pb-24"
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.62, ease: EASE_TEXT, delay: 0.08 }}
        >
          <section className="relative bg-background">
            <div className="px-6 pt-28">
              <div className="content-measure">
                <button
                  type="button"
                  onClick={() => navigate("/?section=projects")}
                  className="pill-back"
                >
                  <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Back to work</span>
                </button>

                <div className="article-meta mt-10">
                  <span>2025</span>
                  <span data-dot aria-hidden="true" />
                  <span>Research</span>
                </div>

                <h1 className="article-title">The state GenAI gap is now measurable.</h1>
                <p className="article-subtitle">
                  Generative AI is already changing how work gets done. This benchmark asks a narrower question:
                  which state and territory governments are actually preparing their own operations for it?
                </p>

                <EditorialImage
                  alt="Utah state capitol building"
                  credit="Utah state capitol building. Credit: Lonely Planet"
                  creditId="utah-image-credit"
                  eager
                  src={HERO_IMAGE}
                />
              </div>
            </div>

            <div className="relative z-20 bg-background px-6 py-10">
              <div className="content-measure grid gap-10">
                <TextReveal>
                  <div className="space-y-5">
                    <p className="w-full text-xl leading-relaxed text-foreground/72 sm:text-2xl">
                      This index translates the GenAI hype cycle into a public-evidence benchmark for state and
                      territory governments: who has guidance, training, pilots, governance structures, public roadmaps,
                      and enough transparency for constituents to see what is actually happening.
                    </p>
                    <p className="w-full text-base leading-relaxed text-foreground/58">
                      Built from 15 criteria and 20 possible raw preparedness points, the composite score keeps public
                      evidence at the center while accounting for the very different resource levels of state and
                      territory governments.
                    </p>
                  </div>
                </TextReveal>

                <motion.div
                  initial={{ opacity: 0, y: 36, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.78, ease: EASE_TEXT, delay: 0.1 }}
                >
                  <ChartReveal minHeight={500} scrollContainerRef={pageScrollRef}>
                    <TopPerformersVisual states={topStates} />
                  </ChartReveal>
                </motion.div>
              </div>
            </div>
          </section>

          <RevealSection className="bg-background px-6 py-10 " scrollContainerRef={pageScrollRef}>
            <div className="content-measure grid gap-3 sm:grid-cols-2">
              <StatPanel label="Governments scored" value="56" detail="50 states, five territories, and DC." />
              <StatPanel label="Median score" value={`${round(medianComposite)}/100`} detail={`Mean composite score: ${round(meanComposite, 1)}.`} />
              <StatPanel label="Above 80" value={`${statesAbove80}`} detail="Only a small top tier clears the excellent band." />
              <StatPanel label="Below 50" value={`${statesBelow50}`} detail="Most governments are still early." />
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-6 py-10" scrollContainerRef={pageScrollRef}>
            <div className="content-measure grid gap-6">
              <EditorialImage
                alt="Pennsylvania Governor Josh Shapiro speaking at Carnegie Mellon University"
                credit="Credit: PoliticsPA.com"
                creditHref="https://www.politicspa.com/"
                creditId="pennsylvania-image-credit"
                flush
                overlayTitle="The benchmark only counts what governments make visible."
                src="/ai-state-index/pennsylvania-shapiro.jpg"
              />
              <div>
                <p className="text-sm leading-relaxed text-foreground/62">
                  The goal was not to score press-release enthusiasm. Each row is grounded in publicly available
                  evidence of GenAI adoption, infrastructure, and employee resources inside executive-branch government.
                </p>
              </div>

              <div className="space-y-4">
                <div className="site-corner bg-card p-4">
                  <div className="mb-4 flex items-center gap-2 text-foreground/70">
                    <Filter className="h-4 w-4" strokeWidth={1.5} />
                    <span className="text-sm font-medium">Filters</span>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-foreground/50">Region</span>
                      <div className="flex flex-wrap gap-2">
                        <FilterButton active={selectedRegion === "All"} onClick={() => setSelectedRegion("All")}>All</FilterButton>
                        {regionOrder.map((region) => (
                          <FilterButton key={region} active={selectedRegion === region} onClick={() => setSelectedRegion(region)}>
                            {region}
                          </FilterButton>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium text-foreground/50">Executive control</span>
                      <div className="flex flex-wrap gap-2">
                        <FilterButton active={selectedParty === "All"} onClick={() => setSelectedParty("All")}>All</FilterButton>
                        {partyOrder.map((party) => (
                          <FilterButton key={party} active={selectedParty === party} onClick={() => setSelectedParty(party)}>
                            {partyLabels[party]}
                          </FilterButton>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="site-corner flex h-11 items-center gap-3 bg-background px-3 text-foreground/70">
                      <Search className="h-4 w-4" strokeWidth={1.5} />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search state or territory"
                        className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="site-corner max-h-[560px] overflow-auto bg-card">
                    <table className="w-full min-w-[680px] text-left">
                      <thead className="sticky top-0 bg-card text-foreground/45">
                        <tr className="border-b border-foreground/10 text-xs font-medium">
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Government</th>
                          <th className="px-4 py-3">Region</th>
                          <th className="px-4 py-3">Party</th>
                          <th className="px-4 py-3 text-right">Composite</th>
                          <th className="px-4 py-3 text-right">Preparedness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStates.map((state) => (
                          <tr
                            key={state.state}
                            onClick={() => setSelectedStateName(state.state)}
                            className={`cursor-pointer border-b border-foreground/10 text-sm transition-colors hover:bg-foreground/[0.04] ${
                              selectedState.state === state.state ? "bg-foreground/[0.06]" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-foreground/45">#{state.rank}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{state.state}</td>
                            <td className="px-4 py-3 text-foreground/58">{state.region}</td>
                            <td className="px-4 py-3 text-foreground/58">{partyLabels[state.party]}</td>
                            <td className="px-4 py-3 text-right font-mono text-foreground">{round(state.compositeScore, 1)}</td>
                            <td className="px-4 py-3 text-right font-mono text-foreground/62">{state.preparednessScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="site-corner bg-card p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground/50">Selected government</p>
                        <h3 className="mt-1 text-3xl font-semibold tracking-tight">{selectedState.state}</h3>
                      </div>
                      <span className="site-corner bg-foreground px-2 py-1 text-xs font-medium text-background">
                        #{selectedState.rank}
                      </span>
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-2">
                      <div className="site-corner bg-background p-3">
                        <p className="text-sm font-medium text-foreground/45">Composite</p>
                        <p className="mt-1 text-2xl font-semibold">{round(selectedState.compositeScore, 1)}</p>
                      </div>
                      <div className="site-corner bg-background p-3">
                        <p className="text-sm font-medium text-foreground/45">Raw score</p>
                        <p className="mt-1 text-2xl font-semibold">{selectedState.preparednessScore}</p>
                      </div>
                      <div className="site-corner bg-background p-3">
                        <p className="text-sm font-medium text-foreground/45">Budget</p>
                        <p className="mt-1 text-2xl font-semibold">{formatMoney(selectedState.budgetBillions)}</p>
                      </div>
                      <div className="site-corner bg-background p-3">
                        <p className="text-sm font-medium text-foreground/45">Workforce</p>
                        <p className="mt-1 text-2xl font-semibold">{formatNumber(selectedState.workforce)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {categoryData.map((category) => {
                        const value = round(categoryScore(selectedState, category.category));
                        return (
                          <div key={category.category}>
                            <div className="mb-1 flex justify-between text-xs font-medium text-foreground/50">
                              <span>{category.category}</span>
                              <span>{value}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                              {value > 0 ? (
                                <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: category.fill }} />
                              ) : null}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-6 py-10" scrollContainerRef={pageScrollRef}>
            <div className="content-measure grid gap-6">
              <EditorialImage
                alt="California State Capitol building in Sacramento"
                credit="Credit: PPIC.org"
                creditHref="https://www.ppic.org/"
                creditId="california-image-credit"
                flush
                overlayTitle="A few governments are ahead. Most are still building the basics."
                src="/ai-state-index/california-capitol.jpg"
              />
              <div>
                <p className="w-full text-sm leading-relaxed text-foreground/62">
                  The pattern is uneven but legible: leadership clusters around states with clear implementation,
                  public strategy, employee resources, and enough transparency to verify what is actually happening.
                </p>
                <ChartReveal className="mt-8 h-[360px]" minHeight={360} scrollContainerRef={pageScrollRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankedStates} margin={{ top: 20, right: 8, left: -28, bottom: 4 }}>
                      <CartesianGrid stroke="rgba(17,20,15,0.1)" vertical={false} />
                      <XAxis dataKey="state" hide />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
                      <Tooltip content={<DashboardTooltip />} cursor={{ fill: "rgba(17,20,15,0.06)" }} />
                      <Bar
                        dataKey="compositeScore"
                        name="Composite score"
                        radius={[5, 5, 0, 0]}
                        isAnimationActive
                        animationBegin={0}
                        animationDuration={900}
                        animationEasing="ease-out"
                      >
                        {rankedStates.map((state) => (
                          <Cell key={state.state} fill={getScoreColor(state.compositeScore)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </div>

              <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {bandData.map((band) => (
                  <div
                    key={band.label}
                    className="site-corner flex min-h-32 flex-col p-4 text-[#11140f]"
                    style={{ backgroundColor: band.color }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-[#11140f]/75">{band.label}</span>
                      <span className="font-mono text-xs text-[#11140f]/60">{band.min}-{Math.floor(band.max)}</span>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <div className="text-4xl font-semibold">{band.count}</div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#11140f]/15">
                        {band.count > 0 ? (
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percent(band.count, aiIndexStates.length)}%`,
                              backgroundColor: "rgba(17, 20, 15, 0.62)",
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-6 py-10" scrollContainerRef={pageScrollRef}>
            <div className="content-measure">
              <div className="grid gap-8">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">The missing pieces are practical, not abstract.</h2>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/62">
                    Public guidance is relatively common. Training, action plans, permanent AI offices, and enterprise
                    pilots are much rarer. That is the core gap: governments are writing rules faster than they are
                    building repeatable capacity.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatPanel label="Guidance" value={`${guidancePercent}%`} detail="Have public employee guidance." />
                  <StatPanel label="Training" value={`${trainingPercent}%`} detail="Show public employee training." />
                  <StatPanel label="Roadmaps" value={`${roadmapPercent}%`} detail="Have a public GenAI action plan." />
                  <StatPanel label="Pilots" value={`${enterprisePercent}%`} detail="Have public enterprise trials." />
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-6 py-10" scrollContainerRef={pageScrollRef}>
            <div className="content-measure grid gap-6">
              <EditorialImage
                alt="A speaker at an OpenAI state government event"
                credit="Credit: StateAffairs.com"
                creditHref="https://stateaffairs.com/"
                creditId="state-affairs-image-credit"
                flush
                overlayTitle="Resources matter. They do not decide the story."
                src="/ai-state-index/state-affairs-openai.jpg"
              />
              <div>
                <p className="text-sm leading-relaxed text-foreground/62">
                  The composite model keeps preparedness as the main signal while accounting for government resources.
                  Smaller governments can still move quickly when the public evidence is concrete.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="site-corner bg-card p-4">
                    <p className="text-sm font-medium text-foreground/55">Median budget</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{formatMoney(medianBudget)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/52">The chart uses a log scale so small governments stay visible.</p>
                  </div>
                  <div className="site-corner bg-card p-4">
                    <p className="text-sm font-medium text-foreground/55">Best score under $15B</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{round(leanLeader.compositeScore, 1)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/52">{leanLeader.state} shows that capacity is not only a size question.</p>
                  </div>
                  <div className="site-corner bg-card p-4">
                    <p className="text-sm font-medium text-foreground/55">Large budgets below 50</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{largeBudgetBelow50}</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/52">Scale helps only when it becomes public implementation.</p>
                  </div>
                </div>
              </div>
              <div className="site-corner bg-card p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">Composite score by budget</h3>
                    <p className="mt-1 text-sm text-foreground/56">Bubble size represents workforce. Color follows score band.</p>
                  </div>
                  <div className="flex max-w-xl flex-wrap items-center gap-x-3 gap-y-2 text-xs text-foreground/58">
                    {scoreBands.map((band) => (
                      <span key={band.label} className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: band.color }} />
                        {band.label}
                      </span>
                    ))}
                  </div>
                </div>
                <ChartReveal minHeight={420} reveal="left" scrollContainerRef={pageScrollRef}>
                  <ResponsiveContainer width="100%" height={420}>
                    <ScatterChart margin={{ top: 18, right: 18, bottom: 18, left: -8 }}>
                      <CartesianGrid stroke="hsl(var(--foreground) / 0.1)" />
                      <XAxis
                        dataKey="logBudget"
                        name="Budget"
                        type="number"
                        domain={[-1, 2.5]}
                        ticks={[-1, 0, 1, 2]}
                        tickFormatter={(value: number) => formatMoney(10 ** value)}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.55)" }}
                      />
                      <YAxis
                        dataKey="composite"
                        name="Composite score"
                        type="number"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.55)" }}
                      />
                      <ZAxis dataKey="workforce" type="number" range={[48, 260]} />
                      <ReferenceLine
                        x={Math.log10(medianBudget)}
                        stroke="hsl(var(--foreground) / 0.22)"
                        strokeDasharray="4 4"
                        label={{ value: "Median budget", fill: "hsl(var(--foreground) / 0.48)", fontSize: 11, position: "insideTopRight" }}
                      />
                      <ReferenceLine
                        y={medianComposite}
                        stroke="hsl(var(--foreground) / 0.22)"
                        strokeDasharray="4 4"
                        label={{ value: "Median score", fill: "hsl(var(--foreground) / 0.48)", fontSize: 11, position: "insideLeft" }}
                      />
                      <Tooltip content={<ResourceTooltip />} cursor={{ stroke: "hsl(var(--foreground) / 0.25)" }} />
                      <Scatter
                        data={scatterData}
                        name="Governments"
                        isAnimationActive
                        animationBegin={80}
                        animationDuration={850}
                        animationEasing="ease-out"
                      >
                        {scatterData.map((state) => (
                          <Cell
                            key={state.state}
                            fill={getScoreColor(state.composite)}
                            fillOpacity={state.composite >= medianComposite ? 0.88 : 0.58}
                            stroke="hsl(var(--background))"
                            strokeWidth={1}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartReveal>
                <p className="mt-3 text-xs leading-relaxed text-foreground/50">
                  The strongest evidence sits above the horizontal median line. Points to the left are governments
                  working with below-median budgets.
                </p>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-6 py-10" scrollContainerRef={pageScrollRef}>
            <div className="content-measure grid gap-6">
              <EditorialImage
                alt="Wisconsin State Capitol in Madison at night"
                credit="Credit: AmericanGhostWalks.com"
                creditHref="https://www.americanghostwalks.com/wisconsin/milwaukee"
                creditId="wisconsin-image-credit"
                flush
                overlayTitle="Make safe use normal, measurable, and public."
                src="/ai-state-index/wisconsin-capitol.jpg"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: ShieldCheck,
                    color: WORK_CARD_COLORS[0],
                    title: "Publish clear guidance",
                    text: "Clear executive-branch guidance is the floor for safe, confident experimentation.",
                  },
                  {
                    icon: Users,
                    color: WORK_CARD_COLORS[1],
                    title: "Train the workforce",
                    text: "Employees need practical GenAI literacy, not only warnings about what not to do.",
                  },
                  {
                    icon: Bot,
                    color: WORK_CARD_COLORS[2],
                    title: "Run public pilots",
                    text: "Enterprise trials, sandboxes, and pilots create measurable evidence before full deployment.",
                  },
                  {
                    icon: SlidersHorizontal,
                    color: WORK_CARD_COLORS[3],
                    title: "Write a roadmap",
                    text: "A public action plan turns isolated experiments into a visible government strategy.",
                  },
                  {
                    icon: Database,
                    color: WORK_CARD_COLORS[4],
                    title: "Make ownership permanent",
                    text: "Dedicated staff and offices help governments learn instead of rediscovering the same problems.",
                  },
                  {
                    icon: CheckCircle2,
                    color: WORK_CARD_COLORS[5],
                    title: "Lead transparently",
                    text: "Public evidence is part of responsible deployment, not a communications afterthought.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="site-corner min-h-44 p-5 text-white"
                    style={{ backgroundColor: item.color }}
                    initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.58, ease: EASE_TEXT, delay: index * 0.05 }}
                  >
                    <item.icon className="h-5 w-5 text-white/75" strokeWidth={1.6} />
                    <h3 className="mt-4 text-xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </RevealSection>

          <RevealSection className="bg-background px-6 py-10" scrollContainerRef={pageScrollRef}>
            <div className="content-measure grid gap-8">
              <div>
                <div className="w-full space-y-4 text-sm leading-relaxed text-foreground/66">
                  <p>
                    The benchmark scores publicly accessible evidence of generative AI activity inside executive-branch
                    state and territory government. Internal tools, private memos, or undocumented deployments do not
                    count, because transparency is part of the readiness test.
                  </p>
                  <p>
                    The raw preparedness score spans 15 criteria and 20 possible points across GenAI adoption,
                    government infrastructure, and employee policy. It does not count non-generative AI, machine
                    learning, or natural-language processing initiatives unless the public evidence is specifically
                    about GenAI.
                  </p>
                  <p>The composite score keeps preparedness central while applying a resource-efficiency adjustment.</p>
                </div>
              </div>
              <div className="ai-index-source-panel">
                <ProjectSourceLinks label="Source files" links={aiIndexSources} compact />
              </div>
              <p className="site-corner bg-card p-4 text-sm leading-relaxed text-foreground/62 lg:col-span-2">
                {LAST_UPDATED_LABEL}. The dashboard should be read as a point-in-time public evidence benchmark, not a
                live tracker of every internal state government AI initiative.
              </p>
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

export default AIStateGovernmentIndexPage;
