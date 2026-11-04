import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';

/** An in-flow choice disclosure: no platform popup or second floating surface. */
export function PortfolioChoice({ label, value, choices, onChange }: {
  label: string;
  value: string;
  choices: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const focusAfterClose = useRef<HTMLElement | null>(null);
  const reduced = useMotionPreference();
  const restoreLeavingFocus = useCallback(() => {
    if (trigger.current?.getAttribute('aria-expanded') !== 'false') return;
    let next = focusAfterClose.current;
    if (!next?.isConnected) return;
    const current = document.activeElement;
    if (current !== next) {
      const region = next.closest('.home-genui-stage');
      if (!(current instanceof HTMLElement) || !region?.contains(current)) return;
      next = current;
      focusAfterClose.current = next;
    }
    const rect = next.getBoundingClientRect();
    const style = getComputedStyle(next);
    const topMargin = parseFloat(style.scrollMarginTop) || 0;
    const bottomMargin = parseFloat(style.scrollMarginBottom) || 0;
    if (rect.top < topMargin || rect.bottom > window.innerHeight - bottomMargin) next.scrollIntoView({ block: 'nearest' });
    if ((reveal.current?.getBoundingClientRect().height ?? 0) <= .5) focusAfterClose.current = null;
  }, []);
  useLayoutEffect(() => {
    const node = reveal.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(restoreLeavingFocus);
    observer.observe(node);
    return () => observer.disconnect();
  }, [restoreLeavingFocus]);
  const selected = choices.findIndex(choice => choice.value === value);
  const focusChoice = (index: number) => requestAnimationFrame(() => options.current[index]?.focus());
  useLayoutEffect(() => {
    const button = trigger.current;
    if (button !== document.activeElement || !button) return;
    const rect = button.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) button.scrollIntoView({ block: 'nearest' });
  }, [value]);
  return <div className="portfolio-choice" onBlur={event => {
    if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
      focusAfterClose.current = event.relatedTarget instanceof HTMLElement && event.relatedTarget !== document.body ? event.relatedTarget : null;
      setOpen(false);
    }
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); focusAfterClose.current = null; setOpen(false); trigger.current?.focus();
    }
  }}>
    <button ref={trigger} type="button" className="portfolio-choice-trigger" aria-label={label} aria-describedby={`${id}-value`}
      aria-expanded={open} aria-controls={id} onClick={() => { focusAfterClose.current = null; setOpen(!open); }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); focusAfterClose.current = null; setOpen(true); focusChoice(selected < 0 ? 0 : selected);
        }
      }}>
      <span id={`${id}-value`}>{choices[selected]?.label ?? label}</span><ChevronDown size={16} aria-hidden="true"/>
    </button>
    <motion.div ref={reveal} id={id} className="portfolio-choice-reveal" initial={false} aria-hidden={!open}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: MOTION_EASE_ENTER }} onAnimationComplete={restoreLeavingFocus}>
      <div role="group" aria-label={label} className="portfolio-choice-options">
        {choices.map((choice, index) => <button key={choice.value} type="button"
          ref={node => { options.current[index] = node; }} tabIndex={open ? 0 : -1}
          aria-pressed={value === choice.value} onClick={() => {
            focusAfterClose.current = null; setOpen(false); trigger.current?.focus(); onChange(choice.value);
          }} onKeyDown={event => {
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 :
              event.key === 'ArrowDown' ? (index + 1) % choices.length :
              event.key === 'ArrowUp' ? (index + choices.length - 1) % choices.length : null;
            if (next !== null) { event.preventDefault(); focusChoice(next); }
          }}>
          <span>{choice.label}</span>{value === choice.value && <Check size={16} aria-hidden="true"/>}
        </button>)}
      </div>
    </motion.div>
  </div>;
}
