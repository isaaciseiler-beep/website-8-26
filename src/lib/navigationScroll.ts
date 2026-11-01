type NavigationKind = PerformanceNavigationTiming['type'];
const initialUrl = typeof window === 'undefined' ? '' : `${window.location.pathname}${window.location.search}`;
const initialNavigationKind: NavigationKind = (() => {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') return 'navigate';
  return (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'navigate';
})();
export const shouldRestoreInitialScrollFor = (url: string) => url === initialUrl && (initialNavigationKind === 'reload' || initialNavigationKind === 'back_forward');
export const scrollPositionStorageKey = (url: string) => `site-scroll-position:${url}`;

type Entry = { key: string; pathname: string; search: string };
export type NavigationPosition = { y: number; href?: string };
const positions = new Map<string, NavigationPosition>();
const urlFor = (entry: Entry) => entry.pathname + entry.search;

/** Capture BEFORE replacing the document, which may clamp scroll on shorter pages. */
export function saveNavigationPosition(entry: Entry) {
  const active = document.activeElement;
  const link = active instanceof Element ? active.closest<HTMLAnchorElement>('main a[href]') : null;
  const position: NavigationPosition = { y: window.scrollY, ...(link ? { href: link.getAttribute('href')! } : {}) };
  positions.delete(entry.key);
  positions.set(entry.key, position);
  if (positions.size > 40) positions.delete(positions.keys().next().value!);
  try {
    sessionStorage.setItem(scrollPositionStorageKey(urlFor(entry)), String(position.y));
  } catch { /* Navigation remains usable when storage is unavailable. */ }
}
export function readNavigationPosition(entry: Entry): NavigationPosition | null {
  const saved = positions.get(entry.key);
  if (saved) return saved;
  try {
    const raw = sessionStorage.getItem(scrollPositionStorageKey(urlFor(entry)));
    if (raw === null) return null;
    const y = Number(raw);
    return Number.isFinite(y) && y >= 0 ? { y } : null;
  } catch { return null; }
}
