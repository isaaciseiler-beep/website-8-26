import { useOverlayFocus } from "@/hooks/useOverlayFocus";
import MotionSurface from "@/components/MotionSurface";
import { useNavigationMotion, useMotionPreference } from "@/hooks/useMotionPreference";
import { warmRoute } from "@/lib/routePreload";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { SearchGroup, SearchResult } from "@/lib/searchIndex";
import { useIsMobile } from "@/hooks/use-mobile";
import { setSiteOverlayOpen } from "@/lib/siteOverlay";
import { MOTION_DURATION, MOTION_EASE_ENTER } from "@/lib/motion";

const EASE = MOTION_EASE_ENTER;

const EMPTY_SEARCH_GROUPS: SearchGroup[] = [];

type SearchIndexModule = typeof import("@/lib/searchIndex");

let searchIndexPromise: Promise<SearchIndexModule> | null = null;

const loadSearchIndex = () => {
  searchIndexPromise ??= import("@/lib/searchIndex");
  return searchIndexPromise;
};

interface SearchTriggerProps {
  variant?: "header" | "sidebar";
  className?: string;
  style?: CSSProperties;
  open?: boolean;
  renderPanel?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

const ResultRow = ({ result, state, onSelect }: {
  result: SearchResult;
  state?: object;
  onSelect: () => void;
}) => {
  const warm = () => { if (!result.external) void warmRoute(result.href); };
  const content = <>
    {result.image && <img src={result.image} alt="" width="40" height="40" loading="lazy" decoding="async" />}
    <span>{result.title}</span>
    {result.external && <ArrowUpRight size={14} strokeWidth={1.5} aria-label="External link" />}
  </>;
  return result.external
    ? <a className="site-search-result" href={result.href} target="_blank" rel="noopener noreferrer" onClick={onSelect}>{content}</a>
    : <Link className="site-search-result" to={result.href} state={state} onClick={onSelect} onPointerEnter={warm} onFocus={warm}>{content}</Link>;
};

interface SearchPanelProps {
  groups: SearchGroup[];
  hasQuery: boolean;
  hasResults: boolean;
  onSelect: (result: SearchResult) => void;
  resultState?: object;
  open: boolean;
  searchReady: boolean;
}

export const SearchPanel = ({ groups, hasQuery, hasResults, onSelect, open, searchReady, resultState }: SearchPanelProps) => {
  const navigationMotion = useNavigationMotion(open);

  useLayoutEffect(() => {
    setSiteOverlayOpen("search", open);
    return () => {
      setSiteOverlayOpen("search", false);
    };
  }, [open]);

  const resultCount = groups.reduce((total, group) => total + group.results.length, 0);
  const announcement = !open || !hasQuery ? ''
    : !searchReady ? 'Searching…'
    : hasResults ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'} available.`
    : 'No matches. Try a project, topic, or location.';

  return (
    <MotionSurface
      role="region"
      aria-label="Search results"
      className="site-sidebar-panel fixed inset-y-0 right-0 z-[85] isolate flex h-[100dvh] w-screen transform-gpu flex-col px-6 pb-0 pt-20 text-foreground will-change-transform md:w-[var(--site-panel-width)] md:py-20 md:pb-0"
      initial={false}
      aria-hidden={!open}
      {...(!open ? { inert: "" } : {})}
      style={{ pointerEvents: open ? "auto" : "none" }}
      animate={{ x: open ? 0 : "100%" }}
      transition={navigationMotion}
    >
      <p className="sr-only" role="status" aria-atomic="true">{announcement}</p>
      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 h-12 bg-[linear-gradient(to_bottom,hsl(var(--background))_0%,hsl(var(--background)/0.82)_34%,hsl(var(--background)/0)_100%)] md:top-20" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 pt-5 scrollbar-hide md:pb-12 md:pt-8">
        {!hasQuery ? <p className="site-search-hint">Search work, writing, and photographs.</p> : !searchReady ? (
          <p className="site-search-state">Searching…</p>
        ) : (
          <div>
            {hasResults ? (
              groups.map((group) =>
                group.results.length ? (
                  <motion.section
                    key={group.category}
                    className="pb-5 pt-5 first:pt-0 last:pb-6"
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: MOTION_DURATION.fast, ease: EASE }}
                  >
                    <p className="site-search-category">
                      {group.label}
                    </p>
                    <div className="space-y-2.5">
                      {group.results.map((result) => (
                        <ResultRow key={result.id} result={result} state={result.href.startsWith("/projects/") ? resultState : undefined} onSelect={() => onSelect(result)} />
                      ))}
                    </div>
                  </motion.section>
                ) : null,
              )
            ) : (
              <div className="site-search-state"><p>No matches</p><p>Try a project, topic, or location.</p></div>
            )}
          </div>
        )}
      </div>
    </MotionSurface>
  );
};

const SearchTrigger = ({
  variant = "header",
  className,
  style,
  open,
  renderPanel = true,
  onOpen,
  onClose,
  onOpenChange,
}: SearchTriggerProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const searchMotion = useNavigationMotion(Boolean(open ?? internalOpen));
  const reduced = useMotionPreference();
  const [query, setQuery] = useState("");
  const [searchIndexModule, setSearchIndexModule] = useState<SearchIndexModule | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isControlled = typeof open === "boolean";
  const panelOpen = isControlled ? open : internalOpen;
  const trimmedQuery = query.trim();
  const groups = useMemo(
    () => (searchIndexModule ? searchIndexModule.searchSite(query, 5) : EMPTY_SEARCH_GROUPS),
    [query, searchIndexModule],
  );
  const hasQuery = trimmedQuery.length > 0;
  const hasResults = searchIndexModule ? searchIndexModule.hasSearchResults(groups) : false;
  const firstResult = groups.find((group) => group.results.length)?.results[0];
  const searchWidth = panelOpen ? "var(--site-search-width)" : "var(--site-search-hit)";

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (nextOpen) onOpen?.();
    else onClose?.();
  };

  const handleOpen = () => {
    void loadSearchIndex().catch(() => {});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEnterSelect = (result: SearchResult) => {
    handleClose();
    if (result.external) {
      window.open(result.href, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(result.href, { state: result.href.startsWith('/projects/') ? location.pathname === '/work' ? { fromWork: true } : location.pathname === '/' ? { fromExplore: true } : undefined : undefined });
  };

  useOverlayFocus(Boolean(panelOpen) && variant === "header", "search", handleClose);

  useEffect(() => {
    if (!panelOpen && reduced) setQuery("");
  }, [panelOpen, reduced]);

  const handleEnter = () => {
    if (firstResult) handleEnterSelect(firstResult);
  };

  useEffect(() => {
    if (!panelOpen && !trimmedQuery) return;

    let active = true;
    void loadSearchIndex().then((module) => {
      if (active) setSearchIndexModule(module);
    });

    return () => {
      active = false;
    };
  }, [panelOpen, trimmedQuery]);

  useEffect(() => {
    if (!panelOpen || variant !== "header") return;
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timer);
  }, [panelOpen, variant]);

  return (
    <div data-site-overlay={variant === "header" && panelOpen ? "search" : undefined}
      role={variant === "header" && isMobile && panelOpen ? "dialog" : undefined}
      aria-modal={variant === "header" && isMobile && panelOpen ? true : undefined}
      aria-label={variant === "header" && isMobile && panelOpen ? "Search" : undefined}>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Search"
          className={`sidebar-search flex h-11 w-11 items-center justify-start text-primary ${className ?? ""}`}
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </button>
      ) : (
        <>
          {/* One glyph follows the fold in both directions. The form stays
              outside the difference layer so its text never blends. */}
          <div
            className={`site-search-xray site-search-track fixed z-[95] ${className ?? ""}`}
            style={{ ...style, width: searchWidth, transitionDuration: `${searchMotion.duration}s` }}
          >
            <button
              data-overlay-trigger="search"
              aria-hidden={panelOpen}
              tabIndex={panelOpen ? -1 : 0}
              type="button"
              onClick={handleOpen}
              style={{ pointerEvents: panelOpen ? "none" : "auto" }}
              className="site-search-icon flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.65} />
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleEnter();
            }}
            className={`site-header-search fixed z-[95] overflow-hidden ${className ?? ""}`}
            style={{ ...style, pointerEvents: "none", width: searchWidth, opacity: panelOpen ? 1 : 0, transitionDuration: `${searchMotion.duration}s, ${reduced ? 0 : MOTION_DURATION.exit}s` }}
            aria-hidden={!panelOpen}
            {...(!panelOpen ? { inert: "" } : {})}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget && event.propertyName === "width" && !panelOpen) setQuery("");
            }}
          >
            <div className="site-search-fields absolute inset-0 flex items-center gap-2" style={{ pointerEvents: panelOpen ? "auto" : "none" }}>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                aria-label="Search query"
                className="min-w-0 flex-1 bg-transparent text-right text-base font-medium leading-none text-inherit outline-none placeholder:text-current/35 md:text-sm"
              />
              <button
                type="button"
                onClick={handleClose}
                className="site-search-icon flex shrink-0 items-center justify-center text-current/55 transition-opacity duration-200 hover:opacity-80"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.65} />
              </button>
            </div>
          </form>
        </>
      )}
      {renderPanel ? (
        <SearchPanel
          groups={groups}
          hasQuery={hasQuery}
          hasResults={hasResults}
          onSelect={handleClose}
          resultState={location.pathname === "/work" ? { fromWork: true } : location.pathname === "/" ? { fromExplore: true } : undefined}
          open={panelOpen}
          searchReady={Boolean(searchIndexModule)}
        />
      ) : null}
    </div>
  );
};

export default SearchTrigger;
