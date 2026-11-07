import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { defaultMacintoshModel, isMacintoshModel, macintoshModels, screenProjection, type MacintoshModel, type MacintoshModelId } from '@/lib/macintoshModels';

const preferenceKey='portfolio-macintosh-model';
function savedModel(): MacintoshModelId {
  try { const saved=window.localStorage.getItem(preferenceKey); return isMacintoshModel(saved)?saved:defaultMacintoshModel; }
  catch { return defaultMacintoshModel; }
}

// Static optics bow the outer CRT by just a few pixels. LCDs stay planar.
const barrelField = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${Array.from({length:25*25},(_,index)=>{
  const x=index%25,y=Math.floor(index/25),dx=(x-12)/12,dy=(y-12)/12,radius=(dx*dx+dy*dy)/2;
  const red=Math.round(128+dx*radius*96),green=Math.round(128+dy*radius*96);
  return `<rect x="${x*4}" y="${y*4}" width="4.1" height="4.1" fill="rgb(${red},${green},128)"/>`;
}).join('')}</svg>`)}`;

export default function MacintoshFrame({ children, model }: { children: ReactNode; model?: MacintoshModelId }) {
  const [chosen,setChosen]=useState(savedModel);
  const [requested,setRequested]=useState<MacintoshModelId|null>(null);
  const [imageError,setImageError]=useState(false);
  const device: MacintoshModel=macintoshModels[model??chosen];
  const frame=useRef<HTMLDivElement>(null);
  const request=useRef(0);
  const [frameWidth,setFrameWidth]=useState(640);
  const uid=useId().replace(/:/g,'');
  const distortionId=`mac-crt-${uid}`,clipId=`mac-silhouette-${uid}`,pickerId=`mac-model-${uid}`;
  useLayoutEffect(()=>{
    const element=frame.current;
    if(!element)return;
    const measure=()=>{ const width=element.getBoundingClientRect().width; if(width>0)setFrameWidth(width); };
    measure();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(element);
    return()=>observer.disconnect();
  },[device.id]);
  useEffect(()=>()=>{request.current++;},[]);

  async function chooseModel(next: MacintoshModelId) {
    const revision=++request.current;
    setRequested(next);setImageError(false);
    // Keep the existing, interactive screen until the replacement photo is ready.
    const photo=new Image();photo.src=macintoshModels[next].chassisImage;
    try {
      await photo.decode();
      if(revision!==request.current)return;
      setChosen(next);setRequested(null);
      try { window.localStorage.setItem(preferenceKey,next); } catch { /* Storage can be disabled. */ }
    } catch {
      if(revision===request.current){setRequested(null);setImageError(true);}
    }
  }
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
    <div className="macintosh-model-picker">
      <label htmlFor={pickerId}>Computer</label>
      <span className="macintosh-select-wrap"><select id={pickerId} value={requested??device.id} onChange={event=>{if(isMacintoshModel(event.target.value))void chooseModel(event.target.value);}} aria-busy={requested!==null}>
        {Object.values(macintoshModels).map(item=><option key={item.id} value={item.id}>{item.name} · {item.year}</option>)}
      </select><ChevronDown size={12} aria-hidden="true"/></span>
      <span role={imageError||requested?'status':undefined} aria-live="polite" className="macintosh-model-status">{imageError?'Photo couldn’t load. Try again.':requested?'Loading…':''}</span>
    </div>
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
        <div className="macintosh-glass" aria-hidden="true"/>
      </div>
    </div>
    {device.credit&&<figcaption className="macintosh-photo-credit">Photo: <a href={device.source} target="_blank" rel="noreferrer">{device.credit}</a> · <a href={device.license} target="_blank" rel="noreferrer">{device.licenseName}</a><span className="sr-only">. Adapted to an isolated computer; display replaced with the interactive portfolio.</span></figcaption>}
  </figure>;
}
