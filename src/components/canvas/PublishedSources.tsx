import { useId } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { ProjectLink } from '@/lib/siteContent';

function sourceDomain(href: string) {
  try { return new URL(href, 'https://seiler.page').hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

/** One consistent source trail: authored link labels, contextual disclosure,
 * and a shared new-tab description without changing the link's useful name. */
export function PublishedSources({ links, context, open = false }: { links: ProjectLink[]; context: string; open?: boolean }) {
  const description = useId();
  const unique = [...new Map(links.map(link => [link.href, link])).values()];
  if (!unique.length) return null;
  const contents = <>
    <span className="sr-only" id={description}>Opens in a new tab.</span>
    <ul>
      {unique.map((link, index) => <li key={link.href} id={`${description}-source-${index + 1}`}><a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} aria-describedby={description}>
        <sup className="portfolio-source-index" aria-hidden="true">{index + 1}</sup>
        <span className="portfolio-source-copy"><span className="portfolio-source-title">{link.label}</span><span className="portfolio-source-domain" aria-hidden="true">{sourceDomain(link.href)}</span></span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </a></li>)}
    </ul>
  </>;
  const summary = <summary>Sources<span className="sr-only"> for {context}</span><ChevronDown size={16} aria-hidden="true" /></summary>;
  return open
    ? <div className="portfolio-sources canvas-sources is-requested" role="group" aria-label={`Sources for ${context}`}>{contents}</div>
    : <details className="portfolio-sources canvas-sources">{summary}{contents}</details>;
}
