import { projectItems, hiddenProjectIds, type ProjectSection } from './siteContent.js';
import { aiIndexStates } from './aiStateGovIndex.js';

/** Search the complete published record, including material-only sections. */
export function sectionSearchParts(section: ProjectSection): string[] {
  return [section.heading, ...section.paragraphs ?? [], ...section.bullets ?? [],
    section.pullQuote ?? '', ...section.stats?.flatMap(stat => [stat.label, stat.value]) ?? [],
    ...section.links?.map(link => link.label) ?? [],
    ...section.media?.flatMap(media => [media.title ?? '', media.caption ?? '', media.alt ?? '',
      ...media.images?.flatMap(image => [image.alt, image.caption ?? '']) ?? []]) ?? []];
}

export function hasPublishedMaterial(section: ProjectSection): boolean {
  return Boolean(section.paragraphs?.length || section.bullets?.length || section.stats?.length
    || section.pullQuote || section.links?.length || section.media?.length);
}

const publicProjects = projectItems.filter(project => !hiddenProjectIds.has(project.id));
const normalize = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Exact editorial phrases provide a stable entry point as Work grows. Requiring
 * two words avoids turning generic one-word headings into subject aliases. */
export function publishedPhrasePosition(text: string, phrase: string): number {
  const words = (value: string) => normalize(value).match(/[a-z0-9]+/g) ?? [];
  const phraseWords = words(phrase);
  if (phraseWords.length < 2) return -1;
  return ` ${words(text).join(' ')} `.indexOf(` ${phraseWords.join(' ')} `);
}

export function publishedProjectMentions(text: string): { id: string; position: number }[] {
  return publicProjects.flatMap(project => {
    const position = publishedPhrasePosition(text, project.title);
    return position < 0 ? [] : [{ id: project.id, position }];
  });
}
const stem = (word: string) => {
  if(word.length<4)return word;
  let root=word.replace(/ies$/, 'y').replace(/ied$/, 'y').replace(/ification$/, 'ify');
  if(root.length>=6)root=root.replace(/(?:ing|ed|ment)$/, '');
  if(root.length>=5&&!root.endsWith('ss'))root=root.replace(/s$/, '');
  return root.length>=4?root.replace(/e$/, ''):root;
};
const words = (text: string) => (normalize(text).match(/[a-z0-9]+/g) ?? []).map(stem);
const tokens = (text: string) => [...new Set(words(text))];
const stop = new Set(tokens('a an the and or to of in on at by for with from about through this that these those it its his her their your you he him they we me my isaac seiler what how why who which when where did does do was were is are can could would should please show tell explain explore give more actually really work worked working project projects role contribution process outcomes results findings evidence source sources approach method methodology learn learned lessons built build make made use using research study design program changed happen experience') );
for (const term of tokens('feedback product testing test personally contribute contributions index benchmark differently different success successful evaluate evaluation assessment measure measurement raise increase much')) stop.add(term);
/** A small language normalization layer shared across the corpus. These are
 * information-retrieval concepts, not project-name aliases or evaluation answers.
 * Keep original terms too: an expansion can support an answer, never create facts. */
const queryTerms = (text: string) => {
  const concepts: [RegExp, string][] = [
    [/\b(?:verify|verified|verification|check|checked|reliable|reliability|trustworthy)\b|\bavoid\b.*\b(?:invent|making up|fabricat)/i, 'verify accurate evidence'],
    [/\b(?:beyond|wider|broader|publicly|publish|published|disseminat\w*)\b|\b(?:share|tell)\b.*\bstory\b/i, 'public publish audience'],
    [/\brecommend\w*/i, 'roadmap'],
    [/\b(?:research evidence|usable as research|reliable data)\b/i, 'verify code transcript'],
    [/\b(?:adapt|adapted|adjust|adjusted|change|changed)\b.*\b(?:sessions?|program|workshops?)\b/i, 'participant questions emphasis'],
  ];
  const expanded = text + ' ' + concepts.filter(([pattern]) => pattern.test(text)).map(([, words]) => words).join(' ');
  return tokens(expanded.slice(0, 700)).filter(term => term.length > 2 && !stop.has(term));
};
const sectionTerms = (section: ProjectSection) => new Set(tokens(sectionSearchParts(section).join(' ')));
const incidental = new Set(tokens(['new while living during', ...aiIndexStates.map(state => state.state)].join(' ')));
const containsTerm = (terms: Set<string>, term: string) => terms.has(term)
  ||term.length>=7&&[...terms].some(other=>other.length>=7&&other.slice(0,6)===term.slice(0,6));

// Immutable corpus analysis is built once, not for every keystroke or clause.
const corpusIndex=publicProjects.map(project=>({project,subject:new Set(tokens(project.title)),
  terms:new Set(tokens([project.title,project.summary,...project.sections.flatMap(sectionSearchParts)].join(' '))),
  sections:project.sections.map((section,index)=>({index,heading:new Set(tokens(section.heading)),terms:sectionTerms(section),words:words([...(section.paragraphs??[]),...(section.bullets??[])].join(' ')),
    paragraphs:(section.paragraphs??[]).map((paragraph,index)=>({index,terms:new Set(tokens(paragraph))}))})),
}));
export function publishedQueryTerms(text:string):readonly string[]{return queryTerms(text);}
export function publishedTextRelevance(text:string,query:string):number {
  const terms=queryTerms(query).filter(term=>!incidental.has(term));
  const document=new Set(tokens(text));
  return terms.reduce((score,term)=>score+(containsTerm(document,term)?1/Math.max(1,corpusIndex.filter(item=>containsTerm(item.terms,term)).length):0),0);
}

/** Conservative fallback for a subject expressed through its actual work, rather
 * than its project name. A shared word such as "communications" is insufficient. */
export function findPublishedProject(text: string): string | undefined {
  // General-purpose requests must not borrow incidental words from a case study.
  if (/^(?:please )?(?:write|draft|generate|create|plan|help me write|help me create)\b/i.test(text.trim())) return;
  const terms = queryTerms(text).filter(term => !incidental.has(term));
  const documents = corpusIndex;
  const frequency = (term: string) => documents.filter(document => containsTerm(document.terms,term)).length;
  const ranked = documents.map(document => {
    const matches = terms.filter(term => containsTerm(document.terms,term));
    const unique = matches.filter(term => frequency(term) === 1);
    return { id: document.project.id, matches, unique, score: matches.reduce((sum, term) => sum + 1 / frequency(term), 0) };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || !best.unique.length || best.score - (ranked[1]?.score ?? 0) < .75) return;
  if (best.matches.length / terms.length >= .6 && (best.matches.length >= 2
    || best.unique.some(term => term.length >= 8) && /\b(?:isaac|he|his|you|your)\b/i.test(text)
      && /\b(?:how|responsib\w*|contribut\w*|personally)\b/i.test(text))) return best.id;
}

/** Select a passage by discriminative published words. Explicit editorial rules
 * still win; broad questions retain their authored contribution overview. */
export function findPublishedSection(text: string, projectId: string, candidates?: readonly number[]): number | undefined {
  const indexed=corpusIndex.find(record=>record.project.id===projectId);
  if(!indexed)return;
  const {subject}=indexed;
  const terms = queryTerms(text).filter(term => !subject.has(term));
  if (!terms.length) return;
  const sections=indexed.sections;
  const ranked = sections.filter(section => !candidates || candidates.includes(section.index)).map(section => {
    const matches = terms.filter(term => containsTerm(section.terms,term));
    const score = matches.reduce((sum, term) => {
      const frequency = sections.filter(other => containsTerm(other.terms,term)).length;
      const count = section.words.filter(word => containsTerm(new Set([word]), term)).length;
      return sum + (containsTerm(section.heading,term) ? 4 : 1) * (1 + .15 * Math.log(Math.max(1, count))) / frequency;
    }, 0);
    return { index: section.index, matches, score, headingMatches: matches.filter(term => containsTerm(section.heading, term)).length };
  }).sort((a, b) => Math.abs(b.score - a.score) < .01 ? b.headingMatches - a.headingMatches || a.index - b.index : b.score - a.score);
  const best = ranked[0];
  if (!best?.matches.length || best.score < .5) return;
  return best.index;
}

/** A selected section can contain several different answers. Carry exact local
 * paragraph references into the portable view rather than clipping its opening. */
export function findPublishedParagraphs(text: string, projectId: string, sectionIndex: number): number[] | undefined {
  const indexed=corpusIndex.find(record=>record.project.id===projectId);
  const project=indexed?.project;
  const section = project?.sections[sectionIndex];
  if (!project || !section?.paragraphs?.length) return;
  const subject = new Set(tokens(`${project.title} ${section.heading}`));
  const terms = queryTerms(text).filter(term => !subject.has(term) && !incidental.has(term));
  if (!terms.length) return;
  const paragraphs=indexed!.sections[sectionIndex].paragraphs;
  const ranked = paragraphs.map(paragraph => ({ index: paragraph.index, score: terms.reduce((sum, term) =>
    sum + (containsTerm(paragraph.terms,term) ? 1 / paragraphs.filter(other => containsTerm(other.terms,term)).length : 0), 0) }))
    .filter(paragraph => paragraph.score >= .5).sort((a, b) => b.score - a.score || a.index - b.index);
  if (!ranked.length) return;
  // Cover distinct parts of a question, rather than repeating the most
  // keyword-dense paragraph and dropping a shorter methodological answer.
  const selected: number[] = [];
  const covered = new Set<string>();
  for (const paragraph of ranked) {
    const matches = terms.filter(term => containsTerm(paragraphs[paragraph.index].terms, term));
    if (!selected.length || matches.some(term => !covered.has(term))) {
      selected.push(paragraph.index);
      for (const term of matches) covered.add(term);
    }
    if (selected.length === 3) break;
  }
  return selected.sort((a, b) => a - b);
}
