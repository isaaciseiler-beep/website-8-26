import { albums, type Album } from '@/lib/photoAlbums';
import { isPhotographyRequest } from '@/lib/genui';

export interface PhotoDestination {
  id: string;
  label: string;
  href: string;
  kind: 'album' | 'gallery' | 'map';
}

/** Place names a visitor might use for an album. Longer phrases are matched first. */
const ALBUM_ALIASES: Record<Album['folder'], string[]> = {
  Australia: ['australia'],
  GranCanaria: ['gran canaria', 'canary islands', 'canary'],
  HongKong: ['hong kong'],
  Iceland: ['iceland'],
  Indonesia: ['indonesia', 'bali'],
  Japan: ['japan', 'tokyo', 'kyoto'],
  Korea: ['south korea', 'korea', 'seoul'],
  NewZealand: ['new zealand'],
  Portugal: ['portugal', 'lisbon'],
  Taiwan: ['taiwan', 'taipei'],
  TaiwanStrait: ['taiwan strait', 'matsu'],
  Thailand: ['thailand', 'bangkok'],
  Vietnam: ['vietnam', 'hanoi'],
  'kz-kyrgz': ['kazakhstan', 'kyrgyzstan', 'kyrgyz'],
  mongolia: ['mongolia'],
  'british-columbia': ['british columbia', 'whistler'],
  'washington-state': ['washington state', 'seattle'],
  missouri: ['missouri', 'st. louis', 'st louis'],
  'washington-dc': ['washington, d.c.', 'washington, dc', 'washington d.c.', 'washington dc', 'washington d.c'],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Albums named in a photography question, most specific alias first. */
export function albumsForPhotoRequest(text: string): Album[] {
  const haystack = ` ${text.toLowerCase().replace(/[’']/g, '')} `;
  const matches = albums.flatMap(album => {
    const alias = ALBUM_ALIASES[album.folder]
      .slice()
      .sort((a, b) => b.length - a.length)
      .find(name => new RegExp(`(?:^|[^a-z])${escapeRegExp(name)}(?:[^a-z]|$)`, 'i').test(haystack));
    return alias ? [{ album, weight: alias.length }] : [];
  });
  const seen = new Set<string>();
  return matches
    .sort((a, b) => b.weight - a.weight)
    .filter(match => (seen.has(match.album.folder) ? false : seen.add(match.album.folder)))
    .slice(0, 3)
    .map(match => match.album);
}

/**
 * A visible gallery redirect for a photography question.
 * Returns null when the question is not only about photographs, so work questions still compose.
 * Nothing here is sent to a model.
 */
export function photoDestinations(text: string): PhotoDestination[] | null {
  if (!isPhotographyRequest(text)) return null;
  const matched = albumsForPhotoRequest(text);
  const albumsLinks: PhotoDestination[] = matched.map(album => ({
    id: album.folder,
    label: album.location,
    href: `/?album=${encodeURIComponent(album.folder)}`,
    kind: 'album',
  }));
  return [
    ...albumsLinks,
    { id: 'gallery', label: 'All photographs', href: '/#photo-gallery', kind: 'gallery' },
    { id: 'map', label: 'Photo Map', href: '/photos/map', kind: 'map' },
  ];
}

export function photoRedirectCopy(destinations: PhotoDestination[]): string {
  const places = destinations.filter(item => item.kind === 'album').map(item => item.label);
  if (places.length === 1) return `${places[0]} is in the gallery below, with the rest of the photographs and the Photo Map.`;
  if (places.length > 1) return `${places.join(' and ')} are in the gallery below, with the rest of the photographs and the Photo Map.`;
  return 'Photographs are in the gallery below and on the Photo Map.';
}

/** Keyboard mash and strings with no recognizable word. Real sentences return false. */
export function isObviousGibberish(text: string): boolean {
  const tokens = text.toLowerCase().match(/[a-z]{2,}/g) ?? [];
  if (!tokens.length) return text.trim().length > 0;
  const recognizable = (token: string) => {
    if (/^(.)\1+$/.test(token)) return false;
    if (/q(?!u)/.test(token)) return false;
    const vowels = token.match(/[aeiou]/g)?.length ?? 0;
    if (vowels === 0) return false;
    if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(token)) return false;
    if (token.length >= 5 && vowels / token.length < 0.25) return false;
    return true;
  };
  return tokens.every(token => !recognizable(token));
}

const OFF_TOPIC = /\b(?:weather|forecast|temperature|recipe|stock price|lottery|scoreboard)\b/i;

/** Empty local plans that will not gain a portfolio answer from another model round-trip. */
export function shouldResolveWithoutModel(text: string, layout: string): boolean {
  if (layout !== 'empty') return false;
  return isObviousGibberish(text) || OFF_TOPIC.test(text);
}
