import { careerAnswerFor } from './careerAnswers.js';
/** Authored questions backed by the same published portfolio records as Explore. */
type Topic='career'|'taiwan'|'congress'|'policy'|'journalism'|'rebrand'|'openai'|'contact'|'work';
type Aspect='overview'|'role'|'process'|'outcomes'|'lessons'|'measurement'|'tradeoffs'|'leadership'|'strengths'|'service'|'comparison';
export type ExperiencePrompt={id:string;text:string;keywords:string;topics:readonly Topic[];aspect:Aspect};
export type SuggestionContext={projectIds:readonly string[];kind?:string;focus?:string;answerId?:string;angle?:string;section?:number;question?:string;visitedQuestions?:readonly string[]};
export const experiencePrompts:readonly ExperiencePrompt[]=[
  {id:'career',text:'Walk me through Isaac’s experience',keywords:'background biography resume cv journey qualifications who about yourself',topics:['career'],aspect:'overview'},
  {id:'taiwan',text:'What did Isaac build in Taiwan?',keywords:'fulbright teachers teaching workshop classroom learning asia',topics:['taiwan'],aspect:'role'},
  {id:'congress',text:'What was Isaac’s role in Congress?',keywords:'scholten politics washington communications',topics:['congress'],aspect:'role'},
  {id:'policy',text:'How did Isaac research AI in government?',keywords:'benchmark index artificial intelligence mapping analysis data methodology',topics:['policy'],aspect:'process'},
  {id:'policy-role',text:'What did Isaac contribute to the government AI benchmark?',keywords:'ownership personally contribution role research index',topics:['policy'],aspect:'role'},
  {id:'policy-outcomes',text:'What were the outcomes of Isaac’s government AI research?',keywords:'outputs results roadmap recommendations',topics:['policy'],aspect:'outcomes'},
  {id:'policy-benchmark',text:'Explore the government AI benchmark',keywords:'state states territory territories rankings scores preparedness adoption data criteria',topics:['policy'],aspect:'overview'},
  {id:'connections',text:'What connects Isaac’s Taiwan teaching, AI policy research, and congressional communications?',keywords:'common thread throughline connects connection together technology people systems',topics:['career'],aspect:'overview'},
  {id:'timeline',text:'Show Isaac’s career timeline',keywords:'chronology chronological timeline career path journey history dates',topics:['career'],aspect:'overview'},
  {id:'strengths',text:'What are Isaac’s strongest skills?',keywords:'strength strengths skills good well hiring hire qualifications',topics:['career'],aspect:'strengths'},
  {id:'service',text:'Tell me about Isaac’s public service',keywords:'government politics community service',topics:['career'],aspect:'service'},
  {id:'leadership',text:'Which work demonstrates Isaac’s leadership?',keywords:'lead led leading manage management team ownership',topics:['career'],aspect:'leadership'},
  {id:'roles',text:'Explore Isaac’s roles and responsibilities',keywords:'experience work jobs employment career',topics:['career'],aspect:'role'},
  {id:'current',text:'What is Isaac working on now?',keywords:'summation current today latest job marketing communications',topics:['career'],aspect:'overview'},
  {id:'journalism',text:'What did Isaac’s journalism research explore?',keywords:'australia thesis reporting media news university interviews',topics:['journalism'],aspect:'overview'},
  {id:'journalism-findings',text:'What did Isaac discover about local journalism?',keywords:'findings discovered conclusions results',topics:['journalism'],aspect:'outcomes'},
  {id:'journalism-methods',text:'How did Isaac conduct the journalism interviews?',keywords:'interviews qualitative recruitment transcripts coding methodology thematic analysis',topics:['journalism'],aspect:'process'},
  {id:'journalism-models',text:'Which news business models did Isaac study?',keywords:'journalism print digital hybrid nonprofit subscription bargaining codes platforms',topics:['journalism'],aspect:'process'},
  {id:'taiwan-process',text:'How did educators shape the Taiwan program?',keywords:'participants design change sessions influence approach process',topics:['taiwan'],aspect:'process'},
  {id:'taiwan-lessons',text:'What did Isaac learn in Taiwan?',keywords:'lessons learned learning reflection takeaways',topics:['taiwan'],aspect:'lessons'},
  {id:'taiwan-outcomes',text:'What were the outcomes of Isaac’s Taiwan project?',keywords:'fulbright impact results achievements literacy',topics:['taiwan'],aspect:'outcomes'},
  {id:'taiwan-measurement',text:'How did Isaac evaluate the Taiwan program?',keywords:'measure measured measurement evaluation success worked assessment',topics:['taiwan'],aspect:'measurement'},
  {id:'taiwan-tradeoffs',text:'What were the tradeoffs in the Taiwan program?',keywords:'challenges limitations compromises decisions',topics:['taiwan'],aspect:'tradeoffs'},
  {id:'report',text:'How did Isaac create the 100 Day Report?',keywords:'congress scholten report first hundred days creation writing design',topics:['congress'],aspect:'process'},
  {id:'congress-outcomes',text:'What did the congressional office accomplish?',keywords:'congress outcomes results constituents impact service achievements',topics:['congress'],aspect:'outcomes'},
  {id:'congress-press',text:'How did Isaac build the congressional press network?',keywords:'press list reporters outreach media local statewide national relationships',topics:['congress'],aspect:'process'},
  {id:'congress-story',text:'How did Isaac bring the child-labor story to national news?',keywords:'congress scholten west michigan district federal policy child labor reporting coverage',topics:['congress'],aspect:'process'},
  {id:'congress-audiences',text:'How did Isaac reach different audiences in Congress?',keywords:'communications messaging social media district constituent outreach audience',topics:['congress'],aspect:'process'},
  {id:'rebrand',text:'What was Isaac’s role in the Boehringer rebrand?',keywords:'brand branding marketing communications strategy foundation healthcare cares',topics:['rebrand'],aspect:'role'},
  {id:'rebrand-outcomes',text:'What were the results of Isaac’s Boehringer project?',keywords:'rebrand outcomes impact volunteering newsletter',topics:['rebrand'],aspect:'outcomes'},
  {id:'rebrand-rollout',text:'How did Isaac implement the Boehringer website rollout?',keywords:'rebrand brand ux colleagues content assets rollout website implementation',topics:['rebrand'],aspect:'process'},
  {id:'rebrand-newsletter',text:'How did Isaac build the Boehringer employee newsletter?',keywords:'company internal employee communications volunteering newsletter',topics:['rebrand'],aspect:'process'},
  {id:'openai',text:'What did Isaac contribute to OpenAI product testing?',keywords:'chatgpt lab feedback technology ai product',topics:['openai'],aspect:'role'},
  {id:'openai-lessons',text:'What did Isaac learn from testing ChatGPT?',keywords:'openai lessons learned reflection takeaways',topics:['openai'],aspect:'lessons'},
  {id:'study-mode',text:'What feedback did Isaac give on Study Mode?',keywords:'openai chatgpt study mode socratic student',topics:['openai'],aspect:'process'},
  {id:'pulse',text:'What feedback did Isaac give on Pulse?',keywords:'openai chatgpt pulse proactive personalization',topics:['openai'],aspect:'process'},
  {id:'atlas',text:'What feedback did Isaac give on Atlas?',keywords:'openai chatgpt atlas browser browsing',topics:['openai'],aspect:'process'},
  {id:'group-chats',text:'What feedback did Isaac give on group chats?',keywords:'openai chatgpt group chats participation facilitator',topics:['openai'],aspect:'process'},
  {id:'100-chats',text:'What did Isaac contribute to the 100 Chats book?',keywords:'openai chatgpt workflows student book chats',topics:['openai'],aspect:'role'},
  {id:'back-to-school',text:'What did Isaac do for OpenAI’s Back to School campaign?',keywords:'openai chatgpt back to school student campaign campus launch education',topics:['openai'],aspect:'process'},
  {id:'work',text:'Explore all projects',keywords:'portfolio work overview projects built browse',topics:['work'],aspect:'overview'},
  {id:'compare',text:'Compare Isaac’s AI research methods with his teaching approach in Taiwan',keywords:'compare comparison methods public education government',topics:['policy','taiwan'],aspect:'comparison'},
  {id:'compare-comms',text:'Compare Isaac’s communications work in Congress and the Boehringer rebrand',keywords:'compare comparison communications strategy',topics:['congress','rebrand'],aspect:'comparison'},
  {id:'compare-research',text:'Compare Isaac’s methods in ChatGPT product testing and journalism interviews',keywords:'compare comparison methods research product testing',topics:['openai','journalism'],aspect:'comparison'},
  {id:'contact',text:'How can I contact Isaac?',keywords:'email connect collaborate reach linkedin',topics:['contact'],aspect:'overview'},
];
const byId=new Map(experiencePrompts.map(item=>[item.id,item]));
export const startingExperiencePrompts=['policy','taiwan','congress','career'].map(id=>byId.get(id)!);
const normalize=(text:string)=>text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set('a an the i me my you your yours he his him they their it its isaac seiler tell show about what how did do does can could would is are was were in on at of to for through please with and from this that actually'.split(' '));
/** One insertion/deletion/substitution or adjacent transposition, bounded to meaningful words. */
function near(a:string,b:string):boolean {
  if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1)return false;
  if(a.length===b.length){const different=[...a].flatMap((letter,index)=>letter===b[index]?[]:[index]);return different.length<=1||(different.length===2&&different[1]===different[0]+1&&a[different[0]]===b[different[1]]&&a[different[1]]===b[different[0]]);}
  const [short,long]=a.length<b.length?[a,b]:[b,a];let i=0,j=0;
  while(i<short.length&&j<long.length){if(short[i]===long[j]){i++;j++;}else if(j===i)j++;else return false;}
  return true;
}
const topicWords:Record<Topic,string[]>={
  career:['career','experience','background','resume','skills','strengths','leadership','summation'],
  taiwan:['taiwan','fulbright','educators','teachers','teaching','classroom','literacy'],
  congress:['congress','congressional','scholten','press','bipartisan'],policy:['policy','government','governments','benchmark','index','states','territories'],
  journalism:['journalism','journalists','thesis','australia','newsroom','interviews','qualitative','transcripts','bargaining'],rebrand:['boehringer','rebrand','branding','newsletter','volunteering','ux'],
  openai:['openai','chatgpt','pulse','atlas','socratic'],contact:['contact','email','linkedin'],work:['portfolio','projects'],
};
const projectTopics:Record<string,Topic>={
  'artificial-intelligence-in-state-government-index':'policy','fulbright-focus-group-sponsored-by-openai':'taiwan',
  'congressional-office-setup-100-day-report':'congress','senior-thesis-local-journalism':'journalism',
  'boehringer-cares-foundation-rebrand-strategy-shift':'rebrand','openai-product-testing-and-feedback':'openai',
};
const compiled=experiencePrompts.map(item=>({item,title:normalize(item.text).split(' '),aliases:normalize(item.keywords).split(' ')}));
function queryAspect(query:string):Aspect|undefined {
  if(/\bcompar|\bversus\b|\bvs\b/.test(query))return 'comparison';
  if(/\bpublic service\b/.test(query))return 'service';
  if(/\bleader|\bmanage|\bled\b/.test(query))return 'leadership';
  if(/\bstrength|\bskills?|\bgood at|\bbest at|\bbring to (?:a|the) team|\bdo well|\bhir/.test(query))return 'strengths';
  if(/\bmeasur|\bevaluat|\bsuccess|\bassess/.test(query))return 'measurement';
  if(/\btrade.?off|\bchallenge|\blimitation|\bcompromise|\bdecision/.test(query))return 'tradeoffs';
  if(/\blearn|\blesson|\breflection|\btakeaway/.test(query))return 'lessons';
  if(/\boutcome|\bresult|\bimpact|\baccomplish|\bdiscover|\bfinding/.test(query))return 'outcomes';
  if(/\bprocess|\bapproach|\bmethod|\bdesign|\bshape/.test(query))return 'process';
  return undefined;
}
export function suggestExperiencePrompts(query:string,limit=4,context?:SuggestionContext):ExperiencePrompt[] {
  const count=Math.max(0,Math.min(4,Math.floor(limit)||0));if(!count)return [];
  const normalized=normalize(query.slice(0,500));
  if(/\b(?:photos?|photography|albums?|gallery|pictures?)\b/.test(normalized))return [];
  const continuation=Boolean(context)&&/^(?:what else|what next|what s next|tell me more|show me more|go deeper|more|next)(?: about (?:this|it|that))?$/.test(normalized);
  const tokens=continuation?[]:[...new Set(normalized.split(' ').filter(token=>token&&!stop.has(token)))].slice(0,24);
  const aspect=queryAspect(normalized);
  const specificProduct=/\b(?:pulse|atlas|study mode|group chats|100 chats)\b/.test(normalized);
  const subjectTokens=[...tokens,...tokens.slice(0,-1).map((token,index)=>token+tokens[index+1])];
  let topics=(Object.keys(topicWords) as Topic[]).filter(topic=>subjectTokens.some(token=>topicWords[topic].some(word=>token===word||(token.length>=3&&word.startsWith(token))||near(token,word))));
  // OpenAI supported the Taiwan program; that mention does not imply a second
  // request about product testing in the ChatGPT Lab.
  if(topics.includes('taiwan')&&topics.includes('openai')&&aspect!=='comparison'){
    if(specificProduct)topics=topics.filter(topic=>topic!=='taiwan');
    else if(!/product test|product feedback/.test(normalized))topics=topics.filter(topic=>topic!=='openai');
  }
  if(specificProduct&&!topics.includes('openai'))topics.push('openai');
  // Public service describes the career, rather than a particular government project.
  if(aspect==='service'&&(!topics.length||topics.every(topic=>topic==='policy'||topic==='career')))topics=['career'];
  if(!topics.length&&['strengths','leadership','service'].includes(aspect??''))topics=['career'];
  if(/100 days?|100 day report/.test(normalized)&&!topics.includes('congress'))topics.push('congress');
  const explicit=topics.length>0;
  if(!explicit&&context&&(aspect||!tokens.length))topics=[...new Set(context.projectIds.map(id=>projectTopics[id]).filter(Boolean))];
  if(!topics.length&&context?.kind==='benchmark'&&(aspect||!tokens.length))topics=['policy'];
  if(!topics.length&&context?.kind==='timeline'&&(aspect||!tokens.length))topics=['career'];
  if(aspect==='comparison'){
    if(topics.every(topic=>topic==='career'||topic==='work')&&context?.kind==='comparison')topics=[...new Set(context.projectIds.map(id=>projectTopics[id]).filter(Boolean))];
    const subjects=topics.filter(topic=>!['career','work','contact'].includes(topic));
    if(subjects.length<2)return subjects.length?experiencePrompts.filter(item=>item.topics.length===1&&item.topics.includes(subjects[0])&&item.aspect!=='comparison').slice(0,count):startingExperiencePrompts.slice(0,count);
  }
  if(!tokens.length&&!topics.length)return startingExperiencePrompts.slice(0,count);
  const answered=new Set((context?.visitedQuestions??[]).map(normalize));
  if(context?.question)answered.add(normalize(context.question));
  const alreadyAnswered=(item:ExperiencePrompt)=>{
    if(answered.has(normalize(item.text)))return true;
    if(context?.answerId&&item.topics.includes('career')&&careerAnswerFor(item.text)===context.answerId)return true;
    if(context?.projectIds.includes('fulbright-focus-group-sponsored-by-openai')&&context.section===4&&item.id==='taiwan-lessons')return true;
    if(context?.projectIds.includes('openai-product-testing-and-feedback')){const sectionPrompts:Record<number,string>={1:'100-chats',2:'study-mode',4:'pulse',5:'atlas',6:'group-chats',7:'openai-lessons'};if(item.id===sectionPrompts[context.section??-1])return true;}
    return false;
  };
  if(!tokens.length&&topics.length){
    const next=compiled.filter(({item})=>!alreadyAnswered(item)).filter(({item})=>item.topics.length===1&&item.topics.some(topic=>topics.includes(topic))&&item.aspect!==context?.focus);
    return next.sort((a,b)=>Number(b.item.aspect==='lessons')-Number(a.item.aspect==='lessons')).slice(0,count).map(row=>row.item);
  }
  const ranked=compiled.flatMap(({item,title,aliases},index)=>{
    // A broad subject query is a chance to explore further. An explicit aspect or
    // full question still lets a visitor deliberately revisit an earlier answer.
    if(alreadyAnswered(item)&&!aspect&&!specificProduct&&normalized!==normalize(item.text))return [];
    const overlap=item.topics.filter(topic=>topics.includes(topic)).length;
    if(topics.length&&!overlap)return [];
    if(item.aspect==='comparison'&&aspect!=='comparison')return [];
    if(aspect==='comparison'&&item.aspect!=='comparison')return [];
    if(aspect==='comparison'&&topics.length>=2&&overlap<topics.length)return [];
    let matched=0;
    let score=tokens.reduce((sum,token)=>{const value=title.includes(token)?8:title.some(word=>token.length>=2&&word.startsWith(token))?6:aliases.includes(token)?5:aliases.some(word=>token.length>=3&&word.startsWith(token))?4:[...title,...aliases].some(word=>near(token,word))?2:0;if(value)matched++;return sum+value;},0);
    if(!matched&&!overlap)return [];
    score+=overlap*20+(matched===tokens.length?12:0)+(aspect===item.aspect?35:0);
    if(item.id==='openai'&&/feedback|product|testing/.test(normalized)&&!/study|pulse|atlas|group|100 chats/.test(normalized))score+=15;
    if(item.text===query.trim())score-=5; // Favor a useful next question over merely echoing the committed prompt.
    if(context?.focus===item.aspect&&!aspect)score-=8;
    return [{item,index,score}];
  }).sort((a,b)=>b.score-a.score||a.index-b.index);
  return ranked.slice(0,count).map(row=>row.item);
}
