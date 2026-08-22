import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import PhotoPreview from "@/components/PhotoPreview";
import { preloadImage, preloadImages, scheduleImagePreloads } from "@/lib/imagePreload";
import { albums, albumPhotoFiles, albumPhotos, coverFor, type Album, type Continent } from "@/lib/photoAlbums";
import { useIsMobile } from "@/hooks/use-mobile";

const continents: ("All" | Continent)[] = ["All", "Asia", "Europe", "Oceania"];

// Featured photos for the editorial layout above the grid — pulled from R2 albums
const findAlbum = (folder: string) => albums.find((a) => a.folder === folder)!;
const featuredPhotos = {
  hero: `${import.meta.env.BASE_URL ? "" : ""}${coverFor(findAlbum("Iceland"))}`,
  pairLeft: coverFor(findAlbum("NewZealand")),
  pairRight: coverFor(findAlbum("Japan")),
  overlap: coverFor(findAlbum("Taiwan")),
  bottom: coverFor(findAlbum("Australia")),
};
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const AlbumCover = ({ album, onClick }: { album: Album; onClick: () => void }) => {
  const [hovering, setHovering] = useState(false);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [decodedSrcs, setDecodedSrcs] = useState<Set<string>>(() => new Set([coverFor(album)]));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photos = useMemo(() => albumPhotos(album), [album]);
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
      const maxFlashes = Math.min(photoCount, 3);
      intervalRef.current = setInterval(() => {
        tick++;
        if (tick > maxFlashes) {
          setFlashIdx(-1);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setFlashIdx(tick % photoCount);
        }
      }, 320);
    } else {
      setFlashIdx(-1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hovering, photoCount]);

  const cover = coverFor(album);
  const uniqueSrcs = [...new Set([cover, ...readyHoverPhotos])];
  const activeImage = flashIdx >= 0 ? readyHoverPhotos[flashIdx] ?? cover : cover;

  return (
    <div
      className="relative cursor-pointer overflow-hidden group"
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
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
              transition: "opacity 150ms ease-out, filter 500ms ease-out",
            }}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          />
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 35%)" }} />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-sm font-medium tracking-tight text-white/90">{album.location}</h3>
        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/30 mt-0.5">{albumPhotoFiles(album).length}</p>
      </div>
    </div>
  );
};

type RowLayout = "full" | "pair" | "offset-right" | "offset-left";
const layoutPatterns: RowLayout[][] = [
  ["full", "pair", "offset-right", "full", "pair"],
  ["pair", "full", "offset-left", "pair", "full"],
  ["offset-right", "full", "pair", "offset-left", "full"],
];

const FeaturedHero = () => {
  const fade = {
    initial: { opacity: 0, y: 24, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  };
  return (
    <div className="px-6 mb-16 max-w-6xl mx-auto">
      <div className="site-corner overflow-hidden">
        {/* Row 1: full-width 4:3 */}
        <motion.div
          {...fade}
          transition={{ duration: 0.6, ease: EASE }}
          className="aspect-[4/3] overflow-hidden mb-[3px]"
        >
          <img src={featuredPhotos.hero} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" fetchpriority="high" />
        </motion.div>

        {/* Row 2: pair of 4:3 */}
        <div className="grid grid-cols-2 gap-[3px] mb-[3px]">
          <motion.div
            {...fade}
            transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
            className="aspect-[4/3] overflow-hidden"
          >
            <img src={featuredPhotos.pairLeft} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" fetchpriority="low" />
          </motion.div>
          <motion.div
            {...fade}
            transition={{ duration: 0.6, ease: EASE, delay: 0.14 }}
            className="aspect-[4/3] overflow-hidden"
          >
            <img src={featuredPhotos.pairRight} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" fetchpriority="low" />
          </motion.div>
        </div>

        {/* Row 3: full-width 4:3 with overlapping smaller photo on top-right */}
        <div className="relative">
          <motion.div
            {...fade}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="aspect-[4/3] overflow-hidden"
          >
            <img src={featuredPhotos.bottom} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" fetchpriority="low" />
          </motion.div>
          {/* Floating 70%-scale 4:3 sitting between row 2 and row 3, right-aligned with buffer */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.32 }}
            className="absolute right-[6%] aspect-[4/3] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] z-10"
            style={{
              width: "35%",
              top: 0,
              transform: "translateY(-50%)",
            }}
          >
            <img src={featuredPhotos.overlap} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" fetchpriority="low" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const PhotosPage = () => {
  const [filter, setFilter] = useState("All");
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const filtered = filter === "All" ? albums : albums.filter((a) => a.continent === filter);
  const currentAlbum = openAlbum ? albums.find((a) => a.location === openAlbum) : null;
  const currentAlbumPhotos = useMemo(() => (currentAlbum ? albumPhotos(currentAlbum) : []), [currentAlbum]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [openAlbum]);

  const buildRows = (photos: string[], albumIdx: number) => {
    const pattern = layoutPatterns[albumIdx % layoutPatterns.length];
    const rows: { layout: RowLayout; photos: string[]; startIdx: number }[] = [];
    let photoIdx = 0;
    for (let r = 0; photoIdx < photos.length; r++) {
      const layout = pattern[r % pattern.length];
      if (layout === "pair" && photoIdx + 1 < photos.length) {
        rows.push({ layout, photos: [photos[photoIdx], photos[photoIdx + 1]], startIdx: photoIdx });
        photoIdx += 2;
      } else {
        rows.push({ layout: layout === "pair" ? "full" : layout, photos: [photos[photoIdx]], startIdx: photoIdx });
        photoIdx += 1;
      }
    }
    return rows;
  };

  const previewImages = currentAlbumPhotos;

  useEffect(() => {
    const featured = [
      featuredPhotos.hero,
      featuredPhotos.pairLeft,
      featuredPhotos.pairRight,
      featuredPhotos.overlap,
      featuredPhotos.bottom,
    ];

    void preloadImages([featuredPhotos.hero], {
      decode: true,
      fetchPriority: "high",
      linkPreload: true,
    });
    scheduleImagePreloads([...featured.slice(1), ...albums.map(coverFor)], {
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

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
      />

      <motion.div
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 240 : 0,
          marginRight: searchOpen && !isMobile ? 240 : 0,
          width:
            sidebarOpen && !isMobile
              ? "calc(100% - 240px)"
              : searchOpen && !isMobile
                ? "calc(100% - 240px)"
                : "100%",
        }}
        transition={{ duration: 0.56, ease: EASE_TEXT }}
      >
        <motion.main
          className="pt-28 pb-0"
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        >
          {!openAlbum && (
            <FeaturedHero />
          )}

          {!openAlbum && (
            <div className="flex justify-center mb-16">
              <div className="flex flex-wrap justify-center gap-1 px-6 max-w-full">
                <LayoutGroup>
                  {continents.map((loc) => {
                    const active = filter === loc;
                    return (
                      <button
                        key={loc}
                        onClick={() => { setFilter(loc); setOpenAlbum(null); setSearchParams({}); }}
                        className="relative px-3 py-1 font-mono text-[9px] tracking-[0.2em] uppercase transition-colors duration-300"
                        style={{ color: active ? "hsl(var(--background))" : "hsl(var(--foreground) / 0.3)" }}
                      >
                        {active && (
                          <motion.div
                            layoutId="filter-pill"
                            className="absolute inset-0 bg-foreground"
                            style={{ zIndex: -1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        {loc}
                      </button>
                    );
                  })}
                </LayoutGroup>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {openAlbum && currentAlbum ? (
              <motion.div
                key={`album-${openAlbum}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="px-6 max-w-5xl mx-auto"
              >
                <motion.button
                  onClick={() => { setOpenAlbum(null); setSearchParams({}); }}
                  className="flex items-center gap-2 mb-12 text-foreground/30 hover:text-foreground transition-colors"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: EASE }}
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase">← All Photos</span>
                </motion.button>

                <div className="site-corner flex flex-col gap-[3px] overflow-hidden">
                  {buildRows(currentAlbumPhotos, albums.indexOf(currentAlbum)).map((row, rowIdx) => {
                    if (row.layout === "pair") {
                      return (
                        <div key={rowIdx} className="grid grid-cols-2 gap-[3px]">
                          {row.photos.map((photo, pi) => (
                            <motion.div
                              key={photo}
                              className="cursor-pointer overflow-hidden"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (row.startIdx + pi) * 0.05, duration: 0.5, ease: EASE }}
                              onClick={() => setPreviewIdx(row.startIdx + pi)}
                            >
                              <div className="aspect-[4/3] overflow-hidden">
                                <img
                                  src={photo}
                                  alt=""
                                  loading={row.startIdx + pi < 2 ? "eager" : "lazy"}
                                  decoding="async"
                                  fetchpriority={row.startIdx + pi < 2 ? "high" : "low"}
                                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      );
                    }
                    const photo = row.photos[0];
                    const isOffset = row.layout === "offset-right" || row.layout === "offset-left";
                    return (
                      <motion.div
                        key={photo}
                        className={`cursor-pointer overflow-hidden ${isOffset ? (row.layout === "offset-right" ? "ml-auto w-[75%]" : "mr-auto w-[75%]") : "w-full"}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: row.startIdx * 0.05, duration: 0.5, ease: EASE }}
                        onClick={() => setPreviewIdx(row.startIdx)}
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={photo}
                            alt=""
                            loading={row.startIdx < 2 ? "eager" : "lazy"}
                            decoding="async"
                            fetchpriority={row.startIdx < 2 ? "high" : "low"}
                            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-foreground/20 mt-10 text-right">{currentAlbum.location}</p>
              </motion.div>
            ) : (
              <motion.div
                key={`overview-${filter}`}
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="px-6"
              >
                <div className="site-corner grid grid-cols-2 gap-[3px] overflow-hidden sm:grid-cols-3">
                  {filtered.map((album, i) => (
                    <motion.div
                      key={album.location}
                      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: i * 0.07, duration: 0.5, ease: EASE }}
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

        <Footer />
      </motion.div>

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

export default PhotosPage;
