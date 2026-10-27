/** Authored, reviewable layouts. Models may select these IDs, never invent markup. */
export const layoutIds = [
  'benchmark-ranking','benchmark-scorecard','benchmark-compare','benchmark-regions','benchmark-distribution','benchmark-criteria',
  'photo-focus','photo-grid','photo-diptych','photo-collections',
  'teaching-lesson','teaching-feedback','teaching-language','teaching-sequence',
  'project-brief','project-process','project-outcomes','project-evidence','project-compare','project-index',
  'experience-timeline','experience-roles','site-pipeline','contact-card',
] as const;
export type LayoutId = typeof layoutIds[number];
export type ModuleKind = 'benchmark'|'photos'|'workshop'|'story'|'comparison'|'timeline'|'architecture'|'contact'|'collection';
export type LayoutDefinition = {id:LayoutId;kind:ModuleKind;name:string;description:string;prompt:string};
const define=(id:LayoutId,kind:ModuleKind,name:string,description:string,prompt:string):LayoutDefinition=>({id,kind,name,description,prompt});
const ALL_LAYOUTS: readonly LayoutDefinition[] = [
  define('benchmark-ranking','benchmark','Ranking','Rank governments by their published AI score.','Rank governments by AI preparedness'),
  define('benchmark-scorecard','benchmark','Scorecard','One government: score, rank and evidence.','Show Michigan’s AI scorecard'),
  define('benchmark-compare','benchmark','State comparison','Two governments with aligned scores and criteria.','Compare Michigan and California'),
  define('benchmark-regions','benchmark','Regional overview','Regional averages and drill-down to governments.','Compare regions in the AI benchmark'),
  define('benchmark-distribution','benchmark','Score distribution','Score bands with clickable government groups.','Show the distribution of AI scores'),
  define('benchmark-criteria','benchmark','Evidence checklist','The individual published criteria for selected governments.','Show Michigan AI evidence criteria'),
  define('photo-focus','photos','Photograph','A single photograph with a navigable filmstrip.','Browse Japan photos'),
  define('photo-grid','photos','Contact sheet','A paginated unlabeled grid that opens a photograph.','Show a contact sheet of Japan photos'),
  define('photo-diptych','photos','Diptych','Two photographs side by side with independent selection.','Show Japan photos as a diptych'),
  define('photo-collections','photos','Collections','Choose among photographic collections.','Explore photo collections'),
  define('teaching-lesson','workshop','Lesson planner','Editable objective, audience and lesson prompt.','Help me plan a Taiwan teaching lesson'),
  define('teaching-feedback','workshop','Feedback studio','A structured feedback prompt that keeps teachers in control.','Build a teaching feedback workflow'),
  define('teaching-language','workshop','Language practice','A conversational practice prompt with learner controls.','Build a language practice workflow'),
  define('teaching-sequence','workshop','Session sequence','Arrange an editable classroom session with durations.','Build a teaching session sequence'),
  define('project-brief','story','Project brief','A concise source-backed summary with section exploration.','Give me a brief on the Taiwan project'),
  define('project-process','story','Process steps','Explore the published project process one stage at a time.','Show the Taiwan project process'),
  define('project-outcomes','story','Outcomes','Published outcomes and takeaways with expandable evidence.','Show outcomes from the Taiwan project'),
  define('project-evidence','story','Evidence notebook','Search the published sections of one project in place.','Explore Taiwan project evidence'),
  define('project-compare','comparison','Project comparison','Compare two projects by overview, process or outcomes.','Compare AI policy and Taiwan teaching'),
  define('project-index','collection','Work explorer','A compact searchable project list opening interactive briefs.','Explore all projects'),
  define('experience-timeline','timeline','Career timeline','Chronological professional experience with filters.','Show your career timeline'),
  define('experience-roles','timeline','Role explorer','Filter roles and inspect their published responsibilities.','Explore your professional roles'),
  define('site-pipeline','architecture','Live pipeline','Inspect how the current request was routed and composed.','How does this site work?'),
  define('contact-card','contact','Contact','Public contact methods and a working email action.','How can I contact you?'),
];
// Live exploration explains Isaac’s work; photo and classroom utilities are not offered.
export const AI_LAYOUTS = ALL_LAYOUTS.filter(layout => layout.kind !== 'photos' && layout.kind !== 'workshop');
export const liveLayoutIds = AI_LAYOUTS.map(layout => layout.id) as [LayoutId, ...LayoutId[]];
export const layoutDefinition=(id:LayoutId)=>ALL_LAYOUTS.find(l=>l.id===id)!;
export const defaultLayout:Record<ModuleKind,LayoutId>={benchmark:'benchmark-ranking',photos:'photo-focus',workshop:'teaching-lesson',story:'project-brief',comparison:'project-compare',timeline:'experience-timeline',architecture:'site-pipeline',contact:'contact-card',collection:'project-index'};
