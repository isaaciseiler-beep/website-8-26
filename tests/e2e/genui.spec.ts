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
  await expect(result.getByRole('button',{name:'Explore this project'}).first()).toBeVisible();
  expect(requests).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Copy link to this view'}).click();
  const shared=await page.evaluate(()=>(window as Window & {copiedView?:string}).copiedView);
  expect(shared).toContain('#view=');await page.goto(shared!);
  await expect(page.getByRole('combobox',{name:'Connection to explore'})).toHaveValue('listening');
  await expect(page.getByRole('button',{name:'Outcomes',exact:true})).toHaveAttribute('aria-pressed','true');
});
