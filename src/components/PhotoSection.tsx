import { useRef, useState, useEffect, useMemo } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { albums, albumPhotos } from "@/lib/photoAlbums";
import { preloadImage, scheduleImagePreloads } from "@/lib/imagePreload";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/components/ThemeProvider";

const SET_SIZE = 10;

// Slow -> fast -> slow cadence across the ten frames (ms per step).
const STEP_DELAYS = [520, 400, 300, 210, 150, 130, 150, 210, 320, 460];
const delayForStep = (step: number) => STEP_DELAYS[step % STEP_DELAYS.length];

const photoFileName = (title: string, index: number) =>
  `PHOTO_${String(index + 1).padStart(2, "0")}_${title.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}.JPG`;

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
  const previewRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isSkull = theme === "skull";
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
    if (isSkull || prefersReducedMotion || hasAutoplayed || !isPreviewInView || !coversReady) {
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
  }, [coversReady, hasAutoplayed, isPreviewInView, isSkull, photos.length, prefersReducedMotion]);

  // Simple hover swipe-through.
  useEffect(() => {
    if (isSkull || prefersReducedMotion || isMobile || !hovering || isCycling) return;

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
  }, [hovering, isCycling, isMobile, isSkull, photos.length, prefersReducedMotion]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent("photo-section-visibility", { detail: { visible: entry.isIntersecting } }),
        );
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!activePhoto) return null;

  if (isSkull) {
    const activeFileName = photoFileName(activePhoto.title, activeIdx);

    return (
      <section ref={previewRef} className="skull-photo-browser" aria-labelledby="skull-photo-browser-title">
        <div className="skull-photo-window">
          <div className="skull-photo-titlebar">
            <strong id="skull-photo-browser-title">PHOTO VIEWER</strong>
            <span aria-hidden="true">_ □ ×</span>
          </div>
          <div className="skull-photo-menubar" aria-hidden="true">
            <span><u>F</u>ile</span>
            <span><u>V</u>iew</span>
            <span><u>H</u>elp</span>
          </div>
          <div className="skull-photo-window-body">
            <div className="skull-photo-file-list" role="listbox" aria-label="Photo files">
              {photos.map((photo, index) => {
                const selected = index === activeIdx;
                return (
                  <button
                    key={photo.image}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? "is-selected" : ""}
                    onClick={() => setActiveIdx(index)}
                  >
                    <span aria-hidden="true">▧</span>
                    {photoFileName(photo.title, index)}
                  </button>
                );
              })}
            </div>
            <figure className="skull-photo-preview">
              <figcaption>{activeFileName}</figcaption>
              <div className="skull-photo-preview-canvas">
                <img src={activePhoto.image} alt={activePhoto.title} loading="eager" decoding="async" />
              </div>
              <div className="skull-photo-status">
                {activeIdx + 1} of {photos.length} — {activePhoto.title}
              </div>
            </figure>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={previewRef} className="h-[calc(100svh-3.5rem)] w-full md:h-[calc(100svh-3.5rem)]">
      <Link
        to="/photos"
        className="relative block h-full w-full cursor-pointer overflow-hidden bg-foreground/[0.05]"
        data-robot-surface="photo-frame"
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
            style={{
              opacity: photo.image === activePhoto.image ? 1 : 0,
              transition: prefersReducedMotion ? undefined : "opacity var(--motion-base) var(--motion-ease)",
              zIndex: photo.image === activePhoto.image ? 1 : 0,
            }}
            loading="eager"
            decoding="async"
          />
        ))}
      </Link>
    </section>
  );
};

export default PhotoSection;
