import { useLayoutEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode, type RefObject } from 'react';
import type { ProjectVisualSelection, ProjectVisualSource } from './projectVisual';

type ImageProps=ImgHTMLAttributes<HTMLImageElement>&{ref:RefObject<HTMLImageElement>};
/** Render props keep the actual displayed asset, its link, caption and alt in
 * agreement while the global image preloader continues to own image readiness. */
export function ResolvedProjectImage({visual,children,onDisplayedChange}:{visual:ProjectVisualSelection;children:(image:ImageProps,displayed:ProjectVisualSource)=>ReactNode;onDisplayedChange?:()=>void}) {
  const candidates=[visual,...visual.fallbacks];
  const identity=candidates.map(source=>source.src).join('\n');
  const [failure,setFailure]=useState({identity,index:0,unavailable:false});
  const index=failure.identity===identity?failure.index:0;
  const unavailable=failure.identity===identity&&failure.unavailable;
  const displayed={...candidates[index],...(unavailable?{note:'Image unavailable'}:{})};
  const image=useRef<HTMLImageElement>(null);
  useLayoutEffect(()=>{
    const node=image.current;
    if(!node)return;
    node.dataset.imageState=node.complete&&node.naturalWidth>0?'ready':'loading';
    delete node.dataset.imageReveal;
  },[displayed.src]);
  useLayoutEffect(()=>{onDisplayedChange?.();},[displayed.src,unavailable,onDisplayedChange]);
  return children({ref:image,src:displayed.src,alt:displayed.alt,width:displayed.width,height:displayed.height,decoding:'async',onError:event=>{
    const next=index+1;
    if(next<candidates.length){
      event.currentTarget.dataset.imageState='loading';
      setFailure({identity,index:next,unavailable:false});
    }else setFailure({identity,index,unavailable:true});
  },onLoad:event=>{event.currentTarget.dataset.imageState='ready';}},displayed);
}
