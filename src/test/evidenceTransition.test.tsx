import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEvidenceTransition } from '@/hooks/useEvidenceTransition';

const motion={animate:vi.fn(),stop:vi.fn(),complete:[] as Array<()=>void>,cancel:[] as Array<()=>void>};
const originalAnimate=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'animate');
let reduced=false;
const listeners=new Set<()=>void>();
function Harness({selection='first',first='One passage',href='/one',src='/one.jpg',second='Other passage',action=false,firstKey='first',restored=true}:{selection?:string;first?:string;href?:string;src?:string;second?:string;action?:boolean;firstKey?:string;restored?:boolean}) {
  const scope=useEvidenceTransition(selection);
  return <div ref={scope} data-reading-restored={restored?'true':undefined} style={{'--motion-duration':'200ms','--motion-large-duration':'360ms','--motion-easing':'cubic-bezier(.16,1,.3,1)'} as React.CSSProperties}>
    <h2>Stable heading</h2><input aria-label="Stable control" defaultValue="kept"/>
    <div className="portfolio-role-summary"><article key={firstKey} className="portfolio-section-text" data-testid="first"><p>{first}</p><a href={href}>Published source</a><img src={src} alt="Published material"/>{action&&<button>Persistent evidence action</button>}</article></div>
    <article className="portfolio-career-detail" data-testid="second">{second}</article>
  </div>;
}
function MediaHarness({selection='one',src='/one.jpg',restored=false}:{selection?:string;src?:string;restored?:boolean}) {
  const scope=useEvidenceTransition(selection);
  return <div className="home-genui-reveal" data-reading-restored={restored?'true':undefined}><div ref={scope} style={{'--motion-large-duration':'360ms'} as React.CSSProperties}>
    <img className="portfolio-project-image" src={src} alt="Project evidence"/>
    <button>Stable media control</button>
  </div></div>;
}
function SequenceHarness(){
  const scope=useEvidenceTransition('complete answer');
  return <div ref={scope} style={{'--motion-duration':'200ms','--motion-large-duration':'360ms'} as React.CSSProperties}>
    <nav><button>Interactive now</button></nav>
    {Array.from({length:20},(_,index)=><article key={index} className="portfolio-section-text"><p>Reading group {index+1}</p></article>)}
    {Array.from({length:4},(_,index)=><img key={index} src={`/evidence-${index}.jpg`} alt={`Evidence ${index+1}`}/>)}
  </div>;
}
function ConnectionHarness(){
  const scope=useEvidenceTransition('connections');
  return <div ref={scope}><div className="portfolio-connection-reader"><h3>A project</h3><p>A connection in context</p>
    <details className="portfolio-connection-evidence"><summary>Supporting evidence</summary><p>Closed optional passage</p></details>
    <button>Explore this project</button>
  </div></div>;
}
beforeEach(()=>{
  reduced=false;listeners.clear();motion.animate.mockReset();motion.stop.mockReset();motion.complete.length=0;motion.cancel.length=0;
  Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,writable:true,value:function(this:HTMLElement,keyframes:Keyframe[],options:KeyframeAnimationOptions){
    motion.animate(this,keyframes,options);
    let onfinish:(()=>void)|null=null;let oncancel:(()=>void)|null=null;
    const animation={cancel:motion.stop,
      get onfinish(){return onfinish;},set onfinish(value:(()=>void)|null){onfinish=value;if(value)motion.complete.push(value);},
      get oncancel(){return oncancel;},set oncancel(value:(()=>void)|null){oncancel=value;if(value)motion.cancel.push(value);},
    };
    return animation;
  }});
  vi.stubGlobal('matchMedia',()=>({get matches(){return reduced;},addEventListener:(_event:string,listener:()=>void)=>listeners.add(listener),removeEventListener:(_event:string,listener:()=>void)=>listeners.delete(listener)}));
});
afterEach(()=>{cleanup();if(originalAnimate)Object.defineProperty(HTMLElement.prototype,'animate',originalAnimate);else delete HTMLElement.prototype.animate;vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('selective evidence motion',()=>{
  it('leaves restored arrival and unchanged evidence fully readable',()=>{
    const view=render(<Harness/>);
    expect(motion.animate).not.toHaveBeenCalled();
    view.rerender(<Harness selection="same evidence, different controls"/>);
    expect(motion.animate).not.toHaveBeenCalled();
    expect(screen.getByRole('heading')).not.toHaveStyle({opacity:'0.15'});
  });
  it('animates only changed evidence once while preserving heading and control identity',()=>{
    const view=render(<Harness/>);
    const input=screen.getByRole('textbox');const heading=screen.getByRole('heading');
    view.rerender(<Harness selection="next" first="A different passage"/>);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    expect(motion.animate.mock.calls[0][0]).toBe(screen.getByText('A different passage'));
    expect(motion.animate.mock.calls[0][2]).toMatchObject({duration:200,fill:'none'});
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveValue('kept');expect(screen.getByRole('heading')).toBe(heading);
  });
  it('recognizes a changed source with identical visible text',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness selection="changed asset" href="/changed"/>);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    expect(motion.animate.mock.calls[0][0]).toBe(screen.getByRole('link'));
  });
  it('does not animate typing changes when the selected evidence identity is unchanged',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness first="Filtered local results"/>);
    expect(motion.animate).not.toHaveBeenCalled();
  });
  it('interrupts a refinement cleanly and honors a live reduced-motion preference',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="New passage"/>);
    const region=screen.getByText('New passage');region.style.opacity='.7';
    act(()=>{reduced=true;listeners.forEach(listener=>listener());});
    expect(motion.stop).toHaveBeenCalledTimes(1);
    expect(region.style.opacity).toBe('');
    view.rerender(<Harness selection="last" second="Changed under reduced motion"/>);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    view.unmount();expect(listeners.size).toBe(0);
  });
  it('gives newly mounted evidence a fuller arrival without fading its retained controls',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness selection="new evidence subtree" firstKey="new" first="New supporting material"/>);
    expect(motion.animate).toHaveBeenCalledTimes(2);
    expect(motion.animate.mock.calls[0][1]).toEqual([{opacity:0},{opacity:1}]);
    expect(motion.animate.mock.calls[0][2]).toMatchObject({duration:420,fill:'none'});
    expect(motion.animate.mock.calls[0][0]).not.toBe(screen.getByRole('heading'));
  });
  it('fades changed reading text without dimming a persistent action inside its wrapper',()=>{
    const view=render(<Harness action/>);
    const action=screen.getByRole('button',{name:'Persistent evidence action'});
    view.rerender(<Harness action selection="next" first="A revised answer"/>);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    const animated=motion.animate.mock.calls[0][0] as HTMLElement;
    expect(animated.textContent).toBe('A revised answer');
    expect(animated.contains(action)).toBe(false);
    expect(motion.animate.mock.calls[0][1]).toEqual([{opacity:.35},{opacity:1}]);
    expect(screen.getByRole('button',{name:'Persistent evidence action'})).toBe(action);
  });
  it('fades newly loaded image pixels while preserving the image box and media control',()=>{
    render(<MediaHarness/>);
    const image=screen.getByRole('img');
    expect(motion.animate).not.toHaveBeenCalled();
    Object.defineProperty(image,'naturalWidth',{value:640,configurable:true});
    fireEvent.load(image);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    expect(motion.animate.mock.calls[0][0]).toBe(image);
    expect(motion.animate.mock.calls[0][1]).toEqual([{opacity:0},{opacity:1}]);
    expect(motion.animate.mock.calls[0][1].every((frame:Keyframe)=>Object.keys(frame).join()==='opacity')).toBe(true);
    expect(screen.getByRole('button',{name:'Stable media control'})).not.toHaveStyle({opacity:'0'});
  });
  it('fades a ready replacement image once without remounting its adjacent control',()=>{
    const view=render(<MediaHarness/>);
    const image=screen.getByRole('img');const control=screen.getByRole('button');
    Object.defineProperty(image,'complete',{value:true,configurable:true});
    Object.defineProperty(image,'naturalWidth',{value:640,configurable:true});
    view.rerender(<MediaHarness selection="new image" src="/new.jpg"/>);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    expect(motion.animate.mock.calls[0][0]).toBe(image);
    expect(motion.animate.mock.calls[0][1]).toEqual([{opacity:0},{opacity:1}]);
    expect(screen.getByRole('button')).toBe(control);
  });
  it('does not replay a restored image when its pixels finish loading',()=>{
    render(<MediaHarness restored/>);
    const image=screen.getByRole('img');Object.defineProperty(image,'naturalWidth',{value:640,configurable:true});
    fireEvent.load(image);
    expect(motion.animate).not.toHaveBeenCalled();
  });
  it('removes pending image load work when reduced motion activates or the view unmounts',()=>{
    const view=render(<MediaHarness/>);
    const image=screen.getByRole('img');Object.defineProperty(image,'naturalWidth',{value:640,configurable:true});
    act(()=>{reduced=true;listeners.forEach(listener=>listener());});
    fireEvent.load(image);expect(motion.animate).not.toHaveBeenCalled();
    view.unmount();fireEvent.load(image);expect(motion.animate).not.toHaveBeenCalled();
  });
  it('does not conceal failed or incomplete media while waiting for pixels',()=>{
    render(<MediaHarness/>);
    const image=screen.getByRole('img');fireEvent.error(image);
    expect(image.style.opacity).toBe('');
    expect(motion.animate).not.toHaveBeenCalled();
  });
  it('cancels an unfinished refinement on unmount',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" second="Different evidence"/>);
    const region=screen.getByTestId('second');region.style.opacity='.7';
    view.unmount();
    expect(motion.stop).toHaveBeenCalledTimes(1);expect(region.style.opacity).toBe('');
  });
  it('releases sampled opacity when the fade completes and settles only once',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    const region=screen.getByText('Revised evidence');region.style.opacity='.252695';
    act(()=>motion.complete[0]());
    expect(region.style.opacity).toBe('');
    expect(motion.stop).toHaveBeenCalledTimes(1);
    view.unmount();
    act(()=>motion.complete[0]());
    expect(motion.stop).toHaveBeenCalledTimes(1);
  });
  it('restores readable content on a deadline even when Motion never completes',()=>{
    vi.useFakeTimers();
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    const region=screen.getByText('Revised evidence');region.style.opacity='.252695';
    act(()=>vi.advanceTimersByTime(299));
    expect(Number(region.style.opacity)).toBe(.252695);
    act(()=>vi.advanceTimersByTime(1));
    expect(region.style.opacity).toBe('');
    expect(motion.stop).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('releases an interrupted fade on visibility changes without starting another fade',()=>{
    vi.useFakeTimers();
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    const region=screen.getByText('Revised evidence');region.style.opacity='.252695';
    fireEvent(document,new Event('visibilitychange'));
    expect(region.style.opacity).toBe('');
    expect(motion.stop).toHaveBeenCalledTimes(1);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not let late completion of a cancelled selection affect its replacement',()=>{
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    const oldCompletion=motion.complete[0];
    view.rerender(<Harness selection="last" first="Newest evidence"/>);
    const region=screen.getByText('Newest evidence');region.style.opacity='.6';
    act(()=>oldCompletion());
    expect(Number(region.style.opacity)).toBe(.6);
    act(()=>motion.complete[1]());
    expect(region.style.opacity).toBe('');
  });
  it('clears deadlines on unmount and ignores later callbacks on detached evidence',()=>{
    vi.useFakeTimers();
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    const region=screen.getByText('Revised evidence');
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    region.style.opacity='.8';
    act(()=>motion.complete[0]());
    expect(Number(region.style.opacity)).toBe(.8);
  });
  it('leaves no underlying partial opacity and releases externally cancelled effects',()=>{
    vi.useFakeTimers();
    const view=render(<Harness/>);
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    const region=screen.getByText('Revised evidence');
    expect(region.style.opacity).toBe('');
    expect(motion.animate.mock.calls[0][2]).toMatchObject({fill:'none'});
    act(()=>motion.cancel[0]());
    expect(region.style.opacity).toBe('');
    expect(motion.stop).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps evidence immediately visible when native animation is unavailable',()=>{
    const view=render(<Harness/>);
    Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:undefined});
    view.rerender(<Harness selection="next" first="Revised evidence"/>);
    expect(screen.getByTestId('first').style.opacity).toBe('');
    expect(motion.animate).not.toHaveBeenCalled();
  });
  it('gives a complete first answer one bounded semantic sequence without fading its controls',()=>{
    vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(640);
    render(<SequenceHarness/>);
    expect(motion.animate).toHaveBeenCalledTimes(24);
    const calls=motion.animate.mock.calls;
    expect(calls[0][2].duration).toBe(420);
    expect(calls[1][2].duration).toBe(485);
    expect(calls[1][1]).toEqual([{opacity:0,offset:0},{opacity:0,offset:65/485},{opacity:1,offset:1}]);
    expect(calls[19][2].duration).toBe(680);
    expect(calls[20][2].duration).toBe(520);
    expect(calls[23][2].duration).toBe(715);
    for(const [region,keyframes,options] of calls){
      expect(region.contains(screen.getByRole('button'))).toBe(false);
      expect(options).toMatchObject({fill:'none'});
      expect(options.delay).toBeUndefined();
      expect(options.duration).toBeLessThanOrEqual(715);
      expect(keyframes.every((frame:Keyframe)=>Object.keys(frame).every(key=>key==='opacity'||key==='offset'))).toBe(true);
      expect(region.style.opacity).toBe('');
    }
  });
  it('makes the whole first answer immediate under reduced motion',()=>{
    reduced=true;
    render(<SequenceHarness/>);
    expect(motion.animate).not.toHaveBeenCalled();
    expect(screen.getByText('Reading group 20')).toBeVisible();
    expect(screen.getByRole('button')).toBeEnabled();
  });
  it('does not multiply a reading fade with the image inside that reading wrapper',()=>{
    render(<Harness restored={false}/>);
    const image=screen.getByRole('img');
    expect(motion.animate.mock.calls.length).toBeGreaterThan(0);
    expect(motion.animate.mock.calls.every(([region])=>!region.contains(image))).toBe(true);
    Object.defineProperty(image,'naturalWidth',{value:640,configurable:true});
    fireEvent.load(image);
    const imageCall=motion.animate.mock.calls.at(-1)!;
    expect(imageCall[0]).toBe(image);
    expect(imageCall[2]).toMatchObject({duration:520,fill:'none'});
  });
  it('lets a successful fallback image arrive without waiting or replaying the text',()=>{
    const view=render(<MediaHarness/>);
    const image=screen.getByRole('img');
    fireEvent.error(image);
    view.rerender(<MediaHarness src="/fallback.jpg"/>);
    Object.defineProperty(image,'naturalWidth',{value:640,configurable:true});
    fireEvent.load(image);
    expect(motion.animate).toHaveBeenCalledTimes(1);
    expect(motion.animate.mock.calls[0][0]).toBe(image);
    expect(motion.animate.mock.calls[0][2]).toMatchObject({duration:520});
  });
  it('keeps connection context in the arrival while closed disclosures and controls stay untouched',()=>{
    render(<ConnectionHarness/>);
    const targets=motion.animate.mock.calls.map(([region])=>region);
    expect(targets).toContain(screen.getByText('A connection in context'));
    expect(targets).not.toContain(screen.getByText('Closed optional passage'));
    expect(targets.every(region=>!region.contains(screen.getByRole('button'))&&!region.contains(screen.getByText('Supporting evidence')))).toBe(true);
  });
});
