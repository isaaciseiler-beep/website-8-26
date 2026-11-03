import { lazy, Suspense, type ReactNode } from 'react';
import { useEvidenceTransition } from '@/hooks/useEvidenceTransition';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { type Plan } from '@/lib/canvas';
import { type Composition, type CanvasBlock } from '@/lib/genui';
import { CONTACT_EMAIL, CONTACT_MAILTO, LINKEDIN_URL, GITHUB_URL } from '@/lib/site';
import BenchmarkExplorer from './BenchmarkExplorer';
import { ProjectIndex } from './LayoutViews';
import { AI_LAYOUTS, defaultLayout, type LayoutId } from '@/lib/layouts';
import { withLayout } from '@/lib/genui';
import { ProjectStory, ProjectComparison, CareerExplorer } from './PortfolioViews';
import ViewCompositionControls from './ViewCompositionControls';
import { applyPortfolioAction, createPortableView, type PortfolioAction } from '@/lib/portfolioView';

type BlockProps={block:CanvasBlock;onChange:(block:CanvasBlock)=>void};
export type GenerationInfo={status:'authored'|'composing'|'generated'|'unavailable';model?:string;duration?:number;reason?:string;cached?:boolean;inputTokens?:number;outputTokens?:number};
function Architecture({block,onChange,plan,generation}:BlockProps&{plan:Plan;generation:GenerationInfo}) {
  const selected=Math.min(block.section,3);
  const steps=[{title:'Understand',body:plan.source==='jev'?'Jev selected relevant content and an interface direction for this request.':'Local matching selected an interface direction for this request.',value:plan.source==='jev'?plan.model??'Jev':'Local matching'},{title:'Retrieve',body:'The interface uses published project sections, and the dated state benchmark. Each visible fact comes from these records.',value:'Published content'},{title:'Compose',body:generation.status==='generated'?'An LLM composed these interactive modules from a bounded component library.':'An authored composition is currently displayed. LLM composition is used when its service is configured and succeeds.',value:generation.status==='generated'?generation.model??'LLM':'Authored composition'},{title:'Interact',body:'Change a measure, compare governments, or refine your request. Controls update immediately; the next request receives the current view.',value:'React components'}];
  return <section className="canvas-architecture editorial-flow" aria-label="Live interface architecture"><h2 className="sr-only">How this interface works</h2><div className="canvas-flow">{steps.map((s,i)=><button key={s.title} aria-pressed={i===selected} onClick={()=>onChange({...block,section:i})}><span>{String(i+1).padStart(2,'0')}</span><strong>{s.title}</strong><ChevronRight size={16}/></button>)}</div><div className="canvas-flow-detail"><h3 className="sr-only">{steps[selected].title}</h3><p>{steps[selected].body}</p></div></section>;
}
const LegacyExplorationViews=lazy(()=>import('./LegacyExplorationViews'));
function SelectionModule({block,children}:{block:CanvasBlock;children:ReactNode}) {
  // The shell owns first arrival. Only changed evidence gets refinement motion;
  // typing a local search never dims the answer or replaces its mounted subtree.
  const scope=useEvidenceTransition(JSON.stringify({...block,search:undefined}));
  return <div ref={scope} className="canvas-module" data-layout={block.layout??defaultLayout[block.kind]}>{children}</div>;
}
function LegacyModule(props:BlockProps) {
  return <Suspense fallback={<p role="status">Opening saved view…</p>}><LegacyExplorationViews {...props}/></Suspense>;
}

export default function ExplorationCanvas({composition,plan,generation,onChange,onAction}:{composition:Composition;plan:Plan;generation:GenerationInfo;onChange:(c:Composition)=>void;onAction?:(action:PortfolioAction)=>void}) {
  const reviewing=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('layouts');
  return <><div className="canvas-modules">{composition.blocks.map((block,i)=><SelectionModule block={block} key={`${i}-${block.kind}`}><CanvasModule block={block} onChange={next=>onChange({blocks:composition.blocks.map((b,n)=>n===i?next:b)})} plan={plan} generation={generation}/>{reviewing&&AI_LAYOUTS.filter(l=>l.kind===block.kind).length>1&&<div className="canvas-layout-control"><label><span className="sr-only">View style {i+1}</span><select aria-label={`View style ${i+1}`} value={block.layout??defaultLayout[block.kind]} onChange={e=>onChange({blocks:composition.blocks.map((b,n)=>n===i?withLayout(b,e.target.value as LayoutId):b)})}>{AI_LAYOUTS.filter(l=>l.kind===block.kind).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div>}</SelectionModule>)}</div>{reviewing&&<ViewCompositionControls composition={composition} onAction={onAction??(action=>onChange(applyPortfolioAction(createPortableView(composition),action).composition))}/>}</>;
}
function CanvasModule(props:BlockProps&{plan:Plan;generation:GenerationInfo}) {
  if(['photo-grid','photo-diptych','photo-collections'].includes(props.block.layout??''))return <LegacyModule {...props}/>;
  if(['project-process','project-outcomes','project-evidence'].includes(props.block.layout??''))return <ProjectStory {...props}/>;
  if(props.block.layout==='experience-roles')return <CareerExplorer {...props}/>;
  if(props.block.layout==='teaching-sequence')return <LegacyModule {...props}/>;
  switch(props.block.kind) {
    case 'collection':return <ProjectIndex {...props}/>;
    case 'benchmark':return <BenchmarkExplorer {...props}/>;
    case 'photos':return <LegacyModule {...props}/>;
    case 'story':return <ProjectStory {...props}/>;
    case 'workshop':return <LegacyModule {...props}/>;
    case 'comparison':return <ProjectComparison {...props}/>;
    case 'timeline':return <CareerExplorer {...props}/>;
    case 'architecture':return <Architecture {...props}/>;
    case 'contact':return <section className="portfolio-contact editorial-contact" aria-label="Contact"><h2 className="sr-only">Get in touch</h2><a href={CONTACT_MAILTO} aria-label="Email" title={CONTACT_EMAIL}><span>Email<small>{CONTACT_EMAIL}</small></span><ArrowUpRight size={18} aria-hidden="true"/></a><a href={LINKEDIN_URL}>LinkedIn<ArrowUpRight size={18} aria-hidden="true"/></a><a href={GITHUB_URL}>GitHub<ArrowUpRight size={18} aria-hidden="true"/></a></section>;
  }
}
