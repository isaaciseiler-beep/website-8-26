import { useCallback, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';
import { useProjectVisualId } from '@/lib/projectVisualMotion';
import { PortfolioFacets } from './PortfolioFacets';
import { PortfolioChoice } from './PortfolioChoice';
import { ConnectionsExplorer } from './ConnectionsExplorer';
import { matchesPortfolioSearch } from '@/lib/portfolioSearch';
import type { ProjectSection } from '@/lib/siteContent';
import { careerAnswers } from '@/lib/careerAnswers';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { publicProjects, experienceEntries } from '@/lib/canvas';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceFor, evidenceSections, comparisonInsight, sectionPreview, projectAngleAnswer, type EvidenceFocus } from '@/lib/portfolioEvidence';
import { sectionSearchParts } from '@/lib/portfolioRetrieval';
import { PublishedSources } from './PublishedSources';
import { ProjectAnswer } from './ProjectAnswer';
import { resolveAnswerPlan } from '@/lib/portfolioEvidenceRegistry';
import { artifactImageStyles, representativeProjectImage } from './projectVisual';
import { ResolvedProjectImage } from './ResolvedProjectImage';
import './portfolio-editorial.css';

type Props = { block: CanvasBlock; onChange: (block: CanvasBlock) => void };
const facets: { value: EvidenceFocus; label: string }[] = [
  { value: 'role', label: 'Contribution' }, { value: 'process', label: 'Process' },
  { value: 'outcomes', label: 'Outcomes' }, { value: 'evidence', label: 'Evidence' },
];
const layoutFor = (focus: EvidenceFocus) => focus === 'process' ? 'project-process' : focus === 'outcomes' ? 'project-outcomes' : focus === 'evidence' ? 'project-evidence' : 'project-brief';

function ProjectPassage({section,paragraphs=section.paragraphs}:{section:ProjectSection;paragraphs?:string[]}) {
  const quote=section.pullQuote&&!paragraphs?.some(text=>text.includes(section.pullQuote!))?section.pullQuote:null;
  const stats=section.stats?.filter(stat=>!paragraphs?.some(text=>text.includes(stat.value)));
  return <>{paragraphs?.map(text=><p key={text}>{text}</p>)}{quote&&<blockquote>{quote}</blockquote>}{Boolean(stats?.length)&&<dl className="portfolio-results">{stats!.map(stat=><div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>}{section.bullets&&<ul>{section.bullets.map(text=><li key={text}>{text}</li>)}</ul>}</>;
}

export function ProjectStory({ block, onChange }: Props) {
  const visualId=useProjectVisualId(block.projectIds[0]);
  const record = evidenceFor(block.projectIds[0]);
  if (!record) return null;
  const isLab=record.project.id==='openai-product-testing-and-feedback';
  const projectFacets=isLab?[{value:'role' as const,label:'Role'},{value:'process' as const,label:'Products'},{value:'outcomes' as const,label:'Published'},{value:'evidence' as const,label:'Sources'}]:facets;
  const focus = block.focus && block.focus !== 'overview' ? block.focus : block.layout === 'project-process' ? 'process' : block.layout === 'project-outcomes' ? 'outcomes' : block.layout === 'project-evidence' ? 'evidence' : 'role';
  const available = evidenceSections(record.project.id, focus);
  const requested = evidenceSections(record.project.id, 'overview').find(section => section.index === block.section);
  const sections = requested && !available.some(section => section.index === requested.index) ? [...available, requested] : available;
  const active = sections.find(section => section.index === block.section) ?? sections[0];
  const image=representativeProjectImage(record.project,active?.index);
  const searching = Boolean(block.search?.trim());
  const matched = sections.filter(section => matchesPortfolioSearch(block.search ?? '', [section.label,...sectionSearchParts(section)]))
    .sort((a,b)=>block.expanded?Number(b.index===block.section)-Number(a.index===block.section):0);
  const materialLinks=record.project.sections.filter(section=>!section.paragraphs?.length&&!section.bullets?.length).flatMap(section=>section.links??[]);
  const angleAnswer=projectAngleAnswer(record.project.id,block.angle,block.section);
  const preview=block.paragraphIndices?.length&&active?.index===block.section?block.paragraphIndices:sectionPreview(record.project.id,active?.index??0,focus,block.angle);
  const previewParagraphs=active?.paragraphs?.filter((_,index)=>preview.includes(index))??[];
  const focusedRole=focus==='role'&&active&&(Boolean(block.paragraphIndices?.length)||block.section!==0||!active.paragraphs?.length);
  const answerFacets=resolveAnswerPlan(block);
  const hasAnswerPlan=!angleAnswer&&(answerFacets.length>1||answerFacets.some(facet=>facet.kind==='sources'||facet.status!=='supported')||new Set(answerFacets.flatMap(facet=>facet.sections.map(section=>section.sectionId))).size>1);
  const deck = hasAnswerPlan?null:angleAnswer??(focus === 'role'&&!focusedRole ? record.contribution : null);
  const labWork=evidenceSections(record.project.id,'overview');
  const labProduct=isLab&&record.processSections.includes(active?.index??-1);
  const productPreview=(index:number)=>record.project.sections[index]?.paragraphs?.slice(0,2).map((_,paragraph)=>paragraph);
  const selectFocus = (value: EvidenceFocus) => {
    const section=isLab&&(labProduct||active?.index===7&&value!=='process'&&value!=='role')?active!.index:evidenceSections(record.project.id,value)[0]?.index??0;
    onChange({...block,focus:value,layout:layoutFor(value),section,answerPlan:undefined,expanded:isLab&&value==='evidence'&&section>0,angle:undefined,paragraphIndices:isLab&&value==='process'?productPreview(section):undefined});
  };
  const selectLabWork=(section:number)=>{
    const nextFocus:EvidenceFocus=section===0?'role':section===7?'outcomes':focus==='evidence'||focus==='outcomes'?focus:'process';
    onChange({...block,section,focus:nextFocus,layout:layoutFor(nextFocus),answerPlan:undefined,expanded:nextFocus==='evidence',angle:undefined,search:undefined,paragraphIndices:nextFocus==='process'?productPreview(section):undefined});
  };
  return <section className="portfolio-story portfolio-workbench" aria-label="Project explorer">
    <div className="portfolio-project-heading"><h2 className="portfolio-project-title">{record.title}<ChevronDown size={18} aria-hidden="true"/></h2><select className="portfolio-project-native" aria-label="Project" value={record.project.id} onChange={event=>onChange({...blankBlock('story'),projectIds:[event.target.value],focus,layout:layoutFor(focus),section:evidenceSections(event.target.value,focus)[0]?.index??0})}>{publicProjects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}</select></div>
    <div className="portfolio-workbench-toolbar"><PortfolioFacets label="Explore project" choices={projectFacets} value={focus} onChange={selectFocus}/></div>
    <div className={`portfolio-workbench-body${isLab?' has-product-choice':''}`}>
    {isLab&&<nav className="portfolio-workbench-section-choice portfolio-lab-product-choice" aria-label="ChatGPT Lab work"><label className="portfolio-native-choice"><span className="portfolio-native-label" aria-hidden="true"><span>{active?.index===0?'Lab overview':active?.label}</span><ChevronDown size={14}/></span><span className="sr-only">Lab work to explore</span><select className="portfolio-native-control" aria-label="Lab work to explore" value={active?.index??0} onChange={event=>selectLabWork(Number(event.target.value))}>{labWork.map(section=><option key={section.id} value={section.index}>{section.index===0?'Lab overview':section.label}</option>)}</select></label></nav>}
    <div className="portfolio-workbench-reader">

    {!isLab&&!hasAnswerPlan&&focus!=='role'&&focus!=='evidence'&&sections.length>1&&<nav className="portfolio-workbench-section-choice" aria-label={focus==='outcomes'?'Published outcomes':'Project process steps'}><label className="portfolio-native-choice"><span className="portfolio-native-label" aria-hidden="true"><span>{active?.label}</span><ChevronDown size={14}/></span><span className="sr-only">Project section</span><select className="portfolio-native-control" aria-label="Project section" value={active?.index} onChange={event=>onChange({...block,section:Number(event.target.value),expanded:false,answerPlan:undefined,angle:undefined,paragraphIndices:undefined})}>{sections.map(section=><option key={section.id} value={section.index}>{section.label}</option>)}</select></label></nav>}
    {deck&&<p className="portfolio-deck portfolio-direct-answer">{deck}</p>}
    {hasAnswerPlan?<ProjectAnswer key={JSON.stringify(block.answerPlan)} block={block} onChange={onChange} title={record.title}/>:isLab&&focus==='evidence'&&active&&active.index>0?<div className="portfolio-lab-source-view"><PublishedSources context={active.label} links={active.links??[]} open/><details key={`lab-account:${active.index}`} className="portfolio-supporting-passage"><summary>Read the published account</summary><ProjectPassage section={active}/></details></div>:focus === 'evidence' ? <div className="portfolio-evidence">
      <label className="canvas-field"><span className="sr-only">Find in this project</span><input type="search" maxLength={120} value={block.search ?? ''} onChange={event => onChange({ ...block, search: event.target.value.slice(0, 120) })} placeholder="Search this project" /></label>
      {searching&&<div className="portfolio-search-status"><p role="status">{matched.length} {matched.length===1?'section':'sections'} found</p><button className="portfolio-inline-action" onClick={()=>onChange({...block,search:undefined})}>Clear search</button></div>}
      {matched.map(section => <details key={`${section.id}:${searching?block.search:''}`} open={searching||block.expanded&&section.index===block.section||undefined}><summary>{section.heading}</summary><ProjectPassage section={section}/>{Boolean(section.links?.length)&&<div className="portfolio-evidence-links">{section.links!.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={14} aria-hidden="true"/></a>)}</div>}{section.media?.map((media,index)=>{
        const href=media.href??media.src;
        if(media.images?.length)return <div className="portfolio-evidence-media" key={`${section.id}:media:${index}`}>{media.images.map(image=><figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.alt} loading="lazy"/></a>{image.caption&&<figcaption>{image.caption}</figcaption>}</figure>)}</div>;
        return href&&media.type!=='placeholder'?<a className="portfolio-inline-action" key={`${section.id}:media:${index}`} href={href} target="_blank" rel="noreferrer">{media.title??media.caption??media.alt??'View published material'}<ArrowUpRight size={14} aria-hidden="true"/></a>:media.caption?<p key={`${section.id}:media:${index}`}>{media.caption}</p>:null;
      })}</details>)}
      {!matched.length && <p>No matching evidence in this project.</p>}
    </div> : focus === 'role' ? <div className="portfolio-role-summary">
      {!angleAnswer&&(focusedRole?<article className="portfolio-section-text"><h3>{active!.heading}</h3><ProjectPassage section={active!} paragraphs={block.expanded?active!.paragraphs:previewParagraphs}/>{active!.paragraphs?.some((_,index)=>!preview.includes(index))&&<button className="portfolio-inline-action" onClick={()=>onChange({...block,expanded:!block.expanded})}>{block.expanded?'Show less':'Continue reading'}<ChevronDown size={14} aria-hidden="true"/></button>}{!isLab&&<PublishedSources context={record.title} key={'sources:'+record.project.id} links={[...active!.links??[],...materialLinks]}/>}</article>:<><p>{record.outcome}</p>{!isLab&&<PublishedSources context={record.title} links={record.project.sections.flatMap(section=>section.links??[])}/>}</>)}
      <button className="portfolio-inline-action" onClick={() => selectFocus('process')}>{isLab?'Explore the products':'Explore how it happened'}<ArrowUpRight size={15} aria-hidden="true" /></button>
    </div> : active && <div className={`portfolio-section-explorer${sections.length===1?' is-single':''}`}>
      <article className="portfolio-section-text">
        <h3 className={sections.length>1?'sr-only':undefined}>{record.project.id==='senior-thesis-local-journalism'&&active.index===1?active.label:active.heading}</h3>
        {record.project.id==='senior-thesis-local-journalism'&&focus==='outcomes'&&<p>The published project summary identifies labor precarity, newsroom contraction and platform dependence as research themes. It does not provide the thesis’s detailed conclusions.</p>}
        {angleAnswer?<details key={'passage:'+record.project.id} className="portfolio-supporting-passage"><summary>Read supporting passage</summary><ProjectPassage section={active}/></details>:<>
          <ProjectPassage section={active} paragraphs={block.expanded?active.paragraphs:previewParagraphs}/>
          {active.paragraphs?.some((_,index)=>!preview.includes(index)) && <button className="portfolio-inline-action" onClick={() => onChange({ ...block, expanded: !block.expanded })}>{block.expanded ? 'Show less' : 'Continue reading'}<ChevronDown size={14} aria-hidden="true" /></button>}
        </>}
        {!isLab&&<PublishedSources context={record.title} key={'sources:'+record.project.id} links={[...active.links??[],...materialLinks]} />}
      </article>
    </div>}
    </div><aside className="portfolio-workbench-rail">
      <ResolvedProjectImage visual={image}>{(imageProps,displayed)=>{
        // Known dimensions reserve the final box even before a slow image has
        // intrinsic size. Keep sizing tied to the displayed fallback, too.
        const sizing=artifactImageStyles(displayed);
        return <figure className="portfolio-workbench-visual" data-presentation={displayed.presentation}>
          <motion.a layout={visualId?"preserve-aspect":false} layoutId={visualId} transition={{duration:MOTION_DURATION.reveal,ease:MOTION_EASE_ENTER}}
            style={sizing?.frame}
            href={displayed.src} target="_blank" rel="noreferrer" aria-label={`Open image: ${displayed.alt}`} title="Open original image in a new tab">
            <img {...imageProps} className="portfolio-project-image" style={sizing?.image}/><ArrowUpRight size={16} aria-hidden="true"/>
          </motion.a>
          {(displayed.note||record.project.id==='artificial-intelligence-in-state-government-index')&&<figcaption>{displayed.note&&<span className="sr-only">{displayed.note}</span>}{record.project.id==='artificial-intelligence-in-state-government-index'&&<span>August 2025 snapshot</span>}</figcaption>}
        </figure>;
      }}</ResolvedProjectImage>

    </aside></div>

  </section>;
}

export function ProjectComparison({ block, onChange }: Props) {
  const projects = block.projectIds.map(evidenceFor).filter((record): record is NonNullable<ReturnType<typeof evidenceFor>> => Boolean(record));
  if (projects.length !== 2) return null;
  const focus = block.focus === 'process' || block.focus === 'outcomes' || block.focus === 'evidence' ? block.focus : 'role';
  const rows = focus === 'evidence' ? [] : focus === 'role' ? ['Contribution', 'Published outcome'] : focus === 'process' ? ['Approach', 'Work in practice'] : ['Published outcome'];
  function cell(index: number, row: string) {
    const record = projects[index];
    if (row === 'Contribution') return record.contribution;
    if (row === 'Published outcome') return record.outcome;
    if (row === 'Approach') return record.process;
    if (row === 'Work in practice') return record.practice;
    return record.outcome;
  }
  return <section className="portfolio-comparison" aria-label="Project comparison">
    <h2 className="sr-only">{focus === 'evidence' ? 'The published sources' : focus === 'role' ? 'Contributions, side by side' : focus === 'process' ? 'Two approaches to the work' : 'What the work produced'}</h2>
    <PortfolioFacets label="Comparison aspect" choices={facets} value={focus} onChange={focus=>onChange({...block,focus})}/>
    <div className="portfolio-comparison-media">{projects.map((record,index)=>{const visual=representativeProjectImage(record.project);return <ResolvedProjectImage key={index} visual={visual}>{(imageProps,displayed)=><figure data-presentation={displayed.presentation}><a href={displayed.src} target="_blank" rel="noreferrer" aria-label={`Open image: ${displayed.alt}`}><img {...imageProps}/></a><figcaption>{displayed.note&&<span className="portfolio-image-note">{displayed.note}</span>}<label className="portfolio-comparison-choice"><span className="portfolio-comparison-name" aria-hidden="true"><span>{record.title}</span><ChevronDown size={14}/></span><select className="portfolio-comparison-native" aria-label={`Comparison project ${index+1}`} value={record.project.id} onChange={event=>onChange({...block,projectIds:block.projectIds.map((id,position)=>position===index?event.target.value:id)})}>{publicProjects.filter(project=>project.id!==block.projectIds[1-index]).map(project=><option key={project.id} value={project.id}>{evidenceFor(project.id)?.title??project.title}</option>)}</select></label></figcaption></figure>}</ResolvedProjectImage>;})}</div>
    {focus!=='evidence'&&comparisonInsight(block.projectIds,focus)&&<p className="portfolio-deck">{comparisonInsight(block.projectIds,focus)}</p>}
    {rows.length>0?<table className="portfolio-comparison-table" role="table" aria-label="Published project comparison">
      <thead role="rowgroup"><tr role="row"><td role="cell"/><th role="columnheader" scope="col">{projects[0].title}</th><th role="columnheader" scope="col">{projects[1].title}</th></tr></thead>
      <tbody role="rowgroup">{rows.map(row=><tr role="row" key={row}><th role="rowheader" scope="row">{row}</th>{projects.map((record,index)=><td role="cell" key={record.project.id}><span className="portfolio-mobile-project" aria-hidden="true">{record.title}</span><p>{cell(index,row)}</p></td>)}</tr>)}</tbody>
    </table>:<div className="portfolio-comparison-titles">{projects.map(record=><div key={record.project.id}><h3>{record.title}</h3></div>)}</div>}
    <div className="portfolio-comparison-row portfolio-comparison-actions">{projects.map(record=><div key={record.project.id}><span className="portfolio-mobile-project">{record.title}</span><button className="portfolio-inline-action" aria-label={`Explore ${record.title}`} onClick={()=>onChange({...blankBlock('story'),projectIds:[record.project.id],focus,layout:layoutFor(focus),section:evidenceSections(record.project.id,focus)[0]?.index??0})}>Explore this project<ArrowUpRight size={15} aria-hidden="true"/></button><PublishedSources context={record.title} key={`sources:${record.project.id}:${focus}`} open={focus==='evidence'} links={record.project.sections.flatMap(section=>section.links??[])} /></div>)}</div>

  </section>;
}

const careerPaths: Record<string, {label:string}> = {
  'summation-ai': {label:'AI & communications'},
  'fulbright-taiwan': {label:'Teaching in Taiwan'},
  'csg-ai-index': {label:'Research & policy'},
  'us-house': {label:'Public service'},
  'openai-chatgpt-lab': {label:'Product feedback'},
  'washu-head-ta': {label:'Teaching teams'},
  'boehringer-communications-strategy': {label:'Brand & strategy'},
  'washu-ai-journalism': {label:'Journalism research'},
};

function focusedRoleControl(navigation: HTMLDivElement | null) {
  const focused=document.activeElement;
  return focused instanceof HTMLButtonElement&&navigation?.contains(focused)?focused:null;
}

function keepFocusedRoleVisible(navigation: HTMLDivElement | null) {
  const focused=focusedRoleControl(navigation);
  if(!focused)return;
  const rect=focused.getBoundingClientRect();
  if(rect.top<0||rect.bottom>window.innerHeight)focused.scrollIntoView({block:'nearest'});
}

export function CareerExplorer({ block, onChange }: Props) {
  const roleNavigation=useRef<HTMLDivElement>(null);
  const preserveRoleFocus=useRef(false);
  const restoreRoleFocusAfterImageChange=useCallback(()=>{
    if(!preserveRoleFocus.current)return;
    preserveRoleFocus.current=false;
    keepFocusedRoleVisible(roleNavigation.current);
  },[]);
  useLayoutEffect(()=>{
    keepFocusedRoleVisible(roleNavigation.current);
  },[block.answerId,block.roleId]);
  if (block.answerId === 'connections') return <ConnectionsExplorer block={block} onChange={onChange} />;
  const answer=block.answerId?careerAnswers[block.answerId]:undefined;
  const roleIds=answer?.roles??(block.angle==='leadership'?['fulbright-taiwan','us-house','washu-head-ta']:block.section===2?['us-house','csg-ai-index','fulbright-taiwan','scholten-campaign']:block.section===1?['csg-ai-index','fulbright-taiwan','us-house','summation-ai']:Object.keys(careerPaths));
  // A specifically requested role remains reachable without turning this into a résumé index.
  const ids=block.roleId&&!roleIds.includes(block.roleId)?[...roleIds,block.roleId]:roleIds;
  const entries=ids.flatMap(id=>experienceEntries.filter(entry=>entry.id===id));
  const active=entries.find(entry=>entry.id===block.roleId)??entries[0];
  const record=active?.projectIds.map(evidenceFor).find(Boolean);
  const paragraphs=record?[record.contribution,record.practice]:active?.id==='summation-ai'?[careerAnswers.current.answer]:active?.id==='washu-head-ta'?['Isaac managed a teaching team of 12, coordinating course delivery and supporting students.']:active?.paragraphs??[];
  if(block.answerId==='chronology')return <section className="portfolio-career" aria-label="Career timeline"><h2 className="sr-only">{answer!.title}</h2><ol className="portfolio-chronology">{entries.map(entry=><li key={entry.id}><span>{entry.period}</span><div><h3>{entry.organization}</h3><p>{entry.role}</p></div></li>)}</ol><p className="canvas-caption portfolio-chronology-note">{answer!.answer}</p></section>;
  return <section className={`portfolio-career${answer?' has-answer':''}`}  aria-label="Role explorer">
    <h2 className="sr-only">{answer?.title??(block.angle==='leadership'?'Leadership in practice':block.section===1?'Strengths across the work':block.section===2?'Public service':'Career & experience')}</h2>
    {answer&&<p className="portfolio-answer">{answer.answer}</p>}
    {block.answerId!=='current'&&<div className="portfolio-career-explorer">
      <div ref={roleNavigation} className="portfolio-career-nav">{record&&<ResolvedProjectImage key="role-visual" visual={representativeProjectImage(record.project)} onDisplayedChange={restoreRoleFocusAfterImageChange}>{(imageProps,displayed)=>{
        const sizing=artifactImageStyles(displayed);
        return <figure className="portfolio-career-visual" data-presentation={displayed.presentation}>
          <a style={sizing?.frame} href={displayed.src} target="_blank" rel="noreferrer" aria-label={`Open image: ${displayed.alt}`}>
            <img {...imageProps} className="portfolio-career-image" style={sizing?.image} onError={event=>{
              const rect=focusedRoleControl(roleNavigation.current)?.getBoundingClientRect();
              preserveRoleFocus.current=Boolean(rect&&rect.top>=0&&rect.bottom<=window.innerHeight);
              imageProps.onError?.(event);
            }}/>
          </a>{displayed.note&&<figcaption className="portfolio-image-note">{displayed.note}</figcaption>}
        </figure>;
      }}</ResolvedProjectImage>}<div key="role-selector" className="portfolio-career-select"><PortfolioChoice label="Professional role" value={active?.id??''} choices={entries.map(entry=>({value:entry.id,label:careerPaths[entry.id]?.label??entry.organization}))} onChange={roleId=>onChange({...block,roleId,search:undefined})}/></div><nav key="role-navigation" aria-label="Professional roles">{entries.map(entry=><button key={entry.id} aria-pressed={active?.id===entry.id} onClick={()=>onChange({...block,roleId:entry.id,search:undefined})}><strong>{careerPaths[entry.id]?.label??entry.organization}</strong></button>)}</nav></div>
      {active&&<article className="portfolio-career-detail"><h3>{active.organization}</h3><div className="portfolio-role-context"><p>{active.role} · {active.period}</p></div>{paragraphs.map(text=><p key={text}>{text}</p>)}{record&&<button className="portfolio-inline-action" onClick={()=>onChange({...blankBlock('story'),projectIds:[record.project.id],focus:'process',layout:'project-process',section:record.processSections[0]??0})}>Explore the work<ArrowUpRight size={15} aria-hidden="true"/></button>}</article>}
    </div>}
  </section>;
}
