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
          <p className="home-preview-explanation">Mistral Small (<code>mistral-small-2603</code> by default) turns your submitted question and published portfolio content into a JSON composition: which evidence to show, which layout fits, and which controls make it explorable. Typesafe’s Jev (<code>jev-latest</code>) handles intent routing.</p>
          <p className="home-preview-explanation">A bounded schema keeps the model’s choices tied to known content IDs and supported layouts. The server validates that composition, then React renders the corresponding authored components. Filters and controls respond locally; model calls happen only when you submit a question.</p>
          <p className="home-preview-ask">Something wrong or missing? Send the question you tried and what you expected.</p>
          <a className="home-preview-email" href={feedbackHref}>Send feedback <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>}
    </div>
  </div>;
}
