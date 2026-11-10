import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { photoMapEntries } from "@/lib/photoMap";
import { getMapboxToken } from "@/lib/mapboxToken";
import { PHOTO_GLOBE_INITIAL_VIEW, PHOTO_GLOBE_VISIBLE_FRACTION, isPhotoGlobePinVisible, normalizeGlobeView, projectPhotoLocation, rotatePhotoGlobe, type GlobeView } from "@/lib/photoGlobe";
import { useTheme } from "@/components/ThemeProvider";
import "./photo-globe-footer.css";

const NativeSatelliteGlobe = lazy(() => import("./NativeSatelliteGlobe"));
const locations = photoMapEntries.filter(entry => Boolean(entry.albumFolder));
const albumHref = (folder: string) => `/photos?album=${encodeURIComponent(folder)}`;

export default function PhotoGlobeFooter() {
  const footer = useRef<HTMLElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [nearby, setNearby] = useState(false);
  const [viewport, setViewport] = useState({ diameter: 0, width: 0 });
  const pendingView = useRef<GlobeView | null>(null);
  const pendingFrame = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [view, setView] = useState<GlobeView>(PHOTO_GLOBE_INITIAL_VIEW);
  const [selected, setSelected] = useState("");
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [mapFailed, setMapFailed] = useState(false);
  const drag = useRef<{ x: number; y: number; diameter: number; view: GlobeView } | null>(null);
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
    return () => { observer.disconnect(); if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current); };
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
        map.on("error", () => { if (!disposed && !map.loaded()) setMapFailed(true); });
        map.on("load", () => {
          if (disposed) return;
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
              const x = pixel.x + (width - diameter) / 2;
              const visible = position.visible && x >= 22 && x <= width - 22 && pixel.y >= 22 && pixel.y <= diameter * PHOTO_GLOBE_VISIBLE_FRACTION - 22;
              anchor.style.visibility = visible ? "visible" : "hidden";
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

  const scheduleView = (next: GlobeView) => {
    pendingView.current = next;
    if (pendingFrame.current !== null) return;
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      if (pendingView.current) setView(pendingView.current);
      pendingView.current = null;
    });
  };
  const active = locations.find(entry => entry.id === selected);

  return <footer ref={footer} id="photo-globe" className="photo-globe-footer" aria-label="Photographs around the world">
    <div className="photo-globe-toolbar">
      <div className="photo-globe-location-control" aria-live="polite" aria-atomic="true">
        {active ? <Link className="photo-globe-open" to={albumHref(active.albumFolder!)} aria-label={`Open ${active.location} album`}>{active.location}<ArrowUpRight size={16} aria-hidden="true" /></Link> : <span>Explore places</span>}
      </div>
      <span id="photo-globe-instructions" className="sr-only">Use arrow keys to rotate the globe. Home resets the view. Select a photograph to show its location above, then follow the location link to open its album.</span>
    </div>
    <div className="photo-globe-crop" style={{ "--photo-globe-visible-fraction": PHOTO_GLOBE_VISIBLE_FRACTION } as CSSProperties}
      role="group" tabIndex={0} aria-label="Photo globe" aria-describedby="photo-globe-instructions"
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
        event.preventDefault();
        if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
        pendingFrame.current = null;
        pendingView.current = null;
        const map = mapReady ? mapRef.current : null;
        const center = map?.getCenter();
        const current = center ? { longitude: center.lng, latitude: center.lat } : view;
        const next = event.key === "Home" ? PHOTO_GLOBE_INITIAL_VIEW : normalizeGlobeView({ longitude: current.longitude + (event.key === "ArrowLeft" ? -12 : event.key === "ArrowRight" ? 12 : 0), latitude: current.latitude + (event.key === "ArrowUp" ? 8 : event.key === "ArrowDown" ? -8 : 0) });
        setView(next);
        map?.jumpTo({ center: [next.longitude, next.latitude] });
      }}>
      <div className="photo-globe-world" ref={mapContainer} aria-label="Satellite photo globe" />
      {!useMapbox || !mapReady ? <div className="photo-globe-world photo-globe-native"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || event.target instanceof Element && event.target.closest("button")) return;
          drag.current = { x: event.clientX, y: event.clientY, diameter: event.currentTarget.clientWidth, view };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          if (!drag.current) return;
          scheduleView(rotatePhotoGlobe(drag.current.view, event.clientX - drag.current.x, event.clientY - drag.current.y, drag.current.diameter));
        }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        {nearby ? <Suspense fallback={null}><NativeSatelliteGlobe view={view} /></Suspense> : null}
        <div className="photo-globe-pins">
          {nearby ? locations.map(entry => {
            const projected = projectPhotoLocation(entry.coordinates, view);
            return <button key={entry.id} type="button" className={`photo-globe-pin${selected === entry.id ? " is-selected" : ""}`} aria-label={`Select ${entry.location}`} aria-pressed={selected === entry.id} onClick={() => setSelected(entry.id)}
              style={{ left: `${projected.x}%`, top: `${projected.y}%`, display: isPhotoGlobePinVisible(projected, viewport.diameter, viewport.width) ? undefined : "none" }}>
              <span className="photo-globe-pin-image" style={{ backgroundImage: `url("${entry.coverImage}")` }} />
            </button>;
          }) : null}
        </div>
      </div> : null}
      {!useMapbox ? <a className="photo-globe-credit" href="https://svs.gsfc.nasa.gov/4439" title="NASA Scientific Visualization Studio 8K land imagery with NASA Blue Marble ocean data (Reto Stöckli / Robert Simmon; ocean source CC BY-SA 3.0). Displayed in monochrome." target="_blank" rel="noreferrer">Imagery: NASA</a> : null}
    </div>
  </footer>;
}
