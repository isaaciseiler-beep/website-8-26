import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { useId, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { ArrowUpLeft } from 'lucide-react';
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
type Props={committed?:boolean;context?:SuggestionContext;value:string;open:boolean;immediateDismiss?:boolean;inputRef:RefObject<HTMLInputElement>;onChange:(value:string)=>void;onSubmit:(value:string)=>void;onOpenChange:(open:boolean)=>void;onCompositionStart:()=>void;onCompositionEnd:()=>void};
export default function ExperienceAutocomplete({committed=false,context,value,open,immediateDismiss=false,inputRef,onChange,onSubmit,onOpenChange,onCompositionStart,onCompositionEnd}:Props){
  const id=useId();
  const [active,setActive]=useState(-1);
  const [editing,setEditing]=useState(false);
  const [composing,setComposing]=useState(false);
  const items=suggestExperiencePrompts(value,4,context);
  const visible=open&&!composing&&items.length>0;
  const toggle=(next:boolean)=>{onOpenChange(next);if(!next)setActive(-1);};
  const select=(text:string)=>{setEditing(false);toggle(false);onSubmit(text);};
  return <>
    <label className="sr-only" htmlFor="home-explore">Explore</label>
    <div className={`home-query-field${committed&&!editing?' is-committed':''}`}>
    {committed&&!editing&&<span className="home-question-display" aria-hidden="true">{value}</span>}
    <input ref={inputRef} id="home-explore" type="search" enterKeyHint="search" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?id:undefined} aria-activedescendant={visible&&items[active]?`${id}-${items[active].id}`:undefined} autoComplete="off" placeholder="Ask about Isaac’s work" value={value} maxLength={500}
      onFocus={()=>{setEditing(true);toggle(true);}} onClick={()=>{setEditing(true);toggle(true);}} onBlur={()=>{setEditing(false);toggle(false);}}
      onChange={e=>{setEditing(true);setActive(-1);toggle(true);onChange(e.target.value);}}
      onCompositionStart={()=>{setEditing(true);setComposing(true);setActive(-1);onCompositionStart();}}
      onCompositionEnd={()=>{setComposing(false);onCompositionEnd();}}
      onKeyDown={e=>{
        if(composing||e.nativeEvent.isComposing||e.keyCode===229)return;
        if(e.key!=='Enter')setEditing(true);
        if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();toggle(false);}
        else if((e.key==='ArrowDown'||e.key==='ArrowUp')&&items.length){e.preventDefault();toggle(true);setActive(index=>e.key==='ArrowDown'?(index+1)%items.length:index<=0?items.length-1:index-1);}
        else if(e.key==='Enter'){e.preventDefault();select(visible&&items[active]?items[active].text:value);}
        else if(e.key==='Tab')toggle(false);
      }}/>
    </div>
    <AnimatePresence initial={false} custom={immediateDismiss}>{visible&&<SuggestionPanel key="suggestions">
      <ul id={id} role="listbox" aria-label="Suggested questions">
        {items.map((item,index)=><li id={`${id}-${item.id}`} key={item.id} role="option" aria-selected={active===index} onPointerMove={()=>setActive(index)} onClick={()=>select(item.text)}>
          <span>{item.text}</span><ArrowUpLeft size={14} aria-hidden="true"/>
        </li>)}
      </ul>
      {!value.trim()&&!context&&<div className="home-autocomplete-shortcuts" aria-label="Other ways to explore">
        <button type="button" onClick={()=>select('Give me a quick introduction to Isaac')}>Introduction</button>
        <button type="button" onClick={()=>select('Explore all projects')}>Browse work</button>
      </div>}
      <span className="sr-only" role="status">{items.length} suggestions. Use arrow keys to choose, Enter to explore, or continue typing your own question.</span>
    </SuggestionPanel>}</AnimatePresence>
  </>;
}
