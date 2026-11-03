import { expect, test } from '@playwright/test';

test.use({ launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {} });
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
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
  const blankHeight=(await input.boundingBox())!.height;
  const question='What feedback did Isaac give on Atlas?';
  await input.fill(question);expect(posts).toBe(0);await input.press('Escape');await input.press('Enter');
  await expect(page.getByRole('combobox',{name:'Lab work to explore'})).toHaveValue('5');
  await expect(input).toHaveValue(question);await expect.poll(()=>posts).toBe(1);
  const display=page.locator('.home-question-display');
  await expect(display).toHaveText(question);
  await expect.poll(()=>display.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  expect((await display.boundingBox())!.height).toBeGreaterThan(blankHeight);
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
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
  await page.goto('/');const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
  await page.goto('/');const input=page.getByRole('combobox',{name:'Explore',exact:true});
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
