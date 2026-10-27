import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import SearchTrigger from "@/components/SearchOverlay";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motion";

interface SiteHeaderProps {
  open: boolean;
  onToggle: () => void;
  searchOpen?: boolean;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
}


const SiteHeader = ({ open, onToggle, searchOpen, onSearchOpen, onSearchClose }: SiteHeaderProps) => {
  // Blend against the actual page, outside route transforms and isolated panels.
  // Keep search results outside this blend layer so their text is not inverted.
  return createPortal(<>
    <div className="site-header-xray fixed left-0 top-0 z-[60] flex items-center gap-1 px-6 py-4">
      <Link to="/" state={open ? { sidebarOpen: true } : undefined} className="site-home-link" aria-label="IIS home">
        <Logo />
      </Link>
      <motion.button
        onClick={onToggle}
        className="site-nav-toggle-xray flex h-5 w-5 items-center justify-center"
        aria-label="Toggle menu"
        aria-expanded={open}
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </motion.button>
    </div>
    <SearchTrigger open={searchOpen} onOpen={onSearchOpen} onClose={onSearchClose}/>
  </>, document.body);
};

export default SiteHeader;
