import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/intent';
import { CONTENT_VERSION } from '@/lib/canvas';
import { blankBlock, TAIWAN_ID } from '@/lib/genui';
import type { ApiRequest, ApiResponse } from '../../server/http';

async function call(draft:string,composition?:unknown,extra:Record<string,unknown>={}){
  let output='';const response={statusCode:0,setHeader:vi.fn(),end:(value:string)=>{output=value;}};
  await handler({method:'POST',body:{draft,revision:4,contentVersion:CONTENT_VERSION,composition,...extra},headers:{host:'localhost'},socket:{remoteAddress:'intent-test'}} as unknown as ApiRequest,response as unknown as ApiResponse);
  return {status:response.statusCode,data:JSON.parse(output)};
}
function mockRouter(layout:string,project=TAIWAN_ID){
  vi.stubEnv('TYPESAFE_API_KEY','test-only');
  const fetcher=vi.fn(async()=>new Response(JSON.stringify({model:'mock-jev',answers:{layout:{choice:layout,probabilities:{[layout]:.98},confidence:.97},project:{choice:project},focus:{choice:'role'},needsComposition:{noul:.01}}}),{status:200}));
  vi.stubGlobal('fetch',fetcher);return fetcher;
}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('provider interpretation boundaries',()=>{
  it('rejects oversized parsed bodies and whitespace-only drafts before routing',async()=>{
    const fetcher=mockRouter('project-brief');
    expect((await call('Taiwan teaching',undefined,{padding:'x'.repeat(17000)})).status).toBe(413);
    expect((await call('   ')).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('strips unknown current-plan fields and rejects unknown content references',async()=>{
    vi.stubEnv('TYPESAFE_API_KEY','');
    vi.stubEnv('MISTRAL_API_KEY','');
    const current={layout:'detail',projectIds:[TAIWAN_ID],albumIds:[],unexpected:'Do not echo this'};
    expect(JSON.stringify((await call('Taiwan teaching',undefined,{current})).data)).not.toContain('Do not echo this');
    expect((await call('Taiwan teaching',undefined,{current:{...current,projectIds:['invented']}})).status).toBe(400);
  });
  it('hands questions directly to composition when Mistral is available',async()=>{
    const fetcher=mockRouter('project-brief');
    vi.stubEnv('MISTRAL_API_KEY','test-only-composer');
    const response=await call('What did Isaac build in Taiwan?');
    expect(response.data).toMatchObject({needsComposition:true,composerConfigured:true,reason:'direct_composition'});
    expect(response.data.composition.blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID]});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('lets the composer interpret wording the local preview cannot resolve',async()=>{
    const fetcher=mockRouter('project-brief');
    vi.stubEnv('MISTRAL_API_KEY','test-only-composer');
    const response=await call('Describe the educator community initiative');
    expect(response.data).toMatchObject({needsComposition:true,reason:'direct_composition'});
    expect(response.data.guidance).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('keeps explicit measure changes local even when both providers are configured',async()=>{
    const fetcher=mockRouter('benchmark');
    vi.stubEnv('MISTRAL_API_KEY','test-only-composer');
    const current={blocks:[{...blankBlock('benchmark'),layout:'benchmark-compare',states:['Michigan','California']}]};
    const response=await call('use preparedness',current);
    expect(response.data).toMatchObject({needsComposition:false,reason:'local_control'});
    expect(response.data.composition.blocks[0]).toMatchObject({states:['Michigan','California'],metric:'preparednessScore'});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['Show photos from Taiwan','Show pictures from Japan','Show images from Japan'])('does not send photography requests to either provider: %s',async draft=>{
    const fetcher=mockRouter('project-brief');
    vi.stubEnv('MISTRAL_API_KEY','test-only-composer');
    expect((await call(draft)).data).toMatchObject({needsComposition:false,composition:null});
    expect(fetcher).not.toHaveBeenCalled();
  });
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
