/** Fixed editorial checks of the actual rendered answer. Literal aspect targets
 * are a reproducible regression tool, not an LLM judge or proof of factual truth. */
const normalize = text => String(text??'').normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
export function scoreRenderedAnswer(test, rendered) {
  if (!test.aspects?.length && !test.mustNotInclude?.length) return null;
  if (!rendered || typeof rendered.text !== 'string') return { evaluated:false, complete:false, error:'rendered_answer_unavailable', aspects:[] };
  const text=normalize(rendered.text);
  const aspects=(test.aspects??[]).map(aspect=>({id:aspect.id,matched:aspect.anyOf.some(phrase=>text.includes(normalize(phrase)))}));
  const violations=(test.mustNotInclude??[]).filter(phrase=>text.includes(normalize(phrase)));
  return { evaluated:true,complete:aspects.every(aspect=>aspect.matched)&&!violations.length,aspects,violations,wordCount:text?text.split(' ').length:0,linkCount:rendered.linkCount??0,
    method:'Literal editorial aspects in currently visible rendered content; collapsed passages are excluded. Human relevance/readability assessment remains necessary.' };
}
export function evaluateReleaseGate(report,{baseline, maxP95Ms,requireQuality=false,requireFreshProvider=false}={}) {
  const failures=[];
  if(report.error)failures.push({reason:'evaluation_error'});
  const extraneous=report.results.filter(row=>row.extraneousProjectIds?.length||row.extraneousModules?.length);
  if(extraneous.length)failures.push({reason:'extraneous_subjects',cases:extraneous.map(row=>row.id)});
  const missing=report.results.filter(row=>row.missingProjectIds?.length);
  if(missing.length)failures.push({reason:'missing_expected_subjects',cases:missing.map(row=>row.id)});
  if(report.failed)failures.push({reason:'routing_or_section_failures',count:report.failed});
  if(report.skipped||report.notSelected)failures.push({reason:'incomplete_corpus',count:(report.skipped??0)+(report.notSelected??0)});
  const qualityRows=report.results.filter(row=>row.quality);
  const incomplete=qualityRows.filter(row=>!row.quality.evaluated||!row.quality.complete);
  if(incomplete.length)failures.push({reason:'answer_aspects_missing',cases:incomplete.map(row=>row.id)});
  if(requireQuality&&qualityRows.length!==report.cases)failures.push({reason:'quality_targets_missing',count:report.cases-qualityRows.length});
  if(requireFreshProvider){const unverified=report.results.filter(row=>row.provenance!=='provider_reported');if(unverified.length)failures.push({reason:'fresh_provider_required',cases:unverified.map(row=>row.id)});}
  const durations=report.results.filter(row=>!row.skipped&&Number.isFinite(row.ms)).map(row=>row.ms).sort((a,b)=>a-b);
  const p95Ms=durations.length?durations[Math.ceil(durations.length*.95)-1]:null;
  if(maxP95Ms!==undefined&&(p95Ms===null||p95Ms>maxP95Ms))failures.push({reason:'latency_budget',p95Ms,budgetMs:maxP95Ms});
  if(baseline){
    if(baseline.corpus!==report.corpus)failures.push({reason:'baseline_corpus_mismatch'});
    else for(const previous of baseline.results??[]){
      const current=report.results.find(row=>row.id===previous.id);
      if(!current||current.skipped)failures.push({reason:'baseline_case_missing',case:previous.id});
      else if(previous.ok&&!current.ok||previous.quality?.complete&&!current.quality?.complete)failures.push({reason:'baseline_regression',case:previous.id});
    }
  }
  return {passed:!failures.length,failures,p95Ms,qualityCases:qualityRows.length,completeAnswers:qualityRows.filter(row=>row.quality.complete).length,
    scope:report.mode==='authored'?'Offline authored regression gate; does not establish live model quality.':'Deployment response regression gate; provenance remains explicit.'};
}
