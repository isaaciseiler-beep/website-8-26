import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { hiddenProjectIds, newsItems, orderProjectItemsForWork, projectItems, type ProjectItem } from "@/lib/siteContent";
import { tileImageFor } from "@/lib/tileImages";
import { preloadImage, scheduleImagePreloads } from "@/lib/imagePreload";
import { MOTION_DURATION, MOTION_EASE, MOTION_EASE_ENTER } from "@/lib/motion";

type ProjectFilter = "ALL" | "AI" | "WORK" | "BLOG";

const filters: { label: string; value: ProjectFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "AI", value: "AI" },
  { label: "Work", value: "WORK" },
  { label: "Blog", value: "BLOG" },
];

const AI_SUBJECT_PATTERN =
  /\b(ai|a\.i\.|artificial intelligence|chatgpt|openai|llm|machine learning|gpt|generative)\b/i;

const isAiSubject = (...values: (string | undefined)[]) =>
  values.some((value) => typeof value === "string" && AI_SUBJECT_PATTERN.test(value));

type Entry =
  | { kind: "project"; id: string; node: ProjectItem }
  | { kind: "news"; id: string; node: (typeof newsItems)[number] };

const preloadProject = (project: ProjectItem) => {
  void preloadImage(project.image, { decode: true, fetchPriority: "high", linkPreload: true });
  const supportingImages = project.sections.flatMap((section) =>
    (section.media ?? []).flatMap((media) => [
      media.src,
      media.poster,
      media.fallbackPoster,
      ...(media.images ?? []).map((image) => image.src),
    ]),
  ).filter((src): src is string => Boolean(src));
  scheduleImagePreloads(supportingImages.slice(0, 6), {
    batchSize: 2,
    decode: false,
    fetchPriority: "low",
    idleTimeout: 800,
  });
};

const ProjectsSection = () => {
  const [filter, setFilter] = useState<ProjectFilter>("ALL");

  const entries = useMemo<Entry[]>(() => {
    const projectEntries: Entry[] = orderProjectItemsForWork(projectItems)
      .filter((project) => !hiddenProjectIds.has(project.id))
      .map((project) => ({
        kind: "project",
        id: `project-${project.id}`,
        node: project,
      }));
    const projectHrefs = new Set(
      projectEntries.map((entry) => `/projects/${entry.node.id}`),
    );
    const newsEntries: Entry[] = newsItems
      .filter((item) => !projectHrefs.has(item.href))
      .map((item) => ({
        kind: "news",
        id: `news-${item.id}`,
        node: item,
      }));

    if (filter === "AI") {
      return [...projectEntries, ...newsEntries].filter((entry) => {
        const node = entry.node as { title?: string; source?: string; summary?: string; description?: string };
        return entry.node.source !== "BLOG" && isAiSubject(node.title, node.source, node.summary, node.description);
      });
    }
    if (filter === "WORK") {
      return projectEntries.filter((entry) => entry.kind === "project" && entry.node.source !== "BLOG");
    }
    if (filter === "BLOG") {
      return projectEntries.filter((entry) => entry.kind === "project" && entry.node.source === "BLOG");
    }
    return [...projectEntries, ...newsEntries];
  }, [filter]);

  return (
    <section className="work-library" aria-labelledby="work-library-title">
      <h2 id="work-library-title" className="sr-only">Work</h2>

      <div className="work-library-tabs" role="tablist" aria-label="Filter work">
        {filters.map((item) => {
          const active = filter === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setFilter(item.value);
              }}
              className={`pill-tab ${active ? "is-active" : ""}`}
            >
              {active ? (
                <motion.span
                  layoutId="work-library-tab-pill"
                  className="pill-tab-indicator"
                  transition={{ type: "tween", duration: MOTION_DURATION.base, ease: MOTION_EASE }}
                />
              ) : null}
              <span className="pill-tab-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        layout
        transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
        className={`work-library-rail ${entries.length === 0 ? "work-library-rail--empty" : ""}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.length === 0 ? (
            <motion.p
              key="empty-blog"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="work-library-empty"
            >
              Nothing published yet.
            </motion.p>
          ) : null}
          {entries.map((entry, index) => {
            const motionProps = {
              layout: true as const,
              initial: { opacity: 0, y: 6, filter: "blur(3px)" },
              animate: { opacity: 1, y: 0, filter: "blur(0px)" },
              exit: { opacity: 0, y: -4, filter: "blur(2px)" },
              transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE_ENTER, delay: Math.min(index * 0.025, 0.12) },
            };

            if (entry.kind === "news") {
              const item = entry.node;
              return (
              <motion.a
                key={entry.id}
                {...motionProps}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="work-library-card group"
              >
                <img src={tileImageFor(index)} alt="" loading="lazy" decoding="async" />
                <div className="work-library-scrim" />
                <ArrowUpRight aria-hidden="true" className="work-library-card-arrow" />
                <div className="work-library-card-bottom">
                  <h3>{item.title}</h3>
                </div>
              </motion.a>
              );
            }

              const project = entry.node;
              return (
                <motion.div key={entry.id} {...motionProps}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="work-library-card group"
                    aria-label={`Read more about ${project.title}`}
                    onPointerEnter={() => preloadProject(project)}
                    onFocus={() => preloadProject(project)}
                    onTouchStart={() => preloadProject(project)}
                  >
                    <img
                      src={tileImageFor(index)}
                      alt=""
                      loading={index < 3 ? "eager" : "lazy"}
                      decoding="async"
                    />
                    <div className="work-library-scrim" />
                    <ArrowUpRight aria-hidden="true" className="work-library-card-arrow" />
                    <div className="work-library-card-bottom">
                      <h3>{project.title}</h3>
                    </div>
                  </Link>
                </motion.div>
              );
          })}
        </AnimatePresence>
      </motion.div>

    </section>
  );
};

export default ProjectsSection;
