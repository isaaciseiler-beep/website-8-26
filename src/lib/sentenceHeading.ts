import { SITE_NAME } from './site';
import { experienceEntries } from './experience';
import { albums } from './photoAlbums';
import { projectItems } from './siteContent';

const SMALL = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'de', 'with']);
const ORDINARY = new Set('area council east foundation government governments index institute lab louis mode national new news nonprofit north post saint school south state st survey union university west york'.split(' '));

function rememberPhrase(phrases: Set<string>, value: string | undefined) {
  const clean = value?.replace(/[.,;:]+/g, '').replace(/\s+/g, ' ').trim();
  if (clean && clean.split(' ').length >= 2) phrases.add(clean);
}

const connector = /^(?:of|the|to|for|in|and|&)$/i;
const namedToken = (token: string) => /^(?:\d+|[A-Z][\w.'’]*)$/.test(token);

/** Keep the name itself, not the words that merely follow it in a sentence. */
function expandName(match: string, phrases: Set<string>) {
  const tokens = match.replace(/[.,;:]+/g, '').trim().split(/\s+/).filter(Boolean);
  let run: string[] = [];
  const flush = () => {
    for (let start = 0; start < run.length; start++) {
      for (let end = start + 2; end <= run.length; end++) phrases.add(run.slice(start, end).join(' '));
    }
    run = [];
  };
  for (const token of tokens) {
    if (namedToken(token)) run.push(token);
    else flush();
  }
  flush();
  if (tokens.length >= 2 && namedToken(tokens[0]) && namedToken(tokens[tokens.length - 1]) && tokens.every(token => namedToken(token) || connector.test(token))) {
    phrases.add(tokens.join(' '));
  }
}

/** Names that already appear inside a sentence, so they are not just title case. */
function interiorPhrases(text: string, phrases: Set<string>) {
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const match of sentence.matchAll(/(?<=\s)(?:\d+|[A-Z][\w.'’]*)(?:\s+(?:[A-Z][\w.'’]*|of|the|to|for|in|and|&)){1,5}/g)) {
      expandName(match[0].replace(/^\d{4}\s+/, ''), phrases);
    }
  }
}

function contentNames() {
  const phrases = new Set<string>();
  const words = new Set<string>();
  const addWords = (value: string) => {
    for (const word of value.split(/[^A-Za-z0-9.'’-]+/)) {
      if (/^[A-Z]/.test(word) && word.length > 1 && !SMALL.has(word.toLowerCase()) && !ORDINARY.has(word.toLowerCase())) words.add(word);
    }
  };
  rememberPhrase(phrases, SITE_NAME);
  addWords(SITE_NAME);
  for (const entry of experienceEntries) {
    rememberPhrase(phrases, entry.organization);
    addWords(entry.organization);
    for (const place of entry.location?.split(',') ?? []) {
      rememberPhrase(phrases, place);
      addWords(place);
    }
  }
  for (const album of albums) {
    rememberPhrase(phrases, album.location);
    addWords(album.location);
  }
  for (const project of projectItems) {
    rememberPhrase(phrases, project.title);
    for (const section of project.sections) {
      interiorPhrases([...(section.paragraphs ?? []), ...(section.bullets ?? []), ...(section.links ?? []).map(link => link.label)].join('. '), phrases);
      for (const link of section.links ?? []) {
        const head = link.label.split(':')[0]?.trim() ?? '';
        const name = head.replace(/^The\s+/i, '');
        if (name.split(/\s+/).length >= 2) rememberPhrase(phrases, name);
        else if (name) addWords(name);
      }
    }
    interiorPhrases(project.summary, phrases);
  }
  return {
    phrases: [...phrases].sort((a, b) => b.length - a.length),
    words: new Map([...words].map(word => [word.toLowerCase().replace(/’/g, "'"), word])),
  };
}

const names = contentNames();
const phrasePattern = new RegExp(`(?<![A-Za-z0-9])(${names.phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9])|([A-Za-z][A-Za-z0-9.'’-]*)`, 'gi');

/** Section headings read as sentences. Names are taken from the published site, not a fixed list. */
export function sentenceCaseHeading(input: string) {
  let first = true;
  return input.replace(phrasePattern, (word, phrase: string | undefined) => {
    if (phrase) {
      first = false;
      const canonical = names.phrases.find(item => item.toLowerCase() === phrase.toLowerCase()) ?? phrase;
      const [canonicalFirst, ...rest] = canonical.split(' ');
      const originalFirst = phrase.split(' ')[0] ?? '';
      if (SMALL.has(canonicalFirst.toLowerCase()) && originalFirst[0] === originalFirst[0]?.toLowerCase()) {
        return [originalFirst.toLowerCase(), ...rest].join(' ');
      }
      return canonical;
    }
    const key = word.toLowerCase().replace(/’/g, "'");
    const known = names.words.get(key);
    if (known) { first = false; return known; }
    if (word === 'I' || word === 'i') { first = false; return 'I'; }
    if (/^[A-Z]{2,}$/.test(word) || /[A-Z]/.test(word.slice(1))) { first = false; return word; }
    if (first) { first = false; return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); }
    return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
  });
}

export function protectedHeadingTerms() {
  return { phrases: names.phrases, words: [...names.words.values()] };
}
