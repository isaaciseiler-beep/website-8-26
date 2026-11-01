import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
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
  const opener=useRef<HTMLElement|null>(null);
  const reduceMotion=useReducedMotion();
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (currentIndex === null) return;
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, images.length, onNavigate]);

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
    <Dialog.Root open={currentIndex!==null} onOpenChange={open=>{if(!open)onClose();}}>
    <AnimatePresence>
      {currentIndex !== null && (
        <Dialog.Portal forceMount><Dialog.Content forceMount asChild aria-describedby={undefined}
          onOpenAutoFocus={()=>{opener.current=document.activeElement as HTMLElement;}}
          onCloseAutoFocus={event=>{event.preventDefault();opener.current?.focus({preventScroll:true});}}>
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion?0:MOTION_DURATION.fast, ease: EASE }}
        >
          <Dialog.Title className="sr-only">Photograph {currentIndex+1} of {images.length}</Dialog.Title>
          <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }} />

          <button aria-label="Close photograph" onClick={onClose} className="absolute top-6 right-6 z-10 text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors duration-300">
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-24 h-[2px] bg-white/10 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-white/40"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: reduceMotion?0:MOTION_DURATION.fast, ease: EASE }}
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
            initial={{ opacity: 0, scale: reduceMotion?1:0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion?1:0.99 }}
            transition={{ duration: reduceMotion?0:MOTION_DURATION.base, ease: EASE }}
          />

          <AnimatePresence>
            {currentIndex > 0 && (
              <motion.button
                key="prev"
                aria-label="Previous photograph"
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion?0:0.2 }}
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
                aria-label="Next photograph"
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion?0:0.2 }}
                onClick={() => onNavigate(currentIndex + 1)}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
        </Dialog.Content></Dialog.Portal>
      )}
    </AnimatePresence>
    </Dialog.Root>
  );
};

export default PhotoPreview;
