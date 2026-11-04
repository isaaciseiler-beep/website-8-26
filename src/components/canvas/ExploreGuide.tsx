import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { experiencePrompts } from '@/lib/experiencePrompts';
import { CONTACT_EMAIL } from '@/lib/site';
import { MOTION_DURATION, MOTION_EASE_EXPLORE } from '@/lib/motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

const paths = [
  {
    id: 'start', label: 'Start broad', heading: 'Find a starting point',
    description: 'Get to know Isaac, or begin with a subject that interests you.',
    prompts: ['career', 'taiwan', 'policy'],
    tip: 'You can also write your own question above. Enter opens an exploration; typing alone changes nothing.',
  },
  {
    id: 'deeper', label: 'Go deeper', heading: 'Follow the work in Taiwan',
    description: 'Move from what Isaac built to the decisions, outcomes, and lessons behind it.',
    prompts: ['taiwan-process', 'taiwan-outcomes', 'taiwan-lessons'],
    tip: 'Inside a project, switch between Contribution, Process, Outcomes, and Evidence. Follow-up questions keep the work in context.',
  },
  {
    id: 'compare', label: 'Compare', heading: 'Put two kinds of work side by side',
    description: 'Look for shared methods and different approaches across Isaac’s experience.',
    prompts: ['compare', 'compare-comms', 'compare-research'],
    tip: 'Change the view’s controls to refine it. Back retraces your exploration, and Share keeps a link to the selected view.',
  },
] as const;

export default function ExploreGuide({ onExplore }: { onExplore: (question: string) => void }) {
  const [selected, setSelected] = useState<(typeof paths)[number]['id']>('start');
  const reduced = useMotionPreference();
  const examplesId = useId();
  const path = paths.find(item => item.id === selected)!;
  const questions = path.prompts.flatMap(id => experiencePrompts.find(prompt => prompt.id === id) ?? []);
  const feedbackHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio feedback')}&body=${encodeURIComponent('My feedback:\n\nQuestion I tried:\n\nWhat I expected:\n\nWhat happened:\n\nPage: ' + window.location.href)}`;

  return <section className="home-explore-guide" aria-label="Explore guide">
    <header className="home-guide-heading">
      <h2 tabIndex={-1}>How to explore</h2>
      <p>A question opens a view of the work. Follow what interests you from there.</p>
    </header>
    <div className="home-guide-playground">
      <nav className="home-guide-paths" aria-label="Ways to explore">
        {paths.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} aria-controls={examplesId} onClick={() => setSelected(item.id)}>{item.label}<ArrowUpRight size={16} aria-hidden="true" /></button>)}
      </nav>
      <div id={examplesId} className="home-guide-examples">
        <motion.div key={path.id} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : MOTION_DURATION.base, ease: MOTION_EASE_EXPLORE }}>
          <h3>{path.heading}</h3>
          <p>{path.description}</p>
          <ul aria-label="Questions to try">
            {questions.map(question => <li key={question.id}><button type="button" onClick={() => onExplore(question.text)}><span>{question.text}</span><ArrowUpRight size={20} aria-hidden="true" /></button></li>)}
          </ul>
          <p className="home-guide-tip">{path.tip}</p>
        </motion.div>
      </div>
    </div>
    <details className="home-guide-about">
      <summary>About answers &amp; privacy</summary>
      <p>Answers use Isaac’s published portfolio material. Submitted questions and current view settings can go to Mistral and Typesafe to choose the content and presentation. Typing and changing filters stay local.</p>
      <p>If something seems wrong or missing, include the question you tried and what you expected.</p>
      <a href={feedbackHref}>Send feedback <ArrowUpRight size={14} aria-hidden="true" /></a>
    </details>
  </section>;
}
