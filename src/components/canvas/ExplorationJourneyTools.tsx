import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ChevronDown, Clock } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/site';

const kindLabel: Record<string, string> = { story: 'Project', benchmark: 'Research', comparison: 'Comparison', collection: 'Work', timeline: 'Career', contact: 'Contact', architecture: 'Process' };

export function AnswerDocumentMeta({ kind, question }: { kind: string; question: string }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  useLayoutEffect(() => {
    const stage = document.querySelector('.home-genui-stage');
    if (!stage) { setSlot(null); setNotes([]); return; }
    const heading = stage.querySelector('h2:not(.sr-only)');
    const box = heading?.getBoundingClientRect();
    const visibleHeading = Boolean(heading && box && box.height > 8 && box.width > 8);
    const host = document.createElement('div');
    host.className = 'answer-meta-slot';
    const anchor = visibleHeading ? heading!.closest('.canvas-heading') ?? heading : null;
    if (anchor) anchor.insertAdjacentElement('afterend', host);
    else stage.insertAdjacentElement('afterbegin', host);
    setSlot(host);
    const listed = [...stage.querySelectorAll<HTMLElement>('.canvas-sources li[id]')];
    const marked = [...stage.querySelectorAll<HTMLElement>('[data-answer-source]')];
    setNotes((listed.length ? listed : marked).map(item => item.id));
    return () => host.remove();
  }, [question, kind]);
  if (!slot) return null;
  const count = notes.length === 1 ? '1 source' : `${notes.length || 'no'} sources`;
  return createPortal(<p className="answer-document-meta"><span>Answer</span><span> · {count}</span><span> · {kindLabel[kind] ?? 'Note'}</span><span className="sr-only"> for {question}</span></p>, slot);
}

function intersects(a: DOMRect, b: DOMRect) {
  return !(a.bottom <= b.top + 0.5 || a.top >= b.bottom - 0.5 || a.right <= b.left + 0.5 || a.left >= b.right - 0.5);
}

export function ExplorationHistory({ items, onSelect }: { items: { title: string; question: string; current?: boolean }[]; onSelect: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(0, items.findIndex(item => item.current));
  useLayoutEffect(() => {
    if (!open || !trigger.current || !menu.current) return;
    const place = () => {
      const anchor = trigger.current!.getBoundingClientRect();
      const panel = menu.current!;
      const width = Math.min(320, window.innerWidth - 24);
      panel.style.width = `${width}px`;
      const left = Math.min(Math.max(12, anchor.right - width), window.innerWidth - width - 12);
      let top = anchor.bottom + 8;
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      const titles = [...document.querySelectorAll<HTMLElement>('.home-genui-composer textarea, .home-genui-stage h2:not(.sr-only)')].filter(el => {
        const box = el.getBoundingClientRect();
        return box.width > 8 && box.height > 8;
      });
      for (const title of titles) {
        const box = panel.getBoundingClientRect();
        const titleBox = title.getBoundingClientRect();
        if (intersects(box, titleBox)) {
          top = Math.max(top, titleBox.bottom + 8);
          panel.style.top = `${top}px`;
        }
      }
      const box = panel.getBoundingClientRect();
      const maxTop = Math.max(anchor.bottom + 8, window.innerHeight - box.height - 12);
      if (box.bottom > window.innerHeight - 12) panel.style.top = `${maxTop}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, items]);
  useEffect(() => {
    if (!open) return;
    setCursor(currentIndex);
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open, currentIndex]);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[cursor]?.focus();
  }, [open, cursor]);
  if (!items.length) return null;
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); setCursor(index => (index + 1) % items.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setCursor(index => (index - 1 + items.length) % items.length); }
    if (event.key === 'Home') { event.preventDefault(); setCursor(0); }
    if (event.key === 'End') { event.preventDefault(); setCursor(items.length - 1); }
  };
  return <div className="home-history">
    <button ref={trigger} type="button" className="home-history-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls="explore-history-menu" aria-label={`History, ${items.length}`} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } if (event.key === 'Escape') setOpen(false); }}>
      <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={menu} id="explore-history-menu" className="home-history-menu" role="menu" aria-label="History" onKeyDown={move}>
      {items.map((entry, index) => <button type="button" role="menuitem" key={`${index}-${entry.question}`} aria-current={entry.current ? 'true' : undefined} title={entry.question} onClick={() => { setOpen(false); if (!entry.current) onSelect(index); trigger.current?.focus(); }} onMouseEnter={() => setCursor(index)}>
        <i className="home-history-mark" aria-hidden="true" />
        <span>{entry.question}</span>
      </button>)}
    </div>, document.body)}
  </div>;
}

export function ExplorationFeedback({ title, question, url }: { title: string; question: string; url: string }) {
  const id = useId();
  const [reason, setReason] = useState('The answer missed my question');
  const [detail, setDetail] = useState('');
  const body = [`Feedback: ${reason}`, '', detail.trim(), '', `Question: ${question}`, `View: ${title}`, url].filter(Boolean).join('\n');
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio answer feedback')}&body=${encodeURIComponent(body)}`;
  return <details className="home-answer-feedback">
    <summary>Feedback<ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></summary>
    <label htmlFor={`${id}-reason`}>What could be better?</label>
    <select id={`${id}-reason`} value={reason} onChange={event => setReason(event.target.value)}>
      <option>The answer missed my question</option><option>Something is missing or inaccurate</option><option>The interface was hard to use</option><option>Something else</option>
    </select>
    <label htmlFor={`${id}-detail`}>What did you expect? <span>(optional)</span></label>
    <textarea id={`${id}-detail`} value={detail} maxLength={1200} rows={3} onChange={event => setDetail(event.target.value)}/>
    <a href={href}>Email this feedback <ArrowUpRight size={14} aria-hidden="true"/></a>
  </details>;
}
