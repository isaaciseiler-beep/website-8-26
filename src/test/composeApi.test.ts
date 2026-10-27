import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiRequest, ApiResponse } from '../../server/http';
import { blankBlock } from '@/lib/genui';
import { CONTENT_VERSION } from '@/lib/canvas';
const {stream}=vi.hoisted(()=>({stream:vi.fn()}));
vi.mock('ai',()=>({streamText:stream,Output:{object:(v:unknown)=>v}}));
vi.mock('@ai-sdk/mistral',()=>({createMistral:()=>()=>({})}));
import { clearCompositionCache } from '../../server/composition-policy';
import handler from '../../api/compose';
const spec={blocks:[{...blankBlock('benchmark'),layout:'benchmark-compare' as const,states:['Michigan','California']}]};
async function call(body:unknown,origin?:string){
  let output='';const response=Object.assign(new EventEmitter(),{statusCode:0,setHeader:vi.fn(),write:(chunk:string)=>{output+=chunk;},end:(chunk='')=>{output+=chunk;},destroyed:false,writableEnded:false});
  await handler({method:'POST',body,headers:{host:'localhost',origin},socket:{remoteAddress:'test'}} as unknown as ApiRequest,response as unknown as ApiResponse);
  return {status:response.statusCode,events:output.trim().split('\n').map(v=>JSON.parse(v))};
}
const request=()=>({draft:'Compare Michigan and California',revision:7,contentVersion:CONTENT_VERSION,current:spec,proposed:spec});
describe('composition API',()=>{
  beforeEach(()=>{vi.stubEnv('MISTRAL_API_KEY','test-only-key');stream.mockReset();clearCompositionCache();});
  afterEach(()=>vi.unstubAllEnvs());
  it('does not send greetings to the model',async()=>{
    const result=await call({...request(),draft:'hello'});
    expect(result.events[0]).toMatchObject({status:'unsupported'});
    expect(stream).not.toHaveBeenCalled();
  });
  it('streams validated complete modules with request identity',async()=>{
    stream.mockReturnValue({partialOutputStream:(async function*(){yield {blocks:[{kind:'benchmark'}]};yield spec;})(),output:Promise.resolve(spec),usage:Promise.resolve({inputTokens:100,outputTokens:50})});
    const r=await call(request());expect(r.status).toBe(200);
    expect(r.events).toHaveLength(2);expect(r.events[1]).toMatchObject({type:'composition',composition:spec,revision:7,contentVersion:CONTENT_VERSION,partial:false});
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
