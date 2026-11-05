import { getEvidence, evidenceFingerprint, portfolioEvidenceRegistry } from './portfolioEvidenceRegistry.js';
import { portfolioConnections } from './portfolioConnections.js';
import { z } from 'zod';
import { CONTENT_VERSION, initialPlan, publicProjects, type Plan } from './canvas.js';
import { blankBlock, blockSchema, validateComposition, type Composition } from './genui.js';
import { AI_LAYOUTS, liveLayoutIds } from './layouts.js';
import { evidenceFocuses, evidenceSections, portfolioCatalog } from './portfolioEvidence.js';
import { aiIndexStates } from './aiStateGovIndex.js';
import { experienceEntries } from './experience.js';
import { namedProjects, requestedFocus } from './portfolioIntent.js';

// One contract for website controls, browser tools, and portable MCP views.
export const moduleSchema = blockSchema.omit({ albumIds: true }).partial().extend({
  kind: z.enum(['benchmark', 'story', 'comparison', 'timeline', 'architecture', 'contact', 'collection']),
  layout: z.enum(liveLayoutIds).optional(),
}).strict();
const controlsSchema = moduleSchema.omit({ kind: true }).strict();
export const portfolioActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('open_project'), projectId: z.string().max(150), focus: z.enum(evidenceFocuses).optional(), append: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('compare_projects'), projectIds: z.tuple([z.string().max(150), z.string().max(150)]), focus: z.enum(evidenceFocuses).optional() }).strict(),
  z.object({ type: z.literal('compose'), modules: z.array(moduleSchema).min(1).max(3) }).strict(),
  z.object({ type: z.literal('update_module'), index: z.number().int().min(0).max(2), changes: controlsSchema }).strict(),
  z.object({ type: z.literal('remove_module'), index: z.number().int().min(0).max(2) }).strict(),
  z.object({ type: z.literal('move_module'), from: z.number().int().min(0).max(2), to: z.number().int().min(0).max(2) }).strict(),
]);
export type PortfolioAction = z.infer<typeof portfolioActionSchema>;
export type PortableView = { version: 1; contentVersion: string; composition: Composition };
const storyLayout = (focus?: string) => focus === 'process' ? 'project-process' as const : focus === 'outcomes' ? 'project-outcomes' as const : focus === 'evidence' ? 'project-evidence' as const : 'project-brief' as const;
function normalizeControls(kind: string, controls: z.infer<typeof controlsSchema>) {
  if (controls.layout && AI_LAYOUTS.find(layout => layout.id === controls.layout)?.kind !== kind) throw new Error('Choose a layout for this module kind.');
  if (kind !== 'story') return controls;
  if (controls.focus !== undefined) return { ...controls, layout: storyLayout(controls.focus) };
  if (controls.layout) return { ...controls, focus: controls.layout === 'project-process' ? 'process' as const : controls.layout === 'project-outcomes' ? 'outcomes' as const : controls.layout === 'project-evidence' ? 'evidence' as const : 'role' as const };
  return controls;
}
export const portableViewSchema = z.object({
  version: z.literal(1), contentVersion: z.string().min(1).max(80), composition: z.unknown(),
}).strict();
const MAX_LINK_LENGTH = 10000;

export function createPortableView(value: unknown): PortableView {
  const composition = validateComposition(value);
  if (!composition || (value as { supported?: boolean })?.supported === false) throw new Error('This view contains an unavailable project, layout, or control.');
  if (composition.blocks.some(block => block.kind === 'architecture' && block.section > 3)) throw new Error('Choose an available architecture step.');
  return { version: 1, contentVersion: CONTENT_VERSION, composition: { blocks: composition.blocks } };
}

export function readPortableView(value: unknown): PortableView {
  const parsed = portableViewSchema.safeParse(value);
  if (!parsed.success) throw new Error('This shared view is invalid or belongs to an older content version.');
  if(parsed.data.contentVersion===CONTENT_VERSION)return createPortableView(parsed.data.composition);
  // These two published revisions used exactly the same ordered public record.
  // The positional compatibility bridge disables itself on any content/order edit.
  const legacyVersions=['canvas-2026-11-02-v13','canvas-2026-11-02-v14'];
  const snapshot=evidenceFingerprint(portfolioEvidenceRegistry.filter(record=>record.kind!=='qualification').map(record=>[record.projectId,record.sectionIndex,record.kind,record.itemIndex,record.id].join(':')).join('|'));
  if(legacyVersions.includes(parsed.data.contentVersion)&&snapshot==='b2a08a7ca63daea8')return createPortableView(parsed.data.composition);
  if(!/^canvas-\d{4}-\d{2}-\d{2}-v\d+$/.test(parsed.data.contentVersion))throw new Error('This shared view is invalid or belongs to an older content version.');
  const raw=parsed.data.composition as Composition;
  if(!raw||!Array.isArray(raw.blocks)||!raw.blocks.length||raw.blocks.some(block=>block.kind!=='story'||!block.answerPlan?.facets?.length))throw new Error('This shared view needs its original evidence to be reopened.');
  // Every selected passage must still exist verbatim. Stable IDs can be rebound
  // to current positions, but edited/deleted passages never migrate silently.
  const blocks=raw.blocks.map(block=>{
    const ids=block.answerPlan!.facets.flatMap(facet=>facet.evidenceIds);
    if(!ids.length||ids.some(id=>!getEvidence(id)||!block.projectIds.includes(getEvidence(id)!.projectId)))throw new Error('This shared view contains evidence that has changed.');
    const primary=getEvidence(ids[0])!;
    return {...block,section:primary.sectionIndex,paragraphIndices:[...new Set(ids.map(id=>getEvidence(id)!).filter(record=>record.sectionIndex===primary.sectionIndex&&record.kind==='paragraph').map(record=>record.paragraphIndex!))].slice(0,3)};
  });
  return createPortableView({blocks});
}

export function applyPortfolioAction(view: PortableView | null, input: unknown): PortableView {
  if (view) readPortableView(view);
  const action = portfolioActionSchema.parse(input);
  const blocks = view?.composition.blocks ?? [];
  let composition: Composition;
  switch (action.type) {
    case 'open_project': {
      const focus = action.focus ?? 'role';
      const block = { ...blankBlock('story'), projectIds: [action.projectId], focus, layout: storyLayout(focus), section: evidenceSections(action.projectId, focus)[0]?.index ?? 0 };
      composition = { blocks: action.append ? [...blocks, block] : [block] };
      break;
    }
    case 'compare_projects':
      composition = { blocks: [{ ...blankBlock('comparison'), projectIds: [action.projectIds[0], action.projectIds[1]], focus: action.focus ?? 'role' }] };
      break;
    case 'compose':
      composition = { blocks: action.modules.map(module => {
        const controls = normalizeControls(module.kind, module);
        return { ...blankBlock(module.kind), ...module, ...controls, albumIds: [], section: module.section ?? (module.kind === 'story' ? evidenceSections(module.projectIds?.[0] ?? '', controls.focus ?? 'role')[0]?.index ?? 0 : 0) };
      }) };
      break;
    case 'update_module':
      if (!blocks[action.index]) throw new Error('Choose a module that is present in this view.');
      composition = { blocks: blocks.map((block, index) => {
        if(index!==action.index)return block;
        const controls=normalizeControls(block.kind,action.changes);
        const changedSubject=controls.projectIds!==undefined&&JSON.stringify(controls.projectIds)!==JSON.stringify(block.projectIds);
        const changedFocus=controls.focus!==undefined&&controls.focus!==block.focus||controls.layout!==undefined&&controls.layout!==block.layout;
        const changedSection=controls.section!==undefined&&controls.section!==block.section;
        return { ...block,
          ...(changedSubject||changedFocus||changedSection?{paragraphIndices:undefined,answerPlan:undefined}:{}),
          ...controls,
          ...(block.kind==='story'&&controls.section===undefined&&(changedSubject||changedFocus)
            ?{section:evidenceSections(controls.projectIds?.[0]??block.projectIds[0],controls.focus??block.focus??'role')[0]?.index??0}:{}),
        };
      }) };
      break;
    case 'remove_module':
      if (!blocks[action.index] || blocks.length < 2) throw new Error('Keep at least one module in the view.');
      composition = { blocks: blocks.filter((_, index) => index !== action.index) };
      break;
    case 'move_module': {
      if (!blocks[action.from] || !blocks[action.to]) throw new Error('Choose modules that are present in this view.');
      const reordered = [...blocks];
      const [moved] = reordered.splice(action.from, 1);
      reordered.splice(action.to, 0, moved);
      composition = { blocks: reordered };
      break;
    }
  }
  return createPortableView(composition);
}

/** Explicit composition edits are deterministic and preserve unrelated modules. */
export function portfolioActionForRequest(text: string, view: PortableView): PortfolioAction | null {
  const ids = namedProjects(text);
  if (/^(?:please )?(?:add|also (?:show|include)|include)\b/i.test(text.trim()) && ids.length === 1 && view.composition.blocks.length < 3) {
    return { type: 'open_project', projectId: ids[0], focus: requestedFocus(text) ?? 'role', append: true };
  }
  const remove = text.trim().match(/^(?:remove|close) (?:the )?(first|second|third|1|2|3) (?:view|module|project)[.!?]?$/i);
  if (remove && view.composition.blocks.length > 1) {
    const index = ['first', 'second', 'third'].indexOf(remove[1].toLowerCase());
    const selected = index < 0 ? Number(remove[1]) - 1 : index;
    if (view.composition.blocks[selected]) return { type: 'remove_module', index: selected };
  }
  return null;
}

export function viewPlan(view: PortableView, revision = 0): Plan {
  const blocks = view.composition.blocks;
  const kind = blocks[0].kind;
  const layout: Plan['layout'] = kind === 'story' ? 'detail' : kind === 'benchmark' || kind === 'collection' ? 'work' : kind === 'comparison' ? 'comparison' : kind === 'timeline' ? 'timeline' : kind === 'contact' ? 'contact' : 'architecture';
  return { ...initialPlan(), layout, title: viewTitle(view), projectIds: [...new Set(blocks.flatMap(block => block.projectIds))], albumIds: [], revision, source: 'local' };
}

export function viewTitle(view: PortableView): string {
  return view.composition.blocks.map(block => block.kind === 'story'
    ? publicProjects.find(project => project.id === block.projectIds[0])?.title ?? 'Project'
    : AI_LAYOUTS.find(layout => layout.id === block.layout)?.name ?? 'Explore the work').join(' · ');
}

// URL fragments keep selected views out of HTTP access logs. Drafts and model metadata are never serialized.
export function encodeView(view: PortableView): string {
  const text = JSON.stringify(readPortableView(view));
  const bytes = new TextEncoder().encode(text);
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (encoded.length > MAX_LINK_LENGTH) throw new Error('This view is too large to share.');
  return encoded;
}

export function decodeView(encoded: string): PortableView {
  if (!encoded || encoded.length > MAX_LINK_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('This shared view is invalid.');
  try {
    const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    return readPortableView(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw, char => char.charCodeAt(0)))));
  } catch { throw new Error('This shared view is invalid or belongs to an older content version.'); }
}

/** A shared answer keeps its title and question in the document head. */
export function exploreShareMetadata(search: string, hash: string): { title: string; description: string } | null {
  const encoded = new URLSearchParams(hash.replace(/^#/, '')).get('view');
  if (!encoded) return null;
  try {
    const title = viewTitle(decodeView(encoded));
    const question = new URLSearchParams(search).get('q')?.trim().slice(0, 160);
    return { title: `${title} · Isaac Seiler`, description: question || title };
  } catch {
    return null;
  }
}

export function viewUrl(view: PortableView, base: string): string {
  const url = new URL('/', base);
  url.hash = `view=${encodeView(view)}`;
  return url.toString();
}

export function portfolioViewCatalog() {
  return {
    contentVersion: CONTENT_VERSION,
    projects: portfolioCatalog,
    connections: portfolioConnections,
    layouts: AI_LAYOUTS.map(({ id, kind, name, description }) => ({ id, kind, name, description })),
    governments: aiIndexStates.map(({ state, region }) => ({ state, region })),
    roles: experienceEntries.map(({ id, organization, role }) => ({ id, organization, role })),
    benchmarkDate: 'August 2025', maxModules: 3,
  };
}

export type ViewHistory<T> = { past: T[]; present: T; future: T[] };
export function changeHistory<T>(history: ViewHistory<T>, next: T, checkpoint = true): ViewHistory<T> {
  if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
  return { past: checkpoint ? [...history.past.slice(-19), history.present] : history.past, present: next, future: checkpoint ? [] : history.future };
}
export function travelHistory<T>(history: ViewHistory<T>, direction: 'back' | 'forward'): ViewHistory<T> {
  if (direction === 'back') {
    if (!history.past.length) return history;
    return { past: history.past.slice(0, -1), present: history.past.at(-1)!, future: [history.present, ...history.future].slice(0, 20) };
  }
  if (!history.future.length) return history;
  return { past: [...history.past.slice(-19), history.present], present: history.future[0], future: history.future.slice(1) };
}
