import { useId, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CONTACT_EMAIL } from '@/lib/site';

export function ExplorationHistory({ items, onSelect }: { items: { title: string; question: string }[]; onSelect: (index: number) => void }) {
  if (items.length < 2) return null;
  return <details className="home-journey-history">
    <summary>History</summary>
    <ol reversed>{items.map((_, offset) => {
      const index = items.length - 1 - offset;
      const entry = items[index];
      return <li key={`${index}-${entry.title}`}><button type="button" title={entry.question} onClick={event => {
        event.currentTarget.closest('details')?.removeAttribute('open');
        onSelect(index);
      }}>{entry.question===entry.title?entry.title:<><span>{entry.question}</span><small>{entry.title}</small></>}</button></li>;
    })}</ol>
  </details>;
}

export function ExplorationFeedback({ title, question, url }: { title: string; question: string; url: string }) {
  const id = useId();
  const [reason, setReason] = useState('The answer missed my question');
  const [detail, setDetail] = useState('');
  const body = [`Feedback: ${reason}`, '', detail.trim(), '', `Question: ${question}`, `View: ${title}`, url].filter(Boolean).join('\n');
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio answer feedback')}&body=${encodeURIComponent(body)}`;
  return <details className="home-answer-feedback">
    <summary>Feedback</summary>
    <label htmlFor={`${id}-reason`}>What could be better?</label>
    <select id={`${id}-reason`} value={reason} onChange={event => setReason(event.target.value)}>
      <option>The answer missed my question</option><option>Something is missing or inaccurate</option><option>The interface was hard to use</option><option>Something else</option>
    </select>
    <label htmlFor={`${id}-detail`}>What did you expect? <span>(optional)</span></label>
    <textarea id={`${id}-detail`} value={detail} maxLength={1200} rows={3} onChange={event => setDetail(event.target.value)}/>
    <a href={href}>Email this feedback <ArrowUpRight size={14} aria-hidden="true"/></a>
  </details>;
}
