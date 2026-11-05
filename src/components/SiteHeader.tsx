import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import SearchTrigger from "@/components/SearchOverlay";
import { useNavigationMotion } from "@/hooks/useMotionPreference";
import { useSiteChrome } from "@/lib/siteChrome";

export interface SiteHeaderProps {
  open: boolean;
  onToggle: () => void;
  searchOpen?: boolean;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
}


export const SiteHeaderSurface = ({ open, onToggle, searchOpen, onSearchOpen, onSearchClose }: SiteHeaderProps) => {
  const navigationMotion = useNavigationMotion(open);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Blend against the actual page, outside route transforms and isolated panels.
  // Keep search results outside this blend layer so their text is not inverted.
  return createPortal(<>
    <a className="site-skip-link" href="#main-content" onClick={event=>{event.preventDefault();const main=document.querySelector<HTMLElement>('main');if(main){main.id='main-content';main.tabIndex=-1;main.focus();main.scrollIntoView({block:'start'});}}}>Skip to content</a>
    <div className={`site-header-scrim${scrolled ? ' is-scrolled' : ''}`} aria-hidden="true" />
    <div className="site-header-xray fixed left-0 top-0 z-[60] flex items-center gap-1 px-6 py-4">
      <Link to="/" state={open ? { sidebarOpen: true } : undefined} className="site-home-link" aria-label="IIS home">
        <Logo />
      </Link>
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
