import { projectAngleAnswer } from './portfolioEvidence.js';
import { experienceEntries } from './experience.js';
import { projectEvidenceScope } from './portfolioEvidenceManifest.js';
import { z } from 'zod';
import { projectItems, hiddenProjectIds } from './siteContent.js';

export const answerFacetKinds = ['contribution', 'process', 'decisions', 'outcomes', 'lessons', 'context', 'sources', 'limits'] as const;
export const answerPlanSchema = z.object({
  version: z.literal(1),
  facets: z.array(z.object({
    kind: z.enum(answerFacetKinds),
    evidenceIds: z.array(z.string().min(1).max(220)).max(4),
    status: z.enum(['supported', 'limited', 'unavailable']),
  }).strict()).min(1).max(6),
}).strict();
export type AnswerPlan = z.infer<typeof answerPlanSchema>;
export type EvidenceRecord = Readonly<{
  id: string; projectId: string; sectionId: string; sectionIndex: number; sectionHeading: string;
  kind: 'paragraph' | 'bullet' | 'quote' | 'stat' | 'link' | 'media' | 'qualification';
  provenance?:'published-project'|'reviewed-qualification';
  itemIndex: number; paragraphIndex?: number; text: string; href?: string; label?: string; value?: string;
}>;

/** Two independent 32-bit hashes avoid positional IDs. Whitespace changes are
 * harmless; edited/deleted evidence receives a new ID and cannot silently drift. */
export function evidenceFingerprint(value: string): string {
  const text=value.normalize('NFC').replace(/\s+/g,' ').trim();
  let a=2166136261,b=5381;
  for(let index=0;index<text.length;index++){a=Math.imul(a^text.charCodeAt(index),16777619);b=Math.imul(b,33)^text.charCodeAt(index);}
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
export const stableSectionId = (projectId:string,heading:string) => `${projectId}:s:${evidenceFingerprint(heading)}`;
export const stableEvidenceId = (projectId:string,kind:EvidenceRecord['kind'],text:string,href='') => `${projectId}:${kind}:${evidenceFingerprint(text+'\u0000'+href)}`;

const publishedEvidenceRecords: readonly EvidenceRecord[] = projectItems.filter(project=>!hiddenProjectIds.has(project.id)).flatMap(project=>
  project.sections.flatMap((section,sectionIndex)=>{
    const records:EvidenceRecord[]=[];
    const add=(kind:EvidenceRecord['kind'],text:string,itemIndex:number,extra:Partial<EvidenceRecord>={})=>{
      if(!text.trim())return;
      records.push(Object.freeze({id:stableEvidenceId(project.id,kind,text,extra.href),projectId:project.id,sectionId:stableSectionId(project.id,section.heading),sectionIndex,sectionHeading:section.heading,kind,itemIndex,text,...extra}));
    };
    section.paragraphs?.forEach((text,index)=>add('paragraph',text,index,{paragraphIndex:index}));
    section.bullets?.forEach((text,index)=>add('bullet',text,index));
    if(section.pullQuote)add('quote',section.pullQuote,0);
    section.stats?.forEach((stat,index)=>add('stat',`${stat.label}: ${stat.value}`,index,{label:stat.label,value:stat.value}));
    section.links?.forEach((link,index)=>add('link',link.label,index,{href:link.href,label:link.label}));
    section.media?.forEach((media,index)=>{
      const text=media.caption??media.title??media.alt;
      if(text)add('media',text,index,{href:media.href??media.src??media.poster});
    });
    return records;
  }));
// This qualification is existing reviewed site copy. It describes the scope
// of the published Lab record and must never be presented as a measured result
// or as a quotation from a particular product diary.
const labProject=projectItems.find(project=>project.id==='openai-product-testing-and-feedback')!;
const labQualification=projectAngleAnswer(labProject.id,'measurement')!;
export const portfolioEvidenceRegistry:readonly EvidenceRecord[]=[...publishedEvidenceRecords,Object.freeze({
  id:stableEvidenceId(labProject.id,'qualification',labQualification),projectId:labProject.id,
  sectionId:stableSectionId(labProject.id,labProject.sections[0].heading),sectionIndex:0,sectionHeading:labProject.sections[0].heading,
  kind:'qualification' as const,provenance:'reviewed-qualification' as const,itemIndex:0,text:labQualification,
})];
const byId = new Map(portfolioEvidenceRegistry.map(record=>[record.id,record]));
const bySection = new Map<string,EvidenceRecord[]>();
for(const record of portfolioEvidenceRegistry){const key=`${record.projectId}:${record.sectionIndex}`;const list=bySection.get(key)??[];list.push(record);bySection.set(key,list);}
export const getEvidence = (id:string):EvidenceRecord|undefined=>byId.get(id);
export const evidenceForSection = (projectId:string,index:number):readonly EvidenceRecord[]=>bySection.get(`${projectId}:${index}`)??[];
export const ANSWER_READING_WORD_BUDGET=1100;
export function validateAnswerPlan(plan:AnswerPlan,projectIds:readonly string[]):boolean {
  const all=plan.facets.flatMap(facet=>facet.evidenceIds);
  if([...new Set(all)].reduce((count,id)=>count+(getEvidence(id)?.text.split(/\s+/).length??0),0)>ANSWER_READING_WORD_BUDGET)return false;
  if(new Set(all).size>12||plan.facets.some(facet=>new Set(facet.evidenceIds).size!==facet.evidenceIds.length))return false;
  return plan.facets.every(facet=>facet.status==='unavailable'?facet.evidenceIds.length===0:facet.evidenceIds.length>0)
    && all.every(id=>{const record=getEvidence(id);return record&&projectIds.includes(record.projectId);});
}
/** Renderers and evaluators use the same verified current evidence, never model
 * prose or an arbitrary URL. Old blocks without a plan remain valid. */
export function resolveAnswerPlan(block:{answerPlan?:AnswerPlan;projectIds?:readonly string[]}) {
  if(!block.answerPlan||!validateAnswerPlan(block.answerPlan,block.projectIds??[]))return [];
  return block.answerPlan.facets.map(facet=>{
    const evidence=facet.evidenceIds.map(id=>getEvidence(id)!);
    const sections=[...new Map(evidence.map(record=>[record.sectionId,{projectId:record.projectId,sectionIndex:record.sectionIndex,sectionId:record.sectionId,heading:record.sectionHeading}])).values()];
    return {kind:facet.kind,status:facet.status,evidence,sections};
  });
}

export const portfolioCoverageMatrix = projectItems.filter(project=>!hiddenProjectIds.has(project.id)).map(project=>({
  projectId:project.id,title:project.title,year:project.year,roles:experienceEntries.filter(role=>role.projectIds.includes(project.id)).map(role=>role.id),outcomeTypes:projectEvidenceScope[project.id]?.outcomeTypes??[],
  sections:project.sections.map((section,index)=>({id:stableSectionId(project.id,section.heading),index,heading:section.heading,
    passages:evidenceForSection(project.id,index).map(record=>record.id),artifacts:evidenceForSection(project.id,index).filter(record=>record.kind==='link').map(record=>record.id)})),
}));

/** Content maintenance can surface exactly which stable citations now need a
 * review. No stale citation is rebound to nearby text or an identically numbered paragraph. */
export function evidenceChangeEffects(previousIds:readonly string[]){
  const previous=new Set(previousIds);
  return {retained:[...previous].filter(id=>byId.has(id)),removed:[...previous].filter(id=>!byId.has(id)),added:portfolioEvidenceRegistry.filter(record=>!previous.has(record.id)).map(record=>record.id)};
}

export const portfolioRoleCoverage=experienceEntries.map(role=>({id:role.id,organization:role.organization,period:role.period,projectIds:role.projectIds.filter(id=>!hiddenProjectIds.has(id))}));
