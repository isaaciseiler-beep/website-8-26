import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { MOTION_DURATION } from '@/lib/motion';

const releaseNode = (node: HTMLElement) => { node.inert = false;node.removeAttribute('data-disclosure-inert'); };
const releaseContent = (details: HTMLDetailsElement) => {
  for (const child of details.children) if (child instanceof HTMLElement && child.hasAttribute('data-disclosure-inert')) releaseNode(child);
};
const excludeContent = (details: HTMLDetailsElement) => {
  for (const child of details.children) if (child instanceof HTMLElement && child.tagName !== 'SUMMARY' && !child.inert) {
    child.inert = true;child.setAttribute('data-disclosure-inert', '');
  }
};
const animated = (node: HTMLElement, reduced: boolean) => !reduced && !node.hasAttribute('data-disclosure-instant') && typeof CSS !== 'undefined' && CSS.supports('interpolate-size', 'allow-keywords') && CSS.supports('selector(details::details-content)');

/** Native disclosures own their local height animation. The measured shell
 * follows those frames directly, avoiding a second tween that trails behind. */
export function useDisclosureMotion(content: RefObject<HTMLDivElement>, revision: number, reduced: boolean) {
  const [following, setFollowing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const until = useRef(0);
  const rollbacks = useRef(new Set<ReturnType<typeof setTimeout>>());
  const follow = useCallback((details: HTMLDetailsElement) => {
    const node = content.current;
    if (!node || !animated(node, reduced)) return;
    const value = getComputedStyle(details).getPropertyValue('--motion-large-duration').trim();
    const parsed = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
    const duration = Number.isFinite(parsed) && parsed >= 0 ? parsed : MOTION_DURATION.panel * 1000;
    if (!duration) return;
    // A later nested disclosure must not shorten an already active fold.
    until.current = Math.max(until.current, performance.now() + duration + 50);
    clearTimeout(timer.current);setFollowing(true);
    timer.current = setTimeout(() => { until.current = 0;setFollowing(false); }, until.current - performance.now());
  }, [content, reduced]);
  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    const pendingRollbacks = rollbacks.current;
    clearTimeout(timer.current);until.current = 0;setFollowing(false);
    node.querySelectorAll<HTMLElement>('[data-disclosure-inert]').forEach(releaseNode);
    // Restore native `open` states before opting back into visitor motion.
    node.setAttribute('data-disclosure-instant', '');
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => node.removeAttribute('data-disclosure-instant')); });
    const toggled = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement)) return;
      if (details.open) releaseContent(details);
      else if (animated(node, reduced)) {
        // Act on the actual toggle, so a prevented summary click cannot strand
        // open content. Keep closing pixels, but exclude their controls now.
        excludeContent(details);
      }
      follow(details);
    };
    node.addEventListener('toggle', toggled, true);
    return () => {
      clearTimeout(timer.current);pendingRollbacks.forEach(clearTimeout);pendingRollbacks.clear();
      cancelAnimationFrame(firstFrame);cancelAnimationFrame(secondFrame);
      node.removeEventListener('toggle', toggled, true);node.removeAttribute('data-disclosure-instant');
    };
  }, [content, revision, reduced, follow]);

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const summary = event.target instanceof Element ? event.target.closest('summary') : null;
    const details = summary?.parentElement;
    const node = content.current;
    if (!(details instanceof HTMLDetailsElement) || !node?.contains(details)) return;
    const nestedAction = event.target instanceof Element && event.target.closest('a,button,input,select,textarea');
    if (event.defaultPrevented || nestedAction) return;
    if (details.open && animated(node, reduced)) {
      // Exclude controls before a very fast Tab can beat the queued native
      // toggle event. Roll back after default action if another handler cancels.
      excludeContent(details);
      const rollback = setTimeout(() => {
        rollbacks.current.delete(rollback);
        if (details.open) releaseContent(details);
      }, 0);
      rollbacks.current.add(rollback);
    }
    follow(details);
  };
  return { following, onClickCapture };
}
