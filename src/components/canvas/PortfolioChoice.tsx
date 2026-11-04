import { useId, useRef, useState } from 'react';
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
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useMotionPreference();
  const selected = choices.findIndex(choice => choice.value === value);
  const focusChoice = (index: number) => requestAnimationFrame(() => options.current[index]?.focus());
  return <div className="portfolio-choice" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
    }
  }}>
    <button ref={trigger} type="button" className="portfolio-choice-trigger" aria-label={label} aria-describedby={`${id}-value`}
      aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true); focusChoice(selected < 0 ? 0 : selected);
        }
      }}>
      <span id={`${id}-value`}>{choices[selected]?.label ?? label}</span><ChevronDown size={16} aria-hidden="true"/>
    </button>
    <motion.div id={id} className="portfolio-choice-reveal" initial={false} aria-hidden={!open}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: MOTION_EASE_ENTER }}>
      <div role="group" aria-label={label} className="portfolio-choice-options">
        {choices.map((choice, index) => <button key={choice.value} type="button"
          ref={node => { options.current[index] = node; }} tabIndex={open ? 0 : -1}
          aria-pressed={value === choice.value} onClick={() => {
            setOpen(false); trigger.current?.focus(); onChange(choice.value);
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
