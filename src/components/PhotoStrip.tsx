import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useMotionPreference as useReducedMotion, usePageVisible } from "@/hooks/useMotionPreference";
import { useIsMobile } from "@/hooks/use-mobile";
import { featuredPhotos } from "@/lib/photoAlbums";
import { isLowDataConnection, preloadImage } from "@/lib/imagePreload";
import "./photo-strip.css";

// Plane-space geometry. The strip is tilted once; a lifted photo undoes that tilt to face the viewer.
const STEP = 46;
const CARD_W = 300;
const CARD_H = 420;
const SPREAD = 150; // how far the nearest neighbours part on each side of the lifted photo
const REACH = 5; // cards over which the parting fades out, so the ribbon bends rather than splits
const DIP = 24; // how far the parted neighbours sink toward the viewer
const TILT_X = 54;
const TILT_Z = 26;
const PLANE_TOP = 0.31; // plane origin, as a fraction of the section height
const DRIFT = 16; // px per second along the strip
const INTENT_MS = 110; // dwell before switching photos, so sweeping across the strip stays calm
const GRACE_MS = 160; // time to cross from the ribbon onto the lifted photo without letting go
const SLIDE = 1 / Math.cos((TILT_Z * Math.PI) / 180); // screen px of horizontal drag to plane px

const set = featuredPhotos;
// Three copies let the strip wrap seamlessly; the middle copy is the one keyboard users reach.
const cards = [...set, ...set, ...set];
const SET_WIDTH = set.length * STEP;
const isReachable = (index: number) => index >= set.length && index < set.length * 2;
const albumHref = (folder: string) => `/photos?album=${encodeURIComponent(folder)}`;

// Neighbours part away from the lifted photo and sink a little, easing off with distance like a wave.
const falloff = (index: number, centre: number) => Math.exp(-(((Math.abs(index - centre) - 1) / REACH) ** 2));
const reveal = (img: HTMLImageElement | null) => { if (img?.complete && img.naturalWidth) img.classList.add("is-loaded"); };

// `flown` once a photo has left its slot; `yielding` once it is heading home to make way for another.
type Floating = { index: number; up: boolean; flown: boolean; yielding: boolean };
type Drag = { start: number; last: number; time: number; velocity: number; moving: boolean };

export default function PhotoStrip() {
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const isMobile = useIsMobile();
  const scale = isMobile ? 0.72 : 1;
  const section = useRef<HTMLElement>(null);
  const tracks = useRef<(HTMLDivElement | null)[]>([]);
  const phase = useRef(SET_WIDTH * 0.35);
  const speed = useRef(DRIFT);
  const held = useRef(false);
  const intent = useRef(0);
  const leaving = useRef(0);
  const frame = useRef(0);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const hovered = useRef<number | null>(null);
  const drag = useRef<Drag | null>(null);
  const dragged = useRef(false);
  const touchFirst = useRef(false);
  const activeRef = useRef<number | null>(null);
  const focusedRef = useRef<number | null>(null);
  const lastActive = useRef<number | null>(null);
  const floatingRef = useRef<Floating[]>([]);
  const [size, setSize] = useState({ w: 1200, h: 700, radius: 10 });
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [floating, setFloating] = useState<Floating[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  activeRef.current = active;
  focusedRef.current = focused;
  if (active !== null) lastActive.current = active;
  floatingRef.current = floating;

  const place = () => {
    const x = -(SET_WIDTH + phase.current);
    tracks.current.forEach(track => { if (track) track.style.transform = `translate3d(${x}px, 0, 0)`; });
  };

  useLayoutEffect(() => {
    const node = section.current;
    if (!node) return;
    const measure = () => setSize({ w: node.clientWidth, h: node.clientHeight, radius: parseFloat(getComputedStyle(node).getPropertyValue("--site-corner-radius")) || 10 });
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

  // Drift eases back in after the strip is released, stops at once when held, and carries a flick onward.
  useEffect(() => {
    place();
    if (reduced || !visible || !onScreen) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag.current?.moving) {
        speed.current += ((held.current ? 0 : DRIFT) - speed.current) * (1 - Math.exp(-dt / 0.6));
        phase.current += speed.current * dt;
      }
      // Never wrap while a photo is in flight; its geometry is anchored to the current copy.
      if (!floatingRef.current.length) phase.current = ((phase.current % SET_WIDTH) + SET_WIDTH) % SET_WIDTH;
      place();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reduced, visible, onScreen]);

  // A photo lifts on the frame after it mounts at rest; the previous one turns back into the strip.
  useEffect(() => {
    setFloating(current => {
      const next = current.flatMap(entry => {
        if (entry.index === active) return [{ ...entry, yielding: false }];
        if (entry.up) return [{ ...entry, up: false, yielding: active !== null }];
        return entry.flown ? [entry] : [];
      });
      if (active !== null && !next.some(entry => entry.index === active)) next.push({ index: active, up: !!reduced, flown: !!reduced, yielding: false });
      return reduced ? next.filter(entry => entry.index === active) : next;
    });
    if (active === null || reduced) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setFloating(current => current.map(entry => entry.index === active ? { ...entry, up: true, flown: true } : entry)));
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [active, reduced]);

  // Returning photos normally leave on transitionend; this catches any whose transition never ran.
  useEffect(() => {
    if (!floating.some(entry => !entry.up && entry.index !== active)) return;
    const timer = window.setTimeout(() => setFloating(current => current.filter(entry => entry.up || entry.index === activeRef.current)), 1400);
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
      if (event.pointerType === "touch" && !section.current?.contains(event.target as Node)) release();
    };
    document.addEventListener("pointerdown", settle);
    return () => document.removeEventListener("pointerdown", settle);
  });

  const engage = () => {
    window.clearTimeout(leaving.current);
    leaving.current = 0;
    held.current = true;
    speed.current = 0;
  };

  const lift = (index: number) => {
    window.clearTimeout(intent.current);
    engage();
    if (!isLowDataConnection()) void preloadImage(cards[index].large, { decode: true });
    setActive(index);
  };

  const requestLift = (index: number) => {
    engage();
    window.clearTimeout(intent.current);
    if (activeRef.current === null) lift(index);
    else if (activeRef.current !== index) intent.current = window.setTimeout(() => lift(index), INTENT_MS);
  };

  const release = (delay = GRACE_MS) => {
    window.clearTimeout(intent.current);
    if (leaving.current) return;
    leaving.current = window.setTimeout(() => {
      leaving.current = 0;
      held.current = false;
      setActive(null);
    }, delay);
  };

  // One hit test per frame finds the slot under the pointer, even beneath the lifted photo, so moving along
  // the ribbon flips through photos while resting on the photo itself keeps it.
  const follow = () => {
    frame.current = 0;
    if (!pointer.current) return;
    const stack = document.elementsFromPoint(pointer.current.x, pointer.current.y);
    const slot = stack.find((node): node is HTMLElement => node instanceof HTMLElement && node.dataset.slot !== undefined);
    if (slot) {
      const index = Number(slot.dataset.slot);
      if (index !== hovered.current) { hovered.current = index; requestLift(index); }
      return;
    }
    hovered.current = null;
    window.clearTimeout(intent.current);
    if (stack.some(node => node.classList.contains("photo-strip-lift") && node.classList.contains("is-up"))) engage();
    else if ((activeRef.current !== null || held.current) && focusedRef.current === null) release();
  };

  const focusCard = (index: number) => {
    // Bring the focused photo just behind the strip's centre before it lifts.
    phase.current = (index - set.length) * STEP + STEP * 2;
    place();
    setFocused(index);
    lift(index);
    // The photo lifts to the middle of the section, so keep the whole section in view.
    section.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  };

  const liftedSize = (index: number) => {
    const ratio = cards[index].ratio;
    const width = Math.round(Math.min(size.w * (isMobile ? 0.86 : 0.58), 720, size.h * 0.6 * ratio));
    return { width, height: Math.round(width / ratio) };
  };

  // The lifted element keeps its final size throughout; at rest it is scaled and clipped to the strip card's
  // crop, so the turn animates only transform and clip-path and never relayouts the photo.
  const liftFrame = (index: number, up: boolean) => {
    const { width, height } = liftedSize(index);
    if (up) {
      // It settles on the plane itself at whole pixels, so the photo and label render 1:1 rather than resampled.
      const left = Math.round((size.w - width) / 2) - size.w / 2;
      const top = Math.round((size.h - height) / 2) - size.h * PLANE_TOP;
      const anchorX = index * STEP - (SET_WIDTH + phase.current);
      return {
        width,
        height,
        transform: `translate3d(${-anchorX}px, ${CARD_H / 2}px, 0px) rotateZ(${-TILT_Z}deg) rotateX(${-TILT_X}deg) scale(${1 / scale}) translate3d(${left}px, ${top}px, 0px)`,
        clipPath: `inset(0px 0px round ${size.radius * scale}px)`,
      };
    }
    const fit = Math.max(CARD_W / width, CARD_H / height);
    const insetX = (width - CARD_W / fit) / 2;
    const insetY = (height - CARD_H / fit) / 2;
    return {
      width,
      height,
      transform: `translate3d(0px, 0px, 0px) rotateZ(0deg) rotateX(0deg) scale(${fit}) translate3d(${-insetX}px, ${-insetY}px, 0px)`,
      clipPath: `inset(${insetY}px ${insetX}px round ${size.radius / fit}px)`,
    };
  };

  const startDrag = (x: number, time: number) => { drag.current = { start: x, last: x, time, velocity: 0, moving: false }; };

  const moveDrag = (x: number, time: number) => {
    const current = drag.current;
    if (!current) return;
    if (!current.moving) {
      if (Math.abs(x - current.start) < 8) return;
      // A sideways swipe scrubs the ribbon; any lifted photo settles first so nothing is anchored to the old phase.
      current.moving = true;
      dragged.current = true;
      window.clearTimeout(leaving.current);
      leaving.current = 0;
      held.current = false;
      setActive(null);
    }
    const delta = ((current.last - x) * SLIDE) / scale;
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
  };

  const planeTransform = `scale(${scale}) rotateX(${TILT_X}deg) rotateZ(${TILT_Z}deg)`;
  // Strip copies stay hidden while their photo is lifted or flying home; a yielding photo hands back at once.
  const lifted = new Set(floating.filter(entry => entry.up || (entry.flown && !entry.yielding)).map(entry => entry.index));
  const rippleFrom = active ?? lastActive.current;

  return (
    <section ref={section} className={`photo-strip${reduced ? " is-reduced" : ""}`} aria-label="Selected photographs"
      style={{ "--strip-step": `${STEP}px`, "--strip-card-width": `${CARD_W}px`, "--strip-card-height": `${CARD_H}px`, "--strip-top": `${PLANE_TOP * 100}%` } as CSSProperties}
      onPointerMove={event => {
        if (event.pointerType === "touch") { moveDrag(event.clientX, event.timeStamp); return; }
        pointer.current = { x: event.clientX, y: event.clientY };
        if (!frame.current) frame.current = requestAnimationFrame(follow);
      }}
      onPointerDown={event => {
        if (event.pointerType !== "touch") return;
        startDrag(event.clientX, event.timeStamp);
        dragged.current = false;
        const target = event.target as Element;
        if (!target.closest("[data-slot], .photo-strip-lift")) release(0);
      }}
      onPointerUp={event => { if (event.pointerType === "touch") endDrag(true); }}
      onPointerCancel={() => endDrag(false)}
      onClickCapture={event => {
        if (!dragged.current) return;
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
        if (focusedRef.current === null) release();
      }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setFocused(null); release(0); } }}>
      <div className={`photo-strip-plane${active !== null ? " is-receded" : ""}`} style={{ transform: planeTransform }}>
        <div ref={node => { tracks.current[0] = node; }} className="photo-strip-track" style={{ width: cards.length * STEP + CARD_W }}>
          {cards.map((photo, index) => {
            const reachable = isReachable(index);
            const wave = active === null || index === active ? 0 : falloff(index, active);
            const shift = wave * SPREAD * Math.sign(index - (active ?? index));
            const delay = rippleFrom === null ? 0 : Math.min(Math.abs(index - rippleFrom), 9) * 14;
            return (
              <Link key={index} to={albumHref(photo.folder)} className={`photo-strip-card${lifted.has(index) ? " is-away" : ""}`}
                style={{ left: index * STEP, zIndex: index, transform: `translate3d(${shift}px, ${wave * DIP}px, 0)`, "--wave-delay": `${delay}ms` } as CSSProperties}
                tabIndex={reachable ? 0 : -1} aria-hidden={reachable ? undefined : true} aria-label={`Open ${photo.location} album`}
                onFocus={() => focusCard(index)}>
                {near && <img ref={reveal} src={photo.small} alt="" decoding="async" draggable={false} onLoad={event => event.currentTarget.classList.add("is-loaded")} />}
              </Link>
            );
          })}
          {/* Static hit slots keep hover stable while photos part around the pointer. */}
          <div className="photo-strip-hits" aria-hidden="true">
            {cards.map((photo, index) => (
              <Link key={index} to={albumHref(photo.folder)} tabIndex={-1} className="photo-strip-hit" data-slot={index} style={{ left: index * STEP }}
                onPointerDown={event => { touchFirst.current = event.pointerType === "touch" && activeRef.current !== index; }}
                onClick={event => {
                  if (!touchFirst.current) return;
                  // First tap turns the photo toward the viewer; tapping it again opens the album.
                  event.preventDefault();
                  touchFirst.current = false;
                  lift(index);
                }} />
            ))}
          </div>
        </div>
      </div>

      <div className="photo-strip-plane photo-strip-plane--lift" style={{ transform: planeTransform }}>
        <div ref={node => { tracks.current[1] = node; }} className="photo-strip-track">
          {floating.map(({ index, up, yielding }) => {
            const photo = cards[index];
            const { clipPath, ...frameStyle } = liftFrame(index, up);
            return (
              <Link key={index} to={albumHref(photo.folder)} tabIndex={-1} aria-hidden="true"
                // A photo making way for another fades as it returns, so the newcomer always reads in front.
                className={`photo-strip-lift${up ? " is-up" : yielding ? " is-yielding" : ""}${focused === index ? " is-focused" : ""}`}
                style={{ left: index * STEP, ...frameStyle }}
                onTransitionEnd={event => {
                  if (event.target !== event.currentTarget || event.propertyName !== "transform" || up) return;
                  setFloating(current => current.filter(entry => entry.index !== index || entry.up || entry.index === activeRef.current));
                }}>
                <span className="photo-strip-shadow" />
                <span className="photo-strip-photo" style={{ clipPath }}>
                  <img src={photo.small} alt="" draggable={false} />
                  <img src={photo.large} alt="" draggable={false} decoding="async" className={`photo-strip-large${loaded.has(photo.large) ? " is-loaded" : ""}`}
                    onLoad={() => setLoaded(current => current.has(photo.large) ? current : new Set(current).add(photo.large))} />
                  <span className="photo-strip-label">{photo.location}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
