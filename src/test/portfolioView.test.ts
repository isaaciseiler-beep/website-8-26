import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION } from '@/lib/canvas';
import { POLICY_ID, TAIWAN_ID } from '@/lib/genui';
import { applyPortfolioAction, changeHistory, createPortableView, decodeView, encodeView, portfolioActionForRequest, readPortableView, travelHistory, viewUrl } from '@/lib/portfolioView';

const story = () => applyPortfolioAction(null, { type: 'open_project', projectId: TAIWAN_ID, focus: 'process' });
describe('portable portfolio views', () => {
  it('opens the requested focus section and preserves explicit section choices', () => {
    const projectId = 'boehringer-cares-foundation-rebrand-strategy-shift';
    const opened = applyPortfolioAction(null, { type: 'open_project', projectId, focus: 'outcomes' });
    expect(opened.composition.blocks[0]).toMatchObject({ focus: 'outcomes', section: 3 });
    const composed = applyPortfolioAction(null, { type: 'compose', modules: [{ kind: 'story', projectIds: [projectId], focus: 'outcomes' }] });
    expect(composed.composition.blocks[0].section).toBe(3);
    const explicit = applyPortfolioAction(null, { type: 'compose', modules: [{ kind: 'story', projectIds: [projectId], focus: 'outcomes', section: 2 }] });
    expect(explicit.composition.blocks[0].section).toBe(2);
    expect(applyPortfolioAction(opened, { type: 'update_module', index: 0, changes: { focus: 'process' } }).composition.blocks[0].section).toBe(1);
    expect(applyPortfolioAction(opened, { type: 'update_module', index: 0, changes: { focus: 'process', section: 2 } }).composition.blocks[0].section).toBe(2);
    const passage = applyPortfolioAction(null, { type: 'compose', modules: [{ kind: 'story', projectIds: [projectId], focus: 'process', section: 2, paragraphIndices: [0] }] });
    expect(applyPortfolioAction(passage, { type: 'update_module', index: 0, changes: { layout: 'project-outcomes' } }).composition.blocks[0]).toMatchObject({ section: 3, paragraphIndices: undefined });
    expect(applyPortfolioAction(passage, { type: 'update_module', index: 0, changes: { projectIds: [projectId], focus: 'process', layout: 'project-process', expanded: true } }).composition.blocks[0]).toMatchObject({ section: 2, paragraphIndices: [0], expanded: true });
  });
  it('preserves the first module and its controls through append, reorder, edit and remove', () => {
    const original = applyPortfolioAction(null, { type: 'compose', modules: [{ kind: 'benchmark', states: ['Michigan', 'California'], layout: 'benchmark-compare', metric: 'preparednessScore' }] });
    const appended = applyPortfolioAction(original, { type: 'open_project', projectId: TAIWAN_ID, append: true });
    expect(appended.composition.blocks[0]).toEqual(original.composition.blocks[0]);
    const edited = applyPortfolioAction(appended, { type: 'update_module', index: 1, changes: { layout: 'project-process', section: 1 } });
    expect(edited.composition.blocks[1].focus).toBe('process');
    expect(edited.composition.blocks[0]).toEqual(original.composition.blocks[0]);
    const moved = applyPortfolioAction(edited, { type: 'move_module', from: 1, to: 0 });
    expect(moved.composition.blocks[0]).toEqual(edited.composition.blocks[1]);
    expect(applyPortfolioAction(moved, { type: 'remove_module', index: 0 })).toEqual(original);
  });
  it('rejects unknown references, prohibited kinds, incompatible layouts, oversized and empty views atomically', () => {
    const view = story(); const snapshot = JSON.stringify(view);
    const invalid = [
      { type: 'open_project', projectId: 'invented' },
      { type: 'compose', modules: [{ kind: 'photos' }] },
      { type: 'compose', modules: [{ kind: 'workshop', projectIds: [TAIWAN_ID] }] },
      { type: 'compose', modules: [{ kind: 'story', projectIds: [TAIWAN_ID], layout: 'benchmark-ranking' }] },
      { type: 'compose', modules: [{ kind: 'benchmark', layout: 'benchmark-compare', states: ['Michigan'] }] },
      { type: 'compose', modules: [{ kind: 'benchmark', states: ['Invented'] }] },
      { type: 'compose', modules: [{ kind: 'architecture', section: 4 }] },
      { type: 'compose', modules: [{ kind: 'contact', html: '<script>bad</script>' }] },
      { type: 'compose', modules: Array.from({ length: 4 }, () => ({ kind: 'contact' })) },
      { type: 'remove_module', index: 0 },
      { type: 'move_module', from: 0, to: 2 },
      { type: 'compare_projects', projectIds: [POLICY_ID, POLICY_ID] },
      { type: 'update_module', index: 0, changes: { section: 2000 } },
    ];
    for (const action of invalid) expect(() => applyPortfolioAction(view, action), JSON.stringify(action)).toThrow();
    expect(JSON.stringify(view)).toBe(snapshot);
  });
  it('roundtrips Unicode controls with no draft or provider metadata and rejects stale links', () => {
    const view = applyPortfolioAction(story(), { type: 'update_module', index: 0, changes: { search: '臺灣 · Isaac’s work 👋', focus: 'evidence' } });
    const clean = createPortableView({ ...view.composition, draft: 'PRIVATE DRAFT', provider: 'internal' });
    expect(decodeView(encodeView(clean))).toEqual(view);
    const url = new URL(viewUrl(clean, 'https://seiler.page/?album=japan'));
    expect(url.pathname).toBe('/'); expect(url.search).toBe('');
    expect(JSON.stringify(decodeView(url.hash.slice(6)))).not.toContain('PRIVATE');
    expect(() => readPortableView({ ...view, contentVersion: CONTENT_VERSION + '-old' })).toThrow();
    for (const invalid of ['bad!', 'x'.repeat(10001), btoa('{}')]) expect(() => decodeView(invalid)).toThrow();
  });
  it('bounds undo history and invalidates redo on a new edit', () => {
    let history = { past: [] as number[], present: 0, future: [] as number[] };
    for (let i = 1; i <= 30; i++) history = changeHistory(history, i);
    expect(history.past).toHaveLength(20);
    expect(travelHistory(travelHistory(history, 'back'), 'forward')).toEqual(history);
    expect(changeHistory(travelHistory(history, 'back'), 99).future).toEqual([]);
  });
  it('recognizes only explicit local composition edits', () => {
    const original = applyPortfolioAction(null, { type: 'open_project', projectId: POLICY_ID });
    const action = portfolioActionForRequest('Add the Taiwan project process', original);
    expect(action).toMatchObject({ type: 'open_project', projectId: TAIWAN_ID, append: true, focus: 'process' });
    const next = applyPortfolioAction(original, action);
    expect(portfolioActionForRequest('Remove the second view', next)).toEqual({ type: 'remove_module', index: 1 });
    expect(portfolioActionForRequest('Add something about photography', original)).toBeNull();
    expect(portfolioActionForRequest('Tell me about Taiwan', original)).toBeNull();
  });
});
