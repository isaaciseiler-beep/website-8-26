import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MusicPage from "@/pages/MusicPage";
import { musicAlbums } from "@/lib/musicAlbums";
import { createMusicGlassRenderer, musicGlassCoverSize, musicGlassWidth } from "@/lib/musicGlassRenderer";

vi.mock("@/lib/musicGlassRenderer", async (loadOriginal) => {
  const actual = await loadOriginal<typeof import("@/lib/musicGlassRenderer")>();
  return { ...actual, createMusicGlassRenderer: vi.fn(() => null) };
});

vi.mock("@/components/Sidebar", () => ({ default: ({ open }: { open: boolean }) => open ? <nav aria-label="Site navigation" /> : null }));
vi.mock("@/components/SiteHeader", () => ({ default: ({ onToggle }: { onToggle: () => void }) => <button onClick={onToggle}>Menu</button> }));

const currentAlbumLink = (index: number) => screen.getByRole("link", { name: `Listen to ${musicAlbums[index].album} by ${musicAlbums[index].artist} on Spotify` });

describe("Music's fixed album frame", () => {
  beforeEach(() => {
    vi.mocked(createMusicGlassRenderer).mockReturnValue(null);
    // Navigation also works if a browser cannot provide a drawing context.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  });

  it("starts with the actual first album, honors both endpoints, and keeps Spotify destinations", () => {
    render(<MusicPage />);
    expect(currentAlbumLink(0)).toHaveAttribute("href", musicAlbums[0].spotifyUrl);
    const frame=screen.getByRole("main",{name:"Music albums"});
    expect(frame.querySelectorAll("button")).toHaveLength(0);
    expect(document.querySelector(".music-hourglass-details")!.textContent).toBe(musicAlbums[0].album+musicAlbums[0].artist);
    fireEvent.keyDown(frame,{key:"ArrowUp"});
    expect(currentAlbumLink(0)).toBeInTheDocument();
    fireEvent.keyDown(frame,{key:"ArrowDown"});
    expect(currentAlbumLink(1)).toHaveAttribute("href", musicAlbums[1].spotifyUrl);
    expect(screen.getByRole("heading", { name: musicAlbums[1].album })).toBeInTheDocument();
    expect(screen.getByText(musicAlbums[1].artist)).toBeInTheDocument();
  });

  it("keeps the square inside the short waist and expands into full rounded bulbs", () => {
    const height = 800, cover = 304;
    for (const y of [height / 2 - cover / 2, height / 2, height / 2 + cover / 2]) {
      expect(musicGlassWidth(y, height, cover)).toBe(cover);
    }
    expect(musicGlassWidth(0, height, cover)).toBeGreaterThan(musicGlassWidth(height / 2, height, cover) * 2);
    expect(musicGlassWidth(0, height, cover)).toBe(musicGlassWidth(height, height, cover));
    expect(musicGlassWidth(height * .45, height, cover)).toBe(musicGlassWidth(height * .55, height, cover));
  });

  it("keeps the full silhouette clear of the logo and search at desktop and narrow widths", () => {
    for (const [width, height] of [[1220,800],[928,895],[390,844],[320,700]]) {
      const cover = musicGlassCoverSize(width,height);
      const gutter = width < 600 ? 64 : 80;
      for (let y = 0; y <= height; y+=4) {
        const span = musicGlassWidth(y,height,cover,width);
        expect((width-span)/2).toBeGreaterThanOrEqual(gutter);
        if (Math.abs(y-height/2) <= cover/2) expect(span).toBe(cover);
      }
    }
  });

  it("keeps clean square source covers on the GPU while focus and lighting repaint without restaging the images", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("Image", class {
      src = ""; decoding = "async"; complete = true; naturalWidth = 700; naturalHeight = 700; onload = null;
    });
    const drawImage = vi.fn();
    const context = { drawImage, clearRect: vi.fn(), setTransform: vi.fn() } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue(context);
    vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockReturnValue({width:1220,height:800,left:0,top:0,right:1220,bottom:800,x:0,y:0,toJSON:()=>({})});
    const renderer = { render: vi.fn(), dispose: vi.fn() };
    vi.mocked(createMusicGlassRenderer).mockReturnValue(renderer);
    const page = render(<MusicPage />);
    act(()=>{ frames.shift()!(16); });
    expect(drawImage).toHaveBeenCalledTimes(5);
    for (const call of drawImage.mock.calls) {
      expect(call[3]).toBe(call[4]);
      expect(call[7]).toBe(call[8]);
    }
    const [art, first] = renderer.render.mock.calls[0];
    expect(art.height).toBe(art.width*5);
    expect(first.atlas).toEqual({base:-2,position:0,tileSize:art.width});
    fireEvent.focus(currentAlbumLink(0));
    act(()=>{ frames.shift()!(32); });
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(drawImage).toHaveBeenCalledTimes(5);
    expect(renderer.render.mock.calls[1][1].artRevision).toBe(first.artRevision);
    page.unmount();
    expect(renderer.dispose).toHaveBeenCalledOnce();
  });

  it("draws the focal album once as an exact uncropped square beneath the independent glass skin", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("Image", class {
      src = "";
      decoding = "async";
      complete = true;
      naturalWidth = 500;
      naturalHeight = 500;
      onload = null;
    });
    const drawImage = vi.fn();
    const context = {
      drawImage, clearRect: vi.fn(), setTransform: vi.fn(), save: vi.fn(), restore: vi.fn(),
      beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), stroke: vi.fn(),
      putImageData: vi.fn(), createLinearGradient: () => ({ addColorStop: vi.fn() }),
      createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 1000, height: 800, left: 0, top: 0, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) });
    render(<MusicPage />);
    act(() => { frames.shift()!(16); });
    const focalDraws = drawImage.mock.calls.filter(call => call[7] === 304 && call[8] === 304);
    expect(focalDraws).toHaveLength(1);
    expect(focalDraws[0][0].src).toBe(`/music-artwork/${musicAlbums[0].image.split("/").pop()}`);
    expect(focalDraws[0].slice(1)).toEqual([0, 0, 500, 500, 348, 248, 304, 304]);
    expect(screen.getByRole("link", { name: `Listen to ${musicAlbums[0].album} by ${musicAlbums[0].artist} on Spotify` })).toHaveAttribute("data-rendered", "true");
  });

  it("traps wheel movement in the album frame and leaves browser pinch zoom alone", () => {
    const clock = vi.spyOn(performance, "now").mockReturnValue(1000);
    render(<MusicPage />);
    const frame = screen.getByRole("main", { name: "Music albums" });
    const small = new WheelEvent("wheel", { deltaY: 20, bubbles: true, cancelable: true });
    expect(frame.dispatchEvent(small)).toBe(false);
    expect(currentAlbumLink(0)).toBeInTheDocument();
    fireEvent.wheel(frame, { deltaY: 60 });
    expect(currentAlbumLink(1)).toBeInTheDocument();
    for (let time = 1020; time <= 1500; time += 20) {
      clock.mockReturnValue(time);
      fireEvent.wheel(frame, { deltaY: 30 });
      expect(currentAlbumLink(1)).toBeInTheDocument();
    }
    clock.mockReturnValue(1600);
    fireEvent.wheel(frame, { deltaY: -100 });
    expect(currentAlbumLink(0)).toBeInTheDocument();
    const zoom = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
    Object.defineProperty(zoom, "ctrlKey", { value: true });
    expect(frame.dispatchEvent(zoom)).toBe(true);
    expect(currentAlbumLink(0)).toBeInTheDocument();
    clock.mockReturnValue(2000);
    fireEvent.wheel(frame, {deltaY:3,deltaMode:1});
    expect(currentAlbumLink(1)).toBeInTheDocument();
  });

  it("captures established drags and clears lost gestures without breaking ordinary album clicks", () => {
    render(<MusicPage />);
    const scene = currentAlbumLink(0).parentElement!;
    const capture = vi.fn();
    Object.assign(scene,{setPointerCapture:capture,hasPointerCapture:()=>false});
    const pointer = (type:string,y:number) => {
      const event = new Event(type,{bubbles:true,cancelable:true});
      Object.assign(event,{pointerId:7,pointerType:"mouse",button:0,isPrimary:true,clientY:y,clientX:100});
      fireEvent(scene,event);
    };
    pointer("pointerdown",500);
    pointer("pointermove",496);
    expect(capture).not.toHaveBeenCalled();
    expect(currentAlbumLink(0)).toBeInTheDocument();
    pointer("pointermove",420);
    expect(capture).toHaveBeenCalledWith(7);
    expect(currentAlbumLink(0)).toBeInTheDocument();
    pointer("lostpointercapture",420);
    pointer("pointerup",420);
    expect(currentAlbumLink(0)).toBeInTheDocument();
    pointer("pointerdown",500);
    pointer("pointermove",420);
    pointer("pointerup",420);
    expect(currentAlbumLink(1)).toBeInTheDocument();
    pointer("pointermove",300);
    expect(currentAlbumLink(1)).toBeInTheDocument();
    pointer("pointerdown",300);
    pointer("pointerup",300);
    expect(capture).toHaveBeenCalledTimes(2);
    expect(currentAlbumLink(1)).toHaveAttribute("href",musicAlbums[1].spotifyUrl);
  });

  it("suppresses the pointer click after a drag while allowing subsequent keyboard activation", () => {
    render(<MusicPage />);
    const scene = currentAlbumLink(0).parentElement!;
    Object.assign(scene,{setPointerCapture:vi.fn(),hasPointerCapture:()=>false});
    const pointer = (type:string,y:number) => {
      const event = new Event(type,{bubbles:true,cancelable:true});
      Object.assign(event,{pointerId:7,pointerType:"mouse",button:0,isPrimary:true,clientY:y,clientX:100});
      fireEvent(scene,event);
    };
    pointer("pointerdown",500);
    pointer("pointermove",420);
    pointer("pointerup",420);
    const album = currentAlbumLink(1);
    expect(fireEvent.click(album,{detail:1})).toBe(false);
    expect(fireEvent.click(album,{detail:0})).toBe(true);
  });

  it("keeps native artwork visible throughout context loss, including pending animation frames", () => {
    const frames:FrameRequestCallback[]=[];
    vi.stubGlobal("requestAnimationFrame",(callback:FrameRequestCallback)=>{frames.push(callback);return frames.length;});
    vi.stubGlobal("cancelAnimationFrame",vi.fn());
    vi.stubGlobal("Image",class {src="";decoding="async";complete=true;naturalWidth=700;naturalHeight=700;onload=null;});
    const context={drawImage:vi.fn(),clearRect:vi.fn(),setTransform:vi.fn()} as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue(context);
    vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockReturnValue({width:1220,height:800,left:0,top:0,right:1220,bottom:800,x:0,y:0,toJSON:()=>({})});
    const renderer={render:vi.fn(),dispose:vi.fn()};
    vi.mocked(createMusicGlassRenderer).mockReturnValue(renderer);
    render(<MusicPage/>);
    act(()=>{frames.shift()!(16);});
    fireEvent.keyDown(screen.getByRole("main",{name:"Music albums"}),{key:"ArrowDown"});
    const canvas=document.querySelector(".music-hourglass-canvas")!;
    fireEvent(canvas,new Event("webglcontextlost"));
    expect(currentAlbumLink(1)).toHaveAttribute("data-rendered","false");
    act(()=>{frames.shift()!(32);});
    expect(currentAlbumLink(1)).toHaveAttribute("data-rendered","false");
    expect(renderer.render).toHaveBeenCalledTimes(1);
    fireEvent(canvas,new Event("webglcontextrestored"));
    act(()=>{frames.shift()!(48);});
    expect(currentAlbumLink(1)).toHaveAttribute("data-rendered","true");
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("clips the CPU fallback to the same narrow-layout silhouette and header gutters", () => {
    const frames:FrameRequestCallback[]=[];
    vi.stubGlobal("requestAnimationFrame",(callback:FrameRequestCallback)=>{frames.push(callback);return frames.length;});
    vi.stubGlobal("cancelAnimationFrame",vi.fn());
    vi.stubGlobal("Image",class {src="";decoding="async";complete=true;naturalWidth=700;naturalHeight=700;onload=null;});
    const art={drawImage:vi.fn(),clearRect:vi.fn(),setTransform:vi.fn(),save:vi.fn(),restore:vi.fn(),beginPath:vi.fn(),rect:vi.fn(),clip:vi.fn()} as unknown as CanvasRenderingContext2D;
    let path:[number,number][]=[];
    let paintedClip:[number,number][]|null=null;
    let activeClip:[number,number][]|null=null;
    const output={clearRect:vi.fn(),save:vi.fn(),restore:vi.fn(),beginPath:()=>{path=[];},
      moveTo:(x:number,y:number)=>{path.push([x,y]);},lineTo:(x:number,y:number)=>{path.push([x,y]);},closePath:vi.fn(),
      clip:()=>{activeClip=path.slice();},drawImage:()=>{paintedClip=activeClip;}} as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockImplementation(function(this:HTMLCanvasElement){return this.classList.contains("music-hourglass-canvas")?output:art;});
    vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockReturnValue({width:390,height:844,left:0,top:0,right:390,bottom:844,x:0,y:0,toJSON:()=>({})});
    render(<MusicPage/>);
    act(()=>{frames.shift()!(16);});
    expect(paintedClip).not.toBeNull();
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    for(const [x,y] of paintedClip!) {
      expect(x/ratio).toBeGreaterThanOrEqual(64);
      expect(x/ratio).toBeLessThanOrEqual(326);
      expect(y/ratio).toBeGreaterThanOrEqual(0);
      expect(y/ratio).toBeLessThanOrEqual(844);
    }
  });

  it("supports keyboard browsing and does not move albums while the site menu is open", () => {
    render(<MusicPage />);
    const frame = screen.getByRole("main", { name: "Music albums" });
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    expect(currentAlbumLink(1)).toBeInTheDocument();
    fireEvent.keyDown(frame, { key: "End" });
    expect(currentAlbumLink(musicAlbums.length - 1)).toBeInTheDocument();
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    expect(currentAlbumLink(musicAlbums.length - 1)).toBeInTheDocument();
    fireEvent.keyDown(frame, { key: "Home" });
    expect(currentAlbumLink(0)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    fireEvent.wheel(frame, { deltaY: 200 });
    expect(currentAlbumLink(0)).toBeInTheDocument();
  });

  it("keeps reduced-motion browsing instant and omits elastic previews", () => {
    vi.spyOn(window,"matchMedia").mockImplementation(query=>({
      matches:query.includes("prefers-reduced-motion"),media:query,onchange:null,
      addEventListener:vi.fn(),removeEventListener:vi.fn(),addListener:vi.fn(),removeListener:vi.fn(),dispatchEvent:()=>true,
    }));
    const frames:FrameRequestCallback[]=[];
    vi.stubGlobal("requestAnimationFrame",(callback:FrameRequestCallback)=>{frames.push(callback);return frames.length;});
    vi.stubGlobal("cancelAnimationFrame",vi.fn());
    vi.stubGlobal("Image",class {src="";decoding="async";complete=true;naturalWidth=700;naturalHeight=700;onload=null;});
    const context={drawImage:vi.fn(),clearRect:vi.fn(),setTransform:vi.fn()} as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue(context);
    vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockReturnValue({width:1220,height:800,left:0,top:0,right:1220,bottom:800,x:0,y:0,toJSON:()=>({})});
    const renderer={render:vi.fn(),dispose:vi.fn()};
    vi.mocked(createMusicGlassRenderer).mockReturnValue(renderer);
    render(<MusicPage/>);
    act(()=>{frames.shift()!(16);});
    const frame=screen.getByRole("main",{name:"Music albums"});
    fireEvent.wheel(frame,{deltaY:20});
    act(()=>{frames.shift()!(32);});
    expect(renderer.render.mock.lastCall![1].atlas.position).toBe(0);
    fireEvent.wheel(frame,{deltaY:100});
    act(()=>{frames.shift()!(48);});
    expect(renderer.render.mock.lastCall![1].atlas.position).toBe(1);
    expect(currentAlbumLink(1)).toHaveAttribute("data-moving","false");
    expect(frames).toHaveLength(0);
  });

  it("locks document scrolling only for this page and restores the preceding overflow settings", () => {
    document.body.style.overflow = "clip";
    document.documentElement.style.overflow = "auto";
    const page = render(<MusicPage />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    page.unmount();
    expect(document.body.style.overflow).toBe("clip");
    expect(document.documentElement.style.overflow).toBe("auto");
  });
});
