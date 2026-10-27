import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { publicProjects, experienceEntries } from '@/lib/canvas';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceFor, evidenceSections, type EvidenceFocus } from '@/lib/portfolioEvidence';
import { experienceIntro } from '@/lib/experience';

type Props = { block: CanvasBlock; onChange: (block: CanvasBlock) => void };
const facets: { value: EvidenceFocus; label: string }[] = [
  { value: 'role', label: 'Contribution' }, { value: 'process', label: 'Process' },
  { value: 'outcomes', label: 'Outcomes' }, { value: 'evidence', label: 'Evidence' },
];
const layoutFor = (focus: EvidenceFocus) => focus === 'process' ? 'project-process' : focus === 'outcomes' ? 'project-outcomes' : focus === 'evidence' ? 'project-evidence' : 'project-brief';

export function ProjectStory({ block, onChange }: Props) {
  const record = evidenceFor(block.projectIds[0]);
  if (!record) return null;
  const image=record.project.sections.flatMap(section=>section.media??[]).find(media=>media.type==='image'&&media.src);
  const focus = block.focus && block.focus !== 'overview' ? block.focus : block.layout === 'project-process' ? 'process' : block.layout === 'project-outcomes' ? 'outcomes' : block.layout === 'project-evidence' ? 'evidence' : 'role';
  const sections = evidenceSections(record.project.id, focus);
  const active = sections.find(section => section.index === block.section) ?? sections[0];
  const matched = sections.filter(section => [section.heading, ...section.paragraphs ?? [], ...section.bullets ?? []].join(' ').toLowerCase().includes((block.search ?? '').toLowerCase()));
  const selectFocus = (value: EvidenceFocus) => onChange({ ...block, focus: value, layout: layoutFor(value), section: evidenceSections(record.project.id, value)[0]?.index ?? 0, expanded: false });
  return <section className="portfolio-story" aria-label="Project explorer">
    <div className="portfolio-lead">
      <div>
        <p className="portfolio-meta">{record.role}<span>{record.project.year}</span></p>
        <h2>{record.title}</h2>
        <p className="portfolio-deck">{focus === 'outcomes' ? record.outcome : record.contribution}</p>
      </div>
      <img className="portfolio-project-image" src={image?.src??record.project.image} alt={image?.alt??record.project.title} />
    </div>
    <div className="portfolio-tabs" aria-label="Explore project">
      {facets.map(facet => <button key={facet.value} aria-pressed={focus === facet.value} onClick={() => selectFocus(facet.value)}>{facet.label}</button>)}
    </div>
    {focus === 'evidence' ? <div className="portfolio-evidence">
      <label className="canvas-field"><span className="sr-only">Find in this project</span><input type="search" value={block.search ?? ''} onChange={event => onChange({ ...block, search: event.target.value })} placeholder="Find in the published evidence" /></label>
      {matched.map(section => <details key={section.id}><summary>{section.heading}</summary>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}</details>)}
      {!matched.length && <p>No matching evidence in this project.</p>}
    </div> : focus === 'role' ? <div className="portfolio-role-summary">
      <span className="portfolio-label">What came from it</span><p>{record.outcome}</p>
      <button className="portfolio-inline-action" onClick={() => selectFocus('process')}>Explore how it happened<ArrowUpRight size={15} aria-hidden="true" /></button>
    </div> : active && <div className={`portfolio-section-explorer${sections.length===1?' is-single':''}`}>
      {sections.length>1&&<nav className="portfolio-section-nav" aria-label="Project process steps">
        {sections.map((section, index) => <button key={section.id} aria-pressed={active.index === section.index} onClick={() => onChange({ ...block, section: section.index, expanded: false })}><span>{String(index + 1).padStart(2, '0')}</span>{section.heading}</button>)}
      </nav>}
      <article className="portfolio-section-text">
        <h3>{active.heading}</h3>
        {active.paragraphs?.slice(0, block.expanded ? undefined : 2).map(text => <p key={text}>{text}</p>)}
        {active.bullets && <ul>{active.bullets.map(text => <li key={text}>{text}</li>)}</ul>}
        {(active.paragraphs?.length ?? 0) > 2 && <button className="portfolio-inline-action" onClick={() => onChange({ ...block, expanded: !block.expanded })}>{block.expanded ? 'Show less' : 'Continue reading'}<ChevronDown size={14} aria-hidden="true" /></button>}
      </article>
    </div>}
    <details className="portfolio-change-project"><summary>Explore another project</summary><label><span className="sr-only">Project</span><select aria-label="Project" value={record.project.id} onChange={event => onChange({ ...blankBlock('story'), projectIds: [event.target.value] })}>{publicProjects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></details>
  </section>;
}

export function ProjectComparison({ block, onChange }: Props) {
  const projects = block.projectIds.map(evidenceFor).filter((record): record is NonNullable<ReturnType<typeof evidenceFor>> => Boolean(record));
  if (projects.length !== 2) return null;
  const focus = block.focus === 'process' || block.focus === 'outcomes' ? block.focus : 'role';
  const rows = focus === 'role' ? ['Role', 'Contribution', 'Published outcome'] : focus === 'process' ? ['Approach', 'Work in practice'] : ['Published outcome', 'Evidence'];
  function cell(index: number, row: string) {
    const record = projects[index];
    if (row === 'Role') return record.role;
    if (row === 'Contribution') return record.contribution;
    if (row === 'Published outcome') return record.outcome;
    const sections = evidenceSections(record.project.id, row === 'Evidence' ? 'outcomes' : 'process');
    if (row === 'Approach') return sections.map(section => section.heading).join(' · ');
    return sections[0]?.paragraphs?.[0] ?? sections[0]?.bullets?.[0] ?? record.outcome;
  }
  return <section className="portfolio-comparison" aria-label="Project comparison">
    <h2>{focus === 'role' ? 'Contributions, side by side' : focus === 'process' ? 'Two approaches to the work' : 'What the work produced'}</h2>
    <div className="portfolio-tabs" aria-label="Comparison aspect">{(['role', 'process', 'outcomes'] as const).map(value => <button key={value} aria-pressed={focus === value} onClick={() => onChange({ ...block, focus: value })}>{value === 'role' ? 'Contribution' : value === 'process' ? 'Process' : 'Outcomes'}</button>)}</div>
    <div className="portfolio-comparison-titles">{projects.map(record => <div key={record.project.id}><span className="portfolio-meta">{record.project.year}</span><h3>{record.title}</h3></div>)}</div>
    <div className="portfolio-comparison-rows">{rows.map(row => <div className="portfolio-comparison-row" key={row}><h4>{row}</h4>{projects.map((record, index) => <div key={record.project.id}><span className="portfolio-mobile-project">{record.title}</span><p>{cell(index, row)}</p></div>)}</div>)}</div>
    <details className="portfolio-change-project"><summary>Change projects</summary><div className="portfolio-comparison-selects">{projects.map((record, index) => <label key={index}><span className="sr-only">Comparison project {index + 1}</span><select aria-label={`Comparison project ${index + 1}`} value={record.project.id} onChange={event => onChange({ ...block, projectIds: block.projectIds.map((id, position) => position === index ? event.target.value : id) })}>{publicProjects.filter(project => project.id !== block.projectIds[1 - index]).map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>)}</div></details>
  </section>;
}

export function CareerExplorer({ block, onChange }: Props) {
  const entries = experienceEntries.filter(entry => (entry.organization + ' ' + entry.role + ' ' + entry.focus.join(' ')).toLowerCase().includes((block.search ?? '').toLowerCase()));
  const active = entries.find(entry => entry.id === block.roleId) ?? entries[0];
  return <section className="portfolio-career" aria-label="Role explorer">
    <h2>Career &amp; experience</h2>
    {(!block.focus||block.focus==='overview')&&<p className="portfolio-deck">{experienceIntro.paragraphs[1]}</p>}
    <div className="portfolio-career-explorer">
      <div className="portfolio-career-nav"><label><span className="sr-only">Filter roles</span><input type="search" value={block.search ?? ''} onChange={event => onChange({ ...block, search: event.target.value })} placeholder="Find a role or skill" /></label><nav aria-label="Professional roles">{entries.map(entry => <button key={entry.id} aria-pressed={active?.id === entry.id} onClick={() => onChange({ ...block, roleId: entry.id })}><strong>{entry.organization}</strong><span>{entry.period}</span></button>)}</nav></div>
      {active ? <article className="portfolio-career-detail"><span className="portfolio-meta">{active.period}</span><h3>{active.role}</h3>{active.paragraphs.map(text => <p key={text}>{text}</p>)}{active.projectIds.filter(id => evidenceFor(id)).map(id => <button className="portfolio-inline-action" key={id} onClick={() => onChange({ ...blankBlock('story'), projectIds: [id], focus: 'role' })}>Explore the work<ArrowUpRight size={15} aria-hidden="true" /></button>)}</article> : <p>No matching roles.</p>}
    </div>
  </section>;
}
