/** Fresh visitor language from the main-interface quality review. Targets name
 * the minimum actual visible answer, not a production alias or generated fact. */
export const visitorAnswers = [
  { question: 'What made the press outreach useful to reporters?', project: 'congressional-office-setup-100-day-report', section: 1, text: /dependable contact for journalists working on deadline/ },
  { question: 'How did he tell the local program’s story beyond Taiwan?', project: 'fulbright-focus-group-sponsored-by-openai', section: 2, text: /ChatGPT for Education Substack published/ },
  { question: 'What changed in the Taiwan sessions after Isaac listened to the participating educators?', project: 'fulbright-focus-group-sponsored-by-openai', section: 1, text: /Participant questions changed what I emphasized/ },
  { question: 'How did Isaac coordinate UX and brand colleagues?', project: 'boehringer-cares-foundation-rebrand-strategy-shift', section: 1, text: /worked with UX and brand strategy teams/ },
  { question: 'How did Isaac make employee volunteering communications consistent?', project: 'boehringer-cares-foundation-rebrand-strategy-shift', section: 2, text: /updated internal messaging around volunteering/ },
  { question: 'What did Isaac do to make the Australian newsroom interviews usable as research evidence?', project: 'senior-thesis-local-journalism', section: 0, text: /transcription verification, qualitative coding/ },
  { question: 'What did his 17 interviews find?', project: 'senior-thesis-local-journalism', section: 1, text: /does not provide the thesis’s detailed conclusions/ },
  { question: 'What did Isaac personally do for the hundred day report?', project: 'congressional-office-setup-100-day-report', section: 5, text: /collected and checked information from across the office/ },
  { question: 'What did he want to change in the assistant’s timing in group conversations?', project: 'openai-product-testing-and-feedback', section: 6, text: /tune how active it was/ },
  { question: 'How did the ChatGPT Lab change his understanding of product work?', project: 'openai-product-testing-and-feedback', section: 7, text: /connecting what a team built to the messy way a person/ },
  { question: 'What did Isaac build to turn the state government AI research into recommendations?', project: 'artificial-intelligence-in-state-government-index', section: 1, text: /practitioner roadmap tied directly to observed/ },
];

export const visitorQualifications = [
  { question: 'Did Isaac design the Boehringer brand identity himself?', text: /broader team established the original rebrand direction/ },
  { question: 'How much did Isaac personally raise volunteering by?', text: /does not isolate how much change was caused by Isaac alone/ },
  { question: 'What feature shipped because of his Pulse feedback?', text: /does not.*establish which shipped features resulted/ },
  { question: 'What did the thesis prove about AI destroying local news?', text: /without claiming a representative survey or measured causal effect/ },
  { question: 'Did he write the law about child labor?', text: /does not establish that he authored legislation/ },
];

export const visitorFollowups = [
  { initial: 'What changed in the Taiwan sessions after Isaac listened to the participating educators?', followup: 'Where did feedback change how he ran the program?', project: 'fulbright-focus-group-sponsored-by-openai', section: 1, text: /Participant questions changed what I emphasized/ },
  { initial: 'What changed in the Taiwan sessions after Isaac listened to the participating educators?', followup: 'Show the program materials for that.', project: 'fulbright-focus-group-sponsored-by-openai', section: 5, link: 'View the conference workshop' },
  { initial: 'What concrete changes did Isaac suggest to make Pulse personalization easier to trust?', followup: 'Show its sources.', project: 'openai-product-testing-and-feedback', section: 4, link: 'Meet ChatGPT Pulse' },
  { initial: 'What did Isaac personally do for the hundred day report?', followup: 'Could I read the whole report?', project: 'congressional-office-setup-100-day-report', section: 5, link: 'Read the 100 Day Report' },
];
