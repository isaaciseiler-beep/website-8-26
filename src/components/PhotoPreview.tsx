import MotionSurface from "@/components/MotionSurface";
import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/** The outgoing photograph stays visible until the latest requested image decodes. */
function DecodedPhoto({ src, reduced }: { src: string; reduced: boolean }) {
  const [displayed, setDisplayed] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const image = new Image();
    setFailed(false);
    image.decoding = 'async';
    image.onload = async () => {
      try { await image.decode(); } catch { /* Loaded images can still be usable after decode rejects. */ }
      if (active) setDisplayed(src);
    };
    image.onerror = () => { if (active) setFailed(true); };
    image.src = src;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [src]);
  return <div className="photo-preview-stage" aria-busy={!failed && displayed !== src}>
    <AnimatePresence initial={false}>
      {displayed && <motion.img key={displayed} src={displayed} alt="" data-motion-image="true"
        className="site-corner photo-preview-image" initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: EASE }} />}
    </AnimatePresence>
    {failed && <p role="status" className="photo-preview-error">This photograph could not load. Try another photograph.</p>}
  </div>;
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
        <MotionSurface
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion?0:MOTION_DURATION.fast, ease: EASE }}
        >
          <Dialog.Title className="sr-only">Photograph {currentIndex+1} of {images.length}</Dialog.Title>
          <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }} />

          <button aria-label="Close photograph" onClick={onClose} className="photo-preview-close">
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

          <DecodedPhoto src={images[currentIndex]} reduced={reduceMotion} />

          <AnimatePresence>
            {currentIndex > 0 && (
              <motion.button
                key="prev"
                aria-label="Previous photograph"
                className="photo-preview-nav photo-preview-nav--previous"
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
                className="photo-preview-nav photo-preview-nav--next"
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
        </MotionSurface>
        </Dialog.Content></Dialog.Portal>
      )}
    </AnimatePresence>
    </Dialog.Root>
  );
};

export default PhotoPreview;
