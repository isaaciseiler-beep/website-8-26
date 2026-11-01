/** Reviewed relationships between published projects. Models choose IDs, never write these claims. */
export const connectionIds = ['systems', 'listening', 'delivery'] as const;
export type ConnectionId = typeof connectionIds[number];
export const portfolioConnections = {
  systems: {
    label: 'Making complexity usable',
    projectIds: ['artificial-intelligence-in-state-government-index', 'fulbright-focus-group-sponsored-by-openai', 'congressional-office-setup-100-day-report'],
    role: 'The same problem appears at different scales: make a complicated system understandable enough for someone to act on it.',
    process: 'The methods differ: compare public signals, adapt to educators’ questions, or connect local stories with federal policy. Each starts with the audience and works toward a usable structure.',
    outcomes: 'The outputs serve different decisions: a benchmark and roadmap, published educator use cases, and an account of a congressional office’s first 100 days. These are published outputs, not equivalent measures of impact.',
  },
  listening: {
    label: 'Learning from people',
    projectIds: ['senior-thesis-local-journalism', 'fulbright-focus-group-sponsored-by-openai', 'openai-product-testing-and-feedback'],
    role: 'Interviews, educator sessions, and product testing give Isaac different ways to understand what people need from technology.',
    process: 'The thesis synthesizes interviews; the Taiwan program changes in response to participants; product testing turns specific workflow problems into feedback. These are distinct methods of learning from use.',
    outcomes: 'The work produces research themes, shared educator use cases, and product feedback. The published accounts describe what Isaac contributed; they do not establish that feedback caused particular product changes.',
  },
  delivery: {
    label: 'Carrying ideas into practice',
    projectIds: ['fulbright-focus-group-sponsored-by-openai', 'congressional-office-setup-100-day-report', 'boehringer-cares-foundation-rebrand-strategy-shift'],
    role: 'Program ownership, office communications, and rebrand implementation all involve moving from an open-ended assignment to work people can actually use.',
    process: 'Isaac designed and adapted sessions, built press relationships and reporting workflows, and extended an approved brand direction across web and employee communications.',
    outcomes: 'The published results range from educator resources to a public service report and communications metrics. Congressional totals belong to the office; the rebrand results belong to the wider rollout.',
  },
} satisfies Record<ConnectionId, {label: string; projectIds: string[]; role: string; process: string; outcomes: string}>;

export function connectionForRequest(text: string): ConnectionId | undefined {
  if (/learning from people|listen(?:ing)? across|people.?s needs across/i.test(text)) return 'listening';
  if (/ideas into practice|ideas? (?:to|into) delivery|carrying ideas|delivery across/i.test(text)) return 'delivery';
  if (/making complexity usable|complex systems usable/i.test(text)) return 'systems';
}
