import { projectItems, hiddenProjectIds } from './siteContent.js';
import { experienceEntries } from './experience.js';

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
    contribution: 'I built a public-information benchmark of AI adoption across U.S. states and territories, then paired the index with a policy roadmap.',
    outcome: 'A 15-criteria framework, state-by-state rankings, and recommendations grounded in the gaps the research exposed. The published benchmark is an August 2025 snapshot.',
    process: 'I translated publicly verifiable signals into 15 criteria, combined preparedness with an efficiency adjustment, and used the gaps to shape a policy roadmap.',
    practice: 'I looked for concrete adoption signals: employee guidance, training, sandboxes, pilots, governance structures, and transparency.',
    sectionLabels: ['Research context', 'Scoring framework'],
    processSections: [1], outcomeSections: [0, 1],
  },
  'fulbright-focus-group-sponsored-by-openai': {
    title: 'AI literacy in Taiwan', role: 'Program proposer, designer & facilitator',
    contribution: 'I pitched and led a six-session AI literacy program for educators in Taiwan, with support from OpenAI and ChatGPT for Education.',
    outcome: 'I turned what participants taught me into nine published use cases and an LLM fundamentals and alignment workshop for an international education conference.',
    process: 'I proposed the Lab, designed six sessions around educators’ real work, and adapted later sessions to the questions and concerns participants raised.',
    practice: 'Participant questions changed what I emphasized in later sessions. We spent less time on ChatGPT in the abstract and more time on when and how educators should use it.',
    sectionLabels: ['Proposing the Lab', 'Learning together', 'Nine published use cases', 'Conference workshop', 'Lessons learned'],
    processSections: [0, 1], outcomeSections: [2, 3, 4],
  },
  'congressional-office-setup-100-day-report': {
    title: 'Building a congressional office', role: 'Communications & office-launch contributor',
    contribution: 'I helped build the communications function for a new congressional office: press outreach, workflows, events, official travel, and the 100 Day Report.',
    outcome: 'The work connected a new office with local and national audiences and made its first 100 days of service understandable. Constituent-service totals describe the whole office’s work.',
    process: 'I built relationships across local, statewide, and national media, connected district stories to federal policy, and gathered and checked the office’s results for its 100 Day Report.',
    practice: 'For the child-labor story in West Michigan, I developed the message, pitched reporters, prepared interviews, and connected the local reporting to proposed federal action.',
    sectionLabels: ['Launching the office', 'Building the press network', 'Child-labor coverage', 'Reaching different audiences', 'Bipartisan collaboration', 'The 100 Day Report', 'Public recognition'],
    processSections: [1, 2, 3, 4, 5], outcomeSections: [5, 6],
  },
  'senior-thesis-local-journalism': {
    title: 'AI, platforms & local journalism', role: 'Principal qualitative researcher',
    contribution: 'I authored an honors thesis on AI, digital platforms, and local journalism, drawing on 17 in-depth interviews with Australian journalists and policy experts.',
    outcome: 'An original qualitative study of journalism as a public good, platform incentives, economic decline, and uncertainty around generative AI.',
    process: 'I carried out the literature review, recruited interviewees, verified transcripts, coded the material, and synthesized themes across 17 interviews.',
    practice: 'The analysis compared print, digital, hybrid, nonprofit, and subscription models alongside policy options such as bargaining codes, subsidies, and training.',
    sectionLabels: ['Research design', 'Research themes & outputs'],
    processSections: [0, 1], outcomeSections: [1],
  },
  'boehringer-cares-foundation-rebrand-strategy-shift': {
    title: 'Bringing Boehringer Cares to life', role: 'Rebrand implementation & communications',
    contribution: 'I helped carry the team’s approved rebrand into the foundation’s website, communications assets, company-wide newsletter, and volunteering communications.',
    outcome: 'During the 2025 rollout, annual employee volunteering increased by 25%; the newsletter reached an 80% open rate, alongside more than 25 communications assets.',
    process: 'I organized the rollout content, worked with UX and brand colleagues on the public website, and extended the approved direction into employee newsletters and volunteering communications.',
    practice: 'I applied the approved direction to updated web pages and more than 25 communications assets, then carried the same voice into the company-wide newsletter.',
    sectionLabels: ['The assignment', 'Website & rollout', 'Employee communications', 'Published results'],
    processSections: [1, 2], outcomeSections: [3],
  },
  'openai-product-testing-and-feedback': {
    title: 'Inside the ChatGPT Lab', role: 'Product tester & feedback contributor',
    contribution: 'In OpenAI’s first ChatGPT Lab cohort, I tested products before release and brought a student and early-career perspective to product and go-to-market conversations.',
    outcome: 'My contributions included real workflows for the 100 Chats book, product feedback, launch campaigns, and public stories about how students use ChatGPT.',
    process: 'I tested early products in real workflows, documented where the experience broke down, and brought specific feedback into product discussions and launch storytelling.',
    practice: 'For Pulse, I asked for clearer sources and preference controls. For Group Chats, I pushed on when the assistant should speak and how people could control its participation.',
    sectionLabels: ['Joining the Lab', '100 Chats', 'Study Mode', 'Back to School', 'Pulse', 'Atlas', 'Group Chats', 'Lessons from the Lab'],
    processSections: [1, 2, 3, 4, 5, 6], outcomeSections: [1, 7],
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
  return indices.filter(index => { const section = record.project.sections[index]; return section && Boolean(section.paragraphs?.length || section.bullets?.length); }).map(index => ({ ...record.project.sections[index], label: record.sectionLabels[index] ?? record.project.sections[index].heading, index, id: `${id}:section:${index}` }));
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
    outcomes: 'The government work produced a dated benchmark and policy roadmap; the Taiwan work produced nine use cases and a conference workshop. One supports comparison across institutions, while the other shares what educators learned through practice.',
  } : pair('congressional-office-setup-100-day-report', 'boehringer-cares-foundation-rebrand-strategy-shift') ? {
    role: 'In Congress, Isaac helped establish a new office’s communications function. At Boehringer, he helped implement an approved rebrand across existing channels. Both involved communications operations, with different starting points and audiences.',
    process: 'The congressional work connected district stories to reporters and federal policy; the Boehringer rollout coordinated website content, brand colleagues and employee communications. Both required consistent messaging across several channels.',
    outcomes: 'The congressional work made a new office’s first months of service visible through press outreach and the 100 Day Report. The Boehringer rollout delivered web and communications assets, an employee newsletter and volunteering communications. Office service totals and company participation figures describe broader team outcomes.',
  } : pair('openai-product-testing-and-feedback', 'senior-thesis-local-journalism') ? {
    role: 'In the ChatGPT Lab, Isaac contributed product feedback from real workflows. In the journalism thesis, he led an independent qualitative study. Both examine technology through people’s experience, with different levels of research ownership.',
    process: 'Product testing used early builds to identify problems and discuss changes with product teams. The thesis used 17 interviews, verified transcripts and thematic coding. One informed product conversations; the other organized evidence for an academic study.',
    outcomes: 'The Lab contributions fed into product feedback, the 100 Chats book and public launch stories. The thesis produced an original interview dataset and qualitative analysis. These are different kinds of published output, rather than comparable impact scores.',
  } : null;
  if (insights) return insights[focus === 'process' || focus === 'outcomes' ? focus : 'role'];
  const records = ids.map(evidenceFor);
  return records[0] && records[1] ? `${records[0].title} centers on ${records[0].role.toLowerCase()}, while ${records[1].title} centers on ${records[1].role.toLowerCase()}. Explore the responsibilities, methods and published outputs below.` : '';
}


/** Choose the paragraphs carrying the answer; keep the entire passage available on expansion. */
export function sectionPreview(id:string,section:number):number[] {
  const selected:Record<string,Record<number,number[]>>={
    'fulbright-focus-group-sponsored-by-openai': {1:[1,3],4:[1,2]},
    'openai-product-testing-and-feedback': {2:[1,2],4:[1,2],5:[1,0],6:[1,2]},
  };
  return selected[id]?.[section]??[0,1];
}

export function projectAngleAnswer(id:string,angle?:string):string|undefined {
  if(id!=='fulbright-focus-group-sponsored-by-openai')return undefined;
  if(angle==='measurement')return 'The published account documents six sessions, nine use cases and a subsequent conference workshop. It describes participants finding uses for AI in their work, but does not report pre/post assessment scores or a measured causal improvement.';
  if(angle==='tradeoffs')return 'Isaac adapted the sessions to educators’ questions rather than delivering a fixed lecture series. The central judgment was when AI helped with real classroom work and when it created more problems than it solved.';
  if(angle==='leadership')return 'Isaac proposed the program to OpenAI, designed and led six sessions, adapted them to participant questions, and turned the learning into public use cases and a conference workshop.';
}
