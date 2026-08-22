import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { projectItems, newsItems, type ProjectItem } from "@/lib/siteContent";
import { tileImageFor } from "@/lib/tileImages";

type ProjectFilter = "ALL" | "AI" | "PROJECTS" | "BLOG";

const filters: { label: string; value: ProjectFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "AI", value: "AI" },
  { label: "Projects", value: "PROJECTS" },
  { label: "Blog", value: "BLOG" },
];

const AI_SUBJECT_PATTERN =
  /\b(ai|a\.i\.|artificial intelligence|chatgpt|openai|llm|machine learning|gpt|generative)\b/i;

const isAiSubject = (...values: (string | undefined)[]) =>
  values.some((value) => typeof value === "string" && AI_SUBJECT_PATTERN.test(value));

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Entry =
  | { kind: "project"; id: string; node: ProjectItem }
  | { kind: "news"; id: string; node: (typeof newsItems)[number] };

const ProjectsSection = () => {
  const [filter, setFilter] = useState<ProjectFilter>("ALL");

  const entries = useMemo<Entry[]>(() => {
    const projectEntries: Entry[] = projectItems.map((project) => ({
      kind: "project",
      id: `project-${project.id}`,
      node: project,
    }));
    const newsEntries: Entry[] = newsItems.map((item) => ({
      kind: "news",
      id: `news-${item.id}`,
      node: item,
    }));

    if (filter === "BLOG") {
      return projectEntries.filter((entry) => entry.kind === "project" && entry.node.source === "BLOG");
    }
    if (filter === "AI") {
      return [...projectEntries, ...newsEntries].filter((entry) => {
        const node = entry.node as { title?: string; source?: string; summary?: string; description?: string };
        return entry.node.source !== "BLOG" && isAiSubject(node.title, node.source, node.summary, node.description);
      });
    }
    if (filter === "PROJECTS") {
      return projectEntries.filter((entry) => entry.kind === "project" && entry.node.source !== "BLOG");
    }
    return [...projectEntries, ...newsEntries];
  }, [filter]);

  return (
    <section className="work-library" aria-labelledby="work-library-title">
      <h2 id="work-library-title" className="sr-only">Work</h2>

      <div className="work-library-tabs" role="tablist" aria-label="Filter projects">
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
                  transition={{ type: "tween", duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : null}
              <span className="pill-tab-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div layout transition={{ duration: 0.45, ease: EASE }} className="work-library-rail">
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.map((entry, index) => {
            const motionProps = {
              layout: true as const,
              initial: { opacity: 0, scale: 0.985, filter: "blur(6px)" },
              animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
              exit: { opacity: 0, scale: 0.985, filter: "blur(6px)" },
              transition: { duration: 0.5, ease: EASE, delay: Math.min(index * 0.035, 0.18) },
            };

            if (entry.kind === "news") {
              const item = entry.node;
              return (
              <motion.a
                key={entry.id}
                {...motionProps}
                href={item.href}
                target={item.href === "#" ? undefined : "_blank"}
                rel={item.href === "#" ? undefined : "noopener noreferrer"}
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
