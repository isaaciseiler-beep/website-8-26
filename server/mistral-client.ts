import { createMistral } from '@ai-sdk/mistral';

type CompositionModelOptions={apiKey:string;fetch?:typeof globalThis.fetch};

/** Large 4 supports low/medium/high, but @ai-sdk/mistral 4.0.69 validates only
 * high/none and maps the portable low setting to high. Keep the stock transport
 * and structured-output handling; bridge only this documented wire option.
 * https://docs.mistral.ai/studio/conversations/reasoning */
export function createCompositionModel(model:string,options:CompositionModelOptions){
  if(!/^mistral-large-4(?:-0)?$/.test(model))return createMistral(options)(model);
  const fetcher=options.fetch??globalThis.fetch;
  const lowEffortFetch:typeof globalThis.fetch=(input,init)=>{
    const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
    if(new URL(url).pathname.endsWith('/chat/completions')&&typeof init?.body==='string'){
      const payload:unknown=JSON.parse(init.body);
      if(payload&&typeof payload==='object'&&!Array.isArray(payload)&&(payload as {model?:unknown}).model===model){
        return fetcher(input,{...init,body:JSON.stringify({...payload,reasoning_effort:'low'})});
      }
    }
    return fetcher(input,init);
  };
  return createMistral({...options,fetch:lowEffortFetch})(model);
}
