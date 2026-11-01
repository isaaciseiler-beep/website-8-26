import { useSyncExternalStore } from 'react';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';

const query = '(prefers-reduced-motion: reduce)';
export const motionReduced = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
const listeners = new Set<() => void>();
let media: MediaQueryList | null = null;
const notifyMotion = () => listeners.forEach(notify => notify());
const subscribe = (notify: () => void) => {
  if (!listeners.size) {
    media = window.matchMedia(query);
    media.addEventListener('change', notifyMotion);
  }
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
    if (!listeners.size) { media?.removeEventListener('change', notifyMotion); media = null; }
  };
};

/** Shared by CSS/Motion, maps, charts, timers and imperative scrolling. */
export const useMotionPreference = () => useSyncExternalStore(subscribe, motionReduced, () => true);
export const useNavigationMotion = (open: boolean) => {
  const reduced = useMotionPreference();
  return { duration: reduced ? 0 : open ? MOTION_DURATION.base : MOTION_DURATION.fast, ease: MOTION_EASE_ENTER };
};

const subscribeVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
};
export const usePageVisible = () => useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => false);
