import { describe, expect, it } from 'vitest';
import { albums, albumPhotos, coverFor } from '@/lib/photoAlbums';
import { photoMapEntries } from '@/lib/photoMap';
import { records } from '@/lib/canvas';
import { readFileSync } from 'node:fs';

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

describe('owner-reviewed album additions', () => {
  const selection = JSON.parse(readFileSync('docs/audits/photo-album-selection-2026-11-02.json', 'utf8')) as {
    photos: { reviewNumber: number; albumFolder: string; sourceUrl: string }[];
  };

  it('includes all 60 approved photographs exactly once in their assigned albums', () => {
    const allUrls = albums.flatMap(albumPhotos);
    expect(selection.photos).toHaveLength(60);
    expect(new Set(selection.photos.map(photo => photo.reviewNumber)).size).toBe(60);
    expect(allUrls).toHaveLength(245);
    expect(new Set(allUrls).size).toBe(allUrls.length);
    for (const photo of selection.photos) {
      const album = albums.find(item => item.folder === photo.albumFolder)!;
      expect(albumPhotos(album)).toContain(photo.sourceUrl);
      expect(allUrls.filter(url => url === photo.sourceUrl)).toHaveLength(1);
    }
  });

  it('keeps new and expanded albums available on the gallery and Photo Map', () => {
    for (const [folder, count] of [['missouri', 8], ['washington-dc', 4], ['GranCanaria', 12]] as const) {
      const album = albums.find(item => item.folder === folder)!;
      expect(albumPhotos(album)).toHaveLength(count);
      const pin = photoMapEntries.find(item => item.albumFolder === folder);
      expect(pin?.images.slice(0, albumPhotos(album).length)).toEqual(albumPhotos(album));
      if (folder !== 'washington-dc') expect(pin?.images).toEqual(albumPhotos(album));
      expect(records.find(record => record.id === `album-${folder}`)?.canonicalUrl).toContain(`album=${folder}`);
    }
  });

  it('retains photograph 56 in New Zealand and does not prepend an album bucket to archive URLs', () => {
    const mushroom = selection.photos.find(photo => photo.reviewNumber === 56)!;
    expect(mushroom.albumFolder).toBe('NewZealand');
    expect(albumPhotos(albums.find(album => album.folder === 'NewZealand')!)).toContain(mushroom.sourceUrl);
    for (const url of albums.flatMap(albumPhotos)) {
      expect(url.match(/https:\/\//g)).toHaveLength(1);
    }
  });
});
