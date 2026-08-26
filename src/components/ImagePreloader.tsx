import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { preloadImage, scheduleImagePreloads } from "@/lib/imagePreload";

type PrioritizedImage = HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" };

const isSaveDataConnection = () => {
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  return Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g");
};

const ImagePreloader = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    const seen = new WeakSet<HTMLImageElement>();
    const deferred = new Set<string>();
    let frame = 0;
    let highPriorityCount = 0;
    let observer: MutationObserver | undefined;

    const markReady = (image: HTMLImageElement) => {
      if (image.style.opacity) return;
      if (image.dataset.imageState === "loading") image.dataset.imageReveal = "true";
      image.dataset.imageState = "ready";
    };

    const prepareImage = (image: HTMLImageElement) => {
      if (seen.has(image)) return;
      seen.add(image);

      const src = image.currentSrc || image.src;
      if (!src) return;

      if (!image.style.opacity) {
        image.dataset.imageState = image.complete && image.naturalWidth > 0 ? "ready" : "loading";
        image.addEventListener("load", () => markReady(image), { once: true });
        image.addEventListener("error", () => markReady(image), { once: true });
        if (image.dataset.imageState === "loading") {
          void image.decode()
            .then(() => markReady(image))
            .catch(() => {
              if (image.complete) markReady(image);
            });
        }
      }

      const rect = image.getBoundingClientRect();
      const nearViewport = rect.bottom >= -160 && rect.top <= window.innerHeight * 1.35;

      if (nearViewport) {
        const highPriority = highPriorityCount < 2;
        highPriorityCount += 1;
        image.loading = "eager";
        (image as PrioritizedImage).fetchPriority = highPriority ? "high" : "auto";
        void preloadImage(src, {
          decode: true,
          fetchPriority: highPriority ? "high" : "auto",
          linkPreload: highPriority,
        });
        return;
      }

      deferred.add(src);
    };

    const scan = () => {
      frame = 0;
      document.querySelectorAll<HTMLImageElement>("img[src]").forEach(prepareImage);

      if (!isSaveDataConnection() && deferred.size) {
        scheduleImagePreloads(deferred, {
          batchSize: 3,
          decode: false,
          fetchPriority: "low",
          idleTimeout: 1200,
        });
        deferred.clear();
      }
    };

    const scheduleScan = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(scan);
    };

    const start = () => {
      scan();
      observer = new MutationObserver(scheduleScan);
      observer.observe(document.getElementById("root") ?? document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "srcset"],
      });
    };
    const startTimer = location.key === "default"
      ? undefined
      : window.setTimeout(start, 240);
    if (location.key === "default") start();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (startTimer) window.clearTimeout(startTimer);
      observer?.disconnect();
    };
  }, [location.key]);

  return null;
};

export default ImagePreloader;
