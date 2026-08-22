import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { projectItems, type ProjectMedia } from "@/lib/siteContent";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const sourceLabel: Record<string, string> = {
  RESEARCH: "Research",
  WORK: "Work",
  REPORTING: "Reporting",
  PROJECT: "Project",
  BLOG: "Blog",
};

const ProjectMediaBlock = ({ media }: { media: ProjectMedia }) => {
  if (media.type === "pdf" && media.src) {
    return (
      <figure className="my-6 overflow-hidden bg-foreground/[0.02]">
        <iframe
          src={`${media.src}#toolbar=0&navpanes=0&view=FitH`}
          title={media.title ?? media.alt ?? "Project slide deck"}
          className="h-[72vh] min-h-[420px] w-full bg-foreground/[0.03]"
          loading="lazy"
        />
      </figure>
    );
  }

  if (media.type === "carousel" && media.images?.length) {
    return (
      <div className="my-6">
        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent>
            {media.images.map((image, index) => (
              <CarouselItem key={image.src}>
                <figure className="overflow-hidden bg-foreground/[0.02]">
                  <div className="aspect-square overflow-hidden bg-foreground/[0.03]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-contain"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </div>
                  {image.caption && (
                    <figcaption className="px-1 py-3 text-xs leading-relaxed text-foreground/50">
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 bg-background/90 text-foreground hover:bg-background" />
          <CarouselNext className="right-3 bg-background/90 text-foreground hover:bg-background" />
        </Carousel>
      </div>
    );
  }

  if (media.type === "image" && media.src) {
    return (
      <figure className="my-6 overflow-hidden bg-foreground/[0.02]">
        <img
          src={media.src}
          alt={media.alt ?? ""}
          className="h-auto w-full"
          loading="lazy"
          decoding="async"
        />
        {media.caption && (
          <figcaption className="px-1 py-3 text-xs leading-relaxed text-foreground/50">
            {media.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const project = projectItems.find((p) => p.id === id);

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <button onClick={() => navigate("/?section=projects")} className="pill-back">← Back to work</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      <ReadingProgress />
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
          className="pt-28 pb-24 px-6 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: EASE_TEXT, delay: 0.08 }}
        >
          <button type="button" onClick={() => navigate("/?section=projects")} className="pill-back mb-10">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Back to work</span>
          </button>

          <div className="article-shell">
            <div>
              <div className="article-meta">
                <span>{project.year}</span>
                <span data-dot aria-hidden="true" />
                <span>{sourceLabel[project.source] ?? project.source}</span>
              </div>

              <h1 className="article-title">{project.title}</h1>
              <p className="article-subtitle">{project.summary}</p>

              <div className="article-hero aspect-[16/9]">
                <img
                  src={project.image}
                  alt={project.title}
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </div>

              <div ref={bodyRef} className="article-body">
                {project.sections.map((section) => (
                  <section key={section.heading} id={slugify(section.heading)}>
                    <h2>{section.heading}</h2>
                    {section.paragraphs?.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {section.bullets && (
                      <ul className="space-y-2">
                        {section.bullets.map((b) => (
                          <li key={b} className="flex gap-3">
                            <span className="mt-[0.7rem] h-[3px] w-[3px] shrink-0 rounded-full bg-foreground/40" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.links && (
                      <div className="space-y-2 mt-2">
                        {section.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between py-3 text-sm text-foreground/75 hover:text-foreground transition-colors"
                          >
                            <span>{link.label}</span>
                            <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-transform group-hover:-translate-y-[1px] group-hover:translate-x-[1px] group-hover:text-foreground" />
                          </a>
                        ))}
                      </div>
                    )}
                    {section.media?.map((media) => (
                      <ProjectMediaBlock
                        key={media.src ?? media.images?.map((image) => image.src).join("|")}
                        media={media}
                      />
                    ))}
                  </section>
                ))}
              </div>
            </div>
          </div>
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

export default ProjectDetailPage;
