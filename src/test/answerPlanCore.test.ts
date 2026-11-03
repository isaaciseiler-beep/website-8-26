import { analyzePortfolioRequest } from '@/lib/portfolioRequestAnalysis';
import { describe, expect, it } from 'vitest';
import { composeLocal, resolveCanvasPlan, validateComposition, blankBlock } from '@/lib/genui';
import { initialPlan, CONTENT_VERSION, publicProjects } from '@/lib/canvas';
import { portfolioEvidenceRegistry, getEvidence, resolveAnswerPlan, stableEvidenceId, stableSectionId, evidenceChangeEffects } from '@/lib/portfolioEvidenceRegistry';
import { projectAnswerEvidence, projectEvidenceScope } from '@/lib/portfolioEvidenceManifest';
import { requestedQuestionFacets } from '@/lib/portfolioAnswerPlan';
import { createPortableView, readPortableView, applyPortfolioAction, encodeView, decodeView } from '@/lib/portfolioView';

const compose=(question:string,previous?:ReturnType<typeof composeLocal>)=>composeLocal(question,resolveCanvasPlan(question,initialPlan(),1,previous),previous);
const text=(question:string)=>resolveAnswerPlan(compose(question).blocks[0]).flatMap(facet=>facet.evidence).map(record=>record.text).join('\n');

describe('stable published evidence',()=>{
  it('indexes all public sections and never hidden material',()=>{
    expect(new Set(portfolioEvidenceRegistry.map(record=>record.id)).size).toBe(portfolioEvidenceRegistry.length);
    for(const project of publicProjects)for(const[index]of project.sections.entries())expect(portfolioEvidenceRegistry.some(record=>record.projectId===project.id&&record.sectionIndex===index)).toBe(true);
    expect(new Set(portfolioEvidenceRegistry.map(record=>record.projectId))).toEqual(new Set(publicProjects.map(project=>project.id)));
  });
  it('uses content rather than array positions, while rejecting changed evidence',()=>{
    const record=portfolioEvidenceRegistry.find(record=>record.kind==='paragraph')!;
    expect(stableEvidenceId(record.projectId,record.kind,record.text,record.href)).toBe(record.id);
    expect(stableEvidenceId(record.projectId,record.kind,record.text.replaceAll(' ','  '),record.href)).toBe(record.id);
    expect(stableEvidenceId(record.projectId,record.kind,record.text+' changed',record.href)).not.toBe(record.id);
    expect(stableSectionId(record.projectId,record.sectionHeading)).toBe(record.sectionId);
    expect(evidenceChangeEffects([record.id,'deleted']).removed).toEqual(['deleted']);
  });
  it('keeps every reviewed facet citation valid and within its public project',()=>{
    for(const[project,facets]of Object.entries(projectAnswerEvidence))for(const ids of Object.values(facets))for(const id of ids!)expect(getEvidence(id)?.projectId).toBe(project);
    expect(Object.keys(projectEvidenceScope).sort()).toEqual(publicProjects.map(project=>project.id).sort());
  });
});

describe('question-part evidence planning',()=>{
  it('tracks actual requested responsibility, method, outcome and material parts',()=>{
    const kinds=requestedQuestionFacets('What was his role and how did he do the research and what were the results and show the sources?').map(facet=>facet.kind);
    expect(kinds).toEqual(expect.arrayContaining(['contribution','process','outcomes','sources']));
  });
  it('covers recruitment and analysis rather than only the introductory research paragraph',()=>{
    const answer=text('What methods did Isaac use in his Australian journalism research?');
    expect(answer).toContain('17 in-depth interviews');
    expect(answer).toContain('transcription verification, qualitative coding');
  });
  it('finds the actual retrospective for a broad Taiwan lesson request',()=>{
    const answer=text('What were the lessons from the Taiwan program?');
    expect(answer).toContain('best learning happens in community');
    expect(answer).toContain('durable AI adoption starts from the bottom up');
  });
  it('separates results and attributed responsibility with qualified supporting evidence',()=>{
    const result=compose('What did Isaac personally own in the Boehringer rebrand and what were the results?');
    const facets=resolveAnswerPlan(result.blocks[0]);
    expect(facets.map(facet=>facet.kind)).toEqual(expect.arrayContaining(['contribution','outcomes']));
    expect(facets.flatMap(facet=>facet.evidence).map(record=>record.text).join('\n')).toMatch(/25%/);
    expect(facets.flatMap(facet=>facet.evidence).map(record=>record.text).join('\n')).toMatch(/broader team|did not create the original/);
  });
  it('marks absent alternatives and personal retrospectives as unavailable',()=>{
    const result=compose('What alternatives did Isaac reject in the Boehringer rebrand and what lessons did he learn?');
    const facets=resolveAnswerPlan(result.blocks[0]);
    expect(facets.find(facet=>facet.kind==='decisions')?.status).toBe('unavailable');
    expect(facets.find(facet=>facet.kind==='lessons')?.status).toBe('unavailable');
  });
  it('includes a limit for unsupported product causation',()=>{
    const result=compose('Which feature shipped because of his Pulse feedback?');
    expect(resolveAnswerPlan(result.blocks[0]).find(facet=>facet.kind==='limits')?.status).toBe('unavailable');
  });
  it('keeps product sources local instead of appending unrelated product artifacts',()=>{
    const previous=compose('What did Isaac contribute to Pulse?');
    const result=compose('Let me inspect the published material behind that specific feedback.',previous);
    const sources=resolveAnswerPlan(result.blocks[0]).find(facet=>facet.kind==='sources')!;
    expect(sources.evidence.map(record=>record.sectionIndex)).toEqual([4]);
    expect(sources.evidence.map(record=>record.text)).toEqual(['Meet ChatGPT Pulse']);
  });
  it('rejects foreign, missing, misplaced and over-budget plan references',()=>{
    const id=portfolioEvidenceRegistry[0].id;
    const block={...blankBlock('story'),projectIds:[publicProjects[1].id],answerPlan:{version:1 as const,facets:[{kind:'process' as const,evidenceIds:[id],status:'supported' as const}]}};
    expect(validateComposition({blocks:[block]})).toBeNull();
    expect(validateComposition({blocks:[{...block,projectIds:[publicProjects[0].id],answerPlan:{...block.answerPlan,facets:[{...block.answerPlan.facets[0],evidenceIds:['missing']}]}}]})).toBeNull();
    expect(validateComposition({blocks:[{...blankBlock('timeline'),answerPlan:block.answerPlan}]})).toBeNull();
  });
});

describe('conversation and durable views',()=>{
  it('makes a subject correction instead of displaying the negated subject',()=>{
    const previous=compose('Show Taiwan teaching');
    const result=compose('No, I meant Atlas',previous);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({projectIds:['openai-product-testing-and-feedback'],section:5});
    expect(compose('I meant the newsroom research, not the ChatGPT testing.',previous).blocks).toHaveLength(1);
    expect(compose('Not Taiwan but the Boehringer rebrand',previous).blocks[0].projectIds).toEqual(['boehringer-cares-foundation-rebrand-strategy-shift']);
  });
  it('retains subject through shortening, results, sources and an explicit subject change',()=>{
    let result=compose('What did Isaac contribute to Pulse?');
    result=compose('Make it shorter',result);
    expect(result.blocks[0].projectIds).toEqual(['openai-product-testing-and-feedback']);
    expect(result.blocks[0].paragraphIndices).toHaveLength(1);
    result=compose('What were the outcomes?',result);
    expect(result.blocks[0].projectIds).toEqual(['openai-product-testing-and-feedback']);
    result=compose('Show its sources',result);
    expect(result.blocks[0]).toMatchObject({section:4,focus:'evidence'});
    result=compose('Actually, I meant the journalism thesis',result);
    expect(result.blocks[0].projectIds).toEqual(['senior-thesis-local-journalism']);
  });
  it('compares the current subject with one newly named project',()=>{
    const previous=compose('Show Taiwan teaching');
    const result=compose('Compare this with the journalism thesis',previous);
    expect(result.blocks[0]).toMatchObject({kind:'comparison',projectIds:['fulbright-focus-group-sponsored-by-openai','senior-thesis-local-journalism']});
  });
  it('migrates stable references by content, rejects removed evidence, and clears plans on manual section changes',()=>{
    const result=compose('What did Isaac contribute to Pulse?');
    const view=createPortableView(result);
    const old={...view,contentVersion:'canvas-2025-01-01-v1',composition:{blocks:view.composition.blocks.map(block=>({...block,section:100}))}};
    const migrated=readPortableView(old);
    expect(migrated.contentVersion).toBe(CONTENT_VERSION);
    expect(migrated.composition.blocks[0].section).toBe(4);
    expect(decodeView(encodeView(migrated))).toEqual(migrated);
    expect(applyPortfolioAction(migrated,{type:'update_module',index:0,changes:{section:2}}).composition.blocks[0].answerPlan).toBeUndefined();
    const broken=structuredClone(old);broken.composition.blocks[0].answerPlan!.facets[0].evidenceIds=['deleted'];
    expect(()=>readPortableView(broken)).toThrow(/changed/);
  });
});


describe('recoverable question interpretation',()=>{
  it('distinguishes real subject ambiguity from missing public detail',()=>{
    expect(analyzePortfolioRequest('OpenAI work').kind).toBe('ambiguous');
    expect(analyzePortfolioRequest('OpenAI work').choices).toHaveLength(2);
    expect(analyzePortfolioRequest('What shipped because of Isaac’s Pulse feedback?').kind).toBe('missing_material');
    expect(analyzePortfolioRequest('How do I bake a cake?').kind).toBe('out_of_scope');
  });
  it('resolves a role-linked contribution only through its reviewed project association',()=>{
    const previous=compose('Tell me about his public service communications work.');
    expect(compose('What exactly was his contribution there?',previous).blocks[0]).toMatchObject({kind:'story',projectIds:['congressional-office-setup-100-day-report']});
  });
  it('treats causal adoption as a source-limited personal-impact question',()=>{
    const result=compose('Which states adopted AI because Isaac published his index?');
    expect(result.blocks[0]).toMatchObject({kind:'story',angle:'measurement',projectIds:['artificial-intelligence-in-state-government-index']});
    expect(resolveAnswerPlan(result.blocks[0]).some(facet=>facet.kind==='limits'&&facet.status==='unavailable')).toBe(true);
  });
  it('handles comma-enumerated questions as distinct requested facets',()=>{
    const result=compose('In the ChatGPT Lab, what was Isaac responsible for, what did his testing involve, and what outcomes are actually documented?');
    expect(resolveAnswerPlan(result.blocks[0]).map(facet=>facet.kind)).toEqual(['contribution','process','outcomes','limits']);
  });
});


describe('multi-turn role-to-evidence journey',()=>{
  it('keeps one reviewed subject through six meaningful turns',()=>{
    let result=compose('Tell me about his public service communications work.');
    for(const question of ['What exactly was his contribution there?','How did that work get done?','And what changed as a result?','Make it shorter','Show the underlying report']){
      result=compose(question,result);
      expect(result.blocks[0].kind).toBe('story');
      expect(result.blocks[0].projectIds).toEqual(['congressional-office-setup-100-day-report']);
      expect(validateComposition(result)).not.toBeNull();
    }
    expect(resolveAnswerPlan(result.blocks[0]).flatMap(facet=>facet.evidence).some(record=>record.kind==='link'&&record.text==='Read the 100 Day Report')).toBe(true);
  });
});

describe('broad product-cohort methods and attributed outcomes',()=>{
  it('answers methods with actual testing and feedback, not just the workflow book',()=>{
    const result=compose('In the ChatGPT Lab, what was Isaac responsible for, what did his testing involve, and what outcomes are actually documented?');
    const facets=resolveAnswerPlan(result.blocks[0]);
    const methods=facets.find(facet=>facet.kind==='process')!.evidence;
    expect(methods.slice(0,2).map(record=>record.sectionIndex)).toEqual([2,4]);
    expect(methods[0].text).toContain('Socratic questions');
    expect(methods[1].text).toContain('clearer sources');
    const results=facets.find(facet=>facet.kind==='outcomes')!.evidence;
    expect(results.map(record=>record.sectionIndex)).toEqual([1,2]);
    const limits=facets.find(facet=>facet.kind==='limits')!;
    expect(limits.status).toBe('limited');
    expect(limits.evidence[0]).toMatchObject({kind:'qualification',provenance:'reviewed-qualification'});
    expect(limits.evidence[0].text).toContain('does not report controlled product evaluations or establish which shipped features resulted');
  });
  it.each(['Pulse','Atlas','Study Mode'])('keeps explicit %s testing questions in that product',product=>{
    const result=compose(`What did Isaac’s testing of ${product} involve?`);
    const expected=product==='Pulse'?4:product==='Atlas'?5:2;
    const methods=resolveAnswerPlan(result.blocks[0]).find(facet=>facet.kind==='process')!;
    expect(methods.evidence[0].sectionIndex).toBe(expected);
    expect(methods.evidence.every(record=>record.kind!=='qualification')).toBe(true);
  });
});
