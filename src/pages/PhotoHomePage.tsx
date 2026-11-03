import { useSidebarState } from "@/lib/siteChrome";
import { usePageVisible } from "@/hooks/useMotionPreference";
import { useNavigationMotion, motionReduced } from "@/hooks/useMotionPreference";
import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackArrow from "@/components/BackArrow";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import "./photo-home.css";
import HomeExplore from "@/components/canvas/HomeExplore";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import PhotoPreview from "@/components/PhotoPreview";
import { preloadImage, preloadImages, isLowDataConnection } from "@/lib/imagePreload";
import { albums, albumPhotos, coverFor, type Album, type Continent } from "@/lib/photoAlbums";
import { useIsMobile } from "@/hooks/use-mobile";
import { HEADER_SCROLL_OFFSET } from "@/lib/scroll";
import { shouldRestoreInitialScrollFor } from "@/lib/navigationScroll";
import { MOTION_DURATION, MOTION_EASE, MOTION_EASE_ENTER } from "@/lib/motion";

const continents: ("All" | Continent)[] = ["All", "Asia", "Europe", "Oceania", "North America"];

const GALLERY_SCROLL_OFFSET = HEADER_SCROLL_OFFSET + 12;
const EASE = MOTION_EASE_ENTER;
const EASE_TEXT = MOTION_EASE;

const shuffleArray = <T,>(arr: T[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// One order per document load; filtering and opening an album never reshuffle it.
const shuffledAlbums = shuffleArray(albums);
const shuffledPhotos = new Map(albums.map(album => [album.folder, shuffleArray(albumPhotos(album))]));

const AlbumCover = ({ album }: { album: Album }) => {
  const [hovering, setHovering] = useState(false);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [decodedSrcs, setDecodedSrcs] = useState<Set<string>>(() => new Set([coverFor(album)]));
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const photos = useMemo(() => shuffledPhotos.get(album.folder) ?? [], [album.folder]);
  const readyHoverPhotos = photos.filter((src) => src !== coverFor(album) && decodedSrcs.has(src));
  const photoCount = readyHoverPhotos.length;

  useEffect(() => {
    if (!hovering || isLowDataConnection()) return;

    photos.slice(0, 2).forEach((src) => {
      void preloadImage(src, { decode: true, fetchPriority: "low" }).then((loaded) => {
        if (!loaded) return;
        setDecodedSrcs((current) => {
          if (current.has(src)) return current;
          const next = new Set(current);
          next.add(src);
          return next;
        });
      });
    });
  }, [hovering, photos]);

  useEffect(() => {
    setFlashIdx(-1);
    if (!hovering || reduced || !visible || !photoCount) return;
    // One preview after intent is established, then hold until focus/hover leaves.
    const timer = window.setTimeout(() => setFlashIdx(0), 340);
    return () => window.clearTimeout(timer);
  }, [hovering, reduced, visible, photoCount]);

  const cover = coverFor(album);
  const uniqueSrcs = [...new Set([cover, ...readyHoverPhotos])];
  const activeImage = !reduced && visible && hovering && flashIdx >= 0 ? readyHoverPhotos[flashIdx] ?? cover : cover;
  const prepareAlbum = () => {
    if (!isLowDataConnection()) void preloadImages(photos.slice(0, 2), { decode: true, fetchPriority: "low" });
  };

  return (
    <Link
      to={`/?album=${encodeURIComponent(album.folder)}`}
      state={{ fromGallery: true }}
      aria-label={`Open ${album.location} album`}
      className="photo-tile relative cursor-pointer overflow-hidden group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      onPointerEnter={event => { if (event.pointerType !== "touch") { setHovering(true); prepareAlbum(); } }}
      onFocus={() => { setHovering(true); prepareAlbum(); }}
      onBlur={() => setHovering(false)}
      onPointerLeave={() => setHovering(false)}
      onTouchStart={prepareAlbum}
    >
      <div className="aspect-[2/3] overflow-hidden relative">
        {uniqueSrcs.map((src) => (
          <img
            key={src}
            src={src}
            data-primary-cover={src === cover ? "true" : undefined}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: src === activeImage ? 1 : 0,
              filter: "grayscale(0%)",
              transition: reduced ? "none" : "opacity var(--motion-base) var(--motion-ease)",
            }}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          />
        ))}
      </div>
      <span className="photo-hover-label" aria-hidden="true">{album.location}</span>
    </Link>
  );
};

const LocationTabs = ({ filter, onSelect }: { filter: string; onSelect: (location: string) => void }) => {
  const tabs = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const strip = tabs.current;
    const selected = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!strip || !selected) return;
    const frame = strip.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    const delta = item.left < frame.left ? item.left - frame.left : item.right > frame.right ? item.right - frame.right : 0;
    if (delta) strip.scrollTo({ left: strip.scrollLeft + delta, behavior: reducedMotion ? 'instant' : 'smooth' });
  }, [filter, reducedMotion]);
  return <div ref={tabs} className="work-library-tabs" role="tablist" aria-label="Filter albums">
    {continents.map((location, index) => <button key={location} type="button" role="tab" aria-selected={filter === location} tabIndex={filter === location ? 0 : -1}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? continents.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + continents.length) % continents.length;
        onSelect(continents[next]); tabs.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus({ preventScroll: true });
      }} onClick={() => onSelect(location)} className={`pill-tab ${filter === location ? "is-active" : ""}`}>
      {filter === location && <motion.span layoutId="photos-tab-pill" className="pill-tab-indicator" transition={{ type: "tween", duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}/>}
      <span className="pill-tab-label">{location}</span>
    </button>)}
  </div>;
};

const PhotoHomePage = () => {
  const home = true;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const filterScrollFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(filterScrollFrame.current), []);
  const [photosDominant, setPhotosDominant] = useState(false);
  const [filter, setFilter] = useState("All");
  const openAlbum = albums.find(album => album.folder === searchParams.get("album"))?.location ?? null;
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const isMobile = useIsMobile();

  const filtered = filter === "All" ? shuffledAlbums : shuffledAlbums.filter(album => album.continent === filter);
  const currentAlbum = openAlbum ? albums.find((a) => a.location === openAlbum) : null;
  const currentAlbumPhotos = useMemo(() => (currentAlbum ? shuffledPhotos.get(currentAlbum.folder) ?? [] : []), [currentAlbum]);
  const previewImages = currentAlbumPhotos;

  useEffect(() => {
    if (!home || openAlbum) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const gallery = document.getElementById("photo-gallery");
      if (!gallery) { setPhotosDominant(false); return; }
      const rect = gallery.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      // Keep an active filter reachable even when it leaves fewer than one full row.
      setPhotosDominant(window.scrollY > 0 && (visibleHeight / window.innerHeight > .5 || (filter !== "All" && visibleHeight > 0)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    if (mainRef.current) observer.observe(mainRef.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [home, openAlbum, filter]);

  const selectLocation = (location: string) => {
    setFilter(location);
    if (home) {
      cancelAnimationFrame(filterScrollFrame.current);
      filterScrollFrame.current = requestAnimationFrame(() => {
        const gallery = document.getElementById("photo-gallery");
        if (!gallery) return;
        const top = Math.max(0, window.scrollY + gallery.getBoundingClientRect().top - GALLERY_SCROLL_OFFSET);
        window.scrollTo({ top, behavior: reduceMotion ? "instant" : "smooth" });
      });
    }
    if (searchParams.has("album")) { const next = new URLSearchParams(searchParams); next.delete("album"); setSearchParams(next); }
  };

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className={`relative min-h-screen bg-background text-foreground overflow-x-clip${home && !openAlbum ? " photo-home-exploration" : ""}`}>
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
        transition={navigationMotion}
      >
        <motion.main
          ref={mainRef}
          className={home && !openAlbum ? "pb-0" : "pt-28 pb-0"}
          initial={false}
        >
          {home && !openAlbum && <><h1 className="sr-only">Isaac Seiler</h1><HomeExplore /></>}


          <div className="photo-route-content">
            {openAlbum && currentAlbum ? (
              <motion.div
                key={`album-${openAlbum}`}
                initial={false}
                transition={{ duration: reduceMotion ? 0 : MOTION_DURATION.fast, ease: EASE }}
                className="photos-shell"
              >
                <header className="album-photo-header">
                  <BackArrow
                    onClick={() => { if (location.state?.fromGallery) navigate(-1); else setSearchParams({}, { state: { restoreGallery: true } }); }}
                    label="All photos"
                  />
                  <h1 className="album-photo-title">{currentAlbum.location}</h1>
                </header>

                <div className="album-photo-grid">
                  {Array.from({ length: Math.ceil(currentAlbumPhotos.length / 2) }, (_, row) => <div className={`album-photo-row${row % 2 ? ' album-photo-row--reverse' : ''}`} key={row}>
                    {currentAlbumPhotos.slice(row * 2, row * 2 + 2).map((photo, column) => {
                      const index = row * 2 + column;
                      return <motion.button type="button" key={photo} initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.02, margin: "0px 0px 60px 0px" }}
                        transition={{ duration: reduceMotion ? 0 : MOTION_DURATION.reveal, ease: EASE }}
                        className={`photo-tile album-photo-tile${column === (row % 2 ? 0 : 1) ? ' album-photo-tile--square' : ''}`}
                        aria-label={`Open ${currentAlbum.location} photograph ${index + 1}`} onClick={() => setPreviewIdx(index)}>
                        <img src={photo} alt="" loading={index < 2 ? "eager" : "lazy"} decoding="async" fetchpriority={index < 2 ? "high" : "low"}/>
                      </motion.button>;
                    })}
                  </div>)}
                </div>

              </motion.div>
            ) : (
              <motion.div
                key={home ? "overview" : `overview-${filter}`}
                style={home ? { minHeight: `calc(100svh - ${GALLERY_SCROLL_OFFSET}px)` } : undefined}
                initial={false}
                transition={{ duration: reduceMotion ? 0 : MOTION_DURATION.fast, ease: EASE }}
                className="photos-shell photo-overview-shell"
              >
                <div id="photo-gallery" className="site-corner photo-album-gallery">
                  {filtered.map((album, i) => (
                    <motion.div
                      key={album.location}
                      initial={false}
                    >
                      <AlbumCover album={album} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="h-24" />
        </motion.main>


      </motion.div>

      <AnimatePresence>
        {home && !openAlbum && photosDominant && !sidebarOpen && !searchOpen && previewIdx === null && <motion.div
          className="photo-location-ticker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : MOTION_DURATION.base, ease: MOTION_EASE } }}
          transition={{ duration: reduceMotion ? 0 : MOTION_DURATION.reveal, ease: MOTION_EASE }}
        >
          <LocationTabs filter={filter} onSelect={selectLocation}/>
        </motion.div>}
      </AnimatePresence>

      <PhotoPreview
        images={previewImages}
        currentIndex={previewIdx}
        onClose={() => setPreviewIdx(null)}
        onNavigate={setPreviewIdx}
      />

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

export default PhotoHomePage;
