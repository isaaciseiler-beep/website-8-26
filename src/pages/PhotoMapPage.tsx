import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import type { LngLatLike, Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { photoMapEntries, photoMapInitialView, type PhotoMapEntry } from "@/lib/photoMap";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMapboxToken } from "@/lib/mapboxToken";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MONOCHROME_MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const DESKTOP_PANEL_WIDTH = 350;
const DESKTOP_PANEL_GUTTER = 16;
const MOBILE_PANEL_HEIGHT = 260;
const WORLD_SOURCE = "photo-map-world";
const WORLD_LAND_LAYER = "photo-map-world-land";
const WORLD_BORDER_LAYER = "photo-map-world-borders";
const WORLD_BORDER_DISPUTED_LAYER = "photo-map-world-borders-disputed";

type MapboxModule = typeof import("mapbox-gl");
type MapboxGL = MapboxModule["default"];

type MarkerEntry = {
  marker: MapboxMarker;
  element: HTMLButtonElement;
};

type MapPalette = {
  background: string;
  water: string;
  land: string;
  park: string;
  coast: string;
  border: string;
  detail: string;
  label: string;
  labelHalo: string;
};

const lightMapPalette: MapPalette = {
  background: "#f4f7fe",
  water: "#eceff4",
  land: "#dce4f1",
  park: "#d2dceb",
  coast: "#aeb9ca",
  border: "#8d98ab",
  detail: "#bcc6d7",
  label: "#4f5a69",
  labelHalo: "#f4f7fe",
};

const darkMapPalette: MapPalette = {
  background: "#11160c",
  water: "#17140d",
  land: "#1f2616",
  park: "#26301b",
  coast: "#665a3e",
  border: "#8a7651",
  detail: "#4b4933",
  label: "#d5d8c7",
  labelHalo: "#11160c",
};

const stopMarkerEvent = (event: Event) => event.stopPropagation();

let mapboxPromise: Promise<MapboxModule> | null = null;

const loadMapbox = () => {
  mapboxPromise ??= Promise.all([
    import("mapbox-gl"),
    import("mapbox-gl/dist/mapbox-gl.css"),
  ])
    .then(([module]) => module)
    .catch((error) => {
      mapboxPromise = null;
      throw error;
    });
  return mapboxPromise;
};

const getMapPalette = (): MapPalette =>
  document.documentElement.classList.contains("dark") ? darkMapPalette : lightMapPalette;

const defaultMapView = (isMobile: boolean) => ({
  ...photoMapInitialView,
  center: (isMobile ? [105, 18] : photoMapInitialView.center) as [number, number],
  zoom: isMobile ? 0.48 : photoMapInitialView.zoom,
});

const addWorldGeographyLayers = (map: MapboxMap, palette: MapPalette) => {
  try {
    if (!map.getSource(WORLD_SOURCE)) {
      map.addSource(WORLD_SOURCE, {
        type: "vector",
        url: "mapbox://mapbox.country-boundaries-v1",
      });
    }

    if (!map.getLayer(WORLD_LAND_LAYER)) {
      map.addLayer({
        id: WORLD_LAND_LAYER,
        type: "fill",
        source: WORLD_SOURCE,
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": palette.land,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.54, 1.2, 0.64, 4, 0.78],
        },
      });
    }
    if (map.getLayer(WORLD_LAND_LAYER)) {
      map.setPaintProperty(WORLD_LAND_LAYER, "fill-color", palette.land);
    }

    if (!map.getLayer(WORLD_BORDER_LAYER)) {
      map.addLayer({
        id: WORLD_BORDER_LAYER,
        type: "line",
        source: WORLD_SOURCE,
        "source-layer": "country_boundaries",
        filter: ["!=", ["get", "disputed"], "true"],
        paint: {
          "line-color": palette.border,
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.3, 1.2, 0.48, 3, 0.72, 6, 1.1],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.34, 1.2, 0.48, 4, 0.62],
          "line-blur": 0.28,
        },
      });
    }
    if (map.getLayer(WORLD_BORDER_LAYER)) {
      map.setPaintProperty(WORLD_BORDER_LAYER, "line-color", palette.border);
    }

    if (!map.getLayer(WORLD_BORDER_DISPUTED_LAYER)) {
      map.addLayer({
        id: WORLD_BORDER_DISPUTED_LAYER,
        type: "line",
        source: WORLD_SOURCE,
        "source-layer": "country_boundaries",
        filter: ["==", ["get", "disputed"], "true"],
        paint: {
          "line-color": palette.border,
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.2, 1.2, 0.36, 4, 0.62],
          "line-opacity": 0.22,
          "line-dasharray": [2, 1.2],
        },
      });
    }
    if (map.getLayer(WORLD_BORDER_DISPUTED_LAYER)) {
      map.setPaintProperty(WORLD_BORDER_DISPUTED_LAYER, "line-color", palette.border);
    }
  } catch {
    // The dedicated boundary tiles require a valid Mapbox token; the base map still works without them.
  }
};

const applyMapPalette = (map: MapboxMap) => {
  const palette = getMapPalette();
  const layers = map.getStyle().layers ?? [];

  layers.forEach((layer) => {
    const id = layer.id.toLowerCase();

    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", palette.background);
      }

      if (layer.type === "fill") {
        if (id.includes("water") || id.includes("background")) {
          map.setPaintProperty(layer.id, "fill-color", id.includes("water") ? palette.water : palette.background);
        } else if (id.includes("park") || id.includes("landuse")) {
          map.setPaintProperty(layer.id, "fill-color", palette.park);
        } else if (id.includes("land") || id.includes("country") || id.includes("continent")) {
          map.setPaintProperty(layer.id, "fill-color", palette.land);
        } else {
          map.setPaintProperty(layer.id, "fill-color", palette.land);
          map.setPaintProperty(layer.id, "fill-opacity", 0.48);
        }
      }

      if (layer.type === "line" && /admin|boundary|border|coast|country|road|waterway|bridge|tunnel/.test(id)) {
        const isBorder = /admin|boundary|border|country/.test(id);
        const isCoast = id.includes("coast");
        map.setPaintProperty(layer.id, "line-color", isBorder ? palette.border : isCoast ? palette.coast : palette.detail);
        map.setPaintProperty(layer.id, "line-opacity", isBorder ? 0.08 : isCoast ? 0.26 : id.includes("road") ? 0.24 : 0.18);
      }

      if (layer.type === "symbol") {
        map.setPaintProperty(layer.id, "text-color", palette.label);
        map.setPaintProperty(layer.id, "text-halo-color", palette.labelHalo);
        map.setPaintProperty(layer.id, "text-halo-width", 0.9);
      }
    } catch {
      // Mapbox base styles vary by layer; unsupported paint properties can be ignored.
    }
  });

  addWorldGeographyLayers(map, palette);
  map.setFog({
    color: palette.background,
    "high-color": palette.background,
    "horizon-blend": 0,
    "space-color": palette.background,
    "star-intensity": 0,
  });
};

const PhotoMapPage = () => {
  const mapboxToken = getMapboxToken();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const markerEntriesRef = useRef<Map<string, MarkerEntry>>(new Map());
  const mapLoadedRef = useRef(false);
  const selectedLocationOffsetRef = useRef<() => [number, number]>(() => [0, 0]);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const activeEntry = useMemo(
    () => photoMapEntries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId],
  );

  const selectedLocationOffset = useCallback(() => {
    if (isMobile) return [0, -(MOBILE_PANEL_HEIGHT / 2)] as [number, number];

    return [-(DESKTOP_PANEL_WIDTH + DESKTOP_PANEL_GUTTER * 2) / 2, 0] as [number, number];
  }, [isMobile]);

  useEffect(() => {
    selectedLocationOffsetRef.current = selectedLocationOffset;
  }, [selectedLocationOffset]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapboxToken) return;

    let disposed = false;
    const markerEntries = markerEntriesRef.current;

    const initializeMap = async () => {
      try {
        const mapboxModule = await loadMapbox();
        if (disposed || !containerRef.current || mapRef.current) return;

        const mapbox = mapboxModule.default;
        mapboxRef.current = mapbox;
        mapbox.accessToken = mapboxToken;

        if (!mapbox.supported()) {
          setMapError("The map could not start because this browser does not support WebGL.");
          return;
        }

        const initialView = defaultMapView(isMobile);
        const map = new mapbox.Map({
          container: containerRef.current,
          style: MONOCHROME_MAP_STYLE,
          center: initialView.center,
          zoom: initialView.zoom,
          minZoom: 0.35,
          maxZoom: 12,
          pitch: initialView.pitch,
          bearing: initialView.bearing,
          projection: { name: "globe" },
          attributionControl: false,
          fadeDuration: 0,
        });

        mapRef.current = map;
        map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-right");

        const handleLoad = () => {
          mapLoadedRef.current = true;
          applyMapPalette(map);
          setMapError(null);
          setMapReady(true);
        };
        const handleError = () => {
          if (!mapLoadedRef.current) {
            setMapError("The map could not load. Check that the Mapbox token is available.");
          }
        };

        map.on("load", handleLoad);
        map.on("style.load", () => applyMapPalette(map));
        map.on("error", handleError);
        map.on("click", () => setActiveEntryId(null));
      } catch {
        if (!disposed) {
          setMapError("The map library could not load.");
        }
      }
    };

    void initializeMap();

    return () => {
      disposed = true;
      markerEntries.forEach(({ marker }) => marker.remove());
      markerEntries.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
      mapLoadedRef.current = false;
    };
  }, [isMobile, mapboxToken]);

  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new MutationObserver(() => {
      if (mapRef.current?.isStyleLoaded()) applyMapPalette(mapRef.current);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const view = defaultMapView(isMobile);

    const settle = window.setTimeout(() => {
      map.resize();
      if (!activeEntry) {
        map.easeTo({
          center: view.center,
          zoom: view.zoom,
          pitch: view.pitch,
          bearing: view.bearing,
          duration: 520,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          essential: true,
        });
      }
    }, 120);

    return () => {
      window.clearTimeout(settle);
    };
  }, [activeEntry, isMobile, mapReady]);

  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapboxRef.current) return;

    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    const entries = markerEntriesRef.current;

    photoMapEntries.forEach((entry) => {
      if (entries.has(entry.id)) return;

      const root = document.createElement("div");
      root.className = "relative h-0 w-0";

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "photo-map-marker group absolute -left-4 -top-4 h-8 w-8 overflow-hidden rounded-full border border-[hsl(var(--image-scrim)/0.34)] bg-[#e2e8f4] shadow-[0_8px_22px_rgba(18,24,34,0.22)] transition-[transform,border-color,box-shadow,filter] duration-200 hover:scale-110 hover:border-[hsl(var(--image-scrim)/0.62)] hover:shadow-[0_12px_30px_rgba(18,24,34,0.3)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--image-scrim)/0.28)] sm:-left-[18px] sm:-top-[18px] sm:h-9 sm:w-9 sm:shadow-[0_9px_24px_rgba(18,24,34,0.24)]";
      button.setAttribute("aria-label", `Open ${entry.location} photos`);
      button.style.backgroundImage = `linear-gradient(rgba(244,247,254,0.02), rgba(0,0,0,0.18)), url("${entry.coverImage}")`;
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";

      button.addEventListener("pointerdown", stopMarkerEvent);
      button.addEventListener("mousedown", stopMarkerEvent);
      button.addEventListener("touchstart", stopMarkerEvent, { passive: true });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setActiveEntryId(entry.id);
        map.easeTo({
          center: entry.coordinates as LngLatLike,
          zoom: Math.max(map.getZoom(), 3.25),
          offset: selectedLocationOffsetRef.current(),
          duration: 980,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          essential: true,
        });
      });

      root.appendChild(button);
      const marker = new mapbox.Marker({ element: root, anchor: "center", clickTolerance: 8 })
        .setLngLat(entry.coordinates)
        .addTo(map);
      entries.set(entry.id, { marker, element: button });
    });
  }, [mapReady]);

  useEffect(() => {
    markerEntriesRef.current.forEach(({ element }, id) => {
      const isActive = id === activeEntryId;
      element.classList.toggle("scale-125", isActive);
      element.classList.toggle("border-[hsl(var(--highlight))]", isActive);
      element.classList.toggle("ring-2", isActive);
      element.classList.toggle("ring-[hsl(var(--highlight))]/60", isActive);
      element.classList.toggle("grayscale-0", isActive);
      element.style.zIndex = isActive ? "5" : "1";
    });
  }, [activeEntryId]);

  const resetGlobe = () => {
    const view = defaultMapView(isMobile);
    mapRef.current?.easeTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      duration: 900,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      essential: true,
    });
  };

  const albumHref = (entry: PhotoMapEntry) =>
    entry.albumFolder ? `/photos?album=${encodeURIComponent(entry.albumFolder)}` : "/photos";

  const hasAlbum = (entry: PhotoMapEntry) => Boolean(entry.albumFolder);

  const openEntry = (entry: PhotoMapEntry) => {
    if (!hasAlbum(entry)) return;

    navigate(albumHref(entry));
  };

  if (!mapboxToken) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-sm text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">Photo Map</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Mapbox token missing</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/60">
            Add `NEXT_PUBLIC_MAPBOX_TOKEN`, `VITE_MAPBOX_ACCESS_TOKEN`, or `VITE_MAPBOX_TOKEN` to enable the globe.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
      />

      <motion.main
        animate={{
          x: sidebarOpen && !isMobile ? 200 : searchOpen && !isMobile ? -200 : 0,
        }}
        transition={{ duration: 0.56, ease: EASE_TEXT }}
        className="relative h-[100svh] w-full overflow-hidden bg-background will-change-transform"
      >
        <section className="relative h-full overflow-hidden bg-background">
          <div ref={containerRef} className="photo-map-shell h-full w-full" />

          {!mapReady || mapError ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/96 p-6">
              <div className="w-full max-w-xs text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-foreground/45">
                  {mapError ? "Map unavailable" : "Photo Map"}
                </p>
                <div className="mx-auto mt-4 h-px w-40 overflow-hidden bg-foreground/10">
                  {!mapError ? <div className="photo-map-loading-bar h-full w-1/2 bg-foreground/60" /> : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground/60">
                  {mapError ?? "Loading locations"}
                </p>
              </div>
            </div>
          ) : null}

          <section className="pointer-events-none absolute inset-x-0 bottom-0 right-0 z-[70] flex justify-end p-3 sm:inset-y-0 sm:left-auto sm:w-[382px] sm:p-4">
            <AnimatePresence mode="wait">
              {activeEntry ? (
                <motion.article
                  key={activeEntry.id}
                  className="site-corner group/photo-panel pointer-events-auto relative flex h-[40svh] min-h-[260px] w-full overflow-hidden border border-white/18 bg-[hsl(var(--image-scrim))] text-white shadow-2xl shadow-black/45 sm:h-full sm:max-w-[350px]"
                  initial={isMobile ? { opacity: 0, y: 28, filter: "blur(8px)" } : { opacity: 0, x: 36, filter: "blur(8px)" }}
                  animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                  exit={isMobile ? { opacity: 0, y: 24, filter: "blur(6px)" } : { opacity: 0, x: 28, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <img
                    src={activeEntry.coverImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-out group-hover/photo-panel:scale-[1.015]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/22 to-black/20" />
                  <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end p-4 sm:p-5">
                    <button
                      type="button"
                      className="mb-4 text-left sm:mb-6"
                      onClick={() => openEntry(activeEntry)}
                      aria-label={hasAlbum(activeEntry) ? `Open ${activeEntry.location} album` : `${activeEntry.location} album not available`}
                    >
                      <h1 className="text-4xl font-semibold leading-[1] tracking-tight sm:text-5xl">{activeEntry.title}</h1>
                    </button>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      {hasAlbum(activeEntry) ? (
                        <Link
                          to={albumHref(activeEntry)}
                          className="photo-map-panel-button group"
                        >
                          <span className="relative z-10 flex items-center justify-between">
                            Open Album
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </Link>
                      ) : (
                        <div className="photo-map-panel-button photo-map-panel-button-disabled">
                          <span className="relative z-10">Album not available</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={resetGlobe}
                        className="photo-map-panel-button photo-map-panel-icon-button group"
                        aria-label="Reset map view"
                      >
                        <RotateCcw className="relative z-10 h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ) : null}
            </AnimatePresence>
          </section>
        </section>
      </motion.main>

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

export default PhotoMapPage;
