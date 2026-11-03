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
  const feedbackHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio feedback')}&body=${encodeURIComponent(feedbackBody)}`;

  return <div className="home-genui-preview">
    <div ref={container} className={`home-preview-popdown${open ? ' is-open' : ''}`}>
      <button ref={trigger} type="button" className="home-preview-trigger" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>How to explore</button>
      {open && <div id={panelId} className="home-preview-dialog" role="region" aria-label="About Explore">
          <button type="button" className="home-preview-close" aria-label="Close exploration help" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} aria-hidden="true" /></button>
          <p className="home-preview-explanation">Ask about Isaac’s work: teaching in Taiwan, researching AI in government, or testing ChatGPT. Explore his role, how the work happened, and the published results.</p>
          <p className="home-preview-explanation">Follow-up questions keep the current work in context. You can change the view’s controls, go back to an earlier exploration, or share a link to your selected view.</p>
          <details><summary>About AI and your questions</summary><p className="home-preview-explanation">Answers use Isaac’s published portfolio material. Submitted questions and current view settings can go to Mistral and Typesafe to choose the answer’s content and presentation. Typing and changing filters stay local.</p></details>
          <p className="home-preview-ask">Something wrong or missing? Send the question you tried and what you expected.</p>
          <a className="home-preview-email" href={feedbackHref}>Send feedback <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>}
    </div>
  </div>;
}
