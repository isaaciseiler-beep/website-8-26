import { PortfolioFacets } from './PortfolioFacets';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { portfolioConnections, connectionIds } from '@/lib/portfolioConnections';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceFor, evidenceSections } from '@/lib/portfolioEvidence';
import { PublishedSources } from './PublishedSources';
import { representativeProjectImage } from './projectVisual';
import { ResolvedProjectImage } from './ResolvedProjectImage';

/** A linked comparison: one lens updates every project against the same question. */
export function ConnectionsExplorer({ block, onChange }: {block: CanvasBlock; onChange: (block: CanvasBlock) => void}) {
  const connection = portfolioConnections[block.connectionId ?? 'systems'];
  const focus = block.focus === 'process' || block.focus === 'outcomes' || block.focus === 'evidence' ? block.focus : 'role';
  return <section className="portfolio-connections portfolio-career" aria-label="Connections across the work">
    <h2 className="sr-only">{focus==='evidence'?'Sources across the work':'What connects the work'}</h2>
    <div className="portfolio-connection-controls"><label className="portfolio-connection-select portfolio-native-choice"><span className="portfolio-native-label" aria-hidden="true"><span>{connection.label}</span><ChevronDown size={14}/></span><span className="sr-only">Connection to explore</span><select className="portfolio-native-control" value={block.connectionId ?? 'systems'} onChange={event => onChange({...block, connectionId: event.target.value as NonNullable<CanvasBlock['connectionId']>})}>
      {connectionIds.map(id => <option key={id} value={id}>{portfolioConnections[id].label}</option>)}
    </select></label>
    <PortfolioFacets label="Connection aspect" choices={(['role','process','outcomes','evidence'] as const).map(value=>({value,label:value==='role'?'Contribution':value==='process'?'Process':value==='evidence'?'Evidence':'Outcomes'}))} value={focus} onChange={focus=>onChange({...block,focus})}/></div>
    {focus!=='evidence'&&<p className="portfolio-connection-insight">{connection[focus]}</p>}
    <div className="portfolio-connection-grid">{connection.projectIds.map(id => {
      const record = evidenceFor(id);
      if (!record) return null;
      const passage = evidenceSections(id, focus === 'role' ? 'process' : focus)[0];
      const sources=[...new Map(record.project.sections.flatMap(section=>section.links??[]).map(link=>[link.href,link])).values()];
      const visual=representativeProjectImage(record.project);
      return <article key={id}>
        <ResolvedProjectImage visual={visual}>{(imageProps,displayed)=><div className="portfolio-connection-visual" data-presentation={displayed.presentation}><a href={displayed.src} target="_blank" rel="noreferrer" aria-label={`Open image: ${displayed.alt}`}><img {...imageProps} className="portfolio-connection-image"/><ArrowUpRight size={16} aria-hidden="true"/></a>{displayed.note&&<span className="sr-only">{displayed.note}</span>}</div>}</ResolvedProjectImage>
        <div className="portfolio-connection-reader"><h3>{record.title}</h3>
        {focus==='evidence'?<PublishedSources context={record.title} links={sources} open/>:<p>{focus === 'role' ? record.contribution : focus === 'process' ? record.practice : record.outcome}</p>}
        {focus!=='evidence'&&passage && <details key={`${id}:${focus}:${block.connectionId}`} className="portfolio-connection-evidence"><summary>Supporting evidence<span className="sr-only"> for {record.title}</span></summary><h4>{passage.heading}</h4>{passage.paragraphs?.slice(0, 2).map(text => <p key={text}>{text}</p>)}
        <PublishedSources context={record.title} links={sources}/></details>}
        <button className="portfolio-inline-action" aria-label={`Explore ${record.title}`} onClick={() => onChange({...blankBlock('story'), projectIds: [id], focus, layout: focus==='evidence'?'project-evidence':focus === 'outcomes' ? 'project-outcomes' : focus === 'process' ? 'project-process' : 'project-brief', section: focus==='role'?0:passage?.index??0})}>Explore this project<ArrowUpRight size={15} aria-hidden="true" /></button>
        </div>
      </article>;
    })}</div>
  </section>;
}
