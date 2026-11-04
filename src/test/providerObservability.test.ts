import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankBlock } from '@/lib/genui';
import { hiddenProjectIds } from '@/lib/siteContent';
import { compositionLogEvidence, providerMetrics, providerHealth, providerRequest, recordProviderResult } from '../../server/provider-observability';

const projectId = 'congressional-office-setup-100-day-report';
const story = { ...blankBlock('story'), projectIds: [projectId], section: 3, paragraphIndices: [2], search: 'private visitor instruction https://private.example' };
afterEach(() => vi.restoreAllMocks());

describe('bounded public coverage diagnostics', () => {
  it('projects only known IDs, section indices, and authored layouts', () => {
    expect(compositionLogEvidence({ blocks: [story], visitorText: 'private' })).toEqual({ projectIds: [projectId], sections: [{ projectId, section: 3 }], layouts: ['project-brief'] });
    expect(JSON.stringify(compositionLogEvidence({ blocks: [story] }))).not.toMatch(/private|https:|search|paragraphIndices/);
  });

  it('drops unknown/hidden references and invalid section or layout combinations', () => {
    for (const invalid of [
      { ...story, projectIds: ['invented-private-project'] },
      { ...story, projectIds: [[...hiddenProjectIds][0]] },
      { ...story, section: 2000 },
      { ...story, section: -1 },
      { ...story, layout: 'benchmark-ranking' },
    ]) expect(compositionLogEvidence({ blocks: [invalid] })).toEqual({});
  });

  it('retains fixed bounds and deduplicates selected projects', () => {
    const valid = { blocks: [story, { ...story, section: 2 }, { ...story, section: 1 }] };
    const evidence = compositionLogEvidence(valid);
    expect(evidence.projectIds).toEqual([projectId]);
    expect(evidence.sections).toHaveLength(3);expect(evidence.layouts).toHaveLength(3);
    expect(compositionLogEvidence({ blocks: [...valid.blocks, story] })).toEqual({});
  });

  it('logs source references without retaining raw visitor text or treating cache use as a health check', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const before = providerHealth('mistral');
    const request = providerRequest('mistral', 'private visitor question');
    recordProviderResult(request, { status: 'healthy', cached: true, model: 'fixture', ...compositionLogEvidence({ blocks: [story] }) });
    const logged = JSON.parse(info.mock.calls[0][0] as string);
    expect(logged).toMatchObject({ event: 'portfolio.provider', cached: true, projectIds: [projectId], sections: [{ projectId, section: 3 }] });
    expect(logged.questionHash).toMatch(/^[a-f0-9]{16}$/);
    expect(JSON.stringify(logged)).not.toMatch(/private|https:|search|paragraphIndices/);
    expect(providerHealth('mistral')).toEqual(before);
  });
  it('drops unknown references at the final log boundary even if a caller bypasses the composition helper', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordProviderResult(providerRequest('mistral', 'private query'), { status: 'healthy', cached: true,
      projectIds: [projectId, 'private unknown project'],
      sections: [{ projectId, section: 1 }, { projectId: 'private unknown project', section: 0 }, { projectId, section: 999 }],
      layout: 'private unknown layout',
    });
    const logged = JSON.parse(info.mock.calls[0][0] as string);
    expect(logged).toMatchObject({ projectIds: [projectId], sections: [{ projectId, section: 1 }] });
    expect(logged).not.toHaveProperty('layout');
    expect(JSON.stringify(logged)).not.toContain('private');
  });
  it('uses ephemeral keyed hashes and allows only bounded timing and error categories',()=>{
    const info=vi.spyOn(console,'info').mockImplementation(()=>{});
    const one=providerRequest('mistral','private visitor question');
    expect(providerRequest('mistral','private visitor question').questionHash).toBe(one.questionHash);
    recordProviderResult(one,{status:'healthy',cached:true,reason:'private URL https://private.example',errorType:'PrivateSecretError',timings:{adviceMs:12,firstSelectionMs:NaN,totalMs:Infinity}});
    const log=JSON.parse(info.mock.calls[0][0] as string);
    expect(log.timings).toEqual({adviceMs:12});expect(log).not.toHaveProperty('reason');expect(log).not.toHaveProperty('errorType');expect(JSON.stringify(log)).not.toContain('private');
  });
  it('keeps instance latency observations bounded and separates cache hits',()=>{
    vi.spyOn(console,'info').mockImplementation(()=>{});
    const before=providerMetrics('mistral');
    const request=providerRequest('mistral','fixed public test');
    for(let i=0;i<70;i++)recordProviderResult(request,{status:'healthy',duration:i});
    recordProviderResult(request,{status:'healthy',duration:0,cached:true});
    expect(providerMetrics('mistral')).toMatchObject({scope:'process',calls:before.calls+70,cacheHits:before.cacheHits+1,latencySamples:64,p50Ms:37,p95Ms:66});
  });
  it('retains only known provider parameters and diagnostic categories at the log boundary',()=>{
    const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
    const request=providerRequest('mistral','private visitor question');
    recordProviderResult(request,{status:'unavailable',providerParameter:'max_tokens',providerDiagnostic:'output_token_limit'});
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toMatchObject({providerParameter:'max_tokens',providerDiagnostic:'output_token_limit'});
    recordProviderResult(request,{status:'unavailable',providerParameter:'alice@private.example',providerDiagnostic:'sk-secret-example https://private.example'});
    const log=JSON.parse(warn.mock.calls[1][0] as string);
    expect(log).not.toHaveProperty('providerParameter');expect(log).not.toHaveProperty('providerDiagnostic');
    expect(JSON.stringify(log)).not.toMatch(/alice@|sk-secret|https:|private/);
  });
  it('keeps last-failure health diagnostics bounded and clears them on a healthy uncached result',()=>{
    vi.spyOn(console,'warn').mockImplementation(()=>{});vi.spyOn(console,'info').mockImplementation(()=>{});
    const request=providerRequest('mistral','private visitor question');
    recordProviderResult(request,{status:'unavailable',reason:'invalid_output',errorType:'AI_NoObjectGeneratedError',providerDiagnostic:'output_token_limit'});
    expect(providerHealth('mistral')).toMatchObject({status:'unavailable',reason:'invalid_output',errorType:'AI_NoObjectGeneratedError',diagnostic:'output_token_limit'});
    recordProviderResult(request,{status:'healthy',cached:true});
    expect(providerHealth('mistral')).toHaveProperty('diagnostic','output_token_limit');
    recordProviderResult(request,{status:'unavailable',errorType:'alice@private.example',providerDiagnostic:'sk-private'});
    expect(JSON.stringify(providerHealth('mistral'))).not.toMatch(/alice@|sk-private|diagnostic|errorType/);
    recordProviderResult(request,{status:'healthy'});
    expect(providerHealth('mistral')).not.toHaveProperty('errorType');expect(providerHealth('mistral')).not.toHaveProperty('diagnostic');
  });

});
