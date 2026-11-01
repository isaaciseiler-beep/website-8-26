"use client";

import { motionReduced, useMotionPreference } from "@/hooks/useMotionPreference";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type {
  LngLatLike,
  Map as MapboxMap,
  MapMouseEvent,
  Marker as MapboxMarker,
  PaddingOptions,
} from "mapbox-gl";

import { canDeletePin } from "@/lib/fulbrightmap/storage";
import type { PendingLocation, Pin } from "@/lib/fulbrightmap/types";
import PinPopup from "./PinPopup";

const NEW_TAIPEI_CENTER: LngLatLike = [121.4657, 25.012];
const NEW_TAIPEI_BOUNDS: [[number, number], [number, number]] = [
  [120.95, 24.52],
  [122.15, 25.42],
];

type MapboxModule = typeof import("mapbox-gl");
type MapboxGL = MapboxModule["default"];

type MarkerEntry = {
  marker: MapboxMarker;
  root: HTMLDivElement;
  button: HTMLButtonElement;
};

let mapboxPromise: Promise<MapboxModule> | null = null;

const loadMapbox = () => {
  if (!mapboxPromise) {
    mapboxPromise = Promise.all([
      import("mapbox-gl"),
      import("mapbox-gl/dist/mapbox-gl.css"),
    ])
      .then(([mapboxModule]) => mapboxModule)
      .catch((error) => {
        mapboxPromise = null;
        throw error;
      });
  }

  return mapboxPromise;
};

function stopMarkerEvent(event: Event) {
  event.stopPropagation();
}

function getPopupCameraPadding(): PaddingOptions {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  if (window.innerWidth >= 640) {
    return {
      top: 0,
      right: Math.min(460, window.innerWidth * 0.36),
      bottom: 0,
      left: 0,
    };
  }

  return {
    top: 0,
    right: 0,
    bottom: Math.min(360, window.innerHeight * 0.46),
    left: 0,
  };
}

export default function MapView({
  token,
  pins,
  popupRequest,
  highlightedPinId,
  loadingPins,
  anonymousUserId,
  locked,
  onMapClick,
  onDeletePin,
}: {
  token: string;
  pins: Pin[];
  popupRequest: { pinId: string; fly: boolean; nonce: number } | null;
  highlightedPinId: string | null;
  loadingPins: boolean;
  anonymousUserId: string;
  locked: boolean;
  onMapClick: (location: PendingLocation) => void;
  onDeletePin: (pinId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const reduced = useMotionPreference();
  useEffect(() => { if (reduced) mapRef.current?.stop(); }, [reduced]);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const suppressMapClickRef = useRef(false);
  const markerEntriesRef = useRef<Map<string, MarkerEntry>>(new Map());
  const pinsRef = useRef<Pin[]>(pins);
  const activePinRef = useRef<Pin | null>(null);
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let loaded = false;
    const markerEntries = markerEntriesRef.current;

    const initializeMap = async () => {
      try {
        const mapboxModule = await loadMapbox();
        if (cancelled || !containerRef.current || mapRef.current) return;

        const mapbox = mapboxModule.default;
        mapboxRef.current = mapbox;
        mapbox.accessToken = token;

        if (!mapbox.supported()) {
          setMapError(
            "The map could not start because this browser does not support WebGL. Try another browser or turn WebGL back on.",
          );
          return;
        }

        let map: MapboxMap;

        try {
          map = new mapbox.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: NEW_TAIPEI_CENTER,
            zoom: 10,
            minZoom: 8,
            maxZoom: 18,
            maxBounds: NEW_TAIPEI_BOUNDS,
            attributionControl: false,
          });
        } catch (error) {
          console.error("Fulbright map failed to initialize", error);
          setMapError("The map could not start. Refresh once or try another browser.");
          return;
        }

        if (cancelled) {
          map.remove();
          return;
        }

        mapRef.current = map;
        map.addControl(new mapbox.NavigationControl({ visualizePitch: true }), "top-left");
        map.addControl(new mapbox.AttributionControl({ compact: true }), "bottom-left");

        const handleLoad = () => {
          loaded = true;
          setMapError(null);
          setMapReady(true);
        };
        const handleError = (event: { error?: Error }) => {
          console.error("Fulbright map runtime error", event.error ?? event);
          if (loaded) return;

          const message = event.error?.message ?? "";
          const tokenRejected =
            message.includes("401") ||
            message.includes("403") ||
            message.toLowerCase().includes("unauthorized");

          setMapError(
            tokenRejected
              ? "The map could not load because the Mapbox token was rejected."
              : "The map could not load. Refresh once or check that the browser is not blocking Mapbox.",
          );
        };

        map.on("load", handleLoad);
        map.on("error", handleError);
      } catch (error) {
        console.error("Fulbright map library failed to load", error);
        if (!cancelled) {
          setMapError(
            "The map library could not load. Refresh once or check that the browser is not blocking Mapbox.",
          );
        }
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      markerEntries.forEach(({ marker }) => {
        marker.remove();
      });
      markerEntries.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  useEffect(() => {
    if (!activePin) return;
    if (!pins.some((pin) => pin.id === activePin.id)) {
      setActivePin(null);
    }
  }, [activePin, pins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (event: MapMouseEvent) => {
      if (suppressMapClickRef.current) {
        suppressMapClickRef.current = false;
        return;
      }

      if (activePinRef.current) {
        setActivePin(null);
        suppressMapClickRef.current = false;
        return;
      }
      if (locked) return;
      onMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [locked, onMapClick]);

  const openPopup = useCallback((pin: Pin, fly: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    const center: LngLatLike = [pin.lng, pin.lat];
    const padding = getPopupCameraPadding();

    setActivePin(pin);
    map.stop();

    if (fly) {
      map.flyTo({
        center,
        zoom: Math.max(map.getZoom(), 13.2),
        padding,
        retainPadding: false,
        speed: 0.75,
        ...(motionReduced() ? { duration: 0 } : {}),
        curve: 1.25,
        essential: false,
      });
      return;
    }

    map.easeTo({
      center,
      padding,
      retainPadding: false,
      duration: motionReduced() ? 0 : 650,
      easing: (time) => 1 - Math.pow(1 - time, 3),
      essential: false,
    });
  }, []);

  const openPopupRef = useRef(openPopup);

  useEffect(() => {
    openPopupRef.current = openPopup;
  }, [openPopup]);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !mapReady) return;

    const entries = markerEntriesRef.current;
    const nextPinIds = new Set(pins.map((pin) => pin.id));

    entries.forEach(({ marker }, pinId) => {
      if (!nextPinIds.has(pinId)) {
        marker.remove();
        entries.delete(pinId);
      }
    });

    pins.forEach((pin) => {
      if (entries.has(pin.id)) return;

      const root = document.createElement("div");
      root.dataset.pinId = pin.id;
      root.className = "relative h-0 w-0";

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Open ${pin.placeName}`);
      button.className =
        "group relative h-12 w-12 rounded-full border-2 border-white/95 bg-neutral-900 shadow-xl transition-[border-color,box-shadow,filter] duration-150 hover:border-white hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-white/70";
      button.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.2)), url("${pin.imageUrl}")`;
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.left = "-24px";
      button.style.position = "absolute";
      button.style.top = "-60px";

      const tail = document.createElement("span");
      tail.className =
        "absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[4px] border-b-2 border-r-2 border-white/95 bg-inherit";
      button.appendChild(tail);

      const dot = document.createElement("span");
      dot.className =
        "absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-neutral-950 shadow";
      button.appendChild(dot);

      button.addEventListener("pointerdown", stopMarkerEvent);
      button.addEventListener("mousedown", stopMarkerEvent);
      button.addEventListener("touchstart", stopMarkerEvent, { passive: true });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        suppressMapClickRef.current = true;
        openPopupRef.current(pin, false);
        window.setTimeout(() => {
          suppressMapClickRef.current = false;
        }, 120);
      });

      root.appendChild(button);

      const marker = new mapbox.Marker({
        element: root,
        anchor: "center",
        clickTolerance: 8,
      })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      entries.set(pin.id, { marker, root, button });
    });
  }, [mapReady, pins]);

  useEffect(() => {
    markerEntriesRef.current.forEach(({ button, root }) => {
      const isHighlighted = root.dataset.pinId === highlightedPinId;
      button.classList.toggle("ring-4", isHighlighted);
      button.classList.toggle("ring-white/80", isHighlighted);
      button.classList.toggle("shadow-2xl", isHighlighted);
      root.style.zIndex = isHighlighted ? "10" : "1";
    });
  }, [highlightedPinId]);

  useEffect(() => {
    if (!popupRequest || !mapReady) return;

    const pin = pinsRef.current.find(
      (candidate) => candidate.id === popupRequest.pinId,
    );
    if (pin) openPopup(pin, popupRequest.fly);
  }, [mapReady, openPopup, popupRequest]);

  return (
    <div className="fulbright-map-shell relative h-[100svh] w-full overflow-hidden bg-[#0d1412]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.24),transparent_32%,rgba(0,0,0,0.28))]" />

      {!mapReady || loadingPins || mapError ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
          <div className="max-w-sm rounded-[1.25rem] border border-white/15 bg-neutral-950/70 p-5 text-center text-white shadow-2xl backdrop-blur-xl">
            <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-white/80 shadow-lg shadow-black/30" />
            <div className="mt-4 text-lg font-semibold">
              {mapError ? "Map setup needs attention" : "Preparing the map"}
            </div>
            <p className="mt-1 text-sm leading-5 text-white/65">
              {mapError ??
                "Loading New Taipei and the favorite spots people have shared."}
            </p>
          </div>
        </div>
      ) : null}

      <aside
        aria-label="Selected favorite spot"
        data-state={activePin ? "open" : "closed"}
        className={[
          "fulbright-detail-panel fixed bottom-0 right-0 z-40 w-full p-3 transition duration-300 ease-out sm:bottom-4 sm:right-4 sm:top-4 sm:w-[420px] sm:p-0",
          activePin
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0",
        ].join(" ")}
      >
        <div className="fulbright-detail-card relative h-full max-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[1.35rem] bg-white shadow-2xl shadow-black/35 ring-1 ring-black/5">
          <button
            type="button"
            aria-label="Close spot details"
            onClick={() => setActivePin(null)}
            className="absolute right-3 top-3 z-10 rounded-full border border-white/40 bg-black/55 p-2 text-white shadow-lg backdrop-blur transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>

          {activePin ? (
            <PinPopup
              pin={activePin}
              canDelete={!locked && canDeletePin(activePin, anonymousUserId)}
              onDelete={() => {
                setActivePin(null);
                onDeletePin(activePin.id);
              }}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
