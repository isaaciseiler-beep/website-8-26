import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const WORDMARK = ["I", "I", "S"];

interface RouteLoaderProps {
  label?: string;
  detail?: string;
  tone?: "site" | "map";
}

const PHASES = ["Loading", "Fetching assets", "Composing layout", "Almost there"];

const RouteLoader = ({ label, detail, tone = "site" }: RouteLoaderProps) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((current) => (current + 1) % PHASES.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, []);

  const isMap = tone === "map";

  return (
    <main
      className={`route-loader relative grid min-h-[100svh] place-items-center overflow-hidden p-6 ${
        isMap ? "bg-neutral-950 text-white" : "bg-background text-foreground"
      }`}
    >
      {/* sweeping columns */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <motion.span
            key={index}
            className={isMap ? "block h-full bg-white/[0.05]" : "block h-full bg-foreground/[0.04]"}
            initial={{ scaleY: 0, transformOrigin: "bottom" }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{
              duration: 2.1,
              delay: index * 0.09,
              repeat: Infinity,
              ease: EASE,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        <div className="flex items-baseline gap-[0.06em] text-[18vw] font-semibold leading-none tracking-[0.012em] md:text-[9vw]">
          {WORDMARK.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              initial={{ opacity: 0, y: "0.32em", filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.06 * index, ease: EASE }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        <div className={`mt-8 h-px w-[min(58vw,320px)] overflow-hidden ${isMap ? "bg-white/15" : "bg-foreground/12"}`}>
          <motion.div
            className={`h-full w-1/3 ${isMap ? "bg-white" : "bg-foreground"}`}
            animate={{ x: ["-110%", "320%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
          />
        </div>

        <div className="mt-5 h-5 overflow-hidden text-[13px] tracking-[0.012em] opacity-60">
          <motion.div
            key={phase}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {label ?? PHASES[phase]}
          </motion.div>
        </div>

        {detail ? <p className="mt-1 text-[12px] tracking-[0.012em] opacity-40">{detail}</p> : null}
      </div>
    </main>
  );
};

export default RouteLoader;
