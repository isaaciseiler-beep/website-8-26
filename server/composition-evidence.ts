import { publicProjects } from '../src/lib/canvas.js';
import { evidenceForSection } from '../src/lib/portfolioEvidenceRegistry.js';
import { portfolioCatalog } from '../src/lib/portfolioEvidence.js';

/**
 * The live portfolio is small enough to ground every composition in every public
 * passage. Do not retrieve only the top projects or clip the start of a section:
 * those shortcuts hide less frequently requested work and later outcomes.
 * Source labels establish available evidence without making the model invent or
 * reproduce URLs. Hidden projects, album records and media URLs never enter here.
 */
export const compositionCatalog = publicProjects.map(project => {
  const reviewed = portfolioCatalog.find(record => record.id === project.id);
  return {
    ...reviewed,
    id: project.id,
    title: project.title,
    summary: project.summary,
    year: project.year,
    ...(project.lead ? { lead: project.lead } : {}),
    sections: project.sections.map((section, index) => ({
      id: `${project.id}:section:${index}`,
      index,
      heading: section.heading,
      passages:evidenceForSection(project.id,index).map(({id,kind,itemIndex})=>({id,kind,itemIndex})),
      paragraphCount: section.paragraphs?.length ?? 0,
      sourceLabels: (section.links ?? []).map(link => link.label),
      materialOnly: !(section.paragraphs?.length || section.bullets?.length || section.stats?.length || section.pullQuote),
      evidence: [
        ...(section.paragraphs ?? []).map((paragraph, index) => `Paragraph ${index}: ${paragraph}`),
        ...(section.bullets ?? []),
        ...(section.stats ?? []).map(stat => `${stat.label}: ${stat.value}`),
        ...(section.pullQuote ? [section.pullQuote] : []),
        ...(section.links?.length ? [`Published sources: ${section.links.map(link => link.label).join('; ')}`] : []),
        ...(section.media ?? []).flatMap(media => [media.title, media.caption, media.alt, ...(media.images ?? []).flatMap(image => [image.alt, image.caption])].filter((text): text is string => Boolean(text))).map(text => `Published media: ${text}`),
      ].join('\n'),
    })),
  };
});

/** All subjects remain available even in the optional closed-set router. */
export const projectRoutingCriteria = Object.fromEntries(compositionCatalog.map(project => [
  project.id,
  [project.title, project.summary, project.role, project.contribution, project.outcome, ...project.sections.map(section => section.heading)].filter(Boolean).join(' — '),
]));

const stopWords = new Set(['the', 'and', 'for', 'this', 'that', 'what', 'how', 'did', 'does', 'with', 'was', 'his', 'your', 'isaac', 'about', 'work', 'project']);
const terms = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(term => !stopWords.has(term)) ?? []);

/**
 * Jev has a short deadline, so offer a compact passage from every section rather
 * than repeating the same project-level contribution for all of its sections.
 * Matching chooses verbatim sentences anywhere in the section; it never excludes
 * a candidate or synthesizes evidence. Mistral receives the complete catalog.
 */
export function evidenceRoutingCriteria(draft: string): Record<string, string> {
  const query = terms(draft);
  return Object.fromEntries(compositionCatalog.flatMap(project => project.sections.map(section => {
    const sentences = section.evidence.split(/\n+|(?<=[.!?])\s+/).map(text => text.trim()).filter(Boolean);
    const ranked = sentences.map((text, index) => ({ text, index, score: [...terms(text)].filter(term => query.has(term)).length }));
    ranked.sort((a, b) => b.score - a.score || a.index - b.index);
    const excerpt = ranked.slice(0, 2).sort((a, b) => a.index - b.index).map(item => item.text).join(' ').slice(0, 700);
    return [section.id, `${project.title}: ${section.heading}. ${excerpt}`];
  })));
}
