import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
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

const ProjectsSection = () => {
  const [filter, setFilter] = useState<ProjectFilter>("ALL");

  const projects = useMemo(() => {
    const matches = filter === "ALL"
      ? projectItems
      : projectItems.filter((project) => project.source === filter);
    return matches.slice(0, 12);
  }, [filter]);

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
            onClick={() => setFilter(item.value)}
            className={`pill-button ${filter === item.value ? "is-active" : ""}`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="work-library-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.16) }}
            >
              <Link
                to={`/projects/${project.id}`}
                className="work-library-card group"
                aria-label={`Read more about ${project.title}`}
              >
                <img
                  src={project.image}
                  alt=""
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
                  fetchpriority={index < 4 ? "high" : "low"}
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
    </section>
  );
};

export default ProjectsSection;
