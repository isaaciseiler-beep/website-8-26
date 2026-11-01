import { forwardRef } from 'react';
import { motion, useIsPresent, type HTMLMotionProps } from 'framer-motion';

/** Presence exits remain visible to the eye, but never interactive or announced. */
const MotionSurface = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(function MotionSurface(props, ref) {
  const present = useIsPresent();
  return <motion.div {...props} ref={ref} aria-hidden={!present || props['aria-hidden']}
    {...(!present ? { inert: '' } : {})} />;
});
export default MotionSurface;
