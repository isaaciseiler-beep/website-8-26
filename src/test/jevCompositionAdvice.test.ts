import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { blankBlock } from '@/lib/genui';
import { portfolioCatalog } from '@/lib/portfolioEvidence';
import { portfolioConnections } from '@/lib/portfolioConnections';

let advise:typeof import('../../server/jev-composition-advice').jevCompositionAdvice;
const current={blocks:[blankBlock('timeline')]};
const first=portfolioCatalog[0].sections[0];
const choice=(value:string)=>({choice:value,probabilities:{[value]:.7},confidence:.4});
const response=()=>new Response(JSON.stringify({model:'mock-jev',answers:{evidence:choice(first.id),experience:choice('timeline'),connection:choice('systems')}}));
beforeEach(async()=>{
  vi.resetModules();
  vi.stubEnv('TYPESAFE_API_KEY','test-only');
  vi.stubEnv('JEV_COMPOSITION_ADVICE','');
  ({jevCompositionAdvice:advise}=await import('../../server/jev-composition-advice'));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.useRealTimers();});

describe('optional Jev composition advice',()=>{
  it('returns only known evidence, experience and connection IDs with uncertainty',async()=>{
    const fetcher=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>response());vi.stubGlobal('fetch',fetcher);
    const result=await advise('What connects Isaac’s work?',current,new AbortController().signal);
    expect(result).toMatchObject({provider:'jev',model:'mock-jev',evidence:{projectId:portfolioCatalog[0].id,section:0,probability:.7,confidence:.4},experience:{kind:'timeline'},connection:{connectionId:'systems'}});
    const body=JSON.parse(fetcher.mock.calls[0][1]!.body as string);
    expect(Object.keys(body.questions.connection.criteria)).toEqual(['none',...Object.keys(portfolioConnections)]);
    expect(Object.keys(body.questions.evidence.criteria)).toEqual(['none',...portfolioCatalog.flatMap(project=>project.sections.map(section=>section.id))]);
    expect(JSON.parse(body.state).currentView).not.toHaveProperty('albums');
    expect(JSON.stringify(body)).not.toContain('albumIds');
  });
  it.each(['hello','Show photos from Taiwan'])('does not evaluate requests outside generation: %s',async draft=>{
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
    expect(await advise(draft,current,new AbortController().signal)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not evaluate local controls or unconfigured/disabled advice',async()=>{
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
    expect(await advise('use preparedness',{blocks:[blankBlock('benchmark')]},new AbortController().signal)).toBeNull();
    vi.stubEnv('TYPESAFE_API_KEY','');
    expect(await advise('Explain Isaac’s work',current,new AbortController().signal)).toBeNull();
    vi.stubEnv('TYPESAFE_API_KEY','test-only');vi.stubEnv('JEV_COMPOSITION_ADVICE','off');
    expect(await advise('Explain Isaac’s work',current,new AbortController().signal)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('discards invented candidate IDs instead of sending them to the composer',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({answers:{evidence:choice('invented:section:99'),experience:choice('lesson-planner'),connection:choice('invented')}}))));
    expect(await advise('Explain a program',current,new AbortController().signal)).toBeNull();
  });
  it('fails open on provider errors and malformed uncertainty',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response('upstream private response',{status:429})).mockResolvedValueOnce(new Response(JSON.stringify({answers:{experience:{choice:'story',probabilities:{story:8}}}})));
    vi.stubGlobal('fetch',fetcher);
    expect(await advise('First question',current,new AbortController().signal)).toBeNull();
    expect(await advise('Second question',current,new AbortController().signal)).toBeNull();
  });
  it('bounds latency even if an evaluator transport ignores its abort signal',async()=>{
    vi.useFakeTimers();
    const fetcher=vi.fn((_input:RequestInfo|URL,_init?:RequestInit)=>new Promise<Response>(()=>{}));vi.stubGlobal('fetch',fetcher);
    const pending=advise('A slow advisory question',current,new AbortController().signal);
    await vi.advanceTimersByTimeAsync(751);
    expect(await pending).toBeNull();
    expect(fetcher.mock.calls[0][1]!.signal.aborted).toBe(true);
  });
  it('cancels immediately and does not cache a canceled evaluation',async()=>{
    const controller=new AbortController();
    const fetcher=vi.fn().mockImplementationOnce(()=>new Promise<Response>(()=>{})).mockResolvedValueOnce(response());vi.stubGlobal('fetch',fetcher);
    const pending=advise('The same question',current,controller.signal);
    controller.abort();
    expect(await pending).toBeNull();
    expect(await advise('The same question',current,new AbortController().signal)).not.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('reuses successful advice but treats changed control context as a different request',async()=>{
    const fetcher=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>response());vi.stubGlobal('fetch',fetcher);
    await advise('Question',current,new AbortController().signal);
    await advise('Question',current,new AbortController().signal);
    await advise('Question',{blocks:[{...current.blocks[0],focus:'outcomes'}]},new AbortController().signal);
    await advise('Question',{blocks:[{...current.blocks[0],section:1}]},new AbortController().signal);
    await advise('Question',{blocks:[{...current.blocks[0],region:'Midwest'}]},new AbortController().signal);
    expect(fetcher).toHaveBeenCalledTimes(4);
    const changed=JSON.parse(JSON.parse(fetcher.mock.calls[3][1]!.body as string).state).currentView[0];
    expect(changed).toMatchObject({section:0,region:'Midwest',metric:'compositeScore',roleId:'',search:'',band:null});
    expect(changed).not.toHaveProperty('albumIds');
  });
});
