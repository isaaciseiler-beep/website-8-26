import { motionReduced } from "@/hooks/useMotionPreference";
export const HEADER_SCROLL_OFFSET = 56;

const anchorForSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return null;

  if (id === "isaac-ai") {
    return target.querySelector("section") ?? target;
  }

  return target;
};

export const scrollToPageSection = (id: string) => {
  const scrollToAnchor = () => {
    const anchor = anchorForSection(id);
    if (!anchor) return null;

    const top = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - HEADER_SCROLL_OFFSET);
    window.scrollTo({ top, behavior: motionReduced() ? "instant" : "smooth" });
    return top;
  };

  const firstTop = scrollToAnchor();

  if (id !== "isaac-ai" || firstTop === null) return;

  window.setTimeout(() => {
    const anchor = anchorForSection(id);
    if (!anchor) return;

    const refinedTop = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - HEADER_SCROLL_OFFSET);
    if (Math.abs(refinedTop - window.scrollY) > 18) {
      window.scrollTo({ top: refinedTop, behavior: motionReduced() ? "instant" : "smooth" });
    }
  }, 420);
};
