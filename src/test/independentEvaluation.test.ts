import { describe, expect, it } from 'vitest';
import { blankBlock, validateComposition } from '@/lib/genui';
import { scoreCase, summarizeEvaluation } from '../../scripts/portfolio-evaluation.mjs';
import { evaluateReleaseGate } from '../../scripts/portfolio-quality.mjs';

// Independent adversarial regression: a correct requested story cannot hide
// an unsolicited second subject from the release gate.
describe('independent evaluation adversarial review', () => {
  it('does not release-pass a requested project answer that also includes an unrelated project', () => {
    const projectId = 'senior-thesis-local-journalism';
    const test = { id: 'independent-extra-module', question: 'Show the journalism thesis.', projectId, section: 0 };
    const composition = { blocks: [
      { ...blankBlock('story'), projectIds: [projectId] },
      { ...blankBlock('story'), projectIds: ['boehringer-cares-foundation-rebrand-strategy-shift'] },
    ] };
    expect(validateComposition(composition)).not.toBeNull();
    const row = { id: test.id, ...scoreCase(test, { composition }), provenance: 'local_authored' };
    const report = summarizeEvaluation([test], [row], { corpus: 'independent', mode: 'authored' });
    expect(evaluateReleaseGate(report).passed).toBe(false);
  });
});
