import { motion } from "framer-motion";

interface RouteLoaderProps {
  label?: string;
  detail?: string;
  tone?: "site" | "map";
}

const RouteLoader = ({ label, detail, tone = "site" }: RouteLoaderProps) => {
  const isMap = tone === "map";

  return (
    <main
      className={`route-loader relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden ${
        isMap ? "bg-neutral-950 text-white" : "bg-background text-foreground"
      }`}
      aria-busy="true"
    >
      {/* full-screen left-to-right sweep */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 w-[45vw]"
          style={{
            background: isMap
              ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.16) 55%, transparent 100%)"
              : "linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.06) 45%, hsl(var(--foreground) / 0.10) 55%, transparent 100%)",
          }}
          animate={{ x: ["-50vw", "100vw"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.div
          className={`absolute inset-y-0 left-0 w-px ${isMap ? "bg-white/40" : "bg-foreground/25"}`}
          animate={{ x: ["0vw", "100vw"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>

      {/* top progress line spanning the full width */}
      <div className={`relative h-px w-full ${isMap ? "bg-white/10" : "bg-foreground/10"}`}>
        <motion.div
          className={`absolute inset-y-0 left-0 w-[28%] ${isMap ? "bg-white" : "bg-foreground"}`}
          animate={{ x: ["-100%", "360%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>

      <div className="relative flex flex-1 items-center px-6">
        <motion.span
          className="text-[16vw] font-semibold leading-none tracking-[0.012em] md:text-[8vw]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          IIS
        </motion.span>
      </div>

      <div className="relative flex items-end justify-between px-6 pb-6 text-[13px] tracking-[0.012em] opacity-50">
        <span>{label ?? "Loading"}</span>
        {detail ? <span className="opacity-70">{detail}</span> : null}
      </div>
    </main>
  );
};

export default RouteLoader;
