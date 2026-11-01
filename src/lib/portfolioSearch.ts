/** Local search over published portfolio text; punctuation and word order are immaterial. */
const normalize = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function matchesPortfolioSearch(query: string, parts: readonly (string | undefined)[]): boolean {
  const terms = [...new Set(normalize(query.slice(0, 120)).split(' ').filter(Boolean))];
  if (!terms.length) return true;
  const text = normalize(parts.filter(Boolean).join(' '));
  return terms.every(term => text.includes(term));
}
