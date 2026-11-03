import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useState} from 'react';
import ExplorationCanvas from '@/components/canvas/ExplorationCanvas';
import {PhotoLayouts,SessionSequence} from '@/components/canvas/LayoutViews';
import {blankBlock,type CanvasBlock} from '@/lib/genui';
import {initialPlan} from '@/lib/canvas';
import {AI_LAYOUTS} from '@/lib/layouts';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('retains lazy legacy photo rendering without reintroducing it to live layouts',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  render(<ExplorationCanvas composition={{blocks:[blankBlock('photos')]}} plan={initialPlan()} generation={{status:'authored'}} onChange={()=>{}}/>);
  expect(await screen.findByRole('region',{name:'Photo explorer'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Next photograph'})).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
  expect(AI_LAYOUTS.some(layout=>layout.kind==='photos'||layout.kind==='workshop')).toBe(false);
});
it('preserves direct photo-layout component imports behind the lazy boundary',async()=>{
  render(<PhotoLayouts block={{...blankBlock('photos'),layout:'photo-grid'}} onChange={()=>{}}/>);
  expect(await screen.findByRole('region',{name:'Photo layouts'})).toBeInTheDocument();
  expect(screen.getAllByRole('button',{name:/Open photograph/}).length).toBeGreaterThan(1);
});
it('preserves session edits and ordering after the compatibility component loads',async()=>{
  function Harness(){const[block,setBlock]=useState<CanvasBlock>({...blankBlock('workshop'),layout:'teaching-sequence'});return <SessionSequence block={block} onChange={setBlock}/>;}
  render(<Harness/>);
  const first=await screen.findByRole('textbox',{name:'Step 1'});
  fireEvent.change(first,{target:{value:'A question from the teacher'}});
  fireEvent.click(screen.getByRole('button',{name:'Move step 1 down'}));
  expect(screen.getByRole('textbox',{name:'Step 2'})).toHaveValue('A question from the teacher');
});
