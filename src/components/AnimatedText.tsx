import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motion";

interface AnimatedTextProps {
  text: string;
  as?: "span" | "p";
  className?: string;
  style?: CSSProperties;
  delay?: number;
  once?: boolean;
  margin?: string;
  controlledVisible?: boolean;
}

const AnimatedText = ({
  text,
  as = "span",
  className = "",
  style,
  delay = 0,
  once = true,
  margin = "-50px",
  controlledVisible,
}: AnimatedTextProps) => {
  const MotionTag = as === "p" ? motion.p : motion.span;

  // Split into words to keep words intact while still animating per-character.
  // A single parent observer drives the stagger so individual letters can't
  // be missed by the IntersectionObserver (which happened with very small
  // inline-block chars at large viewports — first letters never triggered).
  const words = text.split(" ");
  let charCounter = 0;

  const container = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren: 0.012,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 8, filter: "blur(3px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE },
    },
  };

  return (
    <MotionTag
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      animate={controlledVisible === undefined ? undefined : controlledVisible ? "visible" : "hidden"}
      whileInView={controlledVisible === undefined ? "visible" : undefined}
      viewport={controlledVisible === undefined ? { once, margin } : undefined}
    >
      {words.map((word, wIdx) => {
        const isLast = wIdx === words.length - 1;
        return (
          <span
            key={`${text}-w-${wIdx}`}
            className="inline-block whitespace-nowrap"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word.split("").map((char, cIdx) => {
              const i = charCounter++;
              return (
                <motion.span
                  key={`${text}-${wIdx}-${cIdx}-${i}`}
                  className="inline-block will-change-transform"
                  variants={child}
                >
                  {char}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </MotionTag>
  );
};

export default AnimatedText;
