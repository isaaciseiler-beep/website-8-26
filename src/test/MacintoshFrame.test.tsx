import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MacintoshFrame from '@/components/canvas/MacintoshFrame';
import { defaultMacintoshModel, isMacintoshModel, macintoshModels, screenProjection } from '@/lib/macintoshModels';

afterEach(()=>{cleanup();vi.restoreAllMocks();});
beforeEach(()=>{
  const values=new Map<string,string>();
  Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}});
});

describe('photographic Mac screens',()=>{
  it.each(Object.values(macintoshModels))('matches all four photographed screen corners on $name',device=>{
    for(const frameWidth of [320,960]){
      const {width,height,matrix:m}=screenProjection(device,frameWidth);
      const corners=[[0,0],[width,0],[width,height],[0,height]];
      corners.forEach(([x,y],index)=>{
        const divisor=m[3]*x+m[7]*y+m[15];
        const actual=[(m[0]*x+m[4]*y+m[12])/divisor,(m[1]*x+m[5]*y+m[13])/divisor];
        const expected=device.screen[index].map((value,axis)=>(value-(axis===0?device.crop.x:device.crop.y))*frameWidth/device.crop.width);
        expect(actual[0]).toBeCloseTo(expected[0],5);expect(actual[1]).toBeCloseTo(expected[1],5);
      });
      expect(width/height).toBeCloseTo(device.display.width/device.display.height,6);
    }
  });
  it('keeps the actual editor and draft mounted when changing models',async()=>{
    vi.spyOn(Image.prototype,'decode').mockResolvedValue(undefined);
    render(<MacintoshFrame><input aria-label="Draft" defaultValue="Taiwan"/></MacintoshFrame>);
    const editor=screen.getByRole('textbox',{name:'Draft'});
    fireEvent.change(editor,{target:{value:'Compare Congress and Boehringer'}});
    await act(async()=>{fireEvent.change(screen.getByRole('combobox',{name:'Computer'}),{target:{value:'imac-g4'}});});
    expect(screen.getByRole('textbox',{name:'Draft'})).toBe(editor);
    expect(editor).toHaveValue('Compare Congress and Boehringer');
    expect(screen.getByRole('region',{name:'iMac G4 screen'})).toBeInTheDocument();
    expect(window.localStorage.getItem('portfolio-macintosh-model')).toBe('imac-g4');
  });
  it('retains the working computer if a replacement photo cannot load',async()=>{
    vi.spyOn(Image.prototype,'decode').mockRejectedValue(new Error('offline'));
    render(<MacintoshFrame>Explore</MacintoshFrame>);
    await act(async()=>{fireEvent.change(screen.getByRole('combobox',{name:'Computer'}),{target:{value:'macbook-air'}});});
    expect(screen.getByRole('combobox',{name:'Computer'})).toHaveValue(defaultMacintoshModel);
    expect(screen.getByRole('region',{name:'Macintosh 128K screen'})).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Photo couldn’t load');
  });
  it('ignores unknown stored preferences',()=>{
    window.localStorage.setItem('portfolio-macintosh-model','future-mac');
    expect(isMacintoshModel('future-mac')).toBe(false);
    render(<MacintoshFrame>Explore</MacintoshFrame>);
    expect(screen.getByRole('combobox',{name:'Computer'})).toHaveValue(defaultMacintoshModel);
  });
});
