import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SearchGroup, SearchResult } from "@/lib/searchIndex";
import { useIsMobile } from "@/hooks/use-mobile";
import { setSiteOverlayOpen } from "@/lib/siteOverlay";

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];
const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PANEL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const PANEL_DURATION = 0.64;
const SEARCH_BAR_TRANSITION = { duration: 0.68, ease: EASE };
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

const ResultCard = ({
  index,
  result,
  onSelect,
}: {
  index: number;
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}) => (
  <motion.button
    type="button"
    onClick={() => onSelect(result)}
    className="group block w-full text-left"
    initial={{ opacity: 0, x: 18, filter: "blur(6px)" }}
    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
    transition={{ delay: 0.05 + index * 0.035, duration: 0.46, ease: EASE }}
  >
    <div className="site-corner relative aspect-[4/3] w-full overflow-hidden bg-[hsl(var(--image-scrim))]">
      {result.image ? (
        <img
          src={result.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--image-scrim)/0.94)_0%,hsl(var(--image-scrim)/0.66)_44%,hsl(var(--highlight)/0.10)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-lg font-semibold leading-none tracking-tight text-white transition-colors duration-300 group-hover:text-[hsl(var(--highlight))]">
          {result.title}
        </p>
      </div>
      <ArrowUpRight
        className="absolute right-3 top-3 h-4 w-4 text-white/45 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[hsl(var(--highlight))]"
        strokeWidth={1.5}
      />
    </div>
  </motion.button>
);

interface SearchPanelProps {
  groups: SearchGroup[];
  hasQuery: boolean;
  hasResults: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  open: boolean;
  searchReady: boolean;
}

export const SearchPanel = ({ groups, hasQuery, hasResults, onClose, onSelect, open, searchReady }: SearchPanelProps) => {
  const isMobile = useIsMobile();

  useLayoutEffect(() => {
    setSiteOverlayOpen("search", open);
    return () => {
      setSiteOverlayOpen("search", false);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            role="dialog"
            aria-label="Search"
            className="site-sidebar-panel fixed inset-y-0 right-0 z-[85] isolate flex h-[100dvh] w-screen transform-gpu flex-col px-6 pb-0 pt-20 text-foreground will-change-transform md:w-[var(--site-panel-width)] md:py-20 md:pb-0"
            initial={{ x: isMobile ? "100%" : 200 }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ x: isMobile ? "100%" : 200 }}
            transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-20 z-10 h-12 bg-[linear-gradient(to_bottom,hsl(var(--background))_0%,hsl(var(--background)/0.82)_34%,hsl(var(--background)/0)_100%)] md:top-20" />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 pt-5 scrollbar-hide md:pb-12 md:pt-8">
              {!hasQuery ? null : !searchReady ? (
                <div className="grid min-h-[220px] place-items-center">
                  <p className="text-[28px] font-medium leading-none text-foreground/30 md:text-sm md:leading-normal">Searching</p>
                </div>
              ) : (
                <div>
                  {hasResults ? (
                    groups.map((group) =>
                      group.results.length ? (
                        <motion.section
                          key={group.category}
                          className="pb-5 pt-5 first:pt-0 last:pb-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.58, ease: EASE, delay: 0.05 }}
                        >
                          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/32">
                            {group.label}
                          </p>
                          <div className="space-y-2.5">
                            {group.results.map((result, resultIndex) => (
                              <ResultCard key={result.id} index={resultIndex} result={result} onSelect={onSelect} />
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
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
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
  const [query, setQuery] = useState("");
  const [searchIndexModule, setSearchIndexModule] = useState<SearchIndexModule | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
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
  const expandedSearchWidth = isMobile ? "calc(100vw - 3rem)" : "calc(var(--site-panel-width) - 3rem)";

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (nextOpen) onOpen?.();
    else onClose?.();
  };

  const handleOpen = () => {
    void loadSearchIndex().then(setSearchIndexModule);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSelect = (result: SearchResult) => {
    handleClose();
    if (result.external) {
      window.open(result.href, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(result.href);
  };

  const handleEnter = () => {
    if (firstResult) handleSelect(firstResult);
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
    const timer = window.setTimeout(() => inputRef.current?.focus(), 160);
    return () => window.clearTimeout(timer);
  }, [panelOpen, variant]);

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={handleOpen}
          className={`sidebar-main-nav-item group flex w-fit items-center gap-2 py-1.5 text-left text-foreground/30 transition-colors duration-300 hover:text-foreground/60 ${className ?? ""}`}
        >
          <Search className="h-[0.52em] w-[0.52em]" strokeWidth={1.5} />
          <span>Search</span>
        </button>
      ) : (
        <AnimatePresence initial={false} mode="wait">
          {!panelOpen ? (
            <motion.button
              key="search-button"
              type="button"
              onClick={handleOpen}
              className={`site-nav-toggle-xray fixed right-6 top-4 z-[60] flex h-[25px] w-[25px] items-center justify-center transition-opacity duration-200 hover:opacity-70 ${className ?? ""}`}
              style={style}
              aria-label="Search"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: EASE }}
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.65} />
            </motion.button>
          ) : (
            <motion.form
              key="search-input"
              onSubmit={(event) => {
                event.preventDefault();
                handleEnter();
              }}
              className={`site-header-search fixed right-6 top-4 z-[95] flex h-[25px] origin-right items-center gap-2 overflow-hidden will-change-[width] ${className ?? ""}`}
              style={style}
              initial={{ width: 25 }}
              animate={{ width: expandedSearchWidth }}
              exit={{ width: 25 }}
              transition={SEARCH_BAR_TRANSITION}
            >
              <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center">
                <Search className="h-3.5 w-3.5" strokeWidth={1.65} />
              </span>
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
                className="flex h-[25px] w-[25px] shrink-0 items-center justify-center text-current/55 transition-opacity duration-200 hover:opacity-80"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.65} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      )}
      {renderPanel ? (
        <SearchPanel
          groups={groups}
          hasQuery={hasQuery}
          hasResults={hasResults}
          onClose={handleClose}
          onSelect={handleSelect}
          open={panelOpen}
          searchReady={Boolean(searchIndexModule)}
        />
      ) : null}
    </>
  );
};

export default SearchTrigger;
