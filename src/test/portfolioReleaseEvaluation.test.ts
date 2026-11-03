import {describe,expect,it,vi} from 'vitest';
import {scoreCase,summarizeEvaluation} from '../../scripts/portfolio-evaluation.mjs';
import {scoreRenderedAnswer,evaluateReleaseGate} from '../../scripts/portfolio-quality.mjs';
import {buildContentAudit,checkPublicLink} from '../../scripts/portfolio-content-audit.mjs';
import {renderedAnswer} from '../../scripts/portfolio-rendering.mjs';
import {createElement} from 'react';

const test={aspects:[{id:'work',anyOf:['checked the evidence']},{id:'outcome',anyOf:['published the report','released the report']}]};
const row={id:'one',ok:true,ms:250,provenance:'local_authored',quality:{evaluated:true,complete:true}};
const report={mode:'authored',corpus:'release',cases:1,failed:0,skipped:0,notSelected:0,results:[row]};
describe('rendered answer release gates',()=>{
  it('credits verified cross-section plan evidence without pretending the navigation section changed',()=>{
    const test={id:'multi',projectId:'public',section:2,paragraphIndices:[1]};
    const scored=scoreCase(test,{composition:{blocks:[{kind:'story',projectIds:['public'],section:0,paragraphIndices:[0]}]},evidence:[{id:'known',projectId:'public',sectionIndex:2,paragraphIndex:1}]});
    expect(scored).toMatchObject({ok:true,sectionMatch:true,paragraphMatch:true,selected:{section:0},selectedEvidence:[{id:'known'}]});
    expect(summarizeEvaluation([test],[{id:'multi',...scored,provenance:'local_authored'}]).coverage[0].matchedParagraphs).toEqual(['2:1']);
    expect(scoreCase(test,{composition:{blocks:[{kind:'story',projectIds:['public'],section:0}]},evidence:[{projectId:'other',sectionIndex:2,paragraphIndex:1}]}).ok).toBe(false);
  });
  it('rejects unrelated projects while preserving every actual module in diagnostics',()=>{
    const composition={blocks:[{kind:'story',projectIds:['thesis'],section:0},{kind:'story',projectIds:['brand'],section:0}]};
    const scored=scoreCase({projectId:'thesis',section:0},{composition});
    expect(scored).toMatchObject({ok:false,selectionMatch:true,sectionMatch:true,subjectMatch:false,extraneousProjectIds:['brand'],missingProjectIds:[],extraneousModules:[{index:1,kind:'story',projectIds:['brand']}]});
    expect(scored.selectedModules).toHaveLength(2);
    expect(evaluateReleaseGate({...report,results:[{...row,...scored}]}).failures).toContainEqual({reason:'extraneous_subjects',cases:['one']});
  });
  it('supports intentional mixed answers through an explicit expected/allowed subject contract',()=>{
    const composition={blocks:[{kind:'story',projectIds:['thesis'],section:0},{kind:'story',projectIds:['brand'],section:0}]};
    expect(scoreCase({expectedProjectIds:['thesis','brand']},{composition})).toMatchObject({ok:true,subjectMatch:true,extraneousProjectIds:[],missingProjectIds:[]});
    expect(scoreCase({projectId:'thesis',allowedProjectIds:['thesis','brand']},{composition}).ok).toBe(true);
    expect(scoreCase({expectedProjectIds:['thesis','brand']},{composition:{blocks:[composition.blocks[0]]}})).toMatchObject({ok:false,missingProjectIds:['brand']});
  });
  it('rejects unrelated modules with empty project IDs and permits explicit cross-kind answers',()=>{
    const composition={blocks:[{kind:'story',projectIds:['thesis'],section:0},{kind:'contact',projectIds:[],section:0}]};
    expect(scoreCase({projectId:'thesis'},{composition})).toMatchObject({ok:false,extraneousModules:[{index:1,kind:'contact',unexpectedKind:true}]});
    expect(scoreCase({projectId:'thesis',allowedModuleKinds:['story','contact']},{composition}).ok).toBe(true);
  });
  it('does not invent a project restriction for generic cases without a subject contract',()=>{
    const composition={blocks:[{kind:'timeline',projectIds:[],section:0},{kind:'story',projectIds:['thesis'],section:0}]};
    expect(scoreCase({kind:'timeline'},{composition})).toMatchObject({ok:true,subjectMatch:null,allowedProjectIds:null,extraneousModules:[]});
  });
  it('keeps comparison subjects exact while accepting both named projects',()=>{
    const composition={blocks:[{kind:'comparison',projectIds:['thesis','brand'],section:0}]};
    expect(scoreCase({kind:'comparison',projects:['thesis','brand']},{composition})).toMatchObject({ok:true,subjectMatch:true});
    expect(scoreCase({kind:'comparison',projects:['thesis','brand']},{composition:{blocks:[{...composition.blocks[0],projectIds:['thesis','other']}]}})).toMatchObject({ok:false,extraneousProjectIds:['other'],missingProjectIds:['brand']});
  });
  it('checks every requested aspect and permits explicitly reviewed equivalent excerpts',()=>{
    expect(scoreRenderedAnswer(test,{text:'He CHECKED the evidence. Then released the report.'})).toMatchObject({evaluated:true,complete:true});
    expect(scoreRenderedAnswer(test,{text:'He checked the evidence.'})).toMatchObject({complete:false,aspects:[{id:'work',matched:true},{id:'outcome',matched:false}]});
  });
  it('does not turn unavailable rendering into a passing answer',()=>{
    expect(scoreRenderedAnswer(test,undefined)).toMatchObject({evaluated:false,complete:false});
    expect(scoreRenderedAnswer({},undefined)).toBeNull();
  });
  it('excludes control labels, closed disclosures and hidden content from completeness',()=>{
    const Component=()=>createElement('article',null,
      createElement('p',null,'Visible answer'),
      createElement('button',null,'not an answer'),
      createElement('details',null,createElement('summary',null,'Sources'),createElement('a',{href:'https://example.com'},'closed source')),
      createElement('p',{'aria-hidden':'true'},'hidden answer'),
      createElement('details',{open:true},createElement('summary',null,'Reading'),createElement('p',null,'Opened passage')));
    const rendered=renderedAnswer({ProjectStory:Component},{blocks:[{kind:'story'}]});
    expect(rendered.text).toContain('Visible answer');expect(rendered.text).toContain('Opened passage');
    expect(rendered.text).not.toMatch(/not an answer|closed source|hidden answer/);expect(rendered.linkCount).toBe(0);
  });
  it('rejects forbidden unsupported claims even when requested aspects match',()=>{
    expect(scoreRenderedAnswer({...test,mustNotInclude:['caused a 50% improvement']},{text:'checked the evidence and published the report; caused a 50% improvement'})).toMatchObject({complete:false,violations:['caused a 50% improvement']});
  });
  it('gates full corpus completeness and fails on missing visible aspects despite correct IDs',()=>{
    expect(evaluateReleaseGate(report,{requireQuality:true})).toMatchObject({passed:true,completeAnswers:1});
    const result=evaluateReleaseGate({...report,notSelected:1,results:[{...row,quality:{evaluated:true,complete:false}}]},{requireQuality:true});
    expect(result.passed).toBe(false);expect(result.failures.map(f=>f.reason)).toEqual(['incomplete_corpus','answer_aspects_missing']);
  });
  it('requires quality targets and fresh provenance only when requested',()=>{
    expect(evaluateReleaseGate({...report,results:[{...row,quality:null}]},{requireQuality:true}).failures).toContainEqual({reason:'quality_targets_missing',count:1});
    expect(evaluateReleaseGate(report,{requireFreshProvider:true}).failures).toContainEqual({reason:'fresh_provider_required',cases:['one']});
  });
  it('rejects regressions and incompatible baseline corpora',()=>{
    expect(evaluateReleaseGate({...report,results:[{...row,quality:{evaluated:true,complete:false}}]},{baseline:report}).failures).toContainEqual({reason:'baseline_regression',case:'one'});
    expect(evaluateReleaseGate(report,{baseline:{...report,corpus:'different'}}).failures).toContainEqual({reason:'baseline_corpus_mismatch'});
  });
  it('uses evaluated total latency for the optional p95 budget',()=>{
    expect(evaluateReleaseGate(report,{maxP95Ms:200})).toMatchObject({passed:false,p95Ms:250});
    expect(evaluateReleaseGate(report,{maxP95Ms:300}).passed).toBe(true);
  });
});
describe('public content inventory and link-check boundaries',()=>{
  const inventory={matrix:[{projectId:'public',sections:[{index:0,heading:'Evidence',passages:['new']},{index:1,heading:'Materials',passages:[]}]}],evidence:[{id:'new',projectId:'public',sectionId:'section',sectionIndex:0,kind:'paragraph',text:'Known published evidence'}],cases:[{id:'question',projectId:'public',section:0,question:'What happened?'}],contentVersion:'new'};
  it('identifies editorial coverage gaps and impacted cases without network access',()=>{
    const fetcher=vi.spyOn(globalThis,'fetch');
    try{const audit=buildContentAudit({...inventory,baseline:{contentVersion:'old',evidence:[{id:'removed',projectId:'public'}]}});
      expect(audit.networkRequests).toBe(0);expect(audit.editorialReview).toHaveLength(1);
      expect(audit.impact).toMatchObject({added:['new'],removed:['removed'],affectedProjects:['public'],affectedCases:['question']});expect(fetcher).not.toHaveBeenCalled();
    }finally{fetcher.mockRestore();}
  });
  it.each(['file:///etc/passwd','https://private:password@example.com','http://127.0.0.1','http://2130706433','http://192.168.0.1','http://[::1]','http://metadata.local'])('does not request a nonpublic source: %s',async href=>{
    const fetcher=vi.fn();expect(await checkPublicLink(href,{fetchImpl:fetcher})).toMatchObject({status:'not_checked',requests:0});expect(fetcher).not.toHaveBeenCalled();
  });
  it('checks redirect destinations before sending a second HEAD request',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:302,headers:{location:'http://169.254.169.254/latest'}}));
    expect(await checkPublicLink('https://example.com',{fetchImpl:fetcher})).toMatchObject({status:'unverified',reason:'redirect_not_public',requests:1});expect(fetcher).toHaveBeenCalledOnce();
  });
  it('treats HEAD refusal as unverified instead of a broken artifact',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:405}));
    expect(await checkPublicLink('https://example.com',{fetchImpl:fetcher})).toMatchObject({status:'unverified',httpStatus:405,requests:1});
    expect(fetcher.mock.calls[0][1]).toMatchObject({method:'HEAD',redirect:'manual'});
  });
});
