import { portfolioCatalog } from './portfolioEvidence.js';
import type { EvidenceFocus } from './portfolioEvidence.js';

export const POLICY_ID = 'artificial-intelligence-in-state-government-index';
export const TAIWAN_ID = 'fulbright-focus-group-sponsored-by-openai';
export type PortfolioTask = 'story' | 'benchmark' | 'comparison' | 'timeline' | 'architecture' | 'contact' | 'collection' | 'unknown';
export type PortfolioInterpretation = { task: PortfolioTask; projectIds: string[]; focus: EvidenceFocus; roleId?: string; followup: boolean; explicit: boolean };

const subjects: [string, RegExp][] = [
  [POLICY_ID, /\b(?:ai policy|state governments?|government ai|ai government|ai in government|benchmark|preparedness|ai adoption|government index|genai|policy project|ai scores?|ai evidence|score distribution|score histogram|distribution of (?:ai )?scores|histogram of (?:ai )?scores|score bands?)\b|map(?:ped|ping)?\b.*\bai\b/i],
  [TAIWAN_ID, /\b(?:taiwan|fulbright|teach\w*|educat\w*|workshops?|classrooms?|literacy)\b/i],
  ['openai-product-testing-and-feedback', /\b(?:openai|product test\w*|test(?:ing|ed)? (?:ai )?products?|product feedback|chatgpt lab|study mode|pulse|atlas|100 chats|group chats)\b/i],
  ['senior-thesis-local-journalism', /\b(?:journalis\w*|australia\w*|thesis|newsrooms?)\b/i],
  ['congressional-office-setup-100-day-report', /\b(?:congress\w*|scholten|100 days?|congressional office)\b/i],
  ['boehringer-cares-foundation-rebrand-strategy-shift', /\b(?:boehringer|rebrand\w*|brand rollout)\b/i],
];

export function namedProjects(text: string): string[] {
  const matches = subjects.flatMap(([id, pattern]) => { const match = pattern.exec(text); return match ? [{ id, position: match.index }] : []; });
  // OpenAI supports the Taiwan program; its name alone does not introduce a second project.
  const filtered = matches.some(m => m.id === TAIWAN_ID) && !/product test|product feedback|compare|versus|\bvs\b/i.test(text)
    ? matches.filter(m => m.id !== 'openai-product-testing-and-feedback') : matches;
  return filtered.sort((a, b) => a.position - b.position).map(m => m.id);
}

export function requestedFocus(text: string): EvidenceFocus | null {
  if (/\b(?:evidence|sources?|proof|notebook)\b/i.test(text)) return 'evidence';
  if (/\b(?:outcomes?|results?|impact|takeaways?|learn(?:ed)?|achievements?)\b/i.test(text)) return 'outcomes';
  if (/\b(?:process|steps?|methodology|methods?|approach|calculated)\b|\bhow\b.*\b(?:did|built|build|map|design|work)\b/i.test(text)) return 'process';
  if (/\b(?:role|personally|contribut\w*|responsibilit\w*|own(?:ed)?)\b|\bwhat\b.*\b(?:did|built|build)\b/i.test(text)) return 'role';
  return null;
}

export function interpretPortfolioRequest(text: string, previous: { projectIds?: string[]; task?: PortfolioTask; focus?: EvidenceFocus } = {}): PortfolioInterpretation {
  const q = text.toLowerCase().trim();
  const projectIds = namedProjects(q);
  const contextualQuestion = /^(?:and )?(?:what (?:were|are|was|is) (?:the |his |your |its |their )?(?:results?|outcomes?|impact|takeaways?|role|contribution|responsibilities|process|approach)|what did (?:he|you|they) (?:learn|contribute|build)|how did (?:he|you|they) (?:do (?:it|this|that)|approach (?:it|this|that)|build (?:it|this|that))|(?:show|explain)(?: me)? (?:the |his |your )?(?:results?|outcomes?|process|evidence|contribution)|(?:the )?(?:results?|outcomes?|process|evidence|contribution))[?.!]*$/i.test(q);
  const followup = (!projectIds.length || projectIds.every(id=>previous.projectIds?.includes(id))) && (contextualQuestion || /^(?:tell me more|more about|expand|details|the first|the second|first one|second one|compare (?:these|those|them)|what about (?:this|that|the process|the outcomes|the role|the evidence)|why(?:[?.!]*$| (?:this|that|those|these)\b)|and\b|only\b|use\b|show (?:the )?(?:process|outcomes|evidence)|(?:the )?(?:process|outcomes|contribution|evidence)\b)/i.test(q));
  const focus = requestedFocus(q) ?? (followup ? previous.focus ?? 'overview' : 'overview');
  const result = (task: PortfolioTask, ids = projectIds, extra: Partial<PortfolioInterpretation> = {}): PortfolioInterpretation => ({ task, projectIds: ids, focus, followup, explicit: projectIds.length > 0, ...extra });
  if (/\b(?:contact|email|linkedin|github)\b|\breach (?:isaac|you|him|out)\b|\bconnect (?:with|to) (?:isaac|you|him)\b/i.test(q)) return result('contact');
  if (/\b(?:site|website|interface)\b.*\b(?:works?|built|architecture|pipeline|made)\b|\b(?:architecture|source code|live pipeline)\b|^how this works[?!.]*$/i.test(q)) return result('architecture');
  if (/\b(?:compare|comparison|contrast|versus|side.by.side)\b|\bvs\b/i.test(q) && (projectIds.length >= 2 || (followup && (previous.projectIds?.length ?? 0) >= 2))) return result('comparison', projectIds.length >= 2 ? projectIds.slice(0, 2) : previous.projectIds!.slice(0, 2));
  if (!projectIds.length && /\b(?:career|experience|background|biography|resume|qualifications|strengths|skills|hir(?:e|ing)|public service|current role|current work|summation|professional roles|responsibilities)\b|\bwho (?:is|are)\b|\bwhat connects\b|\bwhat (?:do|does)\b.*\bdo\b|\btell me about (?:yourself|isaac|him)\b|\bwhat (?:is|are)\b.*\b(?:working on|good at)\b|\btruman\b|\brhodes\b/i.test(q)) return result('timeline', [], { roleId: /summation|current|\bnow\b/i.test(q) ? 'summation-ai' : undefined });
  if (/^(?:show |rank |list |explore )?(?:all )?governments[.!?]*$/i.test(q)) return result('benchmark', [POLICY_ID]);
  if (/^(?:(?:show|browse|explore|see|view|tell me about)\s+)?(?:me\s+)?(?:all\s+)?(?:your\s+|isaac[’']?s\s+)?(?:work|projects|portfolio|ai work)[.!?]*$/i.test(q) || /all projects|project index|work explorer/i.test(q)) return result('collection', []);
  if (projectIds.length) {
    const projectQuestion = /\b(?:role|personally|contribut\w*|methodology|methods?|approach|process|built|build|outcomes?|results?|learned|project|research|map|mapped)\b|\bhow\b/i.test(q);
    const dataQuestion = /\b(?:rank\w*|scores?|scorecard|criteria|checklist|distribution|histogram|regions?|preparedness|compare|using|adopt\w*)\b/i.test(q);
    return result(projectIds[0] === POLICY_ID && (dataQuestion || !projectQuestion) ? 'benchmark' : 'story');
  }
  if (followup && previous.projectIds?.length) {
    if (previous.task === 'comparison' && previous.projectIds.length === 2 && !/\b(?:first|second)\b/i.test(q)) return result('comparison', previous.projectIds);
    const index = /second/.test(q) ? 1 : 0;
    return result('story', [previous.projectIds[index] ?? previous.projectIds[0]]);
  }
  if(followup&&previous.task==='timeline')return result('timeline',[]);
  // Strong title or domain evidence can identify an unfamiliar phrasing. Shared incidental words cannot.
  const words = q.match(/[a-z]{4,}/g)?.filter(word => !['what','does','your','isaac','about','tell','please','would','could','have','from','with','that','this','work','project','projects','really','there','which'].includes(word)) ?? [];
  const ranked = portfolioCatalog.map(p => ({ id: p.id, hits: words.filter(word => `${p.title} ${p.role}`.toLowerCase().includes(word)).length })).sort((a,b) => b.hits-a.hits);
  if (ranked[0]?.hits >= 2 && ranked[0].hits > (ranked[1]?.hits ?? 0)) return result('story', [ranked[0].id]);
  return result('unknown', []);
}
