import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { projectItems, type ProjectItem } from "@/lib/siteContent";

type ProjectFilter = "ALL" | ProjectItem["source"];

const filters: { label: string; value: ProjectFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Research", value: "RESEARCH" },
  { label: "Work", value: "WORK" },
  { label: "Reporting", value: "REPORTING" },
  { label: "Projects", value: "PROJECT" },
];

const INITIAL_COUNT = 6;

const ProjectsSection = () => {
  const [filter, setFilter] = useState<ProjectFilter>("ALL");
  const [expanded, setExpanded] = useState(false);

  const projects = useMemo(() => {
    const matches = filter === "ALL"
      ? projectItems
      : projectItems.filter((project) => project.source === filter);
    return matches.slice(0, 12);
  }, [filter]);

  const collapsed = !expanded && projects.length > INITIAL_COUNT;
  const visible = collapsed ? projects.slice(0, INITIAL_COUNT) : projects;

  return (
    <section className="work-library" aria-labelledby="work-library-title">
      <h2 id="work-library-title" className="sr-only">Work</h2>

      <div className="work-library-tabs" role="tablist" aria-label="Filter projects">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => {
              setFilter(item.value);
              setExpanded(false);
            }}
            className={`pill-button ${filter === item.value ? "is-active" : ""}`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={`work-library-reveal ${collapsed ? "is-collapsed" : ""}`}>
        <motion.div layout className="work-library-grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: Math.min((index % INITIAL_COUNT) * 0.03, 0.15) }}
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
                    <h3>{project.title}</h3>
                    <ArrowUpRight aria-hidden="true" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {collapsed ? <div className="work-library-fade" aria-hidden="true" /> : null}
      </div>

      {projects.length > INITIAL_COUNT ? (
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
