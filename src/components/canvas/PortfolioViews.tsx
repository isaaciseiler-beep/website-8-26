import { ConnectionsExplorer } from './ConnectionsExplorer';
import { matchesPortfolioSearch } from '@/lib/portfolioSearch';
import type { ProjectLink, ProjectSection } from '@/lib/siteContent';
import { careerAnswers } from '@/lib/careerAnswers';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { publicProjects, experienceEntries } from '@/lib/canvas';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceFor, evidenceSections, comparisonInsight, sectionPreview, projectAngleAnswer, type EvidenceFocus } from '@/lib/portfolioEvidence';
import { sectionSearchParts } from '@/lib/portfolioRetrieval';

type Props = { block: CanvasBlock; onChange: (block: CanvasBlock) => void };
const facets: { value: EvidenceFocus; label: string }[] = [
  { value: 'role', label: 'Contribution' }, { value: 'process', label: 'Process' },
  { value: 'outcomes', label: 'Outcomes' }, { value: 'evidence', label: 'Evidence' },
];
const layoutFor = (focus: EvidenceFocus) => focus === 'process' ? 'project-process' : focus === 'outcomes' ? 'project-outcomes' : focus === 'evidence' ? 'project-evidence' : 'project-brief';

function ProjectSources({ links }: { links: ProjectLink[] }) {
  const unique = [...new Map(links.map(link => [link.href, link])).values()];
  if (!unique.length) return null;
  return <details className="portfolio-sources canvas-sources"><summary>Sources</summary><div>{unique.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</div></details>;
}

function ProjectPassage({section,paragraphs=section.paragraphs}:{section:ProjectSection;paragraphs?:string[]}) {
  const quote=section.pullQuote&&!paragraphs?.some(text=>text.includes(section.pullQuote!))?section.pullQuote:null;
  const stats=section.stats?.filter(stat=>!paragraphs?.some(text=>text.includes(stat.value)));
  return <>{paragraphs?.map(text=><p key={text}>{text}</p>)}{quote&&<blockquote>{quote}</blockquote>}{Boolean(stats?.length)&&<dl className="portfolio-results">{stats!.map(stat=><div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>}{section.bullets&&<ul>{section.bullets.map(text=><li key={text}>{text}</li>)}</ul>}</>;
}

export function ProjectStory({ block, onChange }: Props) {
  const record = evidenceFor(block.projectIds[0]);
  if (!record) return null;
  const focus = block.focus && block.focus !== 'overview' ? block.focus : block.layout === 'project-process' ? 'process' : block.layout === 'project-outcomes' ? 'outcomes' : block.layout === 'project-evidence' ? 'evidence' : 'role';
  const available = evidenceSections(record.project.id, focus);
  const requested = evidenceSections(record.project.id, 'overview').find(section => section.index === block.section);
  const sections = requested && !available.some(section => section.index === requested.index) ? [...available, requested] : available;
  const active = sections.find(section => section.index === block.section) ?? sections[0];
  const image=active?.media?.flatMap(media=>media.type==='image'&&media.src?[{src:media.src,alt:media.alt}]:media.images?.map(image=>({src:image.src,alt:image.alt}))??(media.poster?[{src:media.poster,alt:media.title}]:[]))[0]
    ??record.project.sections.flatMap(section=>section.media??[]).find(media=>media.type==='image'&&media.src);
  const matched = sections.filter(section => matchesPortfolioSearch(block.search ?? '', [section.label,...sectionSearchParts(section)]))
    .sort((a,b)=>block.expanded?Number(b.index===block.section)-Number(a.index===block.section):0);
  const materialLinks=record.project.sections.filter(section=>!section.paragraphs?.length&&!section.bullets?.length).flatMap(section=>section.links??[]);
  const angleAnswer=projectAngleAnswer(record.project.id,block.angle,block.section);
  const preview=block.paragraphIndices?.length&&active?.index===block.section?block.paragraphIndices:sectionPreview(record.project.id,active?.index??0,focus,block.angle);
  const previewParagraphs=active?.paragraphs?.filter((_,index)=>preview.includes(index))??[];
  const focusedRole=focus==='role'&&active&&(Boolean(block.paragraphIndices?.length)||block.section!==0||!active.paragraphs?.length);
  const deck = angleAnswer??(focus === 'role'&&!focusedRole ? record.contribution : null);
  const selectFocus = (value: EvidenceFocus) => onChange({ ...block, focus: value, layout: layoutFor(value), section: evidenceSections(record.project.id, value)[0]?.index ?? 0, expanded: false, angle: undefined, paragraphIndices: undefined });
  return <section className="portfolio-story" aria-label="Project explorer">
    <div className="portfolio-lead">
      <div>
        <h2>{record.title}</h2>
        {record.project.id==='artificial-intelligence-in-state-government-index'&&focus!=='role'&&block.angle!=='measurement'&&<p className="canvas-caption">August 2025 snapshot</p>}
        {deck && <p className="portfolio-deck">{deck}</p>}
      </div>
      <img className="portfolio-project-image" src={image?.src??record.project.image} alt={image?.alt??record.project.title} />
    </div>
    <div className="portfolio-tabs" aria-label="Explore project">
      {facets.map(facet => <button key={facet.value} aria-pressed={focus === facet.value} onClick={() => selectFocus(facet.value)}>{facet.label}</button>)}
    </div>
    {focus === 'evidence' ? <div className="portfolio-evidence">
      <label className="canvas-field"><span className="sr-only">Find in this project</span><input type="search" maxLength={120} value={block.search ?? ''} onChange={event => onChange({ ...block, search: event.target.value.slice(0, 120) })} placeholder="Find in the published evidence" /></label>
      {matched.map(section => <details key={section.id} open={block.expanded&&section.index===block.section||undefined}><summary>{section.heading}</summary><ProjectPassage section={section}/>{Boolean(section.links?.length)&&<div className="portfolio-evidence-links">{section.links!.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={14} aria-hidden="true"/></a>)}</div>}{section.media?.map((media,index)=>{
        const href=media.href??media.src;
        if(media.images?.length)return <div className="portfolio-evidence-media" key={`${section.id}:media:${index}`}>{media.images.map(image=><figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.alt} loading="lazy"/></a>{image.caption&&<figcaption>{image.caption}</figcaption>}</figure>)}</div>;
        return href&&media.type!=='placeholder'?<a className="portfolio-inline-action" key={`${section.id}:media:${index}`} href={href} target="_blank" rel="noreferrer">{media.title??media.caption??media.alt??'View published material'}<ArrowUpRight size={14} aria-hidden="true"/></a>:media.caption?<p key={`${section.id}:media:${index}`}>{media.caption}</p>:null;
      })}</details>)}
      {!matched.length && <p>No matching evidence in this project.</p>}
    </div> : focus === 'role' ? <div className="portfolio-role-summary">
      {!angleAnswer&&(focusedRole?<article className="portfolio-section-text"><h3>{active!.heading}</h3><ProjectPassage section={active!} paragraphs={block.expanded?active!.paragraphs:previewParagraphs}/>{active!.paragraphs?.some((_,index)=>!preview.includes(index))&&<button className="portfolio-inline-action" onClick={()=>onChange({...block,expanded:!block.expanded})}>{block.expanded?'Show less':'Continue reading'}<ChevronDown size={14} aria-hidden="true"/></button>}<ProjectSources key={'sources:'+record.project.id} links={[...active!.links??[],...materialLinks]}/></article>:<p>{record.outcome}</p>)}
      <button className="portfolio-inline-action" onClick={() => selectFocus('process')}>Explore how it happened<ArrowUpRight size={15} aria-hidden="true" /></button>
    </div> : active && <div className={`portfolio-section-explorer${sections.length===1?' is-single':''}`}>
      {sections.length>1&&<nav className="portfolio-section-nav" aria-label={focus === 'outcomes' ? 'Published outcomes' : 'Project process steps'}>
        {sections.map((section, index) => <button key={section.id} aria-pressed={active.index === section.index} onClick={() => onChange({ ...block, section: section.index, expanded: false, angle: undefined, paragraphIndices: undefined })}><span>{String(index + 1).padStart(2, '0')}</span>{section.label}</button>)}
      </nav>}
      <article className="portfolio-section-text">
        <h3>{record.project.id==='senior-thesis-local-journalism'&&active.index===1?active.label:active.heading}</h3>
        {record.project.id==='senior-thesis-local-journalism'&&focus==='outcomes'&&<p>The published project summary identifies labor precarity, newsroom contraction and platform dependence as research themes. It does not provide the thesis’s detailed conclusions.</p>}
        {angleAnswer?<details key={'passage:'+record.project.id} className="portfolio-supporting-passage"><summary>Read supporting passage</summary><ProjectPassage section={active}/></details>:<>
          <ProjectPassage section={active} paragraphs={block.expanded?active.paragraphs:previewParagraphs}/>
          {active.paragraphs?.some((_,index)=>!preview.includes(index)) && <button className="portfolio-inline-action" onClick={() => onChange({ ...block, expanded: !block.expanded })}>{block.expanded ? 'Show less' : 'Continue reading'}<ChevronDown size={14} aria-hidden="true" /></button>}
        </>}
        <ProjectSources key={'sources:'+record.project.id} links={[...active.links??[],...materialLinks]} />
      </article>
    </div>}
    <details className="portfolio-change-project"><summary>Explore another project</summary><label><span className="sr-only">Project</span><select aria-label="Project" value={record.project.id} onChange={event => onChange({ ...blankBlock('story'), projectIds: [event.target.value], focus, layout: layoutFor(focus), section: evidenceSections(event.target.value,focus)[0]?.index??0 })}>{publicProjects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></details>
  </section>;
}

export function ProjectComparison({ block, onChange }: Props) {
  const projects = block.projectIds.map(evidenceFor).filter((record): record is NonNullable<ReturnType<typeof evidenceFor>> => Boolean(record));
  if (projects.length !== 2) return null;
  const focus = block.focus === 'process' || block.focus === 'outcomes' ? block.focus : 'role';
  const rows = focus === 'role' ? ['Contribution', 'Published outcome'] : focus === 'process' ? ['Approach', 'Work in practice'] : ['Published outcome'];
  function cell(index: number, row: string) {
    const record = projects[index];
    if (row === 'Contribution') return record.contribution;
    if (row === 'Published outcome') return record.outcome;
    if (row === 'Approach') return record.process;
    if (row === 'Work in practice') return record.practice;
    return record.outcome;
  }
  return <section className="portfolio-comparison" aria-label="Project comparison">
    <h2>{focus === 'role' ? 'Contributions, side by side' : focus === 'process' ? 'Two approaches to the work' : 'What the work produced'}</h2>
    {comparisonInsight(block.projectIds,focus)&&<p className="portfolio-deck">{comparisonInsight(block.projectIds,focus)}</p>}
    <div className="portfolio-tabs" aria-label="Comparison aspect">{(['role', 'process', 'outcomes'] as const).map(value => <button key={value} aria-pressed={focus === value} onClick={() => onChange({ ...block, focus: value })}>{value === 'role' ? 'Contribution' : value === 'process' ? 'Process' : 'Outcomes'}</button>)}</div>
    <div className="portfolio-comparison-titles">{projects.map(record => <div key={record.project.id}><h3>{record.title}</h3></div>)}</div>
    <div className="portfolio-comparison-rows">{rows.map(row => <div className="portfolio-comparison-row" key={row}><h4>{row}</h4>{projects.map((record, index) => <div key={record.project.id}><span className="portfolio-mobile-project">{record.title}</span><p>{cell(index, row)}</p></div>)}</div>)}</div>
    {focus==='outcomes'&&<div className="portfolio-comparison-row">{projects.map(record=><div key={record.project.id}><span className="portfolio-mobile-project">{record.title}</span><ProjectSources key={'sources:'+record.project.id} links={record.project.sections.flatMap(section=>section.links??[])} /></div>)}</div>}
    <details className="portfolio-change-project"><summary>Change projects</summary><div className="portfolio-comparison-selects">{projects.map((record, index) => <label key={index}><span className="sr-only">Comparison project {index + 1}</span><select aria-label={`Comparison project ${index + 1}`} value={record.project.id} onChange={event => onChange({ ...block, projectIds: block.projectIds.map((id, position) => position === index ? event.target.value : id) })}>{publicProjects.filter(project => project.id !== block.projectIds[1 - index]).map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>)}</div></details>
  </section>;
}

const careerPaths: Record<string, {label:string;title:string}> = {
  'summation-ai': {label:'AI & communications',title:'Making complex technology useful'},
  'fulbright-taiwan': {label:'Teaching in Taiwan',title:'Designing around educators’ real work'},
  'csg-ai-index': {label:'Research & policy',title:'Making government AI comparable'},
  'us-house': {label:'Public service',title:'Building a communications function'},
  'openai-chatgpt-lab': {label:'Product feedback',title:'Turning product use into useful feedback'},
  'washu-head-ta': {label:'Teaching teams',title:'Coordinating a teaching team'},
  'boehringer-communications-strategy': {label:'Brand & strategy',title:'Carrying a rebrand into practice'},
  'washu-ai-journalism': {label:'Journalism research',title:'Understanding a changing news industry'},
};

export function CareerExplorer({ block, onChange }: Props) {
  if (block.answerId === 'connections') return <ConnectionsExplorer block={block} onChange={onChange} />;
  const answer=block.answerId?careerAnswers[block.answerId]:undefined;
  const roleIds=answer?.roles??(block.angle==='leadership'?['fulbright-taiwan','us-house','washu-head-ta']:block.section===2?['us-house','csg-ai-index','fulbright-taiwan','scholten-campaign']:block.section===1?['csg-ai-index','fulbright-taiwan','us-house','summation-ai']:Object.keys(careerPaths));
  // A specifically requested role remains reachable without turning this into a résumé index.
  const ids=block.roleId&&!roleIds.includes(block.roleId)?[...roleIds,block.roleId]:roleIds;
  const entries=ids.flatMap(id=>experienceEntries.filter(entry=>entry.id===id));
  const active=entries.find(entry=>entry.id===block.roleId)??entries[0];
  const record=active?.projectIds.map(evidenceFor).find(Boolean);
  const paragraphs=record?[record.contribution,record.practice]:active?.id==='summation-ai'?[careerAnswers.current.answer]:active?.id==='washu-head-ta'?['Isaac managed a teaching team of 12, coordinating course delivery and supporting students.']:active?.paragraphs??[];
  if(block.answerId==='chronology')return <section className="portfolio-career" aria-label="Career timeline"><h2>{answer!.title}</h2><p className="portfolio-answer">{answer!.answer}</p><ol className="portfolio-chronology">{entries.map(entry=><li key={entry.id}><span>{entry.period}</span><div><h3>{entry.organization}</h3><p>{entry.role}</p></div></li>)}</ol></section>;
  return <section className={`portfolio-career${answer?' has-answer':''}`}  aria-label="Role explorer">
    <h2>{answer?.title??(block.angle==='leadership'?'Leadership in practice':block.section===1?'Strengths across the work':block.section===2?'Public service':'Career & experience')}</h2>
    {answer&&<p className="portfolio-answer">{answer.answer}</p>}
    {block.answerId!=='current'&&<div className="portfolio-career-explorer">
      <div className="portfolio-career-nav"><nav aria-label="Professional roles">{entries.map(entry=><button key={entry.id} aria-pressed={active?.id===entry.id} onClick={()=>onChange({...block,roleId:entry.id,search:undefined})}><strong>{careerPaths[entry.id]?.label??entry.organization}</strong></button>)}</nav></div>
      {active&&<article className="portfolio-career-detail"><h3>{careerPaths[active.id]?.title??active.role}</h3>{paragraphs.map(text=><p key={text}>{text}</p>)}{record&&<button className="portfolio-inline-action" onClick={()=>onChange({...blankBlock('story'),projectIds:[record.project.id],focus:'process',layout:'project-process',section:record.processSections[0]??0})}>Explore the work<ArrowUpRight size={15} aria-hidden="true"/></button>}</article>}
    </div>}
  </section>;
}
