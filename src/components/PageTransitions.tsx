import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigationType, type Location } from 'react-router-dom';
import { useMotionPreference, motionReduced } from '@/hooks/useMotionPreference';
import { saveNavigationPosition } from '@/lib/navigationScroll';
import { RouteNavigationContext } from '@/lib/routeNavigation';
import { warmRoute } from '@/lib/routePreload';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion';
import ScrollManager from './ScrollManager';
import RouteLoader from './RouteLoader';

type SnapshotTransition = { skipTransition(): void; ready: Promise<void>; finished: Promise<void> };
type Frame = { location: Location; restoring: boolean; arrival: number };

/** Only one live route. Browser snapshots retain the previous viewport during handoff. */
export default function PageTransitions({ children }: { children: (location: Location) => ReactNode }) {
  const requested = useLocation();
  const navigationType = useNavigationType();
  const reduced = useMotionPreference();
  const [frame, setFrame] = useState<Frame>(() => ({ location: requested, restoring: false, arrival: 0 }));
  const current = useRef(frame);
  current.current = frame;
  const serial = useRef(0);
  const transition = useRef<SnapshotTransition | null>(null);
  const ready = useRef<{ ticket: number; resolve: () => void } | null>(null);
  const scene = useRef<HTMLDivElement>(null);
  const fallbackAnimation = useRef<Animation | null>(null);
  const committed = useCallback((ticket: number) => {
    if (ready.current?.ticket === ticket) { ready.current.resolve(); ready.current = null; }
  }, []);

  useEffect(() => {
    if (reduced) { transition.current?.skipTransition(); fallbackAnimation.current?.cancel(); }
  }, [reduced]);
  useLayoutEffect(() => {
    if (requested === current.current.location) return;
    const previous = current.current.location;
    const ticket = ++serial.current;
    transition.current?.skipTransition();
    ready.current?.resolve(); ready.current = null;
    fallbackAnimation.current?.cancel();
    // Drafts, hash sharing, album controls and query updates keep their own lifecycle.
    const albumChanged = requested.pathname === '/' && new URLSearchParams(requested.search).get('album') !== new URLSearchParams(previous.search).get('album');
    if (requested.pathname === previous.pathname && !albumChanged) {
      saveNavigationPosition(previous);
      setFrame(value => ({ ...value, location: requested }));
      return;
    }
    const restoring = navigationType === 'POP' || requested.state?.restoreWork === true || requested.state?.restoreGallery === true;
    let cancelled = false;
    let releaseTimer = 0;
    const perform = async () => {
      await warmRoute(requested.pathname);
      if (cancelled || ticket !== serial.current) return;
      saveNavigationPosition(current.current.location);
      const next: Frame = { location: requested, restoring, arrival: ticket };
      const commit = () => {
        if (cancelled || ticket !== serial.current) return Promise.resolve();
        return new Promise<void>(resolve => {
          ready.current = { ticket, resolve };
          // Also release if a lazy import reaches its recoverable-error fallback.
          releaseTimer = window.setTimeout(() => committed(ticket), 2000);
          flushSync(() => setFrame(next));
        });
      };
      const start = (document as Document & { startViewTransition?: (update: () => Promise<void>) => SnapshotTransition }).startViewTransition;
      if (!motionReduced() && typeof start === 'function') {
        document.documentElement.dataset.routeTransition = restoring ? 'return' : 'forward';
        const active = start.call(document, commit);
        transition.current = active;
        void active.ready.catch(() => {});
        void active.finished.catch(() => {}).finally(() => {
          window.clearTimeout(releaseTimer);
          if (transition.current === active) {
            transition.current = null;
            delete document.documentElement.dataset.routeTransition;
          }
        });
      } else {
        await commit();
        window.clearTimeout(releaseTimer);
        if (!cancelled && !motionReduced() && scene.current?.animate) {
          fallbackAnimation.current = scene.current.animate([{ opacity: 0.72 }, { opacity: 1 }], { duration: MOTION_DURATION.base * 1000, easing: `cubic-bezier(${MOTION_EASE.join(',')})` });
        }
      }
    };
    void perform();
    return () => { cancelled = true; window.clearTimeout(releaseTimer); };
  }, [requested, navigationType, committed]);

  useEffect(() => () => {
    serial.current++;
    transition.current?.skipTransition(); ready.current?.resolve();
    fallbackAnimation.current?.cancel();
    delete document.documentElement.dataset.routeTransition;
  }, []);

  return <RouteNavigationContext.Provider value={{ key: frame.location.key, restoring: frame.restoring }}>
    <Suspense fallback={<RouteLoader />}>
      <div ref={scene} className="route-scene" data-route-path={frame.location.pathname}>
        {children(frame.location)}
        <RouteArrival frame={frame} onReady={committed} />
      </div>
    </Suspense>
  </RouteNavigationContext.Provider>;
}

function RouteArrival({ frame, onReady }: { frame: Frame; onReady: (ticket: number) => void }) {
  const arrived = useCallback(() => onReady(frame.arrival), [frame.arrival, onReady]);
  return <ScrollManager sequence={frame.arrival} location={frame.location} restoring={frame.restoring} onReady={frame.arrival ? arrived : undefined} />;
}
