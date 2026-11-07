import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMotionPreference, useNavigationMotion } from "@/hooks/useMotionPreference";
import { musicAlbums } from "@/lib/musicAlbums";
import { useSidebarState } from "@/lib/siteChrome";
import { useTheme } from "@/components/ThemeProvider";
import { createMusicGlassRenderer, musicGlassCoverSize, musicGlassWidth } from "@/lib/musicGlassRenderer";
import { createMusicWheelGesture, musicDragPull, stepMusicSpring } from "@/lib/musicScroll";
import "./music-page.css";

const clampAlbum = (index: number) => Math.max(0, Math.min(musicAlbums.length - 1, index));

const artworkFor = (index: number) => `/music-artwork/${musicAlbums[clampAlbum(index)].image.split('/').pop()}`;

function lensPoint(distance: number, cover: number, height: number, width: number) {
  const cubic = (height - 3 * cover) / 6;
  const linear = cover - cubic / 4;
  const y = linear * distance + cubic * distance * distance * distance;
  return { y, width: musicGlassWidth(height / 2 + y, height, cover, width) };
}

type MusicGestureInput = { pull: number; tracking: boolean; wake: () => void };

function AlbumLens({ cursor, reducedMotion, advance, obscured, disabled, gesture }: {
  cursor: number; reducedMotion: boolean; advance: (delta: number) => void; obscured: boolean;
  disabled: boolean; gesture: MutableRefObject<MusicGestureInput>;
}) {
  const { resolvedTheme } = useTheme();
  const appearance = useRef(resolvedTheme);
  appearance.current = resolvedTheme;
  const lightPosition = useRef({ x: 0, y: 0 });
  const coverFocused = useRef(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(cursor);
  const renderedPosition = useRef(cursor);
  const renderedVelocity = useRef(0);
  const renderRef = useRef<() => void>(() => {});
  const [rendered, setRendered] = useState(false);
  const [moving, setMoving] = useState(false);
  const release = musicAlbums[cursor];
  const coverSize = useRef(0);
  const pointerRef = useRef<{ id: number; startY: number; lastY: number; time: number; velocity: number; dragging: boolean; pull: number } | null>(null);
  const preventClickRef = useRef(false);

  useEffect(() => {
    targetRef.current = cursor;
    renderRef.current();
  }, [cursor]);

  useEffect(() => { renderRef.current(); }, [resolvedTheme]);
  useEffect(() => {
    if (!disabled) return;
    pointerRef.current = null;
    gesture.current.pull = 0;
    gesture.current.tracking = false;
    gesture.current.wake();
  }, [disabled, gesture]);

  useEffect(() => {
    const interaction = gesture.current;
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;
    const artwork = document.createElement("canvas");
    const context = artwork.getContext("2d");
    if (!context) return;
    const glass = createMusicGlassRenderer(canvas);
    scene.dataset.optical = String(Boolean(glass));
    const fallback = glass ? null : canvas.getContext("2d");
    if (!glass && !fallback) return;
    let frame = 0;
    let disposed = false;
    let opticalLost = false;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let cover = 0;
    let centerX = 0;
    const images = new Map<number, HTMLImageElement>();
    let artworkDirty = true;
    let artworkRevision = 0;
    let lastArtPosition = Number.NaN;
    let atlasBase = Number.NaN;
    const smoothedLight = { x: 0, y: 0 };

    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(draw); };
    function imageAt(index: number) {
      const key = clampAlbum(index);
      let image = images.get(key);
      if (!image) {
        image = new Image();
        image.decoding = "async";
        image.onload = () => { artworkDirty = true; schedule(); };
        image.src = artworkFor(key);
        images.set(key, image);
      }
      return image.complete && image.naturalWidth > 0 ? image : null;
    }

    function draw(time: number) {
      frame = 0;
      if (disposed || !width || !height) return;
      const elapsed = previousTime ? Math.min(time - previousTime, 40) : 16;
      previousTime = time;
      const target = targetRef.current + (reducedMotion ? 0 : interaction.pull);
      const remaining = target - renderedPosition.current;
      const animating = !reducedMotion && (Math.abs(remaining) > 0.0004 || Math.abs(renderedVelocity.current) > 0.003);
      if (animating && Math.abs(remaining) <= 2) {
        // Velocity survives a retarget; a short, lightly damped release has one restrained settle.
        const next = stepMusicSpring(renderedPosition.current, renderedVelocity.current, target, elapsed / 1000, interaction.tracking);
        renderedPosition.current = next.position;
        renderedVelocity.current = next.velocity;
      } else {
        renderedPosition.current = target;
        renderedVelocity.current = 0;
      }
      setMoving(animating);
      const position = renderedPosition.current;
      const centerY = height / 2;
      const nearest = Math.round(position);
      imageAt(targetRef.current);

      const lightBlend = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 90);
      smoothedLight.x += (lightPosition.current.x - smoothedLight.x) * lightBlend;
      smoothedLight.y += (lightPosition.current.y - smoothedLight.y) * lightBlend;
      const lightingMoves = Math.abs(lightPosition.current.x - smoothedLight.x) + Math.abs(lightPosition.current.y - smoothedLight.y) > 0.001;
      if (glass) {
        const base = nearest - 2;
        // The GPU samples clean, full-resolution artwork directly. It bends a continuous
        // image at each pixel, with no CPU scanline seams or per-frame texture uploads.
        for (let slot = 0; slot < 5; slot++) imageAt(base + slot);
        if (artworkDirty || base !== atlasBase) {
          context.clearRect(0,0,artwork.width,artwork.height);
          const tile = artwork.width;
          for (let slot = 0; slot < 5; slot++) {
            const image = imageAt(base+slot);
            if (!image) continue;
            const side = Math.min(image.naturalWidth,image.naturalHeight);
            context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,slot*tile,tile,tile);
          }
          atlasBase = base;
          artworkDirty = false;
          artworkRevision++;
        }
      } else if (artworkDirty || position !== lastArtPosition) {
        context.clearRect(0, 0, width, height);
        // Horizontal samples keep a continuous, edge-to-edge image beneath the optical shell.
        for (let index = nearest - 2; index <= nearest + 2; index++) {
          const image = imageAt(index);
          if (!image) continue;
          const side = Math.min(image.naturalWidth, image.naturalHeight);
          const cropX = (image.naturalWidth - side) / 2;
          const cropY = (image.naturalHeight - side) / 2;
          const rows = Math.ceil(Math.max(cover, height / 2) * Math.min(window.devicePixelRatio || 1, 1.5));
          for (let row = 0; row < rows; row++) {
            const source = row / rows;
            const distance = (index - position) + source - 0.5;
            if (Math.abs(distance) > 1.5 || Math.abs(distance) < 0.5) continue;
            const top = lensPoint(distance, cover, height, width);
            const bottom = lensPoint(distance + 1 / rows, cover, height, width);
            const outer = Math.min(1, Math.max(0, Math.abs(distance) - 0.5));
            // A single continuous reflection, with no fold back through the middle of a preview.
            const imageRow = Math.max(0, Math.min(1 - 1 / rows, distance < -0.5 ? 1 - source : source));
            const imageY = cropY + imageRow * side;
            const imageHeight = side / rows + 0.5;
            // Overscan behind the rim so refracted rays always find artwork, including at the edges.
            const previewWidth = top.width + cover * 0.38 * Math.min(1, outer * 6);
            const left = centerX - previewWidth / 2;
            const y = centerY + top.y;
            const stripHeight = Math.max(0.7, bottom.y - top.y + 0.65);
            context.drawImage(image, cropX, imageY, side, imageHeight, left, y, previewWidth, stripHeight);

          }
        }
        context.globalAlpha = 1;

        // The focal plane uses straight, 1:1 image geometry independently of the glass silhouette.
        // During a gesture, square planes translate linearly through this window; only the previews bend.
        context.clearRect(0, centerY - cover / 2, width, cover);
        context.save();
        context.beginPath();
        context.rect(centerX - cover / 2, centerY - cover / 2, cover, cover);
        context.clip();
        const focalStart = animating ? Math.floor(position) - 1 : nearest;
        const focalEnd = animating ? Math.ceil(position) + 1 : nearest;
        for (let index = focalStart; index <= focalEnd; index++) {
          const image = imageAt(index);
          if (!image) continue;
          const side = Math.min(image.naturalWidth, image.naturalHeight);
          context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side,
            centerX - cover / 2, centerY - cover / 2 + (index - position) * cover, cover, cover);
        }
        context.restore();
        artworkDirty = false;
        lastArtPosition = position;
        artworkRevision++;
      }

      if (glass && !opticalLost) {
        glass.render(artwork, { width, height, centerX, cover, dark: appearance.current === "dark",
          pointerX: smoothedLight.x, pointerY: smoothedLight.y, focused: coverFocused.current, artRevision: artworkRevision,
          atlas: { base: atlasBase, position, tileSize: artwork.width } });
      } else if (fallback) {
        fallback.clearRect(0, 0, canvas.width, canvas.height);
        // Overscan feeds the optical renderer, but must remain inside the same
        // silhouette when the CPU fallback paints directly onto the output canvas.
        fallback.save();
        fallback.beginPath();
        const steps = Math.min(192, Math.max(32, Math.ceil(height / 6)));
        for (const side of [-1, 1]) {
          for (let step = 0; step <= steps; step++) {
            const y = height * (side < 0 ? step / steps : 1 - step / steps);
            const x = centerX + side * musicGlassWidth(y, height, cover, width) / 2;
            if (side < 0 && step === 0) fallback.moveTo(x * canvas.width / width, y * canvas.height / height);
            else fallback.lineTo(x * canvas.width / width, y * canvas.height / height);
          }
        }
        fallback.closePath();
        fallback.clip();
        fallback.drawImage(artwork, 0, 0);
        fallback.restore();
      }
      setRendered(!opticalLost && Boolean(imageAt(nearest)));
      if (animating || lightingMoves) schedule(); else previousTime = 0;
    }

    const resize = () => {
      const box = scene.getBoundingClientRect();
      width = box.width;
      height = box.height;
      cover = musicGlassCoverSize(width, height);
      coverSize.current = cover;
      centerX = width * 0.5;
      scene.style.setProperty("--music-cover-size", `${cover}px`);
      scene.style.setProperty("--music-center", `${centerX}px`);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.style.left = `${box.left}px`;
      canvas.style.top = `${box.top}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      artwork.width = glass ? Math.min(640,Math.max(320,Math.ceil(cover*ratio))) : canvas.width;
      artwork.height = glass ? artwork.width*5 : canvas.height;
      context.setTransform(glass ? 1 : ratio,0,0,glass ? 1 : ratio,0,0);
      artworkDirty = true;
      schedule();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(scene);
    resize();
    renderRef.current = schedule;
    interaction.wake = schedule;
    const lostContext = () => { opticalLost = true; setRendered(false); };
    const restoredContext = () => { opticalLost = false; schedule(); };
    canvas.addEventListener("webglcontextlost", lostContext);
    canvas.addEventListener("webglcontextrestored", restoredContext);
    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      images.forEach(image => { image.onload = null; });
      canvas.removeEventListener("webglcontextlost", lostContext);
      canvas.removeEventListener("webglcontextrestored", restoredContext);
      glass?.dispose();
      delete scene.dataset.optical;
      renderRef.current = () => {};
      interaction.wake = () => {};
    };
  }, [reducedMotion, gesture]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointerRef.current = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, time: performance.now(), velocity: 0, dragging: false, pull: 0 };
    preventClickRef.current = false;
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!reducedMotion) lightPosition.current = { x: (event.clientX - bounds.left) / bounds.width * 2 - 1, y: (event.clientY - bounds.top) / bounds.height * 2 - 1 };
    const pointer = pointerRef.current;
    if (pointer && pointer.id === event.pointerId) {
      const distance = pointer.startY - event.clientY;
      const now = performance.now();
      const elapsed = Math.max(8, now - pointer.time);
      const travel = Math.max(120, coverSize.current * 0.85);
      pointer.velocity = pointer.velocity * 0.65 + ((pointer.lastY - event.clientY) / travel / elapsed * 1000) * 0.35;
      pointer.lastY = event.clientY;
      pointer.time = now;
      if (Math.abs(distance) >= 8 || pointer.dragging) {
        pointer.dragging = true;
        preventClickRef.current = true;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const atEdge = distance < 0 ? cursor === 0 : cursor === musicAlbums.length - 1;
        pointer.pull = musicDragPull(distance, travel, atEdge);
        gesture.current.pull = reducedMotion ? 0 : pointer.pull;
        gesture.current.tracking = true;
      }
    }
    renderRef.current();
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    gesture.current.pull = 0;
    gesture.current.tracking = false;
    if (!cancelled && pointer.dragging) {
      const velocity = performance.now() - pointer.time < 100 && Math.abs(pointer.startY - pointer.lastY) >= 24 ? pointer.velocity : 0;
      const projected = pointer.pull + Math.max(-2, Math.min(2, velocity)) * 0.12;
      if (Math.abs(projected) >= 0.28) advance(Math.sign(projected));
    }
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    renderRef.current();
  };

  return (
    <div className="music-hourglass-scene" ref={sceneRef} onPointerDown={startDrag} onPointerMove={drag}
      onPointerUp={event => finishDrag(event)} onPointerCancel={event => finishDrag(event, true)}
      onLostPointerCapture={event => finishDrag(event, true)}
      onPointerLeave={event => {
        if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) finishDrag(event, true);
        if (!reducedMotion) { lightPosition.current = { x: 0, y: 0 }; renderRef.current(); }
      }}>
      {createPortal(<canvas ref={canvasRef} className="music-hourglass-canvas" aria-hidden="true" style={{ visibility: obscured ? "hidden" : undefined }} />, document.body)}
      <a className="music-hourglass-cover" data-rendered={rendered} data-moving={moving}
        href={release.spotifyUrl} target="_blank" rel="noreferrer"
        aria-label={`Listen to ${release.album} by ${release.artist} on Spotify`}
        onFocus={event => { coverFocused.current = event.currentTarget.matches(":focus-visible"); renderRef.current(); }}
        onBlur={() => { coverFocused.current = false; renderRef.current(); }}
        onClick={event => {
          // Swiping must not open Spotify; keyboard and assistive activation remain available.
          if (preventClickRef.current && event.detail > 0) event.preventDefault();
          preventClickRef.current = false;
        }} draggable={false}>
        <img src={artworkFor(cursor)} alt="" decoding="async" draggable={false} />
      </a>
      <div className="music-hourglass-details">
        <div className="music-hourglass-copy" aria-live="polite" aria-atomic="true">
          <h2>{release.album}</h2>
          <p>{release.artist}</p>
        </div>
      </div>
    </div>
  );
}

export default function MusicPage() {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const frameRef = useRef<HTMLElement>(null);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const gesture = useRef<MusicGestureInput>({ pull: 0, tracking: false, wake: () => {} });
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const isMobile = useIsMobile();
  const reducedMotion = useMotionPreference();
  const advance = useCallback((delta: number) => {
    gesture.current.pull = 0;
    gesture.current.tracking = false;
    setCursor(current => clampAlbum(current + delta));
  }, []);
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalRootOverflow;
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const consume = createMusicWheelGesture();
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const release = () => {
      gesture.current.pull = 0;
      gesture.current.tracking = false;
      gesture.current.wake();
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (sidebarOpen || searchOpen) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? frame.clientHeight : 1);
      const cover = musicGlassCoverSize(frame.clientWidth, frame.clientHeight);
      const wheelDelta = event.deltaMode === 0 ? delta : Math.sign(delta) * Math.max(90, Math.abs(delta));
      const movement = consume(wheelDelta, performance.now(), cover);
      clearTimeout(releaseTimer);
      if (movement.step) {
        const atEdge = clampAlbum(cursorRef.current + movement.step) === cursorRef.current;
        gesture.current.pull = !reducedMotion && atEdge ? movement.step * 0.075 : 0;
        gesture.current.tracking = atEdge;
        if (!atEdge) advance(movement.step);
      } else if (movement.pull) {
        const atEdge = movement.pull < 0 ? cursorRef.current === 0 : cursorRef.current === musicAlbums.length - 1;
        gesture.current.pull = reducedMotion ? 0 : movement.pull * (atEdge ? 0.5 : 1);
        gesture.current.tracking = true;
      }
      gesture.current.wake();
      releaseTimer = setTimeout(release, 150);
    };
    frame.addEventListener("wheel", wheel, { passive: false });
    return () => { frame.removeEventListener("wheel", wheel); clearTimeout(releaseTimer); release(); };
  }, [advance, sidebarOpen, searchOpen, reducedMotion]);

  const handleKey = (event: KeyboardEvent<HTMLElement>) => {
    if (sidebarOpen || searchOpen || event.altKey || event.ctrlKey || event.metaKey) return;
    const action = event.key === "ArrowDown" || event.key === "PageDown" ? 1
      : event.key === "ArrowUp" || event.key === "PageUp" ? -1 : 0;
    if (action) { event.preventDefault(); advance(action); }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      gesture.current.pull = 0;
      gesture.current.tracking = false;
      setCursor(event.key === "Home" ? 0 : musicAlbums.length - 1);
    }
  };

  return (
    <div className="music-hourglass-page bg-background text-foreground">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} showToggle={false} />
      <motion.div className="music-hourglass-shell"
        animate={{ marginLeft: sidebarOpen && !isMobile ? 200 : 0, marginRight: searchOpen && !isMobile ? 200 : 0,
          width: !isMobile && (sidebarOpen || searchOpen) ? "calc(100% - 200px)" : "100%" }} transition={navigationMotion}>
        <main ref={frameRef} className="music-hourglass-frame" aria-label="Music albums" tabIndex={0} onKeyDown={handleKey}
          aria-describedby="music-hourglass-instructions">
          <h1 className="sr-only">What I'm listening to</h1>
          <p id="music-hourglass-instructions" className="sr-only">Scroll, swipe up or down, or use the arrow keys to browse albums. Select an album to listen on Spotify.</p>
          <AlbumLens cursor={cursor} reducedMotion={reducedMotion} advance={advance} obscured={isMobile && (sidebarOpen || searchOpen)} disabled={sidebarOpen || searchOpen} gesture={gesture} />
        </main>
      </motion.div>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
