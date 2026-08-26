export const MOTION_EASE: [number, number, number, number] = [0.2, 0.78, 0.22, 1];
export const MOTION_EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const MOTION_DURATION = {
  instant: 0.16,
  fast: 0.22,
  base: 0.34,
  reveal: 0.46,
  panel: 0.58,
} as const;

export const MOTION_REVEAL = {
  initial: { opacity: 0, y: 10, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
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
