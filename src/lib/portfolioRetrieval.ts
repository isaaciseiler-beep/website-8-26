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
const stem = (word: string) => {
  if(word.length<4)return word;
  let root=word.replace(/ies$/, 'y').replace(/ied$/, 'y').replace(/ification$/, 'ify');
  if(root.length>=6)root=root.replace(/(?:ing|ed|ment)$/, '');
  if(root.length>=5&&!root.endsWith('ss'))root=root.replace(/s$/, '');
  return root.length>=4?root.replace(/e$/, ''):root;
};
const tokens = (text: string) => [...new Set((normalize(text).match(/[a-z0-9]+/g) ?? []).map(stem))];
const stop = new Set(tokens('a an the and or to of in on at by for with from about through this that these those it its his her their your you he him they we me my isaac seiler what how why who which when where did does do was were is are can could would should please show tell explain explore give more actually really work worked working project projects published role contribution process outcomes results findings evidence source sources approach method methodology learn learned lessons built build make made use using research study design program changed happen experience') );
for (const term of tokens('feedback product testing test personally contribute contributions index benchmark differently different success successful evaluate evaluation assessment measure measurement')) stop.add(term);
const queryTerms = (text: string) => tokens(text.slice(0, 500)).filter(term => term.length > 2 && !stop.has(term));
const sectionTerms = (section: ProjectSection) => new Set(tokens(sectionSearchParts(section).join(' ')));
const incidental = new Set(tokens(['new while living during', ...aiIndexStates.map(state => state.state)].join(' ')));
const containsTerm = (terms: Set<string>, term: string) => terms.has(term)
  ||term.length>=7&&[...terms].some(other=>other.length>=7&&other.slice(0,6)===term.slice(0,6));

/** Conservative fallback for a subject expressed through its actual work, rather
 * than its project name. A shared word such as "communications" is insufficient. */
export function findPublishedProject(text: string): string | undefined {
  // General-purpose requests must not borrow incidental words from a case study.
  if (/^(?:please )?(?:write|draft|generate|create|plan|help me write|help me create)\b/i.test(text.trim())) return;
  const terms = queryTerms(text).filter(term => !incidental.has(term));
  const documents = publicProjects.map(project => ({ project, terms: new Set(tokens([
    project.title, project.summary, ...project.sections.flatMap(sectionSearchParts),
  ].join(' '))) }));
  const frequency = (term: string) => documents.filter(document => containsTerm(document.terms,term)).length;
  const ranked = documents.map(document => {
    const matches = terms.filter(term => containsTerm(document.terms,term));
    const unique = matches.filter(term => frequency(term) === 1);
    return { id: document.project.id, matches, unique, score: matches.reduce((sum, term) => sum + 1 / frequency(term), 0) };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || !best.unique.length || best.score - (ranked[1]?.score ?? 0) < .75) return;
  if (best.matches.length >= 2 && best.matches.length / terms.length >= .6) return best.id;
}

/** Select a passage by discriminative published words. Explicit editorial rules
 * still win; broad questions retain their authored contribution overview. */
export function findPublishedSection(text: string, projectId: string, candidates?: readonly number[]): number | undefined {
  const project = publicProjects.find(project => project.id === projectId);
  if (!project) return;
  const subject = new Set(tokens(project.title));
  const terms = queryTerms(text).filter(term => !subject.has(term));
  if (!terms.length) return;
  const sections = project.sections.map((section, index) => ({ index, heading: new Set(tokens(section.heading)), terms: sectionTerms(section) }));
  const ranked = sections.filter(section => !candidates || candidates.includes(section.index)).map(section => {
    const matches = terms.filter(term => containsTerm(section.terms,term));
    const score = matches.reduce((sum, term) => {
      const frequency = sections.filter(other => containsTerm(other.terms,term)).length;
      return sum + (containsTerm(section.heading,term) ? 4 : 1) / frequency;
    }, 0);
    return { index: section.index, matches, score };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best?.matches.length || best.score < .5 || best.score - (ranked[1]?.score ?? 0) < .25) return;
  return best.index;
}

/** A selected section can contain several different answers. Carry exact local
 * paragraph references into the portable view rather than clipping its opening. */
export function findPublishedParagraphs(text: string, projectId: string, sectionIndex: number): number[] | undefined {
  const project = publicProjects.find(project => project.id === projectId);
  const section = project?.sections[sectionIndex];
  if (!project || !section?.paragraphs?.length) return;
  const subject = new Set(tokens(`${project.title} ${section.heading}`));
  const terms = queryTerms(text).filter(term => !subject.has(term) && !incidental.has(term));
  if (!terms.length) return;
  const paragraphs = section.paragraphs.map((paragraph, index) => ({ index, terms: new Set(tokens(paragraph)) }));
  const ranked = paragraphs.map(paragraph => ({ index: paragraph.index, score: terms.reduce((sum, term) =>
    sum + (containsTerm(paragraph.terms,term) ? 1 / paragraphs.filter(other => containsTerm(other.terms,term)).length : 0), 0) }))
    .filter(paragraph => paragraph.score >= .5).sort((a, b) => b.score - a.score || a.index - b.index);
  if (!ranked.length) return;
  return ranked.filter(paragraph => paragraph.score >= ranked[0].score * .7).slice(0, 3).map(paragraph => paragraph.index).sort((a, b) => a - b);
}
