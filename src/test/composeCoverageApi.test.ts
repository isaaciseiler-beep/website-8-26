import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTENT_VERSION, initialPlan, publicProjects } from '@/lib/canvas';
import { blankBlock, composeLocal, resolveCanvasPlan, validateComposition } from '@/lib/genui';
import type { ApiRequest, ApiResponse } from '../../server/http';
import { portfolioSectionQuestions } from './fixtures/portfolioSectionQuestions';
const { stream } = vi.hoisted(() => ({ stream: vi.fn() }));
vi.mock('ai', () => ({ streamText: stream, Output: { object: (value: unknown) => value } }));
vi.mock('@ai-sdk/mistral', () => ({ createMistral: () => () => ({}) }));
vi.mock('../../server/jev-composition-advice', () => ({ jevCompositionAdvice: async () => null }));
import handler from '../../api/compose';
import { clearCompositionCache } from '../../server/composition-policy';

let requestNumber = 0;
beforeEach(() => { vi.stubEnv('MISTRAL_API_KEY', 'test-only'); stream.mockReset(); clearCompositionCache(); vi.spyOn(console, 'info').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('provider-to-renderer evidence coverage contract', () => {
  it('keeps a topic-rich question for every public section in the evaluation corpus', () => {
    const covered = portfolioSectionQuestions.map(item => `${item.projectId}:section:${item.section}`);
    expect(new Set(covered).size).toBe(32);
    expect(covered).toEqual(publicProjects.flatMap(project => project.sections.map((_, index) => `${project.id}:section:${index}`)));
  });

  // The model choice is mocked deliberately. These tests establish that correct
  // provider evidence survives the API contract, not live semantic model quality.
  it.each(portfolioSectionQuestions)('$projectId / $section: $question', async ({ projectId, section, question, paragraphIndices }) => {
    const chosen = { supported: true, blocks: [{ ...blankBlock('story'), layout: 'project-evidence' as const, focus: 'evidence' as const, projectIds: [projectId], section, ...(paragraphIndices ? { paragraphIndices } : {}) }] };
    expect(validateComposition(chosen)).not.toBeNull();
    stream.mockReturnValue({ partialOutputStream: (async function* () { yield chosen; })(), output: Promise.resolve(chosen), usage: Promise.resolve({}) });
    const baseline = composeLocal(question, resolveCanvasPlan(question, initialPlan(), 9));
    let output = '';
    const response = Object.assign(new EventEmitter(), { statusCode: 0, setHeader: vi.fn(), write: (text: string) => { output += text; }, end: (text = '') => { output += text; }, destroyed: false, writableEnded: false });
    await handler({ method: 'POST', body: { draft: question, revision: 9, contentVersion: CONTENT_VERSION, current: baseline, proposed: baseline }, headers: { host: 'localhost' }, socket: { remoteAddress: `coverage-${requestNumber++}` } } as unknown as ApiRequest, response as unknown as ApiResponse);
    expect(response.statusCode).toBe(200);
    const events = output.trim().split('\n').map(line => JSON.parse(line));
    const final = events.at(-1);
    expect(final).toMatchObject({ type: 'composition', partial: false, revision: 9, contentVersion: CONTENT_VERSION });
    expect(final.composition.blocks).toEqual([expect.objectContaining({ kind: 'story', projectIds: [projectId], section })]);
    if (paragraphIndices) expect(final.composition.blocks[0].paragraphIndices).toEqual(paragraphIndices);
    expect(validateComposition(final.composition)).not.toBeNull();
    const prompt = JSON.parse(stream.mock.calls[0][0].prompt);
    expect(prompt.request).toBe(question);
    const evidence = prompt.catalog.find((project: { id: string }) => project.id === projectId).sections[section];
    expect(evidence.evidence.length).toBeGreaterThan(0);
    if (paragraphIndices) for (const index of paragraphIndices) expect(evidence.evidence).toContain(`Paragraph ${index}:`);
  });
});
