import {render,cleanup} from '@testing-library/react';
import {it} from 'vitest';
import fs from 'node:fs';
import ExplorationCanvas from '@/components/canvas/ExplorationCanvas';
import {composeLocal,presetComposition,resolveCanvasPlan,explorationGuidance} from '@/lib/genui';
import {initialPlan} from '@/lib/canvas';
import {AI_LAYOUTS} from '@/lib/layouts';
import {experiencePrompts,suggestExperiencePrompts} from '@/lib/experiencePrompts';
it('captures authored output coverage for editorial audit',()=>{
 const extras=['What connects all this work?','Why should I hire Isaac?','What is Isaac best at?','Who is Isaac?','What is Isaac working on now?','What were the challenges in the Boehringer rebrand?','How did Isaac measure the government index’s impact?','What did Isaac learn in Congress?','What would Isaac do differently in Taiwan?','What were the failures in the OpenAI work?','Compare Taiwan and journalism','Show Isaac’s career timeline','What did Isaac personally do versus the team?','Tell me about Isaac’s public service'];
 const cases=[...AI_LAYOUTS.map(l=>({id:l.id,question:l.prompt,preset:true})),...experiencePrompts.map(p=>({id:p.id,question:p.text,preset:false})),...extras.map((question,i)=>({id:`probe-${i}`,question,preset:false}))];
 const rows=cases.map(c=>{const plan=resolveCanvasPlan(c.question,initialPlan(),1);const composition=c.preset?presetComposition(c.id as Parameters<typeof presetComposition>[0]):composeLocal(c.question,plan);const view=render(<ExplorationCanvas composition={composition} plan={plan} generation={{status:'authored'}} onChange={()=>{}}/>);const texts=(selector:string)=>Array.from(view.container.querySelectorAll(selector)).map(n=>n.textContent?.trim());const row={...c,guidance:explorationGuidance(c.question),blocks:composition.blocks,headings:texts('h2,h3'),paragraphs:texts('p'),buttons:texts('button'),links:texts('a'),suggestions:suggestExperiencePrompts('',4,{projectIds:composition.blocks.flatMap(b=>b.projectIds),kind:composition.blocks[0]?.kind,focus:composition.blocks[0]?.focus}).map(p=>p.text)};cleanup();return row;});
 fs.writeFileSync('docs/audits/output-quality-2026-10-31/authored-output-catalog.json',JSON.stringify(rows,null,2));
 console.log(`Captured ${rows.length} authored outputs; no provider calls.`);
});
