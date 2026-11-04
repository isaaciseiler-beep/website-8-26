import { useOverlayFocus } from "@/hooks/useOverlayFocus";
import MotionSurface from "@/components/MotionSurface";
import { useNavigationMotion, useMotionPreference } from "@/hooks/useMotionPreference";
import { warmRoute } from "@/lib/routePreload";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { SearchGroup, SearchResult } from "@/lib/searchIndex";
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

const ResultRow = ({ result, query, state, onSelect, active, optionId }: {
  result: SearchResult;
  query: string;
  state?: object;
  onSelect: () => void;
  active?: boolean;
  optionId?: string;
}) => {
  const warm = () => { if (!result.external) void warmRoute(result.href); };
  const terms = query.trim().split(/\s+/).filter(term => term.length > 1).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const match = terms.length ? new RegExp(`(${terms.join('|')})`, 'gi') : null;
  const title = match ? result.title.split(match).map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part) : result.title;
  const content = <>
    {result.image && <img src={result.image} alt="" width="40" height="40" loading="lazy" decoding="async" />}
    <span>{title}</span>
    {result.external && <ArrowUpRight size={14} strokeWidth={1.5} aria-label="External link" />}
  </>;
  return result.external
    ? <a id={optionId} role="option" aria-selected={active} className={`site-search-result${active ? " is-active" : ""}`} href={result.href} target="_blank" rel="noopener noreferrer" onClick={onSelect}>{content}</a>
    : <Link id={optionId} role="option" aria-selected={active} className={`site-search-result${active ? " is-active" : ""}`} to={result.href} state={state} onClick={onSelect} onPointerEnter={warm} onFocus={warm}>{content}</Link>;
};

interface SearchPanelProps {
  query?: string;
  groups: SearchGroup[];
  hasQuery: boolean;
  hasResults: boolean;
  onSelect: (result: SearchResult) => void;
  onDismiss?: () => void;
  resultState?: object;
  open: boolean;
  searchReady: boolean;
  activeIndex?: number;
}

export const SearchPanel = ({ groups, query = '', hasQuery, hasResults, onSelect, onDismiss, open, searchReady, resultState, activeIndex = -1 }: SearchPanelProps) => {
  const navigationMotion = useNavigationMotion(open);
  const reduced = useMotionPreference();
  const results=groups.flatMap(group=>group.results);
  useEffect(()=>{document.getElementById(`site-search-option-${activeIndex}`)?.scrollIntoView({block:'nearest'});},[activeIndex]);

  useLayoutEffect(() => {
    setSiteOverlayOpen("search", open);
    return () => {
      setSiteOverlayOpen("search", false);
    };
  }, [open]);

  return (
    <><AnimatePresence>{open&&<motion.div className="site-search-backdrop fixed inset-0 z-[80] bg-background/75 backdrop-blur-sm" aria-hidden="true" onClick={onDismiss} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:MOTION_DURATION.fast}}/>}</AnimatePresence><MotionSurface
      role="region"
      aria-label="Search results"
      className="site-sidebar-panel fixed inset-y-0 right-0 z-[85] isolate flex h-[100dvh] w-screen transform-gpu flex-col px-6 pb-0 pt-20 text-foreground will-change-transform md:w-[560px] md:py-20 md:pb-0"
      initial={false}
      aria-hidden={!open}
      {...(!open ? { inert: "" } : {})}
      style={{ pointerEvents: open ? "auto" : "none" }}
      animate={{ x: open ? 0 : "100%" }}
      transition={navigationMotion}
    >
      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 h-12 bg-[linear-gradient(to_bottom,hsl(var(--background))_0%,hsl(var(--background)/0.82)_34%,hsl(var(--background)/0)_100%)] md:top-20" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 pt-5 scrollbar-hide md:pb-12 md:pt-8">
        {!hasQuery ? <p className="site-search-hint">Search work, writing, and photographs.</p> : !searchReady ? (
          <div className="grid min-h-[220px] place-items-center">
            <p className="text-[28px] font-medium leading-none text-foreground/30 md:text-sm md:leading-normal">Searching</p>
          </div>
        ) : (
          <div id="site-search-listbox" role="listbox" aria-label="Matching pages">
            {hasResults ? (
              groups.map((group) =>
                group.results.length ? (
                  <motion.section
                    key={group.category}
                    role="group" aria-label={group.label}
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
                        <ResultRow key={result.id} optionId={`site-search-option-${results.indexOf(result)}`} active={activeIndex===results.indexOf(result)} result={result} query={query} state={result.href.startsWith("/projects/") ? resultState : undefined} onSelect={() => onSelect(result)} />
                      ))}
                    </div>
                  </motion.section>
                ) : null,
              )
            ) : (
              <div className="grid min-h-[220px] place-items-center">
                <p className="text-[28px] font-medium leading-none text-foreground/30 md:text-sm md:leading-normal">No matches</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MotionSurface></>
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
  const isControlled = typeof open === "boolean";
  const panelOpen = isControlled ? open : internalOpen;
  const trimmedQuery = query.trim();
  const groups = useMemo(
    () => (searchIndexModule ? searchIndexModule.searchSite(query, 5) : EMPTY_SEARCH_GROUPS),
    [query, searchIndexModule],
  );
  const hasQuery = trimmedQuery.length > 0;
  const hasResults = searchIndexModule ? searchIndexModule.hasSearchResults(groups) : false;
  const results = groups.flatMap(group=>group.results);
  const [activeIndex,setActiveIndex]=useState(-1);
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
    const result=results[activeIndex]??results[0];
    if (result) handleEnterSelect(result);
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

  useEffect(()=>{
    if(variant!=='header')return;
    const shortcut=(event:KeyboardEvent)=>{
      const editing=event.target instanceof HTMLElement&&Boolean(event.target.closest('input,textarea,select,[contenteditable="true"]'));
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'||event.key==='/'&&!editing&&!event.metaKey&&!event.ctrlKey&&!event.altKey){event.preventDefault();handleOpen();}
    };
    window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut);
  });
  return (
    <div data-site-overlay={variant === "header" && panelOpen ? "search" : undefined}
      role={variant === "header" && panelOpen ? "dialog" : undefined}
      aria-modal={variant === "header" && panelOpen ? true : undefined}
      aria-label={variant === "header" && panelOpen ? "Search" : undefined}>
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
              title="Search"
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
                onChange={(event) => {setQuery(event.target.value);setActiveIndex(-1);}}
                role="combobox" aria-expanded={Boolean(panelOpen&&hasQuery&&searchIndexModule)} aria-controls={hasQuery&&searchIndexModule?"site-search-listbox":undefined} aria-autocomplete="list" aria-activedescendant={results[activeIndex]?`site-search-option-${activeIndex}`:undefined}
                onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if((event.key==='ArrowDown'||event.key==='ArrowUp')&&results.length){event.preventDefault();setActiveIndex(index=>event.key==='ArrowDown'?(index+1)%results.length:index<=0?results.length-1:index-1);}}}
                placeholder="Search"
                aria-label="Search query"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent text-left text-base font-medium leading-none text-inherit outline-none placeholder:text-current/35 md:text-sm"
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
          query={query}
          groups={groups}
          hasQuery={hasQuery}
          hasResults={hasResults}
          onSelect={handleClose}
          onDismiss={handleClose}
          resultState={location.pathname === "/work" ? { fromWork: true } : location.pathname === "/" ? { fromExplore: true } : undefined}
          open={panelOpen}
          searchReady={Boolean(searchIndexModule)}
          activeIndex={activeIndex}
        />
      ) : null}
    </div>
  );
};

export default SearchTrigger;
