import { useEffect } from 'react';

/** Observe newly mounted sections once; never rescan the document on each text update. */
export const useScrollReveal = () => {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const waiting = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        waiting.delete(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    const bind = (element: Element) => {
      if (seen.has(element)) return;
      seen.add(element);
      element.classList.add('reveal');
      if (media.matches) element.classList.add('is-revealed');
      else { waiting.add(element); observer.observe(element); }
    };
    const scan = (node: Node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('[data-reveal]')) bind(node);
      node.querySelectorAll('[data-reveal]').forEach(bind);
    };
    const preferenceChanged = () => {
      if (!media.matches) return;
      waiting.forEach(element => element.classList.add('is-revealed'));
      waiting.clear();
      observer.disconnect();
    };
    scan(document.getElementById('root') ?? document.body);
    const mutation = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(scan)));
    mutation.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
    media.addEventListener('change', preferenceChanged);
    return () => { mutation.disconnect(); observer.disconnect(); media.removeEventListener('change', preferenceChanged); };
  }, []);
};
