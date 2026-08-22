import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Footer from "@/components/Footer";
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

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ProjectMediaBlock = ({ media }: { media: ProjectMedia }) => {
  if (media.type === "pdf" && media.src) {
    return (
      <figure className="site-corner my-6 overflow-hidden bg-foreground/[0.02]">
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
                <figure className="site-corner overflow-hidden border border-foreground/10 bg-foreground/[0.02]">
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
                    <figcaption className="border-t border-foreground/10 px-4 py-3 text-xs leading-relaxed text-foreground/55">
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
      <figure className="site-corner my-6 overflow-hidden border border-foreground/10 bg-foreground/[0.02]">
        <img
          src={media.src}
          alt={media.alt ?? ""}
          className="h-auto w-full"
          loading="lazy"
          decoding="async"
        />
        {media.caption && (
          <figcaption className="border-t border-foreground/10 px-4 py-3 text-xs leading-relaxed text-foreground/55">
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
        <button onClick={() => navigate("/?section=projects")} className="font-mono text-xs uppercase tracking-widest">← Back to projects</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
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
          className="pt-28 pb-20 px-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: EASE_TEXT, delay: 0.1 }}
        >
          <button
            onClick={() => navigate("/?section=projects")}
            className="back-projects-button group relative mb-8 inline-flex items-center justify-center overflow-hidden rounded-full bg-foreground px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] cursor-pointer"
          >
            <span
              className="absolute inset-0 origin-right scale-x-0 bg-primary/90 transition-transform duration-700 group-hover:scale-x-100"
              style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
            />
            <span className="back-projects-button-label relative z-10 flex items-center transition-colors duration-500">
              <span
                className="inline-flex max-w-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-w-[1.5rem] group-hover:opacity-100"
                style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
              >
                <ArrowLeft className="w-3 h-3 mr-1.5 shrink-0" strokeWidth={1.5} />
              </span>
              All Projects
            </span>
          </button>

          <div className="mb-3 flex items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50">{project.year}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">{project.title}</h1>
          <p className="text-base md:text-lg text-foreground/65 leading-relaxed mb-10">{project.summary}</p>

          <div className="site-corner aspect-[16/9] overflow-hidden mb-12">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          </div>

          <div className="space-y-10">
            {project.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-3">{section.heading}</h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="mb-3 text-[15px] leading-relaxed text-foreground/70">{p}</p>
                ))}
                {section.bullets && (
                  <ul className="space-y-2">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-foreground/70">
                        <span className="mt-[0.55rem] h-[3px] w-[3px] shrink-0 rounded-full bg-foreground/40" />
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
                        className="group flex items-center justify-between border-b border-foreground/10 py-3 text-sm text-foreground/75 hover:text-foreground transition-colors"
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
