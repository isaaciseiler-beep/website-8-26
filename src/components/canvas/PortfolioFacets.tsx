import { useId } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';

type Choice<T extends string> = { value: T; label: string };

/** One selection marker connects local refinements without dimming controls. */
export function PortfolioFacets<T extends string>({ label, choices, value, onChange }: {
  label: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const id = useId();
  const reduced = useMotionPreference();
  return <LayoutGroup id={id}>
    <div className="portfolio-tabs" role="group" aria-label={label}>
      {choices.map(choice => <button type="button" key={choice.value} aria-pressed={value === choice.value} onClick={() => onChange(choice.value)}>
        <span className="portfolio-tab-label">{choice.label}</span>
        <span className="portfolio-tab-measure" aria-hidden="true">{choice.label}</span>
        {value === choice.value && <motion.span className="portfolio-tab-indicator" aria-hidden="true" layoutId="selection" initial={false}
          transition={{ duration: reduced ? 0 : MOTION_DURATION.fast, ease: MOTION_EASE_ENTER }} />}
      </button>)}
    </div>
  </LayoutGroup>;
}
