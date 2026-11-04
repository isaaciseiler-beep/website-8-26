import { answerPlanSchema, validateAnswerPlan, getEvidence } from './portfolioEvidenceRegistry.js';
import { buildAnswerPlan } from './portfolioAnswerPlan.js';
import { connectionIds, connectionForRequest } from './portfolioConnections.js';
import { careerAnswerIds, careerAnswerFor, careerAnswers, careerConnectionFor } from './careerAnswers.js';
import { z } from 'zod';
import { albums, publicProjects, localPlan, initialPlan, type Plan } from './canvas.js';
import { aiIndexStates } from './aiStateGovIndex.js';
import { layoutIds, liveLayoutIds, layoutDefinition, defaultLayout, type LayoutId } from './layouts.js';
import { evidenceFocuses, evidenceSections } from './portfolioEvidence.js';
import { experienceEntries } from './experience.js';
import { findPublishedSection, findPublishedParagraphs, publishedQueryTerms, publishedPhrasePosition } from './portfolioRetrieval.js';
import { interpretPortfolioRequest, namedProjects, requestedFocus, personalProjectFocus, requestedAngle, requestedSourceAccess, requestsGovernmentDataset, portfolioAngles, correctedPortfolioRequest, isReadingTransformation, isUnspecifiedComparison } from './portfolioIntent.js';

export const blockSchema = z.object({
  kind: z.enum(['benchmark', 'photos', 'workshop', 'story', 'comparison', 'timeline', 'architecture', 'contact', 'collection']),
  layout: z.enum(layoutIds).optional(),
  projectIds: z.array(z.string()).max(3),
  albumIds: z.array(z.string()).max(3),
  states: z.array(z.string()).max(2),
  region: z.enum(['All', 'East', 'Midwest', 'South', 'West']),
  metric: z.enum(['compositeScore', 'preparednessScore']),
  section: z.number().int().min(0).max(2000),
  answerPlan: answerPlanSchema.optional(),
  paragraphIndices: z.array(z.number().int().min(0).max(2000)).max(3).optional(),
  focus: z.enum(evidenceFocuses).optional(),
  angle: z.enum(portfolioAngles).optional(),
  answerId: z.enum(careerAnswerIds).optional(),
  connectionId: z.enum(connectionIds).optional(),
  roleId: z.string().max(80).optional(),
  search: z.string().max(120).optional(),
  expanded: z.boolean().optional(),
  band: z.number().int().min(0).max(4).nullable().optional(),
});
export const compositionSchema = z.object({ blocks: z.array(blockSchema).min(1).max(3) });
export const liveCompositionSchema = z.object({supported:z.boolean().optional(),blocks:z.array(blockSchema.extend({
  kind:z.enum(['benchmark','story','comparison','timeline','architecture','contact','collection']),
  layout:z.enum(liveLayoutIds).optional(),albumIds:z.array(z.string()).max(0),
})).min(1).max(3)});
export function isPhotographyRequest(text:string, plan?:Plan):boolean {
  const photography=/\b(?:photograph\w*|photos?|photojournalis\w*|albums?|galler(?:y|ies)|diptychs?|contact sheets?|pictures?|images?)\b/i;
  if(!photography.test(text)&&plan?.layout!=='photos')return false;
  // A separate request about actual work can accompany a photo request. Generic
  // words such as "project" or "career" inside the photo request cannot do that.
  const workTopic=/\b(?:career|experience|background|current role|public service|teaching|educat\w*|literacy|policy|government|journalis\w*|congress\w*|rebrand\w*|boehringer|product testing|product feedback|study mode|pulse|atlas|group chats?|100 chats|publications?|articles?|writing|website|architecture)\b/i;
  const clauses=text.split(/\b(?:and|also|alongside|plus|as well as|but)\b|[;?]/i);
  if(clauses.some(clause=>!photography.test(clause)&&workTopic.test(clause)))return false;
  const illustration=text.match(/\b(?:with|including|illustrated by|accompanied by)\s+(?:(?:some|relevant|a few|the|your|his)\s+)?(?:photos?|photographs?|pictures?|images?)\b/i);
  if(illustration){
    const subject=text.slice(0,illustration.index);
    if(!photography.test(subject)&&(workTopic.test(subject)||/\b(?:projects?|outcomes?|contribution|process|role)\b/i.test(subject)))return false;
  }
  const photoAction=/^\s*(?:(?:please|can you|could you|can i|i want to)\s+)*(?:show|open|view|browse|find|see|explore|display)\b[^;?]{0,60}\b(?:photograph\w*|photos?|albums?|galler(?:y|ies)|pictures?|images?)\b/i;
  if(photoAction.test(text))return true;
  const professionalSubject=/\b(?:teaching|educat\w*|literacy|policy|government|journalis\w*|congress\w*|rebrand\w*|boehringer|product testing|product feedback|study mode|pulse|atlas|group chats?|100 chats|publications?|articles?|writing|website|architecture)\b/i;
  const workQuestion=/\b(?:what|how|why|explain|describe|contribut\w*|responsibilit\w*|methodology|outcomes?)\b/i;
  return !(professionalSubject.test(text)&&workQuestion.test(text));
}
/** A country named only in a photo clause must not become a work subject. */
function withoutPhotoClauses(text:string):string {
  const clauses=text.split(/\b(?:and|also|alongside|plus|as well as|but)\b|[;?]/i).map(clause=>clause.trim()).filter(Boolean);
  const work=clauses.filter(clause=>!isPhotographyRequest(clause));
  return work.length>0&&work.length<clauses.length&&work.every(clause=>interpretPortfolioRequest(clause).task!=='unknown')?work.join(' alongside '):text;
}
/** Requests that need a starting point rather than an inferred project. */
export function explorationGuidance(text:string, plan?:Plan):'welcome'|'unmatched'|null {
  const q=text.trim().toLowerCase().replace(/[.!?]+$/,'').trim();
  if (/^(hi|hello|hey|hey there|hi there|hello there|good morning|good afternoon|good evening|help|thanks|thank you|what can (you|i) (do|ask)|where (do|should) i start|show me around|tell me|tell me about|tell me about your|show me|show me your)$/.test(q)) return 'welcome';
  return plan?.layout==='empty'?'unmatched':null;
}
/** Explicit control edits need neither a classifier nor a composition model. */
export function isLocalCompositionRefinement(text:string, previous?:Composition):boolean {
  if(!previous)return false;
  const q=text.trim();
  if(previous.blocks.some(block=>block.answerId==='connections') && (/^(?:show (?:the )?)?(?:contribution|process|outcomes)[.!?]?$/i.test(q) || connectionForRequest(q))) return true;
  if(previous.blocks.some(block=>block.kind==='benchmark'))return /^(?:(?:please )?(?:use|only|show)(?: me)? (?:the )?)?(?:preparedness|composite)(?: score)?[.!?]?$|^(?:only |show |show only )?(?:midwest|east|south|west)[.!?]?$|^(?:show |show me )?(?:all (?:states|governments)|(?:the )?(?:rankings?|criteria|distribution|regions))[.!?]?$/i.test(q);
  return false;
}
export type CanvasBlock = z.infer<typeof blockSchema>;
export type Composition = z.infer<typeof compositionSchema>;
export const blankBlock = (kind: CanvasBlock['kind']): CanvasBlock => ({kind,layout:defaultLayout[kind],projectIds:[],albumIds:[],states:[],region:'All',metric:'compositeScore',section:0,focus:'overview',roleId:'',search:'',expanded:false,band:null});
export const POLICY_ID = 'artificial-intelligence-in-state-government-index';
export const TAIWAN_ID = 'fulbright-focus-group-sponsored-by-openai';
export function explicitProjects(text: string) {
  return namedProjects(text);
}
export type CompositionValidationIssue='shape'|'answer_plan'|'duplicate_states'|'layout_kind'|'benchmark_states'|'career_reference'|'content_reference'|'project_count'|'section'|'paragraph_indices';
export function validateComposition(value: unknown, reportInvalid?:(issue:CompositionValidationIssue)=>void): Composition | null {
  const reject=(issue:CompositionValidationIssue)=>{reportInvalid?.(issue);return null;};
  const result = liveCompositionSchema.safeParse(value);
  if (!result.success) return reject('shape');
  for (const b of (result.data as Composition).blocks) {
    if(b.answerPlan&&(b.kind!=='story'||!validateAnswerPlan(b.answerPlan,b.projectIds)))return reject('answer_plan');
    if(new Set(b.states).size!==b.states.length)return reject('duplicate_states');
    if (b.layout && layoutDefinition(b.layout).kind !== b.kind) return reject('layout_kind');
    if (b.layout === 'benchmark-compare' && b.states.length !== 2) return reject('benchmark_states');
    if (b.layout === 'benchmark-scorecard' && b.states.length !== 1) return reject('benchmark_states');
    if (b.answerId && b.kind !== 'timeline') return reject('career_reference');
    if (b.connectionId && (b.kind !== 'timeline' || b.answerId !== 'connections')) return reject('career_reference');
    if (b.roleId && !experienceEntries.some(entry => entry.id === b.roleId)) return reject('career_reference');
    if (b.projectIds.some(id=>!publicProjects.some(p=>p.id===id)) || b.albumIds.some(id=>!albums.some(a=>a.folder===id)) || b.states.some(name=>!aiIndexStates.some(s=>s.state===name))) return reject('content_reference');
    if (b.kind === 'comparison' && (b.projectIds.length !== 2 || new Set(b.projectIds).size !== 2)) return reject('project_count');
    if ((b.kind === 'story' || b.kind === 'workshop') && b.projectIds.length !== 1) return reject('project_count');
    if (b.kind === 'photos' && !b.albumIds.length) return reject('content_reference');
    if (b.kind === 'workshop' && (b.projectIds[0] !== TAIWAN_ID || b.section > 3)) return reject('section');
    if (b.kind === 'timeline' && b.section > 2) return reject('section');
    if (b.kind === 'architecture' && b.section > 3) return reject('section');
    if (b.kind === 'photos' && b.section >= (albums.find(a=>a.folder===b.albumIds[0])?.photos.length ?? 0)) return reject('section');
    if (b.kind === 'story' && b.section >= (publicProjects.find(p=>p.id===b.projectIds[0])?.sections.length ?? 0)) return reject('section');
    if (b.paragraphIndices?.length && (b.kind !== 'story' || new Set(b.paragraphIndices).size !== b.paragraphIndices.length || b.paragraphIndices.some(index => index >= (publicProjects.find(p=>p.id===b.projectIds[0])?.sections[b.section]?.paragraphs?.length ?? 0)))) return reject('paragraph_indices');
  }
  return result.data;
}
function stateNames(text: string) {
  text=text.replace(/\bWashington(?:\s*,\s*|\s+)D\.?\s*C\.?\b/gi,'District of Columbia');
  // Consume full names before their substrings (West Virginia before Virginia).
  const names=aiIndexStates.map(state=>state.state).sort((a,b)=>b.length-a.length);
  const pattern=new RegExp('\\b(?:'+names.join('|')+')\\b','gi');
  return [...new Set([...text.matchAll(pattern)].map(match=>names.find(name=>name.toLowerCase()===match[0].toLowerCase())!))].slice(0,2);
}
function requestsGovernmentData(text:string,task:string){
  if(requestedAngle(text)==='measurement'&&/caus|because|attribut|prove/i.test(text))return false;
  if(personalProjectFocus(text))return false;
  if(requestsGovernmentDataset(text))return true;
  if(task!=='comparison'&&stateNames(text).length===2&&/\b(?:compare|versus|vs)\b/i.test(text))return true;
  if(['story','comparison','timeline','architecture','contact'].includes(task))return false;
  const personal=/\b(?:isaac|you|your|he|his)\b/i.test(text)&&/\b(?:did|do|work|career|role|contribut\w*|responsibilit\w*|research|methodology|learn\w*)\b/i.test(text);
  return !personal;
}
// Whole-project entry points need the reviewed responsibility and published
// outcome together. Subtract subject wording and generic request language;
// discriminative detail (e.g. "early and uneven") retains precise passages.
const policyOverviewTerms=new Set(publishedQueryTerms('AI artificial intelligence generative GenAI state states territory territories government governments policy adoption index benchmark public information project research work explain explore introduction overview describe discover discovery reveal findings results purpose about'));
function requestsPolicyOverview(text:string):boolean {
  const ids=namedProjects(text),focus=requestedFocus(text);
  return ids.length===1&&ids[0]===POLICY_ID&&!requestsGovernmentDataset(text)&&!requestedAngle(text)
    &&focus!=='process'&&focus!=='evidence'&&!requestedSourceAccess(text)
    &&!/[;,]|\band\s+(?:what|how|why|which)\b/i.test(text)
    &&publishedQueryTerms(text).every(term=>policyOverviewTerms.has(term));
}
function contextualPolicyStory(block:CanvasBlock,text:string):CanvasBlock {
  const findings=requestedFocus(text)==='outcomes';
  return {...block,kind:'story',projectIds:[POLICY_ID],layout:findings?'project-outcomes':'project-brief',focus:findings?'outcomes':'role',section:0,
    // An explicit findings question keeps the authored responsibility/context
    // immediately before the headline result, rather than an orphaned finding.
    paragraphIndices:findings?[1,2]:undefined,answerPlan:undefined,states:[],expanded:false};
}
const LAB_ID='openai-product-testing-and-feedback';
const labOverviewTerms=new Set(publishedQueryTerms('ChatGPT Lab OpenAI product testing feedback cohort work project experience introduction overview explain explore describe about'));
function requestsLabOverview(text:string):boolean {
  const ids=namedProjects(text);
  return ids.length===1&&ids[0]===LAB_ID&&!requestedFocus(text)&&!requestedAngle(text)&&!requestedSourceAccess(text)
    &&!/[;,]|\band\s+(?:what|how|why|which)\b/i.test(text)
    &&publishedQueryTerms(text).every(term=>labOverviewTerms.has(term));
}
const contextualLabStory=(block:CanvasBlock):CanvasBlock=>({...block,kind:'story',projectIds:[LAB_ID],layout:'project-brief',focus:'role',section:0,paragraphIndices:undefined,answerPlan:undefined,states:[],expanded:false});
const labProcessOverviewTerms=new Set([...labOverviewTerms,...publishedQueryTerms('new early features before launch release')]);
function requestsLabProcessOverview(text:string):boolean {
  const ids=namedProjects(text);
  return ids.length===1&&ids[0]===LAB_ID&&requestedFocus(text)==='process'&&!requestedAngle(text)&&!requestedSourceAccess(text)
    &&explicitStorySection(text,LAB_ID)===undefined&&!/[;,]|\band\s+(?:what|how|why|which|who)\b/i.test(text)
    &&publishedQueryTerms(text).every(term=>labProcessOverviewTerms.has(term));
}
const contextualLabProcessStory=(block:CanvasBlock):CanvasBlock=>({...contextualLabStory(block),layout:'project-process',focus:'process',paragraphIndices:[0,1]});
function requestedCompanion(text:string,block:CanvasBlock){
  if(!/\b(?:and|alongside|plus|as well as)\b/i.test(text))return false;
  if(block.kind==='story')return namedProjects(text).includes(block.projectIds[0]);
  if(block.kind==='timeline')return /\b(?:career|background|professional experience|current role|public service|strengths)\b/i.test(text);
  if(block.kind==='contact')return /\b(?:contact|email|linkedin|reach out)\b/i.test(text);
  if(block.kind==='architecture')return /\b(?:architecture|pipeline)\b|\b(?:site|website)\b.*\b(?:works?|built|made)\b/i.test(text);
  if(block.kind==='benchmark')return requestsGovernmentData(text,'story')&&stateNames(text).length>0;
  return false;
}
function previousContext(previous?: Composition | null) {
  const block=previous?.blocks[0];
  const explicit=previous?.blocks.flatMap(b=>b.projectIds)??[];
  const linked=block?.kind==='timeline'&&block.roleId&&(!block.answerId||block.answerId==='service')?experienceEntries.find(role=>role.id===block.roleId)?.projectIds??[]:[];
  return {projectIds:explicit.length?explicit:linked,task:block?.kind==='photos'||block?.kind==='workshop'?undefined:block?.kind,focus:block?.focus};
}
export function resolveCanvasPlan(text: string, current: Plan, revision: number, composition?: Composition): Plan {
  const corrected=correctedPortfolioRequest(text);
  if(corrected!==text)return resolveCanvasPlan(corrected,current,revision,composition);
  if(!isPhotographyRequest(text)){
    const work=withoutPhotoClauses(text);
    if(work!==text)return resolveCanvasPlan(work,current,revision,composition);
  }
  const base=localPlan(text,current,[],revision);
  if(isPhotographyRequest(text))return {...base,layout:'photos',albumIds:[]};
  const interpretation=interpretPortfolioRequest(text,previousContext(composition));
  const benchmarkFollowup=composition?.blocks.some(b=>b.kind==='benchmark') && ['unknown','benchmark'].includes(interpretation.task) && /\b(?:preparedness|composite|all states|all governments|midwest|east|south|west|criteria|distribution|rankings?|those states|these states|compare them)\b/i.test(text);
  const task=stateNames(text).length&&requestsGovernmentData(text,interpretation.task)||benchmarkFollowup?'benchmark':interpretation.task;
  const layout:Plan['layout']=task==='story'?'detail':task==='benchmark'?'work':task==='collection'?'work':task==='unknown'?'empty':task;
  return {...base,layout,projectIds:task==='benchmark'?[POLICY_ID]:interpretation.projectIds,albumIds:[],title:task==='unknown'?'A different starting point?':base.title};
}

/** Layout selection is separate from content selection so follow-ups retain useful state. */
export function inferLayout(text:string, block:CanvasBlock):LayoutId {
  const q=text.toLowerCase();
  switch(block.kind){
    case 'benchmark':
      if(/criteria|evidence|checklist/.test(q))return 'benchmark-criteria';
      if(/distribution|histogram|bands/.test(q))return 'benchmark-distribution';
      if(/regions|regional/.test(q))return 'benchmark-regions';
      if(block.states.length===2)return 'benchmark-compare';
      if(block.states.length===1)return 'benchmark-scorecard';
      return 'benchmark-ranking';
    case 'photos':return /diptych|two photos|side.by.side/.test(q)?'photo-diptych':/contact sheet|grid|mosaic/.test(q)?'photo-grid':/collections|albums|travel photography/.test(q)?'photo-collections':'photo-focus';
    case 'workshop':return /sequence|session|schedule/.test(q)?'teaching-sequence':/feedback/.test(q)?'teaching-feedback':/language|conversation/.test(q)?'teaching-language':'teaching-lesson';
    case 'story':return /process|steps|how.*did/.test(q)?'project-process':/outcomes|results|impact/.test(q)?'project-outcomes':/evidence|sources|notebook/.test(q)?'project-evidence':'project-brief';
    case 'timeline':return /roles|responsibilities/.test(q)?'experience-roles':'experience-timeline';
    default:return defaultLayout[block.kind];
  }
}
export function withLayout(block:CanvasBlock, layout:LayoutId, preserveSection=false):CanvasBlock {
  const kind=layoutDefinition(layout).kind;
  const next={...blankBlock(kind),...block,kind,layout};
  if(kind==='workshop'){next.projectIds=[TAIWAN_ID];next.section=['teaching-lesson','teaching-feedback','teaching-language','teaching-sequence'].indexOf(layout);}
  if(layout==='benchmark-scorecard')next.states=next.states.slice(0,1);
  if(kind==='benchmark' && ['benchmark-ranking','benchmark-regions','benchmark-distribution'].includes(layout))next.states=[];
  if(kind==='story'){
    const focus=layout==='project-process'?'process':layout==='project-outcomes'?'outcomes':layout==='project-evidence'?'evidence':'role';
    next.focus=focus;
    const sections=evidenceSections(next.projectIds[0],focus);
    if(!sections.some(section=>section.index===next.section)&&!(preserveSection&&publicProjects.find(project=>project.id===next.projectIds[0])?.sections[next.section])){next.section=sections[0]?.index??0;next.paragraphIndices=undefined;}
  }
  return next;
}

/** Named subjects resolve to published sections before either provider can choose a view. */
function explicitStorySection(text:string,projectId:string):number|undefined {
  // An explicitly named published heading must remain reachable even when a
  // later section shares words such as “lessons” with an older editorial rule.
  const headings=publicProjects.find(project=>project.id===projectId)?.sections
    .flatMap((section,index)=>publishedPhrasePosition(text,section.heading)>=0?[{index,length:section.heading.length}]:[])
    .sort((a,b)=>b.length-a.length);
  if(headings?.length)return headings[0].index;
  if(projectId===TAIWAN_ID&&['measurement','reflection'].includes(requestedAngle(text)??''))return 4;
  const rules:Record<string,[RegExp,number][]>={
    [POLICY_ID]: [[/\b(?:framework|roadmap)\b|\bwhat\b.*\b(?:build|built)\b/i,1]],
    [TAIWAN_ID]: [[/measur|evaluat|success|whether.*work|^did .*\bwork\b/i,4],[/trade.?offs?|compromises?|challenge|limitation|decisions?/i,1],[/educators?.*(?:shape|influence|change)|participants?.*(?:shape|influence|change)/i,1],[/\bhow\b.*\b(?:did|has)\b.*\b(?:help(?:ed)?|support(?:ed)?|teach|taught)\b.*\b(?:teachers?|educators?)\b|\bwhat\b.*\b(?:do|did)\b.*\b(?:teachers?|educators?)\b/i,1],[/learn(?:ed)?|lessons?|takeaways?|reflection/i,4],[/nine|9 use|use cases/i,2],[/conference|alignment/i,3]],
    'openai-product-testing-and-feedback': [[/study mode/i,2],[/pulse/i,4],[/atlas/i,5],[/group chats?/i,6],[/100 chats|book/i,1],[/back to school/i,3],[/learn(?:ed)?|lessons?|takeaways?|\b(?:teach|taught) (?:isaac|you|him|me)\b/i,7]],
    'congressional-office-setup-100-day-report': [[/100 days?|accomplish|constituent|office.*results/i,5],[/child.labou?r|local stories|national news/i,2],[/press list|press network|learn(?:ed)?|lessons?|reflection/i,1],[/state of the union|bipartisan/i,4]],
    'senior-thesis-local-journalism': [[/findings?|discover|reveal|learn|results?|conclusions?|what did.*(?:interviews|study|thesis).*find/i,1]],
  };
  return rules[projectId]?.find(([pattern])=>pattern.test(text))?.[1];
}
export function requestedStorySection(text:string,projectId:string,currentSection?:number):number|undefined {
  const focus=requestedFocus(text);
  const candidates=focus==='process'||focus==='outcomes'?evidenceSections(projectId,focus).map(section=>section.index):undefined;
  const selected=explicitStorySection(text,projectId) ?? findPublishedSection(text,projectId) ?? findPublishedSection(text,projectId,candidates);
  if(focus==='evidence'&&requestedSourceAccess(text)){
    const project=publicProjects.find(project=>project.id===projectId);
    const dedicatedMaterials=project?.sections.findIndex(section=>section.links?.length&&!section.paragraphs?.length&&!section.bullets?.length)??-1;
    if(dedicatedMaterials>=0&&/\b(?:materials?|workspace|slides|downloads?)\b/i.test(text))return dedicatedMaterials;
    if(currentSection!==undefined&&!namedProjects(text).length&&project?.sections[currentSection]?.links?.length)return currentSection;
    if(selected!==undefined&&project?.sections[selected]?.links?.length)return selected;
    if(selected===undefined&&currentSection!==undefined&&project?.sections[currentSection]?.links?.length)return currentSection;
    const materials=project?.sections.findIndex(section=>section.links?.length&&!section.paragraphs?.length&&!section.bullets?.length)??-1;
    const linked=materials>=0?materials:project?.sections.findIndex(section=>section.links?.length)??-1;
    if(materials>=0)return materials;
    if(selected!==undefined)return selected;
    if(linked>=0)return linked;
  }
  return selected;
}
const blockSubject=(block:CanvasBlock)=>block.kind==='story'?`${block.kind}:${block.projectIds[0]}`:block.kind;
function independentRequests(text:string,previous?:Composition|null):string[]|null {
  const clauses=text.split(/\b(?:alongside|plus|as well as)\b|;|\band\s+(?=(?:show|explain|explore|open|include|describe)\b)/i).map(clause=>clause.trim()).filter(Boolean);
  if(clauses.length<2||clauses.length>3)return null;
  if(interpretPortfolioRequest(text,previousContext(previous)).task==='comparison'&&!clauses.some(clause=>interpretPortfolioRequest(clause,previousContext(previous)).task==='comparison'))return null;
  return clauses.every(clause=>{
    if(isPhotographyRequest(clause))return false;
    const item=interpretPortfolioRequest(clause,previousContext(previous));
    return item.task!=='collection'&&(item.task!=='unknown'||stateNames(clause).length>0&&/\b(?:compare|scores?|rank\w*|preparedness|composite|criteria)\b/i.test(clause));
  })?clauses:null;
}

/** Apply public-subject and state constraints once, after either provider. */
function reconcileCompositionUnplanned(text:string, proposed:unknown, baseline:Composition, previous?:Composition):Composition|null {
  if(!isPhotographyRequest(text)){
    const work=withoutPhotoClauses(text);
    if(work!==text)return reconcileComposition(work,proposed,baseline,previous);
  }
  const valid=validateComposition(proposed);
  if(!valid)return null;
  if(isUnspecifiedComparison(text,previousContext(previous)))return null;
  const subjects=valid.blocks.map(block=>block.kind==='story'?`${block.kind}:${block.projectIds[0]}`:block.kind);
  if(new Set(subjects).size!==subjects.length)return null;
  const clauses=independentRequests(text,previous);
  if(clauses){
    const clauseBaselines=clauses.map(clause=>composeSingleLocal(clause,resolveCanvasPlan(clause,initialPlan(),0,previous??undefined),previous));
    const expected=clauseBaselines.flatMap(composition=>composition.blocks);
    if(validateComposition({blocks:expected})&&new Set(expected.map(blockSubject)).size===expected.length){
      const blocks=clauses.flatMap((clause,index)=>{
        const local=clauseBaselines[index];
        const proposed=valid.blocks.filter(block=>local.blocks.some(expected=>blockSubject(expected)===blockSubject(block)));
        return (reconcileComposition(clause,proposed.length?{blocks:proposed}:local,local,previous)??local).blocks;
      });
      return validateComposition({blocks});
    }
  }
  const checked:Composition={blocks:valid.blocks.map(block=>{
    const section=block.kind==='story'?explicitStorySection(text,block.projectIds[0]):undefined;
    return section===undefined?block:{...block,section,paragraphIndices:section===block.section?block.paragraphIndices:findPublishedParagraphs(text,block.projectIds[0],section)};
  })};
  const interpreted=interpretPortfolioRequest(text,previousContext(previous));
  if(requestsPolicyOverview(text))return {blocks:baseline.blocks.map(block=>block.kind==='story'&&block.projectIds[0]===POLICY_ID?contextualPolicyStory(block,text):block)};
  if(requestsLabOverview(text))return {blocks:baseline.blocks.map(block=>block.kind==='story'&&block.projectIds[0]===LAB_ID?contextualLabStory(block):block)};
  if(requestsLabProcessOverview(text))return {blocks:baseline.blocks.map(block=>block.kind==='story'&&block.projectIds[0]===LAB_ID?contextualLabProcessStory(block):block)};
  // A schema-valid prior scorecard is not an answer to a new unrecognized
  // question. Providers may recover project subjects the local matcher missed,
  // but government data still needs an actual data request or local refinement.
  if(interpreted.task==='unknown'&&checked.blocks.some(block=>block.kind==='benchmark')
    &&!requestsGovernmentDataset(text)&&!baseline.blocks.some(block=>block.kind==='benchmark'))return null;
  if(checked.blocks.some(block=>block.kind==='collection')&&interpreted.task!=='collection')return null;
  // A refinement keeps the visible controls. An explicit new aspect can select
  // evidence within that aspect, without resetting any other user selections.
  if(interpreted.followup&&previous){
    if(!requestedFocus(text))return baseline;
    return {blocks:baseline.blocks.map(block=>{
      if(block.kind!=='story'||explicitStorySection(text,block.projectIds[0])!==undefined)return block;
      // A request to inspect this answer's sources keeps its selected product or
      // material section. Evidence is not permission to swap to a different
      // linked chapter just because every chapter is a valid public reference.
      if(block.focus==='evidence' && requestedSourceAccess(text))return block;
      const match=checked.blocks.find(item=>item.kind==='story'&&item.projectIds[0]===block.projectIds[0]);
      const relevant=match&&(evidenceSections(block.projectIds[0],block.focus??'overview').some(section=>section.index===match.section)||findPublishedSection(text,block.projectIds[0])===match.section);
      return relevant?{...block,section:match.section,paragraphIndices:match.paragraphIndices}:block;
    })};
  }
  if(['contact','architecture','timeline'].includes(interpreted.task)) {
    const match=checked.blocks.find(block=>block.kind===interpreted.task);
    if(!match)return baseline;
    // Authored career answers and explicitly named roles carry editorial evidence.
    if(interpreted.task==='timeline'&&(baseline.blocks[0]?.answerId||interpreted.roleId)&&!(stateNames(text).length&&requestsGovernmentData(text,interpreted.task))) {
      const authored=baseline.blocks.map(block=>block.answerId==='connections'&&match.answerId==='connections'&&!namedProjects(text).length&&!careerConnectionFor(text)&&match.connectionId?{...block,connectionId:match.connectionId}:block);
      return {blocks:checked.blocks.flatMap(item=>item===match?authored:requestedCompanion(text,item)?[item]:[])};
    }
  }
  if(stateNames(text).length&&requestsGovernmentData(text,interpreted.task)){
    const match=checked.blocks.find(block=>block.kind==='benchmark');
    if(!match)return baseline;
    const block={...match,states:stateNames(text),region:baseline.blocks.find(item=>item.kind==='benchmark')?.region??'All'};
    const benchmark=withLayout(block,inferLayout(text,block));
    // A named government can accompany another requested project. Keep both
    // answers, but never let the provider append an unrequested project story.
    return {blocks:checked.blocks.flatMap(item=>item===match?[benchmark]:item.kind==='story'&&interpreted.projectIds.includes(item.projectIds[0])&&item.projectIds[0]!==POLICY_ID||requestedCompanion(text,item)?[item]:[])};
  }
  if(interpreted.task==='comparison'&&interpreted.projectIds.length===2) {
    const match=checked.blocks.find(block=>block.kind==='comparison');
    if(!match)return baseline;
    return {blocks:[{...match,projectIds:interpreted.projectIds,focus:baseline.blocks[0]?.focus??requestedFocus(text)??match.focus??'role'}]};
  }
  // Explicit questions about contribution/process/outcomes are project stories, not state rankings.
  if(interpreted.task==='story'&&interpreted.projectIds.length===1) {
    const match=checked.blocks.find(block=>block.kind==='story'&&block.projectIds[0]===interpreted.projectIds[0]);
    if(!match)return baseline;
    const accessingSource=requestedSourceAccess(text);
    const pinnedSection=accessingSource?baseline.blocks[0]?.section:explicitStorySection(text,interpreted.projectIds[0]);
    const focus=(baseline.blocks[0]?.angle||pinnedSection!==undefined?baseline.blocks[0]?.focus:requestedFocus(text))??match.focus??baseline.blocks[0]?.focus??'overview';
    const block={...match,projectIds:interpreted.projectIds,focus,angle:baseline.blocks[0]?.angle,section:pinnedSection??match.section,
      paragraphIndices:pinnedSection!==undefined&&pinnedSection!==match.section?baseline.blocks[0]?.paragraphIndices:match.paragraphIndices,
      expanded:accessingSource?baseline.blocks[0]?.expanded:match.expanded};
    const story=withLayout(block,focus==='process'?'project-process':focus==='outcomes'?'project-outcomes':focus==='evidence'?'project-evidence':'project-brief',true);
    return validateComposition({blocks:checked.blocks.flatMap(item=>item===match?[story]:requestedCompanion(text,item)?[item]:[])});
  }
  // Distinct project stories can answer a multi-subject question together.
  return checked;
}
function attachAnswerPlans(text:string,composition:Composition,preserveSelection=false):Composition {
  return {blocks:composition.blocks.map(block=>{
    if(block.kind!=='story')return block;
    if(block.projectIds[0]===POLICY_ID&&requestsPolicyOverview(text))return contextualPolicyStory(block,text);
    if(block.projectIds[0]===LAB_ID&&requestsLabOverview(text))return contextualLabStory(block);
    if(block.projectIds[0]===LAB_ID&&requestsLabProcessOverview(text))return contextualLabProcessStory(block);
    const answerPlan=buildAnswerPlan(text,block,{preservePrimary:preserveSelection||explicitStorySection(text,block.projectIds[0])!==undefined});
    if(!answerPlan)return block;
    const first=answerPlan.facets[0]?.evidenceIds.map(id=>getEvidence(id)!).filter(Boolean)??[];
    const primary=first[0];
    // A newly published heading may not yet have reviewed facet annotations.
    // Keep its actual passage visible instead of substituting an older answer.
    const selectedHeading=publicProjects.find(project=>project.id===block.projectIds[0])?.sections[block.section]?.heading;
    if(primary&&primary.sectionIndex!==block.section&&selectedHeading&&publishedPhrasePosition(text,selectedHeading)>=0)return {...block,answerPlan:undefined};
    if(!primary||preserveSelection)return {...block,answerPlan};
    const paragraphs=first.filter(record=>record.sectionIndex===primary.sectionIndex&&record.kind==='paragraph').map(record=>record.paragraphIndex!).slice(0,3);
    return {...block,answerPlan,section:primary.sectionIndex,paragraphIndices:paragraphs.length?paragraphs:undefined};
  })};
}
export function reconcileComposition(text:string,proposed:unknown,baseline:Composition,previous?:Composition):Composition|null {
  const composition=reconcileCompositionUnplanned(text,proposed,baseline,previous);
  return composition?attachAnswerPlans(text,composition,true):null;
}
export function composeLocal(text:string,plan:Plan,previous?:Composition|null):Composition {
  const corrected=correctedPortfolioRequest(text);
  const composition=composeLocalUnplanned(corrected,plan,previous);
  if(previous&&isReadingTransformation(corrected)&&/shorter|concise|brief/i.test(corrected))return {blocks:composition.blocks.map(block=>{
    const old=previous.blocks.find(item=>item.kind===block.kind&&item.projectIds[0]===block.projectIds[0]);
    return old?.answerPlan?{...block,answerPlan:{...old.answerPlan,facets:old.answerPlan.facets.map(facet=>({...facet,evidenceIds:facet.evidenceIds.slice(0,1)}))}}:block;
  })};
  return isPhotographyRequest(text)||isLocalCompositionRefinement(text,previous??undefined)?composition:attachAnswerPlans(corrected,composition);
}
function composeLocalUnplanned(text:string,plan:Plan,previous?:Composition|null):Composition {
  if(isPhotographyRequest(text))return previous??{blocks:[blankBlock('collection')]};
  const work=withoutPhotoClauses(text);
  if(work!==text)return composeLocal(work,plan,previous);
  // Explicitly separate requests can use the same bounded multi-view contract
  // offline. Keep ordinary conjunctions (including two-government comparisons)
  // together, and leave ambiguous or unsupported clauses to the normal planner.
  const clauses=independentRequests(text,previous);
  if(clauses){
    const blocks=clauses.flatMap(clause=>composeSingleLocal(clause,resolveCanvasPlan(clause,plan,plan.revision,previous??undefined),previous).blocks);
    const subjects=blocks.map(blockSubject);
    const composition=validateComposition({blocks});
    if(composition&&new Set(subjects).size===subjects.length)return composition;
  }
  const composition=composeSingleLocal(text,plan,previous);
  const interpretation=interpretPortfolioRequest(text,previousContext(previous));
  if(previous&&previous.blocks.length>1&&interpretation.followup&&interpretation.task==='story'&&!/\b(?:first|second|former|latter)\b/i.test(text)){
    const blocks=previous.blocks.map(block=>block.kind==='story'?composition.blocks.find(next=>next.kind==='story'&&next.projectIds[0]===block.projectIds[0])??block:block);
    return validateComposition({blocks})??composition;
  }
  return composition;
}
function composeSingleLocal(text:string,plan:Plan,previous?:Composition|null):Composition {
  if(isPhotographyRequest(text))return previous??{blocks:[blankBlock('collection')]};
  const q=text.toLowerCase();
  const interpreted=interpretPortfolioRequest(text,previousContext(previous));
  const selected=requestsGovernmentData(text,interpreted.task)?stateNames(text):[];
  const oldBenchmark=previous?.blocks.find(b=>b.kind==='benchmark');
  const benchmarkRefinement=Boolean(oldBenchmark)&&['unknown','benchmark'].includes(interpreted.task)&&/\b(?:preparedness|composite|all states|all governments|midwest|east|south|west|criteria|distribution|rankings?|those states|these states|compare them|compare these|compare those)\b/i.test(q);
  if(selected.length||interpreted.task==='benchmark'||benchmarkRefinement) {
    const old=oldBenchmark??blankBlock('benchmark');
    const region=selected.length?undefined:['East','Midwest','South','West'].find(value=>new RegExp('\\b'+value.toLowerCase()+'\\b').test(q)) as CanvasBlock['region']|undefined;
    const overview=/\b(?:all (?:states|governments)|rank(?:ings?)?|regions?|regional|distribution|histogram)\b/.test(q);
    const states=selected.length?selected:overview?[]:region?(old.states??[]).filter(name=>aiIndexStates.find(s=>s.state===name)?.region===region):old.states;
    const block:CanvasBlock={...old,states,region:/all (?:states|governments)/.test(q)?'All':region??old.region,band:overview?null:old.band,metric:/preparedness|raw score/.test(q)?'preparednessScore':/composite/.test(q)?'compositeScore':old.metric};
    const explicitLayout=/criteria|evidence|checklist|distribution|histogram|bands|regions|regional|ranking|rank governments|rank states/.test(q)||selected.length>0||Boolean(region)||overview;
    const next=withLayout(block,explicitLayout?inferLayout(text,block):block.layout??inferLayout(text,block));
    if(previous&&isLocalCompositionRefinement(text,previous))return {blocks:previous.blocks.map(item=>item===oldBenchmark?next:item)};
    return {blocks:[next]};
  }
  if(interpreted.task==='unknown')return {blocks:[blankBlock('collection')]};
  if(interpreted.task==='comparison') {
    const old=previous?.blocks.find(b=>b.kind==='comparison');
    return {blocks:[{...blankBlock('comparison'),...old,projectIds:interpreted.projectIds,focus:requestedFocus(text)??old?.focus??'role'}]};
  }
  if(interpreted.task==='story') {
    const ids=(interpreted.projectIds.length?interpreted.projectIds:plan.projectIds).slice(0,3);
    if(!ids.length)return {blocks:[blankBlock('collection')]};
    return {blocks:ids.map(id=>{
      const old=previous?.blocks.find(b=>b.kind==='story'&&b.projectIds[0]===id);
      const selectedSection=requestedStorySection(text,id,interpreted.followup?old?.section:undefined);
      const askedFocus=requestedFocus(text);
      const angle=requestedAngle(text)??(interpreted.followup&&!askedFocus?old?.angle:undefined);
      const readingChange=interpreted.followup&&isReadingTransformation(text);
      const more=interpreted.followup&&/tell me more|expand|details/i.test(text);
      let sectionFocus=askedFocus;
      if(selectedSection!==undefined&&(!askedFocus||askedFocus==='role'||!evidenceSections(id,askedFocus).some(section=>section.index===selectedSection))){
        sectionFocus=evidenceSections(id,'process').some(section=>section.index===selectedSection)?'process':evidenceSections(id,'outcomes').some(section=>section.index===selectedSection)?'outcomes':'evidence';
      }
      const focus=(angle==='measurement'&&id===TAIWAN_ID?'outcomes':sectionFocus)
        ??(selectedSection!==undefined?'process':undefined)
        ??(angle==='measurement'?'outcomes':angle==='tradeoffs'?'process':undefined)
        ??(more&&(!old||old.focus==='overview'||old.focus==='role')?'process':undefined)
        ??(interpreted.followup?old?.focus:undefined)??'overview';
      const block:CanvasBlock={...blankBlock('story'),...(interpreted.followup?old:{}),projectIds:[id],focus,angle,section:selectedSection??(interpreted.followup?old?.section:undefined)??evidenceSections(id,focus)[0]?.index??0,expanded:more||focus==='evidence'&&selectedSection!==undefined||Boolean(interpreted.followup&&old?.expanded)};
      block.paragraphIndices=findPublishedParagraphs(text,id,block.section)??(interpreted.followup&&block.section===old?.section?old.paragraphIndices:undefined);
      // The Lab retrospective makes its change in understanding explicit in its
      // opening, followed by the evaluative questions that came out of it.
      if(id==='openai-product-testing-and-feedback'&&block.section===7&&angle==='reflection')block.paragraphIndices=[0,1];
      const layout=focus==='process'?'project-process':focus==='outcomes'?'project-outcomes':focus==='evidence'?'project-evidence':interpreted.followup&&old?.layout?old.layout:'project-brief';
      if(readingChange&&/shorter|concise|brief/i.test(text)){block.paragraphIndices=(block.paragraphIndices??[0]).slice(0,1);block.expanded=false;}
      return withLayout(block,layout,selectedSection!==undefined);
    })};
  }
  if(interpreted.task==='timeline') {
    const old=previous?.blocks.find(b=>b.kind==='timeline');
    const answerId=careerAnswerFor(text)??(interpreted.followup?old?.answerId:undefined);
    const roleId=interpreted.roleId??(interpreted.followup?old?.roleId:undefined)
      ??(answerId?careerAnswers[answerId].roles[0]:'summation-ai');
    return {blocks:[{
      ...blankBlock('timeline'),...(interpreted.followup?old:{}),answerId,roleId,
      connectionId:answerId==='connections'?(careerConnectionFor(text,interpreted.projectIds)??(interpreted.followup?old?.connectionId:undefined)??'systems'):undefined,
      layout:answerId==='chronology'||!answerId&&!/roles|responsibilities/i.test(text)?'experience-timeline':'experience-roles',
      focus:interpreted.focus,
      angle:requestedAngle(text)??(interpreted.followup?old?.angle:undefined),
      section:answerId==='service'?2:answerId&&['strengths','connections','leadership'].includes(answerId)?1:interpreted.followup?old?.section??0:0,
    }]};
  }
  return {blocks:[blankBlock(interpreted.task)]};
}
export function presetComposition(id:LayoutId):Composition {
  const definition=layoutDefinition(id);
  const block=withLayout(blankBlock(definition.kind),id);
  if(block.kind==='benchmark')block.states=id==='benchmark-compare'?['Michigan','California']:['benchmark-scorecard','benchmark-criteria'].includes(id)?['Michigan']:[];
  if(block.kind==='photos')block.albumIds=[albums.find(a=>a.folder==='Japan')?.folder??albums[0].folder];
  if(block.kind==='story'){block.projectIds=[TAIWAN_ID];return {blocks:[withLayout(block,id)]};}
  if(id==='experience-timeline')block.answerId='chronology';
  if(block.kind==='comparison')block.projectIds=[POLICY_ID,TAIWAN_ID];
  if(block.kind==='collection')block.projectIds=publicProjects.slice(0,3).map(p=>p.id);
  return {blocks:[block]};
}
