import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { inspirationItems, type InspirationItem } from "@/lib/inspirationItems";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ITEM_REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Approximate board width/height ratio (viewport-dependent; fine for initial layout)
const BOARD_RATIO = 1.7;

// Mulberry32 deterministic PRNG so layout is stable across loads.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLayout(items: InspirationItem[]): InspirationItem[] {
  const rand = mulberry32(20240511);
  const cols = 4;
  const shuffled = [...items]
    .map((it) => ({ it, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.it);
  const rows = Math.ceil(shuffled.length / cols);
  const slotW = 100 / cols;
  const slotH = 100 / rows;
  return shuffled.map((it, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = c * slotW + slotW / 2 + (rand() - 0.5) * slotW * 0.35;
    const cy = r * slotH + slotH / 2 + (rand() - 0.5) * slotH * 0.3;
    const hPercent = (it.w / it.aspect) * BOARD_RATIO;
    const x = cx - it.w / 2;
    const y = cy - hPercent / 2;
    return {
      ...it,
      x: Math.max(0, Math.min(100 - it.w, x)),
      y: Math.max(0, Math.min(100 - hPercent, y)),
      rotate: (rand() - 0.5) * 10,
    };
  });
}

const typeLabel: Record<string, string> = {
  photo: "PHOTO",
  website: "WEBSITE",
  place: "PLACE",
  quote: "QUOTE",
  video: "VIDEO",
  book: "BOOK",
  music: "MUSIC",
  podcast: "PODCAST",
};

const OVERHANG = 0; // keep every card fully on the board from load through drag

const ROTATE_CURSOR_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path d="M17 8.5a5.5 5.5 0 1 0 1.5 4.5" fill="none" stroke="black" stroke-width="2.4" stroke-linecap="round"/><polyline points="18 5 18 9 14 9" fill="none" stroke="black" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
);
const ROTATE_CURSOR = `url("data:image/svg+xml;utf8,${ROTATE_CURSOR_SVG}") 7 7, alias`;

const glitchRevealInitial = {
  opacity: 0,
  x: 0,
  y: 4,
  scale: 1,
  filter: "blur(1.5px)",
};

const glitchRevealVisible = () => ({
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  filter: "blur(0px)",
});

const glitchRevealTransition = (index: number) => ({
  delay: Math.min(index * 0.055, 0.62),
  duration: 0.28,
  ease: ITEM_REVEAL_EASE,
});

const carouselRevealInitial = {
  opacity: 0,
  y: 6,
};

const carouselRevealVisible = {
  opacity: 1,
  y: 0,
};

const carouselRevealTransition = (index: number) => ({
  delay: Math.min(index * 0.035, 0.32),
  duration: 0.24,
  ease: ITEM_REVEAL_EASE,
});

const InspirationBoard = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(() => buildLayout(inspirationItems));
  const [dragging, setDragging] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [mobileColorReady, setMobileColorReady] = useState(false);
  const mobileCarouselInView = useInView(carouselRef, { amount: 0.58, margin: "-72px 0px -120px 0px" });

  const checkCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);

    const carouselCenter = el.getBoundingClientRect().left + el.clientWidth / 2;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-inspiration-carousel-card]"));
    const nearest = cards.reduce(
      (closest, card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - carouselCenter);
        return distance < closest.distance ? { index, distance } : closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );
    setActiveCarouselIndex(nearest.index);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = carouselRef.current;
    if (!el) return;
    checkCarouselScroll();
    el.addEventListener("scroll", checkCarouselScroll, { passive: true });
    window.addEventListener("resize", checkCarouselScroll);
    return () => {
      el.removeEventListener("scroll", checkCarouselScroll);
      window.removeEventListener("resize", checkCarouselScroll);
    };
  }, [isMobile, checkCarouselScroll]);

  useEffect(() => {
    if (!isMobile || !mobileCarouselInView) {
      setMobileColorReady(false);
      return;
    }

    const timer = window.setTimeout(() => setMobileColorReady(true), 360);
    return () => window.clearTimeout(timer);
  }, [isMobile, mobileCarouselInView]);

  const scrollCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const revealProgress = useSpring(useTransform(scrollYProgress, [0.0, 0.28], [0, 1]), {
    stiffness: 140,
    damping: 28,
    mass: 0.8,
  });
  const boardY = useTransform(revealProgress, [0, 1], [0, 0]);
  const boardOpacity = useTransform(revealProgress, [0, 1], [0, 1]);
  const dotsOpacity = useTransform(revealProgress, [0, 0.55, 1], [0, 0.45, 1]);
  const dotsY = useTransform(revealProgress, [0, 1], [0, 0]);

  const clampPosition = useCallback((x: number, y: number, w: number, aspect: number) => {
    if (!boardRef.current) return { x, y };
    const rect = boardRef.current.getBoundingClientRect();
    const h = (((w / 100) * rect.width) / aspect / rect.height) * 100;
    const minX = -(w * OVERHANG);
    const maxX = 100 - w * (1 - OVERHANG);
    const minY = -(h * OVERHANG);
    const maxY = 100 - h * (1 - OVERHANG);
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, []);

  useEffect(() => {
    if (isMobile || !boardRef.current) return;
    const board = boardRef.current;
    const clampAll = () => {
      setItems(prev => {
        let changed = false;
        const next = prev.map(item => {
          const clamped = clampPosition(item.x, item.y, item.w, item.aspect);
          if (clamped.x !== item.x || clamped.y !== item.y) changed = true;
          return changed ? { ...item, x: clamped.x, y: clamped.y } : item;
        });
        return changed ? next : prev;
      });
    };
    clampAll();
    const resizeObserver = new ResizeObserver(clampAll);
    resizeObserver.observe(board);
    window.addEventListener("resize", clampAll);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", clampAll);
    };
  }, [isMobile, clampPosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: number) => {
    e.preventDefault();
    const item = items.find(i => i.id === id);
    if (!item || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - (item.x / 100) * rect.width,
      y: e.clientY - rect.top - (item.y / 100) * rect.height,
    };
    didDrag.current = false;
    setDragging(id);
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.push(moved);
      return copy;
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [items]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging === null || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100;
    didDrag.current = true;
    setItems(prev => prev.map(item => {
      if (item.id !== dragging) return item;
        const clamped = clampPosition(rawX, rawY, item.w, item.aspect);
      return { ...item, x: clamped.x, y: clamped.y };
    }));
  }, [dragging, clampPosition]);

  const handlePointerUp = useCallback((id: number) => {
    setDragging(null);
    if (!didDrag.current) {
      const item = items.find(i => i.id === id);
      if (item?.url) window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }, [items]);

  const updateRotation = useCallback((id: number, rotate: number) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, rotate } : it)));
  }, []);

  const renderCard = (item: InspirationItem) => {
    if (item.imageUrl) {
      return (
        <div className="group relative w-full h-full overflow-hidden flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.title}
            className={`w-full h-full ${item.transparent ? "object-contain" : "object-cover"} grayscale group-hover:grayscale-0 transition-all duration-500`}
            draggable={false}
            loading={isMobile ? "lazy" : "eager"}
            decoding="async"
            fetchpriority="low"
          />
        </div>
      );
    }

    if (item.type === "quote") {
      return (
        <div className="flex h-full flex-col justify-between p-4" style={{ background: "hsl(var(--foreground) / 0.02)" }}>
          <span className="text-foreground/15 leading-none" style={{ fontSize: 32, fontFamily: "Georgia, serif" }}>"</span>
          <p className="italic text-foreground/75 leading-snug font-light text-[13px]">{item.content}</p>
          <p className="mono-text text-foreground/40 mt-2" style={{ fontSize: 9 }}>— {item.title}</p>
        </div>
      );
    }

    if (item.type === "place") {
      return (
        <div className="flex h-full flex-col justify-between p-4" style={{ background: "linear-gradient(135deg, hsl(var(--foreground) / 0.04) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-1.5">
            <span className="text-foreground/40" style={{ fontSize: 11 }}>◉</span>
            <p className="mono-text text-foreground/40" style={{ fontSize: 9 }}>{typeLabel[item.type]}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground tracking-tight text-base leading-tight">{item.title}</p>
            <p className="mt-1.5 text-foreground/55 leading-snug text-[12px]">{item.content}</p>
          </div>
        </div>
      );
    }

    if (item.type === "video") {
      return (
        <div className="flex h-full flex-col justify-between p-4" style={{ background: "hsl(var(--foreground) / 0.03)" }}>
          <p className="mono-text text-foreground/40" style={{ fontSize: 9 }}>{typeLabel[item.type]}</p>
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-full bg-foreground/10 w-10 h-10">
              <span className="text-foreground/70 ml-0.5" style={{ fontSize: 12 }}>▶</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground tracking-tight text-sm leading-tight truncate">{item.title}</p>
              <p className="mt-0.5 text-foreground/50 text-[12px] leading-snug">{item.content}</p>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === "book") {
      return (
        <div className="flex h-full p-0" style={{ background: "hsl(var(--foreground) / 0.03)" }}>
          <div className="w-[28%] shrink-0 relative" style={{ background: "linear-gradient(135deg, hsl(var(--foreground) / 0.18), hsl(var(--foreground) / 0.06))", borderRight: "1px solid hsl(var(--foreground) / 0.15)" }}>
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <span className="mono-text text-foreground/35" style={{ fontSize: 8 }}>BOOK</span>
            </div>
            <div className="absolute left-1.5 top-2 bottom-6 w-px bg-foreground/15" />
          </div>
          <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
            <p className="mono-text text-foreground/40" style={{ fontSize: 9 }}>READING</p>
            <div>
              <p className="font-semibold text-foreground tracking-tight text-[13px] leading-tight italic">{item.title}</p>
              <p className="mt-1 text-foreground/55 leading-snug text-[11px]">{item.content}</p>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === "music") {
      return (
        <div className="flex h-full flex-col justify-between p-4" style={{ background: "linear-gradient(160deg, hsl(var(--foreground) / 0.06), transparent)" }}>
          <div className="flex items-center justify-between">
            <p className="mono-text text-foreground/40" style={{ fontSize: 9 }}>{typeLabel[item.type]}</p>
            <div className="flex items-end gap-[2px] h-3">
              <span className="w-[2px] bg-[hsl(var(--highlight))]" style={{ height: "40%" }} />
              <span className="w-[2px] bg-[hsl(var(--highlight))]" style={{ height: "100%" }} />
              <span className="w-[2px] bg-[hsl(var(--highlight))]" style={{ height: "65%" }} />
              <span className="w-[2px] bg-[hsl(var(--highlight))]" style={{ height: "85%" }} />
              <span className="w-[2px] bg-[hsl(var(--highlight))]" style={{ height: "30%" }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-full border border-foreground/30 w-10 h-10">
              <span className="text-foreground/60" style={{ fontSize: 14 }}>♪</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground tracking-tight text-sm leading-tight truncate">{item.title}</p>
              <p className="mt-0.5 text-foreground/50 text-[11px] leading-snug">{item.content}</p>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === "podcast") {
      return (
        <div className="flex h-full flex-col justify-between p-4" style={{ background: "hsl(var(--foreground) / 0.03)" }}>
          <div className="flex items-center gap-1.5">
            <span className="text-[hsl(var(--highlight))]" style={{ fontSize: 10 }}>●</span>
            <p className="mono-text text-foreground/40" style={{ fontSize: 9 }}>{typeLabel[item.type]}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground tracking-tight text-sm leading-tight">{item.title}</p>
            <p className="mt-1 text-foreground/55 leading-snug text-[12px]">{item.content}</p>
          </div>
        </div>
      );
    }

    // website / default
    return (
      <div className="flex h-full flex-col justify-between p-4 border border-foreground/10">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--highlight))]" />
          <p className="mono-text text-foreground/40" style={{ fontSize: 9 }}>{typeLabel[item.type]}</p>
          <span className="ml-auto text-foreground/30" style={{ fontSize: 11 }}>↗</span>
        </div>
        <div>
          <p className="font-semibold text-foreground tracking-tight text-sm leading-tight">{item.title}</p>
          <p className="mt-1 text-foreground/50 leading-snug text-[12px]">{item.content}</p>
        </div>
      </div>
    );
  };

  return (
    <section ref={sectionRef} className="relative" style={isMobile ? undefined : { minHeight: "120vh" }}>
      {isMobile ? (
        <div className="flex flex-col">
          <div className="px-6 pb-0 pt-0 md:pb-4">
            <SectionHeading className="mb-0">Inspiration</SectionHeading>
          </div>
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide px-6 pb-0 items-center md:pb-12"
              style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: 24 }}
            >
              {inspirationItems.map((item, i) => {
                const baseW = 240;
                const h = baseW / item.aspect;
                return (
                  <CarouselCard
                    key={item.id}
                    item={item}
                    index={i}
                    width={baseW}
                    height={h}
                    activeColor={mobileColorReady && activeCarouselIndex === i}
                    onOpen={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                    renderCard={renderCard}
                  />
                );
              })}
              <div className="flex-shrink-0 w-3" aria-hidden />
            </div>
            <AnimatePresence>
              {canScrollLeft && (
                <motion.button
                  key="ins-left"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onClick={() => scrollCarousel("left")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20"
                  style={{ color: "hsl(var(--foreground))" }}
                  whileHover={{ x: -3 }}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {canScrollRight && (
                <motion.button
                  key="ins-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onClick={() => scrollCarousel("right")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20"
                  style={{ color: "hsl(var(--foreground))" }}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
      <div className="sticky top-0 h-screen flex flex-col overflow-visible z-30">
        <div className="px-6 pb-4 pt-0">
          <SectionHeading className="mb-0">Inspiration</SectionHeading>
        </div>

        <div className="flex-1 min-h-0 px-6 pb-6 relative z-30">
          <motion.div
            ref={boardRef}
            className="relative h-full w-full"
            style={{ cursor: dragging !== null ? "grabbing" : "default", y: boardY, opacity: boardOpacity }}
            onPointerMove={handlePointerMove}
          >
            {/* Dot grid — fades in from bottom */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                opacity: dotsOpacity,
                y: dotsY,
                backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.13) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            />

            {items.map((item, i) => (
              <BoardCard
                key={item.id}
                item={item}
                index={i}
                dragging={dragging === item.id}
                zIndex={dragging === item.id ? 50 : i}
                onPointerDown={e => handlePointerDown(e, item.id)}
                onPointerUp={() => handlePointerUp(item.id)}
                onRotate={updateRotation}
                renderCard={renderCard}
              />
            ))}
          </motion.div>
        </div>
      </div>
      )}
    </section>
  );
};

export default InspirationBoard;

interface CarouselCardProps {
  item: InspirationItem;
  index: number;
  width: number;
  height: number;
  activeColor: boolean;
  onOpen: () => void;
  renderCard: (item: InspirationItem) => React.ReactNode;
}

const CarouselCard = ({ item, index, width, height, activeColor, onOpen, renderCard }: CarouselCardProps) => {
  const rotX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });
  const rotY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });
  const [cornerHover, setCornerHover] = useState(false);

  const isCorner = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    return Math.abs(nx) > 0.62 && Math.abs(ny) > 0.62;
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setCornerHover(isCorner(e));
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    rotY.set(nx * 9);
    rotX.set(-ny * 9);
  };

  const handleLeave = () => {
    rotX.set(0);
    rotY.set(0);
    setCornerHover(false);
  };

  return (
    <motion.div
      data-inspiration-carousel-card
      initial={carouselRevealInitial}
      whileInView={carouselRevealVisible}
      viewport={{ once: true, margin: "-40px", amount: 0.35 }}
      transition={carouselRevealTransition(index)}
      className="flex-shrink-0 select-none"
      style={{
        width,
        height,
        scrollSnapAlign: "start",
        cursor: cornerHover ? ROTATE_CURSOR : "pointer",
        perspective: 800,
      }}
      onClick={onOpen}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div
        className="h-full overflow-hidden"
        style={{
          rotateX: rotX,
          rotateY: rotY,
          transformStyle: "preserve-3d",
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className={`h-full w-full object-contain transition-all duration-500 ${
              activeColor ? "grayscale-0" : "grayscale"
            }`}
            draggable={false}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          />
        ) : (
          renderCard(item)
        )}
      </motion.div>
    </motion.div>
  );
};

interface BoardCardProps {
  item: InspirationItem;
  index: number;
  dragging: boolean;
  zIndex: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onRotate: (id: number, rotate: number) => void;
  renderCard: (item: InspirationItem) => React.ReactNode;
}

const BoardCard = ({ item, index, dragging, zIndex, onPointerDown, onPointerUp, onRotate, renderCard }: BoardCardProps) => {
  const rotX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });
  const rotY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18, mass: 0.6 });
  const [cornerHover, setCornerHover] = useState(false);
  const [rotating, setRotating] = useState(false);
  const rotateState = useRef<{ startAngle: number; baseRot: number; cx: number; cy: number } | null>(null);

  const isCorner = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    return Math.abs(nx) > 0.62 && Math.abs(ny) > 0.62;
  };

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isCorner(e)) {
      e.preventDefault();
      e.stopPropagation();
      const r = e.currentTarget.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      rotateState.current = { startAngle, baseRot: item.rotate, cx, cy };
      setRotating(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    onPointerDown(e);
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rotating && rotateState.current) {
      const { startAngle, baseRot, cx, cy } = rotateState.current;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      onRotate(item.id, baseRot + (angle - startAngle));
      return;
    }
    if (dragging) return;
    setCornerHover(isCorner(e));
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    // tilt: corners lift while center stays planar
    rotY.set(nx * 9);
    rotX.set(-ny * 9);
  };

  const handleUp = () => {
    if (rotating) {
      setRotating(false);
      rotateState.current = null;
      return;
    }
    onPointerUp();
  };

  const handleLeave = () => {
    rotX.set(0);
    rotY.set(0);
    setCornerHover(false);
  };

  const cursor = rotating || cornerHover ? ROTATE_CURSOR : dragging ? "grabbing" : "grab";

  return (
    <motion.div
      className="absolute select-none"
      initial={glitchRevealInitial}
      whileInView={glitchRevealVisible()}
      viewport={{ once: true, margin: "-60px", amount: 0.22 }}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.w}%`,
        aspectRatio: item.aspect,
        zIndex,
        rotate: item.rotate,
        cursor,
        perspective: 800,
      }}
      transition={glitchRevealTransition(index)}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div
        className={`h-full overflow-hidden transition-shadow duration-300 ${item.transparent ? "" : "bg-background shadow-sm hover:shadow-md"}`}
        style={{
          rotateX: rotX,
          rotateY: rotY,
          transformStyle: "preserve-3d",
          boxShadow: item.transparent
            ? undefined
            : dragging
              ? "4px 6px 20px rgba(0,0,0,0.25)"
              : "1px 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        {renderCard(item)}
      </motion.div>
    </motion.div>
  );
};
