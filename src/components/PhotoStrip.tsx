import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMotionPreference as useReducedMotion, usePageVisible } from "@/hooks/useMotionPreference";
import { useIsMobile } from "@/hooks/use-mobile";
import { featuredPhotos } from "@/lib/photoAlbums";
import { isLowDataConnection, preloadImage } from "@/lib/imagePreload";
import { macintoshBaseStyle } from "@/lib/macintoshModels";
import "./photo-strip.css";

// Both photo layers share this plane, including the moving click targets.
const STEP = 46;
const CARD_W = 300;
const CARD_H = 420;
const PREVIEW_W = CARD_H * 1.5;
const DRIFT = 16; // px per second along the strip
const stripHover = {
  intent: 135,
  approach: 320,
  slop: 12,
  release: 180,
  handoff: 500,
};

const set = featuredPhotos;
// Three copies let the strip wrap seamlessly; the middle copy is the one keyboard users reach.
const cards = [...set, ...set, ...set];
const SET_WIDTH = set.length * STEP;
const isReachable = (index: number) => index >= set.length && index < set.length * 2;
const albumHref = (folder: string) => `/photos?album=${encodeURIComponent(folder)}`;

const reveal = (img: HTMLImageElement | null) => { if (img?.complete && img.naturalWidth) img.classList.add("is-loaded"); };

type Preview = { index: number; offset: number };
// A departing preview stays mounted while it folds back into its slice.
type Floating = Preview & { up: boolean; opened: boolean };
type Drag = { start: number; last: number; time: number; velocity: number; moving: boolean };

export default function PhotoStrip() {
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const isMobile = useIsMobile();
  const scale = isMobile ? 0.72 : 1;
  const stripFrame = useRef<HTMLDivElement>(null);
  const captionAction = useRef<HTMLAnchorElement>(null);
  const tracks = useRef<(HTMLDivElement | null)[]>([]);
  const glideLayer = useRef<HTMLDivElement>(null);
  const phase = useRef(SET_WIDTH * 0.35);
  const glideOffset = useRef(0);
  const speed = useRef(DRIFT);
  const held = useRef(false);
  const intent = useRef(0);
  const leaving = useRef(0);
  const frame = useRef(0);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const hoverOrigin = useRef<number | null>(null);
  const handoffUntil = useRef(0);
  const hovered = useRef<number | null>(null);
  const drag = useRef<Drag | null>(null);
  const dragged = useRef(false);
  const activeRef = useRef<number | null>(null);
  const focusedRef = useRef<number | null>(null);
  const floatingRef = useRef<Floating[]>([]);
  const [width, setWidth] = useState(1200);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [glide, setGlide] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [floating, setFloating] = useState<Floating[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const active = preview?.index ?? null;
  activeRef.current = active;
  focusedRef.current = focused;
  floatingRef.current = floating;

  const place = () => {
    const x = -(SET_WIDTH + phase.current);
    tracks.current.forEach(track => { if (track) track.style.transform = `translate3d(${x}px, 0, 0)`; });
  };

  useLayoutEffect(() => {
    const node = stripFrame.current;
    if (!node) return;
    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    // Photos start loading a screen before the strip arrives, and drift pauses while it is out of view.
    if (typeof IntersectionObserver === "undefined") { setNear(true); return () => resize.disconnect(); }
    const approach = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: "100% 0px" });
    const view = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    approach.observe(node);
    view.observe(node);
    return () => { resize.disconnect(); approach.disconnect(); view.disconnect(); };
  }, []);

  // Ease into a short stop on hover and gradually resume drift when released.
  useEffect(() => {
    place();
    if (reduced || !visible || !onScreen) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const previousPhase = phase.current;
      if (!drag.current?.moving) {
        const target = held.current ? 0 : DRIFT;
        const damping = held.current ? 0.09 : 0.6;
        speed.current += (target - speed.current) * (1 - Math.exp(-dt / damping));
        if (Math.abs(speed.current - target) < 0.2) speed.current = target;
        phase.current += speed.current * dt;
      }
      // Keep the same copy under the pointer while a preview is pending or open.
      if (!held.current && !floatingRef.current.length) {
        const position = phase.current - glideOffset.current;
        phase.current = ((position % SET_WIDTH) + SET_WIDTH) % SET_WIDTH + glideOffset.current;
      }
      if (phase.current !== previousPhase) place();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reduced, visible, onScreen]);

  // Keep the old preview open until the next slice is mounted. Start both
  // crops and the neighboring slides together when handing off between photos.
  useLayoutEffect(() => {
    const center = (index: number) => {
      // The rail travels as one layer. Keep this position when the crop closes.
      const x = SET_WIDTH + phase.current - index * STEP - STEP / 2;
      glideOffset.current = x;
      setGlide(x);
    };
    if (reduced) {
      if (preview) center(preview.index);
      setFloating(preview ? [{ ...preview, up: true, opened: true }] : []);
      return;
    }
    if (!preview) {
      setFloating(current => current.filter(entry => entry.opened).map(entry => ({ ...entry, up: false })));
      return;
    }
    const { index } = preview;
    setFloating(current => {
      const next = current.filter(entry => entry.opened || entry.index === index)
        .map(entry => entry.index === index ? { ...entry, ...preview } : entry);
      if (!next.some(entry => entry.index === index)) next.push({ ...preview, up: false, opened: false });
      return next;
    });
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        handoffUntil.current = performance.now() + stripHover.handoff;
        center(index);
        setFloating(current => current.map(entry => (
          entry.index === index ? { ...entry, up: true, opened: true } : { ...entry, up: false }
        )));
      });
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [preview, reduced]);

  // Returning photos normally leave on transitionend; this catches any whose transition never ran.
  useEffect(() => {
    if (!floating.some(entry => !entry.up && entry.index !== active)) return;
    const timer = window.setTimeout(() => setFloating(current => current.filter(entry => entry.up || entry.index === activeRef.current)), 900);
    return () => window.clearTimeout(timer);
  }, [floating, active]);

  useEffect(() => () => {
    window.clearTimeout(intent.current);
    window.clearTimeout(leaving.current);
    cancelAnimationFrame(frame.current);
  }, []);

  // Scrolling moves the ribbon under a resting pointer without any pointer event, so hit-test again.
  useEffect(() => {
    const rescan = () => { if (pointer.current && !frame.current) frame.current = requestAnimationFrame(follow); };
    window.addEventListener("scroll", rescan, { passive: true });
    return () => window.removeEventListener("scroll", rescan);
  });

  // A tap elsewhere on the page settles a photo that was lifted by touch.
  useEffect(() => {
    if (active === null) return;
    const settle = (event: PointerEvent) => {
      if (event.pointerType === "touch" && !stripFrame.current?.contains(event.target as Node)) release();
    };
    document.addEventListener("pointerdown", settle);
    return () => document.removeEventListener("pointerdown", settle);
  });

  const engage = () => {
    window.clearTimeout(leaving.current);
    leaving.current = 0;
    held.current = true;
    // A hover eases out the ambient drift. A tap can also interrupt a fast fling.
    speed.current = Math.max(-DRIFT, Math.min(DRIFT, speed.current));
  };

  const lift = (index: number, slot?: HTMLElement) => {
    window.clearTimeout(intent.current);
    engage();
    if (slot && activeRef.current === index) return;
    // Hover has already eased the drift. Fix the track as the preview starts centering.
    speed.current = 0;
    hoverOrigin.current = slot ? pointer.current?.x ?? null : null;
    if (!isLowDataConnection()) void preloadImage(cards[index].large, { decode: true });
    // Start from the slice's current position, including any slide in progress.
    const offset = slot ? new DOMMatrixReadOnly(getComputedStyle(slot).transform).m41 : 0;
    setPreview({ index, offset });
  };

  const requestLift = (index: number, slot: HTMLElement, delay: number) => {
    engage();
    window.clearTimeout(intent.current);
    if (activeRef.current === index) return;
    const attempt = () => {
      const remaining = handoffUntil.current - performance.now();
      if (!reduced && remaining > 0) {
        intent.current = window.setTimeout(attempt, remaining);
        return;
      }
      const point = pointer.current;
      if (point && document.elementFromPoint(point.x, point.y)?.closest("[data-slot]") === slot) lift(index, slot);
      else {
        hovered.current = null;
        if (!frame.current) frame.current = requestAnimationFrame(follow);
      }
    };
    intent.current = window.setTimeout(attempt, delay);
  };

  const release = (delay = stripHover.release) => {
    window.clearTimeout(intent.current);
    if (leaving.current) return;
    leaving.current = window.setTimeout(() => {
      leaving.current = 0;
      held.current = false;
      hoverOrigin.current = null;
      setPreview(null);
    }, delay);
  };

  // The visible preview owns its full crop. Other slices remain reachable as they slide away.
  const follow = () => {
    frame.current = 0;
    const bounds = stripFrame.current?.getBoundingClientRect();
    if (!pointer.current || !bounds) return;
    const { x, y } = pointer.current;
    const center = bounds.left + bounds.width / 2;
    const target = document.elementFromPoint(x, y);
    const slot = target?.closest<HTMLElement>("[data-slot]");
    if (slot && stripFrame.current?.contains(slot)) {
      const origin = hoverOrigin.current;
      if (origin !== null && Math.abs(x - origin) < stripHover.slop) {
        hovered.current = null;
        window.clearTimeout(intent.current);
        engage();
        return;
      }
      const index = Number(slot.dataset.slot);
      if (index !== hovered.current) {
        hovered.current = index;
        // Let the pointer travel to the center without immediately opening the slices it crosses.
        const approaching = origin !== null && (x - origin) * (x - center) <= 0;
        requestLift(index, slot, approaching ? stripHover.approach : stripHover.intent);
      }
      return;
    }
    hovered.current = null;
    window.clearTimeout(intent.current);
    if (target?.closest(".photo-strip-lift.is-up")) {
      engage();
      // Clear the approach once the pointer has reached the preview's final area.
      const current = floatingRef.current.find(entry => entry.up);
      if (current && Math.abs(x - center) < previewFrame(current).photoWidth * scale / 2) hoverOrigin.current = null;
    } else if (activeRef.current !== null && target?.closest(".photo-strip-caption")) {
      engage();
    } else if ((activeRef.current !== null || held.current) && !hasPreviewFocus()) release();
  };

  const hasPreviewFocus = () => focusedRef.current !== null || captionAction.current === document.activeElement;

  const focusCard = (index: number) => {
    setFocused(index);
    lift(index);
    stripFrame.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  };

  const photoWidth = Math.max(CARD_W, Math.round(Math.min(PREVIEW_W, (width - 16) / scale)));

  const previewFrame = ({ index }: Preview) => {
    const slot = index * STEP;
    const crop = (photoWidth - CARD_W) / 2;
    const left = slot + (STEP - photoWidth) / 2;
    return { photoWidth, slot, crop, left };
  };

  const startDrag = (x: number, time: number) => { drag.current = { start: x, last: x, time, velocity: 0, moving: false }; };

  const moveDrag = (x: number, time: number) => {
    const current = drag.current;
    if (!current) return;
    if (!current.moving) {
      if (Math.abs(x - current.start) < 8) return;
      // A sideways swipe scrubs the ribbon and closes the preview.
      current.moving = true;
      dragged.current = true;
      const rail = glideLayer.current;
      if (rail) {
        const x = new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41;
        glideOffset.current = x;
        setGlide(x);
      }
      window.clearTimeout(leaving.current);
      leaving.current = 0;
      held.current = false;
      hoverOrigin.current = null;
      setPreview(null);
    }
    const delta = (current.last - x) / scale;
    const dt = Math.max(1, time - current.time) / 1000;
    current.velocity = current.velocity * 0.2 + (delta / dt) * 0.8;
    current.last = x;
    current.time = time;
    phase.current += delta;
    place();
  };

  const endDrag = (fling: boolean) => {
    const current = drag.current;
    drag.current = null;
    if (current?.moving && fling) speed.current = Math.max(-2400, Math.min(2400, current.velocity));
    if (current && !current.moving && activeRef.current === null) release();
  };

  // The preview and both sides share one opening curve, so the slices meet its edges.
  const spacing = floating.find(entry => entry.up);
  const selectedPhoto = spacing && cards[spacing.index];
  const spacingFrame = spacing && previewFrame(spacing);
  const shiftFor = (index: number) => {
    if (index === preview?.index) return preview.offset;
    if (!spacing || !spacingFrame) return 0;
    if (index === spacing.index) return spacing.offset;
    const { left, slot, photoWidth } = spacingFrame;
    return index < spacing.index ? left - slot : left + photoWidth - slot - STEP;
  };
  const lifted = new Set(floating.filter(entry => entry.opened).map(entry => entry.index));
  const glideStyle = { transform: `translate3d(${glide}px, 0, 0)` };

  return (
    <section className={`photo-strip photos-shell${reduced ? " is-reduced" : ""}`} aria-label="Selected photographs"
      style={{
        "--strip-step": `${STEP}px`,
        "--strip-card-width": `${CARD_W}px`,
        "--strip-card-height": `${CARD_H}px`,
        "--strip-scale": scale,
      } as CSSProperties}>
      <div ref={stripFrame} className="photo-strip-frame" style={macintoshBaseStyle}
        onPointerMove={event => {
          if (event.pointerType === "touch") { moveDrag(event.clientX, event.timeStamp); return; }
          pointer.current = { x: event.clientX, y: event.clientY };
          if (!frame.current) frame.current = requestAnimationFrame(follow);
        }}
        onPointerDown={event => {
          if (event.pointerType !== "touch") return;
          pointer.current = null;
          hoverOrigin.current = null;
          startDrag(event.clientX, event.timeStamp);
          dragged.current = false;
          const target = event.target as Element;
          if (target.closest("[data-slot], .photo-strip-lift, .photo-strip-caption")) engage();
          else release(0);
        }}
        onPointerUp={event => { if (event.pointerType === "touch") endDrag(true); }}
        onPointerCancel={() => endDrag(false)}
        onClickCapture={event => {
          if (!dragged.current || event.detail === 0) return;
          // The end of a swipe is not a tap.
          dragged.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
        onPointerLeave={event => {
          if (event.pointerType === "touch") return;
          hovered.current = null;
          pointer.current = null;
          // Keyboard focus keeps its photo lifted even when the pointer drifts away.
          if (!hasPreviewFocus()) release();
        }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setFocused(null); release(0); } }}>
        <div className="photo-strip-viewport">
          <div className="photo-strip-plane">
            <div ref={node => { tracks.current[0] = node; }} className="photo-strip-track" style={{ width: cards.length * STEP + CARD_W }}>
              <div ref={glideLayer} className="photo-strip-glide" style={glideStyle}>
                {cards.map((photo, index) => {
                  const reachable = isReachable(index);
                  return (
                    <Link key={index} to={albumHref(photo.folder)} className={`photo-strip-card${lifted.has(index) ? " is-away" : ""}`}
                      style={{ left: index * STEP, zIndex: index, transform: `translateX(${shiftFor(index)}px)` }}
                      tabIndex={reachable ? 0 : -1} aria-hidden={reachable ? undefined : true} aria-label={`Open ${photo.location} album`}
                      onFocus={() => focusCard(index)}>
                      {near && <img ref={reveal} src={photo.small} alt="" decoding="async" draggable={false} data-motion-image="true" onLoad={event => event.currentTarget.classList.add("is-loaded")} />}
                    </Link>
                  );
                })}
                {/* Hit targets travel with the slices. The preview clips its own hit area. */}
                <div className="photo-strip-hits" aria-hidden="true">
                  {cards.map((photo, index) => (
                    <Link key={index} to={albumHref(photo.folder)} tabIndex={-1} className="photo-strip-hit" data-slot={index} style={{ left: index * STEP, transform: `translateX(${shiftFor(index)}px)` }}
                      onPointerDown={event => {
                        if (event.button !== 0) return;
                        window.clearTimeout(intent.current);
                        engage();
                      }}
                      onClick={event => {
                        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                        // A slice previews the photo. The expanded photo opens its album.
                        event.preventDefault();
                        lift(index, event.currentTarget);
                      }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="photo-strip-plane photo-strip-plane--lift">
            <div ref={node => { tracks.current[1] = node; }} className="photo-strip-track">
              <div className="photo-strip-glide" style={glideStyle}>
                {floating.map(entry => {
                  const { index, up, opened, offset } = entry;
                  const photo = cards[index];
                  const { photoWidth, slot, crop, left } = previewFrame(entry);
                  const x = up ? left - slot + crop : opened ? shiftFor(index) : offset;
                  const clipPath = up
                    ? "inset(0)"
                    : `inset(0 ${photoWidth - crop - STEP}px 0 ${crop}px)`;
                  return (
                    <Link key={index} to={albumHref(photo.folder)} tabIndex={-1} aria-hidden="true"
                      className={`photo-strip-lift${up ? " is-up" : ""}${focused === index ? " is-focused" : ""}`}
                      style={{ left: slot - crop, width: photoWidth, transform: `translateX(${x}px)`, clipPath }}
                      onTransitionEnd={event => {
                        if (event.target !== event.currentTarget || event.propertyName !== "clip-path" || up) return;
                        setFloating(current => current.filter(entry => entry.index !== index || entry.up || entry.index === activeRef.current));
                      }}>
                      <span className="photo-strip-photo">
                        <img src={photo.small} alt="" draggable={false} data-motion-image="true" />
                        <img src={photo.large} alt="" draggable={false} decoding="async" data-motion-image="true" className={`photo-strip-large${loaded.has(photo.large) ? " is-loaded" : ""}`}
                          onLoad={() => setLoaded(current => current.has(photo.large) ? current : new Set(current).add(photo.large))} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="photo-strip-caption">
          {selectedPhoto && <div className="strip-caption-content" key={selectedPhoto.small}>
            <span>{selectedPhoto.location}</span>
            <Link ref={captionAction} className="photo-strip-action" to={albumHref(selectedPhoto.folder)} aria-label={`View ${selectedPhoto.location} album`}>
              View album <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>}
        </div>
      </div>
    </section>
  );
}
