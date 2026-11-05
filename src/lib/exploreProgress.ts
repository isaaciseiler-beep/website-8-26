/** Shared Explore timing. CSS variables in `index.css` use these same values. */
export const EXPLORE_EASE = [0.23, 1, 0.32, 1] as const;
export const EXPLORE_MS = {
  open: 200,
  suggestion: 180,
  submit: 180,
  answer: 220,
  stagger: 40,
  clear: 180,
  follow: 200,
} as const;

export type ExplorePhase = 'idle' | 'reading' | 'finding' | 'layout' | 'stopped' | 'error';

export const EXPLORE_PHASE_LABEL: Record<ExplorePhase, string> = {
  idle: '',
  reading: 'Reading the question',
  finding: 'Finding projects',
  layout: 'Laying out the answer',
  stopped: 'Stopped.',
  error: 'The answer didn’t finish.',
};

const PHASE_ORDER = ['reading', 'finding', 'layout'] as const;
export type ExploreStep = (typeof PHASE_ORDER)[number];

/** Done, current, or upcoming for the three real request steps. */
export function phaseMark(current: ExplorePhase, step: ExploreStep): 'done' | 'current' | 'upcoming' {
  const at = PHASE_ORDER.indexOf(current as ExploreStep);
  const index = PHASE_ORDER.indexOf(step);
  if (at < 0 || index > at) return 'upcoming';
  return index === at ? 'current' : 'done';
}

/** Skeleton shape for a known plan layout, so the wait matches the answer that follows. */
export function skeletonKind(layout: string): 'story' | 'rows' | 'split' | 'list' | 'lines' {
  if (layout === 'comparison') return 'split';
  if (layout === 'timeline' || layout === 'contact') return 'list';
  if (layout === 'work') return 'rows';
  if (layout === 'empty' || layout === 'writing') return 'lines';
  return 'story';
}
