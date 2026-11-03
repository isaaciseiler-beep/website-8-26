export type ExplorationReadingState = { openDisclosures: string[]; scrollOffset: number };

function disclosureKeys(root: HTMLElement) {
  const counts = new Map<string, number>();
  return [...root.querySelectorAll<HTMLDetailsElement>('details')].map(node => {
    const title = node.querySelector('summary')?.textContent?.replace(/[+−]/g, '').trim() ?? '';
    const count = counts.get(title) ?? 0;
    counts.set(title, count + 1);
    return { node, key: `${title}:${count}` };
  });
}

/** Session-only reading position, containing no draft text or visitor identity. */
export function captureReadingState(root: HTMLElement): ExplorationReadingState {
  return {
    openDisclosures: disclosureKeys(root).filter(({ node }) => node.open).map(({ key }) => key),
    scrollOffset: -root.getBoundingClientRect().top,
  };
}

export function restoreReadingState(root: HTMLElement, state: ExplorationReadingState, scroll = true) {
  const open = new Set(state.openDisclosures);
  for (const { node, key } of disclosureKeys(root)) node.open = open.has(key);
  // Restore the same place in the answer, rather than scrolling to a prior
  // absolute page coordinate after another response changed the page height.
  if (scroll) {
    const top = window.scrollY + root.getBoundingClientRect().top + state.scrollOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }
}
