import { useId, useLayoutEffect, useRef } from 'react';

type Choice<T extends string> = { value: T; label: string };

/** The selection marker is painted inside the active tab on every layout. */
export function PortfolioFacets<T extends string>({ label, choices, value, onChange }: {
  label: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const id = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const choiceKey = choices.map(choice => choice.value).join('|');
  useLayoutEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const mark = () => {
      const overflow = root.scrollWidth > root.clientWidth + 1;
      root.dataset.overflow = overflow ? 'true' : 'false';
      root.dataset.scrolled = root.scrollLeft > 2 ? 'true' : 'false';
      root.dataset.end = !overflow || root.scrollLeft + root.clientWidth >= root.scrollWidth - 2 ? 'true' : 'false';
    };
    mark();
    root.addEventListener('scroll', mark, { passive: true });
    const observer = new ResizeObserver(mark);
    observer.observe(root);
    return () => { root.removeEventListener('scroll', mark); observer.disconnect(); };
  }, [choiceKey]);
  useLayoutEffect(() => {
    const root = scroller.current;
    const selected = root?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!root || !selected || root.scrollWidth <= root.clientWidth + 1) return;
    const fade = 16;
    const left = selected.offsetLeft;
    const right = left + selected.offsetWidth;
    if (left < root.scrollLeft + fade) root.scrollLeft = Math.max(0, left - fade);
    else if (right > root.scrollLeft + root.clientWidth - fade) root.scrollLeft = right - root.clientWidth + fade;
  }, [value, choiceKey]);
  return <div ref={scroller} className="portfolio-tabs" role="group" aria-label={label} data-choices={choices.length} data-long-label={choices.some(choice => choice.label.length > 10)} onKeyDown={event=>{
      if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
      const index=choices.findIndex(choice=>choice.value===value);
      if(index<0)return;
      event.preventDefault();
      const next=event.key==='ArrowRight'?(index+1)%choices.length:(index-1+choices.length)%choices.length;
      const buttons=event.currentTarget.querySelectorAll('button');
      onChange(choices[next].value);
      buttons[next]?.focus();
    }}>
      {choices.map(choice => <button type="button" key={choice.value} aria-pressed={value === choice.value} onClick={() => onChange(choice.value)}>
        <span className="portfolio-tab-label">{choice.label}</span>
        <span className="portfolio-tab-measure" aria-hidden="true">{choice.label}</span>
        {value === choice.value && <span id={`${id}-mark`} className="portfolio-tab-indicator" aria-hidden="true" />}
      </button>)}
    </div>;
}
