import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Image as ImageIcon, Play } from "lucide-react";
import Footer from "@/components/Footer";
import ProjectSourceLinks from "@/components/ProjectSourceLinks";
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

const ProjectMediaBlock = ({
  media,
  overlayTitle,
}: {
  media: ProjectMedia;
  overlayTitle?: string;
}) => {
  if (media.type === "x-post" && media.href) {
    const tweetId = media.href.split("/").filter(Boolean).pop();

    return (
      <figure className="project-x-embed my-7">
        <div className="project-x-embed-frame">
          <iframe
            src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&id=${tweetId}`}
            title={media.title ?? "Embedded post on X"}
            loading="lazy"
            allowFullScreen
          />
        </div>
        {media.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    );
  }

  if (media.type === "placeholder") {
    const aspect = media.placeholderAspect ?? "landscape";

    return (
      <figure className="project-image-slot my-7">
        <div
          className={`project-image-slot-frame project-image-slot-${aspect} ${overlayTitle ? "project-media-with-heading" : ""}`}
          role="img"
          aria-label={media.alt}
        >
          <ImageIcon className="project-image-slot-icon" aria-hidden="true" strokeWidth={1.35} />
          <span className="project-image-slot-title">{media.title ?? "Image coming soon"}</span>
          {media.alt && <span className="project-image-slot-hint">{media.alt}</span>}
          {overlayTitle && (
            <div className="project-media-heading-overlay">
              <h2>{overlayTitle}</h2>
            </div>
          )}
        </div>
        {media.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    );
  }

  if (media.type === "video" && media.href) {
    return (
      <figure className="project-video my-7">
        <a
          href={media.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-video overflow-hidden bg-[#111] text-white"
          aria-label={`Play ${media.title ?? "official product video"}`}
        >
          {media.poster && (
            <img
              src={media.poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
              loading="lazy"
              decoding="async"
              onError={(event) => {
                if (media.fallbackPoster && event.currentTarget.src !== media.fallbackPoster) {
                  event.currentTarget.src = media.fallbackPoster;
                  return;
                }
                event.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/25 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-1 h-6 w-6 fill-current" aria-hidden="true" />
            </span>
          </span>
          <span className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-6 p-5 sm:p-7">
            <span className="block text-lg font-medium sm:text-xl">{media.title}</span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
          </span>
        </a>
        {media.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    );
  }

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

  if (media.type === "gallery" && media.images?.length) {
    const columns = media.layout === "three-up" ? "sm:grid-cols-3" : "sm:grid-cols-2";
    const square = media.layout === "three-up" || media.layout === "two-up-square";

    return (
      <div className={`project-media-grid my-7 grid grid-cols-1 gap-3 ${columns}`}>
        {media.images.map((image) => (
          <figure key={image.src} className="overflow-hidden bg-foreground/[0.025]">
            <img
              src={image.src}
              alt={image.alt}
              className={`${square ? "aspect-square object-cover" : "aspect-video object-contain"} h-auto w-full`}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.closest("figure")?.classList.add("hidden");
              }}
            />
            {image.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    );
  }

  if (media.type === "image" && media.src) {
    const layoutClass =
      media.layout === "half-left"
        ? "project-media-half project-media-half-left"
        : media.layout === "half-right"
          ? "project-media-half project-media-half-right"
          : "";

    return (
      <figure
        className={`project-media-image my-6 overflow-hidden bg-foreground/[0.02] ${layoutClass} ${overlayTitle ? "project-media-with-heading" : ""}`}
      >
        <img
          src={media.src}
          alt={media.alt ?? ""}
          className="h-auto w-full"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.closest("figure")?.classList.add("hidden");
          }}
        />
        {overlayTitle && (
          <div className="project-media-heading-overlay">
            <h2>{overlayTitle}</h2>
          </div>
        )}
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

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <button onClick={() => navigate("/?section=projects")} className="pill-back">← Back to work</button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-background text-foreground overflow-x-clip"
      data-project-id={project.id}
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
          className="pt-28 pb-24 px-6 content-measure"
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

              <h1 className={`article-title ${project.hideSummary ? "article-title-no-summary" : ""}`}>
                {project.title}
              </h1>
              {!project.hideSummary && <p className="article-subtitle">{project.summary}</p>}

              {!project.hideHero && (
                <div className="article-hero aspect-[16/9]">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                  />
                </div>
              )}

              {project.lead && <p className="article-topper">{project.lead}</p>}

              <div ref={bodyRef} className="article-body">
                {project.sections.map((section) => {
                  const topMedia = section.media?.filter((media) => media.placement === "top") ?? [];
                  const wrapMedia =
                    section.media?.filter(
                      (media) => media.layout === "half-left" || media.layout === "half-right",
                    ) ?? [];
                  const beforeLinksMedia =
                    section.media?.filter((media) => media.placement === "before-links") ?? [];
                  const bottomMedia =
                    section.media?.filter(
                      (media) =>
                        media.placement !== "top" &&
                        media.placement !== "before-links" &&
                        media.layout !== "half-left" &&
                        media.layout !== "half-right",
                    ) ?? [];
                  const overlayHeading = Boolean(section.overlayHeading && topMedia.length);

                  return (
                  <section key={section.heading} id={slugify(section.heading)} className="article-section">
                    {!overlayHeading && <h2>{section.heading}</h2>}
                    {topMedia.map((media) => (
                      <ProjectMediaBlock
                        key={media.src ?? media.href ?? media.images?.map((image) => image.src).join("|")}
                        media={media}
                        overlayTitle={overlayHeading ? section.heading : undefined}
                      />
                    ))}
                    {wrapMedia.map((media) => (
                      <ProjectMediaBlock
                        key={media.src ?? media.href ?? media.images?.map((image) => image.src).join("|")}
                        media={media}
                      />
                    ))}
                    {section.paragraphs?.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {section.pullQuote && (
                      <blockquote className="article-pull-quote">{section.pullQuote}</blockquote>
                    )}
                    {section.stats && (
                      <div className="article-stat-grid" aria-label="Project results">
                        {section.stats.map((stat) => (
                          <div key={`${stat.value}-${stat.label}`} className="article-stat-card">
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                    {beforeLinksMedia.map((media) => (
                      <ProjectMediaBlock
                        key={media.src ?? media.href ?? media.images?.map((image) => image.src).join("|")}
                        media={media}
                      />
                    ))}
                    {section.links && (
                      <ProjectSourceLinks links={section.links} />
                    )}
                    {bottomMedia.map((media) => (
                      <ProjectMediaBlock
                        key={media.src ?? media.href ?? media.images?.map((image) => image.src).join("|")}
                        media={media}
                      />
                    ))}
                  </section>
                  );
                })}
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
