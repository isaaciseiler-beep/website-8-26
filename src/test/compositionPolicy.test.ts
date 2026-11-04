import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { blankBlock } from '@/lib/genui';
import { cacheComposition, cachedComposition, clearCompositionCache, compositionCacheKey, providerCallLimit, providerFailure, providerDiagnostics } from '../../server/composition-policy';

const composition={blocks:[blankBlock('benchmark')]};
describe('bounded composition safeguards',()=>{
  beforeEach(()=>clearCompositionCache());
  afterEach(()=>vi.useRealTimers());
  it.each([undefined,'','garbled','Infinity','-2','2.5'])('retains the configured default for an invalid call budget: %s',value=>{
    expect(providerCallLimit(value,250)).toBe(250);
  });
  it('allows an explicit zero budget to disable provider calls',()=>{
    expect(providerCallLimit('0',250)).toBe(0);
    expect(providerCallLimit(' 40 ',250)).toBe(40);
  });
  it('evicts old entries instead of growing beyond 128 cached compositions',()=>{
    for(let i=0;i<129;i++)cacheComposition(String(i),composition);
    expect(cachedComposition('0')).toBeNull();
    expect(cachedComposition('128')).toEqual(composition);
  });
  it('expires a cached composition after ten minutes',()=>{
    vi.useFakeTimers();
    cacheComposition('example',composition);
    vi.advanceTimersByTime(10*60*1000);
    expect(cachedComposition('example')).toBeNull();
  });
  it('invalidates a composition when published evidence changes',()=>{
    const key=compositionCacheKey('What did Isaac do?',composition,composition,'model','before');
    expect(compositionCacheKey('What did Isaac do?',composition,composition,'model','after')).not.toBe(key);
  });
  it('hashes visitor text and distinguishes the current selected controls',()=>{
    const key=compositionCacheKey('A private visitor question',composition,composition,'model');
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    const edited={blocks:[{...composition.blocks[0],region:'Midwest' as const}]};
    expect(compositionCacheKey('A private visitor question',edited,composition,'model')).not.toBe(key);
  });
  it('does not reuse advice-enabled compositions when advisory calls are disabled',()=>{
    vi.stubEnv('TYPESAFE_API_KEY','test-only');vi.stubEnv('JEV_COMPOSITION_ADVICE',undefined);
    const enabled=compositionCacheKey('Same question',composition,composition,'model');
    vi.stubEnv('JEV_COMPOSITION_ADVICE','off');
    const disabled=compositionCacheKey('Same question',composition,composition,'model');
    expect(disabled).not.toBe(enabled);
    vi.stubEnv('TYPESAFE_API_KEY',undefined);
    expect(compositionCacheKey('Same question',composition,composition,'model')).toBe(disabled);
    vi.unstubAllEnvs();
  });
  it('recognizes schema failures and nested provider errors without returning raw details',()=>{
    expect(providerFailure(Object.assign(new Error('Failed to generate'),{name:'AI_NoObjectGeneratedError'}))).toBe('invalid_output');
    expect(providerFailure(Object.assign(new Error('No result'),{cause:Object.assign(new Error('private upstream details'),{statusCode:429})}))).toBe('rate_limit');
    expect(providerFailure(Object.assign(new Error('No result'),{cause:Object.assign(new Error('private upstream details'),{name:'TimeoutError'})}))).toBe('timeout');
    expect(providerFailure(Object.assign(new Error('No result'),{cause:Object.assign(new Error('private upstream details'),{statusCode:401})}))).toBe('authentication');
  });
  it('bounds inspection of malformed or cyclic provider errors',()=>{
    const error:Error&{cause?:unknown}=new Error('private upstream details');error.cause=error;
    expect(providerFailure(error)).toBe('provider_unavailable');
    expect(providerFailure(null)).toBe('provider_unavailable');
  });
  it('does not let a caller mutate cached controls or future cache hits',()=>{
    const original={blocks:[{...composition.blocks[0],states:['Michigan']}]};
    cacheComposition('snapshot',original);
    original.blocks[0].states.push('California');
    const first=cachedComposition('snapshot')!;first.blocks[0].states.push('Ohio');
    expect(cachedComposition('snapshot')!.blocks[0].states).toEqual(['Michigan']);
  });
  it('versions cache identity when optional advisory configuration changes',()=>{
    const previous=process.env.TYPESAFE_API_KEY;
    try{delete process.env.TYPESAFE_API_KEY;const without=compositionCacheKey('Same question',composition,composition,'model');
      process.env.TYPESAFE_API_KEY='not-a-real-key';expect(compositionCacheKey('Same question',composition,composition,'model')).not.toBe(without);
    }finally{if(previous===undefined)delete process.env.TYPESAFE_API_KEY;else process.env.TYPESAFE_API_KEY=previous;}
  });
  it.each([
    ['model','Model is not available for this workspace','model_unavailable'],
    ['reasoning_effort','reasoning_effort none is not supported; allowed values low, medium, high','reasoning_configuration'],
    ['max_tokens','max_tokens must be at least 8192 for reasoning','output_token_limit'],
    ['messages','Prompt length exceeds the context window limit','context_limit'],
    ['response_format','Invalid response_format json_schema: additionalProperties must be false','schema_response_format'],
    ['temperature','Unsupported parameter temperature','unsupported_parameter'],
  ])('classifies %s errors using fixed labels only', (param,message,expected)=>{
    const error=Object.assign(new Error('Outer SDK wrapper'),{cause:{responseBody:JSON.stringify({error:{message,param,code:'3054',type:'invalid_request_error'}})}});
    expect(providerDiagnostics(error)).toMatchObject({providerParameter:param,providerDiagnostic:expected,providerCode:'3054',providerType:'invalid_request_error'});
  });
  it('does not expose PII, keys, URLs, arbitrary parameter names, or provider messages',()=>{
    const secret='sk-secret-example alice@private.example https://private.example/123';
    const error={message:`Unsupported parameter ${secret}`,data:{error:{param:secret,message:`max_tokens must be at least 8192. ${secret}`,code:secret,type:secret}},responseHeaders:{'retry-after':'3','x-ratelimit-limit':secret}};
    const result=providerDiagnostics(error);
    expect(JSON.parse(JSON.stringify(result))).toEqual({providerParameter:'max_tokens',providerDiagnostic:'output_token_limit',providerMinimumOutputTokens:8192,retryAfter:3});
    expect(JSON.stringify(result)).not.toMatch(/sk-secret|alice@|https:|private/);
  });
  it('does not infer a diagnostic from undocumented numeric codes or unrecognized text',()=>{
    expect(JSON.parse(JSON.stringify(providerDiagnostics({data:{code:'3054',message:'Unrecognized server condition'}})))).toEqual({providerCode:'3054'});
    expect(JSON.parse(JSON.stringify(providerDiagnostics(null)))).toEqual({});
  });
  it('recognizes truncated structured output from the SDK finish reason without reading generated text',()=>{
    const result=providerDiagnostics({cause:{name:'AI_NoObjectGeneratedError',message:'No object generated',finishReason:'length',text:'sk-private alice@private.example',response:{body:'private output'}}});
    expect(JSON.parse(JSON.stringify(result))).toEqual({providerDiagnostic:'output_token_limit'});
    for(const finishReason of ['stop','error','unknown','private@example.com'])expect(JSON.parse(JSON.stringify(providerDiagnostics({finishReason,text:'max_tokens must be at least 9999'})))).toEqual({});
  });
  it('keeps token floors unambiguous and checks body messages even when SDK data exists',()=>{
    expect(providerDiagnostics({data:{code:'3054'},responseBody:JSON.stringify({param:'max_tokens',message:'max_tokens must be at least 8192'})})).toMatchObject({providerCode:'3054',providerParameter:'max_tokens',providerDiagnostic:'output_token_limit',providerMinimumOutputTokens:8192});
    for(const message of ['max_tokens must be at least 8192; max_output_tokens must be at least 4096','Token limit minimum 8192','max_tokens must be at least 9999999'])expect(providerDiagnostics({message})).not.toHaveProperty('providerMinimumOutputTokens',expect.any(Number));
  });
  it.each([
    [{message:{detail:[{loc:['body','max_tokens'],msg:'Input should be greater than or equal to 8192',type:'greater_than_equal',input:'sk-private',ctx:{ge:8192}}]}},'max_tokens','invalid_parameter'],
    [{detail:[{loc:['body','response_format','json_schema','private_field'],msg:'Field required',input:{private:'alice@private.example'}}]},'response_format','schema_response_format'],
    [{error:{detail:{errors:[{path:'body.temperature',msg:'This model only supports the default value'}]}}},'temperature','unsupported_parameter'],
    [{message:JSON.stringify({detail:[{field:'reasoning_effort',msg:'Value is not allowed for this model'}]})},'reasoning_effort','reasoning_configuration'],
    [{detail:'temperature is invalid for this model'},'temperature','invalid_parameter'],
  ])('reads bounded nested Mistral validation details without exporting their values', (body,param,category)=>{
    const result=providerDiagnostics({responseBody:JSON.stringify({code:'3054',type:'invalid_request_invalid_args',...body})});
    expect(result.providerDiagnostic,JSON.stringify(body)).toBe(category);
    expect(result).toMatchObject({providerCode:'3054',providerType:'invalid_request_invalid_args',providerParameter:param,providerDiagnostic:category});
    expect(JSON.stringify(result)).not.toMatch(/sk-private|alice@|private_field|greater_than_equal|8192/);
  });
  it('does not inspect echoed input, context objects or arbitrary nested provider data',()=>{
    const body={code:'3054',input:{message:'Unknown model',param:'model'},ctx:{message:'max_tokens must be at least 8192'},request:{param:'temperature',message:'Unsupported parameter'},arbitrary:{error:{message:'Unsupported parameter'}}};
    expect(JSON.parse(JSON.stringify(providerDiagnostics({responseBody:JSON.stringify(body)})))).toEqual({providerCode:'3054'});
  });
  it('bounds validation list length, nesting, aggregate text and cyclic detail objects',()=>{
    const detail:Record<string,unknown>={};detail.detail=detail;
    expect(JSON.parse(JSON.stringify(providerDiagnostics({data:detail})))).toEqual({});
    expect(JSON.parse(JSON.stringify(providerDiagnostics({data:{detail:[...Array(16).fill('unrecognized'),{param:'model',message:'Unknown model'}]}})))).toEqual({});
    const deep:Record<string,unknown>={};let tail=deep;for(let i=0;i<6;i++){tail.detail={};tail=tail.detail as Record<string,unknown>;}tail.param='model';tail.message='Unknown model';
    expect(JSON.parse(JSON.stringify(providerDiagnostics({data:deep})))).toEqual({});
    expect(JSON.parse(JSON.stringify(providerDiagnostics({data:{detail:[...Array(4).fill('x'.repeat(8192)),'Unsupported parameter temperature']}})))).toEqual({});
  });
  it('bounds cyclic causes, oversized response bodies and messages',()=>{
    const error:Record<string,unknown>={message:'x'.repeat(8192)+' unsupported parameter password',responseBody:' '.repeat(64001)};error.cause=error;
    expect(JSON.parse(JSON.stringify(providerDiagnostics(error)))).toEqual({});
    const root:Record<string,unknown>={};let tail=root;
    for(let index=0;index<5;index++){tail.cause={};tail=tail.cause as Record<string,unknown>;}
    tail.data={param:'model',message:'Unknown model'};
    expect(JSON.parse(JSON.stringify(providerDiagnostics(root)))).toEqual({});
  });

});
