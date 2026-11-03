// Compatibility renderers for authored legacy views. Live routing deliberately
// excludes photo/classroom kinds; load this module only for an existing view.
import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { albums, albumPhotos } from '@/lib/canvas';
import type { LayoutProps } from './LayoutViews';
type BlockProps=LayoutProps;

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

export function PhotoLayouts({block,onChange}:LayoutProps){
  const album=albums.find(a=>a.folder===block.albumIds[0])??albums[0];
  const photos=albumPhotos(album);
  const [second,setSecond]=useState(1);
  const page=Math.floor(block.section/12);
  const open=(folder:string,index=0)=>onChange({...block,layout:'photo-focus',albumIds:[folder],section:index});
  return <section aria-label="Photo layouts">
    <div className="canvas-heading"><h2 className="sr-only">{block.layout==='photo-collections'?'Collections':album.location}</h2>{block.layout!=='photo-collections'&&<label><span className="sr-only">Collection</span><select aria-label="Collection" value={album.folder} onChange={e=>onChange({...block,albumIds:[e.target.value],section:0})}>{albums.map(a=><option key={a.folder} value={a.folder}>{a.location}</option>)}</select></label>}</div>
    {block.layout==='photo-collections'?<div className="canvas-collection-grid">{albums.map(a=><button key={a.folder} aria-label={`Open ${a.location} collection`} onClick={()=>open(a.folder)}><img src={albumPhotos(a)[0]} alt="" loading="lazy"/></button>)}</div>:block.layout==='photo-diptych'?<><div className="canvas-diptych">{[block.section,second%photos.length].map((index,side)=><button key={side} aria-label={`Change ${side===0?'left':'right'} photograph`} onClick={()=>side===0?onChange({...block,section:(index+1)%photos.length}):(setSecond((index+1)%photos.length),onChange(block))}><img src={photos[index]} alt={`${album.location} photograph ${index+1}`}/></button>)}</div><p className="canvas-caption">Select either photograph to change it.</p></>:<><div className="canvas-contact-sheet">{photos.slice(page*12,page*12+12).map((src,i)=><button key={src} aria-label={`Open photograph ${page*12+i+1}`} onClick={()=>open(album.folder,page*12+i)}><img src={src} alt="" loading="lazy"/></button>)}</div>{photos.length>12&&<div className="canvas-pagination"><button disabled={page===0} onClick={()=>onChange({...block,section:(page-1)*12})}>Previous</button><span>{page+1} / {Math.ceil(photos.length/12)}</span><button disabled={(page+1)*12>=photos.length} onClick={()=>onChange({...block,section:(page+1)*12})}>Next</button></div>}</>}
  </section>;
}

type Step={id:number;title:string;minutes:number};
export function SessionSequence({block,onChange}:LayoutProps){
  const [steps,setSteps]=useState<Step[]>([{id:1,title:'Start with a question',minutes:5},{id:2,title:'Try an example together',minutes:10},{id:3,title:'Practice independently',minutes:15},{id:4,title:'Reflect and check understanding',minutes:5}]);
  const [copied,setCopied]=useState(false);
  const edit=(next:Step[])=>{setSteps(next);setCopied(false);onChange(block);};
  const move=(index:number,delta:number)=>{const next=[...steps];[next[index],next[index+delta]]=[next[index+delta],next[index]];edit(next);};
  return <section aria-label="Teaching session sequence"><div className="canvas-heading"><h2>Shape a session</h2><span className="canvas-number">{steps.reduce((sum,s)=>sum+s.minutes,0)}<small>minutes</small></span></div><p className="canvas-caption">Illustrative session · adjust the steps and timing.</p><ol className="canvas-session">{steps.map((s,i)=><li key={s.id}><span className="canvas-step-index">{String(i+1).padStart(2,'0')}</span><input aria-label={`Step ${i+1}`} value={s.title} maxLength={100} onChange={e=>edit(steps.map(t=>t.id===s.id?{...t,title:e.target.value}:t))}/><label><span className="sr-only">Minutes for step {i+1}</span><input type="number" min={1} max={120} value={s.minutes} onChange={e=>edit(steps.map(t=>t.id===s.id?{...t,minutes:Math.max(1,Math.min(120,Number(e.target.value)||1))}:t))}/></label><div className="canvas-step-actions"><button aria-label={`Move step ${i+1} up`} disabled={!i} onClick={()=>move(i,-1)}><ArrowUp size={16}/></button><button aria-label={`Move step ${i+1} down`} disabled={i===steps.length-1} onClick={()=>move(i,1)}><ArrowDown size={16}/></button></div></li>)}</ol><button className="canvas-primary" onClick={async()=>{try{await navigator.clipboard.writeText(steps.map((s,i)=>`${i+1}. ${s.title} (${s.minutes} min)`).join('\n'));setCopied(true);}catch{setCopied(false);}}}>{copied?'Copied':'Copy session'}</button></section>;
}

export default function LegacyExplorationViews(props:LayoutProps) {
  if(props.block.layout==='teaching-sequence')return <SessionSequence {...props}/>;
  if(['photo-grid','photo-diptych','photo-collections'].includes(props.block.layout??''))return <PhotoLayouts {...props}/>;
  return props.block.kind==='photos'?<PhotoExplorer {...props}/>:<Workshop {...props}/>;
}
