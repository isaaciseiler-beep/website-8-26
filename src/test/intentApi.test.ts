import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/intent';
import { CONTENT_VERSION } from '@/lib/canvas';
import { blankBlock, TAIWAN_ID } from '@/lib/genui';
import type { ApiRequest, ApiResponse } from '../../server/http';

async function call(draft:string,composition?:unknown){
  let output='';const response={statusCode:0,setHeader:vi.fn(),end:(value:string)=>{output=value;}};
  await handler({method:'POST',body:{draft,revision:4,contentVersion:CONTENT_VERSION,composition},headers:{host:'localhost'},socket:{remoteAddress:'intent-test'}} as unknown as ApiRequest,response as unknown as ApiResponse);
  return {status:response.statusCode,data:JSON.parse(output)};
}
function mockRouter(layout:string,project=TAIWAN_ID){
  vi.stubEnv('TYPESAFE_API_KEY','test-only');
  const fetcher=vi.fn(async()=>new Response(JSON.stringify({model:'mock-jev',answers:{layout:{choice:layout,probabilities:{[layout]:.98},confidence:.97},project:{choice:project},focus:{choice:'role'},needsComposition:{noul:.01}}}),{status:200}));
  vi.stubGlobal('fetch',fetcher);return fetcher;
}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('provider interpretation boundaries',()=>{
  it('lets a model interpret unfamiliar phrasing before declaring it unmatched',async()=>{
    const fetcher=mockRouter('project-brief');
    const response=await call('Describe the educator community initiative');
    expect(fetcher).toHaveBeenCalledOnce();
    expect(response.data.composition.blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID]});
    expect(response.data.plan.source).toBe('jev');
  });
  it('does not seed review states when a provider selects a comparison without subjects',async()=>{
    mockRouter('benchmark-compare');
    const response=await call('Taiwan teaching');
    expect(response.data.composition.blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID],states:[]});
  });
  it('preserves selected project state across a provider-routed follow-up',async()=>{
    mockRouter('project-process');
    const current={blocks:[{...blankBlock('story'),layout:'project-process',projectIds:[TAIWAN_ID],section:1,focus:'process',expanded:true,search:'community'}]};
    expect((await call('tell me more about this Taiwan project',current)).data.composition.blocks[0]).toMatchObject({section:1,expanded:true,search:'community',focus:'process'});
  });
  it('reports provider failures without exposing their raw response or secrets',async()=>{
    vi.stubEnv('TYPESAFE_API_KEY','private-test-key');
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('No credits remaining',{status:402})));
    const response=await call('What did Isaac build in Taiwan?');
    expect(response.data.reason).toBe('credits');
    expect(JSON.stringify(response.data)).not.toContain('private-test-key');
    expect(response.data.composition.blocks[0].kind).toBe('story');
  });
  it('keeps greetings out of provider calls',async()=>{
    const fetcher=mockRouter('project-brief');
    expect((await call('hello')).data.guidance).toBe('welcome');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
