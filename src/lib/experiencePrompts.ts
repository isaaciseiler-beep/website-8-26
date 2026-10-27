/** Curated entry points into published portfolio content, never generated claims. */
export const experiencePrompts = [
  {id:'career',text:'Walk me through Isaac’s experience',keywords:'background biography resume cv journey qualifications skills hiring who about'},
  {id:'taiwan',text:'What did Isaac build in Taiwan?',keywords:'fulbright education teachers teaching workshop classroom learning asia'},
  {id:'congress',text:'What was Isaac’s role in Congress?',keywords:'congress government public service politics washington scholten communications leadership'},
  {id:'policy',text:'How did Isaac research AI in government?',keywords:'benchmark index research artificial intelligence mapping analysis data methodology'},
  {id:'roles',text:'Explore Isaac’s roles and responsibilities',keywords:'experience work jobs employment skills leadership team career summation marketing communications current now'},
  {id:'journalism',text:'What did Isaac’s journalism research explore?',keywords:'australia thesis reporting media news university research ai'},
  {id:'taiwan-outcomes',text:'What were the outcomes of Isaac’s Taiwan project?',keywords:'taiwan fulbright impact results achievements education teaching literacy'},
  {id:'rebrand',text:'What was Isaac’s role in the Boehringer rebrand?',keywords:'brand branding marketing communications strategy foundation healthcare cares'},
  {id:'openai',text:'What did Isaac contribute to OpenAI product testing?',keywords:'chatgpt lab feedback testing technology ai product'},
  {id:'work',text:'Explore all projects',keywords:'portfolio work overview projects built browse'},
  {id:'compare',text:'Compare Isaac’s AI policy and Taiwan projects',keywords:'compare comparison connections public education government'},
  {id:'contact',text:'How can I contact Isaac?',keywords:'email connect hire hiring collaborate reach meeting'},
] as const;
export type ExperiencePrompt = typeof experiencePrompts[number];
const normalize=(text:string)=>text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set('a an the i me my you your yours isaac seiler tell show about what how did do does can could would is are was were in on of to for through please'.split(' '));
function near(a:string,b:string):boolean {
  if(a.length<4||Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,edits=0;
  while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
  return edits+(a.length-i)+(b.length-j)<=1;
}
export function suggestExperiencePrompts(query:string,limit=4):ExperiencePrompt[] {
  const normalized=normalize(query);
  const tokens=normalized.split(' ').filter(t=>t&&!stop.has(t));
  if(!tokens.length)return experiencePrompts.slice(0,limit);
  const ranked=experiencePrompts.map((item,index)=>{
    const title=normalize(item.text).split(' '), aliases=item.keywords.split(' ');
    let matched=0;
    const score=tokens.reduce((total,token)=>{
      const value=title.includes(token)?8:title.some(w=>w.startsWith(token))?6:aliases.includes(token)?5:aliases.some(w=>w.startsWith(token))?4:[...title,...aliases].some(w=>near(token,w))?2:0;
      if(value)matched++;return total+value;
    },0);
    return {item,index,score:score+(matched===tokens.length?10:0)};
  }).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
  return ranked.length?ranked.slice(0,limit).map(row=>row.item):experiencePrompts.slice(0,3);
}
