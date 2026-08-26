type FetchPriority = "high" | "low" | "auto";
type PrioritizedImage = HTMLImageElement & { fetchPriority?: FetchPriority };
type PrioritizedLink = HTMLLinkElement & { fetchPriority?: FetchPriority };

interface PreloadImageOptions {
  batchSize?: number;
  decode?: boolean;
  fallbackDelay?: number;
  fetchPriority?: FetchPriority;
  idleTimeout?: number;
  linkPreload?: boolean;
}

const warmedOrigins = new Set<string>();
const requestedImages = new Map<string, Promise<boolean>>();

const normalizeSrc = (src: string) => {
  if (!src) return "";
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
};

const warmOrigin = (src: string) => {
  const url = normalizeSrc(src);
  if (!url || url.startsWith(window.location.origin)) return;

  const origin = new URL(url).origin;
  if (warmedOrigins.has(origin)) return;
  if (document.querySelector(`link[rel="preconnect"][href="${origin}/"], link[rel="preconnect"][href="${origin}"]`)) {
    warmedOrigins.add(origin);
    return;
  }

  warmedOrigins.add(origin);

  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = origin;
  preconnect.crossOrigin = "anonymous";
  document.head.appendChild(preconnect);
};

const addPreloadHint = (src: string, fetchPriority: FetchPriority) => {
  const href = normalizeSrc(src);
  if (
    !href ||
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')].some((link) => link.href === href)
  ) {
    return;
  }

  const link = document.createElement("link") as PrioritizedLink;
  link.rel = "preload";
  link.as = "image";
  link.href = href;
  link.fetchPriority = fetchPriority;
  document.head.appendChild(link);
};

export const preloadImage = (src: string, options: PreloadImageOptions = {}) => {
  if (typeof window === "undefined" || !src) return Promise.resolve(false);

  const href = normalizeSrc(src);
  if (!href) return Promise.resolve(false);

  warmOrigin(href);

  if (options.linkPreload) {
    addPreloadHint(href, options.fetchPriority ?? "auto");
  }

  const existingRequest = requestedImages.get(href);
  if (existingRequest) return existingRequest;

  const request = new Promise<boolean>((resolve) => {
    const image = new Image() as PrioritizedImage;
    image.decoding = "async";
    image.fetchPriority = options.fetchPriority ?? "auto";
    image.loading = "eager";
    image.onload = async () => {
      if (options.decode && "decode" in image) {
        try {
          await image.decode();
        } catch {
          // Decoding can reject for cross-origin/cache timing even after load.
        }
      }
      resolve(true);
    };
    image.onerror = () => resolve(false);
    image.src = href;
  });
  requestedImages.set(href, request);
  return request;
};

export const preloadImages = (srcs: Iterable<string>, options: PreloadImageOptions = {}) =>
  Promise.all([...new Set([...srcs].filter(Boolean))].map((src) => preloadImage(src, options)));

export const scheduleImagePreloads = (
  srcs: Iterable<string>,
  options: PreloadImageOptions = {},
) => {
  if (typeof window === "undefined") return;

  const queue = [...new Set([...srcs].filter(Boolean))];
  const batchSize = Math.max(1, options.batchSize ?? 4);
  const fallbackDelay = options.fallbackDelay ?? 160;
  const idleTimeout = options.idleTimeout ?? 900;
  let index = 0;

  const runBatch = () => {
    const batch = queue.slice(index, index + batchSize);
    index += batch.length;
    batch.forEach((src) => void preloadImage(src, options));

    if (index >= queue.length) return;

    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;

    if (idle) {
      idle(runBatch, { timeout: idleTimeout });
    } else {
      window.setTimeout(runBatch, fallbackDelay);
    }
  };

  runBatch();
};
