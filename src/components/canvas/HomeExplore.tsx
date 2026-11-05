import { useDisclosureMotion } from '@/hooks/useDisclosureMotion';
import { useRouteNavigation } from "@/lib/routeNavigation";
import { MOTION_DURATION, MOTION_EASE_ENTER } from "@/lib/motion";
import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { ArrowUp, ArrowLeft, ArrowRight, Link, Check, LoaderCircle, X } from 'lucide-react';
import { initialPlan, publicProjects, albums, CONTENT_VERSION, type Plan } from '@/lib/canvas';
import { explorationGuidance, isLocalCompositionRefinement, composeLocal, resolveCanvasPlan, validateComposition, presetComposition, type Composition } from '@/lib/genui';
import { photoDestinations, photoRedirectCopy, shouldResolveWithoutModel, type PhotoDestination } from '@/lib/photoRequest';
import PhotoRedirect from './PhotoRedirect';
import ExperienceAutocomplete from './ExperienceAutocomplete';
import ExploreHelp from './ExploreHelp';
import { suggestExperiencePrompts } from '@/lib/experiencePrompts';
import { captureReadingState, restoreReadingState, type ExplorationReadingState } from '@/lib/explorationReadingState';
import { ExplorationFeedback, ExplorationHistory } from './ExplorationJourneyTools';
import ExplorationCanvas, { type GenerationInfo } from './ExplorationCanvas';
import './home-explore.css';
import './explore-journey.css';
import { AI_LAYOUTS, type LayoutId } from '@/lib/layouts';
import { applyPortfolioAction, createPortableView, decodeView, portfolioActionForRequest, travelHistory, viewPlan, viewTitle, viewUrl } from '@/lib/portfolioView';
import { registerPortfolioTools, type BrowserToolRegistry } from '@/lib/portfolioWebMcp';
import { SITE_URL } from '@/lib/site';
import { beginExplorationMetric } from '@/lib/explorationMetrics';
import { analyzePortfolioRequest } from '@/lib/portfolioRequestAnalysis';

const reviewMode=import.meta.env.DEV&&new URLSearchParams(window.location.search).has('layouts');
const layouts=new Set(['overview','work','detail','comparison','photos','mixed','architecture','contact','timeline','writing','empty']);
function validIntentPlan(plan:Plan,revision:number):boolean {
  return Boolean(plan&&plan.revision===revision&&plan.contentVersion===CONTENT_VERSION&&layouts.has(plan.layout)&&['local','jev'].includes(plan.source)&&Array.isArray(plan.projectIds)&&plan.projectIds.length<=10&&plan.projectIds.every(id=>publicProjects.some(p=>p.id===id))&&Array.isArray(plan.albumIds)&&plan.albumIds.length<=16&&plan.albumIds.every(id=>albums.some(a=>a.folder===id)));
}
type View={plan:Plan;composition:Composition;query:string;generation:GenerationInfo;returnToExploration?:View;readingState?:ExplorationReadingState};
function returnLabel(view:View):string {
  const block=view.composition.blocks[0];
  return block.kind==='collection'?'Back to projects':block.kind==='comparison'?'Back to comparison':block.kind==='benchmark'?'Back to benchmark':block.answerId==='connections'?'Back to connections':'Back to experience';
}
type Guidance = 'welcome'|'unmatched'|'ambiguous'|'help'|'photos'|null;
type SavedExploration = {readingState?:ExplorationReadingState;query:string;view:View|null;guidance:Guidance;history:View[];future:View[]};
const entryExplorations = new Map<string, SavedExploration>();
function ExplorationReveal({children,restored=false,initialReadingState,onSettled,contentRevision}:{children:ReactNode;restored?:boolean;initialReadingState?:ExplorationReadingState|null;onSettled?:()=>void;contentRevision:number}) {
  const present=useIsPresent();
  const reduceMotion=useReducedMotion();
  const content=useRef<HTMLDivElement>(null);
  const initialReading=useRef(initialReadingState);
  const disclosure=useDisclosureMotion(content,contentRevision,reduceMotion);
  const [height,setHeight]=useState<number|null>(null);
  useLayoutEffect(()=>{
    const node=content.current;if(!node)return;
    // Restore before the first measurement, so a returning open disclosure
    // does not briefly clip to its closed height and then expand again.
    if(initialReading.current)restoreReadingState(node,initialReading.current,false);
    let frame=0;
    const measure=()=>{
      const measured=node.getBoundingClientRect().height;
      // Subpixel wrapping and image decoding can notify repeatedly. Keep one
      // final-width target rather than restarting the fold for rounding noise.
      setHeight(previous=>previous!==null&&Math.abs(previous-measured)<.5?previous:measured);
    };
    measure();const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);});observer.observe(node);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[]);
  return <motion.div className="home-genui-reveal" data-state={present?'open':'closing'} aria-hidden={!present} {...(!present?{inert:''}:{})}
    initial={restored?false:{height:0,opacity:1}} animate={{height:present&&disclosure.following?'auto':height??(restored?'auto':0),opacity:1}} exit={{height:0,opacity:0}}
    onAnimationComplete={onSettled} transition={{height:{duration:reduceMotion||present&&disclosure.following?0:present?MOTION_DURATION.reveal:MOTION_DURATION.panel,ease:MOTION_EASE_ENTER},opacity:{duration:reduceMotion?0:present?MOTION_DURATION.base:MOTION_DURATION.exit,delay:reduceMotion||present?0:MOTION_DURATION.panel-MOTION_DURATION.exit,ease:MOTION_EASE_ENTER}}}>
    <div ref={content} className="home-genui-reveal-content" onClickCapture={disclosure.onClickCapture}>{children}</div>
  </motion.div>;
}
const narrowQuery='(max-width:390px)';
const subscribeNarrow=(notify:()=>void)=>{const media=window.matchMedia(narrowQuery);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
export default function HomeExplore() {
  const narrow=useSyncExternalStore(subscribeNarrow,()=>window.matchMedia(narrowQuery).matches,()=>false);
  const routeNavigation=useRouteNavigation();
  const restored=useRef(routeNavigation?.restoring?entryExplorations.get(routeNavigation.key):undefined).current;
  const reduceMotion=useReducedMotion();
  const composerRef=useRef<HTMLDivElement>(null);
  const resultsRef=useRef<HTMLDivElement>(null);
  const pendingReadingState=useRef<ExplorationReadingState|null>(restored?.readingState??null);
  const requestMetric=useRef<{revision:number;timing:ReturnType<typeof beginExplorationMetric>}|null>(null);
  const pendingResultFocus=useRef<{kind:'heading'}|{kind:'project';id:string}|null>(null);
  const [composerHovered,setComposerHovered]=useState(false);
  const [explorationFocused,setExplorationFocused]=useState(false);
  const [query,setQuery]=useState(restored?.query??'');
  const [autocompleteOpen,setAutocompleteOpen]=useState(false);
  const [immediateDismiss,setImmediateDismiss]=useState(false);
  const [guidance,setGuidance]=useState<Guidance>(restored?.guidance??null);
  const [composing,setComposing]=useState(false);
  const [view,setView]=useState<View|null>(restored?.view??null);
  const [heldExpanded,setHeldExpanded]=useState(Boolean(restored?.view));
  const [revealEpoch,setRevealEpoch]=useState(0);
  // Interrupted exits can finish visually without Presence reporting completion.
  // Recover only a folded pane; never release its width during the vertical fold.
  useEffect(()=>{
    if(view||guidance||!heldExpanded)return;
    let checks=0;
    let timer:ReturnType<typeof setTimeout>;
    const releaseFoldedPane=()=>{
      if(current.current)return;
      const pane=resultsRef.current?.closest('.home-genui-reveal');
      if(pane&&pane.getBoundingClientRect().height>1){
        if(checks++<10)timer=setTimeout(releaseFoldedPane,MOTION_DURATION.exit*1000);
        return;
      }
      setRevealEpoch(epoch=>epoch+1);
      setHeldExpanded(false);
    };
    timer=setTimeout(releaseFoldedPane,reduceMotion?0:(MOTION_DURATION.panel+MOTION_DURATION.exit)*1000);
    return()=>clearTimeout(timer);
  },[view,guidance,heldExpanded,reduceMotion]);
  useLayoutEffect(()=>{
    if(view&&requestMetric.current?.revision===revision.current)requestMetric.current.timing.contentCommitted();
    if(pendingReadingState.current&&resultsRef.current)restoreReadingState(resultsRef.current,pendingReadingState.current,false);
    const pending=pendingResultFocus.current;
    const results=resultsRef.current;
    if(!pending||!results||(!view&&guidance!=='help'))return;
    pendingResultFocus.current=null;
    const target=pending.kind==='project'
      ?[...results.querySelectorAll<HTMLButtonElement>('[data-project-id]')].find(button=>button.dataset.projectId===pending.id)
      :null;
    const heading=results.querySelector<HTMLElement>('h2');
    if(!target&&heading)heading.tabIndex=-1;
    (target??heading)?.focus({preventScroll:true});
  },[view,guidance]);
  // Once the surface opens, keep its width through a guidance response and the
  // entire vertical exit. A new request can reverse that exit without a pinch.
  useEffect(()=>{if(view||guidance==='help')setHeldExpanded(true);},[view,guidance]);
  const [cleared,setCleared]=useState<SavedExploration|null>(null);
  useEffect(()=>{if(!cleared)return;const timer=window.setTimeout(()=>setCleared(null),10000);return()=>clearTimeout(timer);},[cleared]);
  const [busy,setBusy]=useState(false);
  const [phase,setPhase]=useState('Routing…');
  const [waiting,setWaiting]=useState(false);
  const [requestNotice,setRequestNotice]=useState('');
  useEffect(()=>{
    setWaiting(false);
    if(!busy)return;
    const timer=window.setTimeout(()=>setWaiting(true),3000);
    return()=>window.clearTimeout(timer);
  },[busy]);
  // Enter commits the question; subsequent typing starts a fresh follow-up.
  // Keep the native element mounted and allow deliberate caret edits afterward.
  const committedQuery=view?.query;
  useLayoutEffect(()=>{
    const node=input.current;
    if(committedQuery&&node?.value===committedQuery&&document.activeElement===node)node.select();
  },[committedQuery]);
  const [reviewLayout,setReviewLayout]=useState<LayoutId>('benchmark-compare');
  const [history,setHistory]=useState<View[]>(restored?.history??[]);
  const [future,setFuture]=useState<View[]>(restored?.future??[]);
  const [shareStatus,setShareStatus]=useState<'idle'|'copied'|'failed'>('idle');
  const [linkError,setLinkError]=useState('');
  // Per-history-entry, memory-only and bounded; drafts never enter the URL or provider calls.
  useLayoutEffect(()=>{
    if(!routeNavigation)return;
    const savedView=view?.generation.status==='composing'?{...view,generation:{status:'authored' as const}}:view;
    entryExplorations.delete(routeNavigation.key);
    entryExplorations.set(routeNavigation.key,{query,view:savedView,guidance,history,future});
    if(entryExplorations.size>20)entryExplorations.delete(entryExplorations.keys().next().value!);
  },[routeNavigation,query,view,guidance,history,future]);
  const routeKey=routeNavigation?.key;
  useLayoutEffect(()=>{
    if(!routeKey)return;
    return()=>{
      // Capture native disclosure state before the outgoing DOM is removed.
      // The route manager owns page scroll; restoration opens these disclosures
      // before it measures the returning page's available height.
      const saved=entryExplorations.get(routeKey),results=resultsRef.current;
      if(saved&&(saved.view||saved.guidance)&&results)entryExplorations.set(routeKey,{...saved,readingState:captureReadingState(results)});
    };
  },[routeKey]);
  const revision=useRef(0);
  const current=useRef<View|null>(restored?.view??null);
  const browserUrl=useRef<string>();
  const controller=useRef<AbortController>();
  const pendingQuery=useRef<string|null>(null);
  const pendingPrevious=useRef<View|null>(null);
  const input=useRef<HTMLTextAreaElement>(null);
  const quietFocus=useRef(false);
  const llmConfigured=useRef(false);
  const update=useCallback((next:View|null)=>{
    const previous=current.current;
    // Keep the return path while refining the project opened from the explorer.
    if(next&&!next.returnToExploration&&previous?.returnToExploration&&next.composition.blocks.length===1&&previous.composition.blocks.length===1&&next.composition.blocks[0].kind==='story'&&previous.composition.blocks[0].kind==='story'&&next.composition.blocks[0].projectIds[0]===previous.composition.blocks[0].projectIds[0])next={...next,returnToExploration:previous.returnToExploration};
    current.current=next;setView(next);setShareStatus('idle');
  },[]);
  const cancel=useCallback(()=>{controller.current?.abort();pendingReadingState.current=null;requestMetric.current?.timing.finish('cancelled');pendingQuery.current=null;setBusy(false);setRequestNotice('');if(current.current?.generation.status==='composing')update({...current.current,generation:{status:'authored'}});return ++revision.current;},[update]);
  const stopUpdating=()=>{const previous=pendingPrevious.current;cancel();if(!current.current&&previous){setQuery(previous.query);update(previous);}setRequestNotice('Stopped updating.');quietFocus.current=true;input.current?.focus({preventScroll:true});};
  const withReadingState=(previous:View):View=>resultsRef.current?{...previous,readingState:captureReadingState(resultsRef.current)}:previous;
  const remember=(previous:View)=>{const saved=withReadingState(previous);setHistory(h=>[...h.slice(-19),saved]);setFuture([]);};
  const restoreReadingPosition=()=>{
    const results=resultsRef.current;const saved=pendingReadingState.current;if(!results||!saved)return;
    const reveal=results.closest('.home-genui-reveal');const content=results.closest('.home-genui-reveal-content');
    if(reveal&&content&&Math.abs(reveal.getBoundingClientRect().height-content.getBoundingClientRect().height)>1)return;
    pendingReadingState.current=null;restoreReadingState(results,saved);
  };
  const revealStart=()=>{
    const node=composerRef.current;
    if(node&&node.getBoundingClientRect().top<48)node.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'});
  };
  useEffect(()=>{if(reviewMode){const prompt=AI_LAYOUTS.find(l=>l.id==='benchmark-compare')!.prompt;setQuery(prompt);update({query:prompt,plan:resolveCanvasPlan(prompt,initialPlan(),0),composition:presetComposition('benchmark-compare'),generation:{status:'authored'}});}},[update]);
  useEffect(()=>{
    let wasShared=false;
    const restore=(event?:Event)=>{
      if(event?.type==='hashchange'&&browserUrl.current===window.location.href)return;
      browserUrl.current=window.location.href;
      const encoded=new URLSearchParams(window.location.hash.slice(1)).get('view');
      const question=new URLSearchParams(window.location.search).get('q')?.slice(0,500)??'';
      if(!encoded&&photoDestinations(question)){wasShared=false;cancel();setGuidance('photos');setQuery(question);setHistory([]);setFuture([]);setLinkError('');update(null);return;}
      if(!encoded){if((wasShared||event?.type==='popstate')&&!window.location.hash){cancel();setGuidance(null);update(null);setQuery('');setHistory([]);setFuture([]);setLinkError('');}wasShared=false;return;}
      wasShared=true;
      cancel();setGuidance(null);setHistory([]);setFuture([]);
      try {
        const saved=decodeView(encoded);const title=new URLSearchParams(window.location.search).get('q')?.slice(0,500)||viewTitle(saved);setQuery(title);setLinkError('');
        update({query:title,plan:viewPlan(saved,revision.current),composition:saved.composition,generation:{status:'authored'}});
      } catch {update(null);setQuery('');setLinkError('This shared view is unavailable. You can start a new exploration.');}
    };
    if(!restored)restore();window.addEventListener('hashchange',restore);window.addEventListener('popstate',restore);
    return()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);};
  },[cancel,update,restored]);
  const browserControls=useRef<Parameters<typeof registerPortfolioTools>[1]>();
  useEffect(()=>{
    const registry=(document as Document & {modelContext?:BrowserToolRegistry}).modelContext
      ??(navigator as Navigator & {modelContext?:BrowserToolRegistry}).modelContext;
    if(!registry?.registerTool)return;
    return registerPortfolioTools(registry,{
      inspect:()=>browserControls.current!.inspect(),
      apply:input=>browserControls.current!.apply(input),
      travel:input=>browserControls.current!.travel(input),
    });
  },[]);
  useEffect(()=>{
    const abort=new AbortController();
    void fetch('/api/compose',{signal:abort.signal}).then(r=>r.json()).then(data=>{llmConfigured.current=Boolean(data.configured);}).catch(()=>{});
    return()=>{abort.abort();controller.current?.abort();requestMetric.current?.timing.finish('cancelled');};
  },[]);
  function clear(){if(view||guidance||query.trim())setCleared({readingState:!view&&resultsRef.current?captureReadingState(resultsRef.current):undefined,query,view:view?withReadingState(view):null,history,future,guidance});pendingReadingState.current=null;cancel();setImmediateDismiss(true);setQuery('');setGuidance(null);setHistory([]);setFuture([]);setLinkError('');update(null);input.current?.focus({preventScroll:true});setAutocompleteOpen(false);if(window.location.hash.startsWith('#view=')){window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);}saveBrowserView(null,true);}
  const saveBrowserView=(next:View|null,replace=false)=>{
    const url=new URL(window.location.href);
    url.searchParams.delete('q');url.hash='';
    if(next){url.searchParams.set('q',next.query);url.hash=new URL(viewUrl(createPortableView(next.composition),window.location.origin)).hash;}
    browserUrl.current=url.href;
    const state=window.history.state??{};
    if(replace)window.history.replaceState(state,'',url);
    else window.history.pushState({...state,idx:(state.idx??0)+1},'',url);
  };
  const publishQuestion=(text:string)=>{
    const url=new URL(window.location.href);
    url.searchParams.set('q',text);url.hash='';
    browserUrl.current=url.href;
    const state=window.history.state??{};
    window.history.pushState({...state,idx:(state.idx??0)+1},'',url);
  };
  async function resolve(text:string,rev:number,allowModel=false){
    const timing=beginExplorationMetric(current.current&&isLocalCompositionRefinement(text,current.current.composition)?'refinement':'question');
    requestMetric.current={revision:rev,timing};
    try{await resolveRequest(text,rev,allowModel);if(revision.current===rev&&current.current)saveBrowserView(current.current);}finally{
      timing.finish(revision.current!==rev?'cancelled':current.current?.generation.status==='generated'?'generated':current.current?.generation.status==='unavailable'?'unavailable':current.current?'authored':'guidance');
    }
  }
  async function resolveRequest(text:string,rev:number,allowModel=false){
    const context=current.current;
    setGuidance(null);
    const fallback=resolveCanvasPlan(text,context?.plan??initialPlan(),rev,context?.composition);
    const photos:PhotoDestination[]|null=photoDestinations(text);
    if(photos){if(context)remember(context);setGuidance('photos');update(null);setBusy(false);setRequestNotice('');publishQuestion(text);return;}
    if(shouldResolveWithoutModel(text,fallback.layout)){if(context)remember(context);setGuidance('unmatched');update(null);setBusy(false);setRequestNotice('');return;}
    if(context)remember(context);
    if(analyzePortfolioRequest(text,{projectIds:context?.composition.blocks.flatMap(block=>block.projectIds),task:context?.composition.blocks[0]?.kind==='comparison'?'comparison':undefined}).kind==='ambiguous'){setGuidance('ambiguous');update(null);setBusy(false);return;}
    if(context){
      const portable=createPortableView(context.composition);
      const action=portfolioActionForRequest(text,portable);
      if(action){const edited=applyPortfolioAction(portable,action);update({query:text,plan:viewPlan(edited,rev),composition:edited.composition,generation:{status:'authored'}});setBusy(false);return;}
    }
    const nextGuidance=explorationGuidance(text);
    if(nextGuidance){setGuidance(nextGuidance);update(null);setBusy(false);return;}

    const abort=new AbortController();controller.current=abort;pendingQuery.current=text;pendingPrevious.current=context;setBusy(true);setPhase('Finding a view…');
    const live=()=>!abort.signal.aborted&&revision.current===rev;
    let next:View={plan:fallback,composition:composeLocal(text,fallback,context?.composition),query:text,generation:{status:'authored'}};
    if(fallback.layout!=='empty')update(next);else update(null);
    let needsComposition=true;
    let composerConfigured=llmConfigured.current;
    const simpleRefinement=Boolean(context&&isLocalCompositionRefinement(text,context.composition));
    if(simpleRefinement){setBusy(false);return;}
    try {
      if(!composerConfigured)try {
        const response=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([abort.signal,AbortSignal.timeout(6500)]),body:JSON.stringify({draft:text,composition:context?.composition,current:context?.plan??initialPlan(),pins:context?.composition.blocks.flatMap(b=>b.projectIds).slice(0,2)??[],filter:'All',revision:rev,contentVersion:CONTENT_VERSION})});
        const data=await response.json();
        if(live()&&response.ok&&(data.guidance==='welcome'||data.guidance==='unmatched')){setGuidance(data.guidance);update(null);return;}
        if(response.ok&&validIntentPlan(data.plan,rev)) {
          const plan:Plan=data.plan;
          next={...next,plan,composition:validateComposition(data.composition)??composeLocal(text,plan,context?.composition)};
          needsComposition=data.needsComposition!==false;
          // The direct route already knows the server configuration; do not let
          // an earlier, slower configuration probe suppress this generation.
          if(data.composerConfigured===true)composerConfigured=true;
        }
      } catch { if(live())setRequestNotice(next.plan.layout==='empty'?'Couldn’t match that, so here are starting points.':'Couldn’t match that. You can keep exploring this view.'); }
      if(!live())return;
      if(next.plan.layout!=='empty')update(next);
      if(!allowModel||!needsComposition)return;
      if(!composerConfigured&&!llmConfigured.current){if(next.plan.layout==='empty'){setGuidance('unmatched');update(null);}else update({...next,generation:{status:'unavailable',reason:'unconfigured'}});return;}
      setPhase(next.plan.layout==='empty'?'Preparing your view…':'Refining your view…');
      next={...next,generation:{status:'composing'}};if(next.plan.layout!=='empty')update(next);
      const response=await fetch('/api/compose',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([abort.signal,AbortSignal.timeout(40000)]),body:JSON.stringify({draft:text,revision:rev,contentVersion:CONTENT_VERSION,current:context?.composition??next.composition,proposed:next.composition})});
      if(!response.ok)throw new Error('Composition unavailable');
      if(!response.headers.get('content-type')?.includes('ndjson')) {const data=await response.json();if(data.status==='unsupported'){if(live()){setGuidance('unmatched');update(null);}return;}next={...next,generation:{status:'unavailable',reason:typeof data.reason==='string'?data.reason:'unconfigured'}};if(live()){if(next.generation.reason!=='unconfigured')setRequestNotice(next.plan.layout==='empty'?'This view couldn’t load. Try another question.':'Couldn’t finish updating. You can keep exploring this view.');if(next.plan.layout==='empty'){setGuidance('unmatched');update(null);}else update(next);}return;}
      const reader=response.body?.getReader();if(!reader)throw new Error('No stream');
      const decoder=new TextDecoder();let buffer='';let completed=false;let receivedBytes=0;
      const accept=(line:string)=>{
        if(!line.trim()||!live()||completed)return;
        if(line.length>32000)throw new Error('Composition event too large');
        const event=JSON.parse(line);
        if(event.revision!==rev||event.contentVersion!==CONTENT_VERSION)return;
        if(event.type==='guidance'&&event.guidance==='unmatched'){completed=true;setGuidance('unmatched');update(null);return;}
        if(event.type==='unavailable'){next={...next,generation:{status:'unavailable',reason:typeof event.reason==='string'?event.reason:'provider_unavailable'}};throw new Error('Composition unavailable');}
        const spec=event.type==='composition'?validateComposition(event.composition):null;
        if(spec&&!event.partial){completed=true;next={...next,plan:viewPlan(createPortableView(spec),rev),composition:spec,generation:{status:event.local===true?'authored':'generated',model:typeof event.model==='string'?event.model:undefined,duration:typeof event.duration==='number'?event.duration:undefined,cached:event.cached===true,inputTokens:typeof event.inputTokens==='number'?event.inputTokens:undefined,outputTokens:typeof event.outputTokens==='number'?event.outputTokens:undefined}};update(next);}
      };
      try {while(live()&&!completed){const {done,value}=await reader.read();if(done)break;receivedBytes+=value.byteLength;if(receivedBytes>128000)throw new Error('Composition stream too large');buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()??'';lines.forEach(accept);if(!completed&&buffer.length>32000)throw new Error('Composition event too large');}if(!completed&&buffer.trim())accept(buffer);if(live()&&!completed)throw new Error('Incomplete composition');} finally {await reader.cancel().catch(()=>{});}
    } catch {if(live()){setRequestNotice(next.plan.layout==='empty'?'This view couldn’t load. Try another question.':'Couldn’t finish updating. You can keep exploring this view.');if(next.plan.layout==='empty'){setGuidance('unmatched');update(null);}else update({...next,generation:{...next.generation,status:'unavailable'}});}} finally {if(live()){pendingQuery.current=null;setBusy(false);}}
  }
  const showHelp=()=>{
    if(document.activeElement instanceof HTMLButtonElement)pendingResultFocus.current={kind:'heading'};
    if(current.current)remember(current.current);
    cancel();setCleared(null);setLinkError('');setImmediateDismiss(true);setAutocompleteOpen(false);
    setQuery('How to explore');setGuidance('help');update(null);setHeldExpanded(true);revealStart();
  };
  const submit=(text:string)=>{if(composing||!text.trim()||(busy&&pendingQuery.current===text.trim()))return;setCleared(null);pendingReadingState.current=null;if(/^(?:how (?:to explore|does this (?:work|site work))|help(?: me (?:explore|get started))?)\??$/i.test(text.trim())){showHelp();return;}const rev=cancel();setLinkError('');setImmediateDismiss(true);setAutocompleteOpen(false);setQuery(text.trim());void resolve(text.trim(),rev,true);};
  const navigateHistory=(direction:'back'|'forward')=>{
    if(direction==='back'?!history.length:!future.length)return;
    if(resultsRef.current?.contains(document.activeElement))pendingResultFocus.current={kind:'heading'};
    cancel();setGuidance(null);setImmediateDismiss(true);setAutocompleteOpen(false);
    const next=travelHistory<View|null>({past:history,present:current.current?withReadingState(current.current):null,future},direction);
    setHistory(next.past.filter((item):item is View=>Boolean(item)));setFuture(next.future.filter((item):item is View=>Boolean(item)));
    pendingReadingState.current=next.present?.readingState??null;setQuery(next.present?.query??'');update(next.present);saveBrowserView(next.present,true);if(!pendingReadingState.current)revealStart();
  };
  const selectHistory=(index:number)=>{
    const target=history[index];if(!target)return;
    cancel();setGuidance(null);setImmediateDismiss(true);setAutocompleteOpen(false);
    setFuture([...history.slice(index+1),...(current.current?[withReadingState(current.current)]:[]),...future].slice(0,20));setHistory(history.slice(0,index));
    pendingResultFocus.current={kind:'heading'};pendingReadingState.current=target.readingState??null;setQuery(target.query);update(target);saveBrowserView(target,true);if(!pendingReadingState.current)revealStart();
  };
  const chooseSubject=(projectId:string)=>{
    const next=applyPortfolioAction(null,{type:'open_project',projectId});
    cancel();setGuidance(null);setImmediateDismiss(true);setAutocompleteOpen(false);const title=viewTitle(next);setQuery(title);
    update({query:title,plan:viewPlan(next,revision.current),composition:next.composition,generation:{status:'authored'}});
  };
  const changeComposition=(composition:Composition)=>{
    const checked=createPortableView(composition).composition;
    cancel();if(!current.current)return;
    const previous=current.current;
    const opensProject=previous.composition.blocks.length===1&&checked.blocks.length===1&&checked.blocks[0].kind==='story'&&previous.composition.blocks[0].kind!=='story';
    const sameProject=previous.composition.blocks.length===1&&checked.blocks.length===1&&previous.composition.blocks[0].kind==='story'&&checked.blocks[0].kind==='story'&&previous.composition.blocks[0].projectIds[0]===checked.blocks[0].projectIds[0];
    const opensSubject=previous.composition.blocks.some((block,i)=>block.kind!==composition.blocks[i]?.kind||(block.kind==='story'&&block.projectIds[0]!==composition.blocks[i]?.projectIds[0]));
    // Filtering refines the current app; Back should travel between explorations,
    // not undo a search one keystroke at a time.
    const navigationState=(value:Composition)=>({...value,blocks:value.blocks.map(block=>({...block,search:undefined}))});
    if(JSON.stringify(navigationState(previous.composition))!==JSON.stringify(navigationState(checked)))remember(previous);
    if(opensProject&&resultsRef.current?.contains(document.activeElement))pendingResultFocus.current={kind:'heading'};
    if(opensSubject)revealStart();
    const next:View={...previous,returnToExploration:opensProject?{...withReadingState(previous),returnToExploration:undefined}:sameProject?previous.returnToExploration:undefined,composition:checked,plan:{...viewPlan(createPortableView(checked),revision.current)},generation:{status:'authored'}};
    update(next);saveBrowserView(next,true);
  };
  const backToExploration=()=>{
    const parent=current.current?.returnToExploration;if(!parent)return;
    pendingResultFocus.current=parent.composition.blocks[0]?.kind==='collection'?{kind:'project',id:current.current?.composition.blocks[0]?.projectIds[0]??''}:{kind:'heading'};
    cancel();setGuidance(null);setImmediateDismiss(true);setAutocompleteOpen(false);
    if(current.current)remember(current.current);
    pendingReadingState.current=parent.readingState??null;setQuery(parent.query);update({...parent,plan:{...parent.plan,revision:revision.current}});if(!pendingReadingState.current)revealStart();
  };
  const inspectView=()=>({contentVersion:CONTENT_VERSION,revision:revision.current,view:current.current?createPortableView(current.current.composition):null,canGoBack:history.length>0,canGoForward:future.length>0,shareUrl:current.current?viewUrl(createPortableView(current.current.composition),window.location.origin):null});
  browserControls.current={
    inspect:inspectView,
    apply:({action,expectedRevision})=>{
      if(expectedRevision!==revision.current)throw new Error('The view changed. Read it again before applying an action.');
      const next=applyPortfolioAction(current.current?createPortableView(current.current.composition):null,action);
      flushSync(()=>{cancel();setGuidance(null);setLinkError('');setImmediateDismiss(true);setAutocompleteOpen(false);if(current.current)remember(current.current);const title=viewTitle(next);setQuery(title);update({query:title,plan:viewPlan(next,revision.current),composition:next.composition,generation:{status:'authored'}});});
      return browserControls.current!.inspect();
    },
    travel:({direction,expectedRevision})=>{if(expectedRevision!==revision.current)throw new Error('The view changed. Read it again before navigating.');flushSync(()=>navigateHistory(direction));return browserControls.current!.inspect();},
  };
  const shareView=async()=>{
    const sharedView=current.current;const sharedRevision=revision.current;if(!sharedView)return;
    const stillCurrent=()=>current.current===sharedView&&revision.current===sharedRevision;
    try{await navigator.clipboard.writeText((()=>{const url=new URL(viewUrl(createPortableView(sharedView.composition),window.location.origin));url.searchParams.set('q',sharedView.query);return url.href;})());if(stillCurrent())setShareStatus('copied');}
    catch{if(stillCurrent())setShareStatus('failed');}
  };
  const suggestionContext=view?{projectIds:view.composition.blocks.flatMap(block=>block.projectIds),kind:view.composition.blocks[0]?.kind,focus:view.composition.blocks[0]?.focus,answerId:view.composition.blocks[0]?.answerId,angle:view.composition.blocks[0]?.angle,section:view.composition.blocks[0]?.section,question:view.query,visitedQuestions:history.slice(-8).map(item=>item.query)}:undefined;
  const nextQuestions=view?suggestExperiencePrompts('',2,suggestionContext):[];
  const photoGuide=guidance==='photos'?photoDestinations(query):null;
  const recoveryQuestions=guidance==='unmatched'?suggestExperiencePrompts(query,3):[];
  const clarification=guidance==='ambiguous'?analyzePortfolioRequest(query):undefined;
  const guidanceChoices=recoveryQuestions.length?recoveryQuestions.map(item=>({label:item.text,prompt:item.text})):[{label:'Explore the work',prompt:'Explore all projects'},{label:'AI in government',prompt:'How did Isaac research AI in government?'},{label:'Career & experience',prompt:'Explore Isaac’s career'}];
  const titleFor=(item:View)=>viewTitle(createPortableView(item.composition));
  let feedbackUrl=SITE_URL;
  if(view)try{feedbackUrl=viewUrl(createPortableView(view.composition),SITE_URL);}catch{/* A bounded fallback remains available even if a view cannot be shared. */}
  const recessActive=composerHovered||explorationFocused||Boolean(view||guidance)||busy;
  const progressText=busy?waiting?view?'Still refining your view…':'Still preparing your view…':phase:requestNotice;
  return <section id="home-genui" className={`home-genui photos-shell${!view?' is-idle':''}`} aria-label="Interactive exploration">
    <div className={`home-genui-window${view||heldExpanded||guidance==='help'?' has-results':guidance?' has-guidance':''}${recessActive?' is-engaged':''}`} onPointerEnter={e=>{if(e.pointerType!=='touch')setComposerHovered(true);}} onPointerLeave={()=>setComposerHovered(false)} onFocusCapture={()=>setExplorationFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setExplorationFocused(false);}}>
      <motion.div className="home-window-depth" aria-hidden="true" initial={false} animate={{opacity:recessActive ? .18 : 0}} transition={{duration:reduceMotion?0:.3,ease:[.22,1,.36,1]}}/>


      {reviewMode&&<div className="canvas-review"><label htmlFor="layout-review">Layout review · {AI_LAYOUTS.length} authored views</label><select id="layout-review" value={reviewLayout} onChange={e=>{const id=e.target.value as LayoutId;setReviewLayout(id);cancel();const recipe=AI_LAYOUTS.find(l=>l.id===id)!;setQuery(recipe.prompt);update({query:recipe.prompt,plan:resolveCanvasPlan(recipe.prompt,initialPlan(),revision.current),composition:presetComposition(id),generation:{status:'authored'}});}}>{AI_LAYOUTS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>}<div ref={composerRef} className="home-genui-composer">

        <form onSubmit={e=>{e.preventDefault();if(!composing&&query.trim())submit(query);}}>
        <ExperienceAutocomplete context={suggestionContext} inputRef={input} committedValue={committedQuery} quietFocus={quietFocus} onEscape={view||guidance||busy?clear:undefined} value={query} open={autocompleteOpen} immediateDismiss={immediateDismiss} onOpenChange={open=>{if(open)setImmediateDismiss(false);setAutocompleteOpen(open);}} onSubmit={submit} onChange={value=>{setCleared(null);cancel();setQuery(value);}} onCompositionStart={()=>{cancel();setComposing(true);}} onCompositionEnd={()=>{cancel();setComposing(false);}}/>
        {(query.trim()||view||guidance)&&<>{!(narrow&&(view||guidance))&&<button className="home-clear" type="button" onClick={clear} aria-label="Clear exploration" title="Clear exploration"><X size={16}/></button>}<button className="home-submit" type="submit" disabled={composing||!query.trim()} aria-label="Explore" title="Explore" aria-busy={busy}>{busy&&!view?<LoaderCircle size={17} className="home-submit-spinner"/>:<ArrowUp size={17}/>}</button></>}
      </form>{(busy||view||guidance||requestNotice)&&<div className="home-request-reveal"><div className="home-request-state">{progressText&&<span>{progressText}</span>}{busy&&<button type="button" onClick={stopUpdating} aria-label="Stop updating this view">Stop</button>}</div></div>}</div>
      {busy&&!view&&!guidance&&<div className="home-pending-view" aria-label="Preparing exploration"><div className="home-pending-lines" aria-hidden="true"><span/><span/><span/></div>{waiting&&<div className="home-pending-alternatives"><p>You can explore a starting point while this view is prepared.</p><button type="button" onClick={()=>submit('Explore all projects')}>Browse work<ArrowRight size={14} aria-hidden="true"/></button><button type="button" onClick={showHelp}>How to explore<ArrowRight size={14} aria-hidden="true"/></button></div>}</div>}
      {!view&&!heldExpanded&&!guidance&&!autocompleteOpen&&!busy&&<div className="home-idle-actions">
        {cleared ? <button className="home-start-example" type="button" onClick={()=>{cancel();pendingReadingState.current=cleared.view?.readingState??cleared.readingState??null;setQuery(cleared.query);setHistory(cleared.history);setFuture(cleared.future);setGuidance(cleared.guidance);update(cleared.view);setCleared(null);input.current?.focus({preventScroll:true});}}>Undo clear</button> : <div className="home-genui-preview"><button type="button" className="home-preview-trigger" onClick={showHelp}>How to explore</button></div>}
      </div>}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{shareStatus==='failed'?'Could not copy the link. Check clipboard permissions.':shareStatus==='copied'?'Link copied.':busy?progressText:requestNotice|| (guidance==='photos'&&photoGuide?photoRedirectCopy(photoGuide):guidance==='help'?'How to explore is ready.':view?.generation.status==='unavailable'?'Interactive view · AI unavailable':'')}</span>
      {linkError&&<p className="home-draft-hint" role="status">{linkError}</p>}
      <AnimatePresence key={revealEpoch} initial={false} onExitComplete={()=>setHeldExpanded(false)}>
        {(view||guidance)&&<ExplorationReveal key="exploration-panel" contentRevision={view?.plan.revision??revision.current} restored={Boolean(restored?.view||restored?.guidance)} initialReadingState={pendingReadingState.current} onSettled={restoreReadingPosition}>
          <div ref={resultsRef} className="home-genui-stage" aria-label="Exploration results" aria-busy={busy} data-reading-restored={Boolean(view?.readingState)||view===restored?.view?'true':undefined}>
            {guidance==='help'?<ExploreHelp onSubmit={submit}/>:photoGuide?<PhotoRedirect destinations={photoGuide}/>:guidance?<div className="home-entry" aria-label="Choose a starting point">
              <p>{guidance==='welcome'?'Hi. What would you like to explore?':guidance==='ambiguous'?'Which work would you like to explore?':recoveryQuestions.length?'Did you mean one of these questions?':'There isn’t published material to answer that question. You can explore the work or try another question.'}</p>
              <div>{guidance==='ambiguous'?clarification?.choices.map(item=><button type="button" key={item.projectId} onClick={()=>chooseSubject(item.projectId)}>{item.label}<ArrowRight size={14} aria-hidden="true"/></button>):guidanceChoices.map(item=><button type="button" key={item.label} onClick={()=>submit(item.prompt)}>{item.label}<ArrowRight size={14} aria-hidden="true"/></button>)}<button type="button" onClick={showHelp}>How to explore<ArrowRight size={14} aria-hidden="true"/></button></div>
            </div>:view&&<>
              <ExplorationCanvas composition={view.composition} plan={view.plan} generation={view.generation} onChange={changeComposition}/>
            </>}
            <footer className="home-genui-footer">
            {view&&nextQuestions.length>0&&<details className="home-next-questions"><summary>Explore further</summary><div>{nextQuestions.map(item=><button key={item.id} type="button" onClick={()=>submit(item.text)}>{item.text}<ArrowRight size={14} aria-hidden="true"/></button>)}<button type="button" onClick={showHelp}>How to explore<ArrowRight size={14} aria-hidden="true"/></button></div></details>}
            <div className={`home-genui-tools${!view&&!history.length&&!(narrow&&guidance)?' is-empty':''}`}>

              {view?.returnToExploration&&view.composition.blocks.length===1&&view.composition.blocks[0].kind==='story'&&<button aria-label={returnLabel(view.returnToExploration)} onClick={backToExploration}><ArrowLeft size={14} aria-hidden="true"/><span>{returnLabel(view.returnToExploration)}</span></button>}
              {(view||guidance)&&history.length>0&&!view?.returnToExploration&&<button aria-label="Previous exploration" title={`Back to ${titleFor(history[history.length-1])}`} onClick={()=>navigateHistory('back')}><ArrowLeft size={14} aria-hidden="true"/><span>Back</span></button>}
              {view&&future.length>0&&!view.returnToExploration&&<button aria-label="Next exploration" title={`Forward to ${titleFor(future[0])}`} onClick={()=>navigateHistory('forward')}><span>Forward</span><ArrowRight size={14} aria-hidden="true"/></button>}
              {view&&<ExplorationHistory items={history.map(item=>({title:titleFor(item),question:item.query}))} onSelect={selectHistory}/>}
              {view&&<button type="button" onClick={()=>{cancel();setQuery('');input.current?.focus({preventScroll:true});setAutocompleteOpen(true);}}>Ask a follow-up<ArrowUp size={14} aria-hidden="true"/></button>}
              {view&&<button className="home-share-view" aria-label={shareStatus==='copied'?'Link copied':'Copy link to this view'} onClick={()=>void shareView()}>{shareStatus==='copied'?<Check size={14}/>:<Link size={14}/>}<span>{shareStatus==='copied'?'Copied':'Share'}</span></button>}
              {narrow&&(view||guidance)&&<button type="button" className="home-clear-footer" onClick={clear}>Clear exploration<X size={14} aria-hidden="true"/></button>}

            </div>
            {view&&!busy&&<ExplorationFeedback key={view.query} title={titleFor(view)} question={view.query} url={feedbackUrl}/>}
            </footer>
          </div>
        </ExplorationReveal>}
      </AnimatePresence>
    </div>
  </section>;
}
