import { useEffect, useLayoutEffect, useRef } from 'react';
import { useMotionPreference } from './useMotionPreference';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';

const evidenceSelector='.portfolio-lead>div,.portfolio-deck,.portfolio-answer,.portfolio-section-text,.portfolio-role-summary,.portfolio-evidence>details,.portfolio-career-detail,.portfolio-comparison-rows,.portfolio-comparison-table td,.portfolio-answer-facet,.portfolio-connection-insight,.portfolio-connection-reader,.portfolio-chronology>li,.portfolio-chronology-note,.canvas-flow-detail,.benchmark-study-context>p,.canvas-scorecards>article,.canvas-comparison-insight,.canvas-criteria';
const controlSelector='button,input,select,textarea,summary,nav,[role="tablist"],[role="group"]';
const useBeforePaint=typeof window==='undefined'?useEffect:useLayoutEffect;
const signature=(region:HTMLElement)=>[
  region.textContent,
  ...[region,...Array.from(region.querySelectorAll('img,video,a'))].map(node=>[
    node.getAttribute('src'),node.getAttribute('poster'),node.getAttribute('alt'),node.getAttribute('href'),
  ].join('|')),
].join('\n');

// Reading wrappers sometimes also contain persistent actions or disclosures.
// Fade their reading children, never the controls the visitor is operating.
function readingChildren(region:HTMLElement):HTMLElement[] {
  if(region.matches(`${controlSelector},img,video,.sr-only`)||region.closest('details:not([open])'))return [];
  if(!region.querySelector(`${controlSelector},img,video`))return [region];
  return Array.from(region.children).flatMap(child=>child instanceof HTMLElement?readingChildren(child):[]);
}
const duration=(style:CSSStyleDeclaration,token:string,fallback:number)=>{
  const value=style.getPropertyValue(token).trim();
  const parsed=parseFloat(value)/(value.endsWith('ms')?1000:1);
  return Number.isFinite(parsed)&&parsed>=0?parsed:fallback;
};

/** The shell owns geometry. Reading arrives in a brief semantic sequence;
 * retained controls stay immediate and changed passages get a short refinement. */
export function useEvidenceTransition(selection:string) {
  const scope=useRef<HTMLDivElement>(null);
  const reduced=useMotionPreference();
  const previous=useRef<Map<HTMLElement,string>|null>(null);
  useBeforePaint(()=>{
    const node=scope.current;
    if(!node)return;
    const candidates=Array.from(node.querySelectorAll<HTMLElement>(evidenceSelector));
    const leaves=candidates.filter(region=>!candidates.some(other=>other!==region&&region.contains(other)));
    const reading=leaves.flatMap(readingChildren);
    const media=Array.from(node.querySelectorAll<HTMLImageElement>('img'))
      .filter(image=>!image.closest('details:not([open])')&&!reading.some(region=>region.contains(image)));
    const regions=[...reading,...media];
    const next=new Map(regions.map(region=>[region,signature(region)]));
    const before=previous.current;
    const restored=before===null&&Boolean(node.closest('[data-reading-restored="true"]'));
    previous.current=next;
    if(reduced||document.hidden)return;
    const style=getComputedStyle(node);
    const fast=duration(style,'--motion-duration',MOTION_DURATION.fast);
    const arrival=duration(style,'--motion-large-duration',MOTION_DURATION.base);
    const curve=style.getPropertyValue('--motion-easing').match(/[\d.]+/g)?.map(Number);
    const ease=`cubic-bezier(${(curve?.length===4?curve:MOTION_EASE_ENTER).join(',')})`;
    const animations=new Set<()=>void>();
    const listeners:(()=>void)[]=[];
    let disposed=false;
    let readingIndex=0;
    const fade=(region:HTMLElement,fresh:boolean,image=false,lead=0)=>{
      if(disposed||document.hidden)return;
      region.style.removeProperty('opacity');
      const fadeDuration=fresh?arrival?Math.min(image?520:420,arrival*1000+(image?160:60)):0:fast*1000;
      const hold=fresh?Math.min(lead*65,image?195:260):0;
      const milliseconds=fadeDuration+hold;
      if(!milliseconds||typeof region.animate!=='function')return;
      // Motion's stop() preserves a sampled MotionValue and can render that
      // opacity again after cleanup. Reading fades need no value ownership:
      // native no-fill effects leave the underlying content visible on cancel.
      // A no-fill delay would flash the final text before the effect starts.
      // Hold its first keyframe instead, within the same short-lived effect.
      const keyframes:Keyframe[]=hold?[{opacity:0,offset:0},{opacity:0,offset:hold/milliseconds},{opacity:1,offset:1}]:[{opacity:fresh?0:.35},{opacity:1}];
      const animation=region.animate(keyframes,{duration:milliseconds,easing:ease,fill:'none'});
      let finished=false;
      const finish=()=>{
        if(finished)return;
        finished=true;
        clearTimeout(deadline);
        animation.onfinish=null;
        animation.oncancel=null;
        animation.cancel();
        region.style.removeProperty('opacity');
        animations.delete(finish);
      };
      // Never leave reading content dependent on a frame loop completing.
      // The wall-clock deadline also releases an interrupted/stalled fade.
      const deadline=setTimeout(finish,milliseconds+100);
      animations.add(finish);
      animation.onfinish=finish;
      animation.oncancel=finish;
    };
    const release=()=>animations.forEach(finish=>finish());
    document.addEventListener('visibilitychange',release);
    for(const region of regions) {
      const changed=before!==null&&before.get(region)!==next.get(region);
      if(region instanceof HTMLImageElement) {
        // Loaded pixels arrive once. Never fade an empty image, hide a failed
        // asset, or let an old selection's load animate a newer selection.
        if(!region.complete) {
          const loaded=()=>{
            if(disposed||restored||!region.naturalWidth)return;
            // Pixels that arrive late have already waited for decoding; they
            // need no additional lead-in and can include a successful fallback.
            fade(region,true,true);
          };
          region.addEventListener('load',loaded,{once:true});
          listeners.push(()=>region.removeEventListener('load',loaded));
        } else if((changed||before===null&&!restored)&&region.naturalWidth)fade(region,true,true,media.indexOf(region));
      } else if(changed||before===null&&!restored) {
        const fresh=before===null||!before.has(region);
        fade(region,fresh,false,fresh?readingIndex++:0);
      }
    }
    return()=>{
      disposed=true;
      listeners.forEach(remove=>remove());
      document.removeEventListener('visibilitychange',release);
      release();
    };
  },[selection,reduced]);
  return scope;
}
