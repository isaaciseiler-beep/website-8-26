import { projectItems, hiddenProjectIds } from './siteContent.js';
import { experienceEntries } from './experience.js';
import { hasPublishedMaterial } from './portfolioRetrieval.js';

export const evidenceFocuses = ['overview', 'role', 'process', 'outcomes', 'evidence'] as const;
export type EvidenceFocus = typeof evidenceFocuses[number];

/** Editorial records, checked against the published case studies. Models select these; they do not write them. */
export const projectEvidence: Record<string, {
  title: string;
  role: string;
  contribution: string;
  process: string;
  practice: string;
  sectionLabels: string[];
  outcome: string;
  processSections: number[];
  outcomeSections: number[];
}> = {
  'artificial-intelligence-in-state-government-index': {
    title: 'AI in state government', role: 'Researcher & benchmark designer',
    contribution: 'Isaac built a public-information benchmark of AI adoption across U.S. states and territories, then paired the index with a policy roadmap.',
    outcome: 'A 15-criteria framework, state-by-state rankings, and recommendations grounded in the gaps the research exposed. The published benchmark is an August 2025 snapshot.',
    process: 'Isaac translated publicly verifiable signals into 15 criteria, combined preparedness with an efficiency adjustment, and used the gaps to shape a policy roadmap.',
    practice: 'Isaac looked for concrete adoption signals: employee guidance, training, sandboxes, pilots, governance structures, and transparency.',
    sectionLabels: ['Research context', 'Scoring framework'],
    processSections: [1], outcomeSections: [0, 1],
  },
  'fulbright-focus-group-sponsored-by-openai': {
    title: 'AI literacy in Taiwan', role: 'Program proposer, designer & facilitator',
    contribution: 'Isaac pitched and led a six-session AI literacy program for educators in Taiwan, with support from OpenAI and ChatGPT for Education.',
    outcome: 'Isaac turned what participants taught him into nine published use cases and an LLM fundamentals and alignment workshop for an international education conference.',
    process: 'Isaac proposed the Lab, designed six sessions around educators’ real work, and adapted later sessions to the questions and concerns participants raised.',
    practice: 'Participant questions changed what he emphasized in later sessions. The group spent less time on ChatGPT in the abstract and more time on when and how educators should use it.',
    sectionLabels: ['Proposing the Lab', 'Learning together', 'Nine published use cases', 'Conference workshop', 'Lessons learned'],
    processSections: [0, 1], outcomeSections: [2, 3, 4],
  },
  'congressional-office-setup-100-day-report': {
    title: 'Building a congressional office', role: 'Communications & office-launch contributor',
    contribution: 'Isaac helped build the communications function for a new congressional office: press outreach, workflows, events, official travel, and the 100 Day Report.',
    outcome: 'The work connected a new office with local and national audiences and made its first 100 days of service understandable. Constituent-service totals describe the whole office’s work.',
    process: 'Isaac built relationships across local, statewide, and national media, connected district stories to federal policy, and gathered and checked the office’s results for its 100 Day Report.',
    practice: 'For the child-labor story in West Michigan, Isaac developed the message, pitched reporters, prepared interviews, and connected the local reporting to proposed federal action.',
    sectionLabels: ['Launching the office', 'Building the press network', 'Child-labor coverage', 'Reaching different audiences', 'Bipartisan collaboration', 'The 100 Day Report', 'Public recognition'],
    processSections: [1, 2, 3, 4, 5], outcomeSections: [5, 6],
  },
  'senior-thesis-local-journalism': {
    title: 'AI, platforms & local journalism', role: 'Principal qualitative researcher',
    contribution: 'Isaac authored an honors thesis on AI, digital platforms, and local journalism, drawing on 17 in-depth interviews with Australian journalists and policy experts.',
    outcome: 'An original qualitative study of journalism as a public good, platform incentives, economic decline, and uncertainty around generative AI.',
    process: 'Isaac carried out the literature review, recruited interviewees, verified transcripts, coded the material, and synthesized themes across 17 interviews.',
    practice: 'The analysis compared print, digital, hybrid, nonprofit, and subscription models alongside policy options such as bargaining codes, subsidies, and training.',
    sectionLabels: ['Research design', 'Research themes & outputs'],
    processSections: [0, 1], outcomeSections: [1],
  },
  'boehringer-cares-foundation-rebrand-strategy-shift': {
    title: 'Bringing Boehringer Cares to life', role: 'Rebrand implementation & communications',
    contribution: 'Isaac helped carry the team’s approved rebrand into the foundation’s website, communications assets, company-wide newsletter, and volunteering communications.',
    outcome: 'During the 2025 rollout, annual employee volunteering increased by 25%; the newsletter reached an 80% open rate, alongside more than 25 communications assets.',
    process: 'Isaac organized the rollout content, worked with UX and brand colleagues on the public website, and extended the approved direction into employee newsletters and volunteering communications.',
    practice: 'Isaac applied the approved direction to updated web pages and more than 25 communications assets, then carried the same voice into the company-wide newsletter.',
    sectionLabels: ['The assignment', 'Website & rollout', 'Employee communications', 'Published results'],
    processSections: [1, 2], outcomeSections: [3],
  },
  'openai-product-testing-and-feedback': {
    title: 'Inside the ChatGPT Lab', role: 'Product tester & feedback contributor',
    contribution: 'In OpenAI’s first ChatGPT Lab cohort, Isaac tested products before release and brought a student and early-career perspective to product and go-to-market conversations.',
    outcome: 'Isaac’s contributions included real workflows for the 100 Chats book, product feedback, launch campaigns, and public stories about how students use ChatGPT.',
    process: 'Isaac tested early products in real workflows, documented where the experience broke down, and brought specific feedback into product discussions and launch storytelling.',
    practice: 'For Pulse, Isaac asked for clearer sources and preference controls. For Group Chats, Isaac pushed on when the assistant should speak and how people could control its participation.',
    sectionLabels: ['Joining the Lab', '100 Chats', 'Study Mode', 'Back to School', 'Pulse', 'Atlas', 'Group Chats', 'Lessons from the Lab'],
    processSections: [1, 2, 3, 4, 5, 6], outcomeSections: [1, 2, 3, 4, 5, 6, 7],
  },
};

export function evidenceFor(id: string) {
  const project = projectItems.find(item => item.id === id && !hiddenProjectIds.has(id));
  if (!project) return null;
  const authored = projectEvidence[id];
  return {
    project,
    title: authored?.title ?? project.title,
    role: authored?.role ?? 'Project contributor',
    contribution: authored?.contribution ?? project.summary,
    outcome: authored?.outcome ?? project.summary,
    process: authored?.process ?? project.summary,
    practice: authored?.practice ?? project.summary,
    sectionLabels: authored?.sectionLabels ?? [],
    processSections: authored?.processSections ?? [0],
    outcomeSections: authored?.outcomeSections ?? [Math.max(0, project.sections.length - 1)],
  };
}

export function evidenceSections(id: string, focus: EvidenceFocus) {
  const record = evidenceFor(id);
  if (!record) return [];
  const indices = focus === 'process' ? record.processSections : focus === 'outcomes' ? record.outcomeSections : record.project.sections.map((_, index) => index);
  return indices.filter(index => { const section = record.project.sections[index]; return section && hasPublishedMaterial(section); }).map(index => ({ ...record.project.sections[index], label: record.sectionLabels[index] ?? record.project.sections[index].heading, index, id: `${id}:section:${index}` }));
}

/** Shared public evidence catalog for both the interface planner and the legacy answer service. */
export const portfolioCatalog = projectItems.filter(item => !hiddenProjectIds.has(item.id)).map(project => {
  const evidence = evidenceFor(project.id)!;
  return {
    id: project.id, title: project.title, summary: project.summary,
    role: evidence.role, contribution: evidence.contribution, outcome: evidence.outcome,
    sections: project.sections.map((section, index) => ({ id: `${project.id}:section:${index}`, index, heading: section.heading })),
    processSections: evidence.processSections, outcomeSections: evidence.outcomeSections,
  };
});
export const roleCatalog = experienceEntries.map(({ id, organization, role, period, paragraphs, focus }) => ({ id, organization, role, period, paragraphs, focus }));

/** Editorial comparison of published responsibilities and methods, independent of display order. */
export function comparisonInsight(ids: string[], focus: EvidenceFocus): string {
  const pair = (a: string, b: string) => ids.includes(a) && ids.includes(b);
  const insights = pair('artificial-intelligence-in-state-government-index', 'fulbright-focus-group-sponsored-by-openai') ? {
    role: 'The government project centers on research and benchmark design; the Taiwan project centers on proposing, designing and facilitating a program. Both make AI adoption easier to understand, at institutional and classroom scales.',
    process: 'The government index compares publicly verifiable adoption signals; the Taiwan Lab adapts sessions to educators’ questions. Both turn questions about AI into a practical framework, using different kinds of evidence.',
    outcomes: 'The government work makes adoption comparable across institutions. The Taiwan work shares what educators learned through practice. The outputs support different audiences and scales of AI adoption.',
  } : pair('fulbright-focus-group-sponsored-by-openai', 'congressional-office-setup-100-day-report') ? {
    role: 'In Taiwan, Isaac built a program around educators’ questions. In Congress, he helped build a new office’s communications function. Both required turning an open-ended assignment into something people could use.',
    process: 'The Taiwan program evolved through participant questions; congressional communications connected local stories with reporters and federal policy. Both started with listening to the audience, then adapting the work.',
    outcomes: 'The Taiwan work makes educators’ experience available beyond the original group. The congressional work helps constituents and reporters understand what a new office is doing. Both translate local work into a public account.',
  } : pair('congressional-office-setup-100-day-report', 'boehringer-cares-foundation-rebrand-strategy-shift') ? {
    role: 'In Congress, Isaac helped establish a new office’s communications function. At Boehringer, he helped implement an approved rebrand across existing channels. Both involved communications operations, with different starting points and audiences.',
    process: 'The congressional work connected district stories to reporters and federal policy; the Boehringer rollout coordinated website content, brand colleagues and employee communications. Both required consistent messaging across several channels.',
    outcomes: 'The congressional work made a new office visible to the public; the Boehringer work carried an approved direction across public and employee communications. Office service totals and company participation figures describe broader team outcomes.',
  } : pair('openai-product-testing-and-feedback', 'senior-thesis-local-journalism') ? {
    role: 'In the ChatGPT Lab, Isaac contributed product feedback from real workflows. In the journalism thesis, he led an independent qualitative study. Both examine technology through people’s experience, with different levels of research ownership.',
    process: 'Product testing used early builds to identify problems and discuss changes with product teams. The thesis used 17 interviews, verified transcripts and thematic coding. One informed product conversations; the other organized evidence for an academic study.',
    outcomes: 'The Lab contributions inform product conversations and public storytelling. The thesis organizes interview evidence into an independent qualitative study. Contribution is documented differently in a product cohort and an academic research project.',
  } : null;
  if (insights) return insights[focus === 'process' || focus === 'outcomes' ? focus : 'role'];
  return '';
}


/** Choose the paragraphs carrying the answer; keep the entire passage available on expansion. */
export function sectionPreview(id:string,section:number,focus?:EvidenceFocus,angle?:string):number[] {
  if(id==='openai-product-testing-and-feedback'&&angle==='reflection'){
    if(section===2)return [0];
    if(section===3)return [2];
  }
  if(id==='openai-product-testing-and-feedback'&&focus==='outcomes'){
    const outcomes:Record<number,number[]>={1:[1],2:[2],3:[1],4:[2],5:[2],6:[2],7:[0,1]};
    if(outcomes[section])return outcomes[section];
  }
  const selected:Record<string,Record<number,number[]>>={
    'fulbright-focus-group-sponsored-by-openai': {1:[1,3],4:[1,2]},
    'artificial-intelligence-in-state-government-index': {0:[2]},
    'openai-product-testing-and-feedback': {2:[1,2],4:[1,2],5:[1,0],6:[1,2]},
    'boehringer-cares-foundation-rebrand-strategy-shift': {3:[1]},
  };
  return selected[id]?.[section]??[0,1];
}

/** Reviewed answers to evaluation questions, scoped to what the case study establishes. */
export function projectAngleAnswer(id:string,angle?:string,section?:number):string|undefined {
  if(!angle)return undefined;
  if(id==='openai-product-testing-and-feedback'&&angle==='counterfactual'){
    const feedback:Record<number,string>={
      2:'In Study Mode testing, Isaac wanted Socratic questions to help the user reach a useful conclusion while still supplying their own substance.',
      4:'In Pulse testing, Isaac asked for a more visible home, compact cards, clearer sources, better preference controls, and fewer canned acknowledgements.',
      5:'In Atlas testing, Isaac wanted browsing and chatting to work together, more control over the model, and useful recommendations that did not feel like advertising.',
      6:'In Group Chats testing, Isaac wanted people to tune how actively the assistant participated, improving its contribution while leaving people in control.',
    };
    if(feedback[section??-1])return feedback[section??-1];
  }
  if(angle==='counterfactual'){
    const context:Record<string,string>={
      'fulbright-focus-group-sponsored-by-openai':'His documented reflections emphasize learning in community and building adoption around educators’ own needs.',
      'openai-product-testing-and-feedback':'His documented lessons emphasize translating real user needs, making sources visible, and giving the assistant a clear role.',
      'artificial-intelligence-in-state-government-index':'The documented approach uses public adoption signals to build a comparison framework and policy roadmap.',
      'congressional-office-setup-100-day-report':'The documented approach connects district stories with a press network spanning local, statewide, and national audiences.',
      'boehringer-cares-foundation-rebrand-strategy-shift':'The documented approach carries an approved brand direction across the website and ongoing employee communications.',
      'senior-thesis-local-journalism':'The documented approach combines 17 interviews, verified transcripts, qualitative coding, and thematic analysis.',
    };
    return 'The published account does not specify what Isaac would do differently.'+(context[id]?' '+context[id]:'');
  }
  if(id==='openai-product-testing-and-feedback'&&angle==='tradeoffs'){
    const products:Record<number,string>={
      2:'Study Mode exposed a tension between getting a correct answer and doing the learning. Isaac valued questions that made him supply the substance, and pushed for the conversation to help the learner reach a useful conclusion.',
      4:'For Pulse, useful personalization also needed trust and control. Isaac asked for clearer sources, better preference controls, compact cards, and a more visible home for the experience.',
      5:'For Atlas, Isaac focused on the seam between browsing and chatting. He wanted the two experiences to work together, more control over the model, and recommendations that helped with the decision in front of him.',
      6:'For Group Chats, the question was how much the assistant should participate. Isaac wanted people to tune its activity so it could contribute usefully while leaving people in control of the conversation.',
    };
    return products[section??-1]??'Isaac’s testing surfaced different design tensions: correct answers versus learning in Study Mode, personalization with visible sources and user control in Pulse, and useful participation without taking over in Group Chats.';
  }
  const answers:Record<string,Partial<Record<string,string>>>={
    'fulbright-focus-group-sponsored-by-openai':{
      measurement:'The published account documents six sessions, nine use cases and a subsequent conference workshop. It describes participants finding uses for AI in their work, but does not report pre/post assessment scores or a measured causal improvement.',
      tradeoffs:'Isaac adapted the sessions to educators’ questions rather than delivering a fixed lecture series. The central judgment was when AI helped with real classroom work and when it created more problems than it solved.',
      leadership:'Isaac proposed the program to OpenAI, designed and led six sessions, adapted them to participant questions, and turned the learning into public use cases and a conference workshop.',
    },
    'artificial-intelligence-in-state-government-index':{
      measurement:'The benchmark measures publicly documented adoption through 15 criteria and a composite score with an efficiency adjustment. It is an August 2025 snapshot; those scores do not establish later policy impact or reveal every government’s internal activity.',
      tradeoffs:'Isaac chose publicly verifiable adoption signals as the basis for comparing governments. That makes the framework inspectable, while limiting it to what governments have made public. The account does not compare rejected scoring models.',
      reflection:'The case study does not include a personal retrospective. It documents an early, uneven adoption landscape and a roadmap tied to the policy, training, pilot, and transparency gaps the research exposed.',
      leadership:'Isaac owned the benchmark design, state-by-state analysis, and policy roadmap. The published account describes research ownership; it does not describe managing a team.',
    },
    'congressional-office-setup-100-day-report':{
      measurement:'Isaac gathered and checked the office’s service results for the 100 Day Report, then wrote, designed, and coordinated its release. The constituent-service totals belong to the full office. The account also documents press coverage and audience reach, without isolating Isaac’s causal impact.',
      tradeoffs:'The documented balancing act was reaching constituents while building a national press presence. Isaac developed local, statewide, and national relationships together, giving district stories a route into broader policy conversations.',
      reflection:'The account describes Isaac learning what individual reporters covered, what made a useful pitch, and how quickly they needed answers. It does not present a separate personal retrospective.',
      leadership:'Isaac helped establish the new office’s communications operation, built its press network, and led the 100 Day Report from information gathering through publication. Office-wide service results reflect the full team’s work. The account does not establish that he authored legislation.',
    },
    'boehringer-cares-foundation-rebrand-strategy-shift':{
      measurement:'The case study reports employee volunteering participation, newsletter open rate, and communications assets delivered during the rollout. These are published project results; the account does not isolate how much change was caused by Isaac alone.',
      tradeoffs:'The documented challenge was keeping a public website, employee newsletter, and volunteering communications consistent while implementing a direction set by the broader team. The account does not compare rejected approaches.',
      reflection:'The case study describes carrying the approved rebrand beyond launch into continuing employee communications. It does not include a personal reflection about what Isaac learned.',
      leadership:'Isaac’s ownership was implementation: organizing rollout content, coordinating with UX and brand colleagues, building the newsletter, and updating volunteering communications. The broader team established the original rebrand direction.',
    },
    'senior-thesis-local-journalism':{
      measurement:'The published record documents 17 interviews, verified transcripts, qualitative coding, and thematic analysis. It describes a qualitative research process, without claiming a representative survey or measured causal effect on journalism.',
      tradeoffs:'The study compared print, digital, hybrid, nonprofit, and subscription models alongside policy options such as bargaining codes and subsidies. The published project summary does not report which alternatives Isaac ultimately preferred.',
      leadership:'Isaac designed and executed the thesis end to end: literature review, interview recruitment, transcript verification, qualitative coding, and thematic analysis across 17 interviews.',
    },
    'openai-product-testing-and-feedback':{
      measurement:'The published evidence consists of real workflows, product feedback, the 100 Chats book, and public launch stories. The account does not report controlled product evaluations or establish which shipped features resulted from Isaac’s feedback.',
      leadership:'Isaac contributed testing, structured feedback, campaign input, and public student stories through the ChatGPT Lab cohort. The account does not establish responsibility for leading a product team or deciding what shipped.',
    },
  };
  return answers[id]?.[angle];
}
