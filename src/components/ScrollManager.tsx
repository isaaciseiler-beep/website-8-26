import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { scrollPositionStorageKey, shouldRestoreInitialScrollFor } from "@/lib/navigationScroll";

const readScrollPosition = (url: string) => {
  try {
    const value = window.sessionStorage.getItem(scrollPositionStorageKey(url));
    const position = value === null ? Number.NaN : Number(value);
    return Number.isFinite(position) && position >= 0 ? position : null;
  } catch {
    return null;
  }
};

const saveScrollPosition = (url: string) => {
  try {
    window.sessionStorage.setItem(scrollPositionStorageKey(url), String(window.scrollY));
  } catch {
    // Browsing remains functional when storage is unavailable.
  }
};

const ScrollManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const firstRenderRef = useRef(true);
  const url = `${location.pathname}${location.search}`;

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const isFirstRender = firstRenderRef.current;
    firstRenderRef.current = false;
    const shouldRestore = isFirstRender
      ? shouldRestoreInitialScrollFor(url)
      : navigationType === "POP";
    const savedPosition = shouldRestore ? readScrollPosition(url) : null;

    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let stopTimer: number | undefined;

    const stopRestoring = () => {
      if (cancelled) return;
      cancelled = true;
      observer?.disconnect();
      if (stopTimer) window.clearTimeout(stopTimer);
    };

    if (savedPosition === null) {
      window.scrollTo({ top: 0, left: 0 });
    } else {
      const restore = () => {
        if (cancelled) return;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({ top: Math.min(savedPosition, maxScroll), left: 0 });
        if (maxScroll >= savedPosition) stopRestoring();
      };

      restore();
      if (!cancelled && typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(restore);
        observer.observe(document.documentElement);
      }
      if (!cancelled) stopTimer = window.setTimeout(stopRestoring, 2500);
    }

    const cancelOnInput = () => stopRestoring();
    const saveOnPageHide = () => saveScrollPosition(url);
    window.addEventListener("pointerdown", cancelOnInput, { once: true });
    window.addEventListener("touchstart", cancelOnInput, { once: true, passive: true });
    window.addEventListener("wheel", cancelOnInput, { once: true, passive: true });
    window.addEventListener("keydown", cancelOnInput, { once: true });
    window.addEventListener("pagehide", saveOnPageHide);

    return () => {
      saveScrollPosition(url);
      stopRestoring();
      window.removeEventListener("pointerdown", cancelOnInput);
      window.removeEventListener("touchstart", cancelOnInput);
      window.removeEventListener("wheel", cancelOnInput);
      window.removeEventListener("keydown", cancelOnInput);
      window.removeEventListener("pagehide", saveOnPageHide);
    };
  }, [location.key, navigationType, url]);

  return null;
};

export default ScrollManager;
