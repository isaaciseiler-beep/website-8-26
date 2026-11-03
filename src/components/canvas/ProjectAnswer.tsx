import { ArrowUpRight } from 'lucide-react';
import { resolveAnswerPlan, type EvidenceRecord } from '@/lib/portfolioEvidenceRegistry';
import type { CanvasBlock } from '@/lib/genui';
import { PublishedSources } from './PublishedSources';

const labels: Record<string,string> = {
  contribution: 'Isaac’s contribution', process: 'Approach', decisions: 'Decisions',
  outcomes: 'Published outcomes', context: 'Context', sources: 'Source material',
  limits: 'Limits of the published record', lessons: 'Lessons from the work',
};
const partialSubjects: Record<string,string>={contribution:'Isaac’s contribution',process:'the approach',decisions:'the decisions',outcomes:'the outcomes',lessons:'the lessons',context:'the context',sources:'the requested sources',limits:'the limits of these findings'};
const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
function headingFor(kinds: string[]) {
  return list.format(kinds.map((kind,index)=>index===0||kind==='contribution'?labels[kind]:labels[kind].replace(/^./,character=>character.toLowerCase())));
}
type Facet = ReturnType<typeof resolveAnswerPlan>[number];
type ReadingGroup = { facets: Facet[]; evidence: EvidenceRecord[] };
/** A wholly shared question part belongs with the passages that answer it. If
 * those passages span existing groups, merge their groups instead of leaving an
 * empty heading or repeating the same evidence. Distinct new passages keep a
 * distinct reading group. Limited/unavailable status remains attached to its
 * actual question part. */
function readingGroups(facets: Facet[]): ReadingGroup[] {
  const groups: ReadingGroup[]=[];
  const owners=new Map<string,ReadingGroup>();
  for(const facet of facets){
    const unique=facet.evidence.filter(record=>!owners.has(record.id));
    const shared=[...new Set(facet.evidence.flatMap(record=>owners.has(record.id)?[owners.get(record.id)!]:[]))];
    if(!unique.length&&shared.length&&facet.status!=='unavailable'){
      const merged=groups.filter(group=>shared.includes(group));
      const owner=merged[0];
      owner.facets=[...merged.flatMap(group=>group.facets),facet].sort((a,b)=>facets.indexOf(a)-facets.indexOf(b));
      owner.evidence=[...new Map(merged.flatMap(group=>group.evidence).map(record=>[record.id,record])).values()];
      for(const group of merged)if(group!==owner)groups.splice(groups.indexOf(group),1);
      owner.evidence.forEach(record=>owners.set(record.id,owner));
    }else{
      const group={facets:[facet],evidence:unique};
      groups.push(group);
      unique.forEach(record=>owners.set(record.id,group));
    }
  }
  return groups;
}
function Passage({ evidence }: { evidence: EvidenceRecord }) {
  if(evidence.kind==='quote')return <blockquote>{evidence.text}</blockquote>;
  if(evidence.kind==='stat')return <p>{evidence.label}: {evidence.value}</p>;
  if(evidence.kind==='bullet')return <ul><li>{evidence.text}</li></ul>;
  return <p>{evidence.text}</p>;
}
/** The plan carries only verified evidence references. Authored passages remain
 * verbatim, with one primary home even when they support several question parts. */
export function ProjectAnswer({block,onChange,title}:{block:CanvasBlock;onChange:(block:CanvasBlock)=>void;title:string}) {
  const facets=resolveAnswerPlan(block);
  const groups=readingGroups(facets);
  // A primary passage answering a later question part must not disappear into
  // the earlier group's optional supporting disclosure merely because it was
  // deduplicated. Keep one direct answer passage per requested part visible.
  const primary=new Set(facets.flatMap(facet=>{
    const record=facet.evidence.find(item=>item.kind!=='link'&&!(item.kind==='media'&&item.href));
    return record?[record.id]:[];
  }));
  return <div className="portfolio-planned-answer">
    {groups.map((group,index)=>{
      const kinds=[...new Set(group.facets.map(facet=>facet.kind))];
      const heading=headingFor(kinds);
      const passages=group.evidence.filter(record=>record.kind!=='link'&&!(record.kind==='media'&&record.href));
      const links=group.evidence.filter(record=>(record.kind==='link'||record.kind==='media')&&record.href).map(record=>({label:record.label??record.text,href:record.href!}));
      const lead=passages.filter((record,index)=>index<2||primary.has(record.id));
      const rest=passages.filter(record=>!lead.includes(record));
      const limited=group.facets.filter(facet=>facet.status==='limited'&&!(facet.kind==='limits'&&facet.evidence.some(record=>record.kind==='qualification')));
      const unavailable=group.facets.some(facet=>facet.status==='unavailable');
      return <section className="portfolio-answer-facet" key={`${kinds.join(':')}:${index}`} aria-label={heading} data-answer-facets={kinds.join(' ')} data-answer-statuses={group.facets.map(facet=>`${facet.kind}:${facet.status}`).join(' ')}>
        <h3>{heading}</h3>
        {unavailable?<p>The published material does not establish this part of the answer.</p>:<>
          {lead.map(record=><Passage key={record.id} evidence={record}/>)}
          {rest.length>0&&<details className="portfolio-supporting-passage"><summary>Read more supporting evidence</summary>{rest.map(record=><Passage key={record.id} evidence={record}/>)}</details>}
          {links.length>0&&<PublishedSources context={`${title}: ${heading}`} links={links} open={kinds.includes('sources')}/>}
          {limited.length>0&&<p className="canvas-caption">The published material only partially covers {list.format(limited.map(facet=>partialSubjects[facet.kind]))}.</p>}
        </>}
      </section>;
    })}
    <details className="portfolio-answer-context"><summary>Read in context</summary><div>{[...new Map(facets.flatMap(facet=>facet.sections).map(section=>[section.sectionId,section])).values()].map(section=><button className="portfolio-inline-action" key={section.sectionId} onClick={()=>onChange({...block,focus:'evidence',layout:'project-evidence',section:section.sectionIndex,expanded:true,answerPlan:undefined,search:undefined,angle:undefined,paragraphIndices:undefined})}>{section.heading}<ArrowUpRight size={14} aria-hidden="true"/></button>)}<button className="portfolio-inline-action" onClick={()=>onChange({...block,focus:'evidence',layout:'project-evidence',expanded:false,answerPlan:undefined,search:undefined,angle:undefined,paragraphIndices:undefined})}>Explore all published evidence<ArrowUpRight size={14} aria-hidden="true"/></button></div></details>
  </div>;
}
