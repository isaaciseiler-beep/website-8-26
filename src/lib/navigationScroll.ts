type NavigationKind = PerformanceNavigationTiming["type"];

const initialUrl = typeof window === "undefined"
  ? ""
  : `${window.location.pathname}${window.location.search}`;

const initialNavigationKind: NavigationKind = (() => {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return "navigate";
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type ?? "navigate";
})();

export const shouldRestoreInitialScrollFor = (url: string) =>
  url === initialUrl && (initialNavigationKind === "reload" || initialNavigationKind === "back_forward");

export const scrollPositionStorageKey = (url: string) => `site-scroll-position:${url}`;
