import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, useInView, useIsPresent } from 'framer-motion';
import { ArrowUp, ArrowLeft, ArrowUpRight, LoaderCircle, X } from 'lucide-react';
import { initialPlan, publicProjects, albums, CONTENT_VERSION, type Plan } from '@/lib/canvas';
import { isPhotographyRequest, explorationGuidance, composeLocal, resolveCanvasPlan, validateComposition, presetComposition, type Composition } from '@/lib/genui';
import ExperienceAutocomplete from './ExperienceAutocomplete';
import ExplorationCanvas, { type GenerationInfo } from './ExplorationCanvas';
import './home-explore.css';
import { AI_LAYOUTS, type LayoutId } from '@/lib/layouts';

const suggestions=[
  'How did Isaac map AI in government?',
  'What did Isaac build in Taiwan?',
  'What was Isaac’s role in Congress?',
  'Walk me through Isaac’s experience',
].map(label=>({label,prompt:label}));
const reviewMode=import.meta.env.DEV&&new URLSearchParams(window.location.search).has('layouts');
const layouts=new Set(['overview','work','detail','comparison','photos','mixed','architecture','contact','timeline','writing','empty']);
function validIntentPlan(plan:Plan,revision:number):boolean {
  return Boolean(plan&&plan.revision===revision&&plan.contentVersion===CONTENT_VERSION&&layouts.has(plan.layout)&&['local','jev'].includes(plan.source)&&Array.isArray(plan.projectIds)&&plan.projectIds.length<=10&&plan.projectIds.every(id=>publicProjects.some(p=>p.id===id))&&Array.isArray(plan.albumIds)&&plan.albumIds.length<=16&&plan.albumIds.every(id=>albums.some(a=>a.folder===id)));
}
type View={plan:Plan;composition:Composition;query:string;generation:GenerationInfo};
function ExplorationReveal({children}:{children:ReactNode}) {
  const present=useIsPresent();
  const reduceMotion=useReducedMotion();
  const content=useRef<HTMLDivElement>(null);
  const [height,setHeight]=useState(0);
  useLayoutEffect(()=>{
    const node=content.current;if(!node)return;
    const measure=()=>setHeight(node.getBoundingClientRect().height);
    measure();const observer=new ResizeObserver(measure);observer.observe(node);
    return()=>observer.disconnect();
  },[]);
  return <motion.div className="home-genui-reveal" aria-hidden={!present} {...(!present?{inert:''}:{})}
    initial={{height:0,opacity:0}} animate={{height,opacity:1}} exit={{height:0,opacity:0}}
    transition={{height:{duration:reduceMotion?0:.46,ease:[.22,1,.36,1]},opacity:{duration:reduceMotion ? 0 : present ? 0.24 : 0.14}}}>
    <div ref={content} className="home-genui-reveal-content">{children}</div>
  </motion.div>;
}
export default function HomeExplore() {
  const reduceMotion=useReducedMotion();
  const composerRef=useRef<HTMLDivElement>(null);
  const composerInView=useInView(composerRef,{amount:0.1});
  const [pageVisible,setPageVisible]=useState(()=>!document.hidden);
  useEffect(()=>{
    const updateVisibility=()=>setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange',updateVisibility);
    return()=>document.removeEventListener('visibilitychange',updateVisibility);
  },[]);
  const [composerHovered,setComposerHovered]=useState(false);
  const [explorationFocused,setExplorationFocused]=useState(false);
  const [suggestion,setSuggestion]=useState(0);
  const [paused,setPaused]=useState(false);
  const [query,setQuery]=useState('');
  const [autocompleteOpen,setAutocompleteOpen]=useState(false);
  const [immediateDismiss,setImmediateDismiss]=useState(false);
  const [guidance,setGuidance]=useState<'welcome'|'unmatched'|null>(null);
  const [composing,setComposing]=useState(false);
  const [view,setView]=useState<View|null>(null);
  const [heldExpanded,setHeldExpanded]=useState(false);
  useEffect(()=>{if(view)setHeldExpanded(true);else if(guidance)setHeldExpanded(false);},[view,guidance]);
  const [busy,setBusy]=useState(false);
  const [phase,setPhase]=useState('Routing…');
  const [reviewLayout,setReviewLayout]=useState<LayoutId>('benchmark-compare');
  const [history,setHistory]=useState<View[]>([]);
  const revision=useRef(0);
  const current=useRef<View|null>(null);
  const controller=useRef<AbortController>();
  const input=useRef<HTMLInputElement>(null);
  const llmConfigured=useRef(false);
  const update=(next:View|null)=>{current.current=next;setView(next);};
  const revealStart=()=>{
    const node=composerRef.current;
    if(node&&node.getBoundingClientRect().top<48)node.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'});
  };
  useEffect(()=>{if(reviewMode){const prompt=AI_LAYOUTS.find(l=>l.id==='benchmark-compare')!.prompt;setQuery(prompt);update({query:prompt,plan:resolveCanvasPlan(prompt,initialPlan(),0),composition:presetComposition('benchmark-compare'),generation:{status:'authored'}});}},[]);
  useEffect(()=>{
    if(query.trim()||reduceMotion||paused||!composerInView||!pageVisible)return;
    const interval=setInterval(()=>{if(!document.hidden)setSuggestion(i=>(i+1)%suggestions.length);},5600);
    return()=>clearInterval(interval);
  },[query,reduceMotion,paused,composerInView,pageVisible]);
  useEffect(()=>{
    const abort=new AbortController();
    void fetch('/api/compose',{signal:abort.signal}).then(r=>r.json()).then(data=>{llmConfigured.current=Boolean(data.configured);}).catch(()=>{});
    return()=>{abort.abort();controller.current?.abort();};
  },[]);
  function cancel(){controller.current?.abort();setBusy(false);if(current.current?.generation.status==='composing')update({...current.current,generation:{status:'authored'}});return ++revision.current;}
  function clear(){cancel();setImmediateDismiss(true);setQuery('');setGuidance(null);setHistory([]);update(null);input.current?.focus();setAutocompleteOpen(false);}
  async function resolve(text:string,rev:number,allowModel=false){
    const context=current.current;
    setGuidance(null);
    const fallback=resolveCanvasPlan(text,context?.plan??initialPlan(),rev,context?.composition);
    if(isPhotographyRequest(text,fallback)){setBusy(false);return;}
    if(context&&context.query!==text)setHistory(h=>[...h.slice(-9),context]);
    const nextGuidance=explorationGuidance(text);
    if(nextGuidance){setGuidance(nextGuidance);update(null);setBusy(false);return;}

    const abort=new AbortController();controller.current=abort;setBusy(true);setPhase('Finding a view…');
    const live=()=>!abort.signal.aborted&&revision.current===rev;
    let next:View={plan:fallback,composition:composeLocal(text,fallback,context?.composition),query:text,generation:{status:'authored'}};
    if(fallback.layout!=='empty')update(next);else update(null);
    let needsComposition=true;
    const simpleRefinement=Boolean(context?.composition.blocks.some(b=>b.kind==='benchmark'))&&/^(?:use |only |show )?(preparedness|composite|all states|midwest|east|south|west)(?: score)?[.!?]?$/i.test(text.trim());
    if(simpleRefinement){setBusy(false);return;}
    try {
      try {
        const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([abort.signal,AbortSignal.timeout(6500)]),body:JSON.stringify({draft:text,composition:context?.composition,current:context?.plan??initialPlan(),pins:context?.composition.blocks.flatMap(b=>b.projectIds).slice(0,2)??[],filter:'All',revision:rev,contentVersion:CONTENT_VERSION})});
        const data=await response.json();
        if(live()&&response.ok&&(data.guidance==='welcome'||data.guidance==='unmatched')){setGuidance(data.guidance);update(null);return;}
        if(response.ok&&validIntentPlan(data.plan,rev)) {
          const plan:Plan=data.plan;
          next={...next,plan,composition:validateComposition(data.composition)??composeLocal(text,plan,context?.composition)};
          needsComposition=data.needsComposition!==false;
        }
      } catch { /* Keep the authored view when routing is unavailable. */ }
      if(!live())return;
      if(next.plan.layout!=='empty')update(next);
      if(!allowModel||!needsComposition)return;
      if(!llmConfigured.current){if(next.plan.layout==='empty'){setGuidance('unmatched');update(null);}else update({...next,generation:{status:'unavailable',reason:'unconfigured'}});return;}
      setPhase('Preparing your view…');
      next={...next,generation:{status:'composing'}};if(next.plan.layout!=='empty')update(next);
      const response=await fetch('/api/compose',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([abort.signal,AbortSignal.timeout(22000)]),body:JSON.stringify({draft:text,revision:rev,contentVersion:CONTENT_VERSION,current:context?.composition??next.composition,proposed:next.composition})});
      if(!response.ok)throw new Error('Composition unavailable');
      if(!response.headers.get('content-type')?.includes('ndjson')) {const data=await response.json();if(data.status==='unsupported'){if(live()){setGuidance('unmatched');update(null);}return;}next={...next,generation:{status:'unavailable',reason:typeof data.reason==='string'?data.reason:'unconfigured'}};if(live()){if(next.plan.layout==='empty'){setGuidance('unmatched');update(null);}else update(next);}return;}
      const reader=response.body?.getReader();if(!reader)throw new Error('No stream');
      const decoder=new TextDecoder();let buffer='';let completed=false;
      const accept=(line:string)=>{
        if(!line.trim()||!live())return;
        const event=JSON.parse(line);
        if(event.revision!==rev||event.contentVersion!==CONTENT_VERSION)return;
        if(event.type==='guidance'&&event.guidance==='unmatched'){completed=true;setGuidance('unmatched');update(null);return;}
        if(event.type==='unavailable'){next={...next,generation:{status:'unavailable',reason:typeof event.reason==='string'?event.reason:'provider_unavailable'}};throw new Error('Composition unavailable');}
        const spec=event.type==='composition'?validateComposition(event.composition):null;
        if(spec&&!event.partial){completed=true;next={...next,composition:spec,generation:{status:event.partial?'composing':'generated',model:typeof event.model==='string'?event.model:undefined,duration:typeof event.duration==='number'?event.duration:undefined,cached:event.cached===true,inputTokens:typeof event.inputTokens==='number'?event.inputTokens:undefined,outputTokens:typeof event.outputTokens==='number'?event.outputTokens:undefined}};update(next);}
      };
      try {while(live()){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()??'';lines.forEach(accept);}if(buffer.trim())accept(buffer);if(live()&&!completed)throw new Error('Incomplete composition');} finally {await reader.cancel().catch(()=>{});}
    } catch {if(live()){if(next.plan.layout==='empty'){setGuidance('unmatched');update(null);}else update({...next,generation:{...next.generation,status:'unavailable'}});}} finally {if(live())setBusy(false);}
  }
  const submit=(text:string)=>{if(composing||!text.trim()||(busy&&current.current?.query===text))return;const rev=cancel();setImmediateDismiss(true);setAutocompleteOpen(false);setQuery(text.trim());void resolve(text.trim(),rev,true);};
  const goBack=()=>{cancel();setGuidance(null);setImmediateDismiss(true);setAutocompleteOpen(false);const previous=history.at(-1);if(!previous)return;setQuery(previous.query);update(previous);setHistory(history.slice(0,-1));revealStart();};
  const changeComposition=(composition:Composition)=>{
    cancel();if(!current.current)return;
    const previous=current.current;
    const opensSubject=previous.composition.blocks.some((block,i)=>block.kind!==composition.blocks[i]?.kind||(block.kind==='story'&&block.projectIds[0]!==composition.blocks[i]?.projectIds[0]));
    if(opensSubject){setHistory(h=>[...h.slice(-9),previous]);revealStart();}
    const ids=composition.blocks.flatMap(b=>b.projectIds);const albumIds=composition.blocks.flatMap(b=>b.albumIds);
    update({...previous,composition,plan:{...previous.plan,projectIds:ids.length?ids:previous.plan.projectIds,albumIds:albumIds.length?albumIds:previous.plan.albumIds},generation:{...previous.generation,status:previous.generation.status==='composing'?'authored':previous.generation.status}});
  };
  const recessActive=composerHovered||explorationFocused||Boolean(view||guidance)||busy;
  return <section id="home-genui" className={`home-genui photos-shell${!view?' is-idle':''}`} aria-label="Interactive exploration">
    <div className={`home-genui-window${view||heldExpanded?' has-results':guidance?' has-guidance':''}${recessActive?' is-engaged':''}`} onPointerEnter={e=>{if(e.pointerType!=='touch')setComposerHovered(true);}} onPointerLeave={()=>setComposerHovered(false)} onFocusCapture={()=>setExplorationFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setExplorationFocused(false);}}>
      <motion.div className="home-window-depth" aria-hidden="true" initial={false} animate={{opacity:recessActive ? .18 : 0}} transition={{duration:reduceMotion?0:.3,ease:[.22,1,.36,1]}}/>


      {reviewMode&&<div className="canvas-review"><label htmlFor="layout-review">Layout review · {AI_LAYOUTS.length} authored views</label><select id="layout-review" value={reviewLayout} onChange={e=>{const id=e.target.value as LayoutId;setReviewLayout(id);cancel();const recipe=AI_LAYOUTS.find(l=>l.id===id)!;setQuery(recipe.prompt);update({query:recipe.prompt,plan:resolveCanvasPlan(recipe.prompt,initialPlan(),revision.current),composition:presetComposition(id),generation:{status:'authored'}});}}>{AI_LAYOUTS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>}<div ref={composerRef} className="home-genui-composer">

        <form onSubmit={e=>{e.preventDefault();if(!composing&&query.trim())submit(query);}}>
        <ExperienceAutocomplete inputRef={input} value={query} open={autocompleteOpen} immediateDismiss={immediateDismiss} onOpenChange={open=>{if(open)setImmediateDismiss(false);setAutocompleteOpen(open);}} onSubmit={submit} onChange={value=>{cancel();setQuery(value);}} onCompositionStart={()=>{cancel();setComposing(true);}} onCompositionEnd={()=>{cancel();setComposing(false);}}/>
        {(query.trim()||view||guidance)&&<><button className="home-clear" type="button" onClick={clear} aria-label="Clear exploration"><X size={16}/></button><button className="home-submit" type="submit" disabled={composing||!query.trim()} aria-label="Explore" aria-busy={busy}>{busy?<LoaderCircle size={17} className="home-submit-spinner"/>:<ArrowUp size={17}/>}</button></>}
      </form></div>
      {!query.trim()&&!view&&!guidance&&!autocompleteOpen&&<div className="home-genui-suggestion" onPointerEnter={()=>setPaused(true)} onPointerLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
        <button type="button" aria-label={suggestions[suggestion].label} onClick={()=>{submit(suggestions[suggestion].prompt);}}>
          <span className="home-suggestion-viewport" aria-hidden="true">
            {suggestions.map(item=><span className="home-suggestion-size" key={item.label}>{item.label}</span>)}
            <AnimatePresence initial={false}>
              <motion.span className="home-suggestion-label" key={suggestion} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduceMotion?0:.55,ease:[.22,1,.36,1]}}>{suggestions[suggestion].label}</motion.span>
            </AnimatePresence>
          </span>
          <ArrowUpRight size={13} aria-hidden="true"/>
        </button>
      </div>}
      {view&&query!==view.query&&<p className="home-draft-hint">Press Enter to update</p>}
      <AnimatePresence initial={false} onExitComplete={()=>setHeldExpanded(false)}>
        {(view||guidance)&&<ExplorationReveal key="exploration-panel">
          <div className="home-genui-stage" aria-label="Exploration results" aria-busy={busy}>
            <div className={`home-genui-tools${!history.length?' is-empty':''}`}>{history.length>0&&<button aria-label="Back" onClick={goBack}><ArrowLeft size={15}/>Back</button>}<span role="status" className="sr-only">{busy?phase:view?.generation.status==='unavailable'?'Interactive view · AI unavailable':''}</span></div>
            {guidance?<div className="home-entry" aria-label="Choose a starting point">
              <p>{guidance==='welcome'?'Hi. What would you like to explore?':'Try one of these starting points.'}</p>
              <div>{[{label:'Explore the work',prompt:'Explore all projects'},{label:'AI in government',prompt:suggestions[0].prompt},{label:'Career & experience',prompt:'Explore Isaac’s career'}].map(item=><button type="button" key={item.label} onClick={()=>submit(item.prompt)}>{item.label}<ArrowUpRight size={14} aria-hidden="true"/></button>)}</div>
            </div>:view&&<>
              <ExplorationCanvas composition={view.composition} plan={view.plan} generation={view.generation} onChange={changeComposition}/>
            </>}
          </div>
        </ExplorationReveal>}
      </AnimatePresence>
    </div>
  </section>;
}
