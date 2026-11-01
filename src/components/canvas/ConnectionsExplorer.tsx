import { ArrowUpRight } from 'lucide-react';
import { portfolioConnections, connectionIds } from '@/lib/portfolioConnections';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceFor, evidenceSections } from '@/lib/portfolioEvidence';

/** A linked comparison: one lens updates every project against the same question. */
export function ConnectionsExplorer({ block, onChange }: {block: CanvasBlock; onChange: (block: CanvasBlock) => void}) {
  const connection = portfolioConnections[block.connectionId ?? 'systems'];
  const focus = block.focus === 'process' || block.focus === 'outcomes' ? block.focus : 'role';
  return <section className="portfolio-connections portfolio-career" aria-label="Connections across the work">
    <h2>What connects the work</h2>
    <label className="portfolio-connection-select"><span className="sr-only">Connection to explore</span><select value={block.connectionId ?? 'systems'} onChange={event => onChange({...block, connectionId: event.target.value as NonNullable<CanvasBlock['connectionId']>})}>
      {connectionIds.map(id => <option key={id} value={id}>{portfolioConnections[id].label}</option>)}
    </select></label>
    <div className="portfolio-tabs" aria-label="Connection aspect">{(['role', 'process', 'outcomes'] as const).map(value => <button key={value} aria-pressed={focus === value} onClick={() => onChange({...block, focus: value})}>{value === 'role' ? 'Contribution' : value === 'process' ? 'Process' : 'Outcomes'}</button>)}</div>
    <p className="portfolio-connection-insight">{connection[focus]}</p>
    <div className="portfolio-connection-grid">{connection.projectIds.map(id => {
      const record = evidenceFor(id);
      if (!record) return null;
      const passage = evidenceSections(id, focus === 'role' ? 'process' : focus)[0];
      return <article key={id}>
        <h3>{record.title}</h3>
        <p>{focus === 'role' ? record.contribution : focus === 'process' ? record.practice : record.outcome}</p>
        {passage && <details key={`${id}:${focus}:${block.connectionId}`} className="portfolio-connection-evidence"><summary>Supporting evidence<span className="sr-only"> for {record.title}</span></summary><h4>{passage.heading}</h4>{passage.paragraphs?.slice(0, 2).map(text => <p key={text}>{text}</p>)}
          <button className="portfolio-inline-action" onClick={() => onChange({...blankBlock('story'), projectIds: [id], focus: focus === 'role' ? 'process' : focus, layout: focus === 'outcomes' ? 'project-outcomes' : 'project-process', section: passage.index})}>Explore this project<ArrowUpRight size={15} aria-hidden="true" /></button>
        </details>}
      </article>;
    })}</div>
  </section>;
}
