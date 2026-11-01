import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { isSiteOverlayOpen, type SiteOverlay } from '@/lib/siteOverlay';

const focusable = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]';

/** Mobile panels own focus; desktop panels retain ordinary page navigation. */
export function useOverlayFocus(open: boolean, kind: SiteOverlay, onClose: () => void) {
  const mobile = useIsMobile();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body && !active.closest(`[data-site-overlay="${kind}"]`) ? active : null;
    const url = location.pathname + location.search;
    const regions = () => [...document.querySelectorAll<HTMLElement>(`[data-site-overlay="${kind}"]${kind === 'sidebar' ? ',[data-overlay-trigger="sidebar"]' : ''}`)];
    const candidates = () => regions().flatMap(region => [region, ...region.querySelectorAll<HTMLElement>(focusable)])
      .filter(node => node.matches(focusable) && node.tabIndex >= 0 && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && !node.closest('[inert]'));
    const initial = () => document.querySelector<HTMLElement>(kind === 'search' ? '[data-site-overlay="search"] input' : '[data-site-overlay="sidebar"] a,[data-site-overlay="sidebar"] button');
    const covered = mobile ? [...document.querySelectorAll<HTMLElement>(`#root main,.photo-location-ticker,.site-home-link,[data-overlay-trigger="${kind === 'sidebar' ? 'search' : 'sidebar'}"]`)] : [];
    const previous = covered.map(node => [node, node.hasAttribute('inert')] as const);
    covered.forEach(node => node.setAttribute('inert', ''));
    const frame = requestAnimationFrame(() => initial()?.focus({ preventScroll: true }));
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); close.current(); return;
      }
      if (!mobile || event.key !== 'Tab') return;
      const items = candidates();
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (index === -1 || event.shiftKey && index === 0 || !event.shiftKey && index === items.length - 1) {
        event.preventDefault(); (event.shiftKey ? items.at(-1) : items[0])?.focus({ preventScroll: true });
      }
    };
    const focusin = (event: FocusEvent) => {
      if (mobile && !regions().some(region => region.contains(event.target as Node))) initial()?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', focusin);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', focusin);
      previous.forEach(([node, inert]) => { if (!inert) node.removeAttribute('inert'); });
      // Search replaces its trigger during exit. Wait for the replacement, but
      // never steal focus from a destination or a newly opened panel.
      let timeout = 0;
      const stop = () => { observer?.disconnect(); window.clearTimeout(timeout); };
      const restore = () => {
        if (location.pathname + location.search !== url || isSiteOverlayOpen()) { stop(); return; }
        const target = opener?.isConnected && opener.matches(focusable) && !opener.closest('[inert]') ? opener : document.querySelector<HTMLElement>(`[data-overlay-trigger="${kind}"]`);
        if (target) { target.focus({ preventScroll: true }); stop(); }
      };
      const observer = new MutationObserver(restore);
      observer.observe(document.body, { childList: true, subtree: true });
      timeout = window.setTimeout(stop, 1500);
      requestAnimationFrame(restore);
    };
  }, [open, kind, mobile]);
}
