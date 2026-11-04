export const MOTION_EASE: [number, number, number, number] = [0.2, 0.78, 0.22, 1];
export const MOTION_EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const MOTION_EASE_EXPLORE: [number, number, number, number] = [0.2, 0.85, 0.3, 1];
export const MOTION_EASE_FOLD: [number, number, number, number] = [0.2, 0.85, 0.3, 1];
export const MOTION_EASE_NAVIGATION: [number, number, number, number] = [0.12, 1, 0.22, 1];

export const MOTION_DURATION = {
  exit: 0.12,
  instant: 0.16,
  fast: 0.22,
  base: 0.34,
  reveal: 0.46,
  exploreReveal: 0.56,
  panel: 0.34,
  fold: 0.56,
  navigationClose: 0.56,
} as const;

export const MOTION_REVEAL = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: MOTION_DURATION.reveal, ease: MOTION_EASE_ENTER },
} as const;

export const shouldFoldChatForPageScroll = ({
  currentScrollY,
  initialScrollY,
  keyboardOpen,
  threshold = 40,
}: {
  currentScrollY: number;
  initialScrollY: number;
  keyboardOpen: boolean;
  threshold?: number;
}) => !keyboardOpen && Math.abs(currentScrollY - initialScrollY) >= threshold;
