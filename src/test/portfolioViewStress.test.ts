import { describe, expect, it } from 'vitest';
import { publicProjects } from '@/lib/canvas';
import { AI_LAYOUTS } from '@/lib/layouts';
import { presetComposition, validateComposition } from '@/lib/genui';
import { applyPortfolioAction, createPortableView, decodeView, encodeView, type PortableView } from '@/lib/portfolioView';

// Fixed seeds make long mixed edit sequences reproducible, including rejection paths.
function random(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
describe('portable view adversarial sequences',()=>{
  it.each([7,41,2026,8191])('keeps accepted edits valid and rejected edits atomic, seed %s',seed=>{
    const next=random(seed),pick=<T,>(items:readonly T[])=>items[Math.floor(next()*items.length)];
    let view:PortableView=createPortableView(presetComposition('experience-roles'));
    let accepted=0,rejected=0;
    for(let i=0;i<500;i++){
      const before=JSON.stringify(view);
      const projectId=pick(publicProjects).id;
      const action=pick([
        {type:'open_project',projectId,append:next()>.5,focus:pick(['role','process','outcomes','evidence'])},
        {type:'open_project',projectId:'unknown-project',append:true},
        {type:'move_module',from:Math.floor(next()*4),to:Math.floor(next()*4)},
        {type:'remove_module',index:Math.floor(next()*4)},
        {type:'update_module',index:Math.floor(next()*4),changes:{search:pick(['Taiwan 👋','研究','', 'x'.repeat(121)]),expanded:next()>.5}},
        {type:'compare_projects',projectIds:[projectId,pick(publicProjects).id]},
        {type:'compose',modules:[{kind:'timeline',answerId:'connections',connectionId:pick(['systems','listening','delivery','invented']),focus:pick(['role','process','outcomes'])}]},
        {type:'compose',modules:[{kind:'photos',albumIds:['Taiwan']}]},
        {type:'compose',modules:[{kind:'workshop',projectIds:[projectId]}]},
      ]);
      let edited:PortableView;
      try{edited=applyPortfolioAction(view,action);}
      catch{expect(JSON.stringify(view)).toBe(before);rejected++;continue;}
      expect(JSON.stringify(view)).toBe(before);
      expect(validateComposition(edited.composition)).not.toBeNull();
      expect(edited.composition.blocks.length).toBeGreaterThan(0);
      expect(edited.composition.blocks.length).toBeLessThanOrEqual(3);
      expect(edited.composition.blocks.every(block=>block.albumIds.length===0)).toBe(true);
      expect(decodeView(encodeView(edited))).toEqual(edited);
      view=edited;accepted++;
    }
    expect(accepted).toBeGreaterThan(100);expect(rejected).toBeGreaterThan(100);
  });
  it.each(AI_LAYOUTS)('rejects corrupted $id links and references without changing the valid view',layout=>{
    const view=createPortableView(presetComposition(layout.id));const snapshot=JSON.stringify(view);
    for(const changes of [{projectIds:['unknown']},{states:['Invented government']},{albumIds:['Taiwan']},{section:-1},{metric:'invented'},{focus:'invented'},{connectionId:'invented'}]){
      expect(()=>applyPortfolioAction(view,{type:'update_module',index:0,changes})).toThrow();
      expect(JSON.stringify(view)).toBe(snapshot);
    }
    for(const encoded of [encodeView(view).slice(0,12),'bad!', 'x'.repeat(10001)])expect(()=>decodeView(encoded)).toThrow();
  });
});
