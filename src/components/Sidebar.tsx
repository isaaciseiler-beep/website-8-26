import { useOverlayFocus } from "@/hooks/useOverlayFocus";
import { useSiteChrome } from "@/lib/siteChrome";
import { useNavigationMotion, useMotionPreference } from "@/hooks/useMotionPreference";
import { warmRoute } from "@/lib/routePreload";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, Github, Linkedin, Mail, Moon, Sun } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import SearchTrigger from "@/components/SearchOverlay";
import { CONTACT_MAILTO, GITHUB_URL, LINKEDIN_URL } from "@/lib/site";
import { scrollToPageSection } from "@/lib/scroll";
import { isSiteOverlayOpen, setSiteOverlayOpen } from "@/lib/siteOverlay";
import { MOTION_DURATION, MOTION_EASE, MOTION_EASE_ENTER } from "@/lib/motion";

const EASE = MOTION_EASE_ENTER;
const EASE_TEXT = MOTION_EASE;

const themeOptions = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
];

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="theme-switch relative grid h-9 w-[152px] grid-cols-2 overflow-hidden rounded-[7px] bg-foreground/[0.06] p-[3px]"
      role="radiogroup"
      aria-label="Appearance"
    >
      {themeOptions.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            onClick={() => setTheme(opt.value as Theme)}
            className={`relative z-10 flex items-center justify-center transition-colors duration-300 ${
              active ? "text-background" : "text-foreground"
            }`}
            aria-label={opt.label}
            title={opt.label}
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={event => {
              if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === 'Home' ? 'light' : event.key === 'End' ? 'dark' : opt.value === 'light' ? 'dark' : 'light';
              setTheme(next);
              event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[aria-label="${next === 'light' ? 'Light' : 'Dark'}"]`)?.focus();
            }}
          >
            {active ? (
              <motion.span
                layoutId="appearance-switch-indicator"
                className="theme-switch-indicator absolute inset-0 rounded-[7px] bg-primary"
                transition={{ type: "tween", duration: MOTION_DURATION.base, ease: MOTION_EASE }}
              />
            ) : null}
            <opt.icon className="relative z-10 h-[15px] w-[15px]" strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
};


interface SitemapItem {
  id: string;
  label: string;
  scrollTo?: string;
  href?: string;
  children?: { id: string; label: string; href: string }[];
}

export const sitemapItems: SitemapItem[] = [
  { id: "about", label: "About", href: "/about" },
  { id: "projects", label: "Work", href: "/work" },
  { id: "writing", label: "Writing", href: "/writing" },
  { id: "photos", label: "Photo Map", href: "/photos/map" },
  { id: "music", label: "Music", href: "/photos/music" },
];

const socialLinks = [
  { id: "goodreads", label: "Goodreads", href: "https://www.goodreads.com/user/show/205879141-isaac-seiler", icon: <BookOpen className="h-[17px] w-[17px]" strokeWidth={1.5} /> },
  {
    id: "linkedin", label: "LinkedIn", href: LINKEDIN_URL,
    icon: <Linkedin className="h-[17px] w-[17px]" strokeWidth={1.5} />,
  },
  {
    id: "github", label: "GitHub", href: GITHUB_URL,
    icon: <Github className="h-[17px] w-[17px]" strokeWidth={1.5} />,
  },

];

export interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onClose?: () => void;
  onSearchOpen?: () => void;
  activeSection?: string;
  showToggle?: boolean;
}

export const SidebarSurface = ({ open, onToggle, onClose, onSearchOpen, activeSection, showToggle = true }: SidebarProps) => {
  useOverlayFocus(open, "sidebar", onClose ?? onToggle);
  const navigationMotion = useNavigationMotion(open);
  const reduced = useMotionPreference();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [handoff, setHandoff] = useState<'waiting' | 'fade' | 'park' | null>(null);
  const pendingNavigation = useRef(false);
  const previousOpen = useRef(open);
  const close = useRef(onClose ?? onToggle);
  close.current = onClose ?? onToggle;
  useEffect(()=>{
    if(!open||window.innerWidth<768)return;
    const outside=(event:PointerEvent)=>{if(event.target instanceof Element&&!event.target.closest('[data-site-overlay="sidebar"],[data-overlay-trigger="sidebar"]'))close.current();};
    document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
  },[open]);
  const isOnPhotos = location.pathname === "/photos" || location.pathname === "/photos/map";
  const isOnMusic = location.pathname === "/photos/music";
  const isOnProjects = location.pathname === "/work" || location.pathname.startsWith("/projects");

  useEffect(() => {
    const prepare = () => {
      // Keep the full-width menu in place until the destination is ready
      // beneath it. Ordinary dismissal retains its own motion.
      pendingNavigation.current = true;
      setHandoff('waiting');
    };
    const ready = () => {
      if (!pendingNavigation.current) return;
      pendingNavigation.current = false;
      if (window.innerWidth >= 768) { setHandoff(null); close.current(); return; }
      setHandoff('fade');
      close.current();
      requestAnimationFrame(() => {
        if (isSiteOverlayOpen()) return;
        const subject = document.querySelector<HTMLElement>('main h1') ?? document.querySelector<HTMLElement>('main');
        subject?.setAttribute('tabindex', '-1');
        subject?.focus({ preventScroll: true });
      });
    };
    window.addEventListener('site-sidebar-navigation', prepare);
    window.addEventListener('site-page-ready', ready);
    return () => {
      window.removeEventListener('site-sidebar-navigation', prepare);
      window.removeEventListener('site-page-ready', ready);
    };
  }, []);

  useLayoutEffect(() => {
    document.body.toggleAttribute('data-sidebar-navigation-fade', handoff !== null);
    return () => document.body.removeAttribute('data-sidebar-navigation-fade');
  }, [handoff]);

  useEffect(() => {
    const reopened = open && !previousOpen.current;
    previousOpen.current = open;
    if (!open && handoff === 'waiting') {
      pendingNavigation.current = false;
      setHandoff('fade');
    } else if (reopened && (handoff === 'fade' || handoff === 'park')) {
      setHandoff(null);
    }
  }, [open, handoff]);

  useLayoutEffect(() => {
    setSiteOverlayOpen("sidebar", open);
    window.dispatchEvent(new CustomEvent("site-sidebar-state", { detail: { open } }));
    return () => {
      setSiteOverlayOpen("sidebar", false);
    };
  }, [open]);

  useEffect(() => {
    const activeParents = sitemapItems.reduce<Record<string, boolean>>((acc, item) => {
      if (item.children?.some((child) => location.pathname === child.href)) {
        acc[item.id] = true;
      }
      return acc;
    }, {});

    if (Object.keys(activeParents).length) {
      const [activeParent] = Object.keys(activeParents);
      if (activeParent) {
        setExpandedItems({ [activeParent]: true });
      }
    }
  }, [location.pathname]);

  const handleItemClick = (item: SitemapItem) => {
    if(window.innerWidth>=768)pendingNavigation.current=true;
    if (item.scrollTo) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          scrollToPageSection(item.scrollTo!);
        }, 100);
      } else {
        scrollToPageSection(item.scrollTo);
      }
    }
    if (item.href) navigate(item.href);
  };

  const handleChildClick = (child: { href: string }) => {
    if(window.innerWidth>=768)pendingNavigation.current=true;
    navigate(child.href);
  };

  const handleSocialClick = (href: string) => {
    if (href.startsWith("http")) window.open(href, "_blank", "noopener");
    else window.location.href = href;
  };

  const toggleChildren = (id: string) => {
    setExpandedItems((current) => (current[id] ? {} : { [id]: true }));
  };

  const isItemActive = (item: SitemapItem) => {
    if (location.pathname.startsWith("/writing") && item.id === "writing") return true;
    if (isOnPhotos && item.id === "photos") return true;
    if (isOnMusic && item.id === "music") return true;
    if (isOnProjects && item.id === "projects") return true;
    if (activeSection && activeSection === item.id) return true;
    return false;
  };

  const isChildActive = (child: { id: string; href: string }) => {
    if (location.pathname === "/photos/map" && child.id === "photo-map") return true;
    if (location.pathname === "/photos" && child.id === "portfolio") return true;
    if (isOnProjects && child.id === "project-archive") return true;
    return location.pathname === child.href;
  };


  return (
    <>
      {showToggle ? (
        <motion.button
          onClick={onToggle}
          className="site-corner relative z-[60] flex h-5 w-5 items-center justify-center text-foreground transition-colors duration-200 hover:text-foreground/60"
          aria-label="Toggle menu"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE_TEXT }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </motion.button>
      ) : null}

      <motion.nav
        data-site-overlay="sidebar"
        aria-label="Main navigation"
        className={`site-sidebar-panel fixed inset-y-0 left-0 z-[45] isolate flex h-[100dvh] w-screen transform-gpu flex-col justify-between overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-20 will-change-transform md:w-[var(--site-panel-width)] md:pb-6 md:pt-20 ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        initial={false}
        aria-hidden={!open}
        {...(!open ? { inert: "" } : {})}
        animate={{ x: handoff === 'fade' || handoff === 'waiting' ? 0 : open ? 0 : "-100%", opacity: handoff === 'fade' || handoff === 'park' ? 0 : 1 }}
        transition={handoff === 'park' ? { duration: 0 } : handoff ? { type: 'tween', duration: reduced ? 0 : MOTION_DURATION.panel, ease: EASE } : navigationMotion}
        onAnimationComplete={() => {
          // Park the invisible menu offscreen before restoring its ordinary
          // slide state, so finishing the fade cannot reveal a sliding panel.
          if (handoff === 'fade') setHandoff('park');
          else if (handoff === 'park') setHandoff(null);
        }}
      >
        <div className="mt-4 block flex-none">
              <div className="relative flex flex-col gap-0.5">
                <SearchTrigger variant="sidebar" renderPanel={false} onOpen={onSearchOpen} />
                {sitemapItems.map((item) => {
                  const active = isItemActive(item);
                  const hasChildren = Boolean(item.children?.length);
                  const expanded = Boolean(expandedItems[item.id]);
                  return (
                    <div key={item.id}>
                      <motion.div
                        initial={false}
                        className="flex items-center gap-2"
                      >
                        {item.href ? <Link
                          to={item.href}
                          onClick={()=>{if(window.innerWidth>=768)pendingNavigation.current=true;}}
                          onPointerEnter={() => warmRoute(item.href!)}
                          onFocus={() => warmRoute(item.href!)}
                          aria-current={active ? "page" : undefined}
                          className={`sidebar-main-nav-item sidebar-destination origin-left py-1.5 text-left text-foreground ${active ? "is-current" : ""}`}
                        >{item.label}</Link> : <button
                          onClick={() => handleItemClick(item)}
                          className="sidebar-main-nav-item origin-left py-1.5 text-left text-foreground"
                        >{item.label}</button>}

                        {hasChildren ? (
                          <motion.button
                            type="button"
                            onClick={() => toggleChildren(item.id)}
                            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label} links`}
                            aria-expanded={expanded}
                            aria-controls={`sidebar-${item.id}-children`}
                            className={`sidebar-main-nav-item site-corner flex h-[0.9em] w-[0.9em] items-center justify-center transition-colors duration-300 ${
                              active ? "text-foreground" : "text-foreground"
                            }`}
                            animate={{ rotate: expanded ? 90 : 0 }}
                            transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: EASE_TEXT }}
                          >
                            <ChevronRight className="h-[0.5625em] w-[0.5625em]" strokeWidth={1.65} />
                          </motion.button>
                        ) : null}
                      </motion.div>

                      <AnimatePresence initial={false}>
                        {hasChildren && expanded ? (
                          <motion.div
                            id={`sidebar-${item.id}-children`}
                            className="overflow-hidden"
                            initial={{ height: 0, opacity: 0, y: -4 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -5 }}
                            transition={{ duration: reduced ? 0 : MOTION_DURATION.base, ease: EASE_TEXT }}
                          >
                            {item.children?.map((child) => {
                              const childActive = isChildActive(child);
                              return (
                                <motion.button
                                  key={child.id}
                                  initial={false}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.34, ease: EASE }}
                                  onClick={() => handleChildClick(child)}
                                  className={`sidebar-main-nav-item block origin-left py-1.5 pl-6 text-left transition-colors duration-300 md:pl-4 ${
                                    childActive ? "text-foreground" : "text-foreground"
                                  }`}
                                >
                                  {child.label}
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <motion.div
              className="mt-auto block pt-10"
              initial={false}
            >
              <div>
                <p className="sidebar-section-label">Get in Touch</p>
                <div
                  className="theme-switch relative grid h-11 w-[166px] grid-cols-4 overflow-hidden rounded-[7px] bg-foreground/[0.06] p-[3px]"
                  role="group"
                  aria-label="Contact links"
                >
                  <button
                    onClick={() => { window.location.href = CONTACT_MAILTO; }}
                    className="sidebar-icon-link"
                    aria-label="Email"
                    title="Email"
                  >
                    <Mail className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  </button>
                  {socialLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleSocialClick(link.href)}
                      className="sidebar-icon-link"
                      aria-label={link.label}
                      title={link.label}
                    >
                      {link.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 shrink-0">
                <p className="sidebar-section-label">Appearance</p>
                <div className="flex justify-start">
                  <ThemeSwitch />
                </div>
              </div>
            </motion.div>
      </motion.nav>
    </>
  );
};

export default function Sidebar(props: SidebarProps) {
  const shared = useSiteChrome('sidebar', props);
  return shared ? null : <SidebarSurface {...props} />;
}
export type { SitemapItem };
