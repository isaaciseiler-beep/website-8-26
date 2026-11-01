import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/site';

export default function ExplorePreviewDialog() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const panelId = useId();
  const feedbackBody = [
    'My feedback:', '',
    'Question I tried:', '',
    'What I expected:', '',
    'What happened:', '',
    'Page: ' + window.location.href,
  ].join('\n');
  const feedbackHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Generative UI Beta feedback')}&body=${encodeURIComponent(feedbackBody)}`;

  return <div className="home-genui-preview">
    <div ref={container} className={`home-preview-popdown${open ? ' is-open' : ''}`}>
      <button ref={trigger} type="button" className="home-preview-trigger" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>Generative UI Beta Preview</button>
      {open && <div id={panelId} className="home-preview-dialog" role="region" aria-label="Generative UI technical details">
          <button type="button" className="home-preview-close" aria-label="Close beta preview" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} aria-hidden="true" /></button>
          <p className="home-preview-explanation">This is an experiment in generative UI: a portfolio that takes shape around your question. Ask about Isaac’s work, and the interface assembles a way to explore it.</p>
          <p className="home-preview-explanation">Mistral Small (<code>mistral-small-2603</code> by default) composes an interactive answer from Isaac’s published work. Typesafe’s Jev (<code>jev-latest</code>) can suggest relevant evidence, an experience type, or a connection across projects. Mistral makes the final selection and can continue when Jev is unavailable.</p>
          <p className="home-preview-explanation">The models choose known content IDs, supported layouts, and controls. The server validates the result; React renders authored components. Linked views let you compare contributions, process, and outcomes, then open the supporting evidence.</p>
          <p className="home-preview-explanation">When AI composition is needed, submitted questions, current view settings, and published portfolio content go to Mistral and optionally Typesafe. Typing and changing filters stay local. Follow-ups keep your selections; shared links preserve the view.</p>
          <p className="home-preview-ask">Something wrong or missing? Send the question you tried and what you expected.</p>
          <a className="home-preview-email" href={feedbackHref}>Send feedback <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>}
    </div>
  </div>;
}
