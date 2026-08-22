import { useEffect } from "react";

/**
 * Observes every [data-reveal] element in the document (including lazily
 * mounted ones) and adds `is-revealed` when it scrolls into view.
 */
export const useScrollReveal = () => {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.06 },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (el.dataset.revealBound) return;
        el.dataset.revealBound = "1";
        if (prefersReduced) {
          el.classList.add("is-revealed");
          return;
        }
        el.classList.add("reveal");
        observer.observe(el);
      });
    };

    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutation.disconnect();
      observer.disconnect();
    };
  }, []);
};
