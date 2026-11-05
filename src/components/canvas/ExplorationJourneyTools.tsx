import { useId, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
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
  const openNote = (id: string) => {
    const item = document.getElementById(id);
    const details = item?.closest('details');
    if (details) details.open = true;
    item?.scrollIntoView({ block: 'nearest' });
  };
  const count = notes.length === 1 ? '1 source' : `${notes.length || 'no'} sources`;
  return createPortal(<p className="answer-document-meta"><span>Answer</span><span> · {count}</span><span> · {kindLabel[kind] ?? 'Note'}</span>{notes.length > 0 && <span className="answer-document-notes">{notes.map((id, index) => <a key={id} href={`#${id}`} onClick={event => { event.preventDefault(); openNote(id); }}><sup>{index + 1}</sup></a>)}</span>}<span className="sr-only"> for {question}</span></p>, slot);
}

const historyNarrow = '(max-width:720px)';
const subscribeHistoryNarrow = (notify: () => void) => {
  const media = window.matchMedia(historyNarrow);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

export function ExplorationHistory({ items, onSelect }: { items: { title: string; question: string; current?: boolean }[]; onSelect: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const narrow = useSyncExternalStore(subscribeHistoryNarrow, () => window.matchMedia(historyNarrow).matches, () => false);
  if (!items.length) return null;
  const list = <ol>{items.map((entry, index) => <li key={`${index}-${entry.question}`} aria-current={entry.current ? 'true' : undefined}>{entry.current ? <span>{entry.question}</span> : <button type="button" title={entry.question} onClick={() => { setOpen(false); onSelect(index); }}>{entry.question===entry.title?entry.title:<><span>{entry.question}</span><small>{entry.title}</small></>}</button>}</li>)}</ol>;
  return <details className="home-journey-history" open={open} onToggle={event => { if (event.currentTarget.open !== open) setOpen(event.currentTarget.open); }}>
    <summary>History</summary>
    {open && narrow ? createPortal(<div className="home-history-sheet" role="dialog" aria-label="History">{list}</div>, document.body) : list}
  </details>;
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
