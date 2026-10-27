import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useAnimate, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ArrowUpRight } from 'lucide-react';
import { publicProjects, projectSources, albums, albumPhotos, experienceEntries, type Plan } from '@/lib/canvas';
import { POLICY_ID, TAIWAN_ID, type Composition, type CanvasBlock } from '@/lib/genui';
import { aiIndexSources } from '@/lib/aiStateGovIndex';
import { CONTACT_MAILTO, LINKEDIN_URL, GITHUB_URL } from '@/lib/site';
import BenchmarkExplorer from './BenchmarkExplorer';
import { PhotoLayouts, ProjectIndex, SessionSequence } from './LayoutViews';
import { AI_LAYOUTS, defaultLayout, type LayoutId } from '@/lib/layouts';
import { withLayout } from '@/lib/genui';
import { ProjectStory, ProjectComparison, CareerExplorer } from './PortfolioViews';
import ViewCompositionControls from './ViewCompositionControls';
import { applyPortfolioAction, createPortableView, type PortfolioAction } from '@/lib/portfolioView';

type BlockProps={block:CanvasBlock;onChange:(block:CanvasBlock)=>void};
export type GenerationInfo={status:'authored'|'composing'|'generated'|'unavailable';model?:string;duration?:number;reason?:string;cached?:boolean;inputTokens?:number;outputTokens?:number};
function PhotoExplorer({block,onChange}:BlockProps) {
  const [expanded,setExpanded]=useState(false);
  const album=albums.find(a=>a.folder===block.albumIds[0])??albums[0];
  const photos=albumPhotos(album);
  const current=block.section%photos.length;
  const filmstripStart=Math.floor(current/12)*12;
  const move=(delta:number)=>onChange({...block,section:(current+delta+photos.length)%photos.length});
  return <section aria-label="Photo explorer" className="canvas-photo-explorer">
    <div className="canvas-toolbar"><label><span>Collection</span><select aria-label="Photo collection" value={album.folder} onChange={e=>{onChange({...block,albumIds:[e.target.value],section:0});}}>{albums.map(a=><option value={a.folder} key={a.folder}>{a.location}</option>)}</select></label><div className="canvas-photo-navigation"><button aria-label="Previous photograph" onClick={()=>move(-1)}><ChevronLeft size={18}/></button><span>{current+1} / {photos.length}</span><button aria-label="Next photograph" onClick={()=>move(1)}><ChevronRight size={18}/></button><button aria-label={expanded?'Reduce photograph':'Expand photograph'} onClick={()=>{setExpanded(!expanded);onChange(block);}}>{expanded?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button></div></div>
    <button className={`canvas-photo-main${expanded?' is-expanded':''}`} aria-label="Toggle photograph size" onClick={()=>{setExpanded(!expanded);onChange(block);}}><img src={photos[current]} alt={`${album.location} photograph ${current+1}`}/></button>
    <div className="canvas-filmstrip" aria-label="Choose photograph">{photos.slice(filmstripStart,filmstripStart+12).map((src,offset)=>{const i=filmstripStart+offset;return <button key={src} aria-label={`Photograph ${i+1}`} aria-pressed={i===current} onClick={()=>onChange({...block,section:i})}><img src={src} loading="lazy" alt=""/></button>;})}</div>
  </section>;
}

function Workshop({block,onChange}:BlockProps) {
  const [topic,setTopic]=useState('');
  const [audience,setAudience]=useState('Secondary students');
  const [copied,setCopied]=useState(false);
  const tasks=['Plan a lesson','Give feedback','Practice a language'];
  const task=Math.min(block.section,2);
  const subject=topic.trim()||'a topic I will provide';
  const prompts=[
    `Help me plan a lesson about ${subject} for ${audience.toLowerCase()}. Ask about prior knowledge and lesson length first. Suggest one learning objective, an activity, and a way to check understanding. Keep the teacher in control of the final plan.`,
    `Help me give useful feedback on ${subject} for ${audience.toLowerCase()}. Ask for the assignment criteria and an anonymized sample first. Identify one strength, one question, and one next step. Do not rewrite the student's work or invent a grade.`,
    `Help ${audience.toLowerCase()} practice ${subject}. Ask which language and proficiency level first. Create a short conversation, wait for each reply, and offer one correction at a time. Adapt the next turn to the learner.`,
  ];
  const edit=()=>{setCopied(false);onChange(block);};
  return <section aria-label="Teaching workflow builder"><h2>{['Plan a lesson','Give useful feedback','Practice a language'][task]}</h2><p className="canvas-caption">Illustrative workflow · edit to suit your class.</p><div className="canvas-segments">{tasks.map((label,i)=><button key={label} aria-pressed={task===i} onClick={()=>{setCopied(false);onChange({...block,section:i,layout:(['teaching-lesson','teaching-feedback','teaching-language'] as const)[i]});}}>{label}</button>)}</div><div className="canvas-workshop-inputs"><label><span>Topic or learning objective</span><input aria-label="Teaching topic" value={topic} placeholder="e.g. explaining fractions" maxLength={180} onChange={e=>{setTopic(e.target.value);edit();}}/></label><label><span>Audience</span><select aria-label="Teaching audience" value={audience} onChange={e=>{setAudience(e.target.value);edit();}}>{['Primary students','Secondary students','University students','Adult learners'].map(v=><option key={v}>{v}</option>)}</select></label></div><div className="canvas-workshop-output"><span className="canvas-eyebrow">Your starting prompt</span><p>{prompts[task]}</p><button className="canvas-text-button" onClick={async()=>{try{await navigator.clipboard.writeText(prompts[task]);setCopied(true);}catch{setCopied(false);}}}>{copied?'Copied':'Copy prompt'}</button></div></section>;
}

function Timeline({block,onChange}:BlockProps) {
  const filters=['All','AI & education','Communications'];
  const filter=filters[block.section]??'All';
  const entries=experienceEntries.filter(e=>filter==='All'||(filter==='AI & education'?/ai|research|teach|fulbright/i.test(e.role+' '+e.organization):/communicat|director|consult/i.test(e.role)));
  return <section aria-label="Experience explorer"><div className="canvas-heading"><h2>Experience</h2></div><div className="canvas-segments">{filters.map((f,i)=><button key={f} aria-pressed={filter===f} onClick={()=>onChange({...block,section:i})}>{f}</button>)}</div><div className="canvas-timeline">{entries.map(e=><article key={e.id}><small>{e.period}</small><div><h3>{e.organization}</h3><p>{e.role}</p></div></article>)}</div></section>;
}
function Architecture({block,onChange,plan,generation}:BlockProps&{plan:Plan;generation:GenerationInfo}) {
  const selected=Math.min(block.section,3);
  const steps=[{title:'Understand',body:plan.source==='jev'?'Jev selected relevant content and an interface direction for this request.':'Local matching selected an interface direction for this request.',value:plan.source==='jev'?plan.model??'Jev':'Local matching'},{title:'Retrieve',body:'The interface uses published project sections, and the dated state benchmark. Each visible fact comes from these records.',value:'Published content'},{title:'Compose',body:generation.status==='generated'?'An LLM composed these interactive modules from a bounded component library.':'An authored composition is currently displayed. LLM composition is used when its service is configured and succeeds.',value:generation.status==='generated'?generation.model??'LLM':'Authored composition'},{title:'Interact',body:'Change a measure, compare governments, or refine your request. Controls update immediately; the next request receives the current view.',value:'React components'}];
  return <section className="canvas-architecture" aria-label="Live interface architecture"><span className="canvas-eyebrow">This request</span><h2>How this interface works</h2><div className="canvas-flow">{steps.map((s,i)=><button key={s.title} aria-pressed={i===selected} onClick={()=>onChange({...block,section:i})}><span>{String(i+1).padStart(2,'0')}</span><strong>{s.title}</strong><ChevronRight size={16}/></button>)}</div><div className="canvas-flow-detail"><span className="canvas-eyebrow">{steps[selected].value}</span><h3>{steps[selected].title}</h3><p>{steps[selected].body}</p></div></section>;
}
function SelectionModule({block,children}:{block:CanvasBlock;children:ReactNode}) {
  const [scope,animate]=useAnimate<HTMLDivElement>();
  const reduceMotion=useReducedMotion();
  // Search updates stay immediate. Keep the subtree mounted so focus, disclosures,
  // and local controls survive a selection change.
  const selection=JSON.stringify({...block,search:undefined});
  const previous=useRef(selection);
  useLayoutEffect(()=>{
    if(previous.current===selection)return;
    previous.current=selection;
    const node=scope.current;
    if(!node||reduceMotion)return;
    const style=getComputedStyle(node);
    const duration=style.getPropertyValue('--motion-duration').trim();
    const curve=style.getPropertyValue('--motion-easing').match(/[\d.]+/g)?.map(Number);
    const animation=animate(node,{opacity:[0,1]},{
      duration:parseFloat(duration)/(duration.endsWith('ms')?1000:1),
      ease:curve?.length===4?curve as [number,number,number,number]:'easeOut',
    });
    return ()=>{animation.stop();node.style.opacity='';};
  },[selection,reduceMotion,animate,scope]);
  return <div ref={scope} className="canvas-module" data-layout={block.layout??defaultLayout[block.kind]}>{children}</div>;
}

export default function ExplorationCanvas({composition,plan,generation,onChange,onAction}:{composition:Composition;plan:Plan;generation:GenerationInfo;onChange:(c:Composition)=>void;onAction?:(action:PortfolioAction)=>void}) {
  const career=composition.blocks.find(block=>block.kind==='timeline');
  const role=career?experienceEntries.find(entry=>entry.id===career.roleId)??experienceEntries[0]:null;
  const ids=[...new Set(composition.blocks.flatMap(b=>b.kind==='benchmark'?[POLICY_ID]:b.kind==='timeline'?(role?.projectIds??[]).filter(id=>publicProjects.some(project=>project.id===id)):b.projectIds))];
  const sources=[...ids.flatMap(id=>id===POLICY_ID?aiIndexSources:projectSources(id)),...(role?[{label:'Published experience',href:'/about'},...(role.organizationUrl?[{label:role.organization,href:role.organizationUrl}]:[])]:[])];
  return <><div className="canvas-modules">{composition.blocks.map((block,i)=><SelectionModule block={block} key={`${i}-${block.kind}`}><CanvasModule block={block} onChange={next=>onChange({blocks:composition.blocks.map((b,n)=>n===i?next:b)})} plan={plan} generation={generation}/>{import.meta.env.DEV&&new URLSearchParams(window.location.search).has('layouts')&&AI_LAYOUTS.filter(l=>l.kind===block.kind).length>1&&<div className="canvas-layout-control"><label><span className="sr-only">View style {i+1}</span><select aria-label={`View style ${i+1}`} value={block.layout??defaultLayout[block.kind]} onChange={e=>onChange({blocks:composition.blocks.map((b,n)=>n===i?withLayout(b,e.target.value as LayoutId):b)})}>{AI_LAYOUTS.filter(l=>l.kind===block.kind).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div>}</SelectionModule>)}</div><details className="canvas-sources"><summary>Sources</summary><div>{sources.filter((s,i,a)=>a.findIndex(v=>v.href===s.href)===i).map(s=><a href={s.href} key={s.href} target="_blank" rel="noreferrer">{s.label}<ArrowUpRight size={12}/></a>)}{ids.map(id=><a key={id} href={`/projects/${id}`}>Full project · {publicProjects.find(p=>p.id===id)?.title}<ArrowUpRight size={12}/></a>)}<p>{plan.source==='jev'?'Jev routing':'Local matching'} · {generation.status==='generated'?`Composed with ${generation.model??'LLM'}`:generation.status==='composing'?'Composing…':generation.status==='unavailable'?generation.reason==='unconfigured'?'Authored view · Mistral is not configured in this environment':'Authored view · Mistral unavailable':'Authored view'}</p>{generation.cached&&<p>Reused a validated composition.</p>}{generation.inputTokens!==undefined&&<p>{generation.inputTokens} input / {generation.outputTokens??0} output tokens</p>}{generation.duration!==undefined&&<p>Composition: {(generation.duration/1000).toFixed(1)}s</p>}</div></details><ViewCompositionControls composition={composition} onAction={onAction??(action=>onChange(applyPortfolioAction(createPortableView(composition),action).composition))}/></>;
}
function CanvasModule(props:BlockProps&{plan:Plan;generation:GenerationInfo}) {
  if(['photo-grid','photo-diptych','photo-collections'].includes(props.block.layout??''))return <PhotoLayouts {...props}/>;
  if(['project-process','project-outcomes','project-evidence'].includes(props.block.layout??''))return <ProjectStory {...props}/>;
  if(props.block.layout==='experience-roles')return <CareerExplorer {...props}/>;
  if(props.block.layout==='teaching-sequence')return <SessionSequence {...props}/>;
  switch(props.block.kind) {
    case 'collection':return <ProjectIndex {...props}/>;
    case 'benchmark':return <BenchmarkExplorer {...props}/>;
    case 'photos':return <PhotoExplorer {...props}/>;
    case 'story':return <ProjectStory {...props}/>;
    case 'workshop':return <Workshop {...props}/>;
    case 'comparison':return <ProjectComparison {...props}/>;
    case 'timeline':return <CareerExplorer {...props}/>;
    case 'architecture':return <Architecture {...props}/>;
    case 'contact':return <section className="portfolio-contact" aria-label="Contact"><h2>Get in touch</h2><a href={CONTACT_MAILTO}>Email<ArrowUpRight size={18} aria-hidden="true"/></a><a href={LINKEDIN_URL}>LinkedIn<ArrowUpRight size={18} aria-hidden="true"/></a><a href={GITHUB_URL}>GitHub<ArrowUpRight size={18} aria-hidden="true"/></a></section>;
  }
}
