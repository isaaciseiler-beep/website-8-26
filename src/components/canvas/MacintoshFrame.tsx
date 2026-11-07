import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { macintoshSE, screenProjection } from '@/lib/macintoshModels';

// Static optics bow the outer CRT by just a few pixels.
const barrelField = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${Array.from({length:25*25},(_,index)=>{
  const x=index%25,y=Math.floor(index/25),dx=(x-12)/12,dy=(y-12)/12,radius=(dx*dx+dy*dy)/2;
  const red=Math.round(128+dx*radius*96),green=Math.round(128+dy*radius*96);
  return `<rect x="${x*4}" y="${y*4}" width="4.1" height="4.1" fill="rgb(${red},${green},128)"/>`;
}).join('')}</svg>`)}`;

export default function MacintoshFrame({ children }: { children: ReactNode }) {
  const device=macintoshSE;
  const frame=useRef<HTMLDivElement>(null);
  const [frameWidth,setFrameWidth]=useState(640);
  const uid=useId().replace(/:/g,'');
  const distortionId=`mac-crt-${uid}`,clipId=`mac-silhouette-${uid}`;
  useLayoutEffect(()=>{
    const element=frame.current;
    if(!element)return;
    const measure=()=>{ const width=element.getBoundingClientRect().width; if(width>0)setFrameWidth(width); };
    measure();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  const projection=screenProjection(device,frameWidth);
  const screenBottom=Math.max(...device.screen.map(point=>point[1]));
  const screenWidth=(Math.hypot(device.screen[1][0]-device.screen[0][0],device.screen[1][1]-device.screen[0][1])+Math.hypot(device.screen[2][0]-device.screen[3][0],device.screen[2][1]-device.screen[3][1]))/2;
  const geometry={
    '--mac-image-ratio': `${device.crop.width} / ${device.crop.height}`,
    '--mac-screen-radius':device.radius,
    '--mac-frame-max':`${Math.min(1120,620*device.crop.width/screenWidth)}px`,
    '--mac-screen-bottom-ratio':((screenBottom-device.crop.y)/device.crop.width).toFixed(5),
  } as CSSProperties;
  return <figure className="macintosh-device" data-mac-display={device.display.kind}>
    <div ref={frame} className="macintosh-frame" data-mac-model={device.id} style={geometry}>
      <svg width="0" height="0" className="macintosh-optics" aria-hidden="true"><defs><filter id={distortionId} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
        <feImage href={barrelField} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="barrel"/>
        <feGaussianBlur in="barrel" stdDeviation="1.2" result="smooth-barrel"/>
        <feDisplacementMap in="SourceGraphic" in2="smooth-barrel" scale="4" xChannelSelector="R" yChannelSelector="G"/>
      </filter></defs></svg>
      <svg className="macintosh-chassis" viewBox={`${device.crop.x} ${device.crop.y} ${device.crop.width} ${device.crop.height}`} width={device.crop.width} height={device.crop.height} aria-hidden="true" focusable="false">
        {device.silhouette&&<defs><clipPath id={clipId}><path d={device.silhouette}/></clipPath></defs>}
        <image href={device.chassisImage} width={device.image.width} height={device.image.height} clipPath={device.silhouette?`url(#${clipId})`:undefined}/>
      </svg>
      <div className="macintosh-screen" style={{width:projection.width,height:projection.height,transform:projection.transform}}>
        <div className="macintosh-screen-scroll" style={device.display.kind==='crt'?{filter:`url(#${distortionId})`}:undefined} data-exploration-scroll="true" tabIndex={-1} role="region" aria-label={`${device.name} screen`}>
          {children}
        </div>
        <div className="macintosh-glass" aria-hidden="true">
          <svg className="macintosh-glass-photo" viewBox="855 548 1280 952" preserveAspectRatio="none" focusable="false">
            <image href={device.chassisImage} width={device.image.width} height={device.image.height}/>
          </svg>
        </div>
      </div>
    </div>
    <figcaption className="macintosh-photo-credit">Photo: <a href={device.source} target="_blank" rel="noreferrer">{device.credit}</a><span className="sr-only">. Original Macintosh SE photograph, isolated with an SVG crop; display replaced with the interactive portfolio.</span></figcaption>
  </figure>;
}
