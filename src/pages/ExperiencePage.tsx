import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedText from "@/components/AnimatedText";
import Footer from "@/components/Footer";
import ParallaxSection from "@/components/ParallaxSection";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { experienceEntries, experienceIntro, type ExperienceEntry } from "@/lib/experience";
import { newsItems, projectItems } from "@/lib/siteContent";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const RESUME_HREF = "/isaac-seiler-resume.pdf";
const TIMELINE_STICKY_TOP = 112;
const TIMELINE_HEADER_OFFSET = 66;
const GLITCH_IN_INITIAL = {
  opacity: 0,
  x: 0,
  y: 10,
  skewX: 0,
  filter: "blur(4px)",
};
const GLITCH_IN_VISIBLE = {
  opacity: 1,
  x: 0,
  y: 0,
  skewX: 0,
  filter: "blur(0px)",
};
const glitchTransition = (delay = 0, duration = 0.62) => ({
  delay,
  duration: Math.min(duration, 0.42),
  ease: EASE_TEXT,
});

interface RelatedItem {
  id: string;
  title: string;
  href: string;
  image?: string;
  external: boolean;
}

interface ExperienceGroup {
  id: string;
  organization: string;
  organizationUrl?: string;
  period: string;
  image: string;
  entries: ExperienceEntry[];
}

const EMPLOYER_PERIODS: Record<string, string> = {
  "Boehringer Ingelheim": "May 2024-Aug 2025",
  "Washington University in St. Louis": "Sep 2023-May 2025",
};

const groupExperienceEntries = (entries: ExperienceEntry[]): ExperienceGroup[] => {
  const groups = new Map<string, ExperienceGroup>();

  entries.forEach((entry) => {
    const existing = groups.get(entry.organization);
    if (existing) {
      existing.entries.push(entry);
      return;
    }

    groups.set(entry.organization, {
      id: entry.id,
      organization: entry.organization,
      organizationUrl: entry.organizationUrl,
      period: EMPLOYER_PERIODS[entry.organization] ?? entry.period,
      image: entry.image,
      entries: [entry],
    });
  });

  return Array.from(groups.values());
};

const relatedFor = (entry: ExperienceEntry): RelatedItem[] => {
  const projects = entry.projectIds
    .map((id) => projectItems.find((project) => project.id === id))
    .filter((project): project is (typeof projectItems)[number] => Boolean(project))
    .map((project) => ({
      id: `project-${project.id}`,
      title: project.title,
      href: `/projects/${project.id}`,
      image: project.image,
      external: false,
    }));

  const stories = entry.newsIds
    .map((id) => newsItems.find((item) => item.id === id))
    .filter((item): item is (typeof newsItems)[number] => Boolean(item))
    .filter((item) => item.href !== "#")
    .map((item) => ({
      id: `news-${item.id}`,
      title: item.title,
      href: item.href,
      image: item.imageUrl,
      external: true,
    }));

  return [...projects, ...stories];
};

const relatedForGroup = (group: ExperienceGroup): RelatedItem[] => {
  const related = group.entries.flatMap((entry) => relatedFor(entry));
  return related.filter((item, index) => related.findIndex((candidate) => candidate.id === item.id) === index);
};

const EmployerLink = ({
  group,
  className,
}: {
  group: Pick<ExperienceGroup, "organization" | "organizationUrl">;
  className?: string;
}) => {
  if (!group.organizationUrl) {
    return <span className={`${className ?? ""} font-sans normal-case tracking-tight`}>{group.organization}</span>;
  }

  return (
    <a
      href={group.organizationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className ?? ""} group/employer-link inline-flex items-center gap-1.5 font-sans normal-case tracking-tight transition-colors hover:text-foreground`}
    >
      <span className="relative after:absolute after:bottom-[-0.12em] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-out group-hover/employer-link:after:scale-x-100">
        {group.organization}
      </span>
      <ArrowUpRight
        className="h-3.5 w-3.5 shrink-0 opacity-45 transition duration-300 group-hover/employer-link:-translate-y-0.5 group-hover/employer-link:translate-x-0.5 group-hover/employer-link:opacity-100"
        strokeWidth={1.5}
      />
    </a>
  );
};

const RelatedLink = ({ item }: { item: RelatedItem }) => {
  const content = (
    <>
      <span className="relative h-14 w-20 shrink-0 bg-foreground/5 md:h-16 md:w-24">
        {item.image ? (
          <ExperienceImage
            src={item.image}
            className="h-full w-full"
            imageClassName="h-full w-full object-cover transition-[filter,transform] duration-700 ease-out will-change-[filter,transform] group-hover:scale-[1.015]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-foreground/35">
            <FileText className="h-4 w-4" strokeWidth={1.5} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight tracking-tight text-foreground/78 transition-colors group-hover:text-foreground md:text-[15px]">
          {item.title}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/32 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground/80" />
    </>
  );

  const className =
    "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-foreground/10 py-3 transition-colors hover:border-foreground/24 md:gap-4";

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {content}
    </Link>
  );
};

const ExperienceImage = ({
  src,
  className,
  imageClassName,
}: {
  src: string;
  className?: string;
  imageClassName?: string;
}) => {
  const rotX = useSpring(useMotionValue(0), { stiffness: 90, damping: 26, mass: 0.7 });
  const rotY = useSpring(useMotionValue(0), { stiffness: 90, damping: 26, mass: 0.7 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const hoveringCorner = Math.abs(nx) > 0.62 && Math.abs(ny) > 0.62;

    rotY.set(hoveringCorner ? nx * 5 : 0);
    rotX.set(hoveringCorner ? -ny * 5 : 0);
  };

  const handlePointerLeave = () => {
    rotX.set(0);
    rotY.set(0);
  };

  return (
    <motion.div
      className={`site-corner group/resume-image relative overflow-hidden shadow-sm transition-shadow duration-300 group-hover:shadow-md ${className ?? ""}`}
      style={{
        perspective: 900,
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={
          imageClassName ??
          "absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-out will-change-[filter,transform]"
        }
      />
    </motion.div>
  );
};

const ExperienceGroupSection = ({
  group,
  index,
}: {
  group: ExperienceGroup;
  index: number;
}) => {
  const related = useMemo(() => relatedForGroup(group), [group]);
  const [primaryEntry, ...secondaryEntries] = group.entries;

  return (
    <motion.article
      id={group.id}
      className={`experience-entry scroll-mt-[180px] py-10 md:py-14 ${
        index === 0 ? "pt-0" : "border-t border-foreground/10"
      }`}
      data-experience-id={group.id}
      initial={GLITCH_IN_INITIAL}
      whileInView={GLITCH_IN_VISIBLE}
      viewport={{ once: true, margin: "-80px" }}
      transition={glitchTransition(Math.min(index * 0.035, 0.2), 0.68)}
    >
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-foreground/54">
          <EmployerLink group={group} />
        </div>

        <section>
          <AnimatedText
            text={primaryEntry.role}
            as="p"
            className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            margin="-80px"
          />

          <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(13rem,18rem)] md:items-start md:gap-8 xl:gap-10">
            <motion.div
              className="space-y-4"
              initial={GLITCH_IN_INITIAL}
              whileInView={GLITCH_IN_VISIBLE}
              viewport={{ once: true, margin: "-80px" }}
              transition={glitchTransition(0.08, 0.56)}
            >
              {primaryEntry.paragraphs.map((paragraph) => (
                <p key={paragraph} className="max-w-2xl text-[15px] leading-relaxed text-foreground/68 md:text-base">
                  {paragraph}
                </p>
              ))}
            </motion.div>

            <motion.div
              className="relative aspect-square w-full bg-foreground/5"
              initial={{ ...GLITCH_IN_INITIAL, y: 8 }}
              whileInView={GLITCH_IN_VISIBLE}
              viewport={{ once: true, margin: "-80px" }}
              transition={glitchTransition(0.12, 0.64)}
            >
              <ExperienceImage src={group.image} className="h-full w-full" />
            </motion.div>
          </div>
        </section>

        {secondaryEntries.map((entry, secondaryIndex) => (
          <motion.section
            key={entry.id}
            className="mt-9 border-t border-foreground/10 pt-8"
            initial={GLITCH_IN_INITIAL}
            whileInView={GLITCH_IN_VISIBLE}
            viewport={{ once: true, margin: "-80px" }}
            transition={glitchTransition(0.08 + secondaryIndex * 0.04, 0.58)}
          >
            <AnimatedText
              text={entry.role}
              as="p"
              className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
              margin="-80px"
            />
            <motion.div
              className="mt-5 space-y-4"
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.42, ease: EASE_TEXT, delay: 0.05 }}
            >
              {entry.paragraphs.map((paragraph) => (
                <p key={paragraph} className="max-w-2xl text-[15px] leading-relaxed text-foreground/68 md:text-base">
                  {paragraph}
                </p>
              ))}
            </motion.div>
          </motion.section>
        ))}

        {related.length > 0 ? (
          <div className="mt-8">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/44">
              Associated work
            </div>
            <div>
              {related.map((item) => (
                <RelatedLink key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
};

const ExperiencePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const experienceGroups = useMemo(() => groupExperienceEntries(experienceEntries), []);
  const [activeId, setActiveId] = useState(experienceGroups[0]?.id ?? "");
  const isMobile = useIsMobile();
  const timelineRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: [
      `start ${TIMELINE_STICKY_TOP + TIMELINE_HEADER_OFFSET}px`,
      `end ${TIMELINE_STICKY_TOP + TIMELINE_HEADER_OFFSET}px`,
    ],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.35 });

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".experience-entry"));
    if (!nodes.length) return;

    const updateActiveEntry = () => {
      const readingLine = TIMELINE_STICKY_TOP + TIMELINE_HEADER_OFFSET + 8;
      const current =
        [...nodes]
          .reverse()
          .find((node) => node.getBoundingClientRect().top <= readingLine) ?? nodes[0];
      const id = current.getAttribute("data-experience-id");
      if (id) setActiveId(id);
    };

    updateActiveEntry();
    window.addEventListener("scroll", updateActiveEntry, { passive: true });
    window.addEventListener("resize", updateActiveEntry);
    return () => {
      window.removeEventListener("scroll", updateActiveEntry);
      window.removeEventListener("resize", updateActiveEntry);
    };
  }, []);

  const scrollToEntry = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
      />

      <motion.div
        animate={{
          paddingLeft: sidebarOpen && !isMobile ? 200 : 0,
          paddingRight: searchOpen && !isMobile ? 200 : 0,
        }}
        className="min-w-0"
        transition={{ duration: 0.56, ease: EASE_TEXT }}
      >
        <motion.main
          className="pt-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_TEXT, delay: 0.1 }}
        >
          <section className="flex min-h-[calc(100svh-7rem)] flex-col justify-end px-6 pb-12 pt-16 md:pb-16">
            <motion.div
              className="pt-7 pb-4 md:grid md:grid-cols-[minmax(14rem,0.32fr)_minmax(0,1fr)] md:gap-10 md:pt-9 md:pb-5"
              initial={GLITCH_IN_INITIAL}
              whileInView={GLITCH_IN_VISIBLE}
              viewport={{ once: true, margin: "-80px" }}
              transition={glitchTransition(0.08, 0.68)}
            >
              <div className="mb-5 md:mb-0">
                <AnimatedText
                  text={experienceIntro.title}
                  as="p"
                  className="text-xl font-semibold tracking-tight text-foreground md:text-2xl"
                  delay={0.05}
                />
              </div>
              <motion.div
                className="grid max-w-4xl gap-4 text-[15px] leading-relaxed text-foreground/68 md:text-base"
                initial={GLITCH_IN_INITIAL}
                whileInView={GLITCH_IN_VISIBLE}
                viewport={{ once: true, margin: "-80px" }}
                transition={glitchTransition(0.14, 0.56)}
              >
                {experienceIntro.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </motion.div>
            </motion.div>

            <motion.a
              href={RESUME_HREF}
              download
              className="mt-5 block w-full min-w-0 shrink-0 md:mt-6 md:w-1/2"
              initial={GLITCH_IN_INITIAL}
              whileInView={GLITCH_IN_VISIBLE}
              viewport={{ once: true, margin: "-80px" }}
              transition={glitchTransition(0.18, 0.56)}
            >
              <div className="site-corner homepage-cta group relative flex w-full cursor-pointer items-center justify-center bg-primary py-3 font-mono text-sm uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-accent">
                <span className="flex items-center justify-center">
                  Download resume
                  <span className="inline-flex max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-[2rem] group-hover:opacity-100">
                    <Download className="ml-2 h-4 w-4 shrink-0" strokeWidth={1.5} />
                  </span>
                </span>
              </div>
            </motion.a>
          </section>

          <section ref={timelineRef} className="px-6 py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)] lg:gap-14">
              <aside className="sticky top-28 hidden max-h-[calc(100svh-8rem)] self-start overflow-visible lg:block">
                <motion.div
                  className="pt-[66px]"
                  initial={GLITCH_IN_INITIAL}
                  whileInView={GLITCH_IN_VISIBLE}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={glitchTransition(0.04, 0.58)}
                >
                  <div className="relative">
                    <div className="absolute left-[5px] top-0 h-full w-px bg-foreground/10" />
                    <motion.div
                      className="absolute left-[5px] top-0 h-full w-px origin-top bg-[hsl(var(--highlight))]"
                      style={{ scaleY }}
                    />
                    <div className="space-y-2">
                      {experienceGroups.map((group) => {
                        const active = group.id === activeId;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => scrollToEntry(group.id)}
                            className="group relative flex w-full items-start gap-4 text-left"
                          >
                            <span
                              className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border transition-colors ${
                                active ? "border-[hsl(var(--highlight))] bg-[hsl(var(--highlight))]" : "border-foreground/30 bg-background"
                              }`}
                            />
                            <span>
                              <span className={`block text-[13px] leading-tight transition-colors ${active ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/72"}`}>
                                {group.organization}
                              </span>
                              <span className={`mt-1 block font-mono text-[9px] uppercase leading-tight tracking-[0.18em] transition-colors ${active ? "text-foreground/54" : "text-foreground/28 group-hover:text-foreground/46"}`}>
                                {group.period}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </aside>

              <div>
                {experienceGroups.map((group, index) => (
                  <ParallaxSection key={group.id} offset={index === 0 ? 0 : 24} clip={false}>
                    <ExperienceGroupSection group={group} index={index} />
                  </ParallaxSection>
                ))}
              </div>
            </div>
          </section>
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

export default ExperiencePage;
