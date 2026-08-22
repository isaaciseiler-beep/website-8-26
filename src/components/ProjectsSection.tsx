import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { projectItems, newsItems, type ProjectItem } from "@/lib/siteContent";

type ProjectFilter = "ALL" | "NEWS" | ProjectItem["source"];

const filters: { label: string; value: ProjectFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Research", value: "RESEARCH" },
  { label: "Work", value: "WORK" },
  { label: "Reporting", value: "REPORTING" },
  { label: "Projects", value: "PROJECT" },
  { label: "News", value: "NEWS" },
];

const INITIAL_COUNT = 6;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ProjectsSection = () => {
  const [filter, setFilter] = useState<ProjectFilter>("ALL");
  const [expanded, setExpanded] = useState(false);

  const projects = useMemo(() => {
    if (filter === "NEWS") return [];
    const matches = filter === "ALL"
      ? projectItems
      : projectItems.filter((project) => project.source === filter);
    return matches.slice(0, 12);
  }, [filter]);

  const isNews = filter === "NEWS";
  const total = isNews ? newsItems.length : projects.length;
  const collapsed = !expanded && total > INITIAL_COUNT;
  const visible = collapsed ? projects.slice(0, INITIAL_COUNT) : projects;
  const visibleNews = collapsed ? newsItems.slice(0, INITIAL_COUNT) : newsItems;


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
                setExpanded(false);
              }}
              className={`pill-tab ${active ? "is-active" : ""}`}
            >
              {active ? (
                <motion.span
                  layoutId="work-library-tab-pill"
                  className="pill-tab-indicator"
                  transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.9 }}
                />
              ) : null}
              <span className="pill-tab-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div layout transition={{ duration: 0.45, ease: EASE }} className="work-library-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {isNews
            ? visibleNews.map((item, index) => (
                <motion.a
                  key={`news-${item.id}`}
                  layout
                  href={item.href}
                  target={item.href === "#" ? undefined : "_blank"}
                  rel={item.href === "#" ? undefined : "noopener noreferrer"}
                  className="work-library-card group"
                  initial={{ opacity: 0, scale: 0.985, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.985, filter: "blur(6px)" }}
                  transition={{ duration: 0.5, ease: EASE, delay: Math.min((index % INITIAL_COUNT) * 0.035, 0.18) }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
                  ) : null}
                  <div className="work-library-scrim" />
                  <div className="news-compact-logo-row">
                    <img src={item.logoUrl} alt={item.logoAlt} className="news-compact-logo" loading="lazy" />
                  </div>
                  <div className="work-library-card-bottom">
                    <ArrowRight aria-hidden="true" className="work-library-card-arrow" />
                    <h3>{item.title}</h3>
                  </div>
                </motion.a>
              ))
            : visible.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.985, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.985, filter: "blur(6px)" }}
              transition={{
                duration: 0.5,
                ease: EASE,
                delay: Math.min((index % INITIAL_COUNT) * 0.035, 0.18),
              }}
            >
              <Link
                to={`/projects/${project.id}`}
                className="work-library-card group"
                aria-label={`Read more about ${project.title}`}
              >
                <img
                  src={project.image}
                  alt=""
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                />
                <div className="work-library-scrim" />
                <div className="work-library-card-bottom">
                  <ArrowRight aria-hidden="true" className="work-library-card-arrow" />
                  <h3>{project.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {total > INITIAL_COUNT ? (

        <div className="work-library-more">
          <button
            type="button"
            className="pill-button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <span>{expanded ? "View less" : "View more"}</span>
            <ChevronDown aria-hidden="true" className={expanded ? "is-flipped" : ""} />
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default ProjectsSection;
