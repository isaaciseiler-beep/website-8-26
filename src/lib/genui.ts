import { connectionIds, connectionForRequest } from './portfolioConnections.js';
import { careerAnswerIds, careerAnswerFor, careerAnswers } from './careerAnswers.js';
import { z } from 'zod';
import { albums, publicProjects, localPlan, type Plan } from './canvas.js';
import { aiIndexStates } from './aiStateGovIndex.js';
import { layoutIds, liveLayoutIds, layoutDefinition, defaultLayout, type LayoutId } from './layouts.js';
import { evidenceFocuses, evidenceSections } from './portfolioEvidence.js';
import { experienceEntries } from './experience.js';
import { interpretPortfolioRequest, namedProjects, requestedFocus, personalProjectFocus, requestedAngle, portfolioAngles } from './portfolioIntent.js';

export const blockSchema = z.object({
  kind: z.enum(['benchmark', 'photos', 'workshop', 'story', 'comparison', 'timeline', 'architecture', 'contact', 'collection']),
  layout: z.enum(layoutIds).optional(),
  projectIds: z.array(z.string()).max(3),
  albumIds: z.array(z.string()).max(3),
  states: z.array(z.string()).max(2),
  region: z.enum(['All', 'East', 'Midwest', 'South', 'West']),
  metric: z.enum(['compositeScore', 'preparednessScore']),
  section: z.number().int().min(0).max(2000),
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
  return (/photo|album|gallery|diptych|contact sheet|\b(?:pictures?|images?)\b/i.test(text)||plan?.layout==='photos')
    && !/project|research|teaching|lesson|career|policy|government|journalism|congress|rebrand|literacy/i.test(text);
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
export function validateComposition(value: unknown): Composition | null {
  const result = liveCompositionSchema.safeParse(value);
  if (!result.success) return null;
  for (const b of (result.data as Composition).blocks) {
    if(new Set(b.states).size!==b.states.length)return null;
    if (b.layout && layoutDefinition(b.layout).kind !== b.kind) return null;
    if (b.layout === 'benchmark-compare' && b.states.length !== 2) return null;
    if (b.layout === 'benchmark-scorecard' && b.states.length !== 1) return null;
    if (b.answerId && b.kind !== 'timeline') return null;
    if (b.connectionId && (b.kind !== 'timeline' || b.answerId !== 'connections')) return null;
    if (b.roleId && !experienceEntries.some(entry => entry.id === b.roleId)) return null;
    if (b.projectIds.some(id=>!publicProjects.some(p=>p.id===id)) || b.albumIds.some(id=>!albums.some(a=>a.folder===id)) || b.states.some(name=>!aiIndexStates.some(s=>s.state===name))) return null;
    if (b.kind === 'comparison' && (b.projectIds.length !== 2 || new Set(b.projectIds).size !== 2)) return null;
    if ((b.kind === 'story' || b.kind === 'workshop') && b.projectIds.length !== 1) return null;
    if (b.kind === 'photos' && !b.albumIds.length) return null;
    if (b.kind === 'workshop' && (b.projectIds[0] !== TAIWAN_ID || b.section > 3)) return null;
    if (b.kind === 'timeline' && b.section > 2) return null;
    if (b.kind === 'architecture' && b.section > 3) return null;
    if (b.kind === 'photos' && b.section >= (albums.find(a=>a.folder===b.albumIds[0])?.photos.length ?? 0)) return null;
    if (b.kind === 'story' && b.section >= (publicProjects.find(p=>p.id===b.projectIds[0])?.sections.length ?? 0)) return null;
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
  if(personalProjectFocus(text))return false;
  if(/\b(?:scores?|scorecard|rank\w*|criteria|checklist|distribution|histogram|preparedness|composite|adoption)\b/i.test(text))return true;
  if(task!=='comparison'&&stateNames(text).length===2&&/\b(?:compare|versus|vs)\b/i.test(text))return true;
  if(['story','comparison','timeline','architecture','contact'].includes(task))return false;
  const personal=/\b(?:isaac|you|your|he|his)\b/i.test(text)&&/\b(?:did|do|work|career|role|contribut\w*|responsibilit\w*|research|methodology|learn\w*)\b/i.test(text);
  return !personal;
}
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
  return {projectIds:previous?.blocks.flatMap(b=>b.projectIds)??[],task:block?.kind==='photos'||block?.kind==='workshop'?undefined:block?.kind,focus:block?.focus};
}
export function resolveCanvasPlan(text: string, current: Plan, revision: number, composition?: Composition): Plan {
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
export function withLayout(block:CanvasBlock, layout:LayoutId):CanvasBlock {
  const kind=layoutDefinition(layout).kind;
  const next={...blankBlock(kind),...block,kind,layout};
  if(kind==='workshop'){next.projectIds=[TAIWAN_ID];next.section=['teaching-lesson','teaching-feedback','teaching-language','teaching-sequence'].indexOf(layout);}
  if(layout==='benchmark-scorecard')next.states=next.states.slice(0,1);
  if(kind==='benchmark' && ['benchmark-ranking','benchmark-regions','benchmark-distribution'].includes(layout))next.states=[];
  if(kind==='story'){
    const focus=layout==='project-process'?'process':layout==='project-outcomes'?'outcomes':layout==='project-evidence'?'evidence':'role';
    next.focus=focus;
    const sections=evidenceSections(next.projectIds[0],focus);
    if(!sections.some(section=>section.index===next.section))next.section=sections[0]?.index??0;
  }
  return next;
}

/** Named subjects resolve to published sections before either provider can choose a view. */
export function requestedStorySection(text:string,projectId:string):number|undefined {
  const rules:Record<string,[RegExp,number][]>={
    [TAIWAN_ID]: [[/measur|evaluat|success|whether.*work|^did .*\bwork\b/i,4],[/trade.?offs?|compromises?|challenge|limitation|decisions?/i,1],[/educators?.*(?:shape|influence|change)|participants?.*(?:shape|influence|change)/i,1],[/learn(?:ed)?|lessons?|takeaways?|reflection/i,4],[/nine|9 use|use cases/i,2],[/conference|alignment/i,3]],
    'openai-product-testing-and-feedback': [[/study mode/i,2],[/pulse/i,4],[/atlas/i,5],[/group chats?/i,6],[/100 chats|book/i,1],[/back to school/i,3],[/learn(?:ed)?|lessons?|takeaways?/i,7]],
    'congressional-office-setup-100-day-report': [[/100 days?|accomplish|constituent|office.*results/i,5],[/child.labou?r|local stories|national news/i,2],[/press list|press network|learn(?:ed)?|lessons?|reflection/i,1],[/state of the union|bipartisan/i,4]],
    'senior-thesis-local-journalism': [[/findings?|discover|learn|results?|conclusions?/i,1]],
  };
  return rules[projectId]?.find(([pattern])=>pattern.test(text))?.[1];
}

/** Apply public-subject and state constraints once, after either provider. */
export function reconcileComposition(text:string, proposed:unknown, baseline:Composition, previous?:Composition):Composition|null {
  const valid=validateComposition(proposed);
  if(!valid)return null;
  const subjects=valid.blocks.map(block=>block.kind==='story'?`${block.kind}:${block.projectIds[0]}`:block.kind);
  if(new Set(subjects).size!==subjects.length)return null;
  const checked:Composition={blocks:valid.blocks.map(block=>{
    const section=block.kind==='story'?requestedStorySection(text,block.projectIds[0]):undefined;
    return section===undefined?block:{...block,section};
  })};
  const interpreted=interpretPortfolioRequest(text,previousContext(previous));
  if(checked.blocks.some(block=>block.kind==='collection')&&interpreted.task!=='collection')return null;
  // A refinement keeps the visible controls. An explicit new aspect can select
  // evidence within that aspect, without resetting any other user selections.
  if(interpreted.followup&&previous){
    if(!requestedFocus(text))return baseline;
    return {blocks:baseline.blocks.map(block=>{
      if(block.kind!=='story'||requestedStorySection(text,block.projectIds[0])!==undefined)return block;
      const match=checked.blocks.find(item=>item.kind==='story'&&item.projectIds[0]===block.projectIds[0]);
      return match&&evidenceSections(block.projectIds[0],block.focus??'overview').some(section=>section.index===match.section)?{...block,section:match.section}:block;
    })};
  }
  if(['contact','architecture','timeline'].includes(interpreted.task)) {
    const match=checked.blocks.find(block=>block.kind===interpreted.task);
    if(!match)return baseline;
    // Authored career answers and explicitly named roles carry editorial evidence.
    if(interpreted.task==='timeline'&&(baseline.blocks[0]?.answerId||interpreted.roleId)&&!(stateNames(text).length&&requestsGovernmentData(text,interpreted.task))) {
      const authored=baseline.blocks.map(block=>block.answerId==='connections'&&match.answerId==='connections'&&!connectionForRequest(text)&&match.connectionId?{...block,connectionId:match.connectionId}:block);
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
    const pinnedSection=requestedStorySection(text,interpreted.projectIds[0]);
    const focus=(baseline.blocks[0]?.angle||pinnedSection!==undefined?baseline.blocks[0]?.focus:requestedFocus(text))??match.focus??baseline.blocks[0]?.focus??'overview';
    const block={...match,projectIds:interpreted.projectIds,focus,angle:baseline.blocks[0]?.angle,section:pinnedSection??match.section};
    const story=withLayout(block,focus==='process'?'project-process':focus==='outcomes'?'project-outcomes':focus==='evidence'?'project-evidence':'project-brief');
    return validateComposition({blocks:checked.blocks.flatMap(item=>item===match?[story]:requestedCompanion(text,item)?[item]:[])});
  }
  // Distinct project stories can answer a multi-subject question together.
  return checked;
}
export function composeLocal(text:string,plan:Plan,previous?:Composition|null):Composition {
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
      const selectedSection=requestedStorySection(text,id);
      const angle=requestedAngle(text)??(interpreted.followup?old?.angle:undefined);
      const more=interpreted.followup&&/tell me more|expand|details/i.test(text);
      const askedFocus=requestedFocus(text);
      let sectionFocus=askedFocus;
      if(selectedSection!==undefined&&(!askedFocus||askedFocus==='role'||!evidenceSections(id,askedFocus).some(section=>section.index===selectedSection))){
        sectionFocus=evidenceSections(id,'process').some(section=>section.index===selectedSection)?'process':evidenceSections(id,'outcomes').some(section=>section.index===selectedSection)?'outcomes':askedFocus;
      }
      const focus=(angle==='measurement'&&id===TAIWAN_ID?'outcomes':sectionFocus)
        ??(selectedSection!==undefined?'process':undefined)
        ??(angle==='measurement'?'outcomes':angle==='tradeoffs'?'process':undefined)
        ??(more&&(!old||old.focus==='overview'||old.focus==='role')?'process':undefined)
        ??(interpreted.followup?old?.focus:undefined)??'overview';
      const block:CanvasBlock={...blankBlock('story'),...(interpreted.followup?old:{}),projectIds:[id],focus,angle,section:selectedSection??(interpreted.followup?old?.section:undefined)??evidenceSections(id,focus)[0]?.index??0,expanded:more||Boolean(interpreted.followup&&old?.expanded)};
      const layout=focus==='process'?'project-process':focus==='outcomes'?'project-outcomes':focus==='evidence'?'project-evidence':interpreted.followup&&old?.layout?old.layout:'project-brief';
      return withLayout(block,layout);
    })};
  }
  if(interpreted.task==='timeline') {
    const old=previous?.blocks.find(b=>b.kind==='timeline');
    const answerId=careerAnswerFor(text)??(interpreted.followup?old?.answerId:undefined);
    const roleId=interpreted.roleId??(interpreted.followup?old?.roleId:undefined)
      ??(answerId?careerAnswers[answerId].roles[0]:'summation-ai');
    return {blocks:[{
      ...blankBlock('timeline'),...(interpreted.followup?old:{}),answerId,roleId,
      connectionId:answerId==='connections'?(connectionForRequest(text)??(interpreted.followup?old?.connectionId:undefined)??'systems'):undefined,
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
