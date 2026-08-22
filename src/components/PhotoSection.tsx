import { useRef, useState, useEffect, useMemo } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { albums, albumPhotos } from "@/lib/photoAlbums";
import { preloadImage, scheduleImagePreloads } from "@/lib/imagePreload";
import { useIsMobile } from "@/hooks/use-mobile";

const SET_SIZE = 10;

// Slow -> fast -> slow cadence across the ten frames (ms per step).
const STEP_DELAYS = [520, 400, 300, 210, 150, 130, 150, 210, 320, 460];
const delayForStep = (step: number) => STEP_DELAYS[step % STEP_DELAYS.length];

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
      }, delayForStep(tick));
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

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      timer = setTimeout(() => {
        setActiveIdx((current) => (current + 1) % photos.length);
        step += 1;
        run();
      }, delayForStep(step));
    };
    run();

    return () => clearTimeout(timer);
  }, [hovering, isCycling, isMobile, photos.length, prefersReducedMotion]);

  if (!activePhoto) return null;

  return (
    <section className="h-[calc(100svh-3.5rem)] w-full md:h-[calc(100svh-3.5rem)]">
      <Link
        to="/photos"
        ref={previewRef}
        className="relative block h-full w-full cursor-pointer overflow-hidden bg-foreground/[0.05]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        aria-label="View photo portfolio"
      >
        {photos.map((photo) => (
          <img
            key={photo.image}
            src={photo.image}
            alt={photo.title}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: photo.image === activePhoto.image ? 1 : 0 }}
            loading="eager"
            decoding="async"
          />
        ))}
      </Link>
    </section>
  );
};

export default PhotoSection;
