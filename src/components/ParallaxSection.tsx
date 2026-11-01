import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  offset?: number;
  className?: string;
  id?: string;
  clip?: boolean;
}

const ParallaxSection = ({ children, offset = 40, className, id, clip = true }: ParallaxSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [offset, offset * 0.04, -offset * 0.04, -offset]);

  return (
    <div ref={ref} id={id} className={className} style={clip ? { overflow: "hidden" } : undefined}>
      <motion.div style={prefersReducedMotion ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxSection;
