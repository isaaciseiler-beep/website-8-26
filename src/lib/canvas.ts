import { projectItems, hiddenProjectIds, bioLines } from "./siteContent.js";
import { albums, albumPhotos } from "./photoAlbums.js";
import { experienceEntries } from "./experience.js";
import { SITE_URL, SITE_DESCRIPTION, PROFILE_SUMMARY, PROFILE_EXPERTISE, CONTACT_MAILTO, LINKEDIN_URL, GITHUB_URL } from "./site.js";

export const CONTENT_VERSION = "canvas-2026-10-22-v7";
export const publicProjects = projectItems.filter(p => !hiddenProjectIds.has(p.id));
export const publicProfile = { id: "isaac-seiler", name: "Isaac Seiler", headline: "Tech generalist", description: SITE_DESCRIPTION, summary: PROFILE_SUMMARY, expertise: PROFILE_EXPERTISE, bio: bioLines, location: "Seattle", canonicalUrl: `${SITE_URL}/about`, links: { contact: CONTACT_MAILTO, linkedin: LINKEDIN_URL, github: GITHUB_URL }, contentVersion: CONTENT_VERSION };
export const projectSources = (id: string) => publicProjects.find(p => p.id === id)?.sections.flatMap(s => s.links ?? []) ?? [];
export const records = [
  ...publicProjects.map(p => ({ id: p.id, type: "project", title: p.title, summary: p.summary, year: p.year, image: p.image, canonicalUrl: `${SITE_URL}/projects/${p.id}`, body: p.sections.map(s => [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? [])].join("\n\n")).join("\n\n"), sources: projectSources(p.id), contentVersion: CONTENT_VERSION })),
  ...albums.map(a => ({ id: `album-${a.folder}`, type: "album", title: a.location, summary: `${a.photos.length} photographs · ${a.continent}`, year: "", image: albumPhotos(a)[0], canonicalUrl: `${SITE_URL}/?album=${encodeURIComponent(a.folder)}`, body: `${a.location} photography collection. Dates and individual photograph locations are not documented.`, sources: [], contentVersion: CONTENT_VERSION })),
];
export type Layout = "overview" | "work" | "detail" | "comparison" | "photos" | "mixed" | "architecture" | "contact" | "timeline" | "writing" | "empty";
export type Plan = { layout: Layout; title: string; projectIds: string[]; albumIds: string[]; revision: number; contentVersion: string; source: "local" | "jev"; duration?: number; model?: string; confidence?: number };
export const defaultIds = ["artificial-intelligence-in-state-government-index", "fulbright-focus-group-sponsored-by-openai", "openai-product-testing-and-feedback"];
export const initialPlan = (): Plan => ({ layout: "overview", title: "A little context. A different perspective.", projectIds: defaultIds, albumIds: ["Taiwan"], revision: 0, contentVersion: CONTENT_VERSION, source: "local" });
const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const stop = new Set(["the", "a", "and", "of", "in", "to", "i", "you", "your", "me", "show", "what", "with", "is", "for", "this", "these", "about", "only", "more", "tell", "please", "can", "could", "would", "do", "does", "how", "are", "it"]);
export function searchPublic(query: string) {
  const tokens = words(query).filter(t => !stop.has(t));
  return records.map(r => ({ ...r, score: tokens.reduce((n, t) => n + (r.title.toLowerCase().includes(t) ? 6 : 0) + (r.summary.toLowerCase().includes(t) ? 3 : 0) + (r.body.toLowerCase().includes(t) ? 1 : 0), 0) })).filter(r => r.score > 0).sort((a,b) => b.score - a.score);
}
export function localPlan(draft: string, current: Plan, pins: string[], revision: number): Plan {
  const q = draft.toLowerCase().trim();
  const plan = { ...current, revision, source: "local" as const, contentVersion: CONTENT_VERSION, model: undefined, duration: undefined };
  if (!q) return { ...initialPlan(), revision };
  if (/how.*works|architecture|built.*site|source code|engineering/.test(q)) return { ...plan, layout: "architecture", title: "A small system. Many ways in." };
  if (/contact|email|reach|connect/.test(q)) return { ...plan, layout: "contact", title: "Let’s make something useful." };
  if (/compar|side.by.side/.test(q)) return { ...plan, layout: "comparison", title: "Two approaches. One closer look.", projectIds: (pins.length >= 2 ? pins : current.projectIds.length >= 2 ? current.projectIds : defaultIds).slice(0,2) };
  if (/experience|timeline|career|hiring|marketing|who are you|about yourself|what do you do/.test(q)) return { ...plan, layout: "timeline", title: "Across disciplines. Through the years." };
  if (/writing|articles|publications|journalism|research papers/.test(q)) return { ...plan, layout: "writing", title: "Research, reporting & published work.", projectIds: publicProjects.filter(p => p.source === "RESEARCH" || p.source === "REPORTING" || p.source === "BLOG").map(p => p.id) };
  if (/^(tell me more|more about (this|that)|expand (this|that)|details|the first|the second|first one|second one)/.test(q) && current.projectIds.length) {
    const index = /second/.test(q) && current.projectIds.length > 1 ? 1 : 0;
    return { ...plan, layout: "detail", title: "Project", projectIds: [current.projectIds[index]] };
  }
  if (/^more photos$/.test(q) && current.albumIds.length) return { ...plan, layout: "photos" };
  const matches = searchPublic(q);
  let projects = matches.filter(r => r.type === "project").map(r => r.id);
  const matchedAlbums = albums.filter(a => q.includes(a.location.toLowerCase()) || q.includes(a.folder.toLowerCase()));
  const photoRequest = /photo|pictures|images|gallery|travel|landscape|street|night/.test(q);
  if (photoRequest) return { ...plan, layout: "photos", title: matchedAlbums.length ? matchedAlbums[0].location : "Places I’ve paid attention to.", albumIds: (matchedAlbums.length ? matchedAlbums : albums).slice(0,4).map(a => a.folder) };
  if (matchedAlbums.length && !/teach|educat|workshop|work|program/.test(q)) return { ...plan, layout: "mixed", title: `${matchedAlbums[0].location}, in a few different ways.`, projectIds: projects.slice(0,2), albumIds: matchedAlbums.map(a => a.folder) };
  if (/teach|educat|workshop/.test(q)) projects = ["fulbright-focus-group-sponsored-by-openai", ...projects.filter(id => id !== "fulbright-focus-group-sponsored-by-openai")];
  if (/build|work|projects|ai|policy|government|recent/.test(q) && !projects.length) projects = defaultIds;
  if (/recent|latest/.test(q)) projects.sort((a,b) => (publicProjects.find(p => p.id === b)?.year ?? "").localeCompare(publicProjects.find(p => p.id === a)?.year ?? ""));
  if (!projects.length) return { ...plan, layout: "empty", projectIds: [], albumIds: [], title: "A different starting point?" };
  return { ...plan, layout: /teach|educat|workshop/.test(q) ? "detail" : "work", title: /teach|educat|workshop/.test(q) ? "Making AI useful in the classroom." : /ai|policy|government/.test(q) ? "AI, out in the real world." : "Ideas turned into things.", projectIds: projects.slice(0,3) };
}
export type CanvasState = { view: Plan; committed: Plan; history: Plan[]; pins: string[]; filter: string; revision: number };
export const initialState = (): CanvasState => ({ view: initialPlan(), committed: initialPlan(), history: [], pins: [], filter: "All", revision: 0 });
export type CanvasAction = { type: "draft"; revision: number } | { type: "preview"; plan: Plan } | { type: "commit"; plan: Plan } | { type: "pin"; id: string } | { type: "filter"; value: string } | { type: "back" } | { type: "reset" } | { type: "clear" };
export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case "draft": return { ...state, revision: action.revision };
    case "preview": return action.plan.revision === state.revision && action.plan.contentVersion === CONTENT_VERSION ? { ...state, view: action.plan } : state;
    case "commit": return action.plan.revision === state.revision && action.plan.contentVersion === CONTENT_VERSION ? { ...state, view: action.plan, committed: action.plan, history: [...state.history.slice(-19), state.committed] } : state;
    case "pin": return publicProjects.some(p => p.id === action.id) ? { ...state, pins: state.pins.includes(action.id) ? state.pins.filter(id => id !== action.id) : [...state.pins.slice(-1), action.id] } : state;
    case "filter": return { ...state, filter: action.value };
    case "clear": return { ...state, view: state.committed };
    case "back": { const previous = state.history.at(-1) ?? initialPlan(); return { ...state, view: previous, committed: previous, history: state.history.slice(0,-1) }; }
    case "reset": return { ...initialState(), revision: state.revision };
  }
}
export { albums, albumPhotos, experienceEntries };
