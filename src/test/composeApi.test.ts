import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiRequest, ApiResponse } from '../../server/http';
import { blankBlock, composeLocal, resolveCanvasPlan } from '@/lib/genui';
import { CONTENT_VERSION, initialPlan } from '@/lib/canvas';
const {stream,advice}=vi.hoisted(()=>({stream:vi.fn(),advice:vi.fn()}));
vi.mock('ai',()=>({streamText:stream,Output:{object:(v:unknown)=>v}}));
vi.mock('@ai-sdk/mistral',()=>({createMistral:()=>()=>({})}));
vi.mock('../../server/jev-composition-advice',()=>({jevCompositionAdvice:advice}));
import { clearCompositionCache } from '../../server/composition-policy';
import { providerHealth } from '../../server/provider-observability';
import handler from '../../api/compose';
const spec={blocks:[{...blankBlock('benchmark'),layout:'benchmark-compare' as const,states:['Michigan','California']}]};
let requestNumber=0;
async function call(body:unknown,origin?:string,setup?:(response:EventEmitter)=>void){
  let output='';const response=Object.assign(new EventEmitter(),{statusCode:0,setHeader:vi.fn(),write:(chunk:string)=>{output+=chunk;},end:(chunk='')=>{output+=chunk;},destroyed:false,writableEnded:false});
  setup?.(response);
  await handler({method:'POST',body,headers:{host:'localhost',origin},socket:{remoteAddress:'compose-test-'+requestNumber++}} as unknown as ApiRequest,response as unknown as ApiResponse);
  return {status:response.statusCode,events:output.trim().split('\n').map(v=>JSON.parse(v))};
}
const request=()=>({draft:'Compare Michigan and California',revision:7,contentVersion:CONTENT_VERSION,current:spec,proposed:spec});
describe('composition API',()=>{
  beforeEach(()=>{vi.stubEnv('MISTRAL_API_KEY','test-only-key');stream.mockReset();advice.mockReset();advice.mockResolvedValue(null);clearCompositionCache();});
  afterEach(()=>vi.unstubAllEnvs());
  it('does not send greetings to the model',async()=>{
    const result=await call({...request(),draft:'hello'});
    expect(result.events[0]).toMatchObject({status:'unsupported'});
    expect(stream).not.toHaveBeenCalled();
  });
  it.each(['Show photos from Taiwan','Show pictures from Japan','Show images from Japan','Show your photography projects','Open the photography project in Taiwan','Tell me about your photography career'])('keeps photography outside generation: %s',async draft=>{
    const result=await call({...request(),draft});
    expect(result.events[0]).toMatchObject({status:'unsupported',reason:'photography_separate'});
    expect(stream).not.toHaveBeenCalled();
    expect(advice).not.toHaveBeenCalled();
  });
  it('streams validated complete modules with request identity',async()=>{
    stream.mockReturnValue({partialOutputStream:(async function*(){yield {blocks:[{kind:'benchmark'}]};yield spec;})(),output:Promise.resolve(spec),usage:Promise.resolve({inputTokens:100,outputTokens:50})});
    const r=await call(request());expect(r.status).toBe(200);
    expect(r.events).toHaveLength(2);expect(r.events[1]).toMatchObject({type:'composition',composition:spec,revision:7,contentVersion:CONTENT_VERSION,partial:false});
  });
  it('provides optional Jev signals without letting them replace Mistral’s composition',async()=>{
    advice.mockResolvedValue({provider:'jev',model:'mock-jev',experience:{kind:'story',probability:.9,confidence:.8},connection:{connectionId:'listening',probability:.7}});
    stream.mockReturnValue({partialOutputStream:(async function*(){yield spec;})(),output:Promise.resolve(spec),usage:Promise.resolve({})});
    const result=await call(request());
    expect(result.events.at(-1)).toMatchObject({type:'composition',composition:spec});
    const prompt=JSON.parse(stream.mock.calls[0][0].prompt);
    expect(prompt.advisory.experience.kind).toBe('story');
    expect(prompt.portfolioConnections.listening.projectIds).toHaveLength(3);
    expect(stream).toHaveBeenCalledOnce();
  });
  it('still composes if advisory evaluation fails unexpectedly',async()=>{
    advice.mockRejectedValue(new Error('Optional hint failed'));
    stream.mockReturnValue({partialOutputStream:(async function*(){yield spec;})(),output:Promise.resolve(spec),usage:Promise.resolve({})});
    expect((await call(request())).events.at(-1)).toMatchObject({type:'composition',composition:spec});
    expect(stream).toHaveBeenCalledOnce();
  });
  it('handles unsupported questions without a fake module and keeps the empty output out of views',async()=>{
    stream.mockReturnValue({partialOutputStream:(async function*(){yield {supported:false,blocks:[]};})(),output:Promise.resolve({supported:false,blocks:[]}),usage:Promise.resolve({})});
    const result=await call({...request(),draft:'What is the weather tomorrow?'});
    expect(result.events.at(-1)).toMatchObject({type:'guidance',guidance:'unmatched',revision:7});
    expect(result.events.some(event=>event.type==='composition')).toBe(false);
    const schema=stream.mock.calls[0][0].output.schema;
    expect(schema.safeParse({supported:false,blocks:[]}).success).toBe(true);
  });
  it('provides real section evidence and retains a valid semantic section choice',async()=>{
    const draft='How did Isaac reach different audiences in Congress?';
    const baseline=composeLocal(draft,resolveCanvasPlan(draft,initialPlan(),7));
    const generated={supported:true,blocks:[{...baseline.blocks[0],section:3}]};
    stream.mockReturnValue({partialOutputStream:(async function*(){yield generated;})(),output:Promise.resolve(generated),usage:Promise.resolve({inputTokens:100,outputTokens:50})});
    const result=await call({...request(),draft,current:baseline,proposed:baseline});
    expect(result.events.at(-1)).toMatchObject({type:'composition',composition:{blocks:[{section:3,focus:'process'}]}});
    const prompt=JSON.parse(stream.mock.calls[0][0].prompt);
    expect(prompt.catalog.every((project:{sections:{evidence:string}[]})=>project.sections.every(section=>typeof section.evidence==='string'))).toBe(true);
    expect(prompt.catalog.some((project:{sections:{evidence:string}[]})=>project.sections.some(section=>section.evidence.length>20))).toBe(true);
    expect(prompt).not.toHaveProperty('albums');
  });
  it('applies explicit controls without calling a model',async()=>{
    const result=await call({...request(),draft:'use preparedness'});
    expect(result.events).toEqual([expect.objectContaining({type:'composition',local:true,composition:{blocks:[expect.objectContaining({states:['Michigan','California'],metric:'preparednessScore'})]}})]);
    expect(stream).not.toHaveBeenCalled();
  });
  it('rejects requests for a stale content version before generation',async()=>{
    expect((await call({...request(),contentVersion:'old-version'})).status).toBe(400);
    expect(stream).not.toHaveBeenCalled();
  });
  it('rejects oversized pre-parsed bodies and measures string bodies in bytes',async()=>{
    const oversized={...request(),padding:'界'.repeat(5500)};
    expect((await call(oversized)).status).toBe(413);
    expect((await call(JSON.stringify(oversized))).status).toBe(413);
    expect(stream).not.toHaveBeenCalled();
  });
  it('rejects blank drafts before generation',async()=>{
    expect((await call({...request(),draft:'   '})).status).toBe(400);
    expect(stream).not.toHaveBeenCalled();
  });
  it('does not report visitor cancellation as a provider outage',async()=>{
    const before=providerHealth('mistral');
    let disconnect=()=>{};
    stream.mockImplementation(options=>({partialOutputStream:(async function*(){yield {blocks:[]};disconnect();expect(options.abortSignal.aborted).toBe(true);throw Object.assign(new Error('Visitor left'),{name:'AbortError'});})(),output:Promise.resolve(spec),usage:Promise.resolve({})}));
    const result=await call(request(),undefined,response=>{disconnect=()=>response.emit('close');});
    expect(result.events.map(event=>event.type)).toEqual(['start']);
    expect(providerHealth('mistral')).toEqual(before);
  });
  it('does not cache a late provider result after the visitor disconnects',async()=>{
    let disconnect=()=>{};
    stream.mockImplementation(()=>({partialOutputStream:(async function*(){disconnect();yield spec;})(),output:Promise.resolve(spec),usage:Promise.resolve({})}));
    expect((await call(request(),undefined,response=>{disconnect=()=>response.emit('close');})).events.map(event=>event.type)).toEqual(['start']);
    disconnect=()=>{};
    const next=await call(request());
    expect(stream).toHaveBeenCalledTimes(2);
    expect(next.events.at(-1)).toMatchObject({type:'composition',partial:false});
  });
  it('does not commit a result when the visitor leaves while final usage settles',async()=>{
    let disconnect=()=>{};
    stream.mockImplementation(()=>({partialOutputStream:(async function*(){yield spec;})(),output:Promise.resolve(spec),get usage(){disconnect();return Promise.resolve({});}}));
    const before=providerHealth('mistral');
    const result=await call(request(),undefined,response=>{disconnect=()=>response.emit('close');});
    expect(result.events.map(event=>event.type)).toEqual(['start']);
    expect(providerHealth('mistral')).toEqual(before);
    disconnect=()=>{};
    await call(request());
    expect(stream).toHaveBeenCalledTimes(2);
  });
  it('rejects photo modules returned by the model',async()=>{
    const photos={blocks:[{...blankBlock('photos'),albumIds:['Japan']}]};
    stream.mockReturnValue({partialOutputStream:(async function*(){yield photos;})(),output:Promise.resolve(photos),usage:Promise.resolve({inputTokens:100,outputTokens:50})});
    const result=await call(request());
    expect(result.events.at(-1)).toMatchObject({type:'unavailable'});
    expect(result.events.some(e=>e.type==='composition')).toBe(false);
  });
  it('keeps the fallback usable when the provider fails',async()=>{
    stream.mockImplementation(()=>{throw new Error('No credits');});
    expect((await call(request())).events.at(-1)).toMatchObject({type:'unavailable',revision:7});
  });
  it('rejects untrusted content references before making a model call',async()=>{
    const r=await call({...request(),proposed:{blocks:[{...blankBlock('benchmark'),states:['Invented']}]}});
    expect(r.status).toBe(400);expect(stream).not.toHaveBeenCalled();
  });
  it('rejects cross-origin requests before making a model call',async()=>{
    expect((await call(request(),'https://unrelated.example')).status).toBe(403);expect(stream).not.toHaveBeenCalled();
  });
});
