import { describe, expect, it } from 'vitest';
import { albums } from '@/lib/photoAlbums';
import { photoMapEntries } from '@/lib/photoMap';
import { clusterScreenPoints, globeZoomForShortSide, markerOutsideGlobe, normalizePlaceName, photoSwipeAction } from '@/lib/photoMapLayout';

describe('photo map layout', () => {
  it('merges the two Washington, D.C. pins into the album', () => {
    const pins = photoMapEntries.filter(entry => normalizePlaceName(entry.location) === 'washington dc');
    expect(pins).toHaveLength(1);
    expect(pins[0].albumFolder).toBe('washington-dc');
    expect(pins[0].images.some(url => url.endsWith('/misc-USA/DC.JPG'))).toBe(true);
    expect(pins[0].images.length).toBeGreaterThan(albums.find(album => album.folder === 'washington-dc')!.photos.length - 1);
  });

  it('clusters overlapping screen points and drops hidden ones', () => {
    const layout = clusterScreenPoints([
      { id: 'a', x: 10, y: 10, hidden: false },
      { id: 'b', x: 20, y: 12, hidden: false },
      { id: 'c', x: 200, y: 10, hidden: false },
      { id: 'd', x: 12, y: 10, hidden: true },
    ], 40);
    expect(layout.clusters).toHaveLength(1);
    expect(layout.clusters[0].memberIds.sort()).toEqual(['a', 'b']);
    expect(layout.singles).toEqual(['c']);
  });

  it('sizes the opening globe from the shorter edge', () => {
    expect(globeZoomForShortSide(800)).toBeGreaterThan(1.4);
    expect(globeZoomForShortSide(375)).toBeGreaterThan(0.5);
    expect(globeZoomForShortSide(375)).toBeLessThan(globeZoomForShortSide(800));
  });

  it('hides markers past the globe edge', () => {
    expect(markerOutsideGlobe(10, 10, 400, 400, 0.84)).toBe(true);
    expect(markerOutsideGlobe(200, 200, 400, 400, 0.84)).toBe(false);
    expect(markerOutsideGlobe(10, 10, 400, 400, 3)).toBe(false);
  });
});

describe('lightbox swipe', () => {
  it('advances, goes back, ignores a short drag, and closes on a downward swipe', () => {
    expect(photoSwipeAction({ dx: -80, dy: 4, elapsedMs: 120, axis: 'x', index: 0, count: 5 })).toBe('next');
    expect(photoSwipeAction({ dx: 80, dy: 0, elapsedMs: 120, axis: 'x', index: 2, count: 5 })).toBe('previous');
    expect(photoSwipeAction({ dx: -40, dy: 0, elapsedMs: 400, axis: 'x', index: 0, count: 5 })).toBeNull();
    expect(photoSwipeAction({ dx: -80, dy: 0, elapsedMs: 80, axis: 'x', index: 4, count: 5 })).toBeNull();
    expect(photoSwipeAction({ dx: 0, dy: 140, elapsedMs: 200, axis: 'y', index: 1, count: 5 })).toBe('close');
  });
});
