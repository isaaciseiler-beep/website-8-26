import { useRef, useState, useEffect, useMemo } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { albums, albumPhotos } from "@/lib/photoAlbums";
import { preloadImage, scheduleImagePreloads } from "@/lib/imagePreload";
import { useIsMobile } from "@/hooks/use-mobile";

const SET_SIZE = 8;

const buildRandomSet = () => {
  const pool = albums.flatMap((album) =>
    albumPhotos(album).map((image) => ({ image, title: album.location })),
  );

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(SET_SIZE, pool.length));
};

const PhotoSection = () => {
  const [hovering, setHovering] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hasAutoplayed, setHasAutoplayed] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [coversReady, setCoversReady] = useState(false);
  const previewRef = useRef<HTMLAnchorElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const isPreviewInView = useInView(previewRef, { amount: 0.55 });

  // Fresh random selection on every page load.
  const photos = useMemo(buildRandomSet, []);
  const activePhoto = photos[activeIdx] ?? photos[0];

  useEffect(() => {
    if (photos.length === 0) return;
    const imageUrls = photos.map((photo) => photo.image);
    const [firstImage, ...remainingImages] = imageUrls;

    void preloadImage(firstImage, {
      decode: false,
      fetchPriority: "high",
    }).then(() => setCoversReady(true));
    scheduleImagePreloads(remainingImages, {
      batchSize: isMobile ? 2 : 3,
      decode: false,
      fetchPriority: "low",
      idleTimeout: isMobile ? 1500 : 1000,
    });
  }, [isMobile, photos]);

  useEffect(() => {
    if (prefersReducedMotion || hasAutoplayed || !isPreviewInView || !coversReady) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsCycling(false);
      return;
    }

    let tick = 0;
    setIsCycling(true);
    const schedule = () => {
      timeoutRef.current = setTimeout(() => {
        setActiveIdx((tick + 1) % photos.length);
        tick += 1;
        if (tick >= photos.length) {
          setHasAutoplayed(true);
          setIsCycling(false);
          timeoutRef.current = null;
          return;
        }
        schedule();
      }, 420);
    };

    schedule();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [coversReady, hasAutoplayed, isPreviewInView, photos.length, prefersReducedMotion]);

  // Simple hover swipe-through.
  useEffect(() => {
    if (prefersReducedMotion || isMobile || !hovering || isCycling) return;

    const interval = setInterval(() => {
      setActiveIdx((current) => (current + 1) % photos.length);
    }, 420);

    return () => clearInterval(interval);
  }, [hovering, isCycling, isMobile, photos.length, prefersReducedMotion]);

  if (!activePhoto) return null;

  return (
    <section className="flex h-auto min-h-0 flex-col pb-0 pt-0 md:h-[calc(100svh-9.75rem)] md:min-h-[420px]">
      <div className="px-6 md:min-h-0 md:flex-1">
        <Link
          to="/photos"
          ref={previewRef}
          className="site-corner group relative block aspect-[4/5] h-auto min-h-0 w-full cursor-pointer overflow-hidden bg-foreground/[0.05] md:aspect-auto md:h-full"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-label="View photo portfolio"
        >
          <img
            key={activePhoto.image}
            src={activePhoto.image}
            alt={activePhoto.title}
            className="absolute inset-0 h-full w-full photo-crossfade object-cover"
            loading="eager"
            decoding="async"
          />
        </Link>
      </div>
    </section>
  );
};

export default PhotoSection;
