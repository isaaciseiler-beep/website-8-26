import { projectAnswerEvidence } from './portfolioEvidenceManifest.js';
import { evidenceFor, sectionPreview, projectAngleAnswer } from './portfolioEvidence.js';
import { requestedAngle, requestedFocus, requestedSourceAccess } from './portfolioIntent.js';
import { findPublishedSection, publishedTextRelevance } from './portfolioRetrieval.js';
import { ANSWER_READING_WORD_BUDGET, evidenceForSection, getEvidence, portfolioEvidenceRegistry, validateAnswerPlan, type AnswerPlan, type EvidenceRecord } from './portfolioEvidenceRegistry.js';

type StorySelection={kind?:string;projectIds?:string[];section?:number;paragraphIndices?:number[];focus?:string;angle?:string;answerPlan?:AnswerPlan};
type Kind=AnswerPlan['facets'][number]['kind'];
const facetPatterns:readonly[Kind,RegExp][]=[
  ['contribution',/\bwhat\b.*\b(?:built|build)\b|\b(?:responsibilit\w*|responsible|role|own(?:ed|ership)?|personally|contribut\w*)\b/i],
  ['process',/\b(?:how|methods?|process|approach|steps?|built|build|design|test(?:ing|ed)?|research evidence)\b/i],
  ['decisions',/\b(?:decisions?|trade.?offs?|alternatives?|challenges?|limitations?|choose|chose|choice)\b/i],
  ['outcomes',/\b(?:publish(?:ed)?|publication|outputs?)\b|\b(?:finished|completed|final)\b.*\b(?:establish|demonstrat|show|produc)\w*|\b(?:results?|outcomes?|impact|accomplish\w*|findings?|reveal\w*|achiev\w*)\b/i],
  ['lessons',/\b(?:teach|taught) (?:isaac|you|him|me)\b|\b(?:learn\w*|lessons?|takeaways?|reflection)\b|change.*(?:understanding|perspective|thinking)/i],
  ['sources',/\b(?:sources?|materials?|slides|artifacts?|read|downloads?)\b/i],
];
export function requestedQuestionFacets(question:string):{kind:Kind;question:string}[]{
  const clauses=question.split(/[,;?]|\band\s+(?=(?:what|how|why|which|where|did|can|show)\b)/i).map(item=>item.trim()).filter(Boolean).slice(0,6);
  const output:{kind:Kind;question:string}[]=[];
  for(const clause of clauses){
    const matches=facetPatterns.flatMap(([kind,pattern])=>{const found=pattern.exec(clause);return found?[{kind,question:clause,index:found.index}]:[];}).sort((a,b)=>a.index-b.index);
    // "How" and "personally" often describe one contribution question. Keep
    // distinct requested aspects, not every incidental grammatical marker.
    if(matches.length===2&&matches.some(item=>item.kind==='process')&&matches.some(item=>item.kind==='contribution')&&!/\band\b/i.test(clause)&&/\bhow\b.*\b(?:personally|contribut|responsib)/i.test(clause))matches.splice(matches.findIndex(item=>item.kind===(/\bwhat\b.*\b(?:built|build)\b/i.test(clause)?'process':'contribution')),1);
    for(const match of matches)if(!output.some(item=>item.kind===match.kind))output.push({kind:match.kind,question:clause});
  }
  if(requestedSourceAccess(question)&&!output.some(item=>item.kind==='sources'))output.push({kind:'sources',question});
  return output.length?output.slice(0,6):[{kind:'context',question}];
}
const contentKinds=new Set(['paragraph','bullet','quote','stat']);
const distinct=(records:readonly EvidenceRecord[])=>[...new Map(records.map(record=>[record.id,record])).values()];

/** A bounded evidence plan is a list of public references, never synthesized
 * claims. Every requested facet has support, an explicit limit, or unavailable. */
export function buildAnswerPlan(question:string,block:StorySelection,options:{preservePrimary?:boolean}={}):AnswerPlan|undefined {
  if(block.kind!=='story')return undefined;
  const projectId=block.projectIds?.[0];
  if(!projectId)return undefined;
  const primarySection=block.section??0;
  const record=evidenceFor(projectId);
  if(!record)return undefined;
  const facets=requestedQuestionFacets(question);
  const angle=requestedAngle(question)??block.angle;
  const broadLab=projectId==='openai-product-testing-and-feedback'&&!/study mode|pulse|atlas|group chats?|100 chats|back to school/i.test(question)
    &&(primarySection===0||primarySection===7||/\b(?:chatgpt|openai|cohort)\b|product testing/i.test(question));
  const needsLabAttribution=broadLab&&facets.some(facet=>facet.kind==='outcomes');
  const hasLimit=Boolean(angle&&['measurement','counterfactual','leadership'].includes(angle)&&projectAngleAnswer(projectId,angle,primarySection));
  if((hasLimit||needsLabAttribution)&&!facets.some(facet=>facet.kind==='limits'))facets.splice(Math.min(facets.length,5),0,{kind:'limits',question});
  const all=portfolioEvidenceRegistry.filter(item=>item.projectId===projectId);
  const used=new Set<string>();let words=0;
  const plans:AnswerPlan['facets']=[];
  for(const [facetIndex,facet]of facets.slice(0,6).entries()){
    const focus=facet.kind==='contribution'?'role':facet.kind==='outcomes'||facet.kind==='lessons'?'outcomes':facet.kind==='process'||facet.kind==='decisions'?'process':block.focus??'role';
    const preferred=focus==='process'?record.processSections:focus==='outcomes'?record.outcomeSections:record.project.sections.map((_,index)=>index);
    const selectedSection=facetIndex===0&&(options.preservePrimary||!['outcomes','lessons'].includes(facet.kind)||preferred.includes(primarySection))?primarySection:findPublishedSection(facet.question,projectId,preferred)??preferred[0]??primarySection;
    const selected=evidenceForSection(projectId,selectedSection);
    const reviewedIds=projectAnswerEvidence[projectId]?.[facet.kind as keyof typeof projectAnswerEvidence[string]]??[];
    let reviewed=reviewedIds.map(id=>getEvidence(id)).filter((item):item is EvidenceRecord=>Boolean(item));
    if(facet.kind==='lessons'&&projectId==='openai-product-testing-and-feedback'&&/study mode|pulse|atlas|group chats?|100 chats|back to school/i.test(question)){
      const preview=sectionPreview(projectId,primarySection,'outcomes','reflection');
      reviewed=evidenceForSection(projectId,primarySection).filter(item=>item.kind==='paragraph'&&preview.includes(item.paragraphIndex!));
    }
    const localReviewed=reviewed.filter(item=>item.sectionIndex===selectedSection);
    let candidates:EvidenceRecord[]=[];
    if((facet.kind==='decisions'||facet.kind==='lessons')&&!reviewed.length){plans.push({kind:facet.kind,evidenceIds:[],status:'unavailable'});continue;}
    if(facet.kind==='sources'){
      const localLinks=distinct([...selected.filter(item=>item.kind==='link'),...evidenceForSection(projectId,primarySection).filter(item=>item.kind==='link')]);
      candidates=localLinks.length?localLinks:/\ball\b.*\b(?:sources?|materials|links|artifacts?)\b/i.test(facet.question)?all.filter(item=>item.kind==='link'):[];
    }else if(facet.kind==='limits'){
      candidates=needsLabAttribution?all.filter(item=>item.kind==='qualification'):all.filter(item=>item.kind==='paragraph'&&(angle==='leadership'?/broader team|did not create|not as an engineer/i.test(item.text):angle==='measurement'?/numbers belonged to the full team|not.*causal|does not report|did not measure/i.test(item.text):false));
    }else{
      const indices=facetIndex===0&&selectedSection===primarySection?block.paragraphIndices:undefined;
      const preferredPassages=indices?.length?indices.map(index=>selected.find(item=>item.paragraphIndex===index&&item.kind==='paragraph')).filter((item):item is EvidenceRecord=>Boolean(item))
        :sectionPreview(projectId,selectedSection,focus as Parameters<typeof sectionPreview>[2],angle).map(index=>selected.find(item=>item.kind==='paragraph'&&item.paragraphIndex===index)).filter((item):item is EvidenceRecord=>Boolean(item));
      const relevant=all.filter(item=>contentKinds.has(item.kind)&&preferred.includes(item.sectionIndex)).map(item=>({item,score:publishedTextRelevance(item.text,facet.question)})).filter(row=>row.score>0).sort((a,b)=>b.score-a.score);
      const explicitMethods=/\b(?:methods?|methodology|research evidence|research process|verification|coding|interviews?|organized|get done|carried out|workflows?|steps?)\b/i.test(facet.question);
      const reviewedFirst=facet.kind==='lessons'||facet.kind==='outcomes'||facet.kind==='contribution'||facet.kind==='process'&&explicitMethods;
      const curated=localReviewed.length?localReviewed:facet.kind==='process'&&explicitMethods?reviewed:facet.kind==='lessons'||facet.kind==='contribution'&&(primarySection===0||projectId==='artificial-intelligence-in-state-government-index'||projectId==='openai-product-testing-and-feedback'&&!/study mode|pulse|atlas|group chats?|100 chats|back to school/i.test(question))?reviewed:[];
      candidates=facet.kind==='lessons'&&curated.length?curated:distinct([...(reviewedFirst?curated:[]),...preferredPassages,...curated,
        ...(!preferredPassages.length?selected.filter(item=>contentKinds.has(item.kind)).sort((a,b)=>publishedTextRelevance(b.text,facet.question)-publishedTextRelevance(a.text,facet.question)):[]),
        ...(facets.length>1?relevant.map(row=>row.item):[])]);
      // Secondary facets should not inherit the first answer's unrelated section.
      if(facetIndex>0&&relevant.length&&!reviewedFirst)candidates=distinct([...relevant.slice(0,3).map(row=>row.item),...candidates]);
    }
    // A general Lab methods question is about actual testing and feedback,
    // not solely about the book documenting student workflows. Named product
    // questions keep their own selected section and never take this branch.
    if(broadLab&&(facet.kind==='process'||facet.kind==='outcomes'))candidates=reviewed;
    const references:string[]=[];
    for(const item of candidates){
      const length=item.text.split(/\s+/).length;
      if(references.length===4||used.size===12)break;
      if(words+(used.has(item.id)?0:length)>ANSWER_READING_WORD_BUDGET||references.includes(item.id))continue;
      // Reuse across facets is allowed for completeness; count it only once.
      references.push(item.id);if(!used.has(item.id)){used.add(item.id);words+=length;}
      if(facet.kind==='limits'&&references.length===1)break;
      if(facet.kind!=='sources'&&facets.length>2&&references.length===2)break;
    }
    const insufficient=facet.kind==='decisions'&&!/decid|chose|choose|trade.?off|wanted|questions changed|intention|rather than|approved/i.test(references.map(id=>getEvidence(id)?.text).join(' '));
    const missingLesson=facet.kind==='lessons'&&!/learn|lesson|reinforced|reflec|before.*thought/i.test(references.map(id=>getEvidence(id)?.text).join(' '));
    plans.push({kind:facet.kind,evidenceIds:references,status:!references.length?'unavailable':facet.kind==='limits'||insufficient||missingLesson?'limited':'supported'});
  }
  const plan:AnswerPlan={version:1,facets:plans};
  return validateAnswerPlan(plan,block.projectIds??[])?plan:undefined;
}
export function answerPlanCoverage(plan:AnswerPlan){
  return {requested:plan.facets.length,supported:plan.facets.filter(facet=>facet.status==='supported').length,limited:plan.facets.filter(facet=>facet.status==='limited').length,unavailable:plan.facets.filter(facet=>facet.status==='unavailable').length};
}
