import { describe, expect, it, vi } from 'vitest';
import { CONTENT_VERSION } from '@/lib/canvas';
import { blankBlock, validateComposition } from '@/lib/genui';
import { evaluateAuthored, evaluateDeployment, evaluationOptions, responseProvenance, scoreCase, summarizeEvaluation } from '../../scripts/portfolio-evaluation.mjs';

const projectId = 'congressional-office-setup-100-day-report';
const testCase = { projectId, section: 1, question: 'How did Isaac learn what reporters needed?', paragraphIndices: [2, 3] };
const composition = { blocks: [{ ...blankBlock('story'), projectIds: [projectId], section: 1, paragraphIndices: [2, 3] }] };
const runtime = { contentVersion: CONTENT_VERSION, compose: () => composition, validate: validateComposition, guidance: () => null, plan: () => ({ layout: 'detail' }) };
const liveEnv = { PORTFOLIO_EVAL_MODE: 'live', PORTFOLIO_EVAL_ALLOW_MODEL_CALLS: '1', PORTFOLIO_EVAL_URL: 'https://seiler.page' };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

describe('safe portfolio evaluation and provenance', () => {
  it('defaults to offline full-corpus evaluation and never infers model authorization from a URL or one flag', () => {
    expect(evaluationOptions({}, 32)).toMatchObject({ mode: 'authored', limit: 32, maxPostRequests: 0, composeLimit: 0 });
    expect(evaluationOptions({ PORTFOLIO_EVAL_URL: 'https://seiler.page', PORTFOLIO_EVAL_ALLOW_MODEL_CALLS: '1' }, 32).mode).toBe('authored');
    expect(() => evaluationOptions({ PORTFOLIO_EVAL_MODE: 'live', PORTFOLIO_EVAL_URL: 'https://seiler.page' }, 32)).toThrow('ALLOW_MODEL_CALLS=1');
    expect(() => evaluationOptions({ PORTFOLIO_REQUIRE_LIVE: '1', PORTFOLIO_EVAL_URL: 'https://seiler.page' }, 32)).toThrow('ALLOW_MODEL_CALLS=1');
  });

  it('defaults an explicitly authorized live run to one case and two endpoint POSTs', () => {
    expect(evaluationOptions(liveEnv, 32)).toMatchObject({ mode: 'live', limit: 1, composeLimit: 1, maxPostRequests: 2, intervalMs: 6000 });
    expect(evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: '32' }, 32)).toMatchObject({ limit: 32, maxPostRequests: 64 });
    expect(evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: '0' }, 32)).toMatchObject({ limit: 0, maxPostRequests: 0 });
  });

  it.each(['NaN', '-1', '2.5', 'Infinity'])('does not turn invalid limits into an unlimited run: %s', value => {
    expect(() => evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: value }, 32)).toThrow('must be an integer');
  });

  it('rejects credential-bearing URLs before any request can occur', () => {
    expect(() => evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_URL: 'https://private:secret@seiler.page' }, 32)).toThrow('without credentials');
  });

  it('separates section correctness, any editorial paragraph coverage, and exact paragraph targets', () => {
    const oneParagraph = { blocks: [{ ...composition.blocks[0], paragraphIndices: [3] }] };
    expect(scoreCase(testCase, { composition: oneParagraph })).toMatchObject({ ok: true, strictOk: false, selectionMatch: true, sectionMatch: true, paragraphAnyMatch: true, paragraphMatch: false });
    const wrongSection = { blocks: [{ ...composition.blocks[0], section: 2 }] };
    expect(scoreCase(testCase, { composition: wrongSection })).toMatchObject({ ok: false, selectionMatch: true, sectionMatch: false, paragraphMatch: false });
    expect(scoreCase(testCase, { composition, guidance: 'unmatched' })).toMatchObject({ ok: false, support: 'unsupported', selectionMatch: false });
  });
  it('reports every actual module even when the requested subject is absent', () => {
    const other = { ...composition.blocks[0], projectIds: ['senior-thesis-local-journalism'] };
    expect(scoreCase(testCase, { composition: { blocks: [other] } })).toMatchObject({ ok: false, selected: null, selectedModules: [{ projectIds: other.projectIds, paragraphIndices: [2, 3] }] });
    expect(scoreCase(testCase, { composition: { blocks: [...composition.blocks, other] } }).selectedModules).toHaveLength(2);
  });

  it('never treats configuration, a cache, or a mocked transport as fresh provider execution', () => {
    expect(responseProvenance({ routed: { composerConfigured: true } })).toBe('configuration_only');
    expect(responseProvenance({ final: { model: 'mistral', cached: true } })).toBe('provider_cache');
    expect(responseProvenance({ final: { model: 'mistral', local: true } })).toBe('api_authored');
    expect(responseProvenance({ transport: 'mocked', final: { model: 'mistral' } })).toBe('mocked_transport');
    expect(responseProvenance({ final: { model: 'mistral' } })).toBe('provider_reported');
    expect(responseProvenance({ final: { model: { private: 'unknown metadata' } } })).toBe('unverified_response');
    expect(responseProvenance({ final: { model: 'https://private.example' } })).toBe('unverified_response');
  });

  it('keeps all expected project/section targets visible even in a one-case report', () => {
    const second = { ...testCase, section: 2, paragraphIndices: undefined };
    const row = { id: `${projectId}:section:1`, ...scoreCase(testCase, { composition }), provenance: 'mocked_transport' };
    const report = summarizeEvaluation([testCase, second], [row]);
    expect(report).toMatchObject({ cases: 2, selected: 1, notSelected: 1, sectionMatches: 1 });
    expect(report.coverage[0]).toMatchObject({ expectedSections: [1, 2], evaluatedSections: [1], matchedSections: [1], providerReportedSections: [], expectedParagraphs: ['1:2', '1:3'], matchedParagraphs: ['1:2', '1:3'] });
    expect(summarizeEvaluation([testCase], [{ ...row, provenance: 'router_provider_reported' }]).coverage[0].providerReportedParagraphs).toEqual([]);
  });

  it('runs authored evaluation without even using global fetch', () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network must not be touched'));
    try {
      const report = evaluateAuthored([testCase], runtime, evaluationOptions({}, 1));
      expect(report).toMatchObject({ passed: 1, postRequests: 0, provenance: { local_authored: 1 } });
      expect(fetcher).not.toHaveBeenCalled();
    } finally { fetcher.mockRestore(); }
  });

  it('stops at the read-only version check before any model-capable POST on a stale deployment', async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => json({ contentVersion: 'old-version' }));
    const result = await evaluateDeployment([testCase], runtime, evaluationOptions(liveEnv, 1), { fetchImpl: fetcher, transport: 'mocked' });
    expect(result).toMatchObject({ error: 'content_version_mismatch', postRequests: 0 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0]).toBe('https://seiler.page/api/public/profile');
  });

  it('executes only the explicitly selected case and labels mocked provider-shaped replies correctly', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      if (url.endsWith('/api/intent')) return json({ composition, needsComposition: true, composerConfigured: true });
      return new Response(JSON.stringify({ type: 'composition', composition, partial: false, revision: 1, contentVersion: CONTENT_VERSION, model: 'fixture-model' }) + '\n');
    });
    const result = await evaluateDeployment([testCase, { ...testCase, section: 2 }], runtime, evaluationOptions(liveEnv, 2), { fetchImpl: fetcher, transport: 'mocked' });
    expect(result).toMatchObject({ cases: 2, selected: 1, notSelected: 1, passed: 1, postRequests: 2, compositionRequests: 1, provenance: { mocked_transport: 1 } });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(result.coverage[0].providerReportedSections).toEqual([]);
  });

  it('honors the total endpoint POST budget before a composition call', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      return json({ composition, needsComposition: true });
    });
    const options = evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_MAX_POST_REQUESTS: '1' }, 1);
    const result = await evaluateDeployment([testCase], runtime, options, { fetchImpl: fetcher, transport: 'mocked' });
    expect(result).toMatchObject({ postRequests: 1, skipped: 1, compositionRequests: 0 });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('ignores stale stream events instead of reporting their selection as a successful result', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      if (url.endsWith('/api/intent')) return json({ composition, needsComposition: true });
      return new Response(JSON.stringify({ type: 'composition', composition, partial: false, revision: 0, contentVersion: CONTENT_VERSION, model: 'fixture-model' }) + '\n');
    });
    const result = await evaluateDeployment([testCase], runtime, evaluationOptions(liveEnv, 1), { fetchImpl: fetcher, transport: 'mocked' });
    expect(result.results[0]).toMatchObject({ ok: false, error: 'incomplete_composition' });
  });

  it('does not make requests for an explicitly empty live selection', async () => {
    const fetcher = vi.fn();
    const result = await evaluateDeployment([testCase], runtime, evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: '0' }, 1), { fetchImpl: fetcher });
    expect(result).toMatchObject({ selected: 0, postRequests: 0 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('evaluates a follow-up with the previous successful view in both routing and composition requests', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      if (url.endsWith('/api/intent')) return json({ composition, needsComposition: true });
      const body = JSON.parse(init!.body as string);
      return new Response(JSON.stringify({ type: 'composition', composition, partial: false, revision: body.revision, contentVersion: CONTENT_VERSION, model: 'fixture-model' }) + '\n');
    });
    const cases = [{ ...testCase, id: 'first' }, { ...testCase, id: 'followup', follows: 'first', question: 'Show the sources for that.' }];
    const result = await evaluateDeployment(cases, runtime, evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: '2' }, 2), { fetchImpl: fetcher, transport: 'mocked', pause: async () => {} });
    expect(result).toMatchObject({ passed: 2, postRequests: 4 });
    const requests = fetcher.mock.calls.filter(([, init]) => init?.method === 'POST').map(([url, init]) => ({ url, body: JSON.parse(init!.body as string) }));
    expect(requests[2]).toMatchObject({ body: { composition } });
    expect(requests[3]).toMatchObject({ body: { current: composition } });
  });

  it('never substitutes a fresh initial view when follow-up context was unavailable', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      return json({}, 503);
    });
    const cases = [{ ...testCase, id: 'failed' }, { ...testCase, id: 'followup', follows: 'failed' }];
    const result = await evaluateDeployment(cases, runtime, evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: '2' }, 2), { fetchImpl: fetcher, transport: 'mocked', pause: async () => {} });
    expect(result).toMatchObject({ failed: 1, skipped: 1, postRequests: 1 });
    expect(result.results[1]).toMatchObject({ skipped: 'followup_context_unavailable' });
  });
  it('does not let a stale failed composer fall back into the next conversational context', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      if (url.endsWith('/api/intent')) return json({ composition, needsComposition: true });
      return new Response(JSON.stringify({ type: 'composition', composition, partial: false, revision: 0, contentVersion: CONTENT_VERSION, model: 'fixture-model' }) + '\n');
    });
    const cases = [{ ...testCase, id: 'stale' }, { ...testCase, id: 'followup', follows: 'stale' }];
    const result = await evaluateDeployment(cases, runtime, evaluationOptions({ ...liveEnv, PORTFOLIO_EVAL_LIMIT: '2' }, 2), { fetchImpl: fetcher, transport: 'mocked', pause: async () => {} });
    expect(result).toMatchObject({ failed: 1, skipped: 1, postRequests: 2 });
    expect(result.results[0]).toMatchObject({ error: 'incomplete_composition' });
    expect(result.results[1]).toMatchObject({ skipped: 'followup_context_unavailable' });
  });

  it('passes context to the actual authored planner for an offline conversational test', () => {
    const compose = vi.fn(() => composition);
    const plan = vi.fn(() => ({ layout: 'detail' }));
    const cases = [{ ...testCase, id: 'first' }, { ...testCase, id: 'followup', follows: 'first' }];
    const report = evaluateAuthored(cases, { ...runtime, compose, plan }, evaluationOptions({}, 2));
    expect(report).toMatchObject({ passed: 2, postRequests: 0 });
    expect(compose).toHaveBeenNthCalledWith(2, testCase.question, 0, composition);
    expect(plan).toHaveBeenNthCalledWith(2, testCase.question, 0, composition);
  });
  it('does not score an invalid routing-only composition as a successful answer', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose')) return json({ configured: false });
      return json({ composition: { blocks: [{ ...composition.blocks[0], projectIds: projectId }] }, needsComposition: false });
    });
    const result = await evaluateDeployment([testCase], runtime, evaluationOptions(liveEnv, 1), { fetchImpl: fetcher, transport: 'mocked' });
    expect(result.results[0]).toMatchObject({ ok: false, error: 'invalid_routing_composition' });
  });
  it('does not accept a stream containing conflicting final guidance and composition events', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      if (url.endsWith('/api/intent')) return json({ composition, needsComposition: true });
      return new Response([
        { type: 'composition', composition, partial: false, revision: 1, contentVersion: CONTENT_VERSION, model: 'fixture' },
        { type: 'guidance', guidance: 'unmatched', revision: 1, contentVersion: CONTENT_VERSION, model: 'fixture' },
      ].map(event => JSON.stringify(event)).join('\n') + '\n');
    });
    const result = await evaluateDeployment([testCase], runtime, evaluationOptions(liveEnv, 1), { fetchImpl: fetcher, transport: 'mocked' });
    expect(result.results[0]).toMatchObject({ ok: false, error: 'conflicting_terminal_events' });
  });
  it('keeps unknown server failure strings out of the report', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/public/profile')) return json({ contentVersion: CONTENT_VERSION });
      if (url.endsWith('/api/compose') && !init?.method) return json({ configured: true });
      if (url.endsWith('/api/intent')) return json({ composition, needsComposition: true });
      return new Response(JSON.stringify({ type: 'unavailable', reason: 'private upstream failure https://private.example', revision: 1, contentVersion: CONTENT_VERSION }) + '\n');
    });
    const result = await evaluateDeployment([testCase], runtime, evaluationOptions(liveEnv, 1), { fetchImpl: fetcher, transport: 'mocked' });
    expect(result.results[0]).toMatchObject({ ok: false, error: 'provider_unavailable' });
    expect(JSON.stringify(result)).not.toContain('private');
  });
});
