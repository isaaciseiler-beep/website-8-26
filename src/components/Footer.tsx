import { useEffect, useRef } from 'react';

export default function Footer() {
  const footer = useRef<HTMLElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let active = true;
    const fit = () => {
      if (!active || !footer.current || !text.current) return;
      const size = parseFloat(getComputedStyle(text.current).fontSize);
      const width = text.current.getBoundingClientRect().width;
      if (width) text.current.style.fontSize = `${size * footer.current.clientWidth / width}px`;
    };
    const observer = new ResizeObserver(fit);
    if (footer.current) observer.observe(footer.current);
    void document.fonts.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, []);
  return <footer ref={footer} className="site-signature"><span ref={text}>isaac irvin seiler</span></footer>;
}
