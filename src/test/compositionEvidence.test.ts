import { describe, expect, it } from 'vitest';
import { publicProjects } from '@/lib/canvas';
import { hiddenProjectIds, type ProjectItem } from '@/lib/siteContent';
import { buildCompositionCatalog, buildProjectRoutingCriteria, compositionEvidenceFingerprint, compositionCatalog, evidenceRoutingCriteria, projectRoutingCriteria } from '../../server/composition-evidence';

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
        expect(catalog.sections[index].sourceLabels).toEqual((section.links ?? []).map(link => link.label));
        expect(catalog.sections[index].materialOnly).toBe(!(section.paragraphs?.length || section.bullets?.length || section.stats?.length || section.pullQuote));
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

  it('automatically incorporates new Work projects and later additions without an editorial record', () => {
    const project: ProjectItem = {
      id: 'new-published-work', title: 'New published work', summary: 'A published case study.',
      source: 'WORK', year: '2026', image: '/private-image-path.jpg', lead: 'Published introductory context.',
      sections: [{ heading: 'Process', paragraphs: ['An introductory passage.'] }],
    };
    const original = buildCompositionCatalog([project]);
    const extended = buildCompositionCatalog([{
      ...project,
      sections: [
        { heading: 'Process', paragraphs: [...project.sections[0].paragraphs!, 'Isaac studied procurement bottlenecks using interviews with municipal staff.'] },
        { heading: 'Outcomes', bullets: ['Published procurement review.'], media: [{ type: 'image', src: '/private-image-path.jpg', caption: 'A public procurement workshop.' }] },
      ],
    }]);
    expect(extended[0].lead).toBe(project.lead);
    expect(extended[0].sections[0].evidence).toContain('Paragraph 1: Isaac studied procurement bottlenecks');
    expect(extended[0].sections[1].evidence).toContain('Published procurement review.');
    const criteria = buildProjectRoutingCriteria('municipal procurement bottlenecks', extended);
    expect(Object.keys(criteria)).toEqual([project.id]);
    expect(criteria[project.id]).toContain('Isaac studied procurement bottlenecks using interviews with municipal staff.');
    expect(criteria[project.id]).toContain('A public procurement workshop.');
    expect(JSON.stringify(extended)).not.toContain('/private-image-path.jpg');
    expect(compositionEvidenceFingerprint(extended)).not.toBe(compositionEvidenceFingerprint(original));
    expect(compositionEvidenceFingerprint(buildCompositionCatalog([project]))).toBe(compositionEvidenceFingerprint(original));
  });

  it('offers late published topics to fallback routing without dropping other projects', () => {
    const criteria = buildProjectRoutingCriteria('individual reporters covered deadlines');
    expect(Object.keys(criteria)).toEqual(publicProjects.map(project => project.id));
    expect(criteria['congressional-office-setup-100-day-report']).toContain('individual reporters covered');
    for (const project of compositionCatalog) {
      for (const section of project.sections) expect(criteria[project.id]).toContain(section.heading);
    }
  });

  it('never includes hidden records, gallery data, arbitrary source URLs, or image paths', () => {
    const serialized = JSON.stringify({ compositionCatalog, projectRoutingCriteria, routing: buildProjectRoutingCriteria('portfolio'), criteria: evidenceRoutingCriteria('portfolio') });
    for (const id of hiddenProjectIds) expect(serialized).not.toContain(id);
    expect(serialized).not.toContain('albumIds');
    expect(serialized).not.toContain('/project-images/');
    expect(serialized).not.toContain('https://');
  });
});
