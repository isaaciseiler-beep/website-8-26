import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { preloadImage } from "@/lib/imagePreload";
import { MOTION_DURATION, MOTION_EASE_ENTER } from "@/lib/motion";

const EASE = MOTION_EASE_ENTER;

interface PhotoPreviewProps {
  images: string[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const PhotoPreview = ({ images, currentIndex, onClose, onNavigate }: PhotoPreviewProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (currentIndex === null) return;
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, images.length, onClose, onNavigate]);

  useEffect(() => {
    if (currentIndex === null) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, handleKeyDown]);

  useEffect(() => {
    if (currentIndex === null) return;

    [images[currentIndex - 1], images[currentIndex + 1]]
      .filter((src): src is string => Boolean(src))
      .forEach((src) => {
        void preloadImage(src, { decode: false, fetchPriority: "low" });
      });
  }, [currentIndex, images]);

  const progress = currentIndex !== null ? (currentIndex + 1) / images.length : 0;

  return (
    <AnimatePresence>
      {currentIndex !== null && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast, ease: EASE }}
        >
          <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }} />

          <button onClick={onClose} className="absolute top-6 right-6 z-10 text-white/20 hover:text-white/50 transition-colors duration-300">
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-24 h-[2px] bg-white/10 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-white/40"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: MOTION_DURATION.fast, ease: EASE }}
            />
          </div>

          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt=""
            loading="eager"
            decoding="async"
            fetchpriority="high"
            className="site-corner relative z-10 max-w-[90vw] max-h-[85vh] object-contain"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: MOTION_DURATION.base, ease: EASE }}
          />

          <AnimatePresence>
            {currentIndex > 0 && (
              <motion.button
                key="prev"
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 text-white/20 hover:text-white/50 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onNavigate(currentIndex - 1)}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {currentIndex < images.length - 1 && (
              <motion.button
                key="next"
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 text-white/20 hover:text-white/50 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onNavigate(currentIndex + 1)}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoPreview;
