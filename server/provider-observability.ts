import { createHash, randomUUID } from 'node:crypto';
import { validateComposition } from '../src/lib/genui.js';
import { defaultLayout, liveLayoutIds, type LayoutId } from '../src/lib/layouts.js';
import { publicProjects } from '../src/lib/canvas.js';

type Provider = 'jev' | 'mistral';
type Health = { status: 'not_checked' | 'healthy' | 'unavailable'; checkedAt?: string; reason?: string; model?: string };
const health: Record<Provider, Health> = { jev: { status: 'not_checked' }, mistral: { status: 'not_checked' } };
export const providerHealth = (provider: Provider) => ({ ...health[provider] });
export function providerRequest(provider: Provider, query: string) {
  return { requestId: randomUUID(), provider, questionHash: createHash('sha256').update(query).digest('hex').slice(0, 16) };
}
/** Only bounded, validated public references enter coverage diagnostics. Never
 * spread a composition: search, visitor text, source text and URLs are excluded. */
export function compositionLogEvidence(value: unknown): { projectIds?: string[]; sections?: { projectId: string; section: number }[]; layouts?: LayoutId[] } {
  const composition = validateComposition(value);
  if (!composition) return {};
  const projectIds = [...new Set(composition.blocks.flatMap(block => block.projectIds))].slice(0, 9);
  const sections = composition.blocks.filter(block => block.kind === 'story').map(block => ({ projectId: block.projectIds[0], section: block.section })).slice(0, 3);
  return {
    ...(projectIds.length ? { projectIds } : {}),
    ...(sections.length ? { sections } : {}),
    layouts: composition.blocks.map(block => block.layout ?? defaultLayout[block.kind]).slice(0, 3),
  };
}
export function recordProviderResult(request: ReturnType<typeof providerRequest>, result: { status: 'healthy' | 'unavailable'; model?: string; reason?: string; duration?: number; layout?: string; cached?: boolean; httpStatus?: number; errorType?: string; limitDetail?: string; providerCode?: string; providerType?: string; retryAfter?: number; rateLimit?: number; rateRemaining?: number; projectIds?: string[]; sections?: { projectId: string; section: number }[]; layouts?: LayoutId[] }) {
  if (!result.cached) health[request.provider] = { status: result.status, checkedAt: new Date().toISOString(), model: result.model, ...(result.reason ? { reason: result.reason } : {}) };
  // Defend the logging boundary too, even if a future caller bypasses the
  // composition projection above. Unknown refs can never become log strings.
  const { projectIds, sections, layouts, layout, ...details } = result;
  const knownProject = (id: string) => publicProjects.find(project => project.id === id);
  const safeProjects = Array.isArray(projectIds) ? [...new Set(projectIds.filter(id => typeof id === 'string' && knownProject(id)))].slice(0, 9) : [];
  const safeSections = Array.isArray(sections) ? sections.filter(ref => ref && typeof ref.projectId === 'string' && Number.isSafeInteger(ref.section) && ref.section >= 0 && ref.section < (knownProject(ref.projectId)?.sections.length ?? 0)).slice(0, 3).map(({ projectId, section }) => ({ projectId, section })) : [];
  const safeLayouts = Array.isArray(layouts) ? layouts.filter(id => liveLayoutIds.includes(id as typeof liveLayoutIds[number])).slice(0, 3) : [];
  const safeLayout = layout && [...liveLayoutIds, 'none', 'advisory'].includes(layout) ? layout : undefined;
  const log = JSON.stringify({ event: 'portfolio.provider', ...request, ...details,
    ...(safeLayout ? { layout: safeLayout } : {}),
    ...(safeProjects.length ? { projectIds: safeProjects } : {}),
    ...(safeSections.length ? { sections: safeSections } : {}),
    ...(safeLayouts.length ? { layouts: safeLayouts } : {}),
  });
  if (result.status === 'unavailable') console.warn(log); else console.info(log);
}
