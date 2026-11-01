import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, type Location } from 'react-router-dom';
import { readNavigationPosition, saveNavigationPosition, shouldRestoreInitialScrollFor } from '@/lib/navigationScroll';

type Props = { location?: Location; sequence?: number; restoring?: boolean; onReady?: () => void };
export default function ScrollManager({ location: presented, sequence, restoring = false, onReady }: Props) {
  const routerLocation = useLocation();
  const location = presented ?? routerLocation;
  const latest = useRef(location);
  latest.current = location;
  const identity = sequence ?? location.key;
  const first = useRef(true);
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const location = latest.current;
    const restore = restoring || first.current && shouldRestoreInitialScrollFor(location.pathname + location.search);
    first.current = false;
    const saved = restore ? readNavigationPosition(location) : null;
    let stopped = false;
    let ready = false;
    let observer: ResizeObserver | undefined;
    let timer = 0;
    const reportReady = () => { if (!ready) { ready = true; onReady?.(); } };
    const stop = () => { stopped = true; observer?.disconnect(); window.clearTimeout(timer); reportReady(); };
    const place = () => {
      if (stopped) return;
      const link = saved?.href ? [...document.querySelectorAll<HTMLAnchorElement>('main a[href]')].find(el => el.getAttribute('href') === saved.href) : null;
      // Restore the disclosure that held the link the visitor actually followed.
      for (let details = link?.closest('details'); details; details = details.parentElement?.closest('details')) details.open = true;
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      const y = saved?.y ?? 0;
      window.scrollTo({ top: Math.min(y, max), left: 0, behavior: 'instant' });
      if (max >= y) {
        // Focus the previous content link on return; otherwise announce the new main.
        const main = document.querySelector<HTMLElement>('main');
        if (main && !link) main.setAttribute('tabindex', '-1');
        (link ?? main)?.focus({ preventScroll: true });
        stop();
      }
    };
    place();
    if (!stopped) {
      observer = new ResizeObserver(place);
      observer.observe(document.documentElement);
      // Never hold a snapshot indefinitely for a short or changed destination.
      timer = window.setTimeout(stop, 700);
    }
    const save = () => saveNavigationPosition(latest.current);
    window.addEventListener('pagehide', save);
    window.addEventListener('wheel', stop, { once: true, passive: true });
    window.addEventListener('touchstart', stop, { once: true, passive: true });
    window.addEventListener('pointerdown', stop, { once: true });
    window.addEventListener('keydown', stop, { once: true });
    return () => {
      stopped = true; observer?.disconnect(); window.clearTimeout(timer); reportReady();
      window.removeEventListener('pagehide', save);
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop);
      window.removeEventListener('pointerdown', stop); window.removeEventListener('keydown', stop);
    };
  }, [identity, restoring, onReady]);
  return null;
}
