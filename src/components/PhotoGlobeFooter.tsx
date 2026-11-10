import { lazy, Suspense, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { photoMapEntries } from "@/lib/photoMap";
import { getMapboxToken } from "@/lib/mapboxToken";
import { PHOTO_GLOBE_INITIAL_VIEW, PHOTO_GLOBE_VISIBLE_FRACTION, normalizeGlobeView, photoGlobePinOpacity, projectPhotoLocation, rotatePhotoGlobe, type GlobeView } from "@/lib/photoGlobe";
import { motionReduced } from "@/hooks/useMotionPreference";
import { useTheme } from "@/components/ThemeProvider";
import "./photo-globe-footer.css";

const NativeSatelliteGlobe = lazy(() => import("./NativeSatelliteGlobe"));
const locations = photoMapEntries.filter(entry => Boolean(entry.albumFolder));
const albumHref = (folder: string) => `/photos?album=${encodeURIComponent(folder)}`;

type GlobeDrag = {
  originX: number;
  originY: number;
  x: number;
  y: number;
  time: number;
  velocityX: number;
  velocityY: number;
  diameter: number;
  view: GlobeView;
};

// Encode a spherical projection in the red and green displacement channels.
const lensGrid = 25;
const lensCells = Array.from({ length: lensGrid ** 2 }, (_, index) => {
  const x = index % lensGrid;
  const y = Math.floor(index / lensGrid);
  const dx = (2 * x + 1) / lensGrid - 1;
  const dy = (2 * y + 1) / lensGrid - 1;
  const radius = Math.hypot(dx, dy);
  const sampleRadius = Math.asin(Math.min(radius, 1)) / (Math.PI / 2);
  const bend = radius > 0 && radius < 1 ? 1 - sampleRadius / radius : 0;
  const red = Math.round(127.5 - 127.5 * dx * bend);
  const green = Math.round(127.5 - 127.5 * dy * bend);
  return `<rect x="${x}" y="${y}" width="1.025" height="1.025" fill="rgb(${red},${green},128)"/>`;
}).join("");
const lensField = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${lensGrid}" height="${lensGrid}">${lensCells}</svg>`
)}`;

function measureMapboxHorizon(map: MapboxMap, diameter: number) {
  const center = diameter / 2;
  let sky = 0;
  let surface = center;
  // The globe has a fixed zoom and pitch. Find the crest after each resize.
  while (surface - sky > 0.5) {
    const y = (sky + surface) / 2;
    if (map.isPointOnSurface([center, y])) surface = y;
    else sky = y;
  }
  return surface;
}

export default function PhotoGlobeFooter() {
  const lensId = `photo-globe-lens-${useId().replace(/:/g, "")}`;
  const footer = useRef<HTMLElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [nearby, setNearby] = useState(false);
  const [viewport, setViewport] = useState({ diameter: 0, width: 0 });
  const pendingView = useRef<GlobeView | null>(null);
  const pendingFrame = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [view, setView] = useState<GlobeView>(PHOTO_GLOBE_INITIAL_VIEW);
  const currentView = useRef(view);
  const coastFrame = useRef<number | null>(null);
  const [selected, setSelected] = useState("");
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [mapFailed, setMapFailed] = useState(false);
  const drag = useRef<GlobeDrag | null>(null);
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const token = getMapboxToken();
  const useMapbox = Boolean(token) && !mapFailed;

  useEffect(() => {
    const measure = () => {
      if (!footer.current || !mapContainer.current) return;
      const next = { diameter: mapContainer.current.clientWidth, width: footer.current.clientWidth };
      setViewport(current => current.diameter === next.diameter && current.width === next.width ? current : next);
    };
    const observer = new ResizeObserver(measure);
    if (footer.current) observer.observe(footer.current);
    measure();
    return () => {
      observer.disconnect();
      if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
      if (coastFrame.current !== null) cancelAnimationFrame(coastFrame.current);
    };
  }, []);

  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearby(true); observer.disconnect(); }
    }, { rootMargin: "500px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (location.hash !== "#photo-globe") return;
    const frame = requestAnimationFrame(() => footer.current?.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [location.hash, location.key]);

  useEffect(() => {
    if (!nearby || !useMapbox || !mapContainer.current) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    const markers: MapboxMarker[] = [];
    const initialize = async () => {
      try {
        const [{ default: mapbox }] = await Promise.all([import("mapbox-gl"), import("mapbox-gl/dist/mapbox-gl.css")]);
        if (disposed || !mapContainer.current) return;
        if (!mapbox.supported()) { setMapFailed(true); return; }
        const size = mapContainer.current.clientWidth;
        const zoom = Math.log2(size * Math.PI / 512) - 0.25;
        const map = new mapbox.Map({
          container: mapContainer.current,
          accessToken: token,
          style: "mapbox://styles/mapbox/satellite-v9",
          projection: { name: "globe" },
          center: [PHOTO_GLOBE_INITIAL_VIEW.longitude, PHOTO_GLOBE_INITIAL_VIEW.latitude],
          zoom, minZoom: zoom, maxZoom: zoom,
          pitch: 0, bearing: 0,
          attributionControl: false,
          scrollZoom: false, boxZoom: false, doubleClickZoom: false,
          touchPitch: false, dragRotate: false, keyboard: false, fadeDuration: 0,
        });
        const canvas = map.getCanvas();
        canvas.tabIndex = -1;
        canvas.setAttribute("aria-hidden", "true");
        canvas.addEventListener("focus", () => mapContainer.current?.parentElement?.focus({ preventScroll: true }));
        map.touchZoomRotate.disableRotation();
        map.touchZoomRotate.disable();
        mapRef.current = map;
        map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");
        const updateHorizon = () => {
          const diameter = map.getContainer().clientWidth;
          footer.current?.style.setProperty("--photo-globe-mapbox-horizon", `${measureMapboxHorizon(map, diameter)}px`);
        };
        map.on("error", () => { if (!disposed && !map.loaded()) setMapFailed(true); });
        map.on("load", () => {
          if (disposed) return;
          updateHorizon();
          for (const layer of map.getStyle().layers ?? []) {
            if (layer.type === "raster") map.setPaintProperty(layer.id, "raster-saturation", -1);
            if (layer.type === "symbol") map.setLayoutProperty(layer.id, "visibility", "none");
          }
          const background = getComputedStyle(document.body).backgroundColor;
          map.setFog({ color: background, "high-color": background, "space-color": background, "horizon-blend": 0.015, "star-intensity": 0 });
          locations.forEach(entry => {
            const anchor = document.createElement("button");
            anchor.type = "button";
            anchor.className = "photo-globe-pin";
            anchor.setAttribute("aria-label", `Select ${entry.location}`);
            anchor.innerHTML = '<span class="photo-globe-pin-image"></span>';
            (anchor.firstElementChild as HTMLElement).style.backgroundImage = `url("${entry.coverImage}")`;
            anchor.addEventListener("pointerdown", event => event.stopPropagation());
            anchor.addEventListener("click", () => {
              selectedRef.current = entry.id;
              setSelected(entry.id);
              map.triggerRepaint();
            });
            const updateVisibility = () => {
              const center = map.getCenter();
              const position = projectPhotoLocation(entry.coordinates, { longitude: center.lng, latitude: center.lat });
              const pixel = map.project(entry.coordinates);
              const width = footer.current?.clientWidth ?? 0;
              const diameter = mapContainer.current?.clientWidth ?? 0;
              const opacity = position.visible ? photoGlobePinOpacity(pixel.x, pixel.y, diameter, width) : 0;
              const visible = opacity > 0;
              anchor.style.visibility = visible ? "visible" : "hidden";
              anchor.style.setProperty("--photo-globe-pin-opacity", String(opacity));
              anchor.tabIndex = visible ? 0 : -1;
              anchor.setAttribute("aria-hidden", String(!visible));
              anchor.classList.toggle("is-selected", selectedRef.current === entry.id);
              anchor.setAttribute("aria-pressed", String(selectedRef.current === entry.id));
            };
            map.on("render", updateVisibility);
            updateVisibility();
            markers.push(new mapbox.Marker({ element: anchor, anchor: "center", occludedOpacity: 0 }).setLngLat(entry.coordinates).addTo(map));
            // Mapbox assigns role="img" to marker elements during construction.
            anchor.setAttribute("role", "button");
          });
          setMapReady(true);
        });
        observer = new ResizeObserver(() => {
          map.resize();
          const nextZoom = Math.log2(mapContainer.current!.clientWidth * Math.PI / 512) - 0.25;
          map.setMinZoom(0);
          map.setMaxZoom(5);
          map.setZoom(nextZoom);
          map.setMinZoom(nextZoom);
          map.setMaxZoom(nextZoom);
          updateHorizon();
        });
        observer.observe(mapContainer.current);
      } catch { if (!disposed) setMapFailed(true); }
    };
    void initialize();
    return () => { disposed = true; observer?.disconnect(); markers.forEach(marker => marker.remove()); mapRef.current?.remove(); mapRef.current = null; setMapReady(false); };
  }, [nearby, token, useMapbox]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const background = getComputedStyle(document.body).backgroundColor;
    map.setFog({ color: background, "high-color": background, "space-color": background, "horizon-blend": 0.015, "star-intensity": 0 });
  }, [resolvedTheme, mapReady]);

  const applyView = (next: GlobeView) => {
    currentView.current = next;
    setView(next);
  };
  const stopCoast = () => {
    if (coastFrame.current !== null) cancelAnimationFrame(coastFrame.current);
    coastFrame.current = null;
  };
  const scheduleView = (next: GlobeView) => {
    pendingView.current = next;
    if (pendingFrame.current !== null) return;
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      if (pendingView.current) applyView(pendingView.current);
      pendingView.current = null;
    });
  };
  const releaseGlobe = (time: number) => {
    const gesture = drag.current;
    drag.current = null;
    if (!gesture || time - gesture.time > 80 || motionReduced()) return;
    const speed = Math.hypot(gesture.velocityX, gesture.velocityY);
    if (speed < .16) return;
    const distance = Math.min(speed * 72, gesture.diameter * .08);
    const offsetX = gesture.x - gesture.originX;
    const offsetY = gesture.y - gesture.originY;
    const start = performance.now();
    const coast = (now: number) => {
      coastFrame.current = null;
      if (motionReduced()) return;
      const progress = Math.min(1, (now - start) / 240);
      const travel = distance * (1 - (1 - progress) ** 3) / speed;
      applyView(rotatePhotoGlobe(gesture.view, offsetX + gesture.velocityX * travel, offsetY + gesture.velocityY * travel, gesture.diameter));
      if (progress < 1) coastFrame.current = requestAnimationFrame(coast);
    };
    coastFrame.current = requestAnimationFrame(coast);
  };
  const active = locations.find(entry => entry.id === selected);
  const title = active ? <>{active.location}<ArrowUpRight aria-hidden="true" /></> : "Explore places";

  return <footer ref={footer} id="photo-globe" className="photo-globe-footer" data-renderer={useMapbox && mapReady ? "mapbox" : "native"} aria-label="Photographs around the world"
    style={{ "--photo-globe-pin-lens": `url(#${lensId})` } as CSSProperties}>
    <svg className="photo-globe-optics" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id={lensId} x="0" y="0" width="100%" height="100%" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feImage href={lensField} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="field" />
          <feGaussianBlur in="field" stdDeviation=".022" result="smoothField" />
          <feDisplacementMap in="SourceGraphic" in2="smoothField" scale="1" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    <div className="photo-globe-toolbar">
      <div className="photo-globe-location-control">
        <div className="photo-globe-title-sharp" aria-live="polite" aria-atomic="true">
          {active ? <div key={active.id} className="photo-globe-title-arrive">
            <Link className="photo-globe-open" to={albumHref(active.albumFolder!)} aria-label={`Open ${active.location} album`}>{title}</Link>
          </div> : title}
        </div>
        <div className="photo-globe-title-soft" aria-hidden="true">
          {active ? <div key={active.id} className="photo-globe-title-arrive">{title}</div> : title}
        </div>
      </div>
      <span id="photo-globe-instructions" className="sr-only">Use arrow keys to rotate the globe. Home resets the view. Select a photograph to show its location above, then follow the location link to open its album.</span>
    </div>
    <div className="photo-globe-crop" style={{ "--photo-globe-visible-fraction": PHOTO_GLOBE_VISIBLE_FRACTION } as CSSProperties}
      role="group" tabIndex={0} aria-label="Photo globe" aria-describedby="photo-globe-instructions"
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
        event.preventDefault();
        stopCoast();
        if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
        pendingFrame.current = null;
        pendingView.current = null;
        const map = mapReady ? mapRef.current : null;
        const center = map?.getCenter();
        const current = center ? { longitude: center.lng, latitude: center.lat } : currentView.current;
        const next = event.key === "Home" ? PHOTO_GLOBE_INITIAL_VIEW : normalizeGlobeView({ longitude: current.longitude + (event.key === "ArrowLeft" ? -12 : event.key === "ArrowRight" ? 12 : 0), latitude: current.latitude + (event.key === "ArrowUp" ? 8 : event.key === "ArrowDown" ? -8 : 0) });
        applyView(next);
        map?.jumpTo({ center: [next.longitude, next.latitude] });
      }}>
      <div className="photo-globe-world" ref={mapContainer} aria-label="Satellite photo globe" />
      {!useMapbox || !mapReady ? <div className="photo-globe-world photo-globe-native"
        onPointerDown={event => {
          stopCoast();
          if (!event.isPrimary || event.button !== 0 || event.target instanceof Element && event.target.closest("button")) return;
          drag.current = {
            originX: event.clientX, originY: event.clientY, x: event.clientX, y: event.clientY,
            time: event.timeStamp, velocityX: 0, velocityY: 0,
            diameter: event.currentTarget.clientWidth, view: pendingView.current ?? currentView.current,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const gesture = drag.current;
          if (!gesture || !event.isPrimary) return;
          const elapsed = Math.max(8, event.timeStamp - gesture.time);
          gesture.velocityX = (event.clientX - gesture.x) / elapsed;
          gesture.velocityY = (event.clientY - gesture.y) / elapsed;
          gesture.x = event.clientX;
          gesture.y = event.clientY;
          gesture.time = event.timeStamp;
          scheduleView(rotatePhotoGlobe(gesture.view, gesture.x - gesture.originX, gesture.y - gesture.originY, gesture.diameter));
        }}
        onPointerUp={event => { if (event.isPrimary) releaseGlobe(event.timeStamp); }}
        onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        {nearby ? <Suspense fallback={null}><NativeSatelliteGlobe view={view} /></Suspense> : null}
        <div className="photo-globe-pins">
          {nearby ? locations.map(entry => {
            const projected = projectPhotoLocation(entry.coordinates, view);
            const opacity = projected.visible ? photoGlobePinOpacity(projected.x * viewport.diameter / 100, projected.y * viewport.diameter / 100, viewport.diameter, viewport.width) : 0;
            return <button key={entry.id} type="button" className={`photo-globe-pin${selected === entry.id ? " is-selected" : ""}`} aria-label={`Select ${entry.location}`} aria-pressed={selected === entry.id} onClick={() => { stopCoast(); setSelected(entry.id); }}
              style={{ left: `${projected.x}%`, top: `${projected.y}%`, display: opacity > 0 ? undefined : "none", "--photo-globe-pin-opacity": opacity } as CSSProperties}>
              <span className="photo-globe-pin-image" style={{ backgroundImage: `url("${entry.coverImage}")` }} />
            </button>;
          }) : null}
        </div>
      </div> : null}
      {!useMapbox ? <a className="photo-globe-credit" href="https://svs.gsfc.nasa.gov/4439" title="NASA Scientific Visualization Studio 8K land imagery with NASA Blue Marble ocean data (Reto Stöckli / Robert Simmon; ocean source CC BY-SA 3.0). Displayed in monochrome." target="_blank" rel="noreferrer">Imagery: NASA</a> : null}
    </div>
  </footer>;
}
