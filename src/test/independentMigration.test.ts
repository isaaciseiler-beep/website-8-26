import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION } from '@/lib/canvas';
import { blankBlock, validateComposition } from '@/lib/genui';
import { readPortableView } from '@/lib/portfolioView';

// Independent adversarial regression captured after holdout first-run.
// Stable evidence may legitimately serve several requested facets.
describe('independent shared-view migration review', () => {
  it('migrates unchanged stable evidence reused across requested facets', () => {
    const sharedPassage = 'congressional-office-setup-100-day-report:paragraph:21c80816e489e15e';
    const composition = { blocks: [{ ...blankBlock('story'), projectIds: ['congressional-office-setup-100-day-report'], section: 5,
      answerPlan: { version: 1 as const, facets: [
        { kind: 'contribution' as const, status: 'supported' as const, evidenceIds: [sharedPassage] },
        { kind: 'process' as const, status: 'supported' as const, evidenceIds: [sharedPassage] },
        { kind: 'outcomes' as const, status: 'supported' as const, evidenceIds: [sharedPassage] },
      ] },
    }] };
    expect(validateComposition(composition)).not.toBeNull();
    const migrated = readPortableView({ version: 1, contentVersion: 'canvas-2026-10-31-v8', composition });
    expect(migrated.contentVersion).toBe(CONTENT_VERSION);
    expect(migrated.composition.blocks[0].answerPlan).toEqual(composition.blocks[0].answerPlan);
  });
});
