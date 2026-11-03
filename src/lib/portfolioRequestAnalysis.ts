import { projectItems, hiddenProjectIds } from './siteContent.js';
import { interpretPortfolioRequest, namedProjects, isUnspecifiedComparison, type PortfolioTask } from './portfolioIntent.js';
import { projectEvidenceScope } from './portfolioEvidenceManifest.js';

export type RequestAnalysis={kind:'recognized'|'ambiguous'|'weak_retrieval'|'missing_material'|'out_of_scope';projectIds:string[];choices:{projectId:string;label:string;question:string}[];gaps:readonly string[]};
const publicProjects=projectItems.filter(project=>!hiddenProjectIds.has(project.id));
const choice=(projectId:string)=>{const project=publicProjects.find(project=>project.id===projectId)!;return {projectId,label:project.title,question:`Show ${project.title}`};};
/** Distinguish recoverable interpretation/content gaps from provider execution
 * failures. This pure result contains IDs and reviewed labels, never raw input. */
export function analyzePortfolioRequest(text:string,previous:{projectIds?:string[];task?:PortfolioTask}={}):RequestAnalysis{
  const interpreted=interpretPortfolioRequest(text,previous);
  const direct=namedProjects(text);
  let choices:string[]=[];
  if(isUnspecifiedComparison(text,previous))choices=publicProjects.map(project=>project.id);
  if(/^(?:(?:show|explore|explain|tell me about)\s+)?(?:isaac[’']s\s+|his\s+|your\s+)?openai(?:\s+(?:work|experience|projects?))?[.!?]*$/i.test(text.trim()))choices=['openai-product-testing-and-feedback','fulbright-focus-group-sponsored-by-openai'];
  if(!direct.length&&/^(?:(?:show|explore|explain|tell me about)\s+)?(?:isaac[’']s\s+|his\s+|your\s+)?research(?:\s+(?:work|experience|projects?))?[.!?]*$/i.test(text.trim()))choices=['artificial-intelligence-in-state-government-index','senior-thesis-local-journalism'];
  if(choices.length)return {kind:'ambiguous',projectIds:[],choices:choices.map(choice),gaps:[]};
  const ids=interpreted.projectIds;
  const gaps=ids.flatMap(id=>projectEvidenceScope[id]?.editorialGaps??[]).filter(gap=>
    gap==='detailed-conclusions'?/detailed.*(?:findings|conclusions)|(?:verbatim|full).*interviews/i.test(text):
    gap==='shipped-feature-attribution'?/shipped|because.*feedback|caused/i.test(text):
    gap==='causal-impact'?/caus|prove|attribut|personally.*increase/i.test(text):
    gap==='rejected-alternatives'?/reject|alternatives/i.test(text):/personal.*(?:learn|retrospective)|what.*learn/i.test(text));
  return {kind:gaps.length?'missing_material':interpreted.task!=='unknown'?'recognized':/\b(?:isaac|his|your|he|project|portfolio|work|research)\b/i.test(text)?'weak_retrieval':'out_of_scope',projectIds:ids,choices:[],gaps:[...new Set(gaps)]};
}
