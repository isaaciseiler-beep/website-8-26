import { projectItems, hiddenProjectIds } from './siteContent.js';
import { experienceEntries } from './experience.js';

export const evidenceFocuses = ['overview', 'role', 'process', 'outcomes', 'evidence'] as const;
export type EvidenceFocus = typeof evidenceFocuses[number];

/** Editorial records, checked against the published case studies. Models select these; they do not write them. */
export const projectEvidence: Record<string, {
  title: string;
  role: string;
  contribution: string;
  outcome: string;
  processSections: number[];
  outcomeSections: number[];
}> = {
  'artificial-intelligence-in-state-government-index': {
    title: 'AI in state government', role: 'Researcher & benchmark designer',
    contribution: 'I built a public-information benchmark of AI adoption across U.S. states and territories, then paired the index with a policy roadmap.',
    outcome: 'A 15-criteria framework, state-by-state rankings, and recommendations grounded in the gaps the research exposed. The published benchmark is an August 2025 snapshot.',
    processSections: [1], outcomeSections: [0, 1],
  },
  'fulbright-focus-group-sponsored-by-openai': {
    title: 'AI literacy in Taiwan', role: 'Program proposer, designer & facilitator',
    contribution: 'I pitched and led a six-session AI literacy program for educators in Taiwan, with support from OpenAI and ChatGPT for Education.',
    outcome: 'I turned what participants taught me into nine published use cases and an LLM fundamentals and alignment workshop for an international education conference.',
    processSections: [0, 1], outcomeSections: [2, 3, 4],
  },
  'congressional-office-setup-100-day-report': {
    title: 'Building a congressional office', role: 'Communications & office-launch contributor',
    contribution: 'I helped build the communications function for a new congressional office: press outreach, workflows, events, official travel, and the 100 Day Report.',
    outcome: 'The work connected a new office with local and national audiences and made its first 100 days of service understandable. Constituent-service totals describe the whole office’s work.',
    processSections: [1, 2, 3, 4, 5], outcomeSections: [6],
  },
  'senior-thesis-local-journalism': {
    title: 'AI, platforms & local journalism', role: 'Principal qualitative researcher',
    contribution: 'I authored an honors thesis on AI, digital platforms, and local journalism, drawing on 17 in-depth interviews with Australian journalists and policy experts.',
    outcome: 'An original qualitative study of journalism as a public good, platform incentives, economic decline, and uncertainty around generative AI.',
    processSections: [0, 1], outcomeSections: [1],
  },
  'boehringer-cares-foundation-rebrand-strategy-shift': {
    title: 'Bringing Boehringer Cares to life', role: 'Rebrand implementation & communications',
    contribution: 'I helped carry the team’s approved rebrand into the foundation’s website, communications assets, company-wide newsletter, and volunteering communications.',
    outcome: 'During the 2025 rollout, annual employee volunteering increased by 25%; the newsletter reached an 80% open rate, alongside more than 25 communications assets.',
    processSections: [1, 2], outcomeSections: [3],
  },
  'openai-product-testing-and-feedback': {
    title: 'Inside the ChatGPT Lab', role: 'Product tester & feedback contributor',
    contribution: 'In OpenAI’s first ChatGPT Lab cohort, I tested products before release and brought a student and early-career perspective to product and go-to-market conversations.',
    outcome: 'My contributions included real workflows for the 100 Chats book, product feedback, launch campaigns, and public stories about how students use ChatGPT.',
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
    processSections: authored?.processSections ?? [0],
    outcomeSections: authored?.outcomeSections ?? [Math.max(0, project.sections.length - 1)],
  };
}

export function evidenceSections(id: string, focus: EvidenceFocus) {
  const record = evidenceFor(id);
  if (!record) return [];
  const indices = focus === 'process' ? record.processSections : focus === 'outcomes' ? record.outcomeSections : record.project.sections.map((_, index) => index);
  return indices.filter(index => record.project.sections[index]).map(index => ({ ...record.project.sections[index], index, id: `${id}:section:${index}` }));
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
