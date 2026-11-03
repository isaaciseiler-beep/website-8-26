import { useId } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { ProjectLink } from '@/lib/siteContent';

/** One consistent source trail: authored link labels, contextual disclosure,
 * and a shared new-tab description without changing the link's useful name. */
export function PublishedSources({ links, context, open = false }: { links: ProjectLink[]; context: string; open?: boolean }) {
  const description = useId();
  const unique = [...new Map(links.map(link => [link.href, link])).values()];
  if (!unique.length) return null;
  const contents = <div>
    <span className="sr-only" id={description}>Opens in a new tab.</span>
    {unique.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" aria-describedby={description}>{link.label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}
  </div>;
  return open
    ? <div className="portfolio-sources canvas-sources is-requested" role="group" aria-label={`Sources for ${context}`}>{contents}</div>
    : <details className="portfolio-sources canvas-sources"><summary>Sources<span className="sr-only"> for {context}</span></summary>{contents}</details>;
}
