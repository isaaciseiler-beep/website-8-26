import { careerAnswerFor, careerConnectionFor } from './careerAnswers.js';
import { portfolioCatalog } from './portfolioEvidence.js';
import type { EvidenceFocus } from './portfolioEvidence.js';
import { findPublishedProject, findPublishedSection, publishedProjectMentions } from './portfolioRetrieval.js';

export const POLICY_ID = 'artificial-intelligence-in-state-government-index';
export const TAIWAN_ID = 'fulbright-focus-group-sponsored-by-openai';
export const portfolioAngles = ['leadership', 'tradeoffs', 'measurement', 'reflection', 'counterfactual'] as const;
export type PortfolioAngle = typeof portfolioAngles[number];
export function requestedAngle(text:string):PortfolioAngle|undefined {
  // Attribution and proof questions need the published limits in the first
  // answer; a nearby launch anecdote must not imply causal product ownership.
  if (/\bbecause\b.{0,45}\b(?:isaac|he|his|you|your)\b/i.test(text))return 'measurement';
  if (/\b(?:caus(?:e|ed|al)|prove[sd]?|proof|attribut\w*)\b|\bshipp?ed\b.*\b(?:because|feedback)\b|\bhow much\b.*\b(?:personally|alone|himself)\b|\b(?:rankings?|benchmark|scores?)\b.*\b(?:today|current|now)\b/i.test(text)) return 'measurement';
  if (/\b(?:did|does)\b.*\b(?:write|author|draft)\b.*\b(?:law|legislation|bill)\b/i.test(text)) return 'leadership';
  if (/\b(?:original|own|himself|single.?handedly|alone)\b.*\b(?:vision|strategy|identity|design|brand|rebrand)\b|\b(?:design|create|establish)\b.*\b(?:himself|alone|single.?handedly)\b/i.test(text)) return 'leadership';
  return /differently|would.*change|do over/i.test(text)?'counterfactual':/learn|lessons|takeaways|change.*(?:understanding|perspective|thinking)|(?:understanding|perspective|thinking).*change|\b(?:teach|taught) (?:isaac|you|him|me)\b/i.test(personalLearningText(text))?'reflection':/\blead(?:ership|ing)|\bled\b/i.test(text)?'leadership':/\btrade.?offs?|\bcompromises?|\bchallenges?|\bfailures?|\blimitations?|\b(?:what|which) decisions?\b|\bdecid(?:e|ed)\b/i.test(text)?'tradeoffs':/\bmeasur|\bevaluat|\bsuccess|whether.*work|\bhow (?:do|can) (?:we|you|i) know\b|^did .*\bwork\b/i.test(text)?'measurement':undefined;
}
/** Helping educators learn describes teaching methods, not Isaac's reflection.
 * Keep any later clause about what Isaac himself learned available. */
export function personalLearningText(text:string):string {
  if(!/\bhow\b.*\b(?:help(?:ed|ing)?|support(?:ed|ing)?|teach(?:ing)?|taught|train(?:ed|ing)?)\b/i.test(text))return text;
  return text.replace(/\b(?:teachers?|educators?|students?|participants?)(?:['’]s?)?\s+(?:to\s+)?learn(?:ing)?\b/gi,'');
}
export type PortfolioTask = 'story' | 'benchmark' | 'comparison' | 'timeline' | 'architecture' | 'contact' | 'collection' | 'unknown';
export type PortfolioInterpretation = { task: PortfolioTask; projectIds: string[]; focus: EvidenceFocus; roleId?: string; followup: boolean; explicit: boolean };

const subjects: [string, RegExp][] = [
  [POLICY_ID, /\b(?:ai policy|state governments?|government ai|ai government|ai in government|benchmark|preparedness|ai adoption|government index|genai|policy project|ai scores?|ai rankings?|ai evidence|score distribution|score histogram|distribution of (?:ai )?scores|histogram of (?:ai )?scores|score bands?)\b|map(?:ped|ping)?\b.*\bai\b|\bstates?\b.{0,45}\badopt\w*\b.{0,15}\bai\b/i],
  [TAIWAN_ID, /\b(?:taiwan|fulbright|teach\w*|educat\w*|workshops?|classrooms?|literacy)\b/i],
  ['openai-product-testing-and-feedback', /\b(?:openai|product test\w*|test(?:ing|ed)? (?:ai )?products?|product feedback|chatgpt(?: lab)?|study mode|pulse|atlas|100 chats|group chats|back to school)\b/i],
  ['senior-thesis-local-journalism', /\b(?:journalism|journalistic|local news|australia\w*|thesis|newsrooms?|news business models?|bargaining codes?|qualitative interviews?|17 interviews?|seventeen interviews?|verified transcripts?)\b/i],
  ['congressional-office-setup-100-day-report', /\b(?:congress\w*|scholten|100 days?|congressional office)\b/i],
  ['boehringer-cares-foundation-rebrand-strategy-shift', /\b(?:boehringer|rebrand\w*|brand rollout)\b/i],
];

export function namedProjects(text: string): string[] {
  const visibleIds = new Set(portfolioCatalog.map(project => project.id));
  const matches = subjects.flatMap(([id, pattern]) => { const match = pattern.exec(text); return match && visibleIds.has(id) ? [{ id, position: match.index }] : []; });
  for (const mention of publishedProjectMentions(text)) {
    if (!matches.some(match => match.id === mention.id)) matches.push(mention);
  }
  const namedProduct=/\b(?:study mode|pulse|atlas|group chats?|100 chats|back to school)\b/i.test(text);
  const comparison=/\b(?:compare|comparison|contrast|versus|vs)\b|side.by.side/i.test(text);
  const teachingSubject=/fulbright|teach\w*|educat\w*|workshops?|classrooms?|literacy|taiwan (?:program|lab|sessions?)/i.test(text);
  const productLesson=/product test\w*|product feedback|chatgpt lab/i.test(text)&&!/taiwan|fulbright|educators?|teachers?|workshops?|classrooms?|literacy/i.test(text);
  // OpenAI supports the Taiwan program; its name alone does not introduce a second project.
  const filtered=(namedProduct&&!teachingSubject||productLesson)&&!comparison?matches.filter(m=>m.id!==TAIWAN_ID)
    :matches.some(m=>m.id===TAIWAN_ID)&&!namedProduct&&!comparison&&!/product test|product feedback/i.test(text)?matches.filter(m=>m.id!=='openai-product-testing-and-feedback'):matches;
  // In a comparison between fields, the unqualified AI research/study is the
  // government research project. Resolve the second body of work rather than
  // silently answering only the named counterpart. A named research domain
  // (journalism/Australia) already identifies its own project and takes priority;
  // standalone "research" still needs the normal clarification path.
  const aiResearchPattern=/\b(?:ai|artificial intelligence)\s+(?:research|study)\b|\bresearch\s+(?:on|into|about)\s+(?:ai|artificial intelligence)\b/i;
  const researchClause=comparison?text.split(/\b(?:with|versus|vs|and|to)\b/i).find(clause=>aiResearchPattern.test(clause)&&!subjects.some(([,pattern])=>pattern.test(clause))):undefined;
  const aiResearch=researchClause?aiResearchPattern.exec(researchClause):null;
  if(aiResearch&&filtered.length===1&&filtered[0].id!==POLICY_ID)filtered.push({id:POLICY_ID,position:text.indexOf(researchClause!)+aiResearch.index});
  return filtered.sort((a, b) => a.position - b.position).map(m => m.id);
}

/** Inspecting an artifact differs from asking what it found. An access verb
 * and an artifact at the end of the question avoid capturing conceptual asks. */
export function requestedSourceAccess(text: string): boolean {
  return /\b(?:sources?|materials?|slides|downloads?)\b/i.test(text)
    || /\b(?:see|view|open|read|show|download|inspect)\b.*\b(?:thesis|report|paper|workspace)\s*[?.!]*$/i.test(text)
      && !/\b(?:findings?|results?|conclusions?|methods?|analysis|process|outcomes?)\b/i.test(text);
}
export function requestedFocus(text: string): EvidenceFocus | null {
  if(/^(?:(?:make (?:it|this|that)|show me) )?(?:more concrete|less abstract|a (?:concrete|specific) example)[.!?]*$/i.test(text.trim()))return 'process';
  if(requestedSourceAccess(text))return 'evidence';
  if (/\b(?:evidence|sources?|proof|notebook|materials|slides|downloads?)\b|\bread\b.*\b(?:report|thesis|paper)\b|^where\b.*\b(?:methodology|spreadsheet|recommendations|report|thesis|workspace|website)\b/i.test(text)) return 'evidence';
  if (/\b(?:outcomes?|results?|impact|takeaways?|learn(?:ed)?|lessons?|findings?|discover\w*|reveal\w*|accomplish\w*|achievements?)\b|\bwhat changed\b.*\b(?:result|because)|\bwhat did\b.*\b(?:interviews|study|thesis)\b.*\bfind\b\b/i.test(personalLearningText(text))) return 'outcomes';
  if (/\b(?:which|what)\b.*\bproducts?\b.*\b(?:help|work|test|contribut)\w*/i.test(text)) return 'process';
  if (/\b(?:process|steps?|methodology|methods?|approach|calculated)\b|\bhow\b.*\b(?:did|built|build|map|design|work|make|made|deliver|execute)\b/i.test(text)) return 'process';
  if (/\b(?:role|personally|contribut\w*|responsibilit\w*|own(?:ed)?)\b|\bwhat\b.*\b(?:did|built|build)\b/i.test(text)) return 'role';
  return null;
}
/** A named person's methods and contribution concern their work, even when
 * the project's subject is scoring or government adoption. */
export function personalProjectFocus(text:string):EvidenceFocus|null {
  const primary=text.split(/\b(?:and|alongside|plus|as well as)\b/i)[0];
  const focus=requestedFocus(primary);
  if(!/\b(?:isaac|you|your|he|his)\b/i.test(primary))return null;
  return focus==='process'||focus==='role'?focus:/\b(?:describe|characteriz\w*)\b/i.test(primary)?'role':null;
}

/** A project topic is not a request to inspect its dataset. Adoption and use
 * describe the subject of Isaac's work; scores and rankings request the data. */
export function requestsGovernmentDataset(text:string):boolean {
  if(personalProjectFocus(text)||requestedAngle(text)==='measurement'&&/caus|because|attribut|prove/i.test(text))return false;
  return /\b(?:scores?|scorecard|rank\w*|criteria|checklist|distribution|histogram|regions?|regional|preparedness|composite)\b/i.test(text);
}

/** Correct a subject only when the replacement names actual portfolio work.
 * Negative premises inside a case study must not become subject switches. */
export function correctedPortfolioRequest(text:string):string {
  const match=text.match(/^(?:(?:no|actually|sorry)[,!]?\s*)?(?:i meant|i mean|make that)\s+(.+)$/i)
    ??text.match(/^not\s+.+?[,;]?\s+(?:but|rather)\s+(.+)$/i);
  const replacement=match?.[1]?.split(/,\s*not\b|\s+rather than\b/i)[0]?.trim();
  return replacement&&(namedProjects(replacement).length||careerAnswerFor(replacement)||findPublishedProject(replacement))?replacement:text;
}
export const isReadingTransformation=(text:string)=>/^(?:(?:please )?(?:make (?:it|this|that) |be |show (?:me )?)?)(?:shorter|more concise|briefer|briefly|more concrete|less abstract|a (?:concrete|specific) example)[.!?]*$/i.test(text.trim());

/** Comparing unspecified experience is a request to choose a subject, not
 * permission to supply two projects from a default list. */
export function isUnspecifiedComparison(text:string,previous:{projectIds?:readonly string[];task?:string}={}):boolean {
  const q=text.trim();
  const vague=/^(?:(?:please\s+)?(?:(?:can|could|would) you\s+)?(?:compare|contrast|comparing|(?:show (?:me )?(?:a )?)?comparison (?:of|between))\s*(?:(?:isaac[’']s|his|your|the|these|those|two|different|professional)\s+)*(?:experiences?|projects?|roles?|backgrounds?|work|these|those|them|both)?|how do (?:his|your|these|those|the) (?:experiences?|projects?|roles?) compare)[.!?]*$/i.test(q);
  const currentPair=(previous.projectIds?.length??0)===2&&(previous.task==='comparison'||/\b(?:these|those|them|both|the two)\b/i.test(q));
  return vague&&!currentPair;
}

export function interpretPortfolioRequest(text: string, previous: { projectIds?: string[]; task?: PortfolioTask; focus?: EvidenceFocus } = {}): PortfolioInterpretation {
  const q = correctedPortfolioRequest(text).toLowerCase().trim().replace(/^(?:let me|i(?:’d|'d| would) like to)\s+/, '');
  const projectIds = namedProjects(q);
  const contextualQuestion = /^(?:and )?(?:what (?:were|are|was|is) (?:the |his |your |its |their )?(?:results?|outcomes?|impact|takeaways?|role|contribution|responsibilities|process|approach|findings?|sources?|materials|evidence)|what did (?:he|you|they) (?:learn|contribute|build)|how did (?:he|you|they) (?:do (?:it|this|that)|approach (?:it|this|that)|build (?:it|this|that))|(?:show|explain)(?: me)? (?:the |his |your )?(?:results?|outcomes?|process|evidence|contribution|findings?|sources?|materials)|(?:the )?(?:results?|outcomes?|process|evidence|contribution|findings?|sources?|materials))[?.!]*$/i.test(q);
  const shortFollowup=/^(?:how (?:did|was|were) (?:this|that|it|the work|the project|the program|that work|this work) (?:get done|done|carried out|delivered|built|organized)|what did (?:he|you|they) (?:actually |really )?(?:learn|contribute|build|change)(?: from (?:it|this|that))?|how did (?:he|you|they) make (?:it|this|that) happen|what changed as a result|what (?:is|was) the evidence for (?:it|this|that)|what would (?:he|you|they) (?:do differently|change)|did (?:it|this|that|the program) (?:actually |really )?work|how do (?:they|these|those|the two) compare(?: (?:on|in terms of) (?:outcomes?|results?|methods?|process|contributions?))?|how (?:were|are) (?:their|the) (?:methods|approaches|outcomes|results) different)[?.!]*$/i.test(q);
  // An answer-specific question can keep context without an exact scripted
  // phrase. Require a reference to the person/current artifact and actual
  // evidence in that project; unrelated questions must still get a fresh start.
  const groundedFollowup = !projectIds.length && Boolean(previous.projectIds?.length)
    && /^(?:and\s+)?(?:what|which|where|why|how|did|does|can|could|was|were|show|open|read|see|inspect)\b/i.test(q)
    && /\b(?:he|his|him|you|your|it|its|this|that|these|those|they|their|the (?:(?:whole|full|complete|final|underlying|original|published) )?(?:program|project|sessions?|report|study|work))\b/i.test(q)
    && (previous.projectIds!.some(id => findPublishedSection(q, id) !== undefined)
      || requestedFocus(q) === 'evidence'||previous.task==='timeline'&&requestedFocus(q)==='role'&&/\bthere\b/i.test(q)
      || previous.projectIds!.includes('openai-product-testing-and-feedback') && /\b(?:which|what)\b.*\bproducts?\b/i.test(q));
  const followup = (!projectIds.length || projectIds.every(id=>previous.projectIds?.includes(id))) && (contextualQuestion || shortFollowup || groundedFollowup || isReadingTransformation(q) || /^(?:tell me more|more about|expand|details|(?:show|open)(?: me)? (?:the )?(?:first|second|former|latter)(?: one| project)?|(?:can|could) i (?:see|open) (?:the )?(?:first|second|former|latter)(?: one| project)?|the first|the second|first one|second one|compare (?:these|those|them)|what about (?:this|that|the process|the outcomes|the role|the evidence)|why(?:[?.!]*$| (?:this|that|those|these)\b)|and\b|only\b|use\b|show (?:the )?(?:process|outcomes|evidence)|(?:the )?(?:process|outcomes|contribution|evidence)\b)/i.test(q));
  const focus = requestedFocus(q) ?? (followup ? previous.focus ?? 'overview' : 'overview');
  const result = (task: PortfolioTask, ids = projectIds, extra: Partial<PortfolioInterpretation> = {}): PortfolioInterpretation => ({ task, projectIds: ids, focus, followup, explicit: projectIds.length > 0, ...extra });
  if(isUnspecifiedComparison(q))return isUnspecifiedComparison(q,previous)?result('unknown',[]):result('comparison',previous.projectIds!,{followup:true});
  if (/\b(?:contact|email|linkedin|github)\b|\breach (?:isaac|you|him|out)\b|\bconnect (?:with|to) (?:isaac|you|him)\b/i.test(q)) return result('contact');
  if (/\b(?:site|website|interface)\b.*\b(?:works?|built|architecture|pipeline|made)\b|\b(?:architecture|source code|live pipeline)\b|^how this works[?!.]*$/i.test(q)) return result('architecture');
  if(!projectIds.length&&/\bwashington(?:\s*,\s*|\s+)d\.?\s*c\.?\b/i.test(q)&&/\b(?:isaac|you|your|he|his)\b/i.test(q)&&/\b(?:did|do|work|role|contribut\w*|responsibilit\w*|learn\w*)\b/i.test(q)&&!/\b(?:scores?|rank\w*|preparedness|criteria|adoption)\b/i.test(q))return result('story',['congressional-office-setup-100-day-report']);
  if(projectIds.length===1&&previous.projectIds?.length&&/\b(?:compare|contrast)\b.*\b(?:this|that|it|these|those)\b/i.test(q)){
    const compared=[...new Set([...previous.projectIds, ...projectIds])];
    if(compared.length===2)return result('comparison',compared,{followup:true});
  }
  if (/\b(?:compare|comparison|contrast|versus|side.by.side)\b|\bvs\b/i.test(q) && (projectIds.length >= 2 || (followup && (previous.projectIds?.length ?? 0) >= 2))) return result('comparison', projectIds.length >= 2 ? projectIds.slice(0, 2) : previous.projectIds!.slice(0, 2));
  if(careerAnswerFor(q)==='connections'&&(!projectIds.length||careerConnectionFor(q,projectIds)))return result('timeline',projectIds,{focus:requestedFocus(q)??(/\b(?:compare|contrast|difference)\b/i.test(q)?'process':focus)});
  if (!projectIds.length && careerAnswerFor(q)) return result('timeline', [], {roleId:/public service/i.test(q)?'us-house':/summation|current|working on|\bnow\b/i.test(q)?'summation-ai':undefined});
  if (!projectIds.length && /\b(?:career|experience|background|biography|resume|qualifications|strengths|skills|leadership|hir(?:e|ing)|public service|current role|current work|summation|professional roles|responsibilities)\b|\bwho (?:is|are)\b|\bwhat connects\b|\bwhat (?:do|does)\b.*\bdo\b|\btell me about (?:yourself|isaac|him)\b|\bwhat (?:is|are)\b.*\b(?:working on|good at)\b|\btruman\b|\brhodes\b/i.test(q)) return result('timeline', [], { roleId: /public service/i.test(q) ? 'us-house' : /summation|current|\bnow\b/i.test(q) ? 'summation-ai' : undefined });
  if (/^(?:show |rank |list |explore )?(?:all )?governments[.!?]*$/i.test(q)) return result('benchmark', [POLICY_ID]);
  if (/^(?:(?:show|browse|explore|see|view|tell me about)\s+)?(?:me\s+)?(?:all\s+)?(?:your\s+|isaac[’']?s\s+)?(?:work|projects|portfolio|ai work)[.!?]*$/i.test(q) || /all projects|project index|work explorer/i.test(q)) return result('collection', []);
  if (projectIds.length) {
    if(projectIds[0]===POLICY_ID&&requestedAngle(q)==='measurement'&&/caus|because|attribut|prove/i.test(q))return result('story',projectIds,{focus:'outcomes'});
    return result(projectIds[0] === POLICY_ID && requestsGovernmentDataset(q) ? 'benchmark' : 'story');
  }
  if (followup && previous.projectIds?.length) {
    if (previous.task === 'comparison' && previous.projectIds.length === 2 && !/\b(?:first|second|former|latter)\b/i.test(q)) return result('comparison', previous.projectIds);
    if (previous.task === 'story' && previous.projectIds.length > 1 && !/\b(?:first|second|former|latter)\b/i.test(q)) return result('story', previous.projectIds);
    const index = /second|latter/.test(q) ? 1 : 0;
    return result('story', [previous.projectIds[index] ?? previous.projectIds[0]]);
  }
  if(followup&&previous.task==='timeline')return result('timeline',[]);
  // Strong title or domain evidence can identify an unfamiliar phrasing. Shared incidental words cannot.
  const words = q.match(/[a-z]{4,}/g)?.filter(word => !['what','does','your','isaac','about','tell','please','would','could','have','from','with','that','this','work','project','projects','really','there','which'].includes(word)) ?? [];
  const ranked = portfolioCatalog.map(p => ({ id: p.id, hits: words.filter(word => `${p.title} ${p.role}`.toLowerCase().includes(word)).length })).sort((a,b) => b.hits-a.hits);
  if (ranked[0]?.hits >= 2 && ranked[0].hits > (ranked[1]?.hits ?? 0)) return result('story', [ranked[0].id]);
  const retrieved = findPublishedProject(q);
  if (retrieved) return result('story', [retrieved], { explicit: true });
  return result('unknown', []);
}
