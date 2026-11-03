import { scoreRenderedAnswer } from './portfolio-quality.mjs';
const positiveInteger = (value, fallback, name, minimum = 0) => {
  if (value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) throw new Error(`${name} must be an integer of at least ${minimum}.`);
  return number;
};

/** Default execution is entirely offline. A deployment run requires two explicit
 * choices because /intent can itself call Jev even without a /compose request. */
export function evaluationOptions(env = {}, count = 0) {
  const mode = env.PORTFOLIO_EVAL_MODE || (env.PORTFOLIO_REQUIRE_LIVE === '1' || env.PORTFOLIO_EVAL_COMPOSE === '1' ? 'live' : 'authored');
  if (!['authored', 'live'].includes(mode)) throw new Error('PORTFOLIO_EVAL_MODE must be authored or live.');
  const live = mode === 'live';
  if (live && env.PORTFOLIO_EVAL_ALLOW_MODEL_CALLS !== '1') throw new Error('Live evaluation may call paid providers. Set PORTFOLIO_EVAL_ALLOW_MODEL_CALLS=1 explicitly.');
  let base;
  if (live) {
    if (!env.PORTFOLIO_EVAL_URL) throw new Error('Set PORTFOLIO_EVAL_URL to the deployment origin for a live evaluation.');
    const url = new URL(env.PORTFOLIO_EVAL_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('PORTFOLIO_EVAL_URL must be an HTTP(S) origin without credentials, paths, or query parameters.');
    base = url.origin;
  }
  const limit = Math.min(count, positiveInteger(env.PORTFOLIO_EVAL_LIMIT, live ? 1 : count, 'PORTFOLIO_EVAL_LIMIT'));
  return {
    mode, base, limit,
    composeLimit: Math.min(limit, positiveInteger(env.PORTFOLIO_EVAL_COMPOSE_LIMIT, live ? limit : 0, 'PORTFOLIO_EVAL_COMPOSE_LIMIT')),
    maxPostRequests: positiveInteger(env.PORTFOLIO_EVAL_MAX_POST_REQUESTS, live ? limit * 2 : 0, 'PORTFOLIO_EVAL_MAX_POST_REQUESTS'),
    intervalMs: positiveInteger(env.PORTFOLIO_EVAL_INTERVAL_MS, live ? 6000 : 0, 'PORTFOLIO_EVAL_INTERVAL_MS'),
    timeoutMs: positiveInteger(env.PORTFOLIO_EVAL_TIMEOUT_MS, 25000, 'PORTFOLIO_EVAL_TIMEOUT_MS', 1),
    requireFreshProvider: env.PORTFOLIO_REQUIRE_LIVE === '1',
  };
}

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const modelName = value => typeof value === 'string' && value.length > 0 && value.length <= 120 && /^[a-zA-Z0-9._:/-]+$/.test(value) && !value.includes('://') ? value : undefined;
const providerReasons = new Set(['credits', 'authentication', 'rate_limit', 'invalid_request', 'model_unavailable', 'timeout', 'invalid_output', 'provider_unavailable']);
const expectedProject = test => test.projectId ?? test.project;
export const caseId = test => test.id ?? `${expectedProject(test)}:section:${test.section}`;
const selection = module => ({
  kind: module.kind, projectIds: module.projectIds, section: module.section, paragraphIndices: module.paragraphIndices ?? [],
  answerPlan:module.answerPlan, layout: module.layout, focus: module.focus, states: module.states, roleId: module.roleId,
});

/** Match the requested module anywhere in a composition; record section and
 * paragraph-reference results separately so project-only success cannot hide it. */
export function scoreCase(test, observed = {}) {
  const projectId = expectedProject(test);
  const modules = observed.composition?.blocks ?? [];
  const expectedProjectIds=test.expectedProjectIds??test.projects??(projectId?[projectId]:null);
  const allowedProjectIds=test.allowedProjectIds??expectedProjectIds;
  const kind = test.kind ?? (projectId||test.expectedProjectIds?.length ? 'story' : undefined);
  const allowedModuleKinds=test.allowedModuleKinds??(allowedProjectIds!==null&&kind?[kind]:null);
  const actualProjectIds=[...new Set(modules.flatMap(block=>block.projectIds??[]))];
  const extraneousProjectIds=allowedProjectIds===null?[]:actualProjectIds.filter(id=>!allowedProjectIds.includes(id));
  const missingProjectIds=(expectedProjectIds??[]).filter(id=>!actualProjectIds.includes(id));
  const extraneousModules=modules.flatMap((block,index)=>{const projectIds=(block.projectIds??[]).filter(id=>extraneousProjectIds.includes(id));const unexpectedKind=allowedModuleKinds!==null&&!allowedModuleKinds.includes(block.kind);return projectIds.length||unexpectedKind?[{index,kind:block.kind,projectIds,unexpectedKind}]:[];});
  const subjectMatch=expectedProjectIds===null&&allowedProjectIds===null&&allowedModuleKinds===null?null:!extraneousProjectIds.length&&!missingProjectIds.length&&!extraneousModules.length;
  const module = modules.find(block => (!kind||block.kind === kind)
    && (!projectId || block.projectIds?.includes(projectId))
    && (!test.projects || same(block.projectIds, test.projects)));
  const selectionMatch = !observed.guidance && Boolean(module
    && (!test.states || same(module.states, test.states))
    && (!test.focus || module.focus === test.focus)
    && (!test.roleId || module.roleId === test.roleId));
  const selectedEvidence=(observed.evidence??[]).filter(ref=>ref.projectId===projectId);
  const sectionMatch = test.section === undefined ? null : Boolean(selectionMatch && (module.section === test.section||selectedEvidence.some(ref=>ref.sectionIndex===test.section)));
  const selectedParagraphs=[...(module&&module.section===test.section?module.paragraphIndices??[]:[]),...selectedEvidence.filter(ref=>ref.sectionIndex===test.section&&Number.isInteger(ref.paragraphIndex)).map(ref=>ref.paragraphIndex)];
  const paragraphMatch = test.paragraphIndices?.length ? Boolean(sectionMatch && test.paragraphIndices.every(index => selectedParagraphs.includes(index))) : null;
  const paragraphAnyMatch = test.paragraphIndices?.length ? Boolean(sectionMatch && test.paragraphIndices.some(index => selectedParagraphs.includes(index))) : null;
  const support = observed.guidance ? 'unsupported' : modules.length ? 'supported' : observed.error ? 'unavailable' : 'not_evaluated';
  // Editorial paragraph targets are useful coverage signals, but are not an
  // exhaustive list of semantically valid excerpts. Keep them separate from the
  // project/section contract; strictOk remains available for exact regression QA.
  const ok = (test.guidance ? observed.guidance === test.guidance : selectionMatch && sectionMatch !== false)&&subjectMatch!==false;
  return { ok, subjectMatch,expectedProjectIds,allowedProjectIds,allowedModuleKinds,extraneousProjectIds,missingProjectIds,extraneousModules, strictOk: ok && paragraphMatch !== false, support, selectionMatch, sectionMatch, paragraphMatch, paragraphAnyMatch, selected: module ? selection(module) : null,
    // Retain the actual bounded selection even when no requested subject matches.
    // A project-level pass must never conceal another irrelevant module.
    selectedModules: modules.map(selection),
    ...(selectedEvidence.length?{selectedEvidence}:{}),
  };
}

/** These are provenance claims supported by the endpoint response, not guesses
 * based on key/configuration presence. Test transports can never claim live use. */
export function responseProvenance({ transport = 'http', routed, final, guidance, failed = false } = {}) {
  if (transport === 'mocked') return 'mocked_transport';
  if (failed) return 'unavailable';
  const event = final ?? guidance;
  if (event?.local === true) return 'api_authored';
  if (event?.cached === true && modelName(event.model)) return 'provider_cache';
  if (modelName(event?.model)) return 'provider_reported';
  if (event) return 'unverified_response';
  if (routed?.plan?.source === 'jev') return routed.cached ? 'router_cache' : 'router_provider_reported';
  if (routed?.composerConfigured) return 'configuration_only';
  return 'api_authored';
}

const isProvider = provenance => ['provider_reported', 'router_provider_reported'].includes(provenance);

export function summarizeEvaluation(cases, rows, metadata = {}) {
  const byProject = {};
  for (const test of cases) {
    const projectId = expectedProject(test);
    if (!projectId || test.section === undefined) continue;
    const project = byProject[projectId] ??= { projectId, expectedSections: [], evaluatedSections: [], matchedSections: [], providerReportedSections: [], expectedParagraphs: [], matchedParagraphs: [], providerReportedParagraphs: [] };
    project.expectedSections.push(test.section);
    project.expectedParagraphs.push(...(test.paragraphIndices ?? []).map(index => `${test.section}:${index}`));
    const row = rows.find(item => item.id === caseId(test));
    if (!row || row.skipped) continue;
    project.evaluatedSections.push(test.section);
    if (row.sectionMatch) {
      project.matchedSections.push(test.section);
      // A Jev routing call can choose a subject, while its passage still comes
      // from local composition. Only a composer result establishes model section
      // selection; caches and routing-only results remain separate provenance.
      if (row.provenance === 'provider_reported') project.providerReportedSections.push(test.section);
    }
    if (row.sectionMatch && row.selected) {
      const matched = (test.paragraphIndices ?? []).filter(index => (row.selected.section===test.section&&row.selected.paragraphIndices?.includes(index))||row.selectedEvidence?.some(ref=>ref.projectId===projectId&&ref.sectionIndex===test.section&&ref.paragraphIndex===index)).map(index => `${test.section}:${index}`);
      project.matchedParagraphs.push(...matched);
      if (row.provenance === 'provider_reported') project.providerReportedParagraphs.push(...matched);
    }
  }
  for (const project of Object.values(byProject)) for (const [key, value] of Object.entries(project)) if (Array.isArray(value)) project[key] = [...new Set(value)].sort((a, b) => typeof a === 'number' ? a - b : a.localeCompare(b, undefined, { numeric: true }));
  const counts = {};
  for (const row of rows) counts[row.provenance] = (counts[row.provenance] ?? 0) + 1;
  return { ...metadata, schemaVersion:3, subjectContractCases:rows.filter(row=>row.subjectMatch!==null&&row.subjectMatch!==undefined).length,subjectMatches:rows.filter(row=>row.subjectMatch===true).length,extraneousSubjectCases:rows.filter(row=>row.extraneousModules?.length||row.extraneousProjectIds?.length).length,qualityTargetCases:rows.filter(row=>row.quality).length, qualityComplete:rows.filter(row=>row.quality?.complete).length, cases: cases.length, selected: rows.length, notSelected: cases.length - rows.length, evaluated: rows.filter(row => !row.skipped).length, passed: rows.filter(row => row.ok).length, failed: rows.filter(row => !row.ok && !row.skipped).length, skipped: rows.filter(row => row.skipped).length, selectionMatches: rows.filter(row => row.selectionMatch).length, sectionMatches: rows.filter(row => row.sectionMatch).length, paragraphTargetCases: rows.filter(row => row.paragraphMatch !== null && row.paragraphMatch !== undefined).length, paragraphAnyMatches: rows.filter(row => row.paragraphAnyMatch).length, paragraphFullMatches: rows.filter(row => row.paragraphMatch).length, strictMatches: rows.filter(row => row.strictOk).length, provenance: counts, coverage: Object.values(byProject), results: rows };
}

const parseJson = text => { try { return JSON.parse(text); } catch { throw new Error('malformed_response'); } };

const errorCode = error => error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'timeout' : 'request_failed';
async function responseText(response, maxBytes = 256_000) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('empty_response');
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('response_too_large');
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } catch (error) { void reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
}

/** A deployment run checks source compatibility before any model-capable POST.
 * Budgets count endpoint POSTs: one /compose may also request optional Jev advice. */
export async function evaluateDeployment(cases, runtime, options, { fetchImpl = fetch, transport = 'http', pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (options.mode !== 'live') throw new Error('Deployment evaluation requires explicitly authorized live mode.');
  const selectedCases = cases.slice(0, options.limit);
  if (!selectedCases.length) return summarizeEvaluation(cases, [], { mode: 'live', base: options.base, contentVersion: runtime.contentVersion, postRequests: 0, compositionRequests: 0 });
  let postRequests = 0;
  const request = async (path, body) => {
    if (body && postRequests >= options.maxPostRequests) return { skipped: 'post_budget' };
    if (body) postRequests++;
    const started = performance.now();
    const response = await fetchImpl(options.base + path, { ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(options.timeoutMs) });
    const text = await responseText(response);
    return { ok: response.ok, status: response.status, text, ms: Math.round(performance.now() - started) };
  };
  const profile = await request('/api/public/profile');
  if (!profile.ok) throw new Error(`Profile check failed with HTTP ${profile.status}; no model requests made.`);
  const content = parseJson(profile.text);
  if (content.contentVersion !== runtime.contentVersion) return summarizeEvaluation(cases, selectedCases.map(test => ({ id: caseId(test), ok: false, skipped: 'content_version_mismatch', provenance: 'not_evaluated' })), { mode: 'live', base: options.base, localContentVersion: runtime.contentVersion, deployedContentVersion: content.contentVersion, postRequests, error: 'content_version_mismatch' });
  const configuration = await request('/api/compose');
  if (!configuration.ok) throw new Error(`Configuration check failed with HTTP ${configuration.status}; no model requests made.`);
  const configured = parseJson(configuration.text).configured === true;
  const rows = [];
  const completed = new Map();
  let compositions = 0;
  for (const [index, test] of selectedCases.entries()) {
    const id = caseId(test);
    const current = test.follows ? completed.get(test.follows) : undefined;
    if (test.follows && !current) { rows.push({ id, ok: false, skipped: 'followup_context_unavailable', provenance: 'not_evaluated' }); continue; }
    if (postRequests >= options.maxPostRequests) { rows.push({ id, ok: false, skipped: 'post_budget', provenance: 'not_evaluated' }); continue; }
    if (index > 0 && options.intervalMs > 0) await pause(options.intervalMs);
    const started = performance.now();
    try {
      const routedResponse = await request('/api/intent', { draft: test.question, revision: index + 1, contentVersion: content.contentVersion, ...(current ? { composition: current } : {}) });
      if (!routedResponse.ok) { rows.push({ id, ok: false, support: 'unavailable', provenance: 'unavailable', error: `intent_http_${routedResponse.status}`, routeMs: routedResponse.ms, ms: Math.round(performance.now() - started) }); continue; }
      const routed = parseJson(routedResponse.text);
      const routedComposition = routed.composition?.supported === false ? null : runtime.validate(routed.composition);
      let observed = { composition: routedComposition ?? undefined, guidance: routed.guidance };
      let provenance = responseProvenance({ transport, routed });
      let composeMs;
      let composeError;
      let model;
      let cached = false;
      if (routed.needsComposition !== false && configured && compositions < options.composeLimit) {
        const fallback = runtime.compose(test.question, index + 1, current);
        const composition = routedComposition ?? fallback;
        const generated = await request('/api/compose', { draft: test.question, revision: index + 1, contentVersion: content.contentVersion, current: current ?? composition, proposed: composition });
        if (generated.skipped) { rows.push({ id, ok: false, skipped: generated.skipped, provenance: 'not_evaluated' }); continue; }
        compositions++; composeMs = generated.ms;
        if (!generated.ok) { composeError = `compose_http_${generated.status}`; provenance = responseProvenance({ transport, routed, failed: true }); }
        else {
          const events = generated.text.trim().split('\n').filter(Boolean).map(parseJson);
          const matching = events.filter(event => event.revision === index + 1 && event.contentVersion === content.contentVersion);
          const final = matching.findLast(event => event.type === 'composition' && event.partial === false);
          const guidance = matching.findLast(event => event.type === 'guidance');
          const failure = matching.findLast(event => event.type === 'unavailable');
          if (failure) composeError = providerReasons.has(failure.reason) ? failure.reason : 'provider_unavailable';
          else if (final && guidance) composeError = 'conflicting_terminal_events';
          else if (final && (!runtime.validate(final.composition) || final.composition.supported === false)) composeError = 'invalid_composition';
          else if (!final && !guidance) composeError = 'incomplete_composition';
          else observed = { composition: final?.composition, guidance: guidance?.guidance };
          provenance = responseProvenance({ transport, routed, final, guidance, failed: Boolean(composeError) });
          model = modelName(final?.model ?? guidance?.model); cached = final?.cached === true;
        }
      } else if (routed.needsComposition !== false) {
        composeError = !configured ? 'composer_unconfigured' : 'compose_budget';
      } else if (!routed.guidance && !routedComposition) {
        composeError = 'invalid_routing_composition';
      }
      const scored = scoreCase(test, composeError ? { error: composeError } : {...observed,evidence:observed.composition?runtime.evidence?.(observed.composition):undefined});
      const quality=scoreRenderedAnswer(test,!composeError&&observed.composition?runtime.render?.(observed.composition):undefined);
      if (!composeError && observed.composition) completed.set(id, observed.composition);
      const freshRequired = options.requireFreshProvider && !(test.section === undefined ? isProvider(provenance) : provenance === 'provider_reported') && test.guidance !== 'welcome';
      rows.push({ id, ...scored, ...(quality?{quality}:{}), ok: scored.ok && !composeError && !freshRequired, provenance, model, cached, ...(composeError ? { error: composeError } : freshRequired ? { error: 'fresh_provider_required' } : {}), routeMs: routedResponse.ms, composeMs, ms: Math.round(performance.now() - started) });
    } catch (error) {
      rows.push({ id, ok: false, support: 'unavailable', provenance: transport === 'mocked' ? 'mocked_transport' : 'unavailable', error: ['response_too_large', 'empty_response', 'malformed_response'].includes(error?.message) ? error.message : errorCode(error), ms: Math.round(performance.now() - started) });
    }
  }
  return summarizeEvaluation(cases, rows, { mode: 'live', base: options.base, contentVersion: content.contentVersion, postRequests, compositionRequests: compositions, configurationIsHealthEvidence: false, providerClaims: 'Endpoint-reported execution; configuration presence alone is never counted as a provider result.' });
}

export function evaluateAuthored(cases, runtime, options) {
  const selectedCases = cases.slice(0, options.limit);
  const completed = new Map();
  const rows = selectedCases.map(test => {
    const current = test.follows ? completed.get(test.follows) : undefined;
    if (test.follows && !current) return { id: caseId(test), ok: false, skipped: 'followup_context_unavailable', provenance: 'not_evaluated' };
    const started = performance.now();
    const guidance = runtime.guidance(test.question);
    const composition = guidance ? undefined : runtime.compose(test.question, 0, current);
    const plan = runtime.plan(test.question, 0, current);
    const invalid = composition && !runtime.validate(composition);
    const observed = invalid ? { error: 'invalid_composition' } : { composition: plan.layout === 'empty' ? undefined : composition, guidance: guidance ?? (plan.layout === 'empty' ? 'unmatched' : undefined) };
    if (observed.composition) completed.set(caseId(test), observed.composition);
    const quality=scoreRenderedAnswer(test,observed.composition?runtime.render?.(observed.composition):undefined);
    return { id: caseId(test), ...scoreCase(test, {...observed,evidence:observed.composition?runtime.evidence?.(observed.composition):undefined}), ...(quality?{quality}:{}), ...(invalid ? { error: 'invalid_composition' } : {}), provenance: 'local_authored', ms: Math.round(performance.now() - started) };
  });
  return summarizeEvaluation(cases, rows, { mode: 'authored', contentVersion: runtime.contentVersion, postRequests: 0, compositionRequests: 0, providerClaims: 'Offline local composition only. No network requests, provider calls, or model-quality claims.' });
}
