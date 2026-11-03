import { createHash } from 'node:crypto';
import { type Composition } from '../src/lib/genui.js';
import { CONTENT_VERSION } from '../src/lib/canvas.js';

// Small, bounded process-local cache. No raw visitor queries or credentials retained.
const cache=new Map<string,{expires:number;composition:Composition}>();
/** Invalid configuration must not silently disable process-local call budgets. */
export function providerCallLimit(value:string|undefined,fallback:number){
  const parsed=value?.trim()?Number(value):NaN;
  return Number.isSafeInteger(parsed)&&parsed>=0?parsed:fallback;
}
export function compositionCacheKey(draft:string,current:Composition,proposed:Composition,model:string){
  return createHash('sha256').update(JSON.stringify({draft:draft.trim().replace(/\s+/g,' '),current,proposed,model,version:CONTENT_VERSION})).digest('hex');
}
export function cachedComposition(key:string){const hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.composition;cache.delete(key);return null;}
export function cacheComposition(key:string,composition:Composition){
  if(cache.size>=128)cache.delete(cache.keys().next().value!);
  cache.set(key,{expires:Date.now()+10*60*1000,composition});
}
export function clearCompositionCache(){cache.clear();}
export function providerFailure(error:unknown):string {
  // SDK errors can wrap the actual provider/timeout failure in `cause`. Inspect
  // a bounded chain, but return categories only; no raw text reaches visitors.
  const failures: {name?:unknown;message?:unknown;statusCode?:unknown;cause?:unknown}[]=[];
  const seen=new Set<unknown>();
  for(let current=error;current&&typeof current==='object'&&failures.length<5&&!seen.has(current);){
    seen.add(current);
    const failure=current as typeof failures[number];
    failures.push(failure);current=failure.cause;
  }
  const status=failures.find(failure=>typeof failure.statusCode==='number')?.statusCode;
  const message=failures.map(failure=>typeof failure.message==='string'?failure.message:'').join(' ');
  const names=failures.map(failure=>typeof failure.name==='string'?failure.name:'').join(' ');
  return /credits|insufficient.quota|billing/i.test(message)?'credits':status===401||status===403?'authentication':status===402?'credits':status===429?'rate_limit':status===400?'invalid_request':status===404?'model_unavailable':/timeout|abort/i.test(names)?'timeout':/invalid.*(?:composition|provider output)|schema|validation|no object generated|no output generated/i.test(message)||/NoObjectGenerated|NoOutputGenerated|TypeValidation|JSONParse/i.test(names)?'invalid_output':'provider_unavailable';
}

/** Log only recognized diagnostic categories, never provider bodies or visitor text. */
export function providerLimitDetail(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : '';
  return /capacity|service.tier/i.test(message) ? 'capacity'
    : /token/i.test(message) ? 'tokens'
    : /request.*(?:rate|limit)|(?:rate|limit).*request/i.test(message) ? 'requests'
    : /spend|budget|credit|balance|billing/i.test(message) ? 'budget'
    : /limit|quota/i.test(message) ? 'unspecified_limit' : undefined;
}

export const providerDiagnosticParameters:readonly string[]=['model','messages','reasoning_effort','prompt_mode','temperature','max_tokens','max_output_tokens','response_format','json_schema','tools','tool_choice','top_p','stream'];
export const providerDiagnosticCategories:readonly string[]=['model_unavailable','reasoning_configuration','context_limit','output_token_limit','schema_response_format','unsupported_parameter','invalid_parameter'];

/** Inspect bounded error metadata, but return only fixed labels and known API
 * parameter names. Provider messages can echo visitor text or credentials. */
export function providerDiagnostics(error: unknown) {
  const records:Record<string,unknown>[]=[];
  const details:Record<string,unknown>[]=[];
  const messages:string[]=[];
  const parameters:string[]=[];
  const seen=new Set<unknown>();
  const record=(value:unknown):Record<string,unknown>|undefined=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:undefined;
  let inspected=0,messageBudget=32768;
  const parameter=(value:unknown)=>{
    // Validation locations can be ["body", "response_format", ...], but must
    // never expose an arbitrary schema property, request value or full path.
    for(const part of Array.isArray(value)?value.slice(0,8):[value]){
      if(typeof part!=='string')continue;
      for(const token of part.split(/[.[\]/]/).slice(0,8))if(providerDiagnosticParameters.includes(token))parameters.push(token);
    }
  };
  const inspect=(value:unknown,depth=0):void=>{
    if(depth>5||inspected>=64||value===null||value===undefined)return;
    inspected++;
    if(typeof value==='string'){
      const bounded=value.slice(0,Math.min(8192,messageBudget));messageBudget-=bounded.length;
      if(bounded)messages.push(bounded);
      // Some validation responses put a JSON object inside message instead of
      // returning a plain string. Only recognized diagnostic edges are read.
      if(bounded.length===value.length&&/^\s*[{[]/.test(bounded))try{inspect(JSON.parse(bounded),depth+1);}catch{/* Plain provider message. */}
      return;
    }
    if(typeof value!=='object'||seen.has(value))return;
    seen.add(value);
    if(Array.isArray(value)){for(const item of value.slice(0,16))inspect(item,depth+1);return;}
    const detail=value as Record<string,unknown>;details.push(detail);
    parameter(detail.param);parameter(detail.loc);parameter(detail.path);parameter(detail.field);
    for(const key of ['message','msg','detail','error','errors'])inspect(detail[key],depth+1);
    // Deliberately ignore input, ctx, request, headers and arbitrary children.
  };
  const causes=new Set<unknown>();
  for(let current=record(error);current&&records.length<5&&!causes.has(current);current=record(current.cause)){
    causes.add(current);records.push(current);inspect(current);
    const sources=[record(current.data)];
    if(typeof current.responseBody==='string'&&current.responseBody.length<=64000){
      try{sources.push(record(JSON.parse(current.responseBody)));}catch{/* Non-JSON upstream error. */}
    }
    for(const data of sources)inspect(data);
  }
  const rawCode=details.map(detail=>String(detail.code??'')).find(value=>/^\d{3,6}$/.test(value)||['rate_limit_exceeded','insufficient_quota','unknown_model'].includes(value));
  const providerCode=rawCode||undefined;
  const providerType=details.map(detail=>detail.type).find(value=>typeof value==='string'&&['rate_limited','rate_limit','rate_limit_error','invalid_request_error','invalid_request_invalid_args','authentication_error','server_error'].includes(value)) as string|undefined;
  // These are classifications of supplied error text, not an interpretation of
  // undocumented numeric provider codes. No matched substring is ever returned.
  const text=messages.join('\n');
  // Text may identify a parameter even when Mistral returns param:null. Match
  // known API names only; no text or unrecognized match is returned.
  const providerParameter=parameters[0]??text.match(new RegExp(`\\b(${providerDiagnosticParameters.join('|')})\\b`,'i'))?.[0].toLowerCase();
  const providerDiagnostic=
    /(?:unknown|invalid|unsupported|unavailable)\s+model|model[^\n]{0,100}(?:not found|not available|not enabled|does not exist|no access|access denied)/i.test(text)?'model_unavailable':
    /(?:context|prompt)[^\n]{0,80}(?:length|window|limit|too long)|maximum context/i.test(text)?'context_limit':
    /max[_ ](?:output[_ ])?tokens|completion[_ ]tokens|output tokens/i.test(text)&&/minimum|maximum|at least|at most|too (?:small|large)|exceed|must|limit|greater|less/i.test(text)?'output_token_limit':
    /json[_ -]?schema|response[_ ]format|structured outputs?|additionalProperties|required[^\n]{0,40}propert/i.test(text)||parameters.some(name=>name==='json_schema'||name==='response_format')?'schema_response_format':
    /reasoning(?:[_ ]effort)?|prompt[_ ]mode/i.test(text)&&/not supported|unsupported|not enabled|invalid|must|requires?|allowed|only|does not accept/i.test(text)?'reasoning_configuration':
    /(?:unknown|unsupported|unexpected|unrecognized)[^\n]{0,40}(?:param|argument|field)|extra inputs are not permitted|(?:param|argument|field)[^\n]{0,60}(?:not supported|not allowed|not permitted)/i.test(text)||(providerParameter&&/not supported|not allowed|not permitted|does not support|only (?:supports?|accepts?)/i.test(text))?'unsupported_parameter':
    providerParameter&&/invalid|must|should|greater|less|at least|at most|missing|required|permitted|allowed|not enabled/i.test(text)?'invalid_parameter':undefined;
  // Extract a number only from an explicit floor for a known output-token field.
  // Unrelated numbers, visitor data and ambiguous "token limit" text are omitted.
  const floors=[...text.matchAll(/\b(?:max_tokens|max_output_tokens)\b\s+(?:must|should)\s+be\s+(?:at least|greater than or equal to|>=)\s*(\d{1,7})\b/gi)].map(match=>Number(match[1]));
  const providerMinimumOutputTokens=floors.length&&floors.every(value=>value===floors[0])&&floors[0]>0&&floors[0]<=1000000?floors[0]:undefined;
  const numeric=(name:string)=>{
    for(const failure of records){const value=record(failure.responseHeaders)?.[name];if(typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value)){const number=Number(value);if(Number.isFinite(number))return number;}}
    return undefined;
  };
  return {providerCode,providerType,providerParameter,providerDiagnostic,providerMinimumOutputTokens,retryAfter:numeric('retry-after'),rateLimit:numeric('x-ratelimit-limit'),rateRemaining:numeric('x-ratelimit-remaining')};
}
