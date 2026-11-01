/** Warm code on navigation intent, without mounting a destination or changing history. */
const loaders: Record<string, () => Promise<unknown>> = {
  '/experience/arcade': () => import('@/pages/ExperienceGamePage'),
  '/fulbrightmap': () => import('@/pages/FulbrightMapPage'),
  '/strike-tracker': () => import('@/pages/StrikeTrackerPage'),
  '/404': () => import('@/pages/NotFound'),
  '/work': () => import('@/pages/WorkPage'),
  '/writing': () => import('@/pages/WritingPage'),
  '/photos/map': () => import('@/pages/PhotoMapPage'),
  '/photos/music': () => import('@/pages/MusicPage'),
  '/projects/artificial-intelligence-in-state-government-index': () => import('@/pages/AIStateGovernmentIndexPage'),
  '/projects/senior-thesis-local-journalism': () => import('@/pages/SeniorThesisLocalJournalismPage'),
};
const pending = new Map<string, Promise<unknown>>();
export function warmRoute(path: string) {
  const pathname = path.split(/[?#]/)[0];
  const eager = ['/', '/about', '/classic', '/agents', '/projects/adaptive-portfolio', '/photos', '/photos/locations', '/projects', '/credentials', '/experience', '/latest'].includes(pathname) || pathname.startsWith('/writing/') || pathname.startsWith('/latest/');
  const key = loaders[pathname] ? pathname : eager ? '' : pathname.startsWith('/projects/') ? '/projects/:id' : '/404';
  if (!key) return Promise.resolve();
  if (pending.has(key)) return pending.get(key)!;
  const load = loaders[key] ?? (() => import('@/pages/ProjectDetailPage'));
  const request = load().catch(() => { pending.delete(key); });
  pending.set(key, request);
  return request;
}
