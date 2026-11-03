import { forwardRef, lazy, Suspense, useRef, useState } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';
import { useProjectVisualId } from '@/lib/projectVisualMotion';
import { matchesPortfolioSearch } from '@/lib/portfolioSearch';
import { evidenceFor } from '@/lib/portfolioEvidence';
import { sectionSearchParts } from '@/lib/portfolioRetrieval';
import { ArrowUpRight } from 'lucide-react';
import { publicProjects, experienceEntries } from '@/lib/canvas';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { representativeProjectImage } from './projectVisual';
export type LayoutProps={block:CanvasBlock;onChange:(block:CanvasBlock)=>void};

export function ProjectLayouts({block,onChange}:LayoutProps){
  const project=publicProjects.find(p=>p.id===block.projectIds[0])??publicProjects[0];
  const [query,setQuery]=useState('');
  const active=block.section;
  const sections=project.sections;
  const process=sections.filter(s=>/process|built|program|scope|contribution|rollout|approach|research|method/i.test(s.heading));
  const outcomes=sections.filter(s=>/result|learned|outcome|output|public value|added up|impact|takeaway/i.test(s.heading));
  const stages=process.length?process:sections;
  const stage=sections[active]??stages[0];
  const evidence=sections.filter(s=>[s.heading,...s.paragraphs??[],...s.bullets??[]].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <section className="canvas-project-layout" aria-label="Project detail layout"><div className="canvas-heading"><h2>{project.title}</h2></div>
    {block.layout==='project-process'?<div className="canvas-process"><div className="canvas-process-steps" aria-label="Project process steps">{stages.map((s,i)=><button aria-pressed={active===sections.indexOf(s)} key={s.heading} onClick={()=>onChange({...block,section:sections.indexOf(s)})}><span>{String(i+1).padStart(2,'0')}</span>{s.heading}</button>)}</div><article className="canvas-surface"><h3 className="sr-only">{stage.heading}</h3>{stage.paragraphs?.slice(0,2).map(t=><p key={t}>{t}</p>)}{stage.bullets&&<ul>{stage.bullets.map(t=><li key={t}>{t}</li>)}</ul>}</article></div>:block.layout==='project-outcomes'?<><p>{project.summary}</p><div className="canvas-outcomes">{(outcomes.length?outcomes:sections.slice(-2)).map((s,i)=><article className="canvas-surface" key={s.heading}><span className="canvas-step-index">{String(i+1).padStart(2,'0')}</span><h3>{s.heading}</h3><p>{s.paragraphs?.[0]??s.bullets?.[0]}</p>{((s.paragraphs?.length??0)>1||(s.bullets?.length??0)>1)&&<details><summary>Explore evidence</summary>{s.paragraphs?.slice(1).map(t=><p key={t}>{t}</p>)}{s.bullets&&<ul>{s.bullets.map(t=><li key={t}>{t}</li>)}</ul>}</details>}</article>)}</div></>:<><label className="canvas-field"><span>Find in this project</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);onChange(block);}} placeholder="Search the published evidence"/></label><div className="canvas-evidence">{evidence.length?evidence.map(s=><details key={s.heading}><summary>{s.heading}</summary>{s.paragraphs?.map(t=><p key={t}>{t}</p>)}{s.bullets&&<ul>{s.bullets.map(t=><li key={t}>{t}</li>)}</ul>}{s.links?.map(l=><a href={l.href} key={l.href} target="_blank" rel="noreferrer">{l.label}<ArrowUpRight size={14}/></a>)}</details>):<p>No matching sections.</p>}</div></>}
  </section>;
}

export function ProjectIndex({block,onChange}:LayoutProps){
  const searchRef=useRef<HTMLInputElement>(null);
  const query=block.search??'';
  const filtered=publicProjects.flatMap(project=>{
    const evidence=evidenceFor(project.id);
    if(!matchesPortfolioSearch(query,[project.title,project.summary,evidence?.role,evidence?.contribution,evidence?.process,evidence?.practice,evidence?.outcome,...project.sections.flatMap(sectionSearchParts)]))return [];
    // Show where a subject was found, and open that exact published passage.
    // Title searches keep the project's contribution overview as the entry point.
    const section=query.trim()&&!matchesPortfolioSearch(query,[project.title])
      ?project.sections.findIndex(section=>matchesPortfolioSearch(query,sectionSearchParts(section))):-1;
    return [{project,section}];
  });
  return <section className="portfolio-work-browser" aria-label="Work explorer"><h2 className="sr-only">Explore work</h2><label className="canvas-field"><span className="sr-only">Find a project</span><input ref={searchRef} type="search" maxLength={120} placeholder="Find a project or topic" value={query} onChange={e=>{onChange({...block,search:e.target.value.slice(0,120)});}}/></label>
    <p className="sr-only" role="status" aria-atomic="true">{filtered.length} {filtered.length===1?'project':'projects'}{query.trim()?' matching your search':''}.</p>
    <div className="canvas-project-list"><AnimatePresence initial={false} mode="popLayout">{filtered.map(({project,section})=><ProjectIndexItem key={project.id} project={project} section={section} onOpen={()=>onChange({...blankBlock('story'),projectIds:[project.id],...(section>=0?{layout:'project-evidence',focus:'evidence',section,expanded:true}:{})})}/>)}</AnimatePresence>{!filtered.length&&<div><p>No matching projects.</p><button type="button" className="portfolio-inline-action" onClick={()=>{onChange({...block,search:''});searchRef.current?.focus();}}>Clear search</button></div>}</div>
  </section>;
}

const ProjectIndexItem=forwardRef<HTMLButtonElement,{project:typeof publicProjects[number];section:number;onOpen:()=>void}>(function ProjectIndexItem({project,section,onOpen},ref){
  const present=useIsPresent();
  const reduced=useMotionPreference();
  const image=representativeProjectImage(project);
  const visualId=useProjectVisualId(project.id);
  return <motion.button ref={ref} type="button" layout={reduced?false:'position'} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    transition={{layout:{duration:reduced?0:MOTION_DURATION.base,ease:MOTION_EASE_ENTER},opacity:{duration:reduced?0:present?MOTION_DURATION.fast:MOTION_DURATION.exit}}}
    aria-label={project.title} aria-hidden={!present} {...(!present?{inert:''}:{})} data-project-id={present?project.id:undefined} onClick={onOpen}>
    <motion.span className="canvas-project-list-visual" data-presentation={image.presentation} layout={visualId?"preserve-aspect":false} layoutId={visualId} transition={{duration:MOTION_DURATION.reveal,ease:MOTION_EASE_ENTER}}><img src={image.src} alt="" loading="lazy" decoding="async"/></motion.span>
    <span className="canvas-project-list-copy"><strong>{evidenceFor(project.id)?.title??project.title}</strong><span>{project.year}</span>{section>=0&&<small>{project.sections[section].heading}</small>}</span><ArrowUpRight size={18} aria-hidden="true"/>
  </motion.button>;
});

export function RoleExplorer({block,onChange}:LayoutProps){
  const [selected,setSelected]=useState(experienceEntries[0].id);
  const [filter,setFilter]=useState('');
  const entries=experienceEntries.filter(e=>(e.organization+' '+e.role+' '+e.focus.join(' ')).toLowerCase().includes(filter.toLowerCase()));
  const entry=entries.find(e=>e.id===selected)??entries[0];
  return <section aria-label="Role explorer"><h2>Experience</h2><label className="canvas-field"><span className="sr-only">Filter roles</span><input type="search" value={filter} onChange={e=>{setFilter(e.target.value);onChange(block);}} placeholder="Filter roles or skills"/></label><div className="canvas-process"><div className="canvas-role-list">{entries.map(e=><button aria-pressed={entry?.id===e.id} key={e.id} onClick={()=>{setSelected(e.id);onChange(block);}}><strong>{e.organization}</strong><small>{e.period}</small></button>)}</div>{entry?<article className="canvas-surface"><h3>{entry.role}</h3><p className="canvas-caption">{entry.period}</p>{entry.paragraphs.map(p=><p key={p}>{p}</p>)}<div className="canvas-tags">{entry.focus.map(f=><span key={f}>{f}</span>)}</div></article>:<p>No matching roles.</p>}</div></section>;
}


// Compatibility exports stay importable without loading unused utilities with
// the homepage. Live exploration never asks for these component kinds.
const LegacyPhotos=/* @__PURE__ */lazy(()=>import('./LegacyExplorationViews').then(module=>({default:module.PhotoLayouts})));
const LegacySession=/* @__PURE__ */lazy(()=>import('./LegacyExplorationViews').then(module=>({default:module.SessionSequence})));
export function PhotoLayouts(props:LayoutProps){return <Suspense fallback={<p role="status">Opening saved view…</p>}><LegacyPhotos {...props}/></Suspense>;}
export function SessionSequence(props:LayoutProps){return <Suspense fallback={<p role="status">Opening saved view…</p>}><LegacySession {...props}/></Suspense>;}
