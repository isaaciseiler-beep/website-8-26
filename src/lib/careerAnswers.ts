/** Reviewed interpretations of published experience, never model-written claims. */
export const careerAnswerIds = ['connections','strengths','leadership','service','identity','current','chronology'] as const;
export type CareerAnswerId = typeof careerAnswerIds[number];
export function careerAnswerFor(question:string):CareerAnswerId|undefined {
  if (/timeline|chronolog|career (?:path|journey)/i.test(question)) return 'chronology';
  if (/what connects|common thread|through.?line|ties .*together/i.test(question)) return 'connections';
  if (/strength|skills|best at|good at|do(?:es)? well|hire|hiring|bring to (?:a|the) team/i.test(question)) return 'strengths';
  if (/leadership|led|leading|manage/i.test(question)) return 'leadership';
  if (/public service/i.test(question)) return 'service';
  if (/current|working on|\bnow\b|summation/i.test(question)) return 'current';
  if (/who (?:is|are)|biography|tell me about (?:isaac|yourself)/i.test(question)) return 'identity';
}
export const careerAnswers:Record<CareerAnswerId,{title:string;answer:string;roles:readonly string[]}> = {
  connections:{title:'What connects the work',answer:'Isaac’s work repeatedly turns complicated systems into something people can use: a benchmark for comparing government AI adoption, a program built around educators’ questions, and communications that made a new congressional office’s work understandable.',roles:['csg-ai-index','fulbright-taiwan','us-house']},
  strengths:{title:'Strengths across the work',answer:'The clearest strengths in Isaac’s published work are research synthesis, explaining complex ideas, and carrying an idea into delivery. The government benchmark shows structured research; the Taiwan program shows adaptation to people’s needs; the congressional work shows communications and execution.',roles:['csg-ai-index','fulbright-taiwan','us-house']},
  leadership:{title:'Leadership in practice',answer:'Isaac’s leadership shows up in program ownership, operational setup, and team coordination. He proposed and led six educator sessions in Taiwan, helped establish a new congressional office’s communications function, and managed a teaching team of 12.',roles:['fulbright-taiwan','us-house','washu-head-ta']},
  service:{title:'Public service',answer:'Isaac’s public-service work connects policy with the people affected by it: making state AI adoption easier to compare, communicating a congressional office’s work, and helping educators in Taiwan work through practical questions about AI.',roles:['us-house','csg-ai-index','fulbright-taiwan']},
  identity:{title:'Isaac Seiler',answer:'Isaac is a tech generalist whose work spans AI, public policy, education, research, and communications. His experience includes a government AI benchmark, an educator program in Taiwan, congressional communications, and product feedback through the ChatGPT Lab. He now leads marketing and communications at Summation.',roles:['summation-ai','fulbright-taiwan','csg-ai-index','openai-chatgpt-lab']},
  current:{title:'At Summation',answer:'Isaac leads marketing and communications at Summation, a company that connects AI to live business data. His role brings together strategy, writing, and explaining complex technology so enterprise teams can understand and act on it.',roles:['summation-ai']},
  chronology:{title:'Career path',answer:'Selected roles in order of their first start date. Some appointments overlap; these are the dates published in Isaac’s experience record.',roles:['us-house','washu-head-ta','openai-chatgpt-lab','csg-ai-index','fulbright-taiwan','summation-ai']},
};
