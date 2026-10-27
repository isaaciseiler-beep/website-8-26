import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react';
import { albums, albumPhotos, publicProjects, experienceEntries } from '@/lib/canvas';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
export type LayoutProps={block:CanvasBlock;onChange:(block:CanvasBlock)=>void};

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
  return <section className="canvas-project-layout" aria-label="Project detail layout"><div className="canvas-heading"><h2>{project.title}</h2><span className="canvas-eyebrow">{project.year}</span></div>
    {block.layout==='project-process'?<div className="canvas-process"><div className="canvas-process-steps" aria-label="Project process steps">{stages.map((s,i)=><button aria-pressed={active===sections.indexOf(s)} key={s.heading} onClick={()=>onChange({...block,section:sections.indexOf(s)})}><span>{String(i+1).padStart(2,'0')}</span>{s.heading}</button>)}</div><article className="canvas-surface"><h3 className="sr-only">{stage.heading}</h3>{stage.paragraphs?.slice(0,2).map(t=><p key={t}>{t}</p>)}{stage.bullets&&<ul>{stage.bullets.map(t=><li key={t}>{t}</li>)}</ul>}</article></div>:block.layout==='project-outcomes'?<><p>{project.summary}</p><div className="canvas-outcomes">{(outcomes.length?outcomes:sections.slice(-2)).map((s,i)=><article className="canvas-surface" key={s.heading}><span className="canvas-step-index">{String(i+1).padStart(2,'0')}</span><h3>{s.heading}</h3><p>{s.paragraphs?.[0]??s.bullets?.[0]}</p>{((s.paragraphs?.length??0)>1||(s.bullets?.length??0)>1)&&<details><summary>Explore evidence</summary>{s.paragraphs?.slice(1).map(t=><p key={t}>{t}</p>)}{s.bullets&&<ul>{s.bullets.map(t=><li key={t}>{t}</li>)}</ul>}</details>}</article>)}</div></>:<><label className="canvas-field"><span>Find in this project</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);onChange(block);}} placeholder="Search the published evidence"/></label><div className="canvas-evidence">{evidence.length?evidence.map(s=><details key={s.heading}><summary>{s.heading}</summary>{s.paragraphs?.map(t=><p key={t}>{t}</p>)}{s.bullets&&<ul>{s.bullets.map(t=><li key={t}>{t}</li>)}</ul>}{s.links?.map(l=><a href={l.href} key={l.href} target="_blank" rel="noreferrer">{l.label}<ArrowUpRight size={14}/></a>)}</details>):<p>No matching sections.</p>}</div></>}
  </section>;
}

export function ProjectIndex({block,onChange}:LayoutProps){
  const query=block.search??'';
  const filtered=publicProjects.filter(p=>(p.title+' '+p.summary).toLowerCase().includes(query.toLowerCase()));
  return <section aria-label="Work explorer"><h2>Explore work</h2><label className="canvas-field"><span className="sr-only">Find a project</span><input type="search" placeholder="Find a project" value={query} onChange={e=>{onChange({...block,search:e.target.value});}}/></label><div className="canvas-project-list">{filtered.map(p=><button key={p.id} onClick={()=>onChange({...blankBlock('story'),projectIds:[p.id]})}><span>{p.year}</span><strong>{p.title}</strong><ArrowUpRight size={18}/></button>)}{!filtered.length&&<p>No matching projects.</p>}</div></section>;
}

export function RoleExplorer({block,onChange}:LayoutProps){
  const [selected,setSelected]=useState(experienceEntries[0].id);
  const [filter,setFilter]=useState('');
  const entries=experienceEntries.filter(e=>(e.organization+' '+e.role+' '+e.focus.join(' ')).toLowerCase().includes(filter.toLowerCase()));
  const entry=entries.find(e=>e.id===selected)??entries[0];
  return <section aria-label="Role explorer"><h2>Experience</h2><label className="canvas-field"><span className="sr-only">Filter roles</span><input type="search" value={filter} onChange={e=>{setFilter(e.target.value);onChange(block);}} placeholder="Filter roles or skills"/></label><div className="canvas-process"><div className="canvas-role-list">{entries.map(e=><button aria-pressed={entry?.id===e.id} key={e.id} onClick={()=>{setSelected(e.id);onChange(block);}}><strong>{e.organization}</strong><small>{e.period}</small></button>)}</div>{entry?<article className="canvas-surface"><span className="canvas-eyebrow">{entry.period}</span><h3>{entry.role}</h3>{entry.paragraphs.map(p=><p key={p}>{p}</p>)}<div className="canvas-tags">{entry.focus.map(f=><span key={f}>{f}</span>)}</div></article>:<p>No matching roles.</p>}</div></section>;
}

type Step={id:number;title:string;minutes:number};
export function SessionSequence({block,onChange}:LayoutProps){
  const [steps,setSteps]=useState<Step[]>([{id:1,title:'Start with a question',minutes:5},{id:2,title:'Try an example together',minutes:10},{id:3,title:'Practice independently',minutes:15},{id:4,title:'Reflect and check understanding',minutes:5}]);
  const [copied,setCopied]=useState(false);
  const edit=(next:Step[])=>{setSteps(next);setCopied(false);onChange(block);};
  const move=(index:number,delta:number)=>{const next=[...steps];[next[index],next[index+delta]]=[next[index+delta],next[index]];edit(next);};
  return <section aria-label="Teaching session sequence"><div className="canvas-heading"><h2>Shape a session</h2><span className="canvas-number">{steps.reduce((sum,s)=>sum+s.minutes,0)}<small>minutes</small></span></div><p className="canvas-caption">Illustrative session · adjust the steps and timing.</p><ol className="canvas-session">{steps.map((s,i)=><li key={s.id}><span className="canvas-step-index">{String(i+1).padStart(2,'0')}</span><input aria-label={`Step ${i+1}`} value={s.title} maxLength={100} onChange={e=>edit(steps.map(t=>t.id===s.id?{...t,title:e.target.value}:t))}/><label><span className="sr-only">Minutes for step {i+1}</span><input type="number" min={1} max={120} value={s.minutes} onChange={e=>edit(steps.map(t=>t.id===s.id?{...t,minutes:Math.max(1,Math.min(120,Number(e.target.value)||1))}:t))}/></label><div className="canvas-step-actions"><button aria-label={`Move step ${i+1} up`} disabled={!i} onClick={()=>move(i,-1)}><ArrowUp size={16}/></button><button aria-label={`Move step ${i+1} down`} disabled={i===steps.length-1} onClick={()=>move(i,1)}><ArrowDown size={16}/></button></div></li>)}</ol><button className="canvas-primary" onClick={async()=>{try{await navigator.clipboard.writeText(steps.map((s,i)=>`${i+1}. ${s.title} (${s.minutes} min)`).join('\n'));setCopied(true);}catch{setCopied(false);}}}>{copied?'Copied':'Copy session'}</button></section>;
}
