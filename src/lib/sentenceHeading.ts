const PROPER = ['AI', 'OpenAI', 'ChatGPT', 'GPT', 'LLM', 'LLMs', 'Taiwan', 'Fulbright', 'Isaac', 'GitHub', 'LinkedIn', 'Atlas', 'Pulse', 'Seattle', 'Michigan', 'Summation', 'Boehringer', 'U.S.', 'US', 'USA'];
const PHRASES = ['West Michigan', 'State of the Union', '100 Chats'];
const proper = new Map(PROPER.map(word => [word.toLowerCase(), word]));
const headingToken = new RegExp(`(${PHRASES.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})|([A-Za-z][A-Za-z0-9.'’-]*)`, 'gi');

/** Section headings read as sentences. Acronyms and known names keep their casing. */
export function sentenceCaseHeading(input: string) {
  let first = true;
  return input.replace(headingToken, (word, phrase: string | undefined) => {
    if (phrase) {
      first = false;
      return PHRASES.find(item => item.toLowerCase() === phrase.toLowerCase()) ?? phrase;
    }
    const key = word.toLowerCase().replace(/’/g, "'");
    const canonical = proper.get(key);
    if (canonical) { first = false; return canonical; }
    if (word === 'I' || word === 'i') { first = false; return 'I'; }
    if (/^[A-Z]{2,}$/.test(word)) { first = false; return word; }
    if (first) { first = false; return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); }
    return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
  });
}
