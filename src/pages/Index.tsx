import { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar, { sitemapItems } from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { HEADER_SCROLL_OFFSET } from "@/lib/scroll";

const ProjectsSection = lazy(() => import("@/components/ProjectsSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
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
  const location = useLocation();

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  useEffect(() => {
    const section = new URLSearchParams(location.search).get("section");
    if (!section) return;
    const scroll = () => {
      const el = document.getElementById(section);
      if (!el) return false;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_SCROLL_OFFSET });
      return true;
    };
    if (scroll()) return;
    const timer = window.setInterval(() => {
      if (scroll()) window.clearInterval(timer);
    }, 120);
    const stop = window.setTimeout(() => window.clearInterval(timer), 3000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [location.search]);

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

  useEffect(() => {
    const overlap = sidebarOpen && !isMobile;
    document.body.dataset.sidebar = overlap ? "open" : "closed";
    return () => {
      delete document.body.dataset.sidebar;
    };
  }, [sidebarOpen, isMobile]);


  return (
    <div className="home-photo-v2 relative min-h-screen overflow-x-clip bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        activeSection={activeSection}
        showToggle={false}
      />

      <motion.div
        className="home-content-shell"
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 200 : 0,
          marginRight: searchOpen && !isMobile ? 200 : 0,
          width: sidebarOpen && !isMobile
            ? "calc(100% - 200px)"
            : searchOpen && !isMobile
              ? "calc(100% - 200px)"
              : "100%",
        }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <main>
          <Suspense fallback={<SectionFallback />}>
            <div id="hero" className="home-work-opening" data-reveal>
              <div id="about"><AboutSection revealEnabled /></div>
            </div>
            <div id="projects" className="home-photo-section" data-reveal><ProjectsSection /></div>
            <div className="home-photo-footer-stack">
              <div id="photos" className="home-photo-section home-photo-section--last" data-reveal><PhotoSection /></div>
              <Footer overlay />
            </div>
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
