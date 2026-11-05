import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SearchTrigger from "@/components/SearchOverlay";
import { useNavigationMotion } from "@/hooks/useMotionPreference";
import { useSiteChrome } from "@/lib/siteChrome";
import { projectItems } from "@/lib/siteContent";

function useBreadcrumb() {
  const { pathname } = useLocation();
  const crumbs: { label: string; to: string }[] = [];
  if (pathname === "/work" || pathname.startsWith("/projects/")) crumbs.push({ label: "Work", to: "/work" });
  if (pathname.startsWith("/projects/")) {
    const id = decodeURIComponent(pathname.split("/")[2] ?? "");
    const title = projectItems.find(project => project.id === id)?.title;
    if (title) crumbs.push({ label: title, to: pathname });
  } else if (pathname === "/about") crumbs.push({ label: "About", to: "/about" });
  else if (pathname === "/writing" || pathname.startsWith("/writing/")) crumbs.push({ label: "Writing", to: "/writing" });
  else if (pathname === "/photos/map") crumbs.push({ label: "Photo Map", to: "/photos/map" });
  return crumbs;
}

export interface SiteHeaderProps {
  open: boolean;
  onToggle: () => void;
  searchOpen?: boolean;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
}


export const SiteHeaderSurface = ({ open, onToggle, searchOpen, onSearchOpen, onSearchClose }: SiteHeaderProps) => {
  const navigationMotion = useNavigationMotion(open);
  const { pathname } = useLocation();
  const crumbs = useBreadcrumb();
  const [scrolled, setScrolled] = useState(false);
  const [showPageTitle, setShowPageTitle] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!pathname.startsWith('/projects/')) {
      setShowPageTitle(false);
      return;
    }
    const heading = document.querySelector('main h1');
    if (!heading) {
      setShowPageTitle(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setShowPageTitle(!entry.isIntersecting), { rootMargin: '-72px 0px 0px 0px', threshold: 0 });
    observer.observe(heading);
    return () => observer.disconnect();
  }, [pathname]);
  // Blend against the actual page, outside route transforms and isolated panels.
  // Keep search results outside this blend layer so their text is not inverted.
  return createPortal(<>
    <a className="site-skip-link" href="#main-content" onClick={event=>{event.preventDefault();const main=document.querySelector<HTMLElement>('main');if(main){main.id='main-content';main.tabIndex=-1;main.focus();main.scrollIntoView({block:'start'});}}}>Skip to content</a>
    <div className={`site-header-scrim${scrolled ? ' is-scrolled' : ''}`} aria-hidden="true" />
    <div className="site-header-xray fixed left-0 top-0 z-[60] flex items-center px-6 py-4">
      <nav className="site-crumbs" aria-label="Breadcrumb">
        <Link to="/" state={open ? { sidebarOpen: true } : undefined} className="site-home-link" aria-label="IIS home">IIS</Link>
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1;
          const titleCrumb = current && pathname.startsWith('/projects/');
          if (titleCrumb && !showPageTitle) return null;
          return <span className="site-crumb" key={crumb.to}>
            <span className="site-crumb-sep" aria-hidden="true">/</span>
            {current ? <span className="site-crumb-current" aria-current="page">{crumb.label}</span> : <Link to={crumb.to}>{crumb.label}</Link>}
          </span>;
        })}
      </nav>
    </div>
    <div className="site-header-menu">
      <motion.button
        onClick={onToggle}
        className="site-nav-toggle-xray flex h-5 w-5 items-center justify-center"
        data-overlay-trigger="sidebar"
        aria-label="Toggle menu"
        title="Toggle menu"
        aria-expanded={open}
        animate={{ rotate: open ? 180 : 0 }}
        transition={navigationMotion}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </motion.button>
    </div>
    <SearchTrigger open={searchOpen} onOpen={onSearchOpen} onClose={onSearchClose}/>
  </>, document.getElementById("site-chrome-root") ?? document.body);
};

export default function SiteHeader(props: SiteHeaderProps) {
  const shared = useSiteChrome('header', props);
  return shared ? null : <SiteHeaderSurface {...props} />;
}
