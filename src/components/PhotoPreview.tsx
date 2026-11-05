import MotionSurface from "@/components/MotionSurface";
import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { preloadImage } from "@/lib/imagePreload";
import { photoSwipeAction, type SwipeAction } from "@/lib/photoMapLayout";
import { MOTION_DURATION, MOTION_EASE_ENTER } from "@/lib/motion";

const EASE = MOTION_EASE_ENTER;

interface PhotoPreviewProps {
  images: string[];
  albumLabel?: string;
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/** The outgoing photograph stays visible until the latest requested image decodes. */
function DecodedPhoto({ src, reduced, alt, offset, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: { src: string; reduced: boolean; alt:string; offset:{x:number;y:number}; dragging:boolean; onPointerDown:(event:ReactPointerEvent<HTMLDivElement>)=>void; onPointerMove:(event:ReactPointerEvent<HTMLDivElement>)=>void; onPointerUp:(event:ReactPointerEvent<HTMLDivElement>)=>void; onPointerCancel:(event:ReactPointerEvent<HTMLDivElement>)=>void }) {
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
  return <div className="photo-preview-stage" aria-busy={!failed && displayed !== src}
    style={{transform:offset.x||offset.y?`translate3d(${offset.x}px, ${offset.y}px, 0)`:undefined, transition:dragging||reduced?'none':'transform 180ms cubic-bezier(0.23, 1, 0.32, 1)'}}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
    <AnimatePresence initial={false}>
      {displayed && <motion.img key={displayed} src={displayed} alt={alt} data-motion-image="true"
        className="site-corner photo-preview-image" initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: EASE }} />}
    </AnimatePresence>
    {failed && <p role="status" className="photo-preview-error">This photograph could not load. Try another photograph.</p>}
  </div>;
}

const PhotoPreview = ({ images, albumLabel="Album", currentIndex, onClose, onNavigate }: PhotoPreviewProps) => {
  const opener=useRef<HTMLElement|null>(null);
  const reduceMotion=useReducedMotion();
  const drag=useRef<{id:number;x:number;y:number;t:number;axis:'x'|'y'|null}|null>(null);
  const [offset,setOffset]=useState({x:0,y:0});
  const [dragging,setDragging]=useState(false);
  const applySwipe=(action:SwipeAction)=>{
    if(currentIndex===null||!action)return;
    if(action==='next')onNavigate(currentIndex+1);
    else if(action==='previous')onNavigate(currentIndex-1);
    else onClose();
  };
  const endDrag=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const active=drag.current;
    drag.current=null;
    setDragging(false);
    if(!active||currentIndex===null||active.id!==event.pointerId){setOffset({x:0,y:0});return;}
    applySwipe(photoSwipeAction({
      dx:event.clientX-active.x,
      dy:event.clientY-active.y,
      elapsedMs:performance.now()-active.t,
      axis:active.axis,
      index:currentIndex,
      count:images.length,
    }));
    setOffset({x:0,y:0});
  };
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
        <Dialog.Portal forceMount><Dialog.Content forceMount asChild aria-label={`${albumLabel}, photograph ${(currentIndex??0)+1} of ${images.length}`} aria-describedby={undefined}
          onOpenAutoFocus={()=>{opener.current=document.activeElement as HTMLElement;}}
          onCloseAutoFocus={event=>{event.preventDefault();opener.current?.focus({preventScroll:true});}}>
        <MotionSurface
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion?0:MOTION_DURATION.fast, ease: EASE }}
        >
          <Dialog.Title className="sr-only">{albumLabel} · Photograph {currentIndex+1} of {images.length}</Dialog.Title>
          <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }} />

          <button aria-label="Close photograph" onClick={onClose} className="photo-preview-close">
            <X className="w-4 h-4" />
          </button>

          <div className="photo-preview-counter" aria-hidden="true">{currentIndex + 1} / {images.length}</div>
          <div className="photo-preview-progress absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-24 h-[2px] bg-white/10 overflow-hidden rounded-full" aria-hidden="true">
            <motion.div
              className="h-full bg-white/40"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: reduceMotion?0:MOTION_DURATION.fast, ease: EASE }}
            />
          </div>

          <DecodedPhoto src={images[currentIndex]} reduced={reduceMotion} alt={`${albumLabel}, photograph ${currentIndex+1} of ${images.length}`} offset={offset} dragging={dragging}
            onPointerDown={event=>{
              if(event.button!==0)return;
              drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,t:performance.now(),axis:null};
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event=>{
              const active=drag.current;
              if(!active||active.id!==event.pointerId)return;
              const dx=event.clientX-active.x;
              const dy=event.clientY-active.y;
              if(!active.axis&&Math.hypot(dx,dy)>8)active.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
              if(active.axis==='x')setOffset({x:dx,y:0});
              else if(active.axis==='y'&&dy>0)setOffset({x:0,y:dy});
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag} />

          <button aria-label="Previous photograph" disabled={currentIndex===0} className="photo-preview-nav photo-preview-nav--previous" onClick={()=>onNavigate(currentIndex-1)}><ChevronLeft className="w-5 h-5" strokeWidth={1.5}/></button>
          <button aria-label="Next photograph" disabled={currentIndex===images.length-1} className="photo-preview-nav photo-preview-nav--next" onClick={()=>onNavigate(currentIndex+1)}><ChevronRight className="w-5 h-5" strokeWidth={1.5}/></button>
        </MotionSurface>
        </Dialog.Content></Dialog.Portal>
      )}
    </AnimatePresence>
    </Dialog.Root>
  );
};

export default PhotoPreview;
