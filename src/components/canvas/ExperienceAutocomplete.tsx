import { useId, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft } from 'lucide-react';
import { suggestExperiencePrompts } from '@/lib/experiencePrompts';

function SuggestionPanel({children}:{children:ReactNode}) {
  const present=useIsPresent();const reduced=useReducedMotion();
  return <motion.div className="experience-autocomplete" aria-hidden={!present} {...(!present?{inert:''}:{})}
    initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit="closed"
    variants={{closed:(immediate:boolean)=>({opacity:0,height:0,transition:{duration:reduced||immediate?0:.16}})}}
    transition={{height:{duration:reduced?0:.32,ease:[.22,1,.36,1]},opacity:{duration:reduced ? 0 : present ? 0.2 : 0.1}}} onPointerDown={e=>e.preventDefault()}>{children}</motion.div>;
}
type Props={value:string;open:boolean;immediateDismiss?:boolean;inputRef:RefObject<HTMLInputElement>;onChange:(value:string)=>void;onSubmit:(value:string)=>void;onOpenChange:(open:boolean)=>void;onCompositionStart:()=>void;onCompositionEnd:()=>void};
export default function ExperienceAutocomplete({value,open,immediateDismiss=false,inputRef,onChange,onSubmit,onOpenChange,onCompositionStart,onCompositionEnd}:Props){
  const id=useId();
  const [active,setActive]=useState(-1);
  const [composing,setComposing]=useState(false);
  const items=suggestExperiencePrompts(value);
  const visible=open&&!composing;
  const toggle=(next:boolean)=>{onOpenChange(next);if(!next)setActive(-1);};
  const select=(text:string)=>{toggle(false);onSubmit(text);};
  return <>
    <label className="sr-only" htmlFor="home-explore">Explore</label>
    <input ref={inputRef} id="home-explore" type="search" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?id:undefined} aria-activedescendant={visible&&items[active]?`${id}-${items[active].id}`:undefined} autoComplete="off" placeholder="Ask about Isaac’s work" value={value} maxLength={500}
      onFocus={()=>{if(value.trim())toggle(true);}} onBlur={()=>toggle(false)}
      onChange={e=>{setActive(-1);toggle(true);onChange(e.target.value);}}
      onCompositionStart={()=>{setComposing(true);setActive(-1);onCompositionStart();}}
      onCompositionEnd={()=>{setComposing(false);onCompositionEnd();}}
      onKeyDown={e=>{
        if(composing||e.nativeEvent.isComposing||e.keyCode===229)return;
        if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();toggle(false);}
        else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();toggle(true);setActive(index=>e.key==='ArrowDown'?(index+1)%items.length:index<=0?items.length-1:index-1);}
        else if(e.key==='Enter'){if(visible&&items[active]){e.preventDefault();select(items[active].text);}else toggle(false);}
        else if(e.key==='Tab')toggle(false);
      }}/>
    <AnimatePresence initial={false} custom={immediateDismiss}>{visible&&<SuggestionPanel key="suggestions">
      <span className="experience-autocomplete-label" id={`${id}-label`}>Explore Isaac’s experience</span>
      <ul id={id} role="listbox" aria-labelledby={`${id}-label`}>
        {items.map((item,index)=><li id={`${id}-${item.id}`} key={item.id} role="option" aria-selected={active===index} onPointerMove={()=>setActive(index)} onClick={()=>select(item.text)}>
          <span>{item.text}</span><ArrowUpLeft size={14} aria-hidden="true"/>
        </li>)}
      </ul>
      <span className="sr-only" role="status">{items.length} suggestions. Use arrow keys to choose, Enter to explore, or continue typing your own question.</span>
    </SuggestionPanel>}</AnimatePresence>
  </>;
}
