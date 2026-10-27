import { describe, expect, it } from 'vitest';
import { albums, albumPhotos, coverFor } from '@/lib/photoAlbums';
import { photoMapEntries } from '@/lib/photoMap';
import { records } from '@/lib/canvas';

describe('North American photo collections', () => {
  it('keeps all four BC uploads available and places the album near Whistler', () => {
    const album = albums.find(a => a.folder === 'british-columbia')!;
    expect(album.continent).toBe('North America');
    expect(albumPhotos(album)).toHaveLength(4);
    expect(albumPhotos(album).some(url => url.includes('_201_a.jpeg'))).toBe(true);
    expect(coverFor(album)).not.toContain('_201_a');
    const pin = photoMapEntries.find(p => p.albumFolder === album.folder)!;
    expect(pin.coordinates[0]).toBeCloseTo(-122.96, 1);
    expect(pin.coordinates[1]).toBeCloseTo(50.12, 1);
    expect(pin.images).toEqual(albumPhotos(album));
  });
  it('reflects the current Washington inventory without deleted images', () => {
    const album = albums.find(a => a.folder === 'washington-state')!;
    expect(album.continent).toBe('North America');
    expect(albumPhotos(album)).toHaveLength(11);
    expect(new Set(album.photos).size).toBe(11);
    expect(album.photos.some(file => file.startsWith('750D9F5B'))).toBe(false);
    expect(album.photos.some(file => file.startsWith('F79A8B18'))).toBe(false);
  });
  it('uses the homepage for public album destinations', () => {
    for (const doc of records.filter(doc => doc.type === 'album')) {
      expect(new URL(doc.canonicalUrl).pathname).toBe('/');
      expect(new URL(doc.canonicalUrl).searchParams.has('album')).toBe(true);
    }
  });
});
