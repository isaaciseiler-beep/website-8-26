import { describe, expect, it } from 'vitest';
import { publicProjects } from '@/lib/canvas';
import { hiddenProjectIds } from '@/lib/siteContent';
import { compositionCatalog, evidenceRoutingCriteria, projectRoutingCriteria } from '../../server/composition-evidence';

describe('complete public composition evidence', () => {
  it('represents every public project and section without a top-project retrieval cutoff', () => {
    expect(compositionCatalog.map(project => project.id)).toEqual(publicProjects.map(project => project.id));
    for (const project of publicProjects) {
      const catalog = compositionCatalog.find(record => record.id === project.id)!;
      expect(catalog.summary).toBe(project.summary);
      expect(catalog.sections.map(section => section.index)).toEqual(project.sections.map((_, index) => index));
      for (const [index, section] of project.sections.entries()) {
        const evidence = catalog.sections[index].evidence;
        expect(catalog.sections[index].paragraphCount).toBe(section.paragraphs?.length ?? 0);
        for (const passage of [...(section.paragraphs ?? []), ...(section.bullets ?? [])]) expect(evidence).toContain(passage);
        for (const [paragraphIndex, passage] of (section.paragraphs ?? []).entries()) expect(evidence).toContain(`Paragraph ${paragraphIndex}: ${passage}`);
        for (const stat of section.stats ?? []) expect(evidence).toContain(`${stat.label}: ${stat.value}`);
        if (section.pullQuote) expect(evidence).toContain(section.pullQuote);
        for (const link of section.links ?? []) expect(evidence).toContain(link.label);
        for (const media of section.media ?? []) {
          if (media.title) expect(evidence).toContain(media.title);
          if (media.caption) expect(evidence).toContain(media.caption);
          if (media.alt) expect(evidence).toContain(media.alt);
          for (const image of media.images ?? []) {
            expect(evidence).toContain(image.alt);
            if (image.caption) expect(evidence).toContain(image.caption);
          }
        }
      }
    }
  });

  it('retains later passages and source-only sections that the introductory excerpt omitted', () => {
    const congress = compositionCatalog.find(project => project.id === 'congressional-office-setup-100-day-report')!;
    const press = congress.sections[1];
    expect(press.evidence.length).toBeGreaterThan(650);
    expect(press.evidence).toContain('Within a few months');
    const policy = compositionCatalog.find(project => project.id === 'artificial-intelligence-in-state-government-index')!;
    expect(policy.sections.at(-1)?.evidence).toContain('Recommendations to State Lawmakers');
  });

  it('keeps all public section candidates in advisory hints while matching evidence anywhere in a section', () => {
    const criteria = evidenceRoutingCriteria('How did Isaac learn what reporters covered and meet their deadlines?');
    expect(Object.keys(criteria)).toEqual(compositionCatalog.flatMap(project => project.sections.map(section => section.id)));
    const press = criteria['congressional-office-setup-100-day-report:section:1'];
    expect(press).toContain('individual reporters covered');
    expect(press).toContain('how quickly they needed answers');
    expect(Object.keys(projectRoutingCriteria)).toEqual(publicProjects.map(project => project.id));
    expect(projectRoutingCriteria['boehringer-cares-foundation-rebrand-strategy-shift']).toContain('newsletter');
    expect(projectRoutingCriteria['openai-product-testing-and-feedback']).toContain('Pulse');
  });

  it('never includes hidden records, gallery data, arbitrary source URLs, or image paths', () => {
    const serialized = JSON.stringify({ compositionCatalog, projectRoutingCriteria, criteria: evidenceRoutingCriteria('portfolio') });
    for (const id of hiddenProjectIds) expect(serialized).not.toContain(id);
    expect(serialized).not.toContain('albumIds');
    expect(serialized).not.toContain('/project-images/');
    expect(serialized).not.toContain('https://');
  });
});
