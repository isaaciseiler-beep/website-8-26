import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import SearchTrigger from "@/components/SearchOverlay";
import { useTheme } from "@/components/ThemeProvider";

const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DARK_SURFACE_LUMINANCE = 0.5;
const INK_SAMPLE_INTERVAL_MS = 96;

interface SiteHeaderProps {
  open: boolean;
  onToggle: () => void;
  searchOpen?: boolean;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
}

const parseRgb = (value: string) => {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;

  const [r, g, b, a = "1"] = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if ([r, g, b, a].some((channel) => Number.isNaN(channel))) return null;
  if (a === 0) return null;
  return { r, g, b };
};

const imageSampleCanvas = document.createElement("canvas");
imageSampleCanvas.width = 1;
imageSampleCanvas.height = 1;

const parseObjectPositionPart = (part: string, axis: "x" | "y") => {
  const normalized = part.trim().toLowerCase();
  if (normalized.endsWith("%")) return Number.parseFloat(normalized) / 100;
  if (normalized === "left" || normalized === "top") return 0;
  if (normalized === "right" || normalized === "bottom") return 1;
  if (normalized === "center") return 0.5;
  if (axis === "x" && normalized === "top") return 0.5;
  if (axis === "x" && normalized === "bottom") return 0.5;
  if (axis === "y" && normalized === "left") return 0.5;
  if (axis === "y" && normalized === "right") return 0.5;
  return 0.5;
};

const objectPositionFor = (value: string) => {
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const part = parts[0];
    if (part === "left" || part === "right") return { x: parseObjectPositionPart(part, "x"), y: 0.5 };
    if (part === "top" || part === "bottom") return { x: 0.5, y: parseObjectPositionPart(part, "y") };
    const position = parseObjectPositionPart(part, "x");
    return { x: position, y: 0.5 };
  }

  return {
    x: parseObjectPositionPart(parts[0] ?? "50%", "x"),
    y: parseObjectPositionPart(parts[1] ?? "50%", "y"),
  };
};

const sampleImageAtPoint = (image: HTMLImageElement, x: number, y: number) => {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return null;

  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const style = window.getComputedStyle(image);
  const objectFit = style.objectFit || "fill";
  const objectPosition = objectPositionFor(style.objectPosition || "50% 50%");

  let scaleX = rect.width / image.naturalWidth;
  let scaleY = rect.height / image.naturalHeight;
  let renderedWidth = rect.width;
  let renderedHeight = rect.height;

  if (objectFit === "cover" || objectFit === "contain" || objectFit === "scale-down") {
    const scale =
      objectFit === "cover"
        ? Math.max(scaleX, scaleY)
        : Math.min(scaleX, scaleY);
    scaleX = scale;
    scaleY = scale;
    renderedWidth = image.naturalWidth * scale;
    renderedHeight = image.naturalHeight * scale;
  }

  const offsetX = (rect.width - renderedWidth) * objectPosition.x;
  const offsetY = (rect.height - renderedHeight) * objectPosition.y;
  const sourceX = (x - rect.left - offsetX) / scaleX;
  const sourceY = (y - rect.top - offsetY) / scaleY;

  if (sourceX < 0 || sourceY < 0 || sourceX >= image.naturalWidth || sourceY >= image.naturalHeight) return null;

  try {
    const context = imageSampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.clearRect(0, 0, 1, 1);
    context.drawImage(image, sourceX, sourceY, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    if (a === 0) return null;
    return { r, g, b };
  } catch {
    return null;
  }
};

const luminanceFor = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const backgroundAtPoint = (x: number, y: number, header: HTMLElement | null) => {
  const elements = document.elementsFromPoint(x, y);

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    if (header?.contains(element)) continue;

    if (element instanceof HTMLImageElement) {
      const sampled = sampleImageAtPoint(element, x, y);
      if (sampled) return sampled;
    }

    let current: HTMLElement | null = element;
    while (current) {
      if (current instanceof HTMLImageElement) {
        const sampled = sampleImageAtPoint(current, x, y);
        if (sampled) return sampled;
      }

      const color = parseRgb(window.getComputedStyle(current).backgroundColor);
      if (color) return color;
      current = current.parentElement;
    }
  }

  return parseRgb(window.getComputedStyle(document.body).backgroundColor) ?? { r: 0, g: 0, b: 0 };
};

const SiteHeader = ({ open, onToggle, searchOpen, onSearchOpen, onSearchClose }: SiteHeaderProps) => {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerInk, setHeaderInk] = useState("rgb(255 255 255)");
  const [searchInk, setSearchInk] = useState("rgb(255 255 255)");
  const { theme } = useTheme();

  useEffect(() => {
    let frame = 0;
    let throttleTimer: number | undefined;
    let lastSampleAt = 0;
    const timers: number[] = [];

    const inkForRect = (rect: DOMRect, header: HTMLElement) => {
      const samples = [
        backgroundAtPoint(rect.left + rect.width * 0.25, rect.top + rect.height * 0.35, header),
        backgroundAtPoint(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, header),
        backgroundAtPoint(rect.left + rect.width * 0.75, rect.top + rect.height * 0.65, header),
      ];
      const darkestLuminance = Math.min(...samples.map(luminanceFor));
      const averageLuminance =
        samples.reduce((total, color) => total + luminanceFor(color), 0) / samples.length;
      const shouldUseWhite = darkestLuminance < DARK_SURFACE_LUMINANCE || averageLuminance < 0.56;
      return shouldUseWhite ? "rgb(255 255 255)" : "rgb(12 12 10)";
    };

    const updateInk = () => {
      frame = 0;
      lastSampleAt = performance.now();
      const header = headerRef.current;
      if (!header) return;

      const nextHeaderInk = inkForRect(header.getBoundingClientRect(), header);
      setHeaderInk((current) => (current === nextHeaderInk ? current : nextHeaderInk));

      const searchControl = document.querySelector<HTMLElement>(
        ".site-header-search, button[aria-label='Search']",
      );
      const nextSearchInk = searchControl
        ? inkForRect(searchControl.getBoundingClientRect(), header)
        : inkForRect(new DOMRect(window.innerWidth - 49, 16, 25, 25), header);

      setSearchInk((current) => (current === nextSearchInk ? current : nextSearchInk));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateInk);
    };

    const scheduleUpdate = () => {
      const wait = Math.max(0, INK_SAMPLE_INTERVAL_MS - (performance.now() - lastSampleAt));
      if (wait > 0) {
        if (throttleTimer) return;
        throttleTimer = window.setTimeout(() => {
          throttleTimer = undefined;
          requestUpdate();
        }, wait);
        return;
      }

      requestUpdate();
    };

    updateInk();
    scheduleUpdate();
    [80, 220, 520, 1000].forEach((delay) => {
      timers.push(window.setTimeout(scheduleUpdate, delay));
    });

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate, true);
    document.addEventListener("animationend", scheduleUpdate, true);
    document.addEventListener("transitionend", scheduleUpdate, true);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (throttleTimer) window.clearTimeout(throttleTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate, true);
      document.removeEventListener("animationend", scheduleUpdate, true);
      document.removeEventListener("transitionend", scheduleUpdate, true);
    };
  }, [theme]);

  return (
    <div
      ref={headerRef}
      className="site-header-xray fixed left-0 top-0 z-[60] flex items-center gap-1 px-6 py-4"
      style={{ color: headerInk }}
    >
      <Link to="/" state={open ? { sidebarOpen: true } : undefined} className="contents">
        <Logo />
      </Link>
      <motion.button
        onClick={onToggle}
        className="site-nav-toggle-xray flex h-5 w-5 items-center justify-center transition-opacity duration-200 hover:opacity-70"
        aria-label="Toggle menu"
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.3, ease: EASE_TEXT }}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </motion.button>
      <SearchTrigger
        style={{ color: searchInk }}
        open={searchOpen}
        onOpen={onSearchOpen}
        onClose={onSearchClose}
      />
    </div>
  );
};

export default SiteHeader;
