/** Editorial holdouts for the primary interface. Do not copy their phrasings
 * into production routing aliases. Match actual visible answer aspects. */
const policy='artificial-intelligence-in-state-government-index';
const congress='congressional-office-setup-100-day-report';
const thesis='senior-thesis-local-journalism';
const taiwan='fulbright-focus-group-sponsored-by-openai';
const brand='boehringer-cares-foundation-rebrand-strategy-shift';
const lab='openai-product-testing-and-feedback';
const aspect=(id,...anyOf)=>({id,anyOf});
export const portfolioReleaseQuestions=[
 {id:'office-startup',projectId:congress,section:0,question:'What did getting the new congressional office operational involve?',aspects:[aspect('starting-conditions','no inherited staff'),aspect('personal-work','helped recruit the initial team'),aspect('delivery','staffed operations')]},
 {id:'office-report',projectId:congress,section:5,question:'How did he make the first 100 days understandable to constituents?',aspects:[aspect('verification','collected and checked information'),aspect('authorship','wrote the narrative'),aspect('attribution','numbers belonged to the full team')]},
 {id:'office-report-source',follows:'office-report',projectId:congress,section:5,question:'Let me read that report.',aspects:[aspect('artifact-access','Read the 100 Day Report')]},
 {id:'press-usefulness',projectId:congress,section:1,question:'What made his congressional press relationships practically useful?',aspects:[aspect('reporter-needs','how quickly they needed answers'),aspect('working-method','dependable contact for journalists working on deadline')]},
 {id:'research-method',projectId:thesis,section:0,question:'Walk me through how the Australian journalism research was actually done.',aspects:[aspect('participants','17 in-depth interviews'),aspect('verification','transcription verification'),aspect('analysis','qualitative coding')]},
 {id:'research-artifact',follows:'research-method',projectId:thesis,section:2,question:'Could I open the whole thesis?',aspects:[aspect('artifact-access','Final Thesis Draft')]},
 {id:'taiwan-adaptation',projectId:taiwan,section:1,question:'How did educator feedback change the Taiwan program over time?',aspects:[aspect('feedback','Participant questions changed what I emphasized'),aspect('decision','less time talking about ChatGPT in the abstract'),aspect('perspective','concerns and experience of the educators','when and how educators should choose to use it')]},
 {id:'taiwan-sharing',projectId:taiwan,section:2,question:'What did he publish from the Taiwan educators’ experiences?',aspects:[aspect('synthesis','nine practical ChatGPT use cases'),aspect('publication',"ChatGPT for Education Substack published")]},
 {id:'taiwan-materials',follows:'taiwan-sharing',projectId:taiwan,section:5,question:'Show the program materials for that.',aspects:[aspect('workspace','Explore the program workspace'),aspect('workshop','View the conference workshop')]},
 {id:'taiwan-lessons',projectId:taiwan,section:4,question:'What did running the educator program teach Isaac?',aspects:[aspect('community','best learning happens in community'),aspect('adoption','durable AI adoption starts from the bottom up')]},
 {id:'brand-ownership',projectId:brand,question:'Who defined the Boehringer rebrand and what did Isaac take responsibility for?',aspects:[aspect('ownership','did not create the original rebrand vision','broader team established the original rebrand direction','broader team had established a new direction'),aspect('implementation','helping translate the approved direction','carry it through','responsible for helping implement that direction')]},
 {id:'brand-continuity',projectId:brand,section:2,question:'How did the new Boehringer voice continue reaching employees after launch?',aspects:[aspect('newsletter','company-wide newsletter'),aspect('implementation','updated internal messaging around volunteering'),aspect('continuity','announcements, program updates, volunteering communications','same voice and visual direction after the launch')]},
 {id:'brand-results',projectId:brand,section:3,question:'What published outcomes accompanied the Boehringer rollout?',aspects:[aspect('volunteering','volunteering increased by 25%'),aspect('newsletter','80% open rate')]},
 {id:'pulse-feedback',projectId:lab,section:4,question:'Which changes did Isaac recommend for trusting personalized Pulse results?',aspects:[aspect('sources','clearer sources'),aspect('agency','better preference controls'),aspect('interface','compact cards')]},
 {id:'pulse-sources',follows:'pulse-feedback',projectId:lab,section:4,question:'Show its sources.',aspects:[aspect('matching-product','Meet ChatGPT Pulse')]},
 {id:'lab-switch-atlas',follows:'pulse-sources',projectId:lab,section:5,question:'What about his Atlas browser feedback?',aspects:[aspect('product-specific','seam between browsing and chatting')]},
 {id:'atlas-source-followup',follows:'lab-switch-atlas',projectId:lab,section:5,question:'Show its sources.',aspects:[aspect('matching-artifact','Meet ChatGPT Atlas')]},
 {id:'lab-subject-change',follows:'atlas-source-followup',projectId:brand,section:2,question:'How did Isaac use a newsletter for the Boehringer rebrand?',aspects:[aspect('new-subject','company-wide newsletter'),aspect('new-subject-method','updated internal messaging around volunteering')]},
 {id:'group-participation',projectId:lab,section:6,question:'What was wrong with how the assistant joined group conversations?',aspects:[aspect('problem','participated too little or sounded too canned'),aspect('control','tune how active it was'),aspect('restraint','without letting it take over the conversation')]},
 {id:'atlas-feedback',projectId:lab,section:5,question:'Where did Isaac want the Atlas browser and assistant experience to fit together better?',aspects:[aspect('interaction','seam between browsing and chatting'),aspect('control','more control over the model'),aspect('recommendations','rather than ad-like')]},
 {id:'policy-snapshot',projectId:policy,section:0,question:'What did Isaac build for the state government index and what did his research reveal?',aspects:[aspect('coverage','all states and territories'),aspect('finding','most states scored below 50/100'),aspect('interpretation','early, uneven, and often opaque')]},
];
