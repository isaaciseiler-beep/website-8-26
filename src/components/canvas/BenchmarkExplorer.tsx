import { useId, useMemo } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown } from 'lucide-react';
import './benchmark-editorial.css';
import { aiIndexStates, aiIndexCriteria } from '@/lib/aiStateGovIndex';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceFor } from '@/lib/portfolioEvidence';

const governmentsByName = [...aiIndexStates].sort((a, b) => a.state.localeCompare(b.state));
const researchProjectId='artificial-intelligence-in-state-government-index';
const research=evidenceFor(researchProjectId)!;
const benchmarkSource=research.project.sections.flatMap(section=>section.links??[]).find(link=>link.label==='The GenAI Benchmark');
const scoreBand = (score: number) => Math.min(4, Math.floor(score / 20));

export default function BenchmarkExplorer({block,onChange}:{block:CanvasBlock;onChange:(b:CanvasBlock)=>void}) {
  const sourceDescription=useId();
  const expanded=Boolean(block.expanded);
  const band=block.band??null;
  const layout=block.layout??'benchmark-ranking';
  const ranked=useMemo(()=>[...aiIndexStates].filter(s=>block.region==='All'||s.region===block.region).sort((a,b)=>b[block.metric]-a[block.metric]),[block.region,block.metric]);
  const ranks=useMemo(()=>new Map(ranked.map(state=>[state.state,1+ranked.filter(other=>other[block.metric]>state[block.metric]).length])),[ranked,block.metric]);
  const selected=block.states.map(name=>aiIndexStates.find(s=>s.state===name)).filter(Boolean);
  const measure=block.metric==='preparednessScore'?'preparedness':'composite score';
  const measureExplanation=block.metric==='preparednessScore'?'Preparedness uses 15 criteria grounded in publicly verifiable evidence.':'The composite score combines the 15-criteria preparedness score with an efficiency adjustment.';
  const difference=selected.length===2?Math.abs(selected[0][block.metric]-selected[1][block.metric]):0;
  const leader=selected.length===2?(selected[0][block.metric]>selected[1][block.metric]?selected[0]:selected[1]):null;
  const bandStates=band===null?ranked:ranked.filter(s=>scoreBand(s[block.metric])===band);
  const shown=selected.length?selected:bandStates.slice(0,expanded?bandStates.length:7);
  const regional=['East','Midwest','South','West'].map(region=>{const states=aiIndexStates.filter(s=>s.region===region);return {region,count:states.length,average:states.reduce((sum,s)=>sum+s[block.metric],0)/states.length};});
  const bands=Array.from({length:5},(_,index)=>({index,count:ranked.filter(s=>scoreBand(s[block.metric])===index).length}));
  const largestBand=Math.max(1,...bands.map(item=>item.count));
  const choose=(index:number,name:string)=>{
    const states=[...block.states.slice(0,index),name,...block.states.slice(index+1)].filter(Boolean).filter((n,i,a)=>a.indexOf(n)===i);
    onChange({...block,layout:states.length>1?'benchmark-compare':'benchmark-scorecard',states});
  };
  return <section className={`canvas-benchmark benchmark-editorial benchmark-editorial--${layout}${selected.length?' has-selection':''}${selected.length===2?' is-comparison':''}`} aria-label="AI benchmark explorer">
    <div className="canvas-heading benchmark-heading"><div><h2>{layout==='benchmark-regions'?'Regional comparison':layout==='benchmark-distribution'?'Score distribution':selected.length>1?'Government comparison':selected.length===1?selected[0].state:'AI in state government'}</h2></div></div>
    {selected.length>0&&<div className="canvas-scorecards">{selected.map((s,index)=><article key={s.state} aria-label={`${s.state} score`}><label className="benchmark-government-choice"><span className="benchmark-government-name" aria-hidden="true"><span>{s.state}</span><ChevronDown size={16}/></span><span className="sr-only">Government {index+1}</span><select className="benchmark-government-native" aria-label={index===0?'First government':'Second government'} value={s.state} onChange={e=>choose(index,e.target.value)}>{governmentsByName.filter(v=>v.state===s.state||!block.states.includes(v.state)).map(v=><option key={v.state}>{v.state}</option>)}</select></label>{layout!=='benchmark-criteria'&&<><strong className="benchmark-score-figure">{s[block.metric].toFixed(1)}<small> / 100</small></strong><span className="canvas-score-rank">Rank {1+aiIndexStates.filter(t=>t[block.metric]>s[block.metric]).length} of {aiIndexStates.length}{aiIndexStates.some(t=>t.state!==s.state&&t[block.metric]===s[block.metric])&&<span> · tied</span>}</span><span className="canvas-mini-track"><i style={{width:`${s[block.metric]}%`}}/></span></>}</article>)}</div>}
    {selected.length===2&&layout!=='benchmark-criteria'&&<p className="canvas-comparison-insight">{difference===0?`${selected[0].state} and ${selected[1].state} are tied on ${measure}.`:`${leader!.state} leads by ${difference<.1?'less than 0.1':difference.toFixed(1)} points on ${measure}.`}</p>}
    <div className="benchmark-study-context">
      <p>Isaac’s public-information benchmark of AI adoption across U.S. states and territories · August 2025 snapshot.</p>
      <div className="benchmark-study-actions">
        <button className="portfolio-inline-action" aria-label="Explore Isaac’s research" onClick={()=>onChange({...blankBlock('story'),projectIds:[researchProjectId],focus:'role',layout:'project-brief',section:0})}>Isaac’s research<ArrowUpRight size={15} aria-hidden="true"/></button>
        {benchmarkSource&&<><a href={benchmarkSource.href} target="_blank" rel="noreferrer" aria-label={benchmarkSource.label} aria-describedby={sourceDescription}>Source data<ArrowUpRight size={14} aria-hidden="true"/></a><span id={sourceDescription} className="sr-only">Opens in a new tab.</span></>}
      </div>
    </div>
    {!selected.length&&layout!=='benchmark-criteria'&&<div className="portfolio-tabs" role="group" aria-label="Explore benchmark">{([{id:'benchmark-ranking',label:'Rankings'},{id:'benchmark-regions',label:'Regions'},{id:'benchmark-distribution',label:'Distribution'}] as const).map(view=><button key={view.id} aria-pressed={layout===view.id} onClick={()=>onChange({...block,layout:view.id,band:null})}>{view.label}</button>)}</div>}
    <div className="canvas-benchmark-controls">
      <label><span className="sr-only">Measure</span><select aria-label="Benchmark measure" value={block.metric} onChange={e=>onChange({...block,metric:e.target.value as CanvasBlock['metric']})}><option value="compositeScore">Composite score</option><option value="preparednessScore">Preparedness</option></select></label>
      {!selected.length&&layout!=='benchmark-regions'&&<label><span className="sr-only">Region</span><select aria-label="Benchmark region" value={block.region} onChange={e=>{onChange({...block,region:e.target.value as CanvasBlock['region'],states:[],band:null});}}>{['All','East','Midwest','South','West'].map(r=><option key={r} value={r}>{r==='All'?'All regions':r}</option>)}</select></label>}
      {!selected.length&&<label><span className="sr-only">Government</span><select aria-label="First government" value="" onChange={e=>e.target.value&&choose(0,e.target.value)}><option value="">Find a government</option>{governmentsByName.map(s=><option key={s.state}>{s.state}</option>)}</select></label>}
      {selected.length>0&&<button className="portfolio-inline-action canvas-return" aria-label="All governments" onClick={()=>onChange({...block,layout:'benchmark-ranking',region:'All',states:[],band:null})}><ArrowLeft size={14} aria-hidden="true"/><span>All<span className="benchmark-return-description"> governments</span></span></button>}
      {selected.length===1&&<label className="canvas-add-comparison"><span className="sr-only">Compare with</span><select aria-label="Second government" value="" onChange={e=>choose(1,e.target.value)}><option value="">Compare with…</option>{governmentsByName.filter(s=>s.state!==block.states[0]).map(s=><option key={s.state}>{s.state}</option>)}</select></label>}
    </div>
    {layout==='benchmark-regions'&&<div className="canvas-regions">{regional.map(r=><button key={r.region} className="canvas-surface" onClick={()=>onChange({...block,layout:'benchmark-ranking',region:r.region as CanvasBlock['region'],states:[]})}><span className="benchmark-region-name">{r.region}<ArrowUpRight size={16} aria-hidden="true"/></span><strong>{r.average.toFixed(1)}<small> / 100</small></strong><small>Mean score · {r.count} governments</small><span className="canvas-mini-track"><i style={{width:`${r.average}%`}}/></span></button>)}</div>}
    {layout==='benchmark-distribution'&&<div className="canvas-distribution" aria-label="Score distribution">{bands.map(({index:i,count})=><button key={i} aria-label={`${count} ${count===1?'government':'governments'}, score ${i*20} to ${i===4?'100':`under ${(i+1)*20}`}`} aria-pressed={band===i} onClick={()=>onChange({...block,band:band===i?null:i})}><span className="canvas-histogram-track"><i style={{height:`${count/largestBand*100}%`}}><strong>{count}</strong></i></span><span>{i*20}–{i===4?100:(i+1)*20}</span></button>)}</div>}
    {!selected.length&&layout!=='benchmark-regions'&&layout!=='benchmark-criteria'&&<div className="canvas-bars" aria-label="Government scores">{shown.map(s=><button key={s.state} onClick={()=>onChange({...block,layout:selected.length>1?'benchmark-compare':'benchmark-scorecard',states:selected.length>1?block.states:[s.state]})} aria-label={`Inspect ${s.state}, score ${s[block.metric].toFixed(1)}`} className="canvas-bar"><span className="canvas-bar-fill" style={{width:`${s[block.metric]}%`}}/><span className="canvas-bar-label"><small>{String(ranks.get(s.state)).padStart(2,'0')}</small><span>{s.state}</span></span><strong>{s[block.metric].toFixed(1)}<ArrowUpRight size={15} aria-hidden="true"/></strong></button>)}</div>}
    {!selected.length&&layout!=='benchmark-regions'&&layout!=='benchmark-criteria'&&bandStates.length>7&&<button className="canvas-text-button" onClick={()=>{onChange({...block,expanded:!expanded});}}>{expanded?'Show fewer':band===null?'Show all governments':'Show all in this range'}</button>}
    {!selected.length&&layout==='benchmark-distribution'&&!bandStates.length&&<p className="canvas-caption">No governments in this score range. Select another range to explore.</p>}
    {!selected.length&&layout==='benchmark-criteria'&&<p>Choose a government to inspect its evidence.</p>}
    {selected.length>0&&<details className="canvas-evidence-disclosure" key={layout==='benchmark-criteria'?'evidence':'scores'} open={layout==='benchmark-criteria'?true:undefined}><summary>Evidence breakdown</summary><p className="canvas-caption">A zero means no qualifying public evidence was recorded for that criterion in this snapshot; it does not establish that no activity occurred.</p><div className="canvas-criteria" role="table" aria-label="Criterion breakdown"><div className="canvas-criterion" role="row"><span role="columnheader">Evidence</span>{selected.map(s=><strong role="columnheader" key={s.state}>{s.state}</strong>)}</div>{aiIndexCriteria.map(c=><div className="canvas-criterion" role="row" key={c.key}><span role="rowheader">{c.label}</span>{selected.map(s=><span key={s.state} className="canvas-dots" role="cell" aria-label={`${s.state}: ${s.criteria[c.key]} of ${c.max}`}>{Array.from({length:c.max},(_,i)=><i key={i} aria-hidden="true" className={s.criteria[c.key]>i?'is-filled':''}/>)}<small>{s.criteria[c.key]}/{c.max}</small></span>)}</div>)}</div></details>}
    <details className="canvas-sources canvas-benchmark-about"><summary>About this benchmark</summary><p>{research.contribution}</p><p>{measureExplanation}</p><p>Scores are shown to one decimal place. Equal underlying scores share a rank; the next rank skips the tied positions. Rankings compare governments within the selected region, while individual scorecards show the overall rank.</p></details>
  </section>;
}
