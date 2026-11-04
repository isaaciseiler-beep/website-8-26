import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { suggestExperiencePrompts, type SuggestionContext } from '@/lib/experiencePrompts';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';

function SuggestionPanel({children}:{children:ReactNode}) {
  const present=useIsPresent();const reduced=useReducedMotion();
  return <motion.div className="experience-autocomplete" aria-hidden={!present} {...(!present?{inert:''}:{})}
    initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit="closed"
    // A committed suggestion becomes a result in the same surface. Dismiss its
    // semantics immediately, but let its space fold as the result opens below.
    variants={{closed:(committed:boolean)=>({opacity:0,height:0,transition:{height:{duration:reduced?0:committed?MOTION_DURATION.base:MOTION_DURATION.instant,ease:MOTION_EASE_ENTER},opacity:{duration:reduced?0:MOTION_DURATION.exit}}})}}
    transition={{height:{duration:reduced?0:.32,ease:[.22,1,.36,1]},opacity:{duration:reduced ? 0 : present ? 0.2 : 0.1}}} onPointerDown={e=>e.preventDefault()}>{children}</motion.div>;
}
type Props={context?:SuggestionContext;value:string;open:boolean;immediateDismiss?:boolean;inputRef:RefObject<HTMLTextAreaElement>;onChange:(value:string)=>void;onSubmit:(value:string)=>void;onOpenChange:(open:boolean)=>void;onCompositionStart:()=>void;onCompositionEnd:()=>void};
export default function ExperienceAutocomplete({context,value,open,immediateDismiss=false,inputRef,onChange,onSubmit,onOpenChange,onCompositionStart,onCompositionEnd}:Props){
  const id=useId();
  const [active,setActive]=useState(-1);
  const reduced=useReducedMotion();
  const measure=useRef<HTMLSpanElement>(null);
  const list=useRef<HTMLUListElement>(null);
  const [height,setHeight]=useState(42);
  useLayoutEffect(()=>{
    const node=measure.current;if(!node)return;
    const resize=()=>setHeight(Math.max(42,Math.min(160,node.getBoundingClientRect().height)));
    resize();const observer=new ResizeObserver(resize);observer.observe(node);
    return()=>observer.disconnect();
  },[]);
  const [composing,setComposing]=useState(false);
  const composition=useRef(false);
  const items=suggestExperiencePrompts(value,4,context);
  const shortcuts=!value.trim()&&!context?[{id:'help',text:'How to explore',label:'How to explore'},{id:'browse',text:'Explore all projects',label:'Browse work'}]:[];
  const options=[...items,...shortcuts];
  const visible=open&&!composing&&options.length>0;
  useLayoutEffect(()=>{
    const node=list.current;
    const selected=node?.querySelector<HTMLElement>('[aria-selected="true"]');
    if(!visible||!node||!selected)return;
    // Scroll only the constrained list. scrollIntoView can also move the page
    // and dislodge the composer while a visitor navigates with the keyboard.
    const reveal=()=>{
      const bounds=node.getBoundingClientRect(),row=selected.getBoundingClientRect();
      if(row.top<bounds.top)node.scrollTop+=row.top-bounds.top;
      else if(row.bottom>bounds.bottom)node.scrollTop+=row.bottom-bounds.bottom;
    };
    reveal();
    const observer=new ResizeObserver(reveal);observer.observe(node);observer.observe(selected);
    return()=>observer.disconnect();
  },[active,visible]);
  const toggle=(next:boolean)=>{onOpenChange(next);if(!next)setActive(-1);};
  const select=(text:string)=>{if(!text.trim())return;toggle(false);onSubmit(text);};
  const finishComposition=()=>{
    if(!composition.current)return;
    composition.current=false;setComposing(false);onCompositionEnd();
  };
  return <>
    <label className="sr-only" htmlFor="home-explore">Explore</label>
    <motion.div className="home-query-field" initial={false} animate={{height}} transition={{duration:reduced?0:MOTION_DURATION.fast,ease:MOTION_EASE_ENTER}}>
    <span ref={measure} className="home-question-measure" aria-hidden="true">{value||'Ask about Isaac’s work'}{'\u200b'}</span>
    <textarea ref={inputRef} id="home-explore" rows={1} enterKeyHint="search" aria-describedby={`${id}-instructions`} aria-autocomplete="list" aria-haspopup="listbox" aria-controls={visible?id:undefined} aria-activedescendant={visible&&options[active]?`${id}-${options[active].id}`:undefined} autoComplete="off" placeholder="Ask about Isaac’s work" value={value} maxLength={500}
      onFocus={()=>toggle(true)} onClick={()=>toggle(true)} onBlur={()=>{toggle(false);finishComposition();}}
      onChange={e=>{setActive(-1);toggle(true);onChange(e.target.value);}}
      onCompositionStart={()=>{composition.current=true;setComposing(true);setActive(-1);onCompositionStart();}}
      onCompositionEnd={finishComposition}
      onKeyDown={e=>{
        if(composition.current||e.nativeEvent.isComposing||e.keyCode===229)return;

        if(e.key==='Escape'&&open){if(visible){e.preventDefault();e.stopPropagation();}toggle(false);}
        else if(e.altKey&&e.key==='ArrowDown'&&options.length){e.preventDefault();toggle(true);setActive(0);}
        else if(visible&&!e.shiftKey&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&(e.key==='ArrowDown'||e.key==='ArrowUp')&&options.length){e.preventDefault();setActive(index=>e.key==='ArrowDown'?(index+1)%options.length:index<=0?options.length-1:index-1);}
        else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();select(visible&&options[active]?options[active].text:value);}
        else if(e.key==='Tab')toggle(false);
      }}/>
    </motion.div>
    <span id={`${id}-instructions`} className="sr-only">Enter to explore; Shift plus Enter adds a line. When suggestions are open, use arrow keys to choose. Escape dismisses suggestions so arrow keys can move through your question. Alt plus Down opens suggestions again.</span>
    <AnimatePresence initial={false} custom={immediateDismiss}>{visible&&<SuggestionPanel key="suggestions">
      <ul ref={list} id={id} role="listbox" aria-label="Suggested questions">
        {items.map((item,index)=><li id={`${id}-${item.id}`} key={item.id} role="option" aria-selected={active===index} onClick={()=>select(item.text)}>
          <span>{item.text}</span><ArrowRight size={14} aria-hidden="true"/>
        </li>)}
        {shortcuts.length>0&&<li role="group" className="home-autocomplete-shortcuts" aria-label="Other ways to explore">
          {shortcuts.map((item,index)=><div key={item.id} id={`${id}-${item.id}`} role="option" aria-selected={active===items.length+index} onClick={()=>select(item.text)}>{item.label}</div>)}
        </li>}
      </ul>
    </SuggestionPanel>}</AnimatePresence>
    <span className="sr-only" aria-live="polite" aria-atomic="true">{visible?`${options.length} suggestions available.`:''}</span>
  </>;
}
