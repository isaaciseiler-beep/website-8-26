export type ExplorationReadingState = { openDisclosures: string[]; scrollOffset: number };

/** Reveal a control in its reading viewport without moving the computer body. */
export function scrollExplorationControlIntoView(control: HTMLElement) {
  const viewport=control.closest<HTMLElement>('[data-exploration-scroll]');
  const bounds=control.getBoundingClientRect();
  const frame=viewport?.getBoundingClientRect();
  const style=getComputedStyle(control);
  const inset=viewport?getComputedStyle(viewport):null;
  const top=(frame?.top??0)+(parseFloat(style.scrollMarginTop)||0)+(parseFloat(inset?.scrollPaddingTop??'0')||0);
  const bottom=(frame?.bottom??window.innerHeight)-(parseFloat(style.scrollMarginBottom)||0)-(parseFloat(inset?.scrollPaddingBottom??'0')||0);
  if(bounds.top>=top&&bounds.bottom<=bottom)return;
  if(viewport)viewport.scrollTo({top:Math.max(0,viewport.scrollTop+(bounds.top<top?bounds.top-top:bounds.bottom-bottom)),behavior:'instant'});
  else control.scrollIntoView({block:'nearest'});
}

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
  const viewport=root.closest<HTMLElement>('[data-exploration-scroll]');
  return {
    openDisclosures: disclosureKeys(root).filter(({ node }) => node.open).map(({ key }) => key),
    scrollOffset: (viewport?.getBoundingClientRect().top??0)-root.getBoundingClientRect().top,
  };
}

export function restoreReadingState(root: HTMLElement, state: ExplorationReadingState, scroll = true) {
  const open = new Set(state.openDisclosures);
  for (const { node, key } of disclosureKeys(root)) node.open = open.has(key);
  // Restore the same place in the answer, rather than scrolling to a prior
  // absolute page coordinate after another response changed the page height.
  if (scroll) {
    const viewport=root.closest<HTMLElement>('[data-exploration-scroll]');
    if(viewport){
      const top=viewport.scrollTop+root.getBoundingClientRect().top-viewport.getBoundingClientRect().top+state.scrollOffset;
      viewport.scrollTo({top:Math.max(0,top),behavior:'instant'});
      return;
    }
    const top = window.scrollY + root.getBoundingClientRect().top + state.scrollOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }
}
