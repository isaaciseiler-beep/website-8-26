import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ProjectItem } from "@/lib/siteContent";
import { MOTION_DURATION, MOTION_EASE_ENTER } from "@/lib/motion";

const EASE = MOTION_EASE_ENTER;

interface ProjectModalProps {
  projects: ProjectItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const ProjectModal = ({ projects, currentIndex, onClose, onNavigate }: ProjectModalProps) => {
  const project = currentIndex !== null ? projects[currentIndex] : null;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (currentIndex === null) return;
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight" && currentIndex < projects.length - 1) onNavigate(currentIndex + 1);
    if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onClose, onNavigate, projects.length]);

  useEffect(() => {
    if (currentIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, handleKeyDown]);

  return (
    <AnimatePresence>
      {project && currentIndex !== null && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast, ease: EASE }}
        >
          <div
            className="absolute inset-0"
            onClick={onClose}
            style={{
              background: "rgba(10,10,8,0.9)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
            }}
          />

          <motion.div
            key={project.id}
            className="site-corner relative z-10 mx-4 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden border border-foreground/10 bg-background shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: MOTION_DURATION.base, ease: EASE }}
          >
            <button onClick={onClose} className="absolute right-4 top-4 z-20 text-foreground/35 transition-colors hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="min-h-0">
              <div className="relative min-h-[220px] overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 55%, rgba(10,10,8,0.8) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">{project.source}</p>
                  <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-4xl">{project.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/68">{project.summary}</p>
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto max-h-[52vh]">
                <div className="px-5 pb-6 pt-6 md:px-6">
                  <div className="space-y-8">
                    {project.sections.map((section) => (
                      <section key={section.heading}>
                        <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground md:text-xl">{section.heading}</h3>
                        {section.paragraphs?.map((paragraph) => (
                          <p key={paragraph} className="mb-3 text-[15px] leading-relaxed text-foreground/68 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                        {section.bullets && (
                          <ul className="space-y-2">
                            {section.bullets.map((bullet) => (
                              <li key={bullet} className="flex gap-3 text-[15px] leading-relaxed text-foreground/68">
                                <span className="mt-[0.55rem] h-[3px] w-[3px] shrink-0 rounded-full bg-foreground/30" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {section.links && (
                          <div className="space-y-3">
                            {section.links.map((link) => (
                              <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between border-b border-foreground/10 py-2 text-sm text-foreground/72 transition-colors hover:text-foreground"
                              >
                                <span>{link.label}</span>
                                <ArrowUpRight className="h-4 w-4 text-foreground/32 transition-transform duration-200 group-hover:-translate-y-[1px] group-hover:translate-x-[1px] group-hover:text-foreground/75" />
                              </a>
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {currentIndex > 0 && (
              <button
                onClick={() => onNavigate(currentIndex - 1)}
                className="absolute left-3 top-[110px] z-20 text-white/25 transition-colors hover:text-white/70 md:left-4"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}

            {currentIndex < projects.length - 1 && (
              <button
                onClick={() => onNavigate(currentIndex + 1)}
                className="absolute right-3 top-[110px] z-20 text-white/25 transition-colors hover:text-white/70 md:right-4"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
