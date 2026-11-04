import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { validateComposition } from '../src/lib/genui.js';
import { defaultLayout, liveLayoutIds, type LayoutId } from '../src/lib/layouts.js';
import { getEvidence, resolveAnswerPlan } from '../src/lib/portfolioEvidenceRegistry.js';
import { publicProjects } from '../src/lib/canvas.js';
import { providerDiagnosticParameters, providerDiagnosticCategories } from './composition-policy.js';

type Provider = 'jev' | 'mistral';
type Health = { status: 'not_checked' | 'healthy' | 'unavailable'; checkedAt?: string; reason?: string; model?: string; errorType?:string; diagnostic?:string };
export type ProviderTimings = { adviceMs?: number; firstSelectionMs?: number; providerMs?: number; totalMs?: number };
type Result = { status: 'healthy' | 'unavailable'; model?: string; reason?: string; duration?: number; layout?: string; cached?: boolean; httpStatus?: number; errorType?: string; limitDetail?: string; providerCode?: string; providerType?: string; providerParameter?:string; providerDiagnostic?:string; providerMinimumOutputTokens?:number; retryAfter?: number; rateLimit?: number; rateRemaining?: number; projectIds?: string[]; sections?: { projectId: string; section: number }[]; layouts?: LayoutId[]; evidenceIds?:string[]; timings?: ProviderTimings };
const health: Record<Provider, Health> = { jev: { status: 'not_checked' }, mistral: { status: 'not_checked' } };
const metrics = { jev: { calls: 0, unavailable: 0, cacheHits: 0, durations: [] as number[] }, mistral: { calls: 0, unavailable: 0, cacheHits: 0, durations: [] as number[] } };
// Ephemeral process secret prevents dictionary-matching common questions against
// log hashes. It is never persisted, exported, or shared across instances.
const questionSalt = randomBytes(32);
const safeNumber = (value: unknown, max = 86_400_000) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value) : undefined;
const safeModel = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9._:/-]{1,120}$/.test(value) && !value.includes('://') ? value : undefined;
const reasons = new Set(['credits','authentication','rate_limit','invalid_request','model_unavailable','timeout','invalid_output','provider_unavailable','uncertain']);
const safeTimings = (timings?: ProviderTimings) => Object.fromEntries(['adviceMs','firstSelectionMs','providerMs','totalMs'].flatMap(key => { const value=safeNumber(timings?.[key as keyof ProviderTimings]); return value === undefined ? [] : [[key,value]]; }));
export const providerHealth = (provider: Provider) => ({ ...health[provider] });
/** Instance-scoped bounded observations, never a claim about global availability,
 * global spend, or actual browser paint. Cache hits do not become provider calls. */
export function providerMetrics(provider: Provider) {
  const record=metrics[provider], sorted=[...record.durations].sort((a,b)=>a-b);
  const percentile=(fraction:number)=>sorted.length?sorted[Math.ceil(sorted.length*fraction)-1]:null;
  return { scope:'process', calls:record.calls, unavailable:record.unavailable, cacheHits:record.cacheHits, latencySamples:sorted.length, p50Ms:percentile(.5), p95Ms:percentile(.95) };
}
export function providerRequest(provider: Provider, query: string) {
  return { requestId: randomUUID(), provider, questionHash: createHmac('sha256',questionSalt).update(query).digest('hex').slice(0, 16) };
}
/** Only bounded, validated public references enter coverage diagnostics. Never
 * spread a composition: search, visitor text, source text and URLs are excluded. */
export function compositionLogEvidence(value: unknown): { projectIds?: string[]; sections?: { projectId: string; section: number }[]; layouts?: LayoutId[]; evidenceIds?:string[] } {
  const composition = validateComposition(value);
  if (!composition) return {};
  const projectIds = [...new Set(composition.blocks.flatMap(block => block.projectIds))].slice(0, 9);
  const sections = [...new Map(composition.blocks.flatMap(block=>[...(block.kind==='story'?[{projectId:block.projectIds[0],section:block.section}]:[]),...resolveAnswerPlan(block).flatMap(facet=>facet.sections.map(section=>({projectId:section.projectId,section:section.sectionIndex})))]).map(ref=>[ref.projectId+':'+ref.section,ref])).values()].slice(0,32);
  const evidenceIds=[...new Set(composition.blocks.flatMap(block=>resolveAnswerPlan(block).flatMap(facet=>facet.evidence.map(record=>record.id))))].slice(0,36);
  return {
    ...(projectIds.length ? { projectIds } : {}),
    ...(sections.length ? { sections } : {}),
    ...(evidenceIds.length?{evidenceIds}:{}),
    layouts: composition.blocks.map(block => block.layout ?? defaultLayout[block.kind]).slice(0, 3),
  };
}
export function recordProviderResult(request: ReturnType<typeof providerRequest>, result: Result) {
  const model=safeModel(result.model), reason=result.reason&&reasons.has(result.reason)?result.reason:undefined;
  const errorType=result.errorType&&['Error','AbortError','TimeoutError','AI_APICallError','AI_NoObjectGeneratedError','AI_NoOutputGeneratedError','AI_TypeValidationError','AI_JSONParseError'].includes(result.errorType)?result.errorType:undefined;
  const diagnostic=result.providerDiagnostic&&providerDiagnosticCategories.includes(result.providerDiagnostic)?result.providerDiagnostic:undefined;
  if (!result.cached) health[request.provider] = { status: result.status, checkedAt: new Date().toISOString(), model, ...(reason ? { reason } : {}), ...(result.status==='unavailable'?{...(errorType?{errorType}:{}),...(diagnostic?{diagnostic}:{})}:{}) };
  const metric=metrics[request.provider], duration=safeNumber(result.duration);
  if(result.cached)metric.cacheHits++;
  else {metric.calls++;if(result.status==='unavailable')metric.unavailable++;if(duration!==undefined){metric.durations.push(duration);if(metric.durations.length>64)metric.durations.shift();}}
  // Project every field at the final boundary. No future caller can accidentally
  // spread raw upstream errors or visitor text into diagnostics.
  const { projectIds, sections, layouts, layout, evidenceIds }  = result;
  const knownProject = (id: string) => publicProjects.find(project => project.id === id);
  const safeProjects = Array.isArray(projectIds) ? [...new Set(projectIds.filter(id => typeof id === 'string' && knownProject(id)))].slice(0, 9) : [];
  const safeSections = Array.isArray(sections) ? sections.filter(ref => ref && typeof ref.projectId === 'string' && Number.isSafeInteger(ref.section) && ref.section >= 0 && ref.section < (knownProject(ref.projectId)?.sections.length ?? 0)).slice(0, 32).map(({ projectId, section }) => ({ projectId, section })) : [];
  const safeLayouts = Array.isArray(layouts) ? layouts.filter(id => liveLayoutIds.includes(id as typeof liveLayoutIds[number])).slice(0, 3) : [];
  const safeEvidence=Array.isArray(evidenceIds)?[...new Set(evidenceIds.filter(id=>typeof id==='string'&&getEvidence(id)))].slice(0,36):[];
  const safeLayout = layout && [...liveLayoutIds, 'none', 'advisory'].includes(layout) ? layout : undefined;
  const timings=safeTimings(result.timings);
  const log = JSON.stringify({ event: 'portfolio.provider', requestId:request.requestId, provider:request.provider, questionHash:request.questionHash,
    status:result.status, model, reason, duration, cached:result.cached===true?true:undefined,
    httpStatus:safeNumber(result.httpStatus,599),
    errorType,
    limitDetail:result.limitDetail&&['capacity','tokens','requests','budget','unspecified_limit'].includes(result.limitDetail)?result.limitDetail:undefined,
    providerCode:result.providerCode&&(/^[0-9]{3,6}$/.test(result.providerCode)||['rate_limit_exceeded','insufficient_quota','unknown_model'].includes(result.providerCode))?result.providerCode:undefined,
    providerType:result.providerType&&['rate_limited','rate_limit','rate_limit_error','invalid_request_error','authentication_error','server_error'].includes(result.providerType)?result.providerType:undefined,
    providerParameter:result.providerParameter&&providerDiagnosticParameters.includes(result.providerParameter)?result.providerParameter:undefined,
    providerDiagnostic:diagnostic,
    providerMinimumOutputTokens:Number.isSafeInteger(result.providerMinimumOutputTokens)&&result.providerMinimumOutputTokens!>0&&result.providerMinimumOutputTokens!<=1000000?result.providerMinimumOutputTokens:undefined,
    retryAfter:safeNumber(result.retryAfter),rateLimit:safeNumber(result.rateLimit),rateRemaining:safeNumber(result.rateRemaining),
    ...(Object.keys(timings).length?{timings}:{}),
    ...(safeLayout ? { layout: safeLayout } : {}),
    ...(safeProjects.length ? { projectIds: safeProjects } : {}),
    ...(safeSections.length ? { sections: safeSections } : {}),
    ...(safeEvidence.length?{evidenceIds:safeEvidence}:{}),
    ...(safeLayouts.length ? { layouts: safeLayouts } : {}),
  });
  if (result.status === 'unavailable') console.warn(log); else console.info(log);
}
