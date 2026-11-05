export interface ScreenPoint {
  id: string;
  x: number;
  y: number;
  hidden: boolean;
}

export interface MarkerCluster {
  id: string;
  x: number;
  y: number;
  memberIds: string[];
}

export interface MarkerLayout {
  singles: string[];
  clusters: MarkerCluster[];
}

/** Greedy screen-space grouping. Hidden points stay out of both lists. */
export function clusterScreenPoints(points: ScreenPoint[], radius: number): MarkerLayout {
  const open = points.filter(point => !point.hidden);
  const used = new Set<string>();
  const singles: string[] = [];
  const clusters: MarkerCluster[] = [];
  for (const point of open) {
    if (used.has(point.id)) continue;
    const group = open.filter(other => !used.has(other.id) && Math.hypot(other.x - point.x, other.y - point.y) <= radius);
    group.forEach(item => used.add(item.id));
    if (group.length < 2) {
      singles.push(point.id);
      continue;
    }
    clusters.push({
      id: group.map(item => item.id).sort().join('+'),
      x: group.reduce((sum, item) => sum + item.x, 0) / group.length,
      y: group.reduce((sum, item) => sum + item.y, 0) / group.length,
      memberIds: group.map(item => item.id),
    });
  }
  return { singles, clusters };
}

/**
 * Zoom that makes the globe about three quarters of the shorter map edge.
 * Calibrated from the live measurement: zoom 0.84 rendered a globe about 350px across.
 */
export function globeZoomForShortSide(shortSide: number): number {
  const side = Number.isFinite(shortSide) && shortSide > 0 ? shortSide : 800;
  const target = Math.min(side * 0.76, 720);
  const zoom = 0.84 + Math.log2(target / 350);
  return Math.round(Math.min(1.85, Math.max(0.5, zoom)) * 100) / 100;
}

/**
 * True when a projected point sits outside the visible globe.
 * The radius is calibrated to the same 350px-at-zoom-0.84 measurement as the opening zoom.
 * Once the globe is larger than the view, Mapbox's own occlusion is the source of truth.
 */
export function markerOutsideGlobe(x: number, y: number, width: number, height: number, zoom: number, padding = 12): boolean {
  if (width <= 0 || height <= 0) return false;
  const radius = 175 * 2 ** (zoom - 0.84);
  if (radius > Math.min(width, height) * 0.48) return false;
  return Math.hypot(x - width / 2, y - height / 2) > radius + padding;
}

export function normalizePlaceName(location: string): string {
  return location
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bd c\b/g, 'dc')
    .trim();
}

export interface SwipeSample {
  dx: number;
  dy: number;
  elapsedMs: number;
  axis: 'x' | 'y' | null;
  index: number;
  count: number;
}

export type SwipeAction = 'next' | 'previous' | 'close' | null;

/** Horizontal swipe changes the photograph. A downward swipe closes. A short drag does neither. */
export function photoSwipeAction(sample: SwipeSample): SwipeAction {
  const { dx, dy, elapsedMs, axis, index, count } = sample;
  if (!axis) return null;
  const velocity = Math.abs(dx) / Math.max(elapsedMs, 1);
  if (axis === 'x' && (Math.abs(dx) >= 50 || (Math.abs(dx) >= 24 && velocity >= 0.55))) {
    if (dx < 0 && index < count - 1) return 'next';
    if (dx > 0 && index > 0) return 'previous';
    return null;
  }
  if (axis === 'y' && dy >= 96) return 'close';
  return null;
}
