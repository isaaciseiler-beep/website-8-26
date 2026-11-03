import { describe, expect, it, vi } from 'vitest';
import { createMistral } from '@ai-sdk/mistral';
import { streamText, Output } from 'ai';
import { z } from 'zod';
import { createCompositionModel } from '../../server/mistral-client';

describe('Mistral Large 4 SDK compatibility',()=>{
  it.each(['mistral-large-4','mistral-large-4-0'])('omits reasoning_effort on the actual %s wire request when unspecified',async model=>{
    let payload:Record<string,unknown>|undefined;
    const fetcher=vi.fn(async (_input:RequestInfo|URL,init?:RequestInit)=>{
      payload=JSON.parse(String(init?.body));
      return new Response('data: [DONE]\n\n',{status:200,headers:{'Content-Type':'text/event-stream'}});
    });
    const provider=createMistral({apiKey:'test-only-key',fetch:fetcher});
    const result=await provider(model).doStream({
      prompt:[{role:'user',content:[{type:'text',text:'A public portfolio question'}]}],
      temperature:0,maxOutputTokens:1800,
      responseFormat:{type:'json',schema:{type:'object',properties:{supported:{type:'boolean'}},required:['supported'],additionalProperties:false}},
      providerOptions:{mistral:{strictJsonSchema:true}},
    });
    const reader=result.stream.getReader();
    try {while(!(await reader.read()).done){/* Drain the mocked stream. */}}
    finally {reader.releaseLock();}
    expect(fetcher).toHaveBeenCalledOnce();
    expect(payload).toMatchObject({model,temperature:0,max_tokens:1800,stream:true,response_format:{type:'json_schema',json_schema:{strict:true}}});
    expect(payload).not.toHaveProperty('reasoning_effort');
  });
  it.each([
    {model:'mistral-large-4',temperature:0},
    {model:'mistral-large-4',temperature:undefined},
    {model:'mistral-large-4-0',temperature:undefined},
  ])('preserves sampling defaults through streamText/Output.object for $model with temperature $temperature',async ({model,temperature})=>{
    let payload:Record<string,unknown>|undefined;
    const fetcher=vi.fn(async (_input:RequestInfo|URL,init?:RequestInit)=>{
      payload=JSON.parse(String(init?.body));
      const base={id:'mock-completion',object:'chat.completion.chunk',created:0,model};
      const chunks=[
        {...base,choices:[{index:0,delta:{content:'{"supported":true}'},finish_reason:null}]},
        {...base,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}},
      ];
      return new Response(chunks.map(chunk=>`data: ${JSON.stringify(chunk)}\n\n`).join('')+'data: [DONE]\n\n',{status:200,headers:{'Content-Type':'text/event-stream'}});
    });
    const result=streamText({
      model:createMistral({apiKey:'test-only-key',fetch:fetcher})(model),
      ...(temperature===undefined?{}:{temperature}),maxOutputTokens:1800,maxRetries:0,
      output:Output.object({schema:z.object({supported:z.boolean()})}),
      providerOptions:{mistral:{strictJsonSchema:true}},
      system:'Return a structured JSON portfolio choice.',prompt:'A public portfolio question',
    });
    await result.consumeStream();
    expect(await result.output).toEqual({supported:true});
    expect(fetcher).toHaveBeenCalledOnce();
    expect(payload).toMatchObject({model,max_tokens:1800,stream:true,response_format:{type:'json_schema',json_schema:{strict:true}}});
    expect(payload).not.toHaveProperty('top_p');
    expect(payload).not.toHaveProperty('reasoning_effort');
    if(temperature===undefined)expect(payload).not.toHaveProperty('temperature');
    else expect(payload).toHaveProperty('temperature',0);
  });
  it.each(['mistral-large-4','mistral-large-4-0','mistral-small-2603'])('uses the narrow low-effort bridge without altering the %s schema, headers or controls',async model=>{
    let payload:Record<string,unknown>|undefined;
    let requestHeaders:Headers|undefined;
    const fetcher=vi.fn(async (_input:RequestInfo|URL,init?:RequestInit)=>{
      payload=JSON.parse(String(init?.body));requestHeaders=new Headers(init?.headers);
      const base={id:'mock-completion',object:'chat.completion.chunk',created:0,model};
      const chunks=[
        {...base,choices:[{index:0,delta:{content:'{"supported":true}'},finish_reason:null}]},
        {...base,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}},
      ];
      return new Response(chunks.map(chunk=>`data: ${JSON.stringify(chunk)}\n\n`).join('')+'data: [DONE]\n\n',{status:200,headers:{'Content-Type':'text/event-stream'}});
    });
    const small=model==='mistral-small-2603';
    const result=streamText({
      model:createCompositionModel(model,{apiKey:'test-only-key',fetch:fetcher}),
      ...(small?{reasoning:'none' as const,temperature:0}:{}),
      maxOutputTokens:small?1800:4096,maxRetries:0,
      output:Output.object({schema:z.object({supported:z.boolean()})}),
      providerOptions:{mistral:{strictJsonSchema:true}},
      headers:{'x-composition-test':'preserved'},
      system:'Return a structured JSON portfolio choice.',prompt:'A public portfolio question',
    });
    await result.consumeStream();
    expect(await result.output).toEqual({supported:true});
    expect(fetcher).toHaveBeenCalledOnce();
    expect(payload).toMatchObject({model,reasoning_effort:small?'none':'low',max_tokens:small?1800:4096,stream:true,response_format:{type:'json_schema',json_schema:{strict:true,schema:{required:['supported'],additionalProperties:false}}},messages:[{role:'system',content:'Return a structured JSON portfolio choice.'},{role:'user',content:[{type:'text',text:'A public portfolio question'}]}]});
    expect(payload).not.toHaveProperty('top_p');
    if(small)expect(payload).toHaveProperty('temperature',0);else expect(payload).not.toHaveProperty('temperature');
    expect(requestHeaders?.get('authorization')).toBe('Bearer test-only-key');
    expect(requestHeaders?.get('content-type')).toBe('application/json');
    expect(requestHeaders?.get('x-composition-test')).toBe('preserved');
  });
  it('forwards cancellation through the Large 4 bridge to the actual fetch signal',async ()=>{
    const controller=new AbortController();
    let requestSignal:AbortSignal|null|undefined;
    let fetchStarted:()=>void=()=>{};
    const started=new Promise<void>(resolve=>{fetchStarted=resolve;});
    const fetcher=vi.fn((_input:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
      requestSignal=init?.signal;
      requestSignal?.addEventListener('abort',()=>reject(requestSignal?.reason),{once:true});
      fetchStarted();
    }));
    const result=streamText({model:createCompositionModel('mistral-large-4',{apiKey:'test-only-key',fetch:fetcher}),prompt:'A public portfolio question',maxRetries:0,abortSignal:controller.signal});
    const consumed=result.consumeStream();
    await started;controller.abort();await consumed;
    expect(fetcher).toHaveBeenCalledOnce();
    expect(requestSignal?.aborted).toBe(true);
  });
});
