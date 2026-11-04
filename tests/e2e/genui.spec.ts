import { expect, test } from '@playwright/test';

// Cases own their pages, requests and preferences; keep matrix workers independent.
test.describe.configure({mode:'parallel'});
const taiwan='fulbright-focus-group-sponsored-by-openai';
const policy='artificial-intelligence-in-state-government-index';
const block=(kind:string,layout:string,projectIds:string[]=[])=>({kind,layout,projectIds,albumIds:[],states:[],region:'All',metric:'compositeScore',section:0,focus:'overview',search:'',expanded:false,band:null});
const directPlan=(request:{current:object;revision:number;contentVersion:string})=>({...request.current,revision:request.revision,contentVersion:request.contentVersion,source:'local',layout:'detail',projectIds:[taiwan],albumIds:[]});

test('a direct generated composition renders multiple subjects before a slow configuration probe completes',async({page})=>{
  let releaseConfiguration!:()=>void;
  const configuration=new Promise<void>(resolve=>{releaseConfiguration=resolve;});
  let compositionRequests=0;
  await page.route('**/api/intent',async route=>{
    const request=route.request().postDataJSON();
    await route.fulfill({json:{plan:directPlan(request),needsComposition:true,composerConfigured:true}});
  });
  await page.route('**/api/compose',async route=>{
    if(route.request().method()==='GET'){
      await configuration;
      await route.fulfill({json:{configured:true}}).catch(()=>{});return;
    }
    compositionRequests++;
    const request=route.request().postDataJSON();
    const composition={blocks:[{...block('story','project-process',[taiwan]),focus:'process',section:1},{...block('story','project-outcomes',[policy]),focus:'outcomes'}]};
    await route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({type:'composition',composition,revision:request.revision,contentVersion:request.contentVersion,partial:false,model:'browser-contract-fixture'})+'\n'});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('Connect Isaac’s Taiwan program and AI policy research');await input.press('Escape');await input.press('Enter');
  try{
    await expect(page.getByRole('region',{name:'Project explorer'})).toHaveCount(2);
    await expect.poll(()=>compositionRequests).toBe(1);
    await expect(page.locator('[data-layout="project-process"]')).toContainText('AI literacy in Taiwan');
    await expect(page.locator('[data-layout="project-outcomes"]')).toContainText('AI in state government');
    await expect(page.getByRole('button',{name:'Explore',exact:true})).not.toHaveAttribute('aria-busy','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }finally{releaseConfiguration();}
});

test('a manual control change survives an aborted delayed generated response',async({page})=>{
  let releaseComposition!:()=>void;
  let startedComposition!:()=>void;
  let finishedComposition!:()=>void;
  const compositionFinished=new Promise<void>(resolve=>{finishedComposition=resolve;});
  const compositionReady=new Promise<void>(resolve=>{startedComposition=resolve;});
  const compositionGate=new Promise<void>(resolve=>{releaseComposition=resolve;});
  await page.route('**/api/intent',async route=>{
    const request=route.request().postDataJSON();
    await route.fulfill({json:{plan:{...directPlan(request),layout:'work',projectIds:[policy]},needsComposition:true,composerConfigured:true}});
  });
  await page.route('**/api/compose',async route=>{
    if(route.request().method()==='GET'){await route.fulfill({json:{configured:true}});return;}
    const request=route.request().postDataJSON();startedComposition();await compositionGate;
    await route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({type:'composition',composition:{blocks:[block('contact','contact-card')]},revision:request.revision,contentVersion:request.contentVersion,partial:false,model:'browser-contract-fixture'})+'\n'}).catch(()=>{});
    finishedComposition();
  });
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('Compare California and Washington');await input.press('Escape');await input.press('Enter');
  await compositionReady;
  await page.getByRole('combobox',{name:'Benchmark measure'}).selectOption('preparednessScore');
  releaseComposition();
  await compositionFinished;
  await expect(page.getByRole('article',{name:'California score'})).toContainText('75.0');
  await expect(page.getByRole('button',{name:'Explore',exact:true})).not.toHaveAttribute('aria-busy','true');
  await expect(page.getByRole('region',{name:'Contact'})).toHaveCount(0);
  // A new draft still leaves the committed comparison intact.
  await input.fill('an unfinished question');
  await expect(page.getByRole('combobox',{name:'Benchmark measure'})).toHaveValue('preparednessScore');
});

for(const theme of ['light','dark']) test(`${theme}: linked evidence keeps local controls and survives a shared view`,async({page})=>{
  let requests=0;
  await page.setViewportSize({width:theme==='light'?1440:390,height:900});
  await page.addInitScript(value=>{
    localStorage.setItem('theme',value);
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{(window as Window & {copiedView?:string}).copiedView=text;}}});
  },theme);
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',async route=>{
    requests++;const request=route.request().postDataJSON();
    await route.fulfill({json:{plan:{...directPlan(request),layout:'timeline',projectIds:[]},needsComposition:false}});
  });
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('What connects Isaac’s work across fields?');await input.press('Escape');await input.press('Enter');
  const result=page.getByRole('region',{name:'Connections across the work'});
  await expect(result).toBeVisible();await expect.poll(()=>requests).toBe(1);
  await result.getByRole('combobox',{name:'Connection to explore'}).selectOption('listening');
  await result.getByRole('button',{name:'Outcomes',exact:true}).click();
  await expect(result.getByRole('heading',{name:'Inside the ChatGPT Lab'})).toBeVisible();
  await result.locator('summary').first().click();
  await expect(result.getByRole('button',{name:/^Explore /}).first()).toBeVisible();
  expect(requests).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Copy link to this view'}).click();
  const shared=await page.evaluate(()=>(window as Window & {copiedView?:string}).copiedView);
  expect(shared).toContain('#view=');await page.goto(shared!);
  await expect(page.getByRole('combobox',{name:'Connection to explore'})).toHaveValue('listening');
  await expect(page.getByRole('button',{name:'Outcomes',exact:true})).toHaveAttribute('aria-pressed','true');
});

for (const reducedMotion of ['no-preference','reduce'] as const) test(`ranking refinement settles with preserved controls: ${reducedMotion}`,async({page})=>{
  await page.emulateMedia({reducedMotion});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('Rank governments by AI preparedness');await input.press('Escape');await input.press('Enter');
  const scores=page.getByLabel('Government scores',{exact:true});
  await expect(scores).toBeVisible();
  const measure=page.getByRole('combobox',{name:'Benchmark measure'});
  await measure.focus();
  await measure.selectOption('compositeScore');
  await measure.selectOption('preparednessScore');
  await expect.poll(()=>scores.locator('.canvas-bar strong').evaluateAll(nodes=>{
    const values=nodes.map(node=>Number(node.textContent));
    return values.length>1&&values.every((value,index)=>Number.isFinite(value)&&(index===0||values[index-1]>=value));
  })).toBe(true);
  await expect.poll(()=>scores.locator('.canvas-bar').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).transform==='none'))).toBe(true);
  await expect(measure).toBeFocused();
  const facets=page.getByRole('group',{name:'Explore benchmark'});
  await facets.getByRole('button',{name:'Regions',exact:true}).click();
  await facets.getByRole('button',{name:'Distribution',exact:true}).click();
  await expect(facets.getByRole('button',{name:'Distribution',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>facets.locator('.portfolio-tab-indicator').evaluate(el=>{
    const marker=el.getBoundingClientRect(),button=el.parentElement!.getBoundingClientRect();
    return Math.abs(marker.left-button.left)+Math.abs(marker.width-button.width);
  })).toBeLessThan(1);
  await page.emulateMedia({reducedMotion:reducedMotion==='reduce'?'no-preference':'reduce'});
  await facets.getByRole('button',{name:'Rankings',exact:true}).click();
  await expect(scores).toBeVisible();
  await expect(facets.locator('.portfolio-tab-indicator')).toHaveCount(1);
});

for(const width of [320,390])test(`submitted questions wrap and resize without clipping at ${width}px`,async({page})=>{
  let posts=0;
  await page.setViewportSize({width,height:844});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  const blankHeight=(await input.boundingBox())!.height;
  const question='What feedback did Isaac give on Atlas?';
  await input.fill(question);expect(posts).toBe(0);await input.press('Escape');await input.press('Enter');
  await expect(page.getByRole('combobox',{name:'Lab work to explore'})).toHaveValue('5');
  await expect(input).toHaveValue(question);await expect.poll(()=>posts).toBe(1);
  const display=input;
  await expect(display).toHaveValue(question);
  await expect.poll(()=>display.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await expect.poll(async()=>(await display.boundingBox())!.height).toBeGreaterThan(blankHeight);
  await page.setViewportSize({width:1280,height:900});
  await expect.poll(async()=>Math.abs((await display.boundingBox())!.height-blankHeight)).toBeLessThan(1);
  await page.setViewportSize({width,height:844});
  await expect.poll(async()=>(await display.boundingBox())!.height).toBeGreaterThan(blankHeight);
  await expect(input).toHaveValue(question);expect(posts).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const reducedMotion of ['no-preference','reduce'] as const)test(`project image handoff preserves reading and the searched return path: ${reducedMotion}`,async({page})=>{
  await page.setViewportSize({width:1280,height:900});await page.emulateMedia({reducedMotion});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('Explore all projects');await input.press('Escape');await input.press('Enter');
  const search=page.getByRole('searchbox',{name:'Find a project',exact:true});await search.fill('Taiwan');
  const tile=page.getByRole('button',{name:'Leading AI Literacy Efforts in Taiwan',exact:true});
  await expect(tile).toBeVisible();await expect.poll(()=>tile.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  const samples=page.evaluate(async()=>{
    const frames:{image:string;reading:string}[]=[];
    for(let i=0;i<45;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>{
      const image=document.querySelector('.portfolio-workbench-visual>a');const reading=document.querySelector('.portfolio-workbench-reader');
      if(image&&reading)frames.push({image:getComputedStyle(image).transform,reading:getComputedStyle(reading).transform});resolve();
    }));return frames;
  });
  await tile.click();
  const title=page.getByRole('heading',{name:'AI literacy in Taiwan',exact:true});
  await expect(title).toBeVisible();await expect(title).toHaveCSS('clip-path','none');
  const frames=await samples;expect(frames.length).toBeGreaterThan(0);expect(frames.every(frame=>frame.reading==='none')).toBe(true);
  expect(frames.some(frame=>frame.image!=='none')).toBe(reducedMotion==='no-preference');
  await expect.poll(()=>page.locator('.portfolio-workbench-visual>a').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  await page.getByRole('button',{name:'Back to projects',exact:true}).click();await expect(search).toHaveValue('Taiwan');await expect(tile).toBeFocused();
});

for(const width of [320,390])test(`project facets keep every label within its selected surface at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('Taiwan teaching');await input.press('Escape');await input.press('Enter');
  const facets=page.getByRole('group',{name:'Explore project',exact:true});
  await expect.poll(()=>facets.locator('.portfolio-tab-label').evaluateAll(labels=>labels.every(label=>{
    const text=label.getBoundingClientRect(),button=label.parentElement!.getBoundingClientRect();return text.left>=button.left&&text.right<=button.right;
  }))).toBe(true);
  await facets.getByRole('button',{name:'Outcomes',exact:true}).click();
  await page.getByRole('combobox',{name:'Project',exact:true}).selectOption('openai-product-testing-and-feedback');
  await expect(page.getByRole('heading',{name:'Inside the ChatGPT Lab',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Published',exact:true})).toHaveAttribute('aria-pressed','true');
  await input.fill('Rank governments by AI preparedness');await input.press('Escape');await input.press('Enter');
  const benchmark=page.getByRole('group',{name:'Explore benchmark',exact:true});await benchmark.getByRole('button',{name:'Distribution',exact:true}).click();
  await expect.poll(()=>benchmark.locator('.portfolio-tab-label').evaluateAll(labels=>labels.every(label=>{
    const text=label.getBoundingClientRect(),button=label.parentElement!.getBoundingClientRect();return text.left>=button.left&&text.right<=button.right;
  }))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const reducedMotion of ['no-preference','reduce'] as const)test(`native disclosures fold smoothly and release keyboard focus immediately: ${reducedMotion}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('Taiwan teaching');await input.press('Escape');await input.press('Enter');
  await expect.poll(()=>page.locator('.home-genui-reveal-content').getAttribute('data-disclosure-instant')).toBeNull();
  const disclosure=page.locator('.home-next-questions');const summary=disclosure.locator('summary');
  await summary.click();await expect(disclosure).toHaveAttribute('open','');
  await expect.poll(()=>page.locator('.home-genui-reveal').evaluate(el=>Math.abs(el.getBoundingClientRect().height-el.querySelector('.home-genui-reveal-content')!.getBoundingClientRect().height))).toBeLessThan(1);
  await summary.click();await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Copy link to this view'})).toBeFocused();
  await expect(disclosure).not.toHaveAttribute('open','');
  await summary.click();await expect(disclosure.locator('[data-disclosure-inert]')).toHaveCount(0);
  await page.getByRole('button',{name:'Clear exploration'}).click();
  await expect(page.locator('.home-genui-stage')).toHaveCount(0);
  await page.getByRole('button',{name:'Undo clear'}).click();
  await expect(disclosure).toHaveAttribute('open','');
  await expect(disclosure.locator('[data-disclosure-inert]')).toHaveCount(0);
});

for(const reducedMotion of ['no-preference','reduce'] as const){
  test(`multiline questions retain their geometry and selection through focus changes (${reducedMotion})`,async({page})=>{
    await page.emulateMedia({reducedMotion});
    await page.setViewportSize({width:390,height:844});
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
    await page.goto('/');
    const input=page.getByRole('textbox',{name:'Explore',exact:true});
    const question='How did Isaac turn participant feedback into changes in the Taiwan teaching program?';
    await input.fill(question);await input.press('Escape');await input.press('Enter');
    await expect(page.getByRole('region',{name:'Project explorer'})).toBeVisible();
    await expect.poll(async()=>Math.round((await input.boundingBox())!.height)).toBeGreaterThan(42);
    await page.waitForTimeout(650);
    const before=await input.boundingBox();
    await page.getByRole('button',{name:'Process',exact:true}).focus();
    await input.focus();await input.press('ArrowLeft');await input.press('Shift+ArrowRight');
    const selection=await input.evaluate((element:HTMLTextAreaElement)=>[element.selectionStart,element.selectionEnd]);
    await input.press('Escape');await input.press('ArrowDown');
    await page.waitForTimeout(250);
    const after=await input.boundingBox();
    expect(Math.abs(after!.height-before!.height)).toBeLessThan(1);
    expect(selection[1]-selection[0]).toBe(1);
    await expect(input).toHaveValue(question);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await input.fill('x'.repeat(500));await input.press('Escape');
    await expect.poll(async()=>Math.round((await input.boundingBox())!.height)).toBe(160);
    expect(await input.evaluate((element:HTMLTextAreaElement)=>element.scrollHeight>element.clientHeight)).toBe(true);
    await input.fill('Taiwan');await input.press('Escape');
    await expect.poll(async()=>Math.round((await input.boundingBox())!.height)).toBe(42);
  });
}

test('help generates inside the same pane, stays local, and restores after Clear',async({page})=>{
  let posts=0;
  await page.route('**/api/compose',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{configured:false}});});
  await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
  await page.setViewportSize({width:320,height:568});
  await page.goto('/');
  await page.getByRole('button',{name:'How to explore',exact:true}).click();
  const help=page.getByRole('article',{name:'How to explore'});
  await expect(help).toBeVisible();
  expect(await help.evaluate(element=>Boolean(element.closest('.home-genui-stage')))).toBe(true);
  await expect(help.getByRole('heading',{name:'How it works'})).toBeVisible();
  await expect(help.getByRole('heading',{name:'Help make this better'})).toBeVisible();
  await expect(help.getByRole('button')).toHaveCount(4);
  expect(posts).toBe(0);
  await help.getByText('Technical details',{exact:true}).click();
  await expect(help.getByText(/server validates its response/)).toBeVisible();
  await page.getByRole('button',{name:'Clear exploration'}).click();
  await page.getByRole('button',{name:'Undo clear'}).click();
  await expect(help).toBeVisible();
  await expect(help.getByText('Technical details',{exact:true}).locator('..')).toHaveAttribute('open','');
  expect(posts).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await help.getByRole('button',{name:'How did Isaac help teachers in Taiwan?'}).click();
  await expect(page.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeVisible();
});

test('tablet screenshots retain the source proportions without an artificial letterbox',async({page})=>{
  await page.setViewportSize({width:768,height:1000});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  // Use a local fixture with known proportions so asset delivery does not decide the test.
  await page.route('**/chat-lab/OpenAI_StudyMode_Flow_*.png',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="white"/></svg>'}));
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('What feedback did Isaac give on Study Mode?');await input.press('Escape');await input.press('Enter');
  const image=page.locator('.portfolio-project-image');
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  const proportions=await image.evaluate((img:HTMLImageElement)=>({source:img.naturalWidth/img.naturalHeight,display:img.getBoundingClientRect().width/img.getBoundingClientRect().height}));
  expect(Math.abs(proportions.source-proportions.display)).toBeLessThan(.01);
});

for(const width of [320,1280])for(const [question,projectId] of [
  ['Who is Isaac?',null],
  ['How did Isaac help teachers in Taiwan?',taiwan],
  ['How did Isaac research AI in government?',policy],
  ['What was Isaac’s role in Congress?','congressional-office-setup-100-day-report'],
] as const){
  test(`a first-time visitor can explore ${question} at ${width}px`,async({page})=>{
    let posts=0;
    await page.setViewportSize({width,height:900});
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
    await page.goto('/');
    await page.getByRole('textbox',{name:'Explore',exact:true}).focus();
    expect(posts).toBe(0);
    await page.getByRole('option',{name:question,exact:true}).click();
    const results=page.locator('.home-genui-stage');
    if(projectId)await expect(results.getByRole('combobox',{name:'Project',exact:true})).toHaveValue(projectId);
    else await expect(results.getByText(/Isaac is a tech generalist/)).toBeVisible();
    if(projectId===taiwan)await expect(results.getByText(/I designed the Lab as six sessions covering AI fundamentals/)).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test('the first-visit guide remains reachable by keyboard after suggestions dismiss',async({page})=>{
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.focus();await input.press('Tab');
  await expect(page.getByRole('button',{name:'How to explore',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.home-genui-stage h2')).toBeFocused();
});

test('hovering suggestions leaves Enter in control of the visitor’s own question',async({page})=>{
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('taiwan');
  await page.getByRole('option').nth(1).hover();
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await input.press('Enter');
  await expect(input).toHaveValue('taiwan');
  await expect(page.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeVisible();
});

for(const width of [320,1440])test(`first-visit questions share the input reading edge at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'Explore',exact:true});await input.focus();
  const question=page.getByRole('option',{name:'Who is Isaac?',exact:true}).locator('span');
  expect(Math.abs((await input.boundingBox())!.x-(await question.boundingBox())!.x)).toBeLessThan(1);
});

test('square product media and its explanation align with the reading edge',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
  await page.route('**/chat-lab/pulse1.webp',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1920"><rect width="1920" height="1920" fill="white"/></svg>'}));
  await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
  await input.fill('What feedback did Isaac give on Pulse?');await input.press('Escape');await input.press('Enter');
  await expect(page.getByRole('combobox',{name:'Lab work to explore'})).toHaveValue('4');
  await expect.poll(()=>page.locator('.portfolio-project-image').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  const geometry=await page.evaluate(()=>{const box=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();return {imageLeft:box('.portfolio-project-image').left,readingLeft:box('.portfolio-workbench-body').left,textGap:box('.portfolio-workbench-reader').top-box('.portfolio-lab-product-choice').bottom};});
  expect(Math.abs(geometry.imageLeft-geometry.readingLeft)).toBeLessThan(1);
  expect(geometry.textGap).toBeGreaterThanOrEqual(0);expect(geometry.textGap).toBeLessThanOrEqual(16);
});

for(const [draft,feature] of [['pul','Pulse'],['stduy mode','Study Mode'],['backtoschool','Back to School']] as const){
  test(`feature suggestions opt in with a partial or imperfect name: ${draft}`,async({page})=>{
    let posts=0;
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
    await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.fill(draft);await expect(page.getByRole('option').first()).toContainText(feature);
    await input.fill('AI');
    await expect(page.getByRole('option',{name:/feedback.*Pulse|feedback.*Study Mode|Back to School/i})).toHaveCount(0);
    expect(posts).toBe(0);
  });
}

for(const reducedMotion of ['no-preference','reduce'] as const){
  test(`short landscape ${reducedMotion}: keyboard suggestions stay visible without scrolling the page`,async({page})=>{
    await page.setViewportSize({width:844,height:390});
    await page.emulateMedia({reducedMotion});
    let posts=0;
    await page.route('**/api/compose',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{configured:false}});});
    await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
    await page.goto('/');
    const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.focus();
    const list=page.getByRole('listbox',{name:'Suggested questions'});
    await expect.poll(()=>list.evaluate(node=>node.parentElement!.getBoundingClientRect().height>=node.getBoundingClientRect().height-1)).toBe(true);
    const initial=await input.evaluate(node=>({top:node.getBoundingClientRect().top,pageY:scrollY}));
    const selectedIsVisible=()=>list.evaluate(node=>{
      const selected=node.querySelector<HTMLElement>('[aria-selected="true"]');
      if(!selected)return false;
      const row=selected.getBoundingClientRect(),bounds=node.getBoundingClientRect();
      return row.top>=bounds.top-1&&row.bottom<=bounds.bottom+1;
    });
    // Up reaches the final shortcut first; Down then wraps and visits every row.
    await input.press('ArrowUp');await expect.poll(selectedIsVisible).toBe(true);
    expect(await list.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
    for(let index=0;index<6;index++){await input.press('ArrowDown');await expect.poll(selectedIsVisible).toBe(true);}
    // Reflowing an already selected row must keep it in the visible list too.
    await page.addStyleTag({content:'.experience-autocomplete [role=option]{font-size:24px;line-height:36px}'});
    await expect.poll(selectedIsVisible).toBe(true);
    const final=await input.evaluate(node=>({top:node.getBoundingClientRect().top,pageY:scrollY}));
    expect(final).toEqual(initial);
    expect(posts).toBe(0);
    await input.press('Enter');
    await expect(page.getByRole('heading',{name:'Explore work',exact:true})).toBeAttached();
  });
}

for(const [width,height] of [[390,844],[768,1000],[1440,900],[844,390]])for(const [feature,pattern,imageHeight] of [
  ['Study Mode','**/chat-lab/OpenAI_StudyMode_Flow_*.png',1080],
  ['Pulse','**/chat-lab/pulse1.webp',1920],
] as const){
  test(`${width}×${height}: ${feature} reserves its actual image shape before pixels arrive`,async({page})=>{
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
    let release!:()=>void;const pixels=new Promise<void>(resolve=>{release=resolve;});
    await page.route(pattern,async route=>{
      await pixels;
      await route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="${imageHeight}"><rect width="1920" height="${imageHeight}" fill="white"/></svg>`}).catch(()=>{});
    });
    try{
      await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
      await input.fill(`What feedback did Isaac give on ${feature}?`);await input.press('Escape');await input.press('Enter');
      const image=page.locator('.portfolio-project-image');await expect(image).toBeAttached();
      const geometry=()=>image.evaluate((img:HTMLImageElement)=>{const box=img.getBoundingClientRect();return {width:box.width,height:box.height,naturalWidth:img.naturalWidth};});
      const before=await geometry();expect(before.naturalWidth).toBe(0);expect(before.width).toBeGreaterThan(100);
      expect(Math.abs(before.width/before.height-1920/imageHeight)).toBeLessThan(.01);
      release();await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBe(1920);
      const after=await geometry();expect(Math.abs(after.width-before.width)).toBeLessThan(1);expect(Math.abs(after.height-before.height)).toBeLessThan(1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }finally{release();}
  });
}

for(const width of [390,1440])for(const reducedMotion of ['no-preference','reduce'] as const){
  test(`${width} ${reducedMotion}: Browser Back keeps the expanded guide and unfinished question`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion});
    let posts=0;
    await page.route('**/api/compose',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{configured:false}});});
    await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
    await page.goto('/');await page.getByRole('button',{name:'How to explore',exact:true}).click();
    const summary=page.getByText('Technical details',{exact:true});await summary.click();
    await expect(summary.locator('..')).toHaveAttribute('open','');
    const input=page.getByRole('textbox',{name:'Explore',exact:true});await input.fill('I am still writing my next question');await input.press('Escape');
    await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Writing',exact:true}).click();
    await expect(page).toHaveURL(/\/writing$/);await expect(page.locator('.route-scene')).toHaveAttribute('data-route-path','/writing');
    const returning=page.evaluate(async()=>{
      const frames:{gap:number;open:boolean;opacity:number}[]=[];
      for(let frame=0;frame<180&&frames.length<40;frame++){
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        const help=document.querySelector('.home-explore-help'),pane=document.querySelector('.home-genui-reveal'),content=document.querySelector('.home-genui-reveal-content');
        if(help&&pane&&content)frames.push({gap:Math.abs(pane.getBoundingClientRect().height-content.getBoundingClientRect().height),open:!!help.querySelector('details[open]'),opacity:Number(getComputedStyle(help.firstElementChild!).opacity)});
      }
      return frames;
    });
    await page.goBack();await expect(page).toHaveURL(/\/$/);
    const frames=await returning;expect(frames.length).toBeGreaterThan(0);
    expect(Math.max(...frames.map(frame=>frame.gap))).toBeLessThan(1);
    expect(frames.every(frame=>frame.open&&frame.opacity===1)).toBe(true);
    await expect(page.getByRole('textbox',{name:'Explore',exact:true})).toHaveValue('I am still writing my next question');
    await expect(page.getByText('Technical details',{exact:true}).locator('..')).toHaveAttribute('open','');
    expect(posts).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

for(const width of [390,1440]){
  test(`${width}: broad ChatGPT questions introduce the testing work before product-specific evidence`,async({page})=>{
    await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
    await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.fill('How did Isaac test new ChatGPT features?');await input.press('Escape');await input.press('Enter');
    await expect(page.getByRole('button',{name:'Products',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByRole('combobox',{name:'Lab work to explore'})).toHaveValue('0');
    await expect(page.getByText(/The work moved between product diaries, feedback sessions/)).toBeVisible();
    await page.getByRole('combobox',{name:'Lab work to explore'}).selectOption('4');
    await expect(page.getByText(/Pulse flipped the usual interaction/)).toBeVisible();
    await page.getByRole('button',{name:'Products',exact:true}).click();
    await expect(page.getByRole('combobox',{name:'Lab work to explore'})).toHaveValue('4');
    await page.getByRole('button',{name:'Sources',exact:true}).click();
    await expect(page.getByRole('link',{name:'Meet ChatGPT Pulse'})).toBeVisible();
  });
}

for(const width of [390,1440])for(const reducedMotion of ['no-preference','reduce'] as const){
  test(`${width} ${reducedMotion}: focusing a lower control never scrolls the expanding pane internally`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion});
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
    await page.goto('/');await page.getByRole('button',{name:'How to explore',exact:true}).click();
    await page.getByRole('link',{name:'Send feedback',exact:true}).focus();
    const frames=await page.locator('.home-genui-reveal').evaluate(async pane=>{
      const frames:{scrollTop:number;contentOffset:number}[]=[];
      for(let i=0;i<35;i++){
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        const content=pane.querySelector('.home-genui-reveal-content')!;
        frames.push({scrollTop:pane.scrollTop,contentOffset:content.getBoundingClientRect().top-pane.getBoundingClientRect().top});
      }
      return frames;
    });
    expect(Math.max(...frames.map(frame=>Math.abs(frame.scrollTop)))).toBe(0);
    expect(Math.max(...frames.map(frame=>Math.abs(frame.contentOffset)))).toBeLessThan(1);
    await expect(page.getByRole('link',{name:'Send feedback',exact:true})).toBeFocused();
    await expect.poll(()=>page.locator('.home-genui-reveal').evaluate(pane=>Math.abs(pane.getBoundingClientRect().height-pane.querySelector('.home-genui-reveal-content')!.getBoundingClientRect().height))).toBeLessThan(1);
    await expect(page.getByRole('link',{name:'Send feedback',exact:true})).toBeInViewport();
  });
}

for(const width of [320,1440])for(const question of ['Hello','zxq unfamiliar topic']){
  test(`${width}: Help remains reachable after ${question}`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
    let posts=0;
    await page.route('**/api/compose',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{configured:false}});});
    await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
    await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.fill(question);await input.press('Escape');await input.press('Enter');
    const help=page.getByRole('button',{name:'How to explore',exact:true});await expect(help).toBeVisible();
    const before=posts;await help.focus();await help.press('Enter');
    await expect(page.getByRole('heading',{name:'Start with a little curiosity.',exact:true})).toBeVisible();
    expect(posts).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

for(const width of [320,1440]){
  test(`${width}: Escape preserves an unmatched draft and reveals the local guide`,async({page})=>{
    await page.setViewportSize({width,height:900});let posts=0;
    await page.route('**/api/compose',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{configured:false}});});
    await page.route('**/api/intent',route=>{posts++;return route.fulfill({status:503,json:{}});});
    await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.fill('zxq unfamiliar topic');const top=await input.evaluate(node=>node.getBoundingClientRect().top);await input.press('Escape');
    await expect(input).toHaveValue('zxq unfamiliar topic');await expect(page.getByRole('button',{name:'How to explore',exact:true})).toBeVisible();
    expect(Math.abs(await input.evaluate(node=>node.getBoundingClientRect().top)-top)).toBeLessThan(1);expect(posts).toBe(0);
  });
  test(`${width}: stopping the first request leaves a draft and a working guide`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:width===320?'no-preference':'reduce'});
    let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});let posts=0;
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',async route=>{posts++;await pending;await route.fulfill({json:{guidance:'unmatched'}}).catch(()=>{});});
    try{
      await page.goto('/');const input=page.getByRole('textbox',{name:'Explore',exact:true});await input.fill('zxq unfamiliar topic');await input.press('Escape');await input.press('Enter');
      await page.getByRole('button',{name:'Stop updating this view'}).click();await expect(input).toHaveValue('zxq unfamiliar topic');
      const calls=posts;await page.getByRole('button',{name:'How to explore',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Start with a little curiosity.',exact:true})).toBeVisible();expect(posts).toBe(calls);
    }finally{release();}
  });
}

for(const width of [390,736])for(const mode of ['light','dark'] as const)for(const reducedMotion of ['no-preference','reduce'] as const){
  test(`${width} ${mode} ${reducedMotion}: role choices share the reading edges and work without a native popup`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion});
    await page.addInitScript(mode=>localStorage.setItem('theme',mode),mode);
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
    await page.goto('/');
    const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.fill('Who is Isaac?');await input.press('Escape');await input.press('Enter');
    const trigger=page.getByRole('button',{name:'Professional role',exact:true});
    await expect(trigger).toHaveText('AI & communications');
    await expect(trigger).toHaveAccessibleDescription('AI & communications');
    await expect(trigger).toHaveAttribute('aria-expanded','false');
    await expect.poll(async()=>Math.abs((await trigger.locator('span').boundingBox())!.x-(await input.boundingBox())!.x)).toBeLessThan(1);
    const heading=page.locator('.portfolio-career-detail h3');
    await expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector('.portfolio-career-detail h3')!.getBoundingClientRect().left-document.querySelector('.portfolio-choice-trigger')!.getBoundingClientRect().left))).toBeLessThan(1);
    const right=await page.evaluate(()=>{
      const icon=document.querySelector('.portfolio-choice-trigger svg')!.getBoundingClientRect();
      const article=document.querySelector('.portfolio-career-detail')!.getBoundingClientRect();
      return Math.abs(icon.right-article.right);
    });expect(right).toBeLessThan(1);
    await trigger.press('ArrowDown');
    const choices=page.getByRole('group',{name:'Professional role',exact:true});
    await expect(choices.getByRole('button',{name:'AI & communications',exact:true})).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(choices.getByRole('button',{name:'Teaching in Taiwan',exact:true})).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(heading).toHaveText('Fulbright Taiwan');
    await expect(trigger).toHaveAccessibleDescription('Teaching in Taiwan');
    await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
    await trigger.click();await expect(choices).toBeVisible();
    await trigger.press('Escape');await expect(trigger).toHaveAttribute('aria-expanded','false');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
