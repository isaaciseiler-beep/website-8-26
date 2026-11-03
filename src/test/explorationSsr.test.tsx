// @vitest-environment node
import {renderToPipeableStream,renderToString} from 'react-dom/server';
import {PassThrough} from 'node:stream';
import {expect,it} from 'vitest';
import ExplorationCanvas from '@/components/canvas/ExplorationCanvas';
import {AI_LAYOUTS} from '@/lib/layouts';
import {blankBlock,presetComposition} from '@/lib/genui';
import {initialPlan} from '@/lib/canvas';

it.each(AI_LAYOUTS)('renders live $id immediately on the server without a lazy fallback',({id})=>{
  expect(typeof window).toBe('undefined');
  const html=renderToString(<ExplorationCanvas composition={presetComposition(id)} plan={initialPlan()} generation={{status:'authored'}} onChange={()=>{}}/>);
  expect(html).toContain(`data-layout="${id}"`);
  expect(html).not.toContain('Opening saved view');
  expect(html).not.toContain('opacity:0.15');
});
it('streams a legacy compatibility view without browser globals',async()=>{
  const html=await new Promise<string>((resolve,reject)=>{
    let result='';const output=new PassThrough();
    output.on('data',chunk=>{result+=chunk.toString();});output.on('end',()=>resolve(result));output.on('error',reject);
    const stream=renderToPipeableStream(<ExplorationCanvas composition={{blocks:[blankBlock('workshop')]}} plan={initialPlan()} generation={{status:'authored'}} onChange={()=>{}}/>,{onAllReady(){stream.pipe(output);},onError:reject});
  });
  expect(html).toContain('Teaching workflow builder');
  expect(html).not.toContain('Opening saved view');
});
