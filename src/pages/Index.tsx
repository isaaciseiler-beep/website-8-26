import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar, { sitemapItems } from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { HEADER_SCROLL_OFFSET } from "@/lib/scroll";

const ProjectsSection = lazy(() => import("@/components/ProjectsSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const NewsSection = lazy(() => import("@/components/NewsSection"));
const PhotoSection = lazy(() => import("@/components/PhotoSection"));

const Footer = lazy(() => import("@/components/Footer"));

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const sectionIds = sitemapItems
  .map((item) => item.scrollTo)
  .filter((id): id is string => Boolean(id));

const SectionFallback = () => <div className="home-photo-section-fallback" aria-hidden="true" />;

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const isMobile = useIsMobile();

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const activationLine = HEADER_SCROLL_OFFSET + Math.min(window.innerHeight * 0.3, 280);
      let nextSection = sectionIds[0] ?? "hero";
      let bestDistance = Number.POSITIVE_INFINITY;

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top + Math.min(rect.height / 2, 240) - activationLine);
        if (distance < bestDistance) {
          bestDistance = distance;
          nextSection = id;
        }
      });

      setActiveSection((current) => current === nextSection ? current : nextSection);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div className="home-photo-v2 relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        activeSection={activeSection}
        showToggle={false}
      />

      <motion.div
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 240 : 0,
          marginRight: searchOpen && !isMobile ? 240 : 0,
          width: sidebarOpen && !isMobile
            ? "calc(100% - 240px)"
            : searchOpen && !isMobile
              ? "calc(100% - 240px)"
              : "100%",
        }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <main>
          <Suspense fallback={<SectionFallback />}>
            <div id="hero" className="home-work-opening">
              <div id="about"><AboutSection revealEnabled /></div>
            </div>
            <div id="projects" className="home-photo-section"><ProjectsSection /></div>
            <div id="news" className="home-photo-section"><NewsSection /></div>
            <div id="photos" className="home-photo-section home-photo-section--last"><PhotoSection /></div>
            <Footer />
          </Suspense>
        </main>
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

export default Index;
