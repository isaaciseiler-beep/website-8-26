import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import "./photo-home.css";
import HomeExplore from "@/components/canvas/HomeExplore";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import PhotoPreview from "@/components/PhotoPreview";
import { preloadImage, preloadImages, scheduleImagePreloads } from "@/lib/imagePreload";
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

const AlbumCover = ({ album, onClick }: { album: Album; onClick: () => void }) => {
  const [hovering, setHovering] = useState(false);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [decodedSrcs, setDecodedSrcs] = useState<Set<string>>(() => new Set([coverFor(album)]));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photos = useMemo(() => shuffleArray(albumPhotos(album)), [album]);
  const readyHoverPhotos = photos.filter((src) => decodedSrcs.has(src));
  const photoCount = readyHoverPhotos.length;

  useEffect(() => {
    if (!hovering) return;

    photos.slice(0, 4).forEach((src) => {
      void preloadImage(src, { decode: false, fetchPriority: "low" }).then((loaded) => {
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
    if (hovering && photoCount > 0) {
      let tick = 0;
      const maxFlashes = Math.min(photoCount, 2);
      intervalRef.current = setInterval(() => {
        tick++;
        if (tick > maxFlashes) {
          setFlashIdx(-1);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setFlashIdx(tick % photoCount);
        }
      }, 380);
    } else {
      setFlashIdx(-1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hovering, photoCount]);

  const cover = coverFor(album);
  const uniqueSrcs = [...new Set([cover, ...readyHoverPhotos])];
  const activeImage = flashIdx >= 0 ? readyHoverPhotos[flashIdx] ?? cover : cover;
  const prepareAlbum = () => {
    void preloadImages(photos.slice(0, 6), { decode: false, fetchPriority: "high" });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${album.location} album`}
      className="photo-tile relative cursor-pointer overflow-hidden group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } }}
      onClick={onClick}
      onMouseEnter={() => { setHovering(true); prepareAlbum(); }}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={prepareAlbum}
    >
      <div className="aspect-[2/3] overflow-hidden relative">
        {uniqueSrcs.map((src) => (
          <img
            key={src}
            src={src}
            alt={album.location}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: src === activeImage ? 1 : 0,
              filter: "grayscale(0%)",
              transition: "opacity 220ms cubic-bezier(0.2, 0.78, 0.22, 1), filter 340ms cubic-bezier(0.2, 0.78, 0.22, 1)",
            }}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          />
        ))}
      </div>
      <span className="photo-hover-label" aria-hidden="true">{album.location}</span>
    </div>
  );
};

const LocationTabs = ({ filter, onSelect }: { filter: string; onSelect: (location: string) => void }) => (
  <div className="work-library-tabs" role="tablist" aria-label="Filter albums">
    {continents.map(location => <button key={location} type="button" role="tab" aria-selected={filter === location} onClick={() => onSelect(location)} className={`pill-tab ${filter === location ? "is-active" : ""}`}>
      {filter === location && <motion.span layoutId="photos-tab-pill" className="pill-tab-indicator" transition={{ type: "tween", duration: MOTION_DURATION.base, ease: EASE_TEXT }}/>}
      <span className="pill-tab-label">{location}</span>
    </button>)}
  </div>
);

const PhotoHomePage = () => {
  const home = true;
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const filterScrollFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(filterScrollFrame.current), []);
  const [photosDominant, setPhotosDominant] = useState(false);
  const [filter, setFilter] = useState("All");
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const filtered = filter === "All" ? shuffledAlbums : shuffledAlbums.filter(album => album.continent === filter);
  const currentAlbum = openAlbum ? albums.find((a) => a.location === openAlbum) : null;
  const currentAlbumPhotos = useMemo(() => (currentAlbum ? shuffledPhotos.get(currentAlbum.folder) ?? [] : []), [currentAlbum]);
  const albumScrollMountedRef = useRef(false);
  const preserveReloadedAlbumRef = useRef(
    shouldRestoreInitialScrollFor(`${window.location.pathname}${window.location.search}`) && searchParams.has("album"),
  );

  useEffect(() => {
    const albumFolder = searchParams.get("album");
    if (!albumFolder) return;

    const album = albums.find((candidate) => candidate.folder === albumFolder);
    if (album && album.location !== openAlbum) {
      setFilter("All");
      setOpenAlbum(album.location);
    }
  }, [openAlbum, searchParams]);

  useEffect(() => {
    if (!albumScrollMountedRef.current) {
      albumScrollMountedRef.current = true;
      return;
    }
    if (preserveReloadedAlbumRef.current) {
      preserveReloadedAlbumRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [openAlbum]);

  const previewImages = currentAlbumPhotos;

  useEffect(() => {
    scheduleImagePreloads(albums.map(coverFor), {
      batchSize: isMobile ? 2 : 4,
      decode: false,
      fallbackDelay: isMobile ? 240 : 160,
      fetchPriority: "low",
      idleTimeout: isMobile ? 1200 : 800,
    });
  }, [isMobile]);

  useEffect(() => {
    if (!currentAlbum) return;
    scheduleImagePreloads(currentAlbumPhotos.slice(0, isMobile ? 4 : 6), {
      batchSize: isMobile ? 2 : 3,
      decode: false,
      fetchPriority: "low",
      idleTimeout: isMobile ? 1400 : 900,
    });
  }, [currentAlbum, currentAlbumPhotos, isMobile]);

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
    setOpenAlbum(null);
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
        transition={{ duration: MOTION_DURATION.reveal, ease: EASE_TEXT }}
      >
        <motion.main
          ref={mainRef}
          className={home && !openAlbum ? "pb-0" : "pt-28 pb-0"}
          initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: MOTION_DURATION.reveal, ease: EASE, delay: 0.04 }}
        >
          {home && !openAlbum && <HomeExplore />}


          <AnimatePresence mode="wait">
            {openAlbum && currentAlbum ? (
              <motion.div
                key={`album-${openAlbum}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: MOTION_DURATION.base, ease: EASE }}
                className="photos-shell"
              >
                <motion.button
                  type="button"
                  onClick={() => { setOpenAlbum(null); setSearchParams({}); }}
                  aria-label="All photos"
                  className="pill-back mb-12"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04, duration: MOTION_DURATION.fast, ease: EASE }}
                >
                  <span>{home ? "←" : "← All photos"}</span>
                </motion.button>

                <div className="site-corner album-photo-grid">
                  {currentAlbumPhotos.map((photo, index) => (
                    <button
                      type="button"
                      key={photo}
                      className="photo-tile album-photo-tile"
                      aria-label={`Open ${currentAlbum.location} photograph ${index + 1}`}
                      onClick={() => setPreviewIdx(index)}
                    >
                      <img src={photo} alt="" loading={index < 2 ? "eager" : "lazy"}
                        decoding="async" fetchpriority={index < 2 ? "high" : "low"}/>
                      <span className="photo-hover-label" aria-hidden="true">{currentAlbum.location}</span>
                    </button>
                  ))}
                </div>

              </motion.div>
            ) : (
              <motion.div
                key={home ? "overview" : `overview-${filter}`}
                style={home ? { minHeight: `calc(100svh - ${GALLERY_SCROLL_OFFSET}px)` } : undefined}
                initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: MOTION_DURATION.base, ease: EASE }}
                className="photos-shell photo-overview-shell"
              >
                <div id="photo-gallery" className="site-corner photo-album-gallery">
                  {filtered.map((album, i) => (
                    <motion.div
                      key={album.location}
                      initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: Math.min(i * 0.025, 0.16), duration: MOTION_DURATION.base, ease: EASE }}
                    >
                      <AlbumCover
                        album={album}
                        onClick={() => {
                          setOpenAlbum(album.location);
                          setSearchParams({ album: album.folder });
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-24" />
        </motion.main>


      </motion.div>

      <AnimatePresence>
        {home && !openAlbum && photosDominant && !sidebarOpen && !searchOpen && previewIdx === null && <motion.div className="photo-location-ticker" initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : 12 }} transition={{ duration: reduceMotion ? 0 : .24, ease: EASE }}>
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
