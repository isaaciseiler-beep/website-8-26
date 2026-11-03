import { Suspense, startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigationType, type Location } from 'react-router-dom';
import { motionReduced, useMotionPreference } from '@/hooks/useMotionPreference';
import { saveNavigationPosition } from '@/lib/navigationScroll';
import { RouteNavigationContext } from '@/lib/routeNavigation';
import { warmRoute } from '@/lib/routePreload';
import { MOTION_DURATION, MOTION_EASE_NAVIGATION } from '@/lib/motion';
import ScrollManager from './ScrollManager';
import RouteLoader from './RouteLoader';

type Frame = { location: Location; restoring: boolean; arrival: number };

/** Retain the live page while loading; navigation chrome keeps folding independently. */
export default function PageTransitions({ children }: { children: (location: Location) => ReactNode }) {
  const requested = useLocation();
  const navigationType = useNavigationType();
  const reduced = useMotionPreference();
  const [frame, setFrame] = useState<Frame>(() => ({ location: requested, restoring: false, arrival: 0 }));
  const current = useRef(frame);
  const serial = useRef(0);
  const scene = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  useLayoutEffect(() => { current.current = frame; }, [frame]);

  const committed = useCallback((ticket: number) => {
    if (ticket !== serial.current) return;
    window.dispatchEvent(new CustomEvent('site-page-ready'));
    if (motionReduced() || !scene.current?.animate) return;
    animation.current?.cancel();
    animation.current = scene.current.animate([{ opacity: 0.72 }, { opacity: 1 }], {
      duration: MOTION_DURATION.panel * 1000,
      easing: `cubic-bezier(${MOTION_EASE_NAVIGATION.join(',')})`,
    });
  }, []);

  useEffect(() => { if (reduced) animation.current?.cancel(); }, [reduced]);
  useLayoutEffect(() => {
    const ticket = ++serial.current;
    animation.current?.cancel();
    if (requested === current.current.location) return;
    const previous = current.current.location;
    const fullMenu = window.innerWidth < 768 && document.body.hasAttribute('data-site-sidebar-open');
    if (fullMenu) window.dispatchEvent(new CustomEvent('site-sidebar-navigation'));
    const albumChanged = requested.pathname === '/' && new URLSearchParams(requested.search).get('album') !== new URLSearchParams(previous.search).get('album');
    // Drafts, hash sharing and query controls keep their own lifecycle.
    if (requested.pathname === previous.pathname && !albumChanged) {
      saveNavigationPosition(previous);
      setFrame(value => ({ ...value, location: requested, arrival: fullMenu ? ticket : value.arrival }));
      return;
    }
    const restoring = navigationType === 'POP' || requested.state?.restoreWork === true || requested.state?.restoreGallery === true;
    let cancelled = false;
    void warmRoute(requested.pathname).then(() => {
      if (cancelled || ticket !== serial.current) return;
      saveNavigationPosition(current.current.location);
      const next: Frame = { location: requested, restoring, arrival: ticket };
      // Suspense retains the outgoing page until the destination commits. No
      // viewport snapshot can freeze the sidebar or cover its closing motion.
      startTransition(() => setFrame(() => ticket === serial.current ? next : current.current));
    });
    return () => { cancelled = true; };
  }, [requested, navigationType]);

  useEffect(() => () => { serial.current++; animation.current?.cancel(); }, []);

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
