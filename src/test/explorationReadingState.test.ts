import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureReadingState, restoreReadingState, scrollExplorationControlIntoView } from '@/lib/explorationReadingState';

afterEach(()=>{document.body.innerHTML='';vi.restoreAllMocks();});
describe('exploration reading positions',()=>{
  it('reveals a keyboard control clipped by the CRT even when it fits inside the page viewport',()=>{
    document.body.innerHTML='<div data-exploration-scroll><button>Process</button></div>';
    const viewport=document.querySelector<HTMLElement>('[data-exploration-scroll]')!;
    const button=document.querySelector('button')!;
    vi.spyOn(viewport,'getBoundingClientRect').mockReturnValue({top:200,bottom:500} as DOMRect);
    vi.spyOn(button,'getBoundingClientRect').mockReturnValue({top:510,bottom:554} as DOMRect);
    viewport.scrollTop=100;
    viewport.style.scrollPaddingTop='12px';
    viewport.style.scrollPaddingBottom='12px';
    const localScroll=vi.spyOn(viewport,'scrollTo');
    const pageScroll=vi.spyOn(window,'scrollTo');
    const nativeScroll=vi.spyOn(button,'scrollIntoView');
    scrollExplorationControlIntoView(button);
    expect(localScroll).toHaveBeenCalledWith({top:166,behavior:'instant'});
    expect(pageScroll).not.toHaveBeenCalled();
    expect(nativeScroll).not.toHaveBeenCalled();
  });
  it('restores disclosures and position inside the CRT without scrolling the page',()=>{
    document.body.innerHTML='<div data-exploration-scroll><div id="answer"><details open><summary>Sources</summary></details></div></div>';
    const viewport=document.querySelector<HTMLElement>('[data-exploration-scroll]')!;
    const answer=document.querySelector<HTMLElement>('#answer')!;
    vi.spyOn(viewport,'getBoundingClientRect').mockReturnValue({top:200} as DOMRect);
    vi.spyOn(answer,'getBoundingClientRect').mockReturnValue({top:140} as DOMRect);
    viewport.scrollTop=100;
    const localScroll=vi.spyOn(viewport,'scrollTo');
    const pageScroll=vi.spyOn(window,'scrollTo');
    const saved=captureReadingState(answer);
    expect(saved.scrollOffset).toBe(60);
    answer.querySelector('details')!.open=false;
    restoreReadingState(answer,saved);
    expect(answer.querySelector('details')!.open).toBe(true);
    expect(localScroll).toHaveBeenCalledWith({top:100,behavior:'instant'});
    expect(pageScroll).not.toHaveBeenCalled();
  });
  it('preserves document scrolling for exploration outside a device',()=>{
    const answer=document.createElement('div');document.body.append(answer);
    vi.spyOn(answer,'getBoundingClientRect').mockReturnValue({top:-80} as DOMRect);
    const pageScroll=vi.spyOn(window,'scrollTo');
    const saved=captureReadingState(answer);
    expect(saved.scrollOffset).toBe(80);
    restoreReadingState(answer,saved);
    expect(pageScroll).toHaveBeenCalledWith({top:window.scrollY,behavior:'instant'});
  });
});
