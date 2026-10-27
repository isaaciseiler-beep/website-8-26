import { z } from 'zod';
import { albums, publicProjects, localPlan, type Plan } from './canvas.js';
import { aiIndexStates } from './aiStateGovIndex.js';
import { layoutIds, liveLayoutIds, layoutDefinition, defaultLayout, type LayoutId } from './layouts.js';
import { evidenceFocuses, evidenceSections } from './portfolioEvidence.js';
import { experienceEntries } from './experience.js';
import { interpretPortfolioRequest, namedProjects, requestedFocus } from './portfolioIntent.js';

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
  return (/photo|album|gallery|diptych|contact sheet/i.test(text)||plan?.layout==='photos')
    && !/project|research|teaching|lesson|career|policy|government|journalism|congress|rebrand|literacy/i.test(text);
}
/** Requests that need a starting point rather than an inferred project. */
export function explorationGuidance(text:string, plan?:Plan):'welcome'|'unmatched'|null {
  const q=text.trim().toLowerCase().replace(/[.!?]+$/,'').trim();
  if (/^(hi|hello|hey|hey there|hi there|hello there|good morning|good afternoon|good evening|help|thanks|thank you|what can (you|i) (do|ask)|where (do|should) i start|show me around|tell me|tell me about|tell me about your|show me|show me your)$/.test(q)) return 'welcome';
  return plan?.layout==='empty'?'unmatched':null;
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
    if (b.layout && layoutDefinition(b.layout).kind !== b.kind) return null;
    if (b.layout === 'benchmark-compare' && b.states.length !== 2) return null;
    if (b.layout === 'benchmark-scorecard' && b.states.length !== 1) return null;
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
  return aiIndexStates.filter(state => new RegExp('\\b' + state.state.toLowerCase() + '\\b').test(text.toLowerCase()))
    .sort((a,b) => text.toLowerCase().indexOf(a.state.toLowerCase()) - text.toLowerCase().indexOf(b.state.toLowerCase())).map(state => state.state).slice(0,2);
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
  const task=stateNames(text).length||benchmarkFollowup?'benchmark':interpretation.task;
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
  return next;
}

/** Reflection questions open the published lesson rather than the first output. */
function requestedStorySection(text:string,projectId:string):number|undefined {
  if (!/\b(?:learn(?:ed)?|lessons?|takeaways?|reflections?)\b/i.test(text)) return undefined;
  return evidenceSections(projectId,'outcomes').find(section=>/\blearn|lessons?|reflection/i.test(section.heading))?.index;
}

/** Apply public-subject and state constraints once, after either provider. */
export function reconcileComposition(text:string, proposed:unknown, baseline:Composition, previous?:Composition):Composition|null {
  const valid=validateComposition(proposed);
  if(!valid)return null;
  const checked:Composition={blocks:valid.blocks.map(block=>{
    const section=block.kind==='story'?requestedStorySection(text,block.projectIds[0]):undefined;
    return section===undefined?block:{...block,section,focus:'outcomes',layout:'project-outcomes'};
  })};
  const interpreted=interpretPortfolioRequest(text,previousContext(previous));
  // A refinement patches the visible controls; a provider must not reset their focus or section.
  if(interpreted.followup&&previous)return baseline;
  if(['contact','architecture','timeline'].includes(interpreted.task)) {
    const match=checked.blocks.find(block=>block.kind===interpreted.task);
    if(!match)return baseline;
    if(interpreted.task==='timeline'&&interpreted.roleId)return {blocks:[{...match,roleId:interpreted.roleId}]};
  }
  if(stateNames(text).length){
    const match=checked.blocks.find(block=>block.kind==='benchmark');
    if(!match)return baseline;
    const block={...match,states:stateNames(text)};
    return {blocks:[withLayout(block,inferLayout(text,block))]};
  }
  if(interpreted.task==='comparison'&&interpreted.projectIds.length===2) {
    const match=checked.blocks.find(block=>block.kind==='comparison');
    if(!match)return baseline;
    return {blocks:[{...match,projectIds:interpreted.projectIds,focus:requestedFocus(text)??match.focus??'role'}]};
  }
  // Explicit questions about contribution/process/outcomes are project stories, not state rankings.
  if(interpreted.task==='story'&&interpreted.projectIds.length===1) {
    const match=checked.blocks.find(block=>block.kind==='story');
    if(!match)return baseline;
    const focus=requestedFocus(text)??match.focus??'overview';
    const old=previous?.blocks.find(block=>block.kind==='story'&&block.projectIds[0]===interpreted.projectIds[0]);
    const block={...match,projectIds:interpreted.projectIds,focus,...(interpreted.followup&&old?{search:old.search,expanded:old.expanded,section:old.section}:{})};
    return validateComposition({blocks:[withLayout(block,focus==='process'?'project-process':focus==='outcomes'?'project-outcomes':focus==='evidence'?'project-evidence':'project-brief')]});
  }
  if(interpreted.followup&&previous&&baseline.blocks[0]?.kind===checked.blocks[0]?.kind) {
    // The full current controls are authoritative; only the locally identified patch changes them.
    return baseline;
  }
  const kinds=checked.blocks.map(block=>block.kind);
  return new Set(kinds).size===kinds.length?checked:null;
}
export function composeLocal(text:string,plan:Plan,previous?:Composition|null):Composition {
  if(isPhotographyRequest(text))return previous??{blocks:[blankBlock('collection')]};
  const q=text.toLowerCase();
  const interpreted=interpretPortfolioRequest(text,previousContext(previous));
  const selected=stateNames(text);
  const oldBenchmark=previous?.blocks.find(b=>b.kind==='benchmark');
  const benchmarkRefinement=Boolean(oldBenchmark)&&['unknown','benchmark'].includes(interpreted.task)&&/\b(?:preparedness|composite|all states|all governments|midwest|east|south|west|criteria|distribution|rankings?|those states|these states|compare them|compare these|compare those)\b/i.test(q);
  if(selected.length||interpreted.task==='benchmark'||benchmarkRefinement) {
    const old=oldBenchmark??blankBlock('benchmark');
    const region=['East','Midwest','South','West'].find(value=>new RegExp('\\b'+value.toLowerCase()+'\\b').test(q)) as CanvasBlock['region']|undefined;
    const overview=/\b(?:all (?:states|governments)|rank(?:ings?)?|regions?|regional|distribution|histogram)\b/.test(q);
    const states=selected.length?selected:overview?[]:region?(old.states??[]).filter(name=>aiIndexStates.find(s=>s.state===name)?.region===region):old.states;
    const block:CanvasBlock={...old,states,region:/all (?:states|governments)/.test(q)?'All':region??old.region,band:overview?null:old.band,metric:/preparedness|raw score/.test(q)?'preparednessScore':/composite/.test(q)?'compositeScore':old.metric};
    const explicitLayout=/criteria|evidence|checklist|distribution|histogram|bands|regions|regional|ranking|rank governments|rank states/.test(q)||selected.length>0||Boolean(region)||overview;
    return {blocks:[withLayout(block,explicitLayout?inferLayout(text,block):block.layout??inferLayout(text,block))]};
  }
  if(interpreted.task==='unknown')return {blocks:[blankBlock('collection')]};
  if(interpreted.task==='comparison') {
    const old=previous?.blocks.find(b=>b.kind==='comparison');
    return {blocks:[{...blankBlock('comparison'),...old,projectIds:interpreted.projectIds,focus:requestedFocus(text)??old?.focus??'role'}]};
  }
  if(interpreted.task==='story') {
    const id=interpreted.projectIds[0]??plan.projectIds[0];
    if(!id)return {blocks:[blankBlock('collection')]};
    const old=previous?.blocks.find(b=>b.kind==='story'&&b.projectIds[0]===id);
    const focus=requestedFocus(text)??(interpreted.followup?old?.focus:'overview')??'overview';
    const block:CanvasBlock={...blankBlock('story'),...(interpreted.followup?old:{}),projectIds:[id],focus,section:requestedStorySection(text,id)??(interpreted.followup?old?.section:undefined)??evidenceSections(id,focus)[0]?.index??0};
    const layout=focus==='process'?'project-process':focus==='outcomes'?'project-outcomes':focus==='evidence'?'project-evidence':interpreted.followup&&old?.layout?old.layout:'project-brief';
    return {blocks:[withLayout(block,layout)]};
  }
  if(interpreted.task==='timeline') {
    const old=previous?.blocks.find(b=>b.kind==='timeline');
    return {blocks:[{...blankBlock('timeline'),...old,layout:/roles|responsibilities|current|summation|strengths|who (?:is|are)/i.test(text)?'experience-roles':'experience-timeline',focus:interpreted.focus,roleId:interpreted.roleId??old?.roleId??'summation-ai'}]};
  }
  return {blocks:[blankBlock(interpreted.task)]};
}
export function presetComposition(id:LayoutId):Composition {
  const definition=layoutDefinition(id);
  const block=withLayout(blankBlock(definition.kind),id);
  if(block.kind==='benchmark')block.states=id==='benchmark-compare'?['Michigan','California']:['benchmark-scorecard','benchmark-criteria'].includes(id)?['Michigan']:[];
  if(block.kind==='photos')block.albumIds=[albums.find(a=>a.folder==='Japan')?.folder??albums[0].folder];
  if(block.kind==='story')block.projectIds=[TAIWAN_ID];
  if(block.kind==='comparison')block.projectIds=[POLICY_ID,TAIWAN_ID];
  if(block.kind==='collection')block.projectIds=publicProjects.slice(0,3).map(p=>p.id);
  return {blocks:[block]};
}
