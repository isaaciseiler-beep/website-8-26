import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { aiIndexStates, aiIndexCriteria } from '@/lib/aiStateGovIndex';
import { type CanvasBlock } from '@/lib/genui';

export default function BenchmarkExplorer({block,onChange}:{block:CanvasBlock;onChange:(b:CanvasBlock)=>void}) {
  const expanded=Boolean(block.expanded);
  const band=block.band??null;
  const layout=block.layout??'benchmark-ranking';
  const ranked=useMemo(()=>[...aiIndexStates].filter(s=>block.region==='All'||s.region===block.region).sort((a,b)=>b[block.metric]-a[block.metric]),[block.region,block.metric]);
  const selected=block.states.map(name=>aiIndexStates.find(s=>s.state===name)).filter(Boolean);
  const bandStates=band===null?ranked:ranked.filter(s=>Math.min(4,Math.floor(s[block.metric]/20))===band);
  const shown=selected.length?selected:bandStates.slice(0,expanded?bandStates.length:7);
  const regional=['East','Midwest','South','West'].map(region=>{const states=aiIndexStates.filter(s=>s.region===region);return {region,count:states.length,average:states.reduce((sum,s)=>sum+s[block.metric],0)/states.length};});
  const bands=Array.from({length:5},(_,index)=>({index,count:ranked.filter(s=>Math.min(4,Math.floor(s[block.metric]/20))===index).length}));
  const largestBand=Math.max(1,...bands.map(item=>item.count));
  const choose=(index:number,name:string)=>{
    const states=[...block.states.slice(0,index),name,...block.states.slice(index+1)].filter(Boolean).filter((n,i,a)=>a.indexOf(n)===i);
    onChange({...block,layout:states.length>1?'benchmark-compare':'benchmark-scorecard',states});
  };
  return <section className="canvas-benchmark" aria-label="AI benchmark explorer">
    <div className="canvas-heading"><div><span className="canvas-eyebrow">State AI benchmark · August 2025</span><h2>{layout==='benchmark-regions'?'Regional comparison':layout==='benchmark-distribution'?'Score distribution':selected.length>1?'Government comparison':selected.length===1?selected[0].state:'AI in state government'}</h2></div></div>
    {!selected.length&&<p className="canvas-caption">Explore public evidence of AI policies, training, and adoption.</p>}
    {!selected.length&&layout!=='benchmark-criteria'&&<div className="portfolio-tabs" aria-label="Explore benchmark">{([{id:'benchmark-ranking',label:'Rankings'},{id:'benchmark-regions',label:'Regions'},{id:'benchmark-distribution',label:'Distribution'}] as const).map(view=><button key={view.id} aria-pressed={layout===view.id} onClick={()=>onChange({...block,layout:view.id,band:null})}>{view.label}</button>)}</div>}
    <div className="canvas-benchmark-controls">
      <label><span className="sr-only">Measure</span><select aria-label="Benchmark measure" value={block.metric} onChange={e=>onChange({...block,metric:e.target.value as CanvasBlock['metric']})}><option value="compositeScore">Composite score</option><option value="preparednessScore">Preparedness</option></select></label>
      {!selected.length&&layout!=='benchmark-regions'&&<label><span className="sr-only">Region</span><select aria-label="Benchmark region" value={block.region} onChange={e=>{onChange({...block,region:e.target.value as CanvasBlock['region'],states:[],band:null});}}>{['All','East','Midwest','South','West'].map(r=><option key={r} value={r}>{r==='All'?'All regions':r}</option>)}</select></label>}
      {!selected.length&&<label><span className="sr-only">Government</span><select aria-label="First government" value="" onChange={e=>e.target.value&&choose(0,e.target.value)}><option value="">Find a government</option>{aiIndexStates.map(s=><option key={s.state}>{s.state}</option>)}</select></label>}
      {selected.length>0&&<button className="portfolio-inline-action canvas-return" onClick={()=>onChange({...block,layout:'benchmark-ranking',region:'All',states:[],band:null})}><ArrowLeft size={14} aria-hidden="true"/>All governments</button>}
    </div>
    {layout==='benchmark-regions'&&<div className="canvas-regions">{regional.map(r=><button key={r.region} className="canvas-surface" onClick={()=>onChange({...block,layout:'benchmark-ranking',region:r.region as CanvasBlock['region'],states:[]})}><span>{r.region}</span><strong>{r.average.toFixed(1)}</strong><small>Mean score · {r.count} governments</small><span className="canvas-mini-track"><i style={{width:`${r.average}%`}}/></span></button>)}</div>}
    {layout==='benchmark-distribution'&&<div className="canvas-distribution" aria-label="Score distribution">{bands.map(({index:i,count})=><button key={i} aria-label={`${count} ${count===1?'government':'governments'}, score ${i*20} to ${i===4?100:(i+1)*20}`} aria-pressed={band===i} onClick={()=>onChange({...block,band:band===i?null:i})}><span className="canvas-histogram-track"><i style={{height:`${count/largestBand*100}%`}}><strong>{count}</strong></i></span><span>{i*20}–{i===4?100:(i+1)*20}</span></button>)}</div>}
    {selected.length>0&&<div className="canvas-scorecards">{selected.map((s,index)=><article key={s.state} aria-label={`${s.state} score`}><label><span className="sr-only">Government {index+1}</span><select aria-label={index===0?'First government':'Second government'} value={s.state} onChange={e=>choose(index,e.target.value)}>{aiIndexStates.filter(v=>v.state===s.state||!block.states.includes(v.state)).map(v=><option key={v.state}>{v.state}</option>)}</select></label>{layout!=='benchmark-criteria'&&<><strong>{s[block.metric].toFixed(1)}<small> / 100</small></strong><span className="canvas-score-rank">Rank {1+aiIndexStates.filter(t=>t[block.metric]>s[block.metric]).length} of {aiIndexStates.length}</span><span className="canvas-mini-track"><i style={{width:`${s[block.metric]}%`}}/></span></>}</article>)}{selected.length===1&&<label className="canvas-add-comparison"><span className="sr-only">Compare with</span><select aria-label="Second government" value="" onChange={e=>choose(1,e.target.value)}><option value="">Compare with…</option>{aiIndexStates.filter(s=>s.state!==block.states[0]).map(s=><option key={s.state}>{s.state}</option>)}</select></label>}</div>}
    {!selected.length&&layout!=='benchmark-regions'&&layout!=='benchmark-criteria'&&<div className="canvas-bars" aria-label="Government scores">{shown.map((s,i)=><button key={s.state} onClick={()=>onChange({...block,layout:selected.length>1?'benchmark-compare':'benchmark-scorecard',states:selected.length>1?block.states:[s.state]})} aria-label={`Inspect ${s.state}, score ${s[block.metric].toFixed(1)}`} className="canvas-bar"><span className="canvas-bar-fill" style={{width:`${Math.max(1,s[block.metric])}%`}}/><span className="canvas-bar-label"><small>{selected.length?String(i+1).padStart(2,'0'):String(ranked.indexOf(s)+1).padStart(2,'0')}</small>{s.state}</span><strong>{s[block.metric].toFixed(1)}</strong></button>)}</div>}
    {!selected.length&&layout!=='benchmark-regions'&&layout!=='benchmark-criteria'&&bandStates.length>7&&<button className="canvas-text-button" onClick={()=>{onChange({...block,expanded:!expanded});}}>{expanded?'Show fewer':band===null?'Show all governments':'Show all in this range'}</button>}
    {!selected.length&&layout==='benchmark-distribution'&&!bandStates.length&&<p className="canvas-caption">No governments in this score range. Select another range to explore.</p>}
    {!selected.length&&layout==='benchmark-criteria'&&<p>Choose a government to inspect its evidence.</p>}
    {selected.length>0&&<details className="canvas-evidence-disclosure" key={layout==='benchmark-criteria'?'evidence':'scores'} open={layout==='benchmark-criteria'?true:undefined}><summary>Evidence breakdown</summary><div className="canvas-criteria" aria-label="Criterion breakdown"><div className="canvas-criterion"><span>Evidence</span>{selected.map(s=><strong key={s.state}>{s.state}</strong>)}</div>{aiIndexCriteria.map(c=><div className="canvas-criterion" key={c.key}><span>{c.label}</span>{selected.map(s=><span key={s.state} className="canvas-dots" aria-label={`${s.state}: ${s.criteria[c.key]} of ${c.max}`}>{Array.from({length:c.max},(_,i)=><i key={i} className={s.criteria[c.key]>i?'is-filled':''}/>)}<small>{s.criteria[c.key]}/{c.max}</small></span>)}</div>)}</div></details>}

  </section>;
}
