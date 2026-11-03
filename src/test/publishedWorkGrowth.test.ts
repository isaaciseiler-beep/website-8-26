import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/siteContent', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/siteContent')>();
  const project = {
    id: 'civic-access-fieldnotes', title: 'Civic Access Fieldnotes', source: 'WORK' as const,
    year: '2026', summary: 'An authored account of multilingual intake research.', image: '/existing.jpg',
    sections: [
      { heading: 'Listening at intake', paragraphs: ['Isaac documented multilingual intake interviews with community partners.'] },
      { heading: 'Lessons from multilingual intake', paragraphs: ['Interpreter scheduling changed after the intake interviews.'] },
    ],
  };
  return {
    ...actual,
    projectItems: [
      ...actual.projectItems.map(item => item.id === 'fulbright-focus-group-sponsored-by-openai' ? {
        ...item, sections: [...item.sections, { heading: 'Lessons from accessible workshops', paragraphs: ['Isaac documented accessible workshop materials with educator feedback.'] }],
      } : item),
      project, { ...project, id: 'private-fieldnotes', title: 'Private Access Fieldnotes' },
    ],
    hiddenProjectIds: new Set([...actual.hiddenProjectIds, 'private-fieldnotes']),
  };
});

import { initialPlan } from '@/lib/canvas';
import { composeLocal, resolveCanvasPlan, validateComposition } from '@/lib/genui';
import { namedProjects } from '@/lib/portfolioIntent';
import { suggestExperiencePrompts } from '@/lib/experiencePrompts';
import { projectItems } from '@/lib/siteContent';

const compose = (text: string) => composeLocal(text, resolveCanvasPlan(text, initialPlan(), 1));

describe('published Work growth', () => {
  it('opens a newly authored Work title without a hardcoded subject alias', () => {
    const text = 'What did Isaac contribute to Civic Access Fieldnotes?';
    expect(namedProjects(text)).toEqual(['civic-access-fieldnotes']);
    const spec = compose(text);
    expect(spec.blocks[0]).toMatchObject({ kind: 'story', projectIds: ['civic-access-fieldnotes'], focus: 'role' });
    expect(validateComposition(spec)).not.toBeNull();
  });

  it('offers grounded suggestions and retains the new subject through follow-ups', () => {
    expect(suggestExperiencePrompts('Civi')[0]?.id).toBe('published:civic-access-fieldnotes');
    const suggestions = suggestExperiencePrompts('Civic Access Fieldnotes');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every(item => item.id.startsWith('published:civic-access-fieldnotes'))).toBe(true);
    expect(new Set(suggestions.map(item => item.id)).size).toBe(suggestions.length);
    for (const suggestion of suggestions) expect(validateComposition(compose(suggestion.text))).not.toBeNull();
    const previous = compose('Explore Civic Access Fieldnotes');
    const followup = composeLocal('What were the outcomes?', initialPlan(), previous);
    expect(followup.blocks[0]).toMatchObject({ kind: 'story', projectIds: ['civic-access-fieldnotes'], focus: 'outcomes' });
    expect(suggestExperiencePrompts('what else', 4, { projectIds: ['civic-access-fieldnotes'], section: 0 }).every(item => item.id !== 'published:civic-access-fieldnotes:0')).toBe(true);
  });

  it('opens a new explicitly named section before an older lessons rule', () => {
    const project = projectItems.find(item => item.id === 'fulbright-focus-group-sponsored-by-openai')!;
    const spec = compose('Explore Lessons from accessible workshops in Taiwan');
    expect(spec.blocks[0]).toMatchObject({ kind: 'story', projectIds: [project.id], section: project.sections.length - 1 });
  });

  it('does not expose hidden work or photography suggestions', () => {
    expect(namedProjects('Explore Private Access Fieldnotes')).toEqual([]);
    expect(suggestExperiencePrompts('Private Access Fieldnotes').some(item => item.id.includes('private-fieldnotes'))).toBe(false);
    expect(suggestExperiencePrompts('Civic Access Fieldnotes photos')).toEqual([]);
  });
});
