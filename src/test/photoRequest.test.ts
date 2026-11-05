import { describe, expect, it } from 'vitest';
import { albumsForPhotoRequest, isObviousGibberish, photoDestinations, photoRedirectCopy, shouldResolveWithoutModel } from '@/lib/photoRequest';

describe('photo questions redirect to the gallery', () => {
  it('names the matching album and always offers the gallery and Photo Map', () => {
    const destinations = photoDestinations('Show me photos from Japan');
    expect(destinations?.map(item => item.label)).toEqual(['Japan', 'All photographs', 'Photo Map']);
    expect(destinations?.find(item => item.id === 'Japan')?.href).toBe('/?album=Japan');
    expect(photoRedirectCopy(destinations!)).toMatch(/Japan is in the gallery/);
  });

  it.each(['photo', 'photos', 'Show me pictures from Iceland', "Isaac's photography"])('answers %s without treating it as a model question', text => {
    expect(photoDestinations(text)?.some(item => item.kind === 'gallery')).toBe(true);
  });

  it('keeps a work question that only mentions photographs on the portfolio path', () => {
    expect(photoDestinations('Show Taiwan photos and explain Isaac’s teaching work')).toBeNull();
    expect(photoDestinations('How did Isaac research AI in government?')).toBeNull();
  });

  it('does not confuse Washington State with Washington, D.C.', () => {
    expect(albumsForPhotoRequest('photos from Seattle').map(album => album.folder)).toEqual(['washington-state']);
    expect(albumsForPhotoRequest('pictures of Washington, D.C.').map(album => album.folder)).toEqual(['washington-dc']);
  });
});

describe('questions that should not wait on a model', () => {
  it('recognizes keyboard mash and repeated characters', () => {
    expect(isObviousGibberish('asdkjh qwpoe zzxv')).toBe(true);
    expect(isObviousGibberish('zzzz')).toBe(true);
    expect(isObviousGibberish('What was the color of Isaac’s first bicycle?')).toBe(false);
    expect(isObviousGibberish('zxq nonsense')).toBe(false);
  });

  it('short-circuits only empty plans', () => {
    expect(shouldResolveWithoutModel('zzzz', 'empty')).toBe(true);
    expect(shouldResolveWithoutModel('What is the weather in Seattle today?', 'empty')).toBe(true);
    expect(shouldResolveWithoutModel('zzzz', 'detail')).toBe(false);
    expect(shouldResolveWithoutModel('Who is Isaac?', 'timeline')).toBe(false);
  });
});
