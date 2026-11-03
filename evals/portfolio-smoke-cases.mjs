/** Fresh questions for the main-interface review, including actual follow-up
 * context. These are public, fixed inputs and not production routing aliases. */
export const portfolioSmokeQuestions = [
  { id: 'policy-verification', projectId: 'artificial-intelligence-in-state-government-index', section: 1, question: 'How did Isaac distinguish a government press announcement from verifiable AI preparedness in the state index?' },
  { id: 'congress-new-office', projectId: 'congressional-office-setup-100-day-report', section: 0, question: 'When the congressional office started from scratch, which communications systems did Isaac establish?' },
  { id: 'thesis-interviews', projectId: 'senior-thesis-local-journalism', section: 0, question: 'What did Isaac do to make the Australian newsroom interviews usable as research evidence?', paragraphIndices: [1, 2] },
  { id: 'taiwan-adaptation', projectId: 'fulbright-focus-group-sponsored-by-openai', section: 1, question: 'What changed in the Taiwan sessions after Isaac listened to the participating educators?', paragraphIndices: [3, 4] },
  { id: 'taiwan-materials-followup', follows: 'taiwan-adaptation', projectId: 'fulbright-focus-group-sponsored-by-openai', section: 5, question: 'Show the program materials for that.' },
  { id: 'brand-employee-voice', projectId: 'boehringer-cares-foundation-rebrand-strategy-shift', section: 2, question: 'How did Isaac carry the Boehringer Cares voice into everyday employee communications?', paragraphIndices: [0, 1] },
  { id: 'lab-pulse-trust', projectId: 'openai-product-testing-and-feedback', section: 4, question: 'What concrete changes did Isaac suggest to make Pulse personalization easier to trust?', paragraphIndices: [1] },
  { id: 'lab-pulse-sources-followup', follows: 'lab-pulse-trust', projectId: 'openai-product-testing-and-feedback', section: 4, question: 'Show its sources.' },
];
