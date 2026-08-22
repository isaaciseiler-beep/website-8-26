import { motion } from "framer-motion";

const RouteLoader = () => {
  return (
    <main
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-white dark:bg-black"
      aria-busy="true"
      aria-label="Loading"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 w-px bg-foreground/20"
          initial={{ x: "-1px" }}
          animate={{ x: "100vw" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>
    </main>
  );
};

export default RouteLoader;
