import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';
import { scrollExplorationControlIntoView } from '@/lib/explorationReadingState';

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
    scrollExplorationControlIntoView(next);
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
  const alternatives = choices.filter(choice => choice.value !== value);
  const focusChoice = (index: number) => requestAnimationFrame(() => {
    const option=options.current[index];
    if(option){option.focus({preventScroll:true});scrollExplorationControlIntoView(option);}
  });
  useLayoutEffect(() => {
    const button = trigger.current;
    if (button !== document.activeElement || !button) return;
    scrollExplorationControlIntoView(button);
  }, [value]);
  return <div className="portfolio-choice" onBlur={event => {
    if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
      focusAfterClose.current = event.relatedTarget instanceof HTMLElement && event.relatedTarget !== document.body ? event.relatedTarget : null;
      setOpen(false);
    }
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); focusAfterClose.current = null; setOpen(false); trigger.current?.focus({preventScroll:true});
    }
  }}>
    <button ref={trigger} type="button" className="portfolio-choice-trigger" aria-label={label} aria-describedby={`${id}-value`}
      aria-expanded={open} aria-controls={id} onClick={() => { focusAfterClose.current = null; setOpen(!open); }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); focusAfterClose.current = null; setOpen(true); focusChoice(event.key === 'ArrowUp' ? Math.max(0, alternatives.length - 1) : 0);
        }
      }}>
      <span id={`${id}-value`}>{choices[selected]?.label ?? label}</span><ChevronDown size={16} aria-hidden="true"/>
    </button>
    <motion.div ref={reveal} id={id} className="portfolio-choice-reveal" initial={false} aria-hidden={!open}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: MOTION_EASE_ENTER }} onAnimationComplete={restoreLeavingFocus}>
      <div role="group" aria-label={label} className="portfolio-choice-options">
        {alternatives.map((choice, index) => <button key={choice.value} type="button"
          ref={node => { options.current[index] = node; }} tabIndex={open ? 0 : -1}
          onClick={() => {
            focusAfterClose.current = null; setOpen(false); trigger.current?.focus({preventScroll:true}); onChange(choice.value);
          }} onKeyDown={event => {
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? alternatives.length - 1 :
              event.key === 'ArrowDown' ? (index + 1) % alternatives.length :
              event.key === 'ArrowUp' ? (index + alternatives.length - 1) % alternatives.length : null;
            if (next !== null) { event.preventDefault(); focusChoice(next); }
          }}>
          <span>{choice.label}</span>
        </button>)}
      </div>
    </motion.div>
  </div>;
}
